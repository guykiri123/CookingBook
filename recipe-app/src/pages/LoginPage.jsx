import { useState } from 'react';
import { useAuth } from '../context/authContext';

export default function LoginPage({ onLoginSuccess, onSwitchToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'התחברות נכשלה');
        setLoading(false);
        return;
      }

      const data = await res.json();
      login(data.token, data.user);
      onLoginSuccess();
    } catch (err) {
      setError('שגיאה בחיבור לשרת');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full" dir="rtl">
        <h1 className="text-3xl font-display font-bold text-primary mb-6 text-center">התחברות</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-sans font-medium text-ink mb-2">דוא״ל</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-sans font-medium text-ink mb-2">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-sans font-medium py-2 rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
          >
            {loading ? 'מתחבר...' : 'התחבר'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm font-sans text-ink">
          עדיין אין לך חשבון?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-primary font-medium hover:underline"
          >
            הירשם כאן
          </button>
        </div>
      </div>
    </div>
  );
}
