window.externalStorage = {
  // VARIABLES

  externalStorageElements: null,

  // FUNCTIONS

  /**
   * Retrieves movie elements from external storage and displays them
   *
   * @returns {void}
   */
  getElementsFromExternalStorage: function() {
    var customEvent = new CustomEvent(window.CUSTOM_EVENTS.EXTERNAL_STORAGE_CHARGED);

    /**
     * Handle failure to open a file or directory
     *
     * @param {Error} error 
     * @returns {void} 
     */
    function failedToOpen(error) {
      console.error('❌ Error while opening file:', error.message);
    }

    try {
      window.tizen.filesystem.listStorages(function(storages) {
        var externalStorage = storages.find(storage => storage.state === 'MOUNTED' && storage.type === 'EXTERNAL');

        if (externalStorage) {
          function externalStorageOpened(externalStorageFiles) {
            externalStorageFiles.listFiles(function(dirEntry) {
              for (var i = 0; i < dirEntry.length; i++) {
                var file = dirEntry[i];

                if (file.name === 'Movies') {
                  file.listFiles(function(movies) {
                    console.info('💾 Movies found in external storage:', movies);
                    window.externalStorage.externalStorageElements = movies
                      .filter(function(movie) { return movie.isFile && movie.name !== ''; })
                      .sort(function(a, b) { return window.helpers.sortByName(a.name, b.name); });

                    window.dispatchEvent(customEvent);
                  }, failedToOpen);
                }
              }
            }, failedToOpen);
          }

          tizen.filesystem.resolve(externalStorage.label, externalStorageOpened, failedToOpen);
        }
      }, failedToOpen);

      if (!window.externalStorage.externalStorageElements && window.tizen === undefined) {
        window.externalStorage.externalStorageElements = window.Mocks.moviesList;

        window.dispatchEvent(customEvent);
      }
    } catch (error) {
      window.externalStorage.externalStorageElements = window.Mocks.moviesList;

      window.dispatchEvent(customEvent);
    }
  },
};
