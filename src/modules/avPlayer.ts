import {
  CREATE_AV_PLAYER,
  PLAYER_CHANGE_SPEED,
  PLAYER_FAST_FORWARD,
  PLAYER_KILL,
  PLAYER_PLAY_PAUSE,
  PLAYER_REWIND,
  PLAYER_STOP_FAST_FORWARD,
  PLAYER_STOP_REWIND,
  PLAYER_STOPPED,
  SPEED_UPDATED,
} from '@/events';
import { formatTime, manageFloatingButtonsVisibility } from '@/helpers';
import type {
  AVPlayerModule,
  CreateVideoPlayerEventDetail,
  PlayerState,
  SeekLevel
} from '@types';

// CONSTANTS

const AV_VIDEO_CLASS_NAME = 'av-player';
const AVAILABLE_SPEEDS = [1, 1.25, 1.5, 1.75, 2];
const PLAYER_STATES: Record<PlayerState, PlayerState> = {
  IDLE: 'IDLE',
  NONE: 'NONE',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  READY: 'READY',
};
/**
 * Progressive seek configuration
 * holdTime: time (in ms) the key has been held to reach this level
 * jump: amount of milliseconds to jump at this level
 */
const SEEK_LEVELS: SeekLevel[] = [
  { holdTime: 0, jump: 10000 },
  { holdTime: 3000, jump: 60000 },
  { holdTime: 6000, jump: 180000 },
  { holdTime: 9000, jump: 350000 },
  { holdTime: 12000, jump: 600000 },
];

