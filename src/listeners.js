(function() {
  // CONSTANTS
  var KEY_CODES = {
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

  // VARIABLES

  var isPlayerActive = false;
  var currentPlayingIndex = -1;

  // FUNCTIONS

  /**
   * Hide the main app element
   *
   * @returns {void}
   */
  function hideAppElement() {
    var appElement = document.getElementById('app');

    appElement.style.display = 'none';
  }

  /**
   * Try to play the given content by its index
   * If the given content is a file, we use the AVPlayer
   * Otherwise, we use the VideoPlayer
   * @param {number} index - element index
   *
   * @returns {void}
   */
  function playContentWithIndex(index) {
    var totalElements = window.externalStorage.externalStorageElements.length;

    // Boundary checks
    if (index < 0 || index >= totalElements) {
      console.warn('⚠️ Index out of bounds:', index);
      return;
    }

    var elementToPlay = window.externalStorage.externalStorageElements[index];
    var url = "./mocks/videos/long_video.mp4"; // Fallback URL
    // var url = "./mocks/videos/video_10s_with_sound.mp4"; // Fallback URL
    var customEvent = new CustomEvent(window.CUSTOM_EVENTS.CREATE_VIDEO_PLAYER, { detail: { url: url } });

    if (elementToPlay && elementToPlay.isFile) {
      url = elementToPlay.toURI();
      customEvent = new CustomEvent(window.CUSTOM_EVENTS.CREATE_AV_PLAYER, { detail: { url: url } });
    }

    currentPlayingIndex = index;
    window.dispatchEvent(customEvent);
  }

  /**
   * Play the next content in the list
   *
   * @returns {void}
   */
  function playNextContent() {
    if (currentPlayingIndex === -1) {
      console.warn('⚠️ No content is currently playing');
      return;
    }

    var totalElements = window.externalStorage.externalStorageElements.length;
    var nextIndex = currentPlayingIndex + 1;

    if (nextIndex >= totalElements) {
      console.info('ℹ️ Already at the last content');
      return;
    }

    // Stop current player before playing next
    var stopEvent = new CustomEvent(window.CUSTOM_EVENTS.PLAYER_KILL);
    window.dispatchEvent(stopEvent);

    // Small delay to ensure the player is fully stopped
    setTimeout(function() {
      playContentWithIndex(nextIndex);
    }, 100);
  }

  /**
   * Play the previous content in the list
   *
   * @returns {void}
   */
  function playPreviousContent() {
    if (currentPlayingIndex === -1) {
      console.warn('⚠️ No content is currently playing');
      return;
    }

    var previousIndex = currentPlayingIndex - 1;

    if (previousIndex < 0) {
      console.info('ℹ️ Already at the first content');
      return;
    }

    // Stop current player before playing previous
    var stopEvent = new CustomEvent(window.CUSTOM_EVENTS.PLAYER_KILL);
    window.dispatchEvent(stopEvent);

    // Small delay to ensure the player is fully stopped
    setTimeout(function() {
      playContentWithIndex(previousIndex);
    }, 100);
  }

  /**
   * Show the main app element
   *
   * @returns {void}
   */
  function showAppElement() {
    var appElement = document.getElementById('app');

    appElement.style.display = 'inline';
  }

  // CUSTOM EVENTS LISTENERS

  window.addEventListener(window.CUSTOM_EVENTS.CREATE_AV_PLAYER, function() {
    hideAppElement();
    isPlayerActive = true;
  });

  window.addEventListener(window.CUSTOM_EVENTS.CREATE_VIDEO_PLAYER, function() {
    hideAppElement();
    isPlayerActive = true;
  });

  window.addEventListener(window.CUSTOM_EVENTS.PLAYER_STOPPED, function() {
    showAppElement();
    isPlayerActive = false;
    currentPlayingIndex = -1;
  });

  window.addEventListener(window.CUSTOM_EVENTS.PLAYER_NEXT, function() {
    playNextContent();
  });

  window.addEventListener(window.CUSTOM_EVENTS.PLAYER_PREVIOUS, function() {
    playPreviousContent();
  });

  // JS EVENTS LISTENERS

  document.addEventListener('visibilitychange', function () {
    var playerState = webapis.avplay.getState();

    if (document.hidden) {
      if (playerState === 'READY' || playerState === 'PLAYING' || playerState === 'PAUSED') {
        webapis.avplay.suspend();
        console.info('Player is suspended ...');
      }
    } else {
      if (playerState === 'NONE' || playerState === 'PLAYING' || playerState === 'PAUSED') {
        webapis.avplay.restore();
        console.info('... Player is restored');
      }
    }
  });

  window.addEventListener('keydown', function (event) {
    event.preventDefault();
    event.stopPropagation();

    if (isPlayerActive) {
      window.dispatchEvent(new CustomEvent(window.CUSTOM_EVENTS.SHOW_OVERLAY));
    }

    switch (event.keyCode) {
      case KEY_CODES.right:
        if (isPlayerActive) {
          window.focusManager.actions.focusNextButton();
          break;
        }
        window.focusManager.actions.focusNextCard();
        break;
      case KEY_CODES.left:
        if (isPlayerActive) {
          window.focusManager.actions.focusPreviousButton();
          break;
        }
        window.focusManager.actions.focusPreviousCard();
        break;
      case KEY_CODES.up:
        if (isPlayerActive) {
          window.focusManager.actions.focusBar();
          break;
        }
        window.focusManager.actions.focusPreviousLineCard();
        break;
      case KEY_CODES.down:
        if (isPlayerActive) {
          window.focusManager.actions.focusButtons();
          break;
        }
        window.focusManager.actions.focusNextLineCard();
        break;
      case KEY_CODES.enter:
        if (isPlayerActive) {
          var customEvent = new CustomEvent(window.CUSTOM_EVENTS.PLAYER_TOGGLE_BUTTON);
          window.dispatchEvent(customEvent);
        } else {
          var elementToPlayIndex = parseInt(document.activeElement.id.split('movie-card-')[1]);
          playContentWithIndex(elementToPlayIndex);
        }
        break;
      case KEY_CODES.return:
      case KEY_CODES.back:
        if (isPlayerActive) {
          var customEvent = new CustomEvent(window.CUSTOM_EVENTS.PLAYER_KILL);
          window.dispatchEvent(customEvent);
        }
        break;
      case KEY_CODES.fastForward:
        if (isPlayerActive) {
          var customEvent = new CustomEvent(window.CUSTOM_EVENTS.PLAYER_FAST_FORWARD);
          window.dispatchEvent(customEvent);
        }
        break;
      case KEY_CODES.rewind:
        if (isPlayerActive) {
          var customEvent = new CustomEvent(window.CUSTOM_EVENTS.PLAYER_REWIND);
          window.dispatchEvent(customEvent);
        }
        break;

      default:
        console.warn('⚠️ Unhandled key:', event.code, event.keyCode);
    }
  }, false);

  window.addEventListener('keyup', function (event) {
    switch (event.keyCode) {
      case KEY_CODES.fastForward:
      case KEY_CODES.right:
        if (isPlayerActive) {
          window.dispatchEvent(new CustomEvent(window.CUSTOM_EVENTS.PLAYER_STOP_FAST_FORWARD));
        }
        break;

      case KEY_CODES.rewind:
      case KEY_CODES.left:
        if (isPlayerActive) {
          window.dispatchEvent(new CustomEvent(window.CUSTOM_EVENTS.PLAYER_STOP_REWIND));
        }
        break;
    }
  }, false);

  console.info('👂 Listeners initialized');
})();
