// Maps a recipe's prep-time range to the label shown on cards and recipe pages.
// Recipes without a prepTime fall back to the '30-60' range.
const PREP_TIME_LABELS = {
  'פחות מ-30': 'פחות מ-30 דק׳',
  '30-60': '30-60 דק׳',
  'יותר משעה': 'יותר משעה',
};

export const DEFAULT_PREP_TIME = '30-60';

export function formatPrepTime(prepTime) {
  const key = prepTime || DEFAULT_PREP_TIME;
  return PREP_TIME_LABELS[key] || `${key} דק׳`;
}
