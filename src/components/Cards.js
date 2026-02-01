window.Cards = {
  display: function(parentElement, movies) {
    var container = document.createElement('div');
		container.style.display = 'flex';
		container.style.flexWrap = 'wrap';
		container.style.gap = '10px';
		container.style.margin = '0 134px';

		movies.forEach(function(movie, index) {
      var card = window.Card.create(movie, index);
      container.appendChild(card);
		});

    parentElement.innerHTML = '';
    parentElement.appendChild(container);
  }
}
