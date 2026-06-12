import { useState, useEffect, useCallback, useMemo } from 'react';
import { RecipesContext } from './recipesContext';
import { useAuth } from './authContext';

export function RecipesProvider({ children }) {
  const { token } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/recipes');
        const data = await res.json();
        setRecipes(data);
      } catch (err) {
        console.error('Error fetching recipes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [token]);

  const addRecipe = useCallback(async (recipe) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...recipe,
          createdAt: new Date().toISOString(),
          isUserAdded: true,
        }),
      });
      const newRecipe = await res.json();
      setRecipes((prev) => [newRecipe, ...prev]);
      return newRecipe.id;
    } catch (err) {
      console.error('Error adding recipe:', err);
    }
  }, [token]);

  const updateRecipe = useCallback(async (id, updates) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`/api/recipes/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });
      const updated = await res.json();
      setRecipes((prev) =>
        prev.map((r) => (r.id === id ? updated : r))
      );
    } catch (err) {
      console.error('Error updating recipe:', err);
    }
  }, [token]);

  const deleteRecipe = useCallback(async (id) => {
    try {
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      await fetch(`/api/recipes/${id}`, { method: 'DELETE', headers });
      setRecipes((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Error deleting recipe:', err);
    }
  }, [token]);

  const value = useMemo(
    () => ({ recipes, addRecipe, updateRecipe, deleteRecipe, loading }),
    [recipes, addRecipe, updateRecipe, deleteRecipe, loading]
  );

  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>;
}
