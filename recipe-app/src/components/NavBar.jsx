import { useFavorites } from '../context/favoritesContext';
import { useAuth } from '../context/authContext';

export default function NavBar({ onLogoClick, onShowFavorites, onShowAddRecipe, onShowLogin, onShowAdmin, onShowUserRecipes, isLoggedIn, user }) {
  const { favoriteIds } = useFavorites();
  const { logout } = useAuth();
  const count = favoriteIds.length;

  const handleLogout = () => {
    logout();
    onLogoClick();
  };

  return (
    <header className="sticky top-0 z-50 bg-primary text-cream shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-[70px] flex items-center justify-between">
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2 text-xl sm:text-2xl font-display font-bold tracking-tight hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-cream/70 rounded-lg px-1"
          aria-label="חזרה לדף הבית"
        >
          <span aria-hidden="true">📖</span>
          <span>ספר המתכונים</span>
        </button>

        <div className="flex items-center gap-1 sm:gap-2">
          {isLoggedIn ? (
            <>
              <button
                onClick={onShowAddRecipe}
                className="inline-flex items-center gap-1.5 h-11 px-3 sm:px-4 rounded-full bg-cream/15 hover:bg-white/25 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cream/70 text-sm font-semibold"
                aria-label="הוספת מתכון חדש"
              >
                <span aria-hidden="true" className="text-lg leading-none">＋</span>
                <span className="hidden sm:inline">מתכון חדש</span>
              </button>
              <button
                onClick={() => onShowUserRecipes()}
                className="inline-flex items-center gap-1.5 h-11 px-3 sm:px-4 rounded-full bg-cream/15 hover:bg-white/25 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cream/70 text-sm font-semibold"
                aria-label="המתכונים שלי"
              >
                <span aria-hidden="true" className="text-lg leading-none">📝</span>
                <span className="hidden sm:inline">המתכונים שלי</span>
              </button>
            </>
          ) : null}
          <a
            href="#search"
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cream/70 text-xl"
            aria-label="חיפוש מתכון"
          >
            🔍
          </a>
          <button
            onClick={onShowFavorites}
            className="relative w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cream/70 text-xl"
            aria-label={count > 0 ? `מתכונים מועדפים (${count})` : 'מתכונים מועדפים'}
          >
            ❤️
            {count > 0 && (
              <span
                className="absolute -top-0.5 -left-0.5 min-w-[20px] h-5 px-1 flex items-center justify-center text-xs font-bold bg-secondary text-ink rounded-full shadow ring-2 ring-primary tabular-nums"
                aria-hidden="true"
              >
                {count}
              </span>
            )}
          </button>
          {isLoggedIn && user ? (
            <div className="flex items-center gap-2 ms-2 ps-2 border-s border-white/30">
              <span className="text-sm font-sans text-cream">{user.username}</span>
              {user.role === 'admin' && (
                <button
                  onClick={onShowAdmin}
                  className="h-9 px-3 text-sm font-semibold rounded-full bg-amber-500/30 hover:bg-amber-500/50 transition-colors"
                  aria-label="ניהול"
                >
                  ⚙️ ניהול
                </button>
              )}
              <button
                onClick={handleLogout}
                className="h-9 px-3 text-sm font-semibold rounded-full bg-red-500/30 hover:bg-red-500/50 transition-colors"
                aria-label="התנתק"
              >
                התנתק
              </button>
            </div>
          ) : (
            <button
              onClick={onShowLogin}
              className="h-11 px-4 text-sm font-semibold rounded-full bg-cream/15 hover:bg-white/25 transition-colors"
              aria-label="התחבר"
            >
              התחבר
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
