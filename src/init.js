(function() {
  /**
   * Handle the externalStorageCharged event
   * This function displays the movie cards once the external storage elements are loaded
   * It also tries to focus the first element
   *
   * @returns {void}
   */
  function onExternalStorageCharged() {
    var parentElement = document.getElementById('app');

    window.Cards.display(parentElement, window.externalStorage.externalStorageElements);

    // Focus the first element by default
    var firstElement = document.getElementById('movie-card-0');

    if (firstElement) {
      var customEvent =
        new CustomEvent(window.CUSTOM_EVENTS.FOCUS_ELEMENT, { detail: firstElement });
      window.dispatchEvent(customEvent);
    } else {
      console.error('❌ None elements are focusable.');
    }

    // Remove the event listener to avoid multiple calls
    document.removeEventListener(window.CUSTOM_EVENTS.EXTERNAL_STORAGE_CHARGED, onExternalStorageCharged);
  }

  window.addEventListener(window.CUSTOM_EVENTS.EXTERNAL_STORAGE_CHARGED, onExternalStorageCharged);

  window.externalStorage.getElementsFromExternalStorage();

  // Load SVGs for overlay buttons
  window.Overlay.initButtons();
})();