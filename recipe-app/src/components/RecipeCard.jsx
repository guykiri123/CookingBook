import { useFavorites } from '../context/favoritesContext';
import { formatHebrewDate } from '../utils/date';
import { formatPrepTime } from '../utils/prepTime';
import DietaryBadges from './DietaryBadges';
import RatingDisplay from './RatingDisplay';

const DIFFICULTY_STARS = { 'קל': 1, 'בינוני': 2, 'קשה': 3 };

const DIET_ICON = {
  'בשרי': '🥩',
  'חלבי': '🧀',
  'פרווה': '🥬',
  'דגים': '🐟',
};

function DifficultyStars({ difficulty }) {
  const count = DIFFICULTY_STARS[difficulty] || 1;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`רמת קושי: ${difficulty}`}>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          aria-hidden="true"
          className={n <= count ? 'text-secondary-dark' : 'text-accent/30'}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function RecipeCard({ recipe, onSelect }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(recipe.id);

  return (
    <article
      onClick={() => onSelect(recipe.id)}
      className="group h-full bg-white rounded-2xl border border-accent/20 shadow-sm overflow-hidden flex flex-col cursor-pointer recipe-card-hover"
    >
      {/* Image (or placeholder) */}
      <div className="relative h-44 bg-gradient-to-br from-accent-soft to-accent/50 flex items-center justify-center overflow-hidden">
        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="text-6xl transition-transform duration-300 group-hover:scale-110" aria-hidden="true">
            🍝
          </span>
        )}
        <span className="absolute top-3 right-3 bg-white/90 backdrop-blur text-xs font-medium text-primary px-2.5 py-1 rounded-full shadow-sm">
          🏠 {recipe.cuisine}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(recipe.id);
          }}
          className="absolute top-3 left-3 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm text-lg transition-transform hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          aria-label={favorited ? 'הסר ממועדפים' : 'הוסף למועדפים'}
          aria-pressed={favorited}
        >
          <span aria-hidden="true">{favorited ? '❤️' : '🤍'}</span>
        </button>
        <DietaryBadges tags={recipe.tags} className="absolute bottom-3 left-3" />
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display font-bold text-lg text-ink leading-snug">
            {recipe.name}
          </h3>
          <DifficultyStars difficulty={recipe.difficulty} />
        </div>

        {recipe.averageRating > 0 && (
          <div className="mb-2 text-sm">
            <RatingDisplay averageRating={recipe.averageRating} reviewCount={recipe.reviews?.length || 0} />
          </div>
        )}

        <p className="text-sm text-ink-soft line-clamp-2 mb-4">
          {recipe.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-5">
          <span className="inline-flex items-center gap-1 text-xs bg-cream border border-accent/30 text-ink-soft px-2.5 py-1 rounded-full">
            {DIET_ICON[recipe.dietType]} {recipe.dietType}
          </span>
          <span className="inline-flex items-center gap-1 text-xs bg-cream border border-accent/30 text-ink-soft px-2.5 py-1 rounded-full">
            ⏱️ {formatPrepTime(recipe.prepTime)}
          </span>
        </div>

        {(recipe.author || recipe.createdAt) && (
          <p className="text-xs text-ink-soft mb-4 -mt-1 flex flex-wrap items-center gap-x-1.5">
            {recipe.author && (
              <span>
                <span aria-hidden="true">👤</span> {recipe.author}
              </span>
            )}
            {recipe.author && recipe.createdAt && <span aria-hidden="true">•</span>}
            {recipe.createdAt && <span>{formatHebrewDate(recipe.createdAt)}</span>}
          </p>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(recipe.id);
          }}
          className="mt-auto w-full bg-primary text-cream font-semibold py-3 rounded-full hover:bg-primary-dark active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
        >
          התחל לבשל
        </button>
      </div>
    </article>
  );
}
