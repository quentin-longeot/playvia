import {
  CREATE_AV_PLAYER,
  CREATE_SHAKA_PLAYER,
  CREATE_VIDEO_PLAYER,
  FLOATING_BUTTONS_FOCUSED,
  FOCUS_BAR,
  FOCUS_BUTTON,
  FOCUS_FLOATING_BUTTONS,
  FOCUS_NEXT_BUTTON,
  FOCUS_NEXT_CARD,
  FOCUS_NEXT_LINE_CARD,
  FOCUS_PREVIOUS_BUTTON,
  FOCUS_PREVIOUS_CARD,
  FOCUS_PREVIOUS_LINE_CARD,
  OVERLAY_FLOATING_BUTTON_HIDDEN,
  PLAYER_FAST_FORWARD,
  PLAYER_KILL,
  PLAYER_NEXT,
  PLAYER_PREVIOUS,
  PLAYER_REWIND,
  PLAYER_STOP_FAST_FORWARD,
  PLAYER_STOP_REWIND,
  PLAYER_STOPPED,
  SHOW_OVERLAY,
  SHOW_PREVIOUS_BUTTON,
  TOGGLE_BUTTON,
  TOGGLE_FLOATING_BUTTON,
} from '@/events';
import { externalStorage } from '@/modules/externalStorage';
import type { ListenersModule } from '@types';

// TYPES

interface KeyCodes {
  readonly back: number;
  readonly down: number;
  readonly enter: number;
  readonly fastForward: number;
  readonly left: number;
  readonly return: number;
  readonly rewind: number;
  readonly right: number;
  readonly up: number;
}

// CONSTANTS
const KEY_CODES: KeyCodes = {
  back: 8,
  down: 40,
  enter: 13,
  fastForward: 417,
  left: 37,
  return: 10009,
  rewind: 412,
  right: 39,
  up: 38,
};

