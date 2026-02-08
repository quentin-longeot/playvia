// PLAYER CREATION EVENTS

export const CREATE_AV_PLAYER = 'createAVPlayer';
export const CREATE_SHAKA_PLAYER = 'createShakaPlayer';
export const CREATE_VIDEO_PLAYER = 'createVideoPlayer';

// PLAYER ACTIONS EVENTS

export const PLAYER_CHANGE_SPEED = 'playerChangeSpeed';
export const PLAYER_FAST_FORWARD = 'playerFastForward';
export const PLAYER_KILL = 'playerKill';
export const PLAYER_NEXT = 'playerNext';
export const PLAYER_PLAY_PAUSE = 'playerPlayPause';
export const PLAYER_PREVIOUS = 'playerPrevious';
export const PLAYER_REWIND = 'playerRewind';
export const PLAYER_STOP_FAST_FORWARD = 'playerStopFastForward';
export const PLAYER_STOP_REWIND = 'playerStopRewind';
export const PLAYER_STOPPED = 'playerStopped';

// FOCUS EVENTS

export const FOCUS_BAR = 'focusBar';
export const FOCUS_BUTTON = 'focusButton';
export const FOCUS_CARD_ELEMENT = 'focusCardElement';
export const FOCUS_FLOATING_BUTTONS = 'focusFloatingButtons';
export const FOCUS_NEXT_BUTTON = 'focusNextButton';
export const FOCUS_NEXT_CARD = 'focusNextCard';
export const FOCUS_NEXT_LINE_CARD = 'focusNextLineCard';
export const FOCUS_PREVIOUS_BUTTON = 'focusPreviousButton';
export const FOCUS_PREVIOUS_CARD = 'focusPreviousCard';
export const FOCUS_PREVIOUS_LINE_CARD = 'focusPreviousLineCard';
export const FLOATING_BUTTONS_FOCUSED = 'floatingButtonsFocused';

// OVERLAY EVENTS

export const OVERLAY_FLOATING_BUTTON_HIDDEN = 'overlayFloatingButtonHidden';
export const SHOW_NEXT_BUTTON = 'showNextButton';
export const SHOW_OVERLAY = 'showOverlay';
export const SHOW_PREVIOUS_BUTTON = 'showPreviousButton';
export const SPEED_UPDATED = 'speedUpdated';
export const TOGGLE_BUTTON = 'playerToggleButton';
export const TOGGLE_FLOATING_BUTTON = 'toggleFloatingButton';

// OTHER EVENTS

export const EXTERNAL_STORAGE_CHARGED = 'externalStorageCharged';
