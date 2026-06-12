// Optional dietary tags a recipe can carry, shown as small badges on the recipe
// image and offered as checkboxes in the add-recipe form and the home filter.
// `strike: true` draws a diagonal line over the emoji (e.g. "no gluten").
export const DIETARY_TAGS = [
  { id: 'vegan', label: 'טבעוני', emoji: '🌱' },
  { id: 'vegetarian', label: 'צמחוני', emoji: '🥗' },
  { id: 'glutenFree', label: 'ללא גלוטן', emoji: '🌾', strike: true },
];
