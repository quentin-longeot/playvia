window.Card = {
  /**
   * Creates a focusable card for movies
   *
   * @param {Object} movie
   * @param {String} movie.name - raw movie name 
   * @param {number} movieIndex - index of the movie in the list
   * @returns {Element} - focusable card element
   */
  create: function(movie, movieIndex) {
    var card = document.createElement('div');
    card.id = 'movie-card-' + movieIndex;
    card.classList.add('card');
    card.tabIndex = movieIndex;

    // Image placeholder (à remplacer plus tard par l'URL réelle)
    var img = document.createElement('img');
    img.src = './mocks/assetsMocked/' + movie.name + '.webp';
    img.classList.add('card-image');

    var title = document.createElement('div');
    title.classList.add('card-title');
    var dirtyTitle = movie.name;
    title.textContent = dirtyTitle // window.helpers.cleanMovieName(dirtyTitle);

    card.appendChild(img);
    card.appendChild(title);

    return card;
  },
}
