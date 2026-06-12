import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthContext } from './authContext';

const loadAuth = () => {
  try {
    const stored = localStorage.getItem('cookingbook:auth-token');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { token: parsed.token, user: parsed.user };
    }
  } catch (err) {
    console.error('Failed to load auth:', err);
  }
  return { token: null, user: null };
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { token: savedToken, user: savedUser } = loadAuth();
    setToken(savedToken);
    setUser(savedUser);

    if (savedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then(res => (res.ok ? res.json() : Promise.reject()))
        .then(data => {
          setUser(data);
          localStorage.setItem('cookingbook:auth-token', JSON.stringify({ token: savedToken, user: data }));
        })
        .catch(() => {
          localStorage.removeItem('cookingbook:auth-token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback((newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('cookingbook:auth-token', JSON.stringify({ token: newToken, user: newUser }));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('cookingbook:auth-token');
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoggedIn: !!token,
      loading,
      login,
      logout,
    }),
    [user, token, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
