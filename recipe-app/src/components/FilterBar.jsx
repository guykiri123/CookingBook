function Select({ id, label, value, onChange, allLabel, options }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-ink-soft px-1">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="select-rtl w-full bg-white text-ink text-sm rounded-lg border-2 border-accent/60 py-3 pr-4 pl-9 cursor-pointer hover:bg-cream focus:border-primary focus:outline-none transition-colors"
      >
        <option value="">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function FilterBar({
  filters,
  setFilters,
  emptyFilters,
  cuisines,
  difficulties,
  dietTypes,
  prepTimes,
  dietaryTags,
  recipeCount,
}) {
  const update = (key) => (e) =>
    setFilters((prev) => ({ ...prev, [key]: e.target.value }));

  const toggleTag = (id) =>
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(id)
        ? prev.tags.filter((t) => t !== id)
        : [...prev.tags, id],
    }));

  const hasActiveFilters =
    filters.cuisine ||
    filters.difficulty ||
    filters.dietType ||
    filters.prepTime ||
    filters.tags.length > 0 ||
    filters.search;

  return (
    <section
      className="bg-white rounded-2xl shadow-sm border border-accent/20 p-5 sm:p-6"
      aria-label="סינון מתכונים"
    >
      <div className="flex items-center gap-2 mb-5">
        <span aria-hidden="true">🔽</span>
        <h2 className="font-display text-xl text-ink">סנן תוצאות</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          id="filter-difficulty"
          label="רמת קושי"
          value={filters.difficulty}
          onChange={update('difficulty')}
          allLabel="כל הרמות"
          options={difficulties}
        />
        <Select
          id="filter-cuisine"
          label="סוג מטבח"
          value={filters.cuisine}
          onChange={update('cuisine')}
          allLabel="כל המטבחים"
          options={cuisines}
        />
        <Select
          id="filter-diet"
          label="סוג תזונה"
          value={filters.dietType}
          onChange={update('dietType')}
          allLabel="כל הסוגים"
          options={dietTypes}
        />
        <Select
          id="filter-time"
          label="זמן הכנה"
          value={filters.prepTime}
          onChange={update('prepTime')}
          allLabel="כל הזמנים"
          options={prepTimes}
        />
      </div>

      <div className="mt-5">
        <p className="text-xs font-medium text-ink-soft px-1 mb-2">העדפות תזונה</p>
        <div className="flex flex-wrap gap-2">
          {dietaryTags.map((t) => {
            const checked = filters.tags.includes(t.id);
            return (
              <label
                key={t.id}
                className={`inline-flex items-center gap-1.5 cursor-pointer select-none text-sm rounded-full border-2 px-3 py-1.5 transition-colors ${
                  checked
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-accent/40 text-ink-soft hover:bg-cream'
                }`}
              >
                <input
                  type="checkbox"
                  className="accent-primary w-4 h-4"
                  checked={checked}
                  onChange={() => toggleTag(t.id)}
                />
                <span aria-hidden="true">{t.emoji}</span>
                {t.label}
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 mt-5 pt-5 border-t border-accent/20">
        <p className="text-sm text-ink-soft">
          נמצאו <span className="font-bold text-primary">{recipeCount}</span> מתכונים
        </p>
        <button
          onClick={() => setFilters(emptyFilters)}
          disabled={!hasActiveFilters}
          className="bg-secondary text-ink text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-secondary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          ♻️ איפוס סינונים
        </button>
      </div>
    </section>
  );
}
