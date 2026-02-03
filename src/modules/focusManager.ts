import { FOCUS_ELEMENT, PLAYER_FAST_FORWARD, PLAYER_REWIND, PLAYER_STOPPED } from '@/events';
import { smoothScrollTo } from '@/helpers';
import { externalStorage } from '@/modules/externalStorage';
import { OVERLAY_BAR_ID, OVERLAY_BUTTONS } from '@/modules/overlay';
import type { FocusManagerModule, FocusCardParams, OverlayButtonId } from '@types';

// CONSTANTS
const TOTAL_ELEMENTS_BY_LINE = 5;

export const focusManager: FocusManagerModule = {
  // VARIABLES

  lastFocusedButtonId: 'pause-button',
  lastFocusedCardIndex: 0,

  // HELPERS

  /**
   * Focus the given element and blur from the previously focused one
   * Also manage the `current-focused` class
   */
  focusElement: (element: HTMLElement, shouldPreventScroll = true): void => {
    const classNameFocused = 'current-focused';

    if (document.activeElement?.id.includes('movie-card')) {
      const currentFocusedImage = (document.activeElement as HTMLElement).getElementsByClassName(
        'card-image'
      )[0] as HTMLElement | undefined;
      (document.activeElement as HTMLElement).blur();
      currentFocusedImage?.classList.remove(classNameFocused);
    }

    const focusedImage =
      element.getElementsByClassName('card-image')[0] as HTMLElement | undefined;

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
      const customEvent = new CustomEvent(FOCUS_ELEMENT, {
        detail: elementToFocus,
      });
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

    if (nextButtonIndex >= 0 && nextButtonIndex < overlayButtons.length) {
      const nextButtonElement = document.getElementById(overlayButtons[nextButtonIndex]);
      currentButtonElement.blur();
      nextButtonElement?.focus();
    }
  },

  // METHODS

  /**
   * Initialize focus manager by adding custom event listeners
   */
  create(): void {
    // CUSTOM EVENT LISTENERS

    window.addEventListener(FOCUS_ELEMENT, ((event: CustomEvent<HTMLElement>) => {
      const elementToFocus = event.detail;

      if (elementToFocus) {
        focusManager.focusElement(elementToFocus);
      }
    }) as EventListener);

    window.addEventListener(PLAYER_STOPPED, () => {
      // When the player is stopped, focus back the last focused card
      const lastFocusedCard = document.getElementById('movie-card-' + focusManager.lastFocusedCardIndex);

      if (lastFocusedCard) {
        focusManager.focusElement(lastFocusedCard, false);
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
    const isPauseButtonDisplayed =
      document.getElementById('pause-button')?.style.display !== 'none';
    let indexToAdd = 1;

    if (
      (currentButtonIndex === 0 && isPauseButtonDisplayed) ||
      (currentButtonIndex === 1 && !isPauseButtonDisplayed)
    ) {
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
    const isPlayButtonDisplayed = document.getElementById('play-button')?.style.display !== 'none';
    let indexToRemove = 1;

    if (
      (currentButtonIndex === 2 && !isPlayButtonDisplayed) ||
      (currentButtonIndex === 3 && isPlayButtonDisplayed)
    ) {
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
