window.Overlay = (function() {
  // CONSTANTS

  var OVERLAY_BAR_ID = 'overlay-bar-container';
  /**
   * Buttons available in the overlay with their associated custom event
   * The order should reflect their position
   *
   * @type {Object.<string, string>}
   */
  var OVERLAY_BUTTONS = {
    'previous-button': window.CUSTOM_EVENTS.PLAYER_PREVIOUS,
    'play-button': window.CUSTOM_EVENTS.PLAYER_PLAY_PAUSE,
    'pause-button': window.CUSTOM_EVENTS.PLAYER_PLAY_PAUSE,
    'next-button': window.CUSTOM_EVENTS.PLAYER_NEXT,
    'speed-button': window.CUSTOM_EVENTS.PLAYER_CHANGE_SPEED,
  };

  // VARIABLES

  var hideDelay = 5000;
  var hideTimeout = null;
  var lastFocusedButtonId = 'pause-button';

  // FUNCTIONS

  /**
   * Initialize buttons by loading inline SVG into them
   * Also add event listeners
   *
   * @returns {void}
   */
  function initButtons() {
    var buttons = document.querySelectorAll('.overlay-button');

    Array.from(buttons).forEach(function(button) {
      var src = button.getAttribute('data-src');
      var xhr = new XMLHttpRequest();

      xhr.open('GET', src, true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
          button.innerHTML = xhr.responseText;
        } else if (xhr.readyState === 4 && xhr.status === 0) {
          // For file:// protocol, status is 0 but responseText may be OK
          if (xhr.responseText) {
            button.innerHTML = xhr.responseText;
          }
        }
      };
      xhr.onerror = function() {
        console.error('❌ Error loading SVG:', src);
      };
      xhr.send();
    });
  }

  /**
   * Reset the hide timeout
   *
   * @returns {void}
   */
  function resetTimeout() {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }

    hideTimeout = setTimeout(function() {
      hide();
      hideTimeout = null;
    }, hideDelay);
  }

  /**
   * Show the overlay and reset the hide timeout
   *
   * @returns {void}
   */
  function show(shouldFocus = false) {
    var overlayElement = document.getElementById('player-overlay');

    if (!overlayElement) {
      console.error('🕵️‍♂️ Overlay element not found');
      return;
    }

    var isOverlayHidden = overlayElement.style.display === 'none';
    overlayElement.style.display = 'inline';

    if ((isOverlayHidden || shouldFocus) && lastFocusedButtonId) {
      var lastFocusedButtonElement = document.getElementById(lastFocusedButtonId);

      if (lastFocusedButtonElement) {
        lastFocusedButtonElement.focus();
      }
    }

    resetTimeout();
  }

  /**
   * Hide the overlay
   *
   * @returns {void}
   */
  function hide() {
    var overlayElement = document.getElementById('player-overlay');

    if (!overlayElement) {
      console.error('🕵️‍♂️ Overlay element not found');
      return;
    }

    lastFocusedButtonId = document.activeElement.id;
    overlayElement.style.display = 'none';
  }

  // CUSTOM EVENTS LISTENERS

  window.addEventListener(window.CUSTOM_EVENTS.CREATE_AV_PLAYER, function() {
    show(true);
  });

  window.addEventListener(window.CUSTOM_EVENTS.CREATE_VIDEO_PLAYER, function() {
    show(true);
  });

  window.addEventListener(window.CUSTOM_EVENTS.PLAYER_STOPPED, function() {
    var overlayElement = document.getElementById('player-overlay');

    overlayElement.style.display = 'none';
  });

  window.addEventListener(window.CUSTOM_EVENTS.PLAYER_TOGGLE_BUTTON, function() {
    var buttonId = document.activeElement.id;
    var customEventName = window.Overlay.OVERLAY_BUTTONS[buttonId];

    if (!customEventName) {
      console.warn('⚠️ No custom event associated with button:', buttonId);
      return;
    }

    if (customEventName === window.CUSTOM_EVENTS.PLAYER_PLAY_PAUSE) {
      var playButton = document.getElementById('play-button');
      var pauseButton = document.getElementById('pause-button');

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

    window.dispatchEvent(new CustomEvent(customEventName));
  });

  window.addEventListener(window.CUSTOM_EVENTS.SHOW_OVERLAY, function() {
    show();
  });

  // RETURNS

  return {
    initButtons: initButtons,
    OVERLAY_BAR_ID: OVERLAY_BAR_ID,
    OVERLAY_BUTTONS: OVERLAY_BUTTONS,
  };
}());