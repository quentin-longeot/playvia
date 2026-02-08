import { displayCards } from '@/cards';
import {
  FOCUS_CARD_ELEMENT,
  EXTERNAL_STORAGE_CHARGED,
} from '@/events';
import { avPlayer } from '@/modules/avPlayer';
import { externalStorage } from '@/modules/externalStorage';
import { focusManager } from '@/modules/focusManager';
import { listeners } from '@/modules/listeners';
import { overlay } from '@/modules/overlay';
import { shakaPlayer } from '@/modules/shakaPlayer';
import { videoPlayer } from '@/modules/videoPlayer';

/**
 * Handle the externalStorageCharged event
 * This function displays the movie cards once the external storage elements are loaded
 * It also tries to focus the first element
 */
function onExternalStorageCharged(): void {
  const parentElement = document.getElementById('app');

  if (!parentElement || !externalStorage.externalStorageElements) {
    console.error('Cannot initialize: missing parent element or storage elements');
    return;
  }

  displayCards(parentElement, externalStorage.externalStorageElements);

  // Focus the first element by default
  const firstElement = document.getElementById('movie-card-0');

  if (firstElement) {
    const customEvent = new CustomEvent(FOCUS_CARD_ELEMENT, { detail: firstElement });
    window.dispatchEvent(customEvent);
  } else {
    console.error('None elements are focusable.');
  }

  // Remove the event listener to avoid multiple calls
  window.removeEventListener(EXTERNAL_STORAGE_CHARGED, onExternalStorageCharged);
}


listeners.create();
focusManager.create();
overlay.create();

console.log('Using player:', process.env.PLAYER_NAME);

if (process.env.PLAYER_NAME === 'avplayer') {
  avPlayer.create();
} else if (process.env.PLAYER_NAME === 'videotag') {
  videoPlayer.create();
} else if (process.env.PLAYER_NAME === 'shakaplayer') {
  shakaPlayer.create();
}

window.addEventListener(EXTERNAL_STORAGE_CHARGED, onExternalStorageCharged);

externalStorage.getElementsFromExternalStorage();