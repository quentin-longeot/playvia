import {
  CREATE_AV_PLAYER,
  CREATE_VIDEO_PLAYER,
  PLAYER_FAST_FORWARD,
  PLAYER_KILL,
  PLAYER_NEXT,
  PLAYER_PREVIOUS,
  PLAYER_REWIND,
  PLAYER_STOP_FAST_FORWARD,
  PLAYER_STOP_REWIND,
  PLAYER_STOPPED,
  PLAYER_TOGGLE_BUTTON,
  SHOW_OVERLAY,
} from '@/events';
import { externalStorage } from '@/modules/externalStorage';
import { focusManager } from '@/modules/focusManager';
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

  isPlayerActive: false,
  currentPlayingIndex: -1,

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
            if (listeners.isPlayerActive) {
              focusManager.focusNextButton();
              break;
            }
            focusManager.focusNextCard();
            break;
          case KEY_CODES.left:
            if (listeners.isPlayerActive) {
              focusManager.focusPreviousButton();
              break;
            }
            focusManager.focusPreviousCard();
            break;
          case KEY_CODES.up:
            if (listeners.isPlayerActive) {
              focusManager.focusBar();
              break;
            }
            focusManager.focusPreviousLineCard();
            break;
          case KEY_CODES.down:
            if (listeners.isPlayerActive) {
              focusManager.focusButtons();
              break;
            }
            focusManager.focusNextLineCard();
            break;
          case KEY_CODES.enter:
            if (listeners.isPlayerActive) {
              const customEvent = new CustomEvent(PLAYER_TOGGLE_BUTTON);
              window.dispatchEvent(customEvent);
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

    window.addEventListener(CREATE_VIDEO_PLAYER, () => {
      listeners.hideAppElement();
      listeners.isPlayerActive = true;
    });

    window.addEventListener(PLAYER_STOPPED, () => {
      listeners.showAppElement();
      listeners.currentPlayingIndex = -1;
      listeners.isPlayerActive = false;
    });

    window.addEventListener(PLAYER_NEXT, () => {
      listeners.playNextContent();
    });

    window.addEventListener(PLAYER_PREVIOUS, () => {
      listeners.playPreviousContent();
    });

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

    // Boundary checks
    if (index < 0 || index >= totalElements) {
      console.warn('Index out of bounds:', index);
      return;
    }

    const elementToPlay = externalStorage.externalStorageElements?.[index];
    let url = process.env.MOCKED_FALLBACK_VIDEO_URL; // Fallback URL
    let customEvent: CustomEvent = new CustomEvent(CREATE_VIDEO_PLAYER, {
      detail: { url: url },
    });

    if (elementToPlay && elementToPlay.isFile && elementToPlay.toURI) {
      url = elementToPlay.toURI();
      customEvent = new CustomEvent(CREATE_AV_PLAYER, { detail: { url: url } });
    }

    listeners.currentPlayingIndex = index;
    window.dispatchEvent(customEvent);
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
