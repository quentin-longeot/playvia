import {
  CREATE_AV_PLAYER,
  CREATE_SHAKA_PLAYER,
  CREATE_VIDEO_PLAYER,
  PLAYER_PREVIOUS,
  PLAYER_PLAY_PAUSE,
  PLAYER_NEXT,
  PLAYER_CHANGE_SPEED,
  PLAYER_STOPPED,
  PLAYER_TOGGLE_BUTTON,
  SHOW_OVERLAY,
} from '@/events';
import type { OverlayModule, OverlayButtonId } from '@types';

// CONSTANTS
const HIDE_DELAY = 5000;
export const OVERLAY_BAR_ID = 'overlay-bar-container';
/**
 * Buttons available in the overlay with their associated custom event
 * The order should reflect their position
 */
export const OVERLAY_BUTTONS: Record<OverlayButtonId, string> = {
  'previous-button': PLAYER_PREVIOUS,
  'play-button': PLAYER_PLAY_PAUSE,
  'pause-button': PLAYER_PLAY_PAUSE,
  'next-button': PLAYER_NEXT,
  'speed-button': PLAYER_CHANGE_SPEED,
};

export const overlay: OverlayModule = {
  // VARIABLES

  hideTimeout: null,
  lastFocusedButtonId: 'pause-button',

  // METHODS

  /**
   * Create the overlay by adding custom event listeners
   * It also initializes buttons icon's
   */
  create: (): void => {
    window.addEventListener(CREATE_AV_PLAYER, () => {
      overlay.show(true);
    });

    window.addEventListener(CREATE_SHAKA_PLAYER, () => {
      overlay.show(true);
    });

    window.addEventListener(CREATE_VIDEO_PLAYER, () => {
      overlay.show(true);
    });

    window.addEventListener(PLAYER_STOPPED, () => {
      const overlayElement = document.getElementById('player-overlay');

      if (overlayElement) {
        overlayElement.style.display = 'none';
      }
    });

    window.addEventListener(PLAYER_TOGGLE_BUTTON, () => {
      const buttonId = (document.activeElement as HTMLElement)?.id as OverlayButtonId;
      const customEventName = OVERLAY_BUTTONS[buttonId];

      if (!customEventName) {
        console.warn('❌ No custom event associated with button:', buttonId);
        return;
      }

      if (customEventName === PLAYER_PLAY_PAUSE) {
        const playButton = document.getElementById('play-button');
        const pauseButton = document.getElementById('pause-button');

        if (playButton && pauseButton) {
          if (playButton.style.display === 'none') {
            // Currently playing, switch to pause
            playButton.style.display = 'inline';
            pauseButton.style.display = 'none';
            pauseButton.blur();
            playButton.focus();
          } else {
            // Currently paused, switch to play
            playButton.style.display = 'none';
            pauseButton.style.display = 'inline';
            playButton.blur();
            pauseButton.focus();
          }
        }
      }

      window.dispatchEvent(new CustomEvent(customEventName));
    });

    window.addEventListener(SHOW_OVERLAY, () => {
      overlay.show();
    });

    // Load SVGs for overlay buttons
    overlay.initButtons();
  },

  /**
   * Initialize buttons by loading inline SVG into them
   * Also add event listeners
   */
  initButtons: (): void => {
    const buttons = document.querySelectorAll('.overlay-button');

    Array.from(buttons).forEach((button) => {
      const source = button.getAttribute('data-src');
      if (!source) return;

      const xhr = new XMLHttpRequest();

      xhr.open('GET', source, true);
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
          button.innerHTML = xhr.responseText;
        } else if (xhr.readyState === 4 && xhr.status === 0) {
          // For file:// protocol, status is 0 but responseText may be OK
          if (xhr.responseText) {
            button.innerHTML = xhr.responseText;
          }
        }
      };
      xhr.onerror = () => {
        console.error('❌ Error loading SVG:', source);
      };
      xhr.send();
    });
  },

  /**
   * Reset the hide timeout
   */
  resetTimeout: (): void => {
    if (overlay.hideTimeout) {
      clearTimeout(overlay.hideTimeout);
    }

    overlay.hideTimeout = setTimeout(() => {
      overlay.hide();
      overlay.hideTimeout = null;
    }, HIDE_DELAY);
  },

  /**
   * Show the overlay and reset the hide timeout
   */
  show: (shouldFocus = false): void => {
    const overlayElement = document.getElementById('player-overlay');

    if (!overlayElement) {
      console.error('🕵️‍♂️ Overlay element not found');
      return;
    }

    const isOverlayHidden = overlayElement.style.display === 'none';
    overlayElement.style.display = 'inline';

    if ((isOverlayHidden || shouldFocus) && overlay.lastFocusedButtonId) {
      const lastFocusedButtonElement = document.getElementById(overlay.lastFocusedButtonId);

      if (lastFocusedButtonElement) {
        lastFocusedButtonElement.focus();
      }
    }

    overlay.resetTimeout();
  },

  /**
   * Hide the overlay
   */
  hide: (): void => {
    const overlayElement = document.getElementById('player-overlay');

    if (!overlayElement) {
      console.error('🕵️‍♂️ Overlay element not found');
      return;
    }

    overlay.lastFocusedButtonId = document.activeElement?.id as OverlayButtonId || 'pause-button';
    overlayElement.style.display = 'none';
  },
}
