import { useState, useMemo, useRef, useEffect } from 'react';
import { useRecipes } from '../context/recipesContext';
import RecipeCard from '../components/RecipeCard';
import FilterBar from '../components/FilterBar';
import { CUISINES } from '../data/cuisines';
import { DIETARY_TAGS } from '../data/dietaryTags';

const DIFFICULTIES = ['קל', 'בינוני', 'קשה'];
const DIET_TYPES = ['בשרי', 'חלבי', 'פרווה', 'דגים'];
const PREP_TIMES = ['פחות מ-30', '30-60', 'יותר משעה'];

const EMPTY_FILTERS = {
  cuisine: '',
  difficulty: '',
  dietType: '',
  prepTime: '',
  tags: [],
  search: '',
};

export default function HomePage({ onSelectRecipe }) {
  const { recipes } = useRecipes();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [useAISearch, setUseAISearch] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState(null);
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const debounceTimer = useRef(null);

  // Canonical list first, plus any legacy/extra cuisines found in the data that
  // aren't on the list (so older recipes stay filterable).
  const cuisines = useMemo(() => {
    const extras = recipes
      .map((r) => r.cuisine)
      .filter((c) => c && !CUISINES.includes(c));
    return [...CUISINES, ...new Set(extras)];
  }, [recipes]);

  useEffect(() => {
    if (!useAISearch || !filters.search.trim()) {
      setAiSearchResults(null);
      return;
    }

    clearTimeout(debounceTimer.current);
    setAiSearchLoading(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/ai/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: filters.search,
            recipes: recipes.map(r => ({
              id: r.id,
              name: r.name,
              description: r.description,
              difficulty: r.difficulty,
              cuisine: r.cuisine,
              dietType: r.dietType,
              prepTime: r.prepTime,
            })),
          }),
        });
        if (!res.ok) throw new Error('Failed to search');
        const data = await res.json();
        setAiSearchResults(data.ids || []);
      } catch (err) {
        console.error('AI search error:', err);
        setAiSearchResults([]);
      } finally {
        setAiSearchLoading(false);
      }
    }, 600);

    return () => clearTimeout(debounceTimer.current);
  }, [filters.search, useAISearch, recipes]);

  const filteredRecipes = useMemo(() => {
    // If AI search is active and has results, use those
    if (useAISearch && aiSearchResults !== null) {
      const aiRecipes = aiSearchResults
        .map(id => recipes.find(r => r.id === id))
        .filter(Boolean);
      return aiRecipes;
    }

    // Otherwise, use regular filters
    const q = filters.search.trim().toLowerCase();
    return recipes.filter((recipe) => {
      const matchesCuisine = !filters.cuisine || recipe.cuisine === filters.cuisine;
      const matchesDifficulty = !filters.difficulty || recipe.difficulty === filters.difficulty;
      const matchesDietType = !filters.dietType || recipe.dietType === filters.dietType;
      const matchesPrepTime = !filters.prepTime || recipe.prepTime === filters.prepTime;
      const matchesTags = filters.tags.every((t) => (recipe.tags || []).includes(t));
      const matchesSearch =
        !q ||
        recipe.name.toLowerCase().includes(q) ||
        recipe.description.toLowerCase().includes(q);
      return (
        matchesCuisine &&
        matchesDifficulty &&
        matchesDietType &&
        matchesPrepTime &&
        matchesTags &&
        matchesSearch
      );
    });
  }, [filters, recipes, useAISearch, aiSearchResults]);

  return (
    <div>
      {/* Hero */}
      <section
        id="search"
        className="bg-gradient-to-br from-accent-soft via-cream to-secondary/20 border-b border-accent/20"
      >
        <div className="max-w-3xl mx-auto px-4 py-14 sm:py-20 text-center">
          <h1 className="font-display font-bold text-ink text-4xl sm:text-5xl md:text-6xl leading-tight mb-4 animate-fade-up">
            מצא את המתכון המושלם שלך
          </h1>
          <p className="text-ink-soft text-lg sm:text-xl mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            בואו נבשל משהו טעים היום
          </p>
          <div className="relative max-w-xl mx-auto">
            <span
              className="absolute top-1/2 -translate-y-1/2 right-5 text-lg pointer-events-none text-ink-soft"
              aria-hidden="true"
            >
              {useAISearch ? '⚡' : '✍️'}
            </span>
            <input
              type="search"
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              placeholder={useAISearch ? "חפש בשפה טבעית..." : "חפש מתכון..."}
              aria-label="חיפוש מתכון"
              className="w-full bg-white text-ink text-lg rounded-full py-4 pr-14 pl-6 shadow-md border-2 border-transparent focus:border-primary focus:outline-none focus:shadow-lg transition-all"
            />
            {useAISearch && aiSearchLoading && (
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-ink-soft text-sm">טוען...</span>
            )}
            <button
              onClick={() => setUseAISearch(!useAISearch)}
              className={`absolute left-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-sm font-semibold transition-all ${
                useAISearch
                  ? 'bg-primary text-cream'
                  : 'bg-secondary/20 text-secondary hover:bg-secondary/30'
              }`}
            >
              {useAISearch ? 'חכם' : 'רגיל'}
            </button>
          </div>
        </div>
      </section>

      {/* Filters + Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          emptyFilters={EMPTY_FILTERS}
          cuisines={cuisines}
          difficulties={DIFFICULTIES}
          dietTypes={DIET_TYPES}
          prepTimes={PREP_TIMES}
          dietaryTags={DIETARY_TAGS}
          recipeCount={filteredRecipes.length}
        />

        {filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {filteredRecipes.map((recipe, idx) => (
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
            <div className="text-7xl mb-4 opacity-40" aria-hidden="true">🍝</div>
            <h2 className="font-display text-2xl text-ink mb-2">לא נמצאו מתכונים</h2>
            <p className="text-ink-soft">נסו לשנות את הסינון או לאפס אותו</p>
          </div>
        )}
      </div>
    </div>
  );
}
