window.VideoPlayer = (function() {
  // CONSTANTS

  var AVAILABLE_SPEEDS = [1, 1.25, 1.5, 1.75, 2];
  var VIDEO_CLASS_NAME = 'video-player';
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
   * jump: amount of seconds to jump at this level
   */
  var SEEK_LEVELS = [
    { holdTime: 0, jump: 10 },
    { holdTime: 3000, jump: 60 },
    { holdTime: 6000, jump: 180 },
    { holdTime: 9000, jump: 350 },
    { holdTime: 12000, jump: 600 },
  ];

  // VARIABLES

  var currentSpeed = 1;
  var videoElement = null;
  var seekStartTime = null;
  var seekInterval = null;
  var currentSeekDirection = null;

  // FUNCTIONS

  /**
   * Get current player state based on video element properties
   *
   * @returns {String}
   */
  function getState() {
    if (!videoElement || !videoElement.src) {
      return PLAYER_STATES.IDLE;
    }

    if (videoElement.readyState < 3) {
      return PLAYER_STATES.READY;
    }

    if (videoElement.paused) {
      return PLAYER_STATES.PAUSED;
    }

    return PLAYER_STATES.PLAYING;
  }

  /**
   * Try to play a content
   *
   * @returns {void}
   */
  function play() {
    if (!videoElement) {
      console.warn('🕵️‍♂️ Video element not initialized');
      return;
    }

    videoElement.play();
  }

  /**
   * Try to pause a content
   *
   * @returns {void}
   */
  function pause() {
    if (!videoElement) {
      console.warn('🕵️‍♂️ Video element not initialized');
      return;
    }

    if (!videoElement.paused) {
      videoElement.pause();
    } else {
      console.warn('⏸️ Video is already paused');
    }
  }

  /**
   * Play or pause the content depending on the current player state
   *
   * @returns {void}
   */
  function playPause() {
    if (!videoElement) {
      console.warn('🕵️‍♂️ Video element not initialized');
      return;
    }

    if (videoElement.paused) {
      play();
    } else {
      pause();
    }
  }

  /**
   * Change playback speed
   * Cycles through AVAILABLE_SPEEDS array
   * Audio is preserved at all speeds
   *
   * @returns {void}
   */
  function changeSpeed() {
    if (!videoElement) {
      console.warn('🕵️‍♂️ Video element not initialized');
      return;
    }

    var playerState = getState();

    if (playerState !== PLAYER_STATES.PLAYING && playerState !== PLAYER_STATES.PAUSED) {
      console.warn('⏱️ Speed change not allowed in current state: ' + playerState);
      return;
    }

    var currentIndex = AVAILABLE_SPEEDS.indexOf(currentSpeed);
    var nextIndex = (currentIndex + 1) % AVAILABLE_SPEEDS.length;
    var newSpeed = AVAILABLE_SPEEDS[nextIndex];

    videoElement.playbackRate = newSpeed;
    currentSpeed = newSpeed;
    console.info('⏱️ Playback speed changed to: ' + newSpeed + 'x');
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
   * Try to stop a content
   *
   * @returns {void}
   */
  function stop() {
    videoElement.pause();
    videoElement.currentTime = 0;
    videoElement.src = '';
    currentSpeed = 1;

    // JS EVENTS LISTENERS REMOVAL
    videoElement.removeEventListener('ended', onPlayerEnded);
    videoElement.removeEventListener('error', onPlayerError);
    videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
    videoElement.removeEventListener('timeupdate', onTimeUpdate);

    // CUSTOM EVENTS REMOVAL
    window.removeEventListener(window.CUSTOM_EVENTS.PLAYER_CHANGE_SPEED, changeSpeed);
    window.removeEventListener(window.CUSTOM_EVENTS.PLAYER_FAST_FORWARD, fastForward);
    window.removeEventListener(window.CUSTOM_EVENTS.PLAYER_KILL, stop);
    window.removeEventListener(window.CUSTOM_EVENTS.PLAYER_PLAY_PAUSE, playPause);
    window.removeEventListener(window.CUSTOM_EVENTS.PLAYER_REWIND, rewind);
    window.removeEventListener(window.CUSTOM_EVENTS.PLAYER_STOP_FAST_FORWARD, stopFastForward);
    window.removeEventListener(window.CUSTOM_EVENTS.PLAYER_STOP_REWIND, stopRewind);

    stopSeek();
    document.getElementById(VIDEO_CLASS_NAME).style.display = 'none';

    var customEvent = new CustomEvent(window.CUSTOM_EVENTS.PLAYER_STOPPED);
    window.dispatchEvent(customEvent);
  }

  /**
   * Get the current jump amount based on how long the key has been held
   *
   * @returns {number} - jump amount in seconds
   */
  function getCurrentJumpAmount() {
    if (!seekStartTime) {
      return SEEK_LEVELS[0].jump;
    }

    var holdDuration = Date.now() - seekStartTime;

    for (var seekIndex = SEEK_LEVELS.length - 1; seekIndex >= 0; seekIndex--) {
      if (holdDuration >= SEEK_LEVELS[seekIndex].holdTime) {
        return SEEK_LEVELS[seekIndex].jump;
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
      var newTime = videoElement.currentTime + jumpAmount;

      if (newTime > videoElement.duration) {
        newTime = videoElement.duration;
      }

      videoElement.currentTime = newTime;
      console.info('⏩ Fast forward: +' + jumpAmount + 's');
    } else {
      var newTime = videoElement.currentTime - jumpAmount;

      if (newTime < 0) {
        newTime = 0;
      }

      videoElement.currentTime = newTime;
      console.info('⏪ Rewind: -' + jumpAmount + 's');
    }
  }

  /**
   * Handle video ended event
   *
   * @returns {void}
   */
  function onPlayerEnded() {
    console.info('✅ Stream complete');
    stop();
  }

  /**
   * Handle video error event
   *
   * @param {Object} error
   * @returns {void}
   */
  function onPlayerError(error) {
    if (error && error.message) {
      console.error('❌ Video error: ' + error.message);
    }
  }

  /**
   * Handle loaded metadata event to set duration
   *
   * @returns {void}
   */
  function onLoadedMetadata() {
    var currentTimeElement = document.getElementById('overlay-time-current');
    var durationElement = document.getElementById('overlay-time-duration');
    var progressBar = document.getElementById('overlay-bar');

    if (durationElement && videoElement) {
      durationElement.textContent = window.helpers.formatTime(videoElement.duration);
    }
    currentTimeElement.textContent = window.helpers.formatTime(0);
    progressBar.value = 0;
  }

  /**
   * Handle time update event from video element
   *
   * @returns {void}
   */
  function onTimeUpdate() {
    var currentTimeElement = document.getElementById('overlay-time-current');
    var progressBar = document.getElementById('overlay-bar');
    var progressBarIndicator = document.getElementById('overlay-bar-time');

    if (currentTimeElement && videoElement) {
      currentTimeElement.textContent = window.helpers.formatTime(videoElement.currentTime);
    }

    if (progressBar && videoElement && videoElement.duration) {
      var percentage = (videoElement.currentTime / videoElement.duration) * 100;
      progressBar.value = percentage;

      if (progressBarIndicator && progressBar.offsetWidth) {
        var barWidth = progressBar.offsetWidth;
        var leftPosition = 80 + (percentage / 100) * barWidth;
        progressBarIndicator.style.left = leftPosition + 'px';
      }
    }
  }

  /**
   * Creates a new player instance
   * Adds necessary event listeners
   *
   * @param {String} params.url - video url
   *
   * @returns {void}
   */
  function create(params) {
    videoElement.src = params.url;

    // JS EVENTS LISTENERS
    videoElement.addEventListener('ended', onPlayerEnded);
    videoElement.addEventListener('error', onPlayerError);
    videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
    videoElement.addEventListener('timeupdate', onTimeUpdate);

    // CUSTOM EVENTS LISTENERS
    window.addEventListener(window.CUSTOM_EVENTS.PLAYER_CHANGE_SPEED, changeSpeed);
    window.addEventListener(window.CUSTOM_EVENTS.PLAYER_FAST_FORWARD, fastForward);
    window.addEventListener(window.CUSTOM_EVENTS.PLAYER_KILL, stop);
    window.addEventListener(window.CUSTOM_EVENTS.PLAYER_PLAY_PAUSE, playPause);
    window.addEventListener(window.CUSTOM_EVENTS.PLAYER_REWIND, rewind);
    window.addEventListener(window.CUSTOM_EVENTS.PLAYER_STOP_FAST_FORWARD, stopFastForward);
    window.addEventListener(window.CUSTOM_EVENTS.PLAYER_STOP_REWIND, stopRewind);
  }

  // CUSTOM EVENTS LISTENERS

  window.addEventListener(window.CUSTOM_EVENTS.CREATE_VIDEO_PLAYER, function(event) {
    videoElement = document.getElementById(VIDEO_CLASS_NAME);

    if (!videoElement) {
      console.error('🕵️‍♂️ VideoPlayer element not found');
      return;
    }

    videoElement.style.display = 'inline';

    create({ url: event.detail.url });
    play();
  });
}());
