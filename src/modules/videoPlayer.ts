import {
  CREATE_VIDEO_PLAYER,
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
  VideoPlayerModule,
} from '@types';

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

export const videoPlayer: VideoPlayerModule = {
  // VARIABLES

  currentSeekDirection: null,
  currentSpeed: 1,
  seekInterval: null,
  seekStartTime: null,
  videoElement: null,

  // METHODS

  /**
   * Set up event listener for creating the video player
   */
  create: (): void => {
    window.addEventListener(CREATE_VIDEO_PLAYER,
      ((event: CustomEvent<CreateVideoPlayerEventDetail>) => {
        videoPlayer.videoElement =
          document.getElementById(VIDEO_CLASS_NAME) as HTMLVideoElement | null;

        if (!videoPlayer.videoElement) {
          console.error('🕵️‍♂️ VideoPlayer element not found');
          return;
        }

        videoPlayer.videoElement.style.display = 'inline';

        videoPlayer.initialize({ url: event.detail.url });
        videoPlayer.play();
      }) as EventListener
    );
  },

  /**
   * Creates a new player instance
   * Adds necessary event listeners
   */
  initialize: (params: CreateVideoPlayerEventDetail): void => {
    const { videoElement } = videoPlayer;

    if (!videoElement) return;

    videoElement.src = params.url;

    // JS EVENTS LISTENERS
    videoElement.addEventListener('ended', videoPlayer.onPlayerEnded);
    videoElement.addEventListener('error', videoPlayer.onPlayerError);
    videoElement.addEventListener('loadedmetadata', videoPlayer.onLoadedMetadata);
    videoElement.addEventListener('timeupdate', videoPlayer.onTimeUpdate);

    // CUSTOM EVENTS LISTENERS
    window.addEventListener(
      PLAYER_CHANGE_SPEED,
      videoPlayer.changeSpeed as EventListener
    );
    window.addEventListener(PLAYER_FAST_FORWARD, videoPlayer.fastForward);
    window.addEventListener(PLAYER_KILL, videoPlayer.stop);
    window.addEventListener(PLAYER_PLAY_PAUSE, videoPlayer.playPause);
    window.addEventListener(PLAYER_REWIND, videoPlayer.rewind);
    window.addEventListener(PLAYER_STOP_FAST_FORWARD, videoPlayer.stopFastForward);
    window.addEventListener(PLAYER_STOP_REWIND, videoPlayer.stopRewind);
  },

  /**
   * Get current player state based on video element properties
   */
  getState: (): PlayerState => {
    const { videoElement } = videoPlayer;

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
    const { videoElement } = videoPlayer;

    if (!videoElement) {
      console.warn('❌ Video element not initialized');
      return;
    }

    videoElement.play();
  },

  /**
   * Try to pause a content
   */
  pause: (): void => {
    const { videoElement } = videoPlayer;

    if (!videoElement) {
      console.warn('❌ Video element not initialized');
      return;
    }

    if (!videoElement.paused) {
      videoElement.pause();
    } else {
      console.warn('⏸️ ❌ Video is already paused');
    }
  },

  /**
   * Play or pause the content depending on the current player state
   */
  playPause: (): void => {
    const { videoElement } = videoPlayer;

    if (!videoElement) {
      console.warn('❌ Video element not initialized');
      return;
    }

    if (videoElement.paused) {
      videoPlayer.play();
    } else {
      videoPlayer.pause();
    }
  },

  /**
   * Change playback speed
   * Cycles through AVAILABLE_SPEEDS array
   * Audio is preserved at all speeds
   */
  changeSpeed: (): void => {
    const { videoElement } = videoPlayer;

    if (!videoElement) {
      console.warn('❌ Video element not initialized');
      return;
    }

    const playerState = videoPlayer.getState();

    if (playerState !== PLAYER_STATES.PLAYING && playerState !== PLAYER_STATES.PAUSED) {
      console.warn('⏱️ ❌ Speed change not allowed in current state:', playerState);
      return;
    }

    const currentIndex = AVAILABLE_SPEEDS.indexOf(videoPlayer.currentSpeed);
    const nextIndex = (currentIndex + 1) % AVAILABLE_SPEEDS.length;
    const newSpeed = AVAILABLE_SPEEDS[nextIndex];

    videoElement.playbackRate = newSpeed;
    videoPlayer.currentSpeed = newSpeed;
    console.info('⏱️ Playback speed changed to:', newSpeed + 'x');
  },

  /**
   * Stop the current seek operation
   */
  stopSeek: (): void => {
    if (videoPlayer.seekInterval) {
      clearInterval(videoPlayer.seekInterval);
      videoPlayer.seekInterval = null;
    }

    videoPlayer.seekStartTime = null;
    videoPlayer.currentSeekDirection = null;
  },

  /**
   * Stop fast forward (called on keyup)
   */
  stopFastForward: (): void => {
    if (videoPlayer.currentSeekDirection === 'forward') {
      videoPlayer.stopSeek();
    }
  },

  /**
   * Stop rewind (called on keyup)
   */
  stopRewind: (): void => {
    if (videoPlayer.currentSeekDirection === 'backward') {
      videoPlayer.stopSeek();
    }
  },

  /**
   * Start fast forward (called on keydown)
   */
  fastForward: (): void => {
    videoPlayer.startSeek('forward');
  },

  /**
   * Start rewind (called on keydown)
   */
  rewind: (): void => {
    videoPlayer.startSeek('backward');
  },

  /**
   * Try to stop a content
   */
  stop: (): void => {
    const { videoElement } = videoPlayer;

    if (!videoElement) {
      console.warn('❌ Video element not initialized');
      return;
    }

    videoElement.pause();
    videoElement.currentTime = 0;
    videoElement.src = '';
    videoPlayer.currentSpeed = 1;

    // JS EVENTS LISTENERS REMOVAL
    videoElement.removeEventListener('ended', videoPlayer.onPlayerEnded);
    videoElement.removeEventListener('error', videoPlayer.onPlayerError);
    videoElement.removeEventListener('loadedmetadata', videoPlayer.onLoadedMetadata);
    videoElement.removeEventListener('timeupdate', videoPlayer.onTimeUpdate);

    // CUSTOM EVENTS REMOVAL
    window.removeEventListener(PLAYER_CHANGE_SPEED, videoPlayer.changeSpeed as EventListener);
    window.removeEventListener(PLAYER_FAST_FORWARD, videoPlayer.fastForward);
    window.removeEventListener(PLAYER_KILL, videoPlayer.stop);
    window.removeEventListener(PLAYER_PLAY_PAUSE, videoPlayer.playPause);
    window.removeEventListener(PLAYER_REWIND, videoPlayer.rewind);
    window.removeEventListener(PLAYER_STOP_FAST_FORWARD, videoPlayer.stopFastForward);
    window.removeEventListener(PLAYER_STOP_REWIND, videoPlayer.stopRewind);

    videoPlayer.stopSeek();
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
    const { seekStartTime } = videoPlayer;
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
    if (videoPlayer.currentSeekDirection === direction) {
      return;
    }

    videoPlayer.stopSeek();
    videoPlayer.currentSeekDirection = direction;
    videoPlayer.seekStartTime = Date.now();

    videoPlayer.performSeek(direction);

    videoPlayer.seekInterval = setInterval(() => {
      videoPlayer.performSeek(direction);
    }, 500);
  },

  /**
   * Perform a single seek operation in the given direction
   */
  performSeek: (direction: 'forward' | 'backward'): void => {
    if (!videoPlayer.videoElement) {
      console.warn('❌ Video element not initialized');
      return;
    }

    const jumpAmount = videoPlayer.getCurrentJumpAmount();

    if (direction === 'forward') {
      let newTime = videoPlayer.videoElement.currentTime + jumpAmount;

      if (newTime > videoPlayer.videoElement.duration) {
        newTime = videoPlayer.videoElement.duration;
      }

      videoPlayer.videoElement.currentTime = newTime;
      console.info('⏩ Fast forward: +' + jumpAmount + 's');
    } else {
      let newTime = videoPlayer.videoElement.currentTime - jumpAmount;

      if (newTime < 0) {
        newTime = 0;
      }

      videoPlayer.videoElement.currentTime = newTime;
      console.info('⏪ Rewind: -' + jumpAmount + 's');
    }
  },

  /**
   * Handle video ended event
   */
  onPlayerEnded: (): void => {
    console.info('✅ Stream complete');
    videoPlayer.stop();
  },

  /**
   * Handle video error event
   */
  onPlayerError: (event: Event): void => {
    const error = event as ErrorEvent;
    if (error && error.message) {
      console.error('❌ Video error:', error.message);
    }
  },

  /**
   * Handle loaded metadata event to set duration
   */
  onLoadedMetadata: (): void => {
    const currentTimeElement = document.getElementById('overlay-time-current');
    const durationElement = document.getElementById('overlay-time-duration');
    const progressBar = document.getElementById('overlay-bar') as HTMLProgressElement | null;

    if (durationElement && videoPlayer.videoElement) {
      durationElement.textContent = formatTime(videoPlayer.videoElement.duration);
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

    if (currentTimeElement && videoPlayer.videoElement) {
      currentTimeElement.textContent = formatTime(videoPlayer.videoElement.currentTime);
    }

    if (progressBar && videoPlayer?.videoElement?.duration) {
      const percentage =
        (videoPlayer.videoElement.currentTime / videoPlayer.videoElement.duration) * 100;
      progressBar.value = percentage;

      if (progressBarIndicator && progressBar.offsetWidth) {
        const barWidth = progressBar.offsetWidth;
        const leftPosition = 80 + (percentage / 100) * barWidth;

        progressBarIndicator.style.left = leftPosition + 'px';
      }
    }
  },
};
