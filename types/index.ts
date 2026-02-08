import shaka from 'shaka-player/dist/shaka-player.ui';

export type CreateVideoPlayerEventDetail = {
  url: string;
}

/**
 * Focus card navigation parameters
 */
export interface FocusCardParams {
  indexToAdd: number;
  indexToRemove: number;
}

/**
 * Movie object from external storage or mocks
 */
export interface Movie {
  name: string;
  isFile?: boolean;
  toURI?: () => string;
  listFiles?: (
    successCallback: (files: Movie[]) => void,
    errorCallback: (error: Error) => void
  ) => void;
}

/**
 * Overlay button IDs
 */
export type OverlayButtonId =
  | 'overlay__action-button--pause'
  | 'overlay__action-button--play'
  | 'overlay__action-button--speed';

/**
 * Player state enum shared between AVPlayer and VideoPlayer
 */
export type PlayerState = 'IDLE' | 'NONE' | 'PLAYING' | 'PAUSED' | 'READY';

/**
 * Seek level configuration for progressive seeking
 */
export interface SeekLevel {
  holdTime: number;
  jump: number;
}

// MODULES

/**
 * AV player module interface
 */
export interface AVPlayerModule {
  changeSpeed: () => void;
  create: () => void;
  currentSeekDirection: 'forward' | 'backward' | null;
  currentSpeed: number;
  currentTime: number;
  fastForward: () => void;
  getCurrentJumpAmount: () => number;
  getState: () => PlayerState;
  hasDispatchedAlmostFinished: boolean;
  initialize: (params: CreateVideoPlayerEventDetail) => void;
  onLoadedMetadata: () => void;
  onTimeUpdate: () => void;
  pause: () => void;
  performSeek: (direction: 'forward' | 'backward') => void;
  play: () => void;
  playPause: () => void;
  rewind: () => void;
  seekStartTime: number | null;
  seekInterval: ReturnType<typeof setInterval> | null;
  startSeek: (direction: 'forward' | 'backward') => void;
  stop: () => void;
  stopFastForward: () => void;
  stopRewind: () => void;
  stopSeek: () => void;
  videoDuration: number;
}


/**
 * External storage module interface
 */
export interface ExternalStorageModule {
  externalStorageElements: Movie[] | null;
  getElementsFromExternalStorage: () => void;
}

/**
 * Focus manager module interface
 */
export interface FocusManagerModule {
  create: () => void;
  focusBar: () => void;
  focusButtons: () => void;
  focusButton: (params: FocusCardParams) => void;
  focusCard: (params: FocusCardParams) => void;
  focusCardElement: (element: HTMLElement, updateLastFocusedCard?: boolean) => void;
  focusFloatingButtons: () => void;
  focusNextButton: () => void;
  focusNextCard: () => void;
  focusNextLineCard: () => void;
  focusPreviousButton: () => void;
  focusPreviousCard: () => void;
  focusPreviousLineCard: () => void;
  lastFocusedButtonId: OverlayButtonId;
  lastFocusedCardIndex: number;
  scrollToElement: (element: HTMLElement) => void;
}

/**
 * Listeners module interface
 */
export interface ListenersModule {
  create: () => void;
  createPlayerEventName: string;
  currentPlayingIndex: number;
  hideAppElement: () => void;
  isOverlayActionButtonsFocused: boolean;
  isOverlayBarFocused: boolean;
  isOverlayFloatingButtonsFocused: boolean;
  isPlayerActive: boolean;
  playContentWithIndex: (index: number) => void;
  playNextContent: () => void;
  playPreviousContent: () => void;
  showAppElement: () => void;
}

/**
 * Overlay module interface
 */
export interface OverlayModule {
  create: () => void;
  hideTimeout: ReturnType<typeof setTimeout> | null;
  lastFocusedButtonId: OverlayButtonId;
  handlePlayerCreation: () => void;
  handleSpeedUpdated: (event: CustomEvent<number>) => void;
  hide: () => void;
  initButtons: () => void;
  resetTimeout: () => void;
  show: (shouldFocus?: boolean) => void;
  showPreviousButton: () => void;
  showNextButton: () => void;
}

/**
 * Shaka player module interface
 */
export interface ShakaPlayerModule {
  changeSpeed: (event: CustomEvent<number>) => void;
  currentSeekDirection: 'forward' | 'backward' | null;
  create: () => void;
  currentSpeed: number;
  fastForward: () => void;
  getCurrentJumpAmount: () => number;
  getState: () => PlayerState;
  hasDispatchedAlmostFinished: boolean;
  initialize: (params: CreateVideoPlayerEventDetail) => Promise<void>;
  onLoadedMetadata: () => void;
  onPlayerEnded: (event: Event) => void;
  onPlayerError: (event: Event) => void;
  onTimeUpdate: () => void;
  pause: () => void;
  performSeek: (direction: 'forward' | 'backward') => void;
  play: () => void;
  playPause: () => void;
  player: shaka.Player | null;
  rewind: () => void;
  seekInterval: ReturnType<typeof setInterval> | null;
  seekStartTime: number | null;
  startSeek: (direction: 'forward' | 'backward') => void;
  stop: () => void;
  stopFastForward: () => void;
  stopRewind: () => void;
  stopSeek: () => void;
  videoElement: HTMLVideoElement | null;
}

/**
 * Video player module interface
 */
export interface VideoPlayerModule {
  changeSpeed: (event: CustomEvent<number>) => void;
  currentSeekDirection: 'forward' | 'backward' | null;
  create: () => void;
  currentSpeed: number;
  fastForward: () => void;
  getCurrentJumpAmount: () => number;
  getState: () => PlayerState;
  hasDispatchedAlmostFinished: boolean;
  initialize: (params: CreateVideoPlayerEventDetail) => void;
  onLoadedMetadata: () => void;
  onPlayerEnded: (event: Event) => void;
  onPlayerError: (event: Event) => void;
  onTimeUpdate: () => void;
  pause: () => void;
  performSeek: (direction: 'forward' | 'backward') => void;
  play: () => void;
  playPause: () => void;
  rewind: () => void;
  seekInterval: ReturnType<typeof setInterval> | null;
  seekStartTime: number | null;
  startSeek: (direction: 'forward' | 'backward') => void;
  stop: () => void;
  stopFastForward: () => void;
  stopRewind: () => void;
  stopSeek: () => void;
  videoElement: HTMLVideoElement | null;
}
