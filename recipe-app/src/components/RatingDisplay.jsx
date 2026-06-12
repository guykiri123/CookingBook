function RatingStars({ rating, showLabel = true }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 !== 0;

  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        let starClass = 'text-accent/30';
        if (n <= fullStars) {
          starClass = 'text-secondary-dark';
        } else if (n === fullStars + 1 && hasHalf) {
          starClass = 'text-secondary-dark';
        }
        return (
          <span key={n} aria-hidden="true" className={starClass}>
            {n === fullStars + 1 && hasHalf ? '★' : '★'}
          </span>
        );
      })}
      {showLabel && <span className="text-sm text-ink-soft mr-1">({rating})</span>}
    </span>
  );
}

export default function RatingDisplay({ averageRating, reviewCount }) {
  if (!averageRating && reviewCount === 0) {
    return (
      <div className="text-ink-soft text-sm">
        עדיין אין דירוגים
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <RatingStars rating={averageRating || 0} />
      <span className="text-sm text-ink-soft">
        ({reviewCount} {reviewCount === 1 ? 'דירוג' : 'דירוגים'})
      </span>
    </div>
  );
}

export { RatingStars };
