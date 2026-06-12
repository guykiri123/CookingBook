import { DIETARY_TAGS } from '../data/dietaryTags';

// Small round badges showing a recipe's dietary tags (vegan / vegetarian /
// gluten-free). Positioned by the parent via `className` (it's absolute-friendly).
export default function DietaryBadges({ tags, size = 'sm', className = '' }) {
  if (!tags || tags.length === 0) return null;
  const active = DIETARY_TAGS.filter((t) => tags.includes(t.id));
  if (active.length === 0) return null;

  const dim = size === 'lg' ? 'w-10 h-10 text-xl' : 'w-8 h-8 text-base';
  const strikeW = size === 'lg' ? 'w-7' : 'w-6';

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {active.map((t) => (
        <span
          key={t.id}
          title={t.label}
          aria-label={t.label}
          role="img"
          className={`relative flex items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm ring-1 ring-accent/30 ${dim}`}
        >
          <span aria-hidden="true">{t.emoji}</span>
          {t.strike && (
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
              <span className={`block ${strikeW} h-0.5 bg-red-500 rotate-45 rounded`} />
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
