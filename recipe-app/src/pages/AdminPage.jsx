import { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';

export default function AdminPage({ onBack, onShowUserRecipes }) {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [action, setAction] = useState(null); // 'add' | 'edit' | null
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
  });

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetchUsers();
  }, [user, token]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ username: '', email: '', password: '', role: 'user' });
    setAction(null);
    setEditingUserId(null);
  };

  const startAdd = () => {
    resetForm();
    setAction('add');
    setError('');
    setSuccessMsg('');
  };

  const startEdit = (u) => {
    setFormData({
      username: u.username,
      email: u.email,
      password: '',
      role: u.role,
    });
    setEditingUserId(u.id);
    setAction('edit');
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (action === 'add') {
        if (!formData.password) {
          setError('סיסמה נדרשת');
          return;
        }

        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to add user');
        }

        const newUser = await res.json();
        setUsers([...users, newUser]);
        setSuccessMsg('משתמש נוצר בהצלחה');
        resetForm();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else if (action === 'edit') {
        const updateData = {
          username: formData.username,
          email: formData.email,
          role: formData.role,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }

        const res = await fetch(`/api/admin/users/${editingUserId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update user');
        }

        const updated = await res.json();
        setUsers(users.map(u => (u.id === editingUserId ? updated : u)));
        setSuccessMsg('המשתמש עודכן בהצלחה');
        resetForm();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`האם בטוח שאתה רוצה למחוק את ${username}?`)) return;

    try {
      setError('');
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete user');
      setUsers(users.filter(u => u.id !== userId));
      setSuccessMsg('המשתמש נמחק בהצלחה');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center" dir="rtl">
          <h1 className="text-2xl font-display font-bold text-primary mb-4">גישה נדחתה</h1>
          <p className="text-ink font-sans mb-6">רק מנהלים יכולים לגשת לדף זה.</p>
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

        <h1 className="text-4xl font-display font-bold text-primary mb-8">ניהול משתמשים</h1>

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

        {/* Form להוספה/עריכה */}
        {action && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-display font-bold text-primary mb-4">
              {action === 'add' ? 'הוסף משתמש חדש' : 'ערוך משתמש'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-sans font-medium text-ink mb-2">
                  שם משתמש
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="שם המשתמש"
                />
              </div>

              <div>
                <label className="block text-sm font-sans font-medium text-ink mb-2">
                  דוא״ל
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-sans font-medium text-ink mb-2">
                  סיסמה {action === 'edit' && '(השאר ריק לא לשנות)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={action === 'add'}
                  className="w-full px-4 py-2 border border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-sans font-medium text-ink mb-2">
                  תפקיד
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-sans"
                >
                  <option value="user">משתמש</option>
                  <option value="admin">מנהל</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white font-sans font-medium py-2 rounded-lg hover:bg-primary/90 transition"
                >
                  {action === 'add' ? 'צור משתמש' : 'עדכן משתמש'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 text-ink font-sans font-medium py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        )}

        {/* כפתור הוסף משתמש */}
        {!action && (
          <button
            onClick={startAdd}
            className="mb-6 inline-flex items-center gap-2 bg-secondary text-ink font-sans font-medium px-4 py-2 rounded-lg hover:bg-secondary/90 transition"
          >
            <span aria-hidden="true">＋</span> הוסף משתמש
          </button>
        )}

        {/* טבלת משתמשים */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-ink font-sans">טוען משתמשים...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary text-cream">
                  <tr>
                    <th className="px-4 py-3 text-right font-semibold">שם משתמש</th>
                    <th className="px-4 py-3 text-right font-semibold">דוא״ל</th>
                    <th className="px-4 py-3 text-right font-semibold">תפקיד</th>
                    <th className="px-4 py-3 text-right font-semibold">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-sans text-ink">{u.username}</td>
                      <td className="px-4 py-3 font-sans text-ink text-sm">{u.email}</td>
                      <td className="px-4 py-3 font-sans text-sm">
                        <span className={`px-2 py-1 rounded text-white ${u.role === 'admin' ? 'bg-amber-600' : 'bg-blue-600'}`}>
                          {u.role === 'admin' ? 'מנהל' : 'משתמש'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => startEdit(u)}
                            disabled={action !== null}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50"
                          >
                            ערוך
                          </button>
                          <button
                            onClick={() => onShowUserRecipes(u.id, u.username)}
                            disabled={action !== null}
                            className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition disabled:opacity-50"
                          >
                            📝 מתכונים
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, u.username)}
                            disabled={action !== null}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition disabled:opacity-50"
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

            {users.length === 0 && (
              <div className="text-center py-8">
                <p className="text-ink font-sans">אין משתמשים</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
