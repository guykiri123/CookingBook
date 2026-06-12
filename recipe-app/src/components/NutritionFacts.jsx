import { calculateRecipeNutrition } from '../data/nutritionDatabase';

export default function NutritionFacts({ ingredients, servings, recipeServings }) {
  const factor = servings / (recipeServings || servings);
  const scaledIngredients = ingredients.map(ing => ({
    ...ing,
    amount: ing.amount * factor
  }));
  const nutrition = calculateRecipeNutrition(scaledIngredients, servings);

  if (!nutrition || !nutrition.total) {
    return (
      <section className="bg-cream rounded-2xl border border-accent/20 p-6">
        <h3 className="font-display text-lg text-ink mb-2 flex items-center gap-2">
          <span aria-hidden="true">📊</span> ערכים תזונתיים
        </h3>
        <p className="text-ink-soft text-sm">
          לא כל המצרכים יש נתונים תזונתיים זמינים
        </p>
      </section>
    );
  }

  const facts = [
    { label: 'אנרגיה (קלוריות)', key: 'calories', per100: '—', unit: 'קל' },
    { label: 'חלבונים', key: 'protein', unit: 'ג' },
    { label: 'שומן', key: 'fat', unit: 'ג' },
    { label: 'שומן רווי', key: 'saturatedFat', unit: 'ג' },
    { label: 'פחמימות', key: 'carbs', unit: 'ג' },
    { label: 'סיבים', key: 'fiber', unit: 'ג' },
    { label: 'סוכרים', key: 'sugars', unit: 'ג' },
    { label: 'כולסטרול', key: 'cholesterol', unit: 'מ"ג' },
    { label: 'נתרן', key: 'sodium', unit: 'מ"ג' },
  ];

  return (
    <section className="bg-cream rounded-2xl border border-accent/20 p-6 mb-10">
      <h3 className="font-display text-lg text-ink mb-6 flex items-center gap-2">
        <span aria-hidden="true">📊</span> ערכים תזונתיים
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-accent/30">
              <th className="text-right py-3 px-4 font-semibold text-ink">
                רכיב תזונתי
              </th>
              <th className="text-left py-3 px-4 font-semibold text-ink">
                סה"כ במתכון
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-accent/15">
            {facts.map(({ label, key, unit }) => (
              <tr key={key} className="hover:bg-white/60 transition-colors">
                <td className="text-right py-3 px-4 text-ink font-medium">
                  {label}
                </td>
                <td className="text-left py-3 px-4 text-primary font-semibold">
                  {Math.round(nutrition.total[key])}{unit && ` ${unit}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 pt-6 border-t border-accent/30 text-xs text-ink-soft">
        <p>
          * הערכים מחושבים בהתאם למצרכים במתכון. נתונים מתוך מסד נתונים תזונתי USDA.
        </p>
      </div>
    </section>
  );
}
