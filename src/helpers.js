window.helpers = {
  /**
   * Clean the movie name from the filename
   *
   * @param {String} filename
   * @returns {String}
   */
  cleanMovieName: function(filename) {
    return filename.replace('._', '').slice(0, filename.indexOf(') - '));
  },

  /**
   * Format seconds to MM:SS or H:MM:SS
   *
   * @param {number} seconds
   * @returns {string}
   */
  formatTime: function(seconds) {
    if (isNaN(seconds)) {
      return '00:00';
    }

    var hours = Math.floor(seconds / 3600);
    var formattedHours = hours > 0 ? `${hours}:` : '';

    var minutes = Math.floor((seconds % 3600) / 60);
    var formattedMinutes = (minutes < 10 ? '0' : '') + minutes;

    var secs = Math.floor(seconds % 60);
    var formattedSeconds = (secs < 10 ? '0' : '') + secs

    return `${formattedHours}${formattedMinutes}:${formattedSeconds}`;
  },

  /**
   * Smoothly scroll the window to the given Y position
   * This function polls the scrollTo smooth behavior (which is not supported on old Tizen)
   * 
   * This code is based on smoothscroll-polyfill package
   * https://github.com/iamdustan/smoothscroll/blob/master/src/smoothscroll.js
   *
   * @param {number} targetY - target Y position to scroll to
   * @returns {void}
   */
  smoothScrollTo: function(targetY) {
    var duration = 200; // duration in ms

    function step(context) {
      var time = Date.now();
      var elapsed = (time - context.startTime) / duration;

      // avoid elapsed times higher than one
      elapsed = elapsed > 1 ? 1 : elapsed;

      // apply easing to elapsed time
      var value = 0.5 * (1 - Math.cos(Math.PI * elapsed));
      var currentY = context.startY + (context.targetY - context.startY) * value;

      window.scrollTo(0, currentY);

      // scroll more if we have not reached our destination
      if (currentY !== context.targetY) {
        requestAnimationFrame(step.bind(window, context));
      }
    }

    step({
      startTime: Date.now(),
      startY: window.scrollY || window.pageYOffset,
      targetY: targetY
    });
  },

  /**
   * Sort two strings based on their name
   *
   * @param {String} firstString
   * @param {String} secondString.name
   * @returns {number}
   */
  sortByName: function(firstString, secondString) {
    const nameA = firstString.toLowerCase();
    const nameB = secondString.toLowerCase();

    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;

    return 0;
  },
};