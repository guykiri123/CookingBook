import { useState } from 'react';
import { useFavorites } from '../context/favoritesContext';
import { useRecipes } from '../context/recipesContext';
import { useAuth } from '../context/authContext';
import { formatHebrewDate } from '../utils/date';
import { formatPrepTime } from '../utils/prepTime';
import DietaryBadges from '../components/DietaryBadges';
import RatingDisplay from '../components/RatingDisplay';
import ReviewForm from '../components/ReviewForm';
import ReviewsList from '../components/ReviewsList';
import NutritionFacts from '../components/NutritionFacts';
import RecipeChat from '../components/RecipeChat';

const DIFFICULTY_STARS = { 'קל': 1, 'בינוני': 2, 'קשה': 3 };

function formatAmount(amount) {
  const rounded = Math.round(amount * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

const calcAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
};

export default function RecipePage({ recipeId, onBack, onEdit }) {
  const { user, token } = useAuth();
  const { recipes, deleteRecipe, applyLocalUpdate } = useRecipes();
  const recipe = recipes.find((r) => r.id === recipeId);
  const [servings, setServings] = useState(recipe?.servings || 4);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isDeletingReview, setIsDeletingReview] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();

  const canEdit = user && (user.id === recipe?.authorId || user.role === 'admin');

  const handleDelete = async () => {
    if (window.confirm('בטוח שאתה רוצה למחוק את המתכון הזה?')) {
      await deleteRecipe(recipe.id);
      onBack();
    }
  };

  const handleAddReview = async (reviewData) => {
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/recipes/${recipe.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(reviewData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add review');
      }

      const newReview = await res.json();
      const updatedReviews = [...(recipe.reviews || []), newReview];
      applyLocalUpdate(recipe.id, {
        reviews: updatedReviews,
        averageRating: calcAverageRating(updatedReviews),
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    setIsDeletingReview(true);
    try {
      const res = await fetch(`/api/recipes/${recipe.id}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error('Failed to delete review');
      }

      const updatedReviews = recipe.reviews.filter((r) => r.id !== reviewId);
      applyLocalUpdate(recipe.id, {
        reviews: updatedReviews,
        averageRating: calcAverageRating(updatedReviews),
      });
    } catch (err) {
      console.error('Error deleting review:', err);
    } finally {
      setIsDeletingReview(false);
    }
  };

  if (!recipe) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-xl text-ink-soft mb-6">מתכון לא נמצא</p>
        <button onClick={onBack} className="bg-primary text-cream px-6 py-3 rounded-full font-semibold">
          חזרה לדף הבית
        </button>
      </div>
    );
  }

  const factor = servings / recipe.servings;
  const starCount = DIFFICULTY_STARS[recipe.difficulty] || 1;
  const favorited = isFavorite(recipe.id);

  return (
    <div className="relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-up">
        {/* Top actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-primary font-medium border-2 border-primary px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <span aria-hidden="true">◄</span> חזרה
        </button>
        <div className="flex items-center gap-2">
          {canEdit && onEdit && (
            <button
              onClick={() => onEdit(recipe.id)}
              className="inline-flex items-center gap-2 text-primary font-medium border-2 border-primary px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <span aria-hidden="true">✏️</span> ערוך
            </button>
          )}
          {canEdit && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-2 text-red-600 font-medium border-2 border-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600/50"
            >
              <span aria-hidden="true">🗑️</span> מחק
            </button>
          )}
          <button
            onClick={() => toggleFavorite(recipe.id)}
            className={`w-11 h-11 flex items-center justify-center rounded-lg border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 text-lg ${
              favorited ? 'border-primary bg-primary/10' : 'border-accent/40 hover:bg-cream'
            }`}
            aria-label={favorited ? 'הסר ממועדפים' : 'הוסף למועדפים'}
            aria-pressed={favorited}
          >
            <span aria-hidden="true">{favorited ? '❤️' : '🤍'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="w-11 h-11 flex items-center justify-center rounded-lg border-2 border-accent/40 hover:bg-cream transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 text-lg"
            aria-label="הדפס מתכון"
          >
            🖨️
          </button>
        </div>
      </div>

      <article className="bg-white rounded-3xl shadow-md border border-accent/20 overflow-hidden">
        {/* Large image (or placeholder) */}
        <div className="relative h-56 sm:h-72 bg-gradient-to-br from-accent-soft to-accent/50 flex items-center justify-center overflow-hidden">
          {recipe.image ? (
            <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-8xl" aria-hidden="true">🍝</span>
          )}
          <DietaryBadges tags={recipe.tags} size="lg" className="absolute bottom-4 left-4" />
        </div>

        <div className="p-6 sm:p-10">
          {/* Title + meta */}
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-ink mb-3">
            {recipe.name}
          </h1>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-ink-soft mb-6">
            <span className="inline-flex items-center gap-1" aria-label={`רמת קושי: ${recipe.difficulty}`}>
              {[1, 2, 3].map((n) => (
                <span key={n} aria-hidden="true" className={n <= starCount ? 'text-secondary-dark' : 'text-accent/30'}>
                  ★
                </span>
              ))}
              <span className="mr-1">{recipe.difficulty}</span>
            </span>
            <span>🏠 {recipe.cuisine}</span>
            <span>⏱️ {formatPrepTime(recipe.prepTime)}</span>
            <span>🍽️ {recipe.dietType}</span>
            <div className="w-full min-w-full">
              <RatingDisplay averageRating={recipe.averageRating} reviewCount={recipe.reviews?.length || 0} />
            </div>
          </div>

          {(recipe.author || recipe.createdAt) && (
            <p className="text-sm text-ink-soft mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
              {recipe.author && (
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden="true">👤</span> הועלה על ידי{' '}
                  <span className="font-semibold text-ink">{recipe.author}</span>
                </span>
              )}
              {recipe.author && recipe.createdAt && <span aria-hidden="true">•</span>}
              {recipe.createdAt && (
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden="true">📅</span> {formatHebrewDate(recipe.createdAt)}
                </span>
              )}
            </p>
          )}

          <p className="text-ink-soft leading-relaxed text-lg mb-8">
            {recipe.description}
          </p>

          {/* Servings stepper */}
          <div className="bg-cream border border-accent/30 rounded-2xl p-5 mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <label className="font-display text-lg text-ink flex items-center gap-2">
                <span aria-hidden="true">👥</span> מספר סועדים
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setServings((s) => Math.max(1, s - 1))}
                  disabled={servings <= 1}
                  className="w-10 h-10 rounded-full bg-primary text-cream text-xl font-bold flex items-center justify-center hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  aria-label="הפחת סועד"
                >
                  −
                </button>
                <span className="w-12 text-center text-2xl font-bold text-primary tabular-nums" aria-live="polite">
                  {servings}
                </span>
                <button
                  onClick={() => setServings((s) => Math.min(20, s + 1))}
                  disabled={servings >= 20}
                  className="w-10 h-10 rounded-full bg-primary text-cream text-xl font-bold flex items-center justify-center hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  aria-label="הוסף סועד"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <section className="mb-10">
            <h2 className="font-display text-2xl text-ink mb-4 flex items-center gap-2">
              <span aria-hidden="true">📋</span> רכיבים
              <span className="text-base text-ink-soft font-sans">(ל-{servings} סועדים)</span>
            </h2>
            <ul className="bg-cream rounded-2xl border border-accent/20 divide-y divide-accent/15">
              {recipe.ingredients.map((ing, idx) => (
                <li key={idx} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="flex items-center gap-3 text-ink">
                    <span className="text-secondary-dark" aria-hidden="true">✓</span>
                    {ing.name}
                  </span>
                  <span className="font-semibold text-primary whitespace-nowrap">
                    {ing.unit === 'לטעם'
                      ? 'לטעם'
                      : `${formatAmount(ing.amount * factor)} ${ing.unit}`}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Instructions */}
          <section className="mb-10">
            <h2 className="font-display text-2xl text-ink mb-4 flex items-center gap-2">
              <span aria-hidden="true">👨‍🍳</span> הוראות הכנה
            </h2>
            <ol className="space-y-4">
              {recipe.instructions.map((step, idx) => (
                <li key={idx} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-cream font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <p className="text-ink leading-relaxed pt-1">{step}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Tips */}
          {recipe.tips && (
            <section className="bg-secondary/25 border-r-4 border-secondary-dark rounded-l-xl p-5 mb-10">
              <h3 className="font-display text-lg text-ink mb-1 flex items-center gap-2">
                <span aria-hidden="true">💡</span> טיפ חשוב
              </h3>
              <p className="text-ink-soft leading-relaxed">{recipe.tips}</p>
            </section>
          )}

          {/* Nutrition Facts */}
          <NutritionFacts ingredients={recipe.ingredients} servings={servings} recipeServings={recipe.servings} />

          {/* Reviews Section */}
          <section className="mt-12 pt-10 border-t border-accent/20">
            <h2 className="font-display text-2xl text-ink mb-6 flex items-center gap-2">
              <span aria-hidden="true">⭐</span> דירוגים והערות
            </h2>

            {/* Review Form — only for logged-in users (no anonymous reviews) */}
            <div className="mb-10">
              {user ? (
                <ReviewForm
                  recipeId={recipe.id}
                  username={user.username}
                  onSubmit={handleAddReview}
                  isLoading={isSubmittingReview}
                />
              ) : (
                <div className="bg-cream rounded-2xl p-6 border border-accent/20 text-center">
                  <p className="text-ink-soft">
                    <span aria-hidden="true">🔒</span> כדי להוסיף דירוג צריך להיות מחובר.
                  </p>
                </div>
              )}
            </div>

            {/* Reviews List */}
            <div>
              <h3 className="font-display text-lg text-ink mb-4">
                {recipe.reviews?.length || 0} דירוג{recipe.reviews?.length !== 1 ? 'ים' : ''}
              </h3>
              <ReviewsList
                reviews={recipe.reviews}
                onDeleteReview={user?.role === 'admin' ? handleDeleteReview : undefined}
                isDeleting={isDeletingReview}
              />
            </div>
          </section>
        </div>
      </article>
      </div>

      {/* Recipe Chat - sticky positioning */}
      <RecipeChat recipe={recipe} />
    </div>
  );
}
