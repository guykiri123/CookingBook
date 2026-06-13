import { useState, useEffect, useCallback, useRef } from 'react';
import { FavoritesContext } from './favoritesContext';
import { useAuth } from './authContext';

const STORAGE_KEY = 'cookingbook:favorites';

// Guest favorites live in localStorage. Once a user logs in, their favorites
// are owned by the account (MongoDB) and synced across devices.
function loadGuestFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'number') : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }) {
  const { token } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState(loadGuestFavorites);
  // Mirror of the latest list so toggle never reads a stale closure.
  const favoritesRef = useRef(favoriteIds);
  useEffect(() => {
    favoritesRef.current = favoriteIds;
  }, [favoriteIds]);

  // React to auth changes: logged-out → guest store; logged-in → account,
  // merging any guest favorites collected before login.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!token) {
        if (!cancelled) setFavoriteIds(loadGuestFavorites());
        return;
      }

      try {
        const res = await fetch('/api/favorites', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load favorites');
        const data = await res.json();
        const serverIds = Array.isArray(data.favorites) ? data.favorites : [];
        const guestIds = loadGuestFavorites();
        const merged = [...new Set([...serverIds, ...guestIds])];
        if (cancelled) return;
        setFavoriteIds(merged);

        // Persist guest additions to the account, then drop the guest store.
        if (guestIds.some((id) => !serverIds.includes(id))) {
          fetch('/api/favorites', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ favorites: merged }),
          }).catch(() => {});
        }
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
      } catch {
        /* network/auth issue — keep whatever is in state */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const toggleFavorite = useCallback(
    (id) => {
      const prev = favoritesRef.current;
      const isRemoving = prev.includes(id);
      const next = isRemoving ? prev.filter((x) => x !== id) : [...prev, id];
      favoritesRef.current = next;
      setFavoriteIds(next);

      if (token) {
        // Atomic per-item update — preserves favorites saved elsewhere even if
        // the local list is stale.
        fetch(`/api/favorites/${id}`, {
          method: isRemoving ? 'DELETE' : 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      } else {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* localStorage unavailable (private mode) — favorites stay in memory only */
        }
      }
    },
    [token]
  );

  const isFavorite = useCallback((id) => favoriteIds.includes(id), [favoriteIds]);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}
