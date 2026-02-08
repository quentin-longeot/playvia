import {
  CREATE_AV_PLAYER,
  CREATE_SHAKA_PLAYER,
  CREATE_VIDEO_PLAYER,
  OVERLAY_FLOATING_BUTTON_HIDDEN,
  PLAYER_CHANGE_SPEED,
  PLAYER_NEXT,
  PLAYER_PLAY_PAUSE,
  PLAYER_PREVIOUS,
  PLAYER_STOPPED,
  SHOW_NEXT_BUTTON,
  SHOW_OVERLAY,
  SPEED_UPDATED,
  TOGGLE_BUTTON,
  TOGGLE_FLOATING_BUTTON,
} from '@/events';
import type { OverlayModule, OverlayButtonId } from '@types';

// CONSTANTS

const HIDE_DELAY = 5000;
export const OVERLAY_BAR_ID = 'overlay__bar-container';
/**
 * Buttons available in the overlay with their associated custom event
 * The order should reflect their position
 */
export const OVERLAY_BUTTONS: Record<OverlayButtonId, string> = {
  'overlay__action-button--play': PLAYER_PLAY_PAUSE,
  'overlay__action-button--pause': PLAYER_PLAY_PAUSE,
  'overlay__action-button--speed': PLAYER_CHANGE_SPEED,
};

export const overlay: OverlayModule = {
  // VARIABLES

  hideTimeout: null,
  lastFocusedButtonId: 'overlay__action-button--pause',

  // METHODS

  /**
   * Create the overlay by adding custom event listeners
   * It also initializes buttons icon's
   */
  create: (): void => {
    window.addEventListener(CREATE_AV_PLAYER, overlay.handlePlayerCreation);

    window.addEventListener(CREATE_SHAKA_PLAYER, overlay.handlePlayerCreation);

    window.addEventListener(CREATE_VIDEO_PLAYER, overlay.handlePlayerCreation);

    window.addEventListener(PLAYER_STOPPED, () => {
      const overlayElement = document.getElementById('overlay');
      const pauseButton = document.getElementById('overlay__action-button--pause');

      if (overlayElement) {
        overlayElement.style.display = 'none';
      }

      overlay.lastFocusedButtonId = 'overlay__action-button--pause';

      if (pauseButton?.style.display === 'none') {
        pauseButton.style.display = 'inline';
        const playButton = document.getElementById('overlay__action-button--play')

        if (playButton) {
          playButton.style.display = 'none';
        }
      }

      const overlaySpeedElement = document.getElementById('overlay__speed-indicator');

      if (overlaySpeedElement?.textContent) {
        overlaySpeedElement.textContent = `1x`;
      }
    });

    window.addEventListener(TOGGLE_BUTTON, () => {
      const buttonId = document.activeElement?.id as OverlayButtonId;
      const customEventName = OVERLAY_BUTTONS[buttonId];

      if (!customEventName) {
        console.warn('❌ No custom event associated with button:', buttonId);
        return;
      }

      if (customEventName === PLAYER_PLAY_PAUSE) {
        const playButton = document.getElementById('overlay__action-button--play');
        const pauseButton = document.getElementById('overlay__action-button--pause');

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

    window.addEventListener(SHOW_NEXT_BUTTON, overlay.showNextButton);

    window.addEventListener(SHOW_OVERLAY, () => overlay.show());

    window.addEventListener(SPEED_UPDATED, (overlay.handleSpeedUpdated) as EventListener);

    window.addEventListener(TOGGLE_FLOATING_BUTTON, () => {
      const nextFloatingButton = document.getElementById('overlay__next-button');
      const previousFloatingButton = document.getElementById('overlay__previous-button');

      if (nextFloatingButton && nextFloatingButton?.style.display !== 'none') {
        const customEvent = new CustomEvent(PLAYER_NEXT);
        window.dispatchEvent(customEvent);
        nextFloatingButton.style.display = 'none';
      } else if (previousFloatingButton && previousFloatingButton.style.display !== 'none') {
        const customEvent = new CustomEvent(PLAYER_PREVIOUS);
        window.dispatchEvent(customEvent);
        previousFloatingButton.style.display = 'none';
      }
    });

    // Load SVGs for overlay buttons
    overlay.initButtons();
  },

  /**
   * Initialize buttons by loading inline SVG into them
   * Also add event listeners
   */
  initButtons: (): void => {
    const buttons = document.querySelectorAll('.overlay__action-button');

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
   * Handle player creation
   */
  handlePlayerCreation: (): void => {
    overlay.show(true);
    overlay.showPreviousButton();
  },

  /**
   * Show the previous button and set a timeout to hide it after 15 seconds
   */
  showPreviousButton: (): void => {
    const previousButton = document.getElementById('overlay__previous-button');

    if (previousButton) {
      previousButton.style.display = 'inline';
    }

    /**
     * Hide the previous button after 15 seconds to avoid cluttering the UI
     */
    setTimeout(() => {
      if (previousButton) {
        previousButton.style.display = 'none';
        if (document.activeElement === previousButton) {
          previousButton.blur();

          const customEvent = new CustomEvent(OVERLAY_FLOATING_BUTTON_HIDDEN);
          window.dispatchEvent(customEvent);
        }
      }
    }, 15000);
  },

  /**
   * Show the next button and set a timeout to hide it after 30 seconds
   */
  showNextButton: (): void => {
    const nextButton = document.getElementById('overlay__next-button');

    if (nextButton) {
      nextButton.style.display = 'inline';
    }

    /**
     * Hide the next button after 30 seconds to avoid cluttering the UI
     */
    setTimeout(() => {
      if (nextButton) {
        nextButton.style.display = 'none';
        if (document.activeElement === nextButton) {
          nextButton.blur();

          const customEvent = new CustomEvent(OVERLAY_FLOATING_BUTTON_HIDDEN);
          window.dispatchEvent(customEvent);
        }
      }
    }, 30000);
  },

  /**
   * Handle speed updated event to update the speed indicator in the overlay
   */
  handleSpeedUpdated: (event: CustomEvent): void => {
    const overlaySpeedElement = document.getElementById('overlay__speed-indicator');
    const newSpeed = event.detail.newSpeed;

    if (overlaySpeedElement?.textContent) {
      overlaySpeedElement.textContent = `${newSpeed || 1}x`;
    }
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
    const overlayElement = document.getElementById('overlay');

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
    const overlayElement = document.getElementById('overlay');

    if (!overlayElement) {
      console.error('🕵️‍♂️ Overlay element not found');
      return;
    }

    overlayElement.style.display = 'none';
    overlay.lastFocusedButtonId =
      document.activeElement?.id as OverlayButtonId || 'overlay__action-button--pause';
  },
}
