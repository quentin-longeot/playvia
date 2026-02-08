import {
  FLOATING_BUTTONS_FOCUSED,
  FOCUS_BAR,
  FOCUS_BUTTON,
  FOCUS_CARD_ELEMENT,
  FOCUS_FLOATING_BUTTONS,
  FOCUS_NEXT_BUTTON,
  FOCUS_NEXT_CARD,
  FOCUS_NEXT_LINE_CARD,
  FOCUS_PREVIOUS_BUTTON,
  FOCUS_PREVIOUS_CARD,
  FOCUS_PREVIOUS_LINE_CARD,
  PLAYER_FAST_FORWARD,
  PLAYER_REWIND,
  PLAYER_STOPPED,
} from '@/events';
import { smoothScrollTo } from '@/helpers';
import { externalStorage } from '@/modules/externalStorage';
import { OVERLAY_BAR_ID, OVERLAY_BUTTONS } from '@/modules/overlay';
import type { FocusManagerModule, FocusCardParams, OverlayButtonId } from '@types';

// CONSTANTS

const TOTAL_ELEMENTS_BY_LINE = 5;

export const focusManager: FocusManagerModule = {
  // VARIABLES

  lastFocusedButtonId: 'overlay__action-button--pause',
  lastFocusedCardIndex: 0,

  // HELPERS

  /**
   * Focus the given element and blur from the previously focused one
   * Also manage the `current-focused` class
   */
  focusCardElement: (element: HTMLElement, shouldPreventScroll = true): void => {
    const classNameFocused = 'current-focused';
    const activeElement = document.activeElement as HTMLElement;

    if (activeElement?.id.includes('movie-card')) {
      const currentFocusedImage = activeElement.getElementsByClassName('card__image')[0];

      activeElement.blur();
      currentFocusedImage?.classList.remove(classNameFocused);
    }

    const focusedImage = element.getElementsByClassName('card__image')[0];

    element.focus({ preventScroll: shouldPreventScroll });
    focusedImage?.classList.add(classNameFocused);
    focusManager.scrollToElement(element);
  },

  /**
   * Display the focused element at the center of the screen
   */
  scrollToElement: (element: HTMLElement): void => {
    const elementRect = element.getBoundingClientRect();

    // If the element is already fully visible, do nothing
    if (elementRect.top >= 0 && elementRect.bottom <= window.innerHeight) return;

    const absoluteElementTop = elementRect.top + window.pageYOffset;
    const middleOfScreen = window.innerHeight / 2;
    const elementMiddle = elementRect.height / 2;
    const scrollTop = absoluteElementTop - middleOfScreen + elementMiddle;

    // Limit scrollTop to the document bounds
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const clampedScrollTop = Math.max(0, Math.min(scrollTop, maxScroll));

    smoothScrollTo(clampedScrollTop);
  },

  /**
   * Focus a card id based on the given indexes to add and remove
   */
  focusCard: ({ indexToAdd, indexToRemove }: FocusCardParams): void => {
    if (!document.activeElement) {
      console.info('🕵️‍♂️ No element is currently focused.');
      return;
    }

    const totalElementsLength = externalStorage.externalStorageElements?.length || 0;
    const currentElementId = (document.activeElement as HTMLElement).id;
    let indexToFocus =
      parseInt(currentElementId.split('movie-card-')[1]) + indexToAdd - indexToRemove;

    if (indexToFocus < 0) {
      // Focus the first element
      indexToFocus = 0;
    } else if (indexToFocus >= totalElementsLength) {
      // Focus the last element
      indexToFocus = totalElementsLength - 1;
    }

    const elementToFocus = document.getElementById('movie-card-' + indexToFocus);

    if (elementToFocus) {
      const customEvent = new CustomEvent(FOCUS_CARD_ELEMENT, { detail: elementToFocus });
      focusManager.lastFocusedCardIndex = indexToFocus;
      window.dispatchEvent(customEvent);
    } else {
      console.error('❌ Impossible to focus the next element');
    }
  },

  /**
   * Focus a button in the overlay based on the given indexes to add and remove
   */
  focusButton: ({ indexToAdd, indexToRemove }: FocusCardParams): void => {
    const currentButtonElement = document.activeElement as HTMLElement;
    const overlayButtons = Object.keys(OVERLAY_BUTTONS);
    const currentButtonIndex = overlayButtons.indexOf(currentButtonElement.id);
    const nextButtonIndex = currentButtonIndex + indexToAdd - indexToRemove;
    const isFirstButtonElementVisible = document.getElementById(overlayButtons[0])?.style.display !== 'none';
    const firstVisibleButtonIndex = isFirstButtonElementVisible ? 0 : 1;

    if (nextButtonIndex >= firstVisibleButtonIndex && nextButtonIndex < overlayButtons.length) {
      const nextButtonElement = document.getElementById(overlayButtons[nextButtonIndex]);
      currentButtonElement.blur();
      nextButtonElement?.focus();
    }
  },

  /**
   * Focus a floating button if visible
   * Return true if a button has been focused, false otherwise
    * This method is used to focus the floating buttons when pressing down from the main buttons of the overlay
   */
  focusFloatingButtons: (): void => {
    const previousFloatingButton = document.getElementById('overlay__previous-button');
    const nextFloatingButton = document.getElementById('overlay__next-button');

    if (previousFloatingButton && previousFloatingButton.style.display !== 'none') {
      previousFloatingButton.focus();
      window.dispatchEvent(new CustomEvent(FLOATING_BUTTONS_FOCUSED));
    }

    if (nextFloatingButton && nextFloatingButton.style.display !== 'none') {
      nextFloatingButton.focus();
      window.dispatchEvent(new CustomEvent(FLOATING_BUTTONS_FOCUSED));
    }
  },

  // METHODS

  /**
   * Initialize focus manager by adding custom event listeners
   */
  create(): void {
    // CUSTOM EVENT LISTENERS

    window.addEventListener(FOCUS_CARD_ELEMENT, ((event: CustomEvent<HTMLElement>) => {
      const elementToFocus = event.detail;

      if (elementToFocus) {
        focusManager.focusCardElement(elementToFocus);
      }
    }) as EventListener);

    window.addEventListener(FOCUS_BAR, focusManager.focusBar);

    window.addEventListener(FOCUS_BUTTON, focusManager.focusButtons);

    window.addEventListener(FOCUS_FLOATING_BUTTONS, focusManager.focusFloatingButtons);

    window.addEventListener(FOCUS_NEXT_BUTTON, focusManager.focusNextButton);

    window.addEventListener(FOCUS_NEXT_CARD, focusManager.focusNextCard);

    window.addEventListener(FOCUS_NEXT_LINE_CARD, focusManager.focusNextLineCard);

    window.addEventListener(FOCUS_PREVIOUS_BUTTON, focusManager.focusPreviousButton);

    window.addEventListener(FOCUS_PREVIOUS_CARD, focusManager.focusPreviousCard);

    window.addEventListener(FOCUS_PREVIOUS_LINE_CARD, focusManager.focusPreviousLineCard);

    window.addEventListener(PLAYER_STOPPED, () => {
      // When the player is stopped, focus back the last focused card
      const lastFocusedCard = document.getElementById('movie-card-' + focusManager.lastFocusedCardIndex);

      if (lastFocusedCard) {
        focusManager.focusCardElement(lastFocusedCard, false);
      }
    });
  },

  /**
   * Focus the next element in the list
   */
  focusNextCard: (): void => {
    focusManager.focusCard({ indexToAdd: 1, indexToRemove: 0 });
  },

  /**
   * Focus the previous element in the list
   */
  focusPreviousCard: (): void => {
    focusManager.focusCard({ indexToAdd: 0, indexToRemove: 1 });
  },

  /**
   * Focus the next line element in the list
   */
  focusNextLineCard: (): void => {
    focusManager.focusCard({ indexToAdd: TOTAL_ELEMENTS_BY_LINE, indexToRemove: 0 });
  },

  /**
   * Focus the previous line element in the list
   */
  focusPreviousLineCard: (): void => {
    focusManager.focusCard({ indexToAdd: 0, indexToRemove: TOTAL_ELEMENTS_BY_LINE });
  },

  /**
   * Focus the next button in the overlay based on the current focused button
   */
  focusNextButton: (): void => {
    const currentButtonElement = document.activeElement as HTMLElement;
    const barElement = document.getElementById(OVERLAY_BAR_ID);

    if (barElement === currentButtonElement) {
      const customEvent = new CustomEvent(PLAYER_FAST_FORWARD);
      window.dispatchEvent(customEvent);
      return;
    }

    const overlayButtons = Object.keys(OVERLAY_BUTTONS);
    const currentButtonIndex = overlayButtons.indexOf(currentButtonElement.id);
    const isPlayButtonDisplayed =
      document.getElementById('overlay__action-button--play')?.style.display !== 'none';
    let indexToAdd = 1;

    if (currentButtonIndex === 0 && isPlayButtonDisplayed) {
      // A simple hack to skip the pause button when going back from the speed button
      indexToAdd = 2;
    }

    focusManager.focusButton({ indexToAdd: indexToAdd, indexToRemove: 0 });
  },

  /**
   * Focus the previous button in the overlay based on the current focused button
   */
  focusPreviousButton: (): void => {
    const currentButtonElement = document.activeElement as HTMLElement;
    const barElement = document.getElementById(OVERLAY_BAR_ID);

    if (barElement === currentButtonElement) {
      const customEvent = new CustomEvent(PLAYER_REWIND);
      window.dispatchEvent(customEvent);
      return;
    }

    const overlayButtons = Object.keys(OVERLAY_BUTTONS);
    const currentButtonIndex = overlayButtons.indexOf(currentButtonElement.id);
    const isPlayButtonDisplayed = document.getElementById('overlay__action-button--play')?.style.display !== 'none';
    let indexToRemove = 1;

    if (currentButtonIndex === 2 && isPlayButtonDisplayed) {
      // A simple hack to skip the play button when going back from the speed button
      indexToRemove = 2;
    }

    focusManager.focusButton({ indexToAdd: 0, indexToRemove: indexToRemove });
  },

  /**
   * Focus the overlay bar from the current focused button
   */
  focusBar: (): void => {
    const currentButtonElement = document.activeElement as HTMLElement;
    focusManager.lastFocusedButtonId = currentButtonElement.id as OverlayButtonId;
    const barElement = document.getElementById(OVERLAY_BAR_ID);

    currentButtonElement.blur();
    barElement?.focus();
  },

  /**
   * Focus the overlay buttons from the bar
   */
  focusButtons: (): void => {
    const barElement = document.getElementById(OVERLAY_BAR_ID);
    const lastFocusedButtonElement = document.getElementById(focusManager.lastFocusedButtonId);
  
    barElement?.blur();
    lastFocusedButtonElement?.focus();
  },
};
