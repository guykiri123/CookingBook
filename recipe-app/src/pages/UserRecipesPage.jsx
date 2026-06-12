import { useState, useMemo } from 'react';
import { useRecipes } from '../context/recipesContext';
import { useAuth } from '../context/authContext';

export default function UserRecipesPage({ onBack, onEdit, onSelectRecipe, viewUserId, viewUsername }) {
  const { user } = useAuth();
  const { recipes, deleteRecipe } = useRecipes();
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const targetUserId = viewUserId ?? user?.id;
  // Check if we're viewing another user's recipes
  const isViewingOtherUser = typeof viewUserId === 'number' && viewUserId !== user?.id;
  const displayUsername = viewUsername ?? user?.username;

  const userRecipes = useMemo(() => {
    return recipes.filter(r => r.authorId === targetUserId);
  }, [recipes, targetUserId]);

  const handleDelete = async (recipeId, recipeName) => {
    if (!window.confirm(`האם בטוח שאתה רוצה למחוק את "${recipeName}"?`)) return;

    try {
      setError('');
      await deleteRecipe(recipeId);
      setSuccessMsg('המתכון נמחק בהצלחה');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'שגיאה בעת מחיקת המתכון');
    }
  };

  const handleEdit = (recipeId) => {
    onEdit(recipeId);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center" dir="rtl">
          <h1 className="text-2xl font-display font-bold text-primary mb-4">נדרשת התחברות</h1>
          <p className="text-ink font-sans mb-6">עליך להיות מחובר כדי לראות מתכונים.</p>
          <button
            onClick={onBack}
            className="w-full bg-primary text-white font-sans font-medium py-2 rounded-lg hover:bg-primary/90 transition"
          >
            חזור לדף הבית
          </button>
        </div>
      </div>
    );
  }

  // Only allow viewing other users' recipes if you're an admin
  if (isViewingOtherUser && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center" dir="rtl">
          <h1 className="text-2xl font-display font-bold text-primary mb-4">גישה נדחתה</h1>
          <p className="text-ink font-sans mb-6">רק מנהלים יכולים לראות מתכונים של משתמשים אחרים.</p>
          <button
            onClick={onBack}
            className="w-full bg-primary text-white font-sans font-medium py-2 rounded-lg hover:bg-primary/90 transition"
          >
            חזור לדף הבית
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream p-4 sm:p-6" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-primary font-medium border-2 border-primary px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors"
        >
          <span aria-hidden="true">◄</span> חזרה
        </button>

        <h1 className="text-4xl font-display font-bold text-primary mb-2">
          {isViewingOtherUser ? `מתכונים של ${displayUsername}` : 'המתכונים שלי'}
        </h1>
        <p className="text-ink font-sans mb-8">
          {userRecipes.length} {userRecipes.length === 1 ? 'מתכון' : 'מתכונים'}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            {successMsg}
          </div>
        )}

        {userRecipes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-ink font-sans mb-6">עדיין לא הוספת מתכונים.</p>
            <button
              onClick={() => window.location.href = '/?action=add'}
              className="inline-flex items-center gap-2 bg-secondary text-ink font-sans font-medium px-6 py-2 rounded-lg hover:bg-secondary/90 transition"
            >
              <span aria-hidden="true">＋</span> הוסף מתכון
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary text-cream">
                  <tr>
                    <th className="px-4 py-3 text-right font-semibold">שם המתכון</th>
                    <th className="px-4 py-3 text-right font-semibold">קטגוריה</th>
                    <th className="px-4 py-3 text-right font-semibold">רמת קושי</th>
                    <th className="px-4 py-3 text-right font-semibold">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {userRecipes.map((recipe) => (
                    <tr key={recipe.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-sans text-ink">
                        <button
                          onClick={() => onSelectRecipe(recipe.id)}
                          className="text-primary hover:underline text-left"
                        >
                          {recipe.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-sans text-ink text-sm">{recipe.cuisine}</td>
                      <td className="px-4 py-3 font-sans text-sm">
                        <span className={`px-2 py-1 rounded text-white ${
                          recipe.difficulty === 'קל'
                            ? 'bg-green-600'
                            : recipe.difficulty === 'בינוני'
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}>
                          {recipe.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(recipe.id)}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                          >
                            ערוך
                          </button>
                          <button
                            onClick={() => handleDelete(recipe.id, recipe.name)}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
                          >
                            מחק
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
