import { useMemo } from 'react';
import RecipeCard from '../components/RecipeCard';
import { useFavorites } from '../context/favoritesContext';
import { useRecipes } from '../context/recipesContext';

export default function FavoritesPage({ onSelectRecipe, onBrowse }) {
  const { favoriteIds } = useFavorites();
  const { recipes } = useRecipes();

  const favoriteRecipes = useMemo(
    () => recipes.filter((recipe) => favoriteIds.includes(recipe.id)),
    [favoriteIds, recipes]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 animate-fade-up">
      <h1 className="font-display font-bold text-ink text-3xl sm:text-4xl mb-2 flex items-center gap-3">
        <span aria-hidden="true">❤️</span> המתכונים המועדפים שלי
      </h1>
      <p className="text-ink-soft text-lg mb-8">
        {favoriteRecipes.length > 0
          ? `${favoriteRecipes.length} מתכונים שאהבת`
          : 'עדיין לא סימנת מתכונים בלב'}
      </p>

      {favoriteRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteRecipes.map((recipe, idx) => (
            <div
              key={recipe.id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(idx, 8) * 0.07}s` }}
            >
              <RecipeCard recipe={recipe} onSelect={onSelectRecipe} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-6xl mb-4" aria-hidden="true">🤍</div>
          <h2 className="font-display text-2xl text-ink mb-2">אין כאן עדיין מתכונים</h2>
          <p className="text-ink-soft mb-6">
            לחצו על הלב בכל מתכון כדי לשמור אותו כאן
          </p>
          <button
            onClick={onBrowse}
            className="bg-primary text-cream font-semibold px-6 py-3 rounded-full hover:bg-primary-dark active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
          >
            עיון במתכונים
          </button>
        </div>
      )}
    </div>
  );
}
