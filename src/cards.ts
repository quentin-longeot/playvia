import { cleanMovieName } from '@/helpers';
import type { Movie } from '@types';

/**
 * Create a focusable card for movies
 */
const createCard = (movie: Movie, movieIndex: number): HTMLDivElement => {
  const card = document.createElement('div');
  card.id = 'movie-card-' + movieIndex;
  card.classList.add('card');
  card.tabIndex = movieIndex;

  const img = document.createElement('img');
  const cleanedMovieName = cleanMovieName(movie.name);
  img.src = `./mocks/assetsMocked/${cleanedMovieName}.webp`;
  img.classList.add('card-image');

  const title = document.createElement('div');
  title.classList.add('card-title');
  title.textContent = cleanedMovieName;

  card.appendChild(img);
  card.appendChild(title);

  return card;
}

/**
 * Displays movie cards inside a parent element
 * The parent element is cleared before adding the cards
 */
export const displayCards = (parentElement: HTMLElement, movies: Movie[]): void => {
  const container = document.createElement('div');
  container.id = 'cards-container';

  movies.forEach((movie, index) => {
    const card = createCard(movie, index);
    container.appendChild(card);
  });

  parentElement.innerHTML = '';
  parentElement.appendChild(container);
};
