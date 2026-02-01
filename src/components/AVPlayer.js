window.AVPlayer = (function() {
  // CONSTANTS

  var AVAILABLE_SPEEDS = [1, 1.25, 1.5, 1.75, 2];
  var AV_VIDEO_CLASS_NAME = 'av-player';
  var PLAYER_STATES = {
    IDLE: 'IDLE',
    NONE: 'NONE',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    READY: 'READY'
  };
  /**
   * Progressive seek configuration
   * holdTime: time (in ms) the key has been held to reach this level
   * jump: amount of milliseconds to jump at this level
   */
  var SEEK_LEVELS = [
    { holdTime: 0, jump: 10000 },
    { holdTime: 3000, jump: 60000 },
    { holdTime: 6000, jump: 180000 },
    { holdTime: 9000, jump: 350000 },
    { holdTime: 12000, jump: 600000 },
  ];

  // VARIABLES

  var currentSpeed = 1;
  var currentTime = 0;
  var videoDuration = 0;
  var seekStartTime = null;
  var seekInterval = null;
  var currentSeekDirection = null;

  // FUNCTIONS

  /**
   * Get current player state based on webapis.avplay
   *
   * @returns {Object}
   */
  function getState() {
    return webapis.avplay.getState();
  }

  /**
   * Try to play a content depending on the current player state
   *
   * @returns {void}
   */
  function play() {
    try {
      switch (getState()) {
        case PLAYER_STATES.IDLE:
        case PLAYER_STATES.NONE:
          webapis.avplay.prepareAsync(function() {
          videoDuration = webapis.avplay.getDuration() || 0;
          onLoadedMetadata();

          play();
        }, console.error);
          break;
        case PLAYER_STATES.READY:
        case PLAYER_STATES.PAUSED:
          webapis.avplay.play();
          break;
        default:
          console.warn('⚠️ Unhandled state');
          break;
      }
    } catch (error) {
      console.error('❌ ', error.message);
    }
  }

  /**
   * Try to pause a content depending on the current player state
   *
   * @returns {void}
   */
  function pause() {
    var playerState = getState();

    if (playerState === PLAYER_STATES.PLAYING || playerState === PLAYER_STATES.READY) {
      webapis.avplay.pause();
    } else {
      console.warn('⏸️ Pause not allowed in current state: ' + playerState);
    }
  }

  /**
   * Play or pause the content depending on the current player state
   *
   * @returns {void}
   */
  function playPause() {
    if (getState() === PLAYER_STATES.PLAYING) {
      pause();
    } else {
      play();
    }
  }

  /**
   * Change playback speed
   * Cycles through AVAILABLE_SPEEDS array
   *
   * @returns {void}
   */
  function changeSpeed() {
    var playerState = getState();

    if (playerState !== PLAYER_STATES.PLAYING && playerState !== PLAYER_STATES.PAUSED) {
      console.warn('⚠️⏱️ Speed change not allowed in current state: ' + playerState);
      return;
    }

    var currentIndex = AVAILABLE_SPEEDS.indexOf(currentSpeed);
    var nextIndex = (currentIndex + 1) % AVAILABLE_SPEEDS.length;
    var newSpeed = AVAILABLE_SPEEDS[nextIndex];

    try {
      webapis.avplay.setSpeed(newSpeed);
      currentSpeed = newSpeed;
      console.info('⏱️ Playback speed changed to: ' + newSpeed + 'x');
    } catch (error) {
      console.error('❌ Failed to change speed: ' + error.message);
    }
  }

  /**
   * Stop the current seek operation
   *
   * @returns {void}
   */
  function stopSeek() {
    if (seekInterval) {
      clearInterval(seekInterval);
      seekInterval = null;
    }
    seekStartTime = null;
    currentSeekDirection = null;
  }

  /**
   * Stop fast forward (called on keyup)
   *
   * @returns {void}
   */
  function stopFastForward() {
    if (currentSeekDirection === 'forward') {
      stopSeek();
    }
  }

  /**
   * Stop rewind (called on keyup)
   *
   * @returns {void}
   */
  function stopRewind() {
    if (currentSeekDirection === 'backward') {
      stopSeek();
    }
  }

  /**
   * Start fast forward (called on keydown)
   *
   * @returns {void}
   */
  function fastForward() {
    startSeek('forward');
  }

  /**
   * Start rewind (called on keydown)
   *
   * @returns {void}
   */
  function rewind() {
    startSeek('backward');
  }

  /**
   * Try to stop a content depending on the current player state
   *
   * @returns {void}
   */
  function stop() {
    var playerState = getState();
    currentSpeed = 1;

    if (playerState === PLAYER_STATES.PLAYING || playerState === PLAYER_STATES.PAUSED) {
      webapis.avplay.stop();

      currentTime = 0;
    } else {
      console.warn('⏹️ Stop not allowed in current state: ' + playerState);
    }

    window.removeEventListener(window.CUSTOM_EVENTS.PLAYER_CHANGE_SPEED, changeSpeed);
    window.removeEventListener(window.CUSTOM_EVENTS.PLAYER_FAST_FORWARD, fastForward);
    window.removeEventListener(window.CUSTOM_EVENTS.PLAYER_KILL, stop);
    window.removeEventListener(window.CUSTOM_EVENTS.PLAYER_PLAY_PAUSE, playPause);
    window.removeEventListener(window.CUSTOM_EVENTS.PLAYER_REWIND, rewind);
    window.removeEventListener(window.CUSTOM_EVENTS.PLAYER_STOP_FAST_FORWARD, stopFastForward);
    window.removeEventListener(window.CUSTOM_EVENTS.PLAYER_STOP_REWIND, stopRewind);

    stopSeek();
    document.getElementById(AV_VIDEO_CLASS_NAME).style.display = 'none';

    var customEvent = new CustomEvent(window.CUSTOM_EVENTS.PLAYER_STOPPED);
    window.dispatchEvent(customEvent);
  }

  /**
   * Get the current jump amount based on how long the key has been held
   *
   * @returns {number} - jump amount in milliseconds
   */
  function getCurrentJumpAmount() {
    if (!seekStartTime) {
      return SEEK_LEVELS[0].jump;
    }

    var holdDuration = Date.now() - seekStartTime;

    for (var i = SEEK_LEVELS.length - 1; i >= 0; i--) {
      if (holdDuration >= SEEK_LEVELS[i].holdTime) {
        return SEEK_LEVELS[i].jump;
      }
    }

    return SEEK_LEVELS[0].jump;
  }

  /**
   * Start progressive seek in the given direction
   *
   * @param {string} direction - 'forward' or 'backward'
   * @returns {void}
   */
  function startSeek(direction) {
    if (currentSeekDirection === direction) {
      return;
    }

    stopSeek();
    currentSeekDirection = direction;
    seekStartTime = Date.now();

    performSeek(direction);

    seekInterval = setInterval(function() {
      performSeek(direction);
    }, 500);
  }

  /**
   * Perform a single seek operation in the given direction
   *
   * @param {string} direction - 'forward' or 'backward'
   * @returns {void}
   */
  function performSeek(direction) {
    var jumpAmount = getCurrentJumpAmount();

    if (direction === 'forward') {
      var newTime = currentTime + jumpAmount;

      if (newTime > videoDuration) {
        newTime = videoDuration;
      }

      try {
        webapis.avplay.jumpForward(jumpAmount);
        currentTime = newTime;
        console.info('⏩ Fast forward: +' + (jumpAmount / 1000) + 's');
      } catch (error) {
        console.error('❌⏩ Failed fast forwarding: ' + error.message);
      }
    } else {
      var newTime = currentTime - jumpAmount;

      if (newTime < 0) {
        newTime = 0;
      }

      try {
        webapis.avplay.jumpBackward(jumpAmount);
        currentTime = newTime;
        console.info('⏪ Rewind: -' + (jumpAmount / 1000) + 's');
      } catch (error) {
        console.error('❌⏪ Failed rewinding: ' + error.message);
      }
    }
  }

  /**
   * Handle loaded metadata to set duration
   *
   * @returns {void}
   */
  function onLoadedMetadata() {
    var durationElement = document.getElementById('overlay-time-duration');
    var currentTimeElement = document.getElementById('overlay-time-current');
    var progressBar = document.getElementById('overlay-bar');

    if (durationElement) {
      var durationInSeconds = videoDuration / 1000;
      durationElement.textContent = window.helpers.formatTime(durationInSeconds);
    }

    if (currentTimeElement) {
      currentTimeElement.textContent = window.helpers.formatTime(0);
    }

    if (progressBar) {
      progressBar.value = 0;
    }
  }

  /**
   * Handle time update event
   *
   * @returns {void}
   */
  function onTimeUpdate() {
    var currentTimeElement = document.getElementById('overlay-time-current');
    var progressBar = document.getElementById('overlay-bar');
    var progressBarIndicator = document.getElementById('overlay-bar-time');

    if (currentTimeElement) {
      var currentTimeInSeconds = currentTime / 1000;
      currentTimeElement.textContent = window.helpers.formatTime(currentTimeInSeconds);
    }

    if (progressBar && videoDuration) {
      var percentage = (currentTime / videoDuration) * 100;
      progressBar.value = percentage;

      // Calculate position: 80px offset + percentage of available width
      // Available width = container width - 160px (2x 80px for time elements)
      if (progressBarIndicator && progressBar.offsetWidth) {
        var barWidth = progressBar.offsetWidth;
        var leftPosition = 80 + (percentage / 100) * barWidth;
        progressBarIndicator.style.left = leftPosition + 'px';
      }
    }
  }

  /**
   * Creates a new player instance
   *
   * @param {Element} config.playerEl - element of type <object> that player will play in
   * @param {String} config.url - video url
   * @param {Element} config.controls - element containing controls for the player
   * @param {Object} [config.logger] - custom logger object
   * @param {Boolean} [config.set4KMode] - flag defining whether 4K mode should be set
   *
   * @returns {Object} - player instance
   */
  function create(avParams) {
    /**
     * Try to initialize fullscreen mode
     *
     * @returns {void}
     */
    function initializeFullscreenMode() {
      try {
        webapis.avplay.setDisplayRect(0, 0, 1920, 1080);
        webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_FULL_SCREEN');
      } catch (error) {
        console.warn('⚠️ Fullscreen initialization failed: ' + error.message);
      }
    }

    try {
      webapis.avplay.open(avParams.url);

      webapis.avplay.setListener({
        onbufferingstart: function() {
          console.info('⏳ Buffering complete', webapis.avplay.getDuration());
        },
        onstreamcompleted: function() {
          console.info('✅ Stream complete');
          stop();
        },
        oncurrentplaytime: function(time) {
          currentTime = time;
          onTimeUpdate();
        },
        onerror: function(eventType) {
          console.error('❌ Event type error : ' + eventType);
        },
      });

      webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_AUTO_ASPECT_RATIO');

      if (
        webapis &&
        webapis.productinfo &&
        typeof webapis.productinfo.isUhdPanelSupported === 'function' &&
        webapis.productinfo.isUhdPanelSupported()
      ) {
        console.info('🖥️ 4K panel detected, enabling 4K mode');
        try {
          webapis.avplay.setStreamingProperty('SET_MODE_4K', 'true');
        } catch (e) {
          console.warn('⚠️🖥️ 4K mode not supported or failed: ' + e.message);
        }
      }

      initializeFullscreenMode();
    } catch (error) {
      console.error('❌ AVPlayer error:', error);
    }

    // CUSTOM EVENTS LISTENERS
    window.addEventListener(window.CUSTOM_EVENTS.PLAYER_CHANGE_SPEED, changeSpeed);
    window.addEventListener(window.CUSTOM_EVENTS.PLAYER_FAST_FORWARD, fastForward);
    window.addEventListener(window.CUSTOM_EVENTS.PLAYER_KILL, stop);
    window.addEventListener(window.CUSTOM_EVENTS.PLAYER_PLAY_PAUSE, playPause);
    window.addEventListener(window.CUSTOM_EVENTS.PLAYER_REWIND, rewind);
    window.addEventListener(window.CUSTOM_EVENTS.PLAYER_STOP_FAST_FORWARD, stopFastForward);
    window.addEventListener(window.CUSTOM_EVENTS.PLAYER_STOP_REWIND, stopRewind);
  }

  // CUSTOM EVENT LISTENERS

  window.addEventListener(window.CUSTOM_EVENTS.CREATE_AV_PLAYER, function(event) {
    var avPlayerElement = document.getElementById(AV_VIDEO_CLASS_NAME);

    if (!avPlayerElement) {
      console.error('❌ AVPlayer element not found');
      return;
    }

    avPlayerElement.style.display = 'inline';

    create({ url: event.detail.url });
    play();
  });
}());