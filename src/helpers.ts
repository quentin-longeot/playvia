interface ScrollContext {
  startTime: number;
  startY: number;
  targetY: number;
}

/**
 * Clean the movie name from the filename
 */
export const cleanMovieName = (filename: string): string => {
  const regex = /^(.+?\(\d{4}\)).*$/;
  return filename.replace(regex, '$1');
}

/**
 * Format seconds to MM:SS or H:MM:SS
 */
export const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) {
    return '00:00';
  }

  const hours = Math.floor(seconds / 3600);
  const formattedHours = hours > 0 ? `${hours}:` : '';

  const minutes = Math.floor((seconds % 3600) / 60);
  const formattedMinutes = (minutes < 10 ? '0' : '') + minutes;

  const secs = Math.floor(seconds % 60);
  const formattedSeconds = (secs < 10 ? '0' : '') + secs;

  return `${formattedHours}${formattedMinutes}:${formattedSeconds}`;
}

/**
 * Smoothly scroll the window to the given Y position
 * This function polls the scrollTo smooth behavior (which is not supported on old Tizen)
 *
 * This code is based on smoothscroll-polyfill package
 * https://github.com/iamdustan/smoothscroll/blob/master/src/smoothscroll.js
 */
export const smoothScrollTo = (targetY: number): void => {
  const duration = 200; // duration in ms

  function step(context: ScrollContext): void {
    const time = Date.now();
    let elapsed = (time - context.startTime) / duration;

    // avoid elapsed times higher than one
    elapsed = elapsed > 1 ? 1 : elapsed;

    // apply easing to elapsed time
    const value = 0.5 * (1 - Math.cos(Math.PI * elapsed));
    const currentY = context.startY + (context.targetY - context.startY) * value;

    window.scrollTo(0, currentY);

    // scroll more if we have not reached our destination
    if (currentY !== context.targetY) {
      requestAnimationFrame(() => step(context));
    }
  }

  step({
    startTime: Date.now(),
    startY: window.scrollY || window.pageYOffset,
    targetY: targetY,
  });
}

/**
 * Sort two strings based on their name
 */
export const sortByName = (firstString: string, secondString: string): number => {
  const nameA = firstString.toLowerCase();
  const nameB = secondString.toLowerCase();

  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;

  return 0;
}