export const avPlayer: AVPlayerModule = {
  // VARIABLES

  currentSeekDirection: null,
  currentSpeed: 1,
  currentTime: 0,
  hasDispatchedAlmostFinished: false,
  seekInterval: null,
  seekStartTime: null,
  videoDuration: 0,

  // METHODS

  /**
   * Set up event listener for creating the AV Player
   */
  create: () => {
    window.addEventListener(CREATE_AV_PLAYER, ((
      event: CustomEvent<CreateVideoPlayerEventDetail>
    ) => {
      const avPlayerElement = document.getElementById(AV_VIDEO_CLASS_NAME);

      if (!avPlayerElement) {
        console.error('🕵️‍♂️ AVPlayer element not found');
        return;
      }

      avPlayerElement.style.display = 'inline';

      avPlayer.initialize({ url: event.detail.url });
      avPlayer.play();
    }) as EventListener);
  },

  /**
   * Initialize a new player instance
   */
  initialize: (avParams: CreateVideoPlayerEventDetail): void => {
    /**
     * Try to initialize fullscreen mode
     */
    function initializeFullscreenMode(): void {
      try {
        webapis.avplay.setDisplayRect(0, 0, 1920, 1080);
        webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_FULL_SCREEN');
      } catch (error) {
        console.warn('⚠️ Fullscreen initialization failed:', error);
      }
    }

    try {
      webapis.avplay.open(avParams.url);

      webapis.avplay.setListener({
        onbufferingstart: () => {
          console.info('⏳ Buffering started', webapis.avplay.getDuration());
        },
        onstreamcompleted: () => {
          console.info('✅ Stream complete');
          avPlayer.stop();
        },
        oncurrentplaytime: (time: number) => {
          avPlayer.currentTime = time;
          avPlayer.onTimeUpdate();
        },
        onerror: (eventType: string) => {
          console.error('❌ Event type error:', eventType);
        },
      });

      webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_AUTO_ASPECT_RATIO');

      if (
        webapis &&
        webapis.productinfo &&
        typeof webapis.productinfo.isUhdPanelSupported === 'function' &&
        webapis.productinfo.isUhdPanelSupported()
      ) {
        console.info('📺 4K panel detected, enabling 4K mode');
        try {
          webapis.avplay.setStreamingProperty('SET_MODE_4K', 'true');
        } catch (error) {
          console.warn('📺 ⚠️ 4K mode not supported or failed:', error);
        }
      }

      initializeFullscreenMode();
    } catch (error) {
      console.error('❌ AVPlayer error:', error);
    }

    // CUSTOM EVENTS LISTENERS

    window.addEventListener(PLAYER_CHANGE_SPEED, avPlayer.changeSpeed);
    window.addEventListener(PLAYER_FAST_FORWARD, avPlayer.fastForward);
    window.addEventListener(PLAYER_KILL, avPlayer.stop);
    window.addEventListener(PLAYER_PLAY_PAUSE, avPlayer.playPause);
    window.addEventListener(PLAYER_REWIND, avPlayer.rewind);
    window.addEventListener(PLAYER_STOP_FAST_FORWARD, avPlayer.stopFastForward);
    window.addEventListener(PLAYER_STOP_REWIND, avPlayer.stopRewind);
  },

  /**
   * Get current player state based on webapis.avplay
   */
  getState: (): PlayerState => {
    return webapis.avplay.getState() as PlayerState;
  },

  /**
   * Try to play a content depending on the current player state
   */
  play(): void {
    try {
      switch (this.getState()) {
        case PLAYER_STATES.IDLE:
        case PLAYER_STATES.NONE:
          webapis.avplay.prepareAsync(
            () => {
              avPlayer.videoDuration = webapis.avplay.getDuration() || 0;
              avPlayer.onLoadedMetadata();
              avPlayer.play();
            },
            (error) =>
              console.error('❌ AVPlayer prepareAsync error:', error)
          );
          break;
        case PLAYER_STATES.READY:
        case PLAYER_STATES.PAUSED:
          webapis.avplay.play();
          break;
        default:
          console.warn('⚠️ Unhandled state');
          break;
      }
    } catch (error) {
      console.error('❌ AVPlayer play error:', error);
    }
  },

  /**
   * Try to pause a content depending on the current player state
   */
  pause: (): void => {
    const playerState = avPlayer.getState();

    if (playerState === PLAYER_STATES.PLAYING || playerState === PLAYER_STATES.READY) {
      webapis.avplay.pause();
    } else {
      console.warn('⏸️ ❌ Pause not allowed in current state:', playerState);
    }
  },

  /**
   * Play or pause the content depending on the current player state
   */
  playPause: (): void => {
    if (avPlayer.getState() === PLAYER_STATES.PLAYING) {
      avPlayer.pause();
    } else {
      avPlayer.play();
    }
  },

  /**
   * Change playback speed
   * Cycles through AVAILABLE_SPEEDS array
   */
  changeSpeed: (): void => {
    const playerState = avPlayer.getState();
    if (playerState !== PLAYER_STATES.PLAYING && playerState !== PLAYER_STATES.PAUSED) {
      console.warn('⏱️ ❌ Speed change not allowed in current state:', playerState);
      return;
    }

    const currentIndex = AVAILABLE_SPEEDS.indexOf(avPlayer.currentSpeed);
    const nextIndex = (currentIndex + 1) % AVAILABLE_SPEEDS.length;
    const newSpeed = AVAILABLE_SPEEDS[nextIndex];

    try {
      webapis.avplay.setSpeed(newSpeed);
      avPlayer.currentSpeed = newSpeed;

      window.dispatchEvent(new CustomEvent(SPEED_UPDATED, { detail: { newSpeed } }));
      console.info('⏱️ Playback speed changed to:', newSpeed + 'x');
    } catch (error) {
      console.error('⏱️ ❌ Failed to change speed:', error);
    }
  },

  /**
   * Stop the current seek operation
   */
  stopSeek: (): void => {
    if (avPlayer.seekInterval) {
      clearInterval(avPlayer.seekInterval);
      avPlayer.seekInterval = null;
    }
    avPlayer.seekStartTime = null;
    avPlayer.currentSeekDirection = null;
  },

  /**
   * Stop fast forward (called on keyup)
   */
  stopFastForward: (): void => {
    if (avPlayer.currentSeekDirection === 'forward') {
      avPlayer.stopSeek();
    }
  },

  /**
   * Stop rewind (called on keyup)
   */
  stopRewind: (): void => {
    if (avPlayer.currentSeekDirection === 'backward') {
      avPlayer.stopSeek();
    }
  },

  /**
   * Start fast forward (called on keydown)
   */
  fastForward: (): void => {
    avPlayer.startSeek('forward');
  },

  /**
   * Start rewind (called on keydown)
   */
  rewind: (): void => {
    avPlayer.startSeek('backward');
  },

  /**
   * Try to stop a content depending on the current player state
   */
  stop: (): void => {
    const playerState = avPlayer.getState();
    avPlayer.currentSpeed = 1;
    avPlayer.hasDispatchedAlmostFinished = false;

    if (playerState === PLAYER_STATES.PLAYING || playerState === PLAYER_STATES.PAUSED) {
      webapis.avplay.stop();
      avPlayer.currentTime = 0;
    } else {
      console.warn('⏹️ ❌ Stop not allowed in current state:', playerState);
    }

    window.removeEventListener(PLAYER_CHANGE_SPEED, avPlayer.changeSpeed);
    window.removeEventListener(PLAYER_FAST_FORWARD, avPlayer.fastForward);
    window.removeEventListener(PLAYER_KILL, avPlayer.stop);
    window.removeEventListener(PLAYER_PLAY_PAUSE, avPlayer.playPause);
    window.removeEventListener(PLAYER_REWIND, avPlayer.rewind);
    window.removeEventListener(PLAYER_STOP_FAST_FORWARD, avPlayer.stopFastForward);
    window.removeEventListener(PLAYER_STOP_REWIND, avPlayer.stopRewind);

    avPlayer.stopSeek();
    const avPlayerElement = document.getElementById(AV_VIDEO_CLASS_NAME);

    if (avPlayerElement) {
      avPlayerElement.style.display = 'none';
    }

    const customEvent = new CustomEvent(PLAYER_STOPPED);
    window.dispatchEvent(customEvent);
  },

  /**
   * Get the current jump amount based on how long the key has been held
   */
  getCurrentJumpAmount: (): number => {
    if (!avPlayer.seekStartTime) {
      return SEEK_LEVELS[0].jump;
    }

    const holdDuration = Date.now() - avPlayer.seekStartTime;
    for (let i = SEEK_LEVELS.length - 1; i >= 0; i--) {
      if (holdDuration >= SEEK_LEVELS[i].holdTime) {
        return SEEK_LEVELS[i].jump;
      }
    }

    return SEEK_LEVELS[0].jump;
  },

  /**
   * Start progressive seek in the given direction
   */
  startSeek: (direction: 'forward' | 'backward'): void => {
    if (avPlayer.currentSeekDirection === direction) {
      return;
    }

    avPlayer.stopSeek();
    avPlayer.currentSeekDirection = direction;
    avPlayer.seekStartTime = Date.now();

    avPlayer.performSeek(direction);

    avPlayer.seekInterval = setInterval(() => {
      avPlayer.performSeek(direction);
    }, 500);
  },

  /**
   * Perform a single seek operation in the given direction
   */
  performSeek: (direction: 'forward' | 'backward'): void => {
    const jumpAmount = avPlayer.getCurrentJumpAmount();

    if (direction === 'forward') {
      let newTime = avPlayer.currentTime + jumpAmount;
      if (newTime > avPlayer.videoDuration) {
        newTime = avPlayer.videoDuration;
      }

      try {
        webapis.avplay.jumpForward(jumpAmount);
        avPlayer.currentTime = newTime;
        console.info('⏩ Fast forward: +' + jumpAmount / 1000 + 's');
      } catch (error) {
        console.error('⏩ ❌ Failed fast forwarding:', error);
      }
    } else {
      let newTime = avPlayer.currentTime - jumpAmount;

      if (newTime < 0) {
        newTime = 0;
      }

      try {
        webapis.avplay.jumpBackward(jumpAmount);
        avPlayer.currentTime = newTime;
        console.info('⏪ Rewind: -' + jumpAmount / 1000 + 's');
      } catch (error) {
        console.error('⏪ ❌ Failed rewinding:', error);
      }
    }
  },

  /**
   * Handle loaded metadata to set duration
   */
  onLoadedMetadata: (): void => {
    const durationElement = document.getElementById('overlay__time--duration');
    const currentTimeElement = document.getElementById('overlay__time--current');
    const progressBar = document.getElementById('overlay__bar') as HTMLProgressElement | null;

    if (durationElement) {
      const durationInSeconds = avPlayer.videoDuration / 1000;
      durationElement.textContent = formatTime(durationInSeconds);
    }

    if (currentTimeElement) {
      currentTimeElement.textContent = formatTime(0);
    }

    if (progressBar) {
      progressBar.value = 0;
    }
  },

  /**
   * Handle time update event
   */
  onTimeUpdate: (): void => {
    const currentTimeElement = document.getElementById('overlay__time--current');
    const progressBar = document.getElementById('overlay__bar') as HTMLProgressElement | null;
    const progressBarIndicator = document.getElementById('overlay__bar--time');

    if (currentTimeElement) {
      const currentTimeInSeconds = avPlayer.currentTime / 1000;
      currentTimeElement.textContent = formatTime(currentTimeInSeconds);
    }

    if (progressBar && avPlayer.videoDuration) {
      const percentage = (avPlayer.currentTime / avPlayer.videoDuration) * 100;
      progressBar.value = percentage;
      avPlayer.hasDispatchedAlmostFinished =
        manageFloatingButtonsVisibility(percentage, avPlayer.hasDispatchedAlmostFinished);

      // Calculate position: 80px offset + percentage of available width
      // Available width = container width - 160px (2x 80px for time elements)
      if (progressBarIndicator && progressBar.offsetWidth) {
        const barWidth = progressBar.offsetWidth;
        const leftPosition = 80 + (percentage / 100) * barWidth;
        progressBarIndicator.style.left = leftPosition + 'px';
      }
    }
  },
};