export const listeners: ListenersModule = {
  // VARIABLES

  createPlayerEventName: CREATE_VIDEO_PLAYER,
  currentPlayingIndex: -1,
  isPlayerActive: false,
  isOverlayActionButtonsFocused: true,
  isOverlayBarFocused: false,
  isOverlayFloatingButtonsFocused: false,

  // METHODS

  /**
   * Set up event listeners
   */
  create: (): void => {
    // JS EVENTS LISTENERS

    document.addEventListener('visibilitychange', () => {
      // Only run on Tizen devices
      if (typeof webapis === 'undefined') return;

      const playerState = webapis.avplay.getState();

      if (document.hidden) {
        if (
          playerState === 'READY'
          || playerState === 'PLAYING'
          || playerState === 'PAUSED'
        ) {
          webapis.avplay.suspend();
          console.info('Player is suspended ...');
        }
      } else {
        if (
          playerState === 'NONE'
          || playerState === 'PLAYING'
          || playerState === 'PAUSED'
        ) {
          webapis.avplay.restore();
          console.info('... Player is restored');
        }
      }
    });

    window.addEventListener(
      'keydown',
      (event: KeyboardEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (listeners.isPlayerActive) {
          window.dispatchEvent(new CustomEvent(SHOW_OVERLAY));
        }

        switch (event.keyCode) {
          case KEY_CODES.right:
            let customRightEventName = FOCUS_NEXT_CARD;
            if (listeners.isPlayerActive) {
              customRightEventName = FOCUS_NEXT_BUTTON
            }

            window.dispatchEvent(new CustomEvent(customRightEventName));
            break;
          case KEY_CODES.left:
            let customLeftEventName = FOCUS_PREVIOUS_CARD;
            if (listeners.isPlayerActive) {
              customLeftEventName = FOCUS_PREVIOUS_BUTTON
            }

            window.dispatchEvent(new CustomEvent(customLeftEventName));
            break;
          case KEY_CODES.up:
            let customUpEventName = FOCUS_PREVIOUS_LINE_CARD;

            if (listeners.isPlayerActive) {
              if (listeners.isOverlayActionButtonsFocused) {
                customUpEventName = FOCUS_FLOATING_BUTTONS;

              } else if (listeners.isOverlayBarFocused) {
                customUpEventName = FOCUS_BUTTON;
                listeners.isOverlayFloatingButtonsFocused = false;
                listeners.isOverlayActionButtonsFocused = true;
              }
            }

            window.dispatchEvent(new CustomEvent(customUpEventName));
            break;
          case KEY_CODES.down:
            let customDownEventName = FOCUS_NEXT_LINE_CARD;

            if (listeners.isPlayerActive) {
              if (listeners.isOverlayActionButtonsFocused) {
                customDownEventName = FOCUS_BAR;
                listeners.isOverlayBarFocused = true;
                listeners.isOverlayActionButtonsFocused = false;
              } else if (listeners.isOverlayFloatingButtonsFocused) {
                customDownEventName = FOCUS_BUTTON;
                listeners.isOverlayFloatingButtonsFocused = false;
                listeners.isOverlayActionButtonsFocused = true;
              }
            }

            window.dispatchEvent(new CustomEvent(customDownEventName));
            break;
          case KEY_CODES.enter:
            if (listeners.isPlayerActive) {
              if (listeners.isOverlayActionButtonsFocused) {
                const customEvent = new CustomEvent(TOGGLE_BUTTON);
                window.dispatchEvent(customEvent);
              } else if (listeners.isOverlayFloatingButtonsFocused) {
                const customEvent = new CustomEvent(TOGGLE_FLOATING_BUTTON);
                window.dispatchEvent(customEvent);
              }
            } else {
              const activeElement = document.activeElement as HTMLElement;
              const elementToPlayIndex = parseInt(activeElement.id.split('movie-card-')[1]);
              listeners.playContentWithIndex(elementToPlayIndex);
            }
            break;
          case KEY_CODES.return:
          case KEY_CODES.back:
            if (listeners.isPlayerActive) {
              const customEvent = new CustomEvent(PLAYER_KILL);
              window.dispatchEvent(customEvent);
            }
            break;
          case KEY_CODES.fastForward:
            if (listeners.isPlayerActive) {
              const customEvent = new CustomEvent(PLAYER_FAST_FORWARD);
              window.dispatchEvent(customEvent);
            }
            break;
          case KEY_CODES.rewind:
            if (listeners.isPlayerActive) {
              const customEvent = new CustomEvent(PLAYER_REWIND);
              window.dispatchEvent(customEvent);
            }
            break;

          default:
            console.warn('Unhandled key:', event.code, event.keyCode);
        }
      },
      false
    );

    window.addEventListener(
      'keyup',
      (event: KeyboardEvent) => {
        switch (event.keyCode) {
          case KEY_CODES.fastForward:
          case KEY_CODES.right:
            if (listeners.isPlayerActive) {
              window.dispatchEvent(new CustomEvent(PLAYER_STOP_FAST_FORWARD));
            }
            break;

          case KEY_CODES.rewind:
          case KEY_CODES.left:
            if (listeners.isPlayerActive) {
              window.dispatchEvent(new CustomEvent(PLAYER_STOP_REWIND));
            }
            break;
        }
      },
      false
    );

    // CUSTOM EVENTS LISTENERS

    window.addEventListener(CREATE_AV_PLAYER, () => {
      listeners.hideAppElement();
      listeners.isPlayerActive = true;
    });

    window.addEventListener(CREATE_SHAKA_PLAYER, () => {
      listeners.hideAppElement();
      listeners.isPlayerActive = true;
    });

    window.addEventListener(CREATE_VIDEO_PLAYER, () => {
      listeners.hideAppElement();
      listeners.isPlayerActive = true;
    });

    window.addEventListener(FLOATING_BUTTONS_FOCUSED, () => {
      listeners.isOverlayFloatingButtonsFocused = true;
      listeners.isOverlayActionButtonsFocused = false;
    });

    window.addEventListener(OVERLAY_FLOATING_BUTTON_HIDDEN, () => {
      const customEvent = new CustomEvent(FOCUS_BUTTON, {
        detail: document.getElementById('overlay__action-button--play')?.style.display === 'none'
          ? 'overlay__action-button--pause'
          : 'overlay__action-button--play',
      });
      window.dispatchEvent(customEvent);
      listeners.isOverlayFloatingButtonsFocused = false;
      listeners.isOverlayActionButtonsFocused = true;
    });

    window.addEventListener(PLAYER_STOPPED, () => {
      listeners.showAppElement();
      listeners.currentPlayingIndex = -1;
      listeners.isPlayerActive = false;
    });

    window.addEventListener(PLAYER_NEXT, listeners.playNextContent);

    window.addEventListener(PLAYER_PREVIOUS, listeners.playPreviousContent);

    if (process.env.PLAYER_NAME === 'avplayer') {
      listeners.createPlayerEventName = CREATE_AV_PLAYER;
    } else if (process.env.PLAYER_NAME === 'shakaplayer') {
      listeners.createPlayerEventName = CREATE_SHAKA_PLAYER;
    } else if (process.env.PLAYER_NAME === 'videotag') {
      listeners.createPlayerEventName = CREATE_VIDEO_PLAYER;
    }

    console.info('Listeners initialized');
  },

  /**
   * Hide the main app element
   */
  hideAppElement: (): void => {
    const appElement = document.getElementById('app');

    if (appElement) {
      appElement.style.display = 'none';
    }
  },

  /**
   * Try to play the given content by its index
   * If the given content is a file, we use the AVPlayer
   * Otherwise, we use the VideoPlayer
   */
  playContentWithIndex: (index: number): void => {
    const totalElements = externalStorage.externalStorageElements?.length || 0;
    const elementToPlay = externalStorage.externalStorageElements?.[index];
    let url = process.env.MOCKED_FALLBACK_VIDEO_URL; // Fallback URL
    const overlayTitleElement = document.getElementById('overlay__title');

    // Boundary checks
    if (index < 0 || index >= totalElements) {
      console.warn('Index out of bounds:', index);
      return;
    }

    if (overlayTitleElement) {
      overlayTitleElement.textContent = elementToPlay?.name || 'Unknown Title';
    }

    if (elementToPlay?.isFile && elementToPlay?.toURI) {
      url = elementToPlay.toURI();
    }

    const customEvent: CustomEvent = new CustomEvent(listeners.createPlayerEventName, {
      detail: { url: url },
    });

    listeners.currentPlayingIndex = index;
    window.dispatchEvent(customEvent);
    window.dispatchEvent(new CustomEvent(SHOW_PREVIOUS_BUTTON));
  },

  /**
   * Play the next content in the list
   */
  playNextContent: (): void => {
    if (listeners.currentPlayingIndex === -1) {
      console.warn('No content is currently playing');
      return;
    }

    const totalElements = externalStorage.externalStorageElements?.length || 0;
    const nextIndex = listeners.currentPlayingIndex + 1;

    if (nextIndex >= totalElements) {
      console.info('Already at the last content');
      return;
    }

    // Stop current player before playing next
    const stopEvent = new CustomEvent(PLAYER_KILL);
    window.dispatchEvent(stopEvent);

    // Small delay to ensure the player is fully stopped
    setTimeout(() => {
      listeners.playContentWithIndex(nextIndex);
    }, 100);
  },

  /**
   * Play the previous content in the list
   */
  playPreviousContent: (): void => {
    if (listeners.currentPlayingIndex === -1) {
      console.warn('No content is currently playing');
      return;
    }

    const previousIndex = listeners.currentPlayingIndex - 1;

    if (previousIndex < 0) {
      console.info('Already at the first content');
      return;
    }

    // Stop current player before playing previous
    const stopEvent = new CustomEvent(PLAYER_KILL);
    window.dispatchEvent(stopEvent);

    // Small delay to ensure the player is fully stopped
    setTimeout(() => {
      listeners.playContentWithIndex(previousIndex);
    }, 100);
  },

  /**
   * Show the main app element
   */
  showAppElement: (): void => {
    const appElement = document.getElementById('app');

    if (appElement) {
      appElement.style.display = 'inline';
    }
  }
};
