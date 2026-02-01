window.focusManager = (function() {
  // CONSTANTS

  var TOTAL_ELEMENTS_BY_LINE = 5;

  // VARIABLES

  var lastFocusedButtonId = window.Overlay.OVERLAY_BUTTONS['pause-button'];
  var lastFocusedCardIndex = 0;

  // HELPERS

  /**
   * Display the focused element at the center of the screen
   *
   * @param {HTMLElement} element
   * @returns {void}
   */
  function scrollToElement(element) {
    var elementRect = element.getBoundingClientRect();

    // If the element is already fully visible, do nothing
    if (elementRect.top >= 0 && elementRect.bottom <= window.innerHeight) return;

    var absoluteElementTop = elementRect.top + window.pageYOffset;
    var middleOfScreen = window.innerHeight / 2;
    var elementMiddle = elementRect.height / 2;
    var scrollTop = absoluteElementTop - middleOfScreen + elementMiddle;

    // Limit scrollTop to the document bounds
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    var clampedScrollTop = Math.max(0, Math.min(scrollTop, maxScroll));

    window.helpers.smoothScrollTo(clampedScrollTop);
  }

  /**
   * Focus the given element and blur from the previously focused one
   * Also manage the `current-focused` class
   *
   * @param {HTMLElement} element 
   * @returns {void}
   */
  function focusElement(element, shouldPreventScroll = true) {
    var classNameFocused = 'current-focused';

    if (document.activeElement.classList.contains('movie-card')) {
      var currentFocusedImage = document.activeElement.getElementsByClassName('card-image')[0];
      document.activeElement.blur();
      currentFocusedImage.classList.remove(classNameFocused);
    }

    var focusedImage = element.getElementsByClassName('card-image')[0];
    element.focus({ preventScroll: shouldPreventScroll });
    focusedImage.classList.add(classNameFocused);
    scrollToElement(element);
  }

  /**
   * Focus a card id based on the given indexes to add and remove
   *
   * @param {{indexToAdd: number, indexToRemove: number}} param0
   * @returns 
   */
  function focusCard({ indexToAdd, indexToRemove }) {
    if (!document.activeElement) {
      console.info('🕵️‍♂️ No element is currently focused.');
      return;
    }

    var totalElementsLength = window.externalStorage.externalStorageElements.length;
    var currentElementId = document.activeElement.id;
    var indexToFocus = parseInt(currentElementId.split('movie-card-')[1]) + indexToAdd - indexToRemove;

    if (indexToFocus < 0) {
      // Focus the first element
      indexToFocus = 0;
    } else if (indexToFocus >= totalElementsLength) {
      // Focus the last element
      indexToFocus = totalElementsLength - 1;
    }

    var elementToFocus = document.getElementById('movie-card-' + indexToFocus);

    if (elementToFocus) {
      var customEvent =
        new CustomEvent(window.CUSTOM_EVENTS.FOCUS_ELEMENT, { detail: elementToFocus });
      lastFocusedCardIndex = indexToFocus;
      window.dispatchEvent(customEvent);
    } else {
      console.error('❌ Impossible to focus the next element');
    }
  }

  /**
   * Focus a button in the overlay based on the given indexes to add and remove
   *
   * @param {{indexToAdd: number, indexToRemove: number}} param0
   * @returns {void}
   */
  function focusButton({ indexToAdd, indexToRemove }) {
    var currentButtonElement = document.activeElement;
    var overlayButtons = Object.keys(window.Overlay.OVERLAY_BUTTONS);
    var currentButtonIndex = overlayButtons.indexOf(currentButtonElement.id);
    var nextButtonIndex = currentButtonIndex + indexToAdd - indexToRemove;

    if (nextButtonIndex >= 0 && nextButtonIndex < overlayButtons.length) {
      var nextButtonElement = document.getElementById(overlayButtons[nextButtonIndex]);
      currentButtonElement.blur();
      nextButtonElement.focus();
    }
  }

  // ACTIONS

  /**
   * Focus the next element in the list
   *
   * @returns {void}
   */
  function focusNextCard() {
    focusCard.call(this, { indexToAdd: 1, indexToRemove: 0 });
  }

  /**
   * Focus the previous element in the list
   *
   * @returns {void}
   */
  function focusPreviousCard() {
    focusCard.call(this, { indexToAdd: 0, indexToRemove: 1 });
  }

  /**
   * Focus the next line element in the list
   *
   * @returns {void}
   */
  function focusNextLineCard() {
    focusCard.call(this, { indexToAdd: TOTAL_ELEMENTS_BY_LINE, indexToRemove: 0 });
  }

  /**
   * Focus the next line element in the list
   *
   * @returns {void}
   */
  function focusPreviousLineCard() {
    focusCard.call(this, { indexToAdd: 0, indexToRemove: TOTAL_ELEMENTS_BY_LINE });
  }

  /**
   * Focus the next button in the overlay based on the current focused button
   *
   * @returns {void}
   */
  function focusNextButton() {
    var currentButtonElement = document.activeElement;
    var barElement = document.getElementById(window.Overlay.OVERLAY_BAR_ID);

    if (barElement === currentButtonElement) {
      var customEvent = new CustomEvent(window.CUSTOM_EVENTS.PLAYER_FAST_FORWARD);
      window.dispatchEvent(customEvent);
      return;
    }

    var overlayButtons = Object.keys(window.Overlay.OVERLAY_BUTTONS);
    var currentButtonIndex = overlayButtons.indexOf(currentButtonElement.id);
    var isPauseButtonDisplayed = document.getElementById('pause-button').style.display !== 'none';
    var indexToAdd = 1;

    if (
      (currentButtonIndex === 0 && isPauseButtonDisplayed)
      || (currentButtonIndex === 1 && !isPauseButtonDisplayed)
    ) {
      // A simple hack to skip the pause button when going back from the speed button
      indexToAdd = 2;
    }

    focusButton.call(this, { indexToAdd: indexToAdd, indexToRemove: 0 });
  }

  /**
   * Focus the previous button in the overlay based on the current focused button
   *
   * @returns {void}
   */
  function focusPreviousButton() {
    var currentButtonElement = document.activeElement;
    var barElement = document.getElementById(window.Overlay.OVERLAY_BAR_ID);

    if (barElement === currentButtonElement) {
      var customEvent = new CustomEvent(window.CUSTOM_EVENTS.PLAYER_REWIND);
      window.dispatchEvent(customEvent);
      return;
    }

    var overlayButtons = Object.keys(window.Overlay.OVERLAY_BUTTONS);
    var currentButtonIndex = overlayButtons.indexOf(currentButtonElement.id);
    var isPlayButtonDisplayed = document.getElementById('play-button').style.display !== 'none';
    var indexToRemove = 1;

    if (
      (currentButtonIndex === 2 && !isPlayButtonDisplayed)
      || (currentButtonIndex === 3 && isPlayButtonDisplayed)
    ) {
      // A simple hack to skip the play button when going back from the speed button
      indexToRemove = 2;
    }

    focusButton.call(this, { indexToAdd: 0, indexToRemove: indexToRemove });
  }

  /**
   * Focus the overlay bar from the current focused button
   *
   * @returns {void}
   */
  function focusBar() {
    var currentButtonElement = document.activeElement;
    lastFocusedButtonId = currentButtonElement.id;
    var barElement = document.getElementById(window.Overlay.OVERLAY_BAR_ID);

    currentButtonElement.blur();
    barElement.focus();
  }

  /**
   * Focus the overlay buttons from the bar
   *
   * @returns {void}
   */
  function focusButtons() {
    var barElement = document.getElementById(window.Overlay.OVERLAY_BAR_ID);
    var lastFocusedButtonElement = document.getElementById(lastFocusedButtonId);

    barElement.blur();
    lastFocusedButtonElement.focus();
  }

  // CUSTOM EVENT LISTENERS

  window.addEventListener(window.CUSTOM_EVENTS.FOCUS_ELEMENT, function(event) {
    var elementToFocus = event.detail;

    if (elementToFocus) {
      focusElement.call(this, elementToFocus);
    }
  });

  window.addEventListener(window.CUSTOM_EVENTS.PLAYER_STOPPED, function() {
    // When the player is stopped, focus back the last focused card
    var lastFocusedCard = document.getElementById(
      'movie-card-' + lastFocusedCardIndex
    );

    if (lastFocusedCard) {
      focusElement.call(this, lastFocusedCard, false);
    }
  });

  // RETURN PUBLIC METHODS

  return {
    actions: {
      focusBar: focusBar,
      focusButtons: focusButtons,
      focusNextButton: focusNextButton,
      focusNextCard: focusNextCard,
      focusNextLineCard: focusNextLineCard,
      focusPreviousButton: focusPreviousButton,
      focusPreviousCard: focusPreviousCard,
      focusPreviousLineCard: focusPreviousLineCard,
    },
  }
})();
