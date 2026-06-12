import { useFavorites } from '../context/favoritesContext';
import { useAuth } from '../context/authContext';

// SVG Icons as components
function LogoIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c-5.523 0-10 4.477-10 10 0 2.5.914 4.79 2.418 6.574A4 4 0 0 0 6 22h12a4 4 0 0 0 1.582-3.426C21.086 16.79 22 14.5 22 12c0-5.523-4.477-10-10-10z" />
      <path d="M9 12h6" />
      <path d="M12 9v6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m6.08 0l4.24-4.24M1 12h6m6 0h6m-1.78 7.78l-4.24-4.24m-6.08 0l-4.24 4.24" />
    </svg>
  );
}

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
          <LogoIcon />
          <span>מתכוניה</span>
        </button>

        <div className="flex items-center gap-1 sm:gap-2">
          {isLoggedIn ? (
            <>
              <button
                onClick={onShowAddRecipe}
                className="inline-flex items-center gap-1.5 h-11 px-3 sm:px-4 rounded-full bg-cream/15 hover:bg-white/25 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cream/70 text-sm font-semibold btn-hover"
                aria-label="הוספת מתכון חדש"
              >
                <PlusIcon />
                <span className="hidden sm:inline">מתכון חדש</span>
              </button>
              <button
                onClick={() => onShowUserRecipes()}
                className="inline-flex items-center gap-1.5 h-11 px-3 sm:px-4 rounded-full bg-cream/15 hover:bg-white/25 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cream/70 text-sm font-semibold btn-hover"
                aria-label="המתכונים שלי"
              >
                <BookmarkIcon />
                <span className="hidden sm:inline">המתכונים שלי</span>
              </button>
            </>
          ) : null}
          <a
            href="#search"
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cream/70 btn-hover"
            aria-label="חיפוש מתכון"
          >
            <SearchIcon />
          </a>
          <button
            onClick={onShowFavorites}
            className="relative w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cream/70 btn-hover"
            aria-label={count > 0 ? `מתכונים מועדפים (${count})` : 'מתכונים מועדפים'}
          >
            <HeartIcon />
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
                  className="h-9 px-3 text-sm font-semibold rounded-full bg-amber-500/30 hover:bg-amber-500/50 transition-colors inline-flex items-center gap-1 btn-hover"
                  aria-label="ניהול"
                >
                  <GearIcon />
                  <span className="hidden sm:inline">ניהול</span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="h-9 px-3 text-sm font-semibold rounded-full bg-red-500/30 hover:bg-red-500/50 transition-colors btn-hover"
                aria-label="התנתק"
              >
                התנתק
              </button>
            </div>
          ) : (
            <button
              onClick={onShowLogin}
              className="h-11 px-4 text-sm font-semibold rounded-full bg-cream/15 hover:bg-white/25 transition-colors btn-hover"
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
