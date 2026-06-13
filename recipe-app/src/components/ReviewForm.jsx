import { useState } from 'react';

export default function ReviewForm({ recipeId, username, onSubmit, isLoading = false }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!text.trim()) {
      setError('כתבו משהו');
      return;
    }

    if (text.trim().length < 5) {
      setError('המחמאה צריכה להיות לפחות 5 תווים');
      return;
    }

    try {
      await onSubmit({ rating, text: text.trim() });
      setRating(5);
      setText('');
    } catch (err) {
      setError(err.message || 'הייתה שגיאה בהוספת ההמחמאה');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-cream rounded-2xl p-6 border border-accent/20">
      <h3 className="font-display text-lg text-ink mb-4">שתפו את החוויה שלכם</h3>

      <div className="space-y-4">
        {/* Author (logged-in user, not editable) */}
        <p className="text-sm text-ink-soft">
          מפרסם כ־<span className="font-semibold text-ink">{username}</span>
        </p>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-ink mb-3">
            דירוג
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setRating(num)}
                className={`text-3xl transition-transform hover:scale-110 ${
                  num <= rating ? 'text-secondary-dark' : 'text-accent/30'
                }`}
                aria-label={`דירוג ${num} מ-5`}
              >
                ★
              </button>
            ))}
          </div>
          <p className="text-sm text-ink-soft mt-2">הדירוג שלך: {rating} כוכבים</p>
        </div>

        {/* Text */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            התרשמות
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="מה דעתך על המתכון? נוספת משהו? הייתה בעיה?"
            maxLength={500}
            rows={4}
            className="w-full px-4 py-2 rounded-lg border border-accent/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-ink resize-none"
          />
          <p className="text-xs text-ink-soft mt-1">
            {text.length}/500
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-cream font-semibold py-3 rounded-full hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'שולח...' : 'שלח דירוג'}
        </button>
      </div>
    </form>
  );
}
