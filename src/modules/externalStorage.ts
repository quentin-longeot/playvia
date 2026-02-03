import { EXTERNAL_STORAGE_CHARGED } from '@/events';
import { sortByName } from '@/helpers';
import { moviesList } from '@mocks/moviesList';
import type { Movie, ExternalStorageModule } from '@types';

export const externalStorage: ExternalStorageModule = {
  // VARIABLES
  externalStorageElements: null,

  // FUNCTIONS

  /**
   * Retrieves movie elements from external storage and displays them
   */
  getElementsFromExternalStorage(): void {
    const customEvent = new CustomEvent(EXTERNAL_STORAGE_CHARGED);

    /**
     * Handle failure to open a file or directory
     * Simply logs the error to the console and uses mock data
     */
    function failedToOpen(error: Error): void {
      console.error('💾 ❌ Error while opening file:', error.message);
      externalStorage.externalStorageElements = moviesList;
      window.dispatchEvent(customEvent);
    }

    try {
      window.tizen.filesystem.listStorages((storages) => {
        const externalStorageDevice = storages.find(
          (storage) => storage.state === 'MOUNTED' && storage.type === 'EXTERNAL'
        );

        if (externalStorageDevice) {
          function externalStorageOpened(externalStorageFiles: tizen.filesystem.File): void {
            externalStorageFiles.listFiles((dirEntry) => {
              for (let i = 0; i < dirEntry.length; i++) {
                const file = dirEntry[i];

                if (file.name === process.env.MOVIES_FOLDER) {
                  file.listFiles((movies) => {
                    console.info('💾 Movies found in external storage:', movies);
                    externalStorage.externalStorageElements = (movies as unknown as Movie[])
                      .filter((movie) => movie.isFile && movie.name !== '')
                      .sort((a, b) => sortByName(a.name, b.name));

                    window.dispatchEvent(customEvent);
                  }, failedToOpen);
                }
              }
            }, failedToOpen);
          }

          tizen.filesystem.resolve(
            externalStorageDevice.label,
            externalStorageOpened,
            failedToOpen
          );
        }
      }, failedToOpen);

      if (!externalStorage.externalStorageElements && window.tizen === undefined) {
        failedToOpen(new Error('Tizen filesystem API is not available.'));
      }
    } catch {
      failedToOpen(new Error('Tizen filesystem API is not available.'));
    }
  },
};
