import { RatingStars } from './RatingDisplay';
import { formatHebrewDate } from '../utils/date';

export default function ReviewsList({ reviews = [], onDeleteReview, isDeleting = false }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 text-ink-soft">
        עדיין אין דירוגים. היו הראשונים!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="bg-white rounded-lg border border-accent/20 p-5 hover:shadow-md transition-shadow"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-ink">{review.author}</span>
                <RatingStars rating={review.rating} showLabel={false} />
              </div>
              <p className="text-xs text-ink-soft">
                {formatHebrewDate(review.createdAt)}
              </p>
            </div>
            {onDeleteReview && (
              <button
                onClick={() => {
                  if (window.confirm('בטוח שרוצה למחוק את הדירוג הזה?')) {
                    onDeleteReview(review.id);
                  }
                }}
                disabled={isDeleting}
                className="flex-shrink-0 text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                aria-label="מחק דירוג"
              >
                ×
              </button>
            )}
          </div>

          {/* Text */}
          <p className="text-ink leading-relaxed text-sm">{review.text}</p>
        </div>
      ))}
    </div>
  );
}
