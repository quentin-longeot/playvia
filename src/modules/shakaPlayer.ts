import {
  CREATE_SHAKA_PLAYER,
  PLAYER_CHANGE_SPEED,
  PLAYER_FAST_FORWARD,
  PLAYER_KILL,
  PLAYER_PLAY_PAUSE,
  PLAYER_REWIND,
  PLAYER_STOP_FAST_FORWARD,
  PLAYER_STOP_REWIND,
  PLAYER_STOPPED,
} from '@/events';
import { formatTime } from '@/helpers';
import type {
  CreateVideoPlayerEventDetail,
  PlayerState,
  SeekLevel,
  ShakaPlayerModule,
} from '@types';
import shaka from 'shaka-player/dist/shaka-player.ui';

// CONSTANTS

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
 * jump: amount of seconds to jump at this level
 */
const SEEK_LEVELS: SeekLevel[] = [
  { holdTime: 0, jump: 10 },
  { holdTime: 3000, jump: 60 },
  { holdTime: 6000, jump: 180 },
  { holdTime: 9000, jump: 350 },
  { holdTime: 12000, jump: 600 },
];
const VIDEO_CLASS_NAME = 'video-player';

export const shakaPlayer: ShakaPlayerModule = {
  // VARIABLES

  currentSeekDirection: null,
  currentSpeed: 1,
  player: null,
  seekInterval: null,
  seekStartTime: null,
  videoElement: null,

  // METHODS

  /**
   * Set up event listener for creating the Shaka player
   */
  create: (): void => {
    window.addEventListener(
      CREATE_SHAKA_PLAYER,
      ((event: CustomEvent<CreateVideoPlayerEventDetail>) => {
        shakaPlayer.videoElement = document.getElementById(
          VIDEO_CLASS_NAME
        ) as HTMLVideoElement | null;

        if (!shakaPlayer.videoElement) {
          console.error('🕵️‍♂️ Shaka Player element not found');
          return;
        }

        shakaPlayer.videoElement.style.display = 'inline';

        shakaPlayer.initialize({ url: event.detail.url });
      }) as EventListener
    );
  },

  /**
   * Creates a new Shaka Player instance
   * Adds necessary event listeners
   */
  initialize: async (params: CreateVideoPlayerEventDetail): Promise<void> => {
    const { videoElement } = shakaPlayer;

    if (!videoElement) return;

    // Check if browser supports Shaka Player
    if (!shaka.Player.isBrowserSupported()) {
      console.error('❌ Browser does not support Shaka Player');
      return;
    }

    // Install built-in polyfills
    shaka.polyfill.installAll();

    // Create Shaka Player instance
    shakaPlayer.player = new shaka.Player();
    await shakaPlayer.player.attach(videoElement);

    
    // Configure Shaka Player
    shakaPlayer.player.configure({
      streaming: {
        bufferingGoal: 30,
        rebufferingGoal: 15,
      },
    });

    // Set up Shaka error handler
    shakaPlayer.player.addEventListener('error', (event: Event) => {
      shakaPlayer.onPlayerError(event);
    });

    // JS EVENTS LISTENERS
    videoElement.addEventListener('ended', shakaPlayer.onPlayerEnded);
    videoElement.addEventListener('loadedmetadata', shakaPlayer.onLoadedMetadata);
    videoElement.addEventListener('timeupdate', shakaPlayer.onTimeUpdate);

    // CUSTOM EVENTS LISTENERS
    window.addEventListener(PLAYER_CHANGE_SPEED, shakaPlayer.changeSpeed as EventListener);
    window.addEventListener(PLAYER_FAST_FORWARD, shakaPlayer.fastForward);
    window.addEventListener(PLAYER_KILL, shakaPlayer.stop);
    window.addEventListener(PLAYER_PLAY_PAUSE, shakaPlayer.playPause);
    window.addEventListener(PLAYER_REWIND, shakaPlayer.rewind);
    window.addEventListener(PLAYER_STOP_FAST_FORWARD, shakaPlayer.stopFastForward);
    window.addEventListener(PLAYER_STOP_REWIND, shakaPlayer.stopRewind);

    // Load the manifest
    try {
      await shakaPlayer.player.load(params.url);
      console.info('📺 ✅ Shaka Player: Manifest loaded successfully');
    } catch (error) {
      console.error('📺 ❌ Shaka Player: Error loading manifest:', error);
    }
  },

  /**
   * Get current player state based on video element properties
   */
  getState: (): PlayerState => {
    const { videoElement } = shakaPlayer;

    if (!videoElement || !videoElement.src) {
      return PLAYER_STATES.IDLE;
    }

    if (videoElement.readyState < 3) {
      return PLAYER_STATES.READY;
    }

    if (videoElement.paused) {
      return PLAYER_STATES.PAUSED;
    }

    return PLAYER_STATES.PLAYING;
  },

  /**
   * Try to play a content
   */
  play: (): void => {
    const { videoElement } = shakaPlayer;

    if (!videoElement) {
      console.warn('❌ Video element not initialized');
      return;
    }

    videoElement
      .play()
      .then(() => {
        console.info('▶️ Shaka Player: Playing');
      })
      .catch((error) => {
        console.error('▶️ ❌ Shaka Player: Play failed:', error);
      });
  },

  /**
   * Try to pause a content
   */
  pause: (): void => {
    const { videoElement } = shakaPlayer;

    if (!videoElement) {
      console.warn('❌ Video element not initialized');
      return;
    }

    if (!videoElement.paused) {
      videoElement.pause();
      console.info('⏸️ Shaka Player: Paused');
    } else {
      console.warn('⏸️ ❌ Video is already paused');
    }
  },

  /**
   * Play or pause the content depending on the current player state
   */
  playPause: (): void => {
    const { videoElement } = shakaPlayer;

    if (!videoElement) {
      console.warn('❌ Video element not initialized');
      return;
    }

    if (videoElement.paused) {
      shakaPlayer.play();
    } else {
      shakaPlayer.pause();
    }
  },

  /**
   * Change playback speed
   * Cycles through AVAILABLE_SPEEDS array
   * Audio is preserved at all speeds
   */
  changeSpeed: (): void => {
    const { videoElement } = shakaPlayer;

    if (!videoElement) {
      console.warn('❌ Video element not initialized');
      return;
    }

    const playerState = shakaPlayer.getState();

    if (playerState !== PLAYER_STATES.PLAYING && playerState !== PLAYER_STATES.PAUSED) {
      console.warn('⏱️ ❌ Speed change not allowed in current state:', playerState);
      return;
    }

    const currentIndex = AVAILABLE_SPEEDS.indexOf(shakaPlayer.currentSpeed);
    const nextIndex = (currentIndex + 1) % AVAILABLE_SPEEDS.length;
    const newSpeed = AVAILABLE_SPEEDS[nextIndex];

    videoElement.playbackRate = newSpeed;
    shakaPlayer.currentSpeed = newSpeed;
    console.info('⏱️ Playback speed changed to:', newSpeed + 'x');
  },

  /**
   * Stop the current seek operation
   */
  stopSeek: (): void => {
    if (shakaPlayer.seekInterval) {
      clearInterval(shakaPlayer.seekInterval);
      shakaPlayer.seekInterval = null;
    }

    shakaPlayer.seekStartTime = null;
    shakaPlayer.currentSeekDirection = null;
  },

  /**
   * Stop fast forward (called on keyup)
   */
  stopFastForward: (): void => {
    if (shakaPlayer.currentSeekDirection === 'forward') {
      shakaPlayer.stopSeek();
    }
  },

  /**
   * Stop rewind (called on keyup)
   */
  stopRewind: (): void => {
    if (shakaPlayer.currentSeekDirection === 'backward') {
      shakaPlayer.stopSeek();
    }
  },

  /**
   * Start fast forward (called on keydown)
   */
  fastForward: (): void => {
    shakaPlayer.startSeek('forward');
  },

  /**
   * Start rewind (called on keydown)
   */
  rewind: (): void => {
    shakaPlayer.startSeek('backward');
  },

  /**
   * Try to stop a content
   */
  stop: (): void => {
    const { videoElement, player } = shakaPlayer;

    if (!videoElement) {
      console.warn('❌ Video element not initialized');
      return;
    }

    videoElement.pause();
    videoElement.currentTime = 0;
    shakaPlayer.currentSpeed = 1;

    // Destroy Shaka Player instance
    if (player) {
      player
        .destroy()
        .then(() => {
          console.info('📺 ✅ Shaka Player destroyed');
          shakaPlayer.player = null;
        })
        .catch((error) => {
          console.error('📺 ❌ Error destroying Shaka Player:', error);
        });
    }

    // JS EVENTS LISTENERS REMOVAL
    videoElement.removeEventListener('ended', shakaPlayer.onPlayerEnded);
    videoElement.removeEventListener('loadedmetadata', shakaPlayer.onLoadedMetadata);
    videoElement.removeEventListener('timeupdate', shakaPlayer.onTimeUpdate);

    // CUSTOM EVENTS REMOVAL
    window.removeEventListener(PLAYER_CHANGE_SPEED, shakaPlayer.changeSpeed as EventListener);
    window.removeEventListener(PLAYER_FAST_FORWARD, shakaPlayer.fastForward);
    window.removeEventListener(PLAYER_KILL, shakaPlayer.stop);
    window.removeEventListener(PLAYER_PLAY_PAUSE, shakaPlayer.playPause);
    window.removeEventListener(PLAYER_REWIND, shakaPlayer.rewind);
    window.removeEventListener(PLAYER_STOP_FAST_FORWARD, shakaPlayer.stopFastForward);
    window.removeEventListener(PLAYER_STOP_REWIND, shakaPlayer.stopRewind);

    shakaPlayer.stopSeek();
    const videoPlayerElement = document.getElementById(VIDEO_CLASS_NAME);

    if (videoPlayerElement) {
      videoPlayerElement.style.display = 'none';
    }

    const customEvent = new CustomEvent(PLAYER_STOPPED);
    window.dispatchEvent(customEvent);
  },

  /**
   * Get the current jump amount based on how long the key has been held
   */
  getCurrentJumpAmount: (): number => {
    const { seekStartTime } = shakaPlayer;
    if (!seekStartTime) {
      return SEEK_LEVELS[0].jump;
    }

    const holdDuration = Date.now() - seekStartTime;
    for (let seekIndex = SEEK_LEVELS.length - 1; seekIndex >= 0; seekIndex--) {
      if (holdDuration >= SEEK_LEVELS[seekIndex].holdTime) {
        return SEEK_LEVELS[seekIndex].jump;
      }
    }

    return SEEK_LEVELS[0].jump;
  },

  /**
   * Start progressive seek in the given direction
   */
  startSeek: (direction: 'forward' | 'backward'): void => {
    if (shakaPlayer.currentSeekDirection === direction) {
      return;
    }

    shakaPlayer.stopSeek();
    shakaPlayer.currentSeekDirection = direction;
    shakaPlayer.seekStartTime = Date.now();

    shakaPlayer.performSeek(direction);

    shakaPlayer.seekInterval = setInterval(() => {
      shakaPlayer.performSeek(direction);
    }, 500);
  },

  /**
   * Perform a single seek operation in the given direction
   */
  performSeek: (direction: 'forward' | 'backward'): void => {
    if (!shakaPlayer.videoElement) {
      console.warn('❌ Video element not initialized');
      return;
    }

    const jumpAmount = shakaPlayer.getCurrentJumpAmount();

    if (direction === 'forward') {
      let newTime = shakaPlayer.videoElement.currentTime + jumpAmount;

      if (newTime > shakaPlayer.videoElement.duration) {
        newTime = shakaPlayer.videoElement.duration;
      }

      shakaPlayer.videoElement.currentTime = newTime;
      console.info('⏩ Fast forward: +' + jumpAmount + 's');
    } else {
      let newTime = shakaPlayer.videoElement.currentTime - jumpAmount;

      if (newTime < 0) {
        newTime = 0;
      }

      shakaPlayer.videoElement.currentTime = newTime;
      console.info('⏪ Rewind: -' + jumpAmount + 's');
    }
  },

  /**
   * Handle video ended event
   */
  onPlayerEnded: (): void => {
    console.info('✅ Stream complete');
    shakaPlayer.stop();
  },

  /**
   * Handle video error event
   */
  onPlayerError: (event: Event): void => {
    if (event) {
      console.error('❌ Shaka Player error:', event);
    }
  },

  /**
   * Handle loaded metadata event to set duration
   */
  onLoadedMetadata: (): void => {
    const currentTimeElement = document.getElementById('overlay-time-current');
    const durationElement = document.getElementById('overlay-time-duration');
    const progressBar = document.getElementById('overlay-bar') as HTMLProgressElement | null;

    if (durationElement && shakaPlayer.videoElement) {
      durationElement.textContent = formatTime(shakaPlayer.videoElement.duration);
    }
    if (currentTimeElement) {
      currentTimeElement.textContent = formatTime(0);
    }
    if (progressBar) {
      progressBar.value = 0;
    }
  },

  /**
   * Handle time update event from video element
   */
  onTimeUpdate: (): void => {
    const currentTimeElement = document.getElementById('overlay-time-current');
    const progressBar = document.getElementById('overlay-bar') as HTMLProgressElement | null;
    const progressBarIndicator = document.getElementById('overlay-bar-time');

    if (currentTimeElement && shakaPlayer.videoElement) {
      currentTimeElement.textContent = formatTime(shakaPlayer.videoElement.currentTime);
    }

    if (progressBar && shakaPlayer?.videoElement?.duration) {
      const percentage =
        (shakaPlayer.videoElement.currentTime / shakaPlayer.videoElement.duration) * 100;
      progressBar.value = percentage;

      if (progressBarIndicator && progressBar.offsetWidth) {
        const barWidth = progressBar.offsetWidth;
        const leftPosition = 80 + (percentage / 100) * barWidth;

        progressBarIndicator.style.left = leftPosition + 'px';
      }
    }
  },
};
