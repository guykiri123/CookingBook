import { useState, useEffect } from 'react';
import { useRecipes } from '../context/recipesContext';
import { useAuth } from '../context/authContext';
import { fileToScaledDataUrl } from '../utils/image';
import { CUISINES } from '../data/cuisines';
import { DIETARY_TAGS } from '../data/dietaryTags';

const DIFFICULTIES = ['קל', 'בינוני', 'קשה'];
const DIET_TYPES = ['בשרי', 'חלבי', 'פרווה', 'דגים'];
const PREP_TIMES = ['פחות מ-30', '30-60', 'יותר משעה'];
const UNITS = ['גרם', 'קילוגרם', 'כוס', 'כפיים', 'כף', 'שיניים', 'מיכל', 'חפיסה', 'יחידה', 'לטעם'];

const emptyIngredient = () => ({ name: '', amount: '', unit: '' });

const fieldClass =
  'w-full bg-white text-ink rounded-lg border-2 border-accent/60 px-4 py-3 focus:border-primary focus:outline-none transition-colors';
const ingredientFieldClass =
  'bg-white text-ink text-sm rounded-lg border-2 border-accent/60 px-3 py-2 focus:border-primary focus:outline-none transition-colors';
const labelClass = 'block text-sm font-medium text-ink mb-1.5';

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className={labelClass}>
        {label} {required && <span className="text-primary">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-ink-soft mt-1">{hint}</p>}
    </div>
  );
}

export default function AddRecipePage({ editId, onCreated, onCancel }) {
  const { isLoggedIn, user } = useAuth();
  const { recipes, addRecipe, updateRecipe } = useRecipes();

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center" dir="rtl">
          <h1 className="text-2xl font-display font-bold text-primary mb-4">נדרשת התחברות</h1>
          <p className="text-ink font-sans mb-6">עליך להיות מחובר כדי להוסיף או לערוך מתכונים.</p>
          <button
            onClick={onCancel}
            className="w-full bg-primary text-white font-sans font-medium py-2 rounded-lg hover:bg-primary/90 transition"
          >
            חזור לדף הבית
          </button>
        </div>
      </div>
    );
  }
  const existing = editId != null ? recipes.find((r) => r.id === editId) : null;
  const isEditing = Boolean(existing);

  const [form, setForm] = useState(() => ({
    name: existing?.name ?? '',
    author: existing?.author ?? user?.username ?? '',
    description: existing?.description ?? '',
    cuisine: existing?.cuisine ?? '',
    difficulty: existing?.difficulty ?? 'קל',
    dietType: existing?.dietType ?? 'פרווה',
    prepTime: existing?.prepTime ?? 'פחות מ-30',
    servings: existing?.servings ?? 4,
    tips: existing?.tips ?? '',
  }));
  const [ingredients, setIngredients] = useState(() =>
    existing?.ingredients?.length
      ? existing.ingredients.map((i) => ({
          name: i.name,
          amount: i.amount === '' || i.amount == null ? '' : String(i.amount),
          unit: i.unit,
        }))
      : [emptyIngredient()]
  );
  const [instructions, setInstructions] = useState(() =>
    existing?.instructions?.length ? [...existing.instructions] : ['']
  );
  const [tags, setTags] = useState(() => existing?.tags ?? []);
  const [image, setImage] = useState(existing?.image ?? null);
  const [imageError, setImageError] = useState('');
  const [errors, setErrors] = useState([]);


  const setField = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const toggleTag = (id) =>
    setTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const updateIngredient = (idx, key, value) =>
    setIngredients((prev) => prev.map((ing, i) => (i === idx ? { ...ing, [key]: value } : ing)));
  const addIngredient = () => setIngredients((prev) => [...prev, emptyIngredient()]);
  const removeIngredient = (idx) =>
    setIngredients((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const updateInstruction = (idx, value) =>
    setInstructions((prev) => prev.map((step, i) => (i === idx ? value : step)));
  const addInstruction = () => setInstructions((prev) => [...prev, '']);
  const removeInstruction = (idx) =>
    setInstructions((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    setImageError('');
    if (!file) {
      setImage(null);
      return;
    }
    try {
      const dataUrl = await fileToScaledDataUrl(file);
      setImage(dataUrl);
    } catch (err) {
      setImage(null);
      setImageError(err.message || 'לא ניתן לטעון את התמונה');
    }
  };

  const validate = () => {
    const errs = [];
    if (!form.name.trim()) errs.push('יש להזין שם מתכון');
    if (!form.description.trim()) errs.push('יש להזין תיאור קצר');
    if (!form.cuisine.trim()) errs.push('יש להזין סוג מטבח');
    if (Number(form.servings) <= 0) errs.push('מספר הסועדים חייב להיות גדול מ-0');

    const validIngredients = ingredients.filter((i) => i.name.trim());
    if (validIngredients.length === 0) errs.push('יש להוסיף לפחות רכיב אחד');

    const validInstructions = instructions.filter((s) => s.trim());
    if (validInstructions.length === 0) errs.push('יש להוסיף לפחות שלב הכנה אחד');

    return { errs, validIngredients, validInstructions };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { errs, validIngredients, validInstructions } = validate();
    if (errs.length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrors([]);

    const recipe = {
      name: form.name.trim(),
      description: form.description.trim(),
      cuisine: form.cuisine.trim(),
      difficulty: form.difficulty,
      dietType: form.dietType,
      prepTime: form.prepTime,
      cookTime: existing?.cookTime ?? 15,
      servings: Number(form.servings),
      tips: form.tips.trim(),
      tags,
      image: image || null,
      ingredients: validIngredients.map((i) => ({
        name: i.name.trim(),
        amount: i.amount === '' ? 1 : Number(i.amount),
        unit: i.unit.trim() || 'יח׳',
      })),
      instructions: validInstructions.map((s) => s.trim()),
    };

    if (user?.role === 'admin') {
      recipe.author = form.author.trim();
    }

    try {
      if (isEditing) {
        updateRecipe(editId, recipe);
        onCreated(editId);
      } else {
        const newId = addRecipe(recipe);
        onCreated(newId);
      }
    } catch {
      setErrors([
        'שמירת המתכון נכשלה — ייתכן שאחסון הדפדפן מלא. נסו תמונה קטנה יותר או הסירו מתכונים קיימים.',
      ]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-up">
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-2 text-primary font-medium border-2 border-primary px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 mb-6"
      >
        <span aria-hidden="true">◄</span> חזרה
      </button>

      <h1 className="font-display font-bold text-3xl sm:text-4xl text-ink mb-2 flex items-center gap-3">
        <span aria-hidden="true">{isEditing ? '✏️' : '➕'}</span>{' '}
        {isEditing ? 'עריכת מתכון' : 'הוספת מתכון חדש'}
      </h1>
      <p className="text-ink-soft mb-8">
        {isEditing
          ? 'עדכנו את הפרטים ושמרו את השינויים'
          : 'מלאו את הפרטים והמתכון יתווסף לספר המתכונים'}
      </p>

      {errors.length > 0 && (
        <div
          role="alert"
          className="bg-red-50 border border-red-300 text-red-800 rounded-xl p-4 mb-6"
        >
          <p className="font-semibold mb-1">יש לתקן את הפרטים הבאים:</p>
          <ul className="list-disc pr-5 space-y-0.5 text-sm">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic details */}
        <section className="bg-white rounded-2xl border border-accent/20 shadow-sm p-6 space-y-5">
          <h2 className="font-display text-xl text-ink">פרטים כלליים</h2>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="שם המתכון" required>
              <input className={fieldClass} value={form.name} onChange={setField('name')} />
            </Field>
            {user?.role === 'admin' && (
              <Field label="שם המעלה" hint="רק אדמינים יכולים לשנות זאת">
                <input
                  className={fieldClass}
                  value={form.author}
                  onChange={setField('author')}
                />
              </Field>
            )}
          </div>

          <Field label="תיאור קצר" required>
            <textarea
              className={`${fieldClass} resize-y min-h-[80px]`}
              value={form.description}
              onChange={setField('description')}
            />
          </Field>

          <Field label="תמונת המתכון" hint="לא חובה. התמונה תוקטן אוטומטית לשמירה מקומית.">
            <input
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="block w-full text-sm text-ink-soft file:mr-0 file:ml-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-cream file:font-medium file:cursor-pointer hover:file:bg-primary-dark"
            />
            {imageError && <p className="text-sm text-red-700 mt-2">{imageError}</p>}
            {image && (
              <img
                src={image}
                alt="תצוגה מקדימה"
                className="mt-3 h-40 w-full object-cover rounded-xl border border-accent/30"
              />
            )}
          </Field>
        </section>

        {/* Categorisation */}
        <section className="bg-white rounded-2xl border border-accent/20 shadow-sm p-6 space-y-5">
          <h2 className="font-display text-xl text-ink">סיווג</h2>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="סוג מטבח" required>
              <select
                className={`${fieldClass} select-rtl pl-9 cursor-pointer`}
                value={form.cuisine}
                onChange={setField('cuisine')}
              >
                <option value="" disabled>בחרו סוג מטבח...</option>
                {CUISINES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="רמת קושי" required>
              <select className={`${fieldClass} select-rtl pl-9 cursor-pointer`} value={form.difficulty} onChange={setField('difficulty')}>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="סוג תזונה" required>
              <select className={`${fieldClass} select-rtl pl-9 cursor-pointer`} value={form.dietType} onChange={setField('dietType')}>
                {DIET_TYPES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="טווח זמן הכנה" required>
              <select className={`${fieldClass} select-rtl pl-9 cursor-pointer`} value={form.prepTime} onChange={setField('prepTime')}>
                {PREP_TIMES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="מספר סועדים (בסיס)" required hint="הכמויות יתאימו אוטומטית למספר זה">
              <input
                type="number"
                min="1"
                className={fieldClass}
                value={form.servings}
                onChange={setField('servings')}
              />
            </Field>
          </div>
        </section>

        {/* Dietary tags */}
        <section className="bg-white rounded-2xl border border-accent/20 shadow-sm p-6">
          <h2 className="font-display text-xl text-ink mb-1">העדפות תזונה (לא חובה)</h2>
          <p className="text-xs text-ink-soft mb-4">
            סמנו את המתאים — הסמל יופיע בקטן על תמונת המתכון לידיעת המבשל.
          </p>
          <div className="flex flex-wrap gap-3">
            {DIETARY_TAGS.map((t) => {
              const checked = tags.includes(t.id);
              return (
                <label
                  key={t.id}
                  className={`inline-flex items-center gap-2 cursor-pointer select-none rounded-full border-2 px-4 py-2 transition-colors ${
                    checked
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-accent/40 text-ink-soft hover:bg-cream'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-primary w-4 h-4"
                    checked={checked}
                    onChange={() => toggleTag(t.id)}
                  />
                  <span aria-hidden="true">{t.emoji}</span>
                  <span className="font-medium">{t.label}</span>
                </label>
              );
            })}
          </div>
        </section>

        {/* Ingredients */}
        <section className="bg-white rounded-2xl border border-accent/20 shadow-sm p-6">
          <h2 className="font-display text-xl text-ink mb-1">רכיבים</h2>
          <p className="text-xs text-ink-soft mb-4">
            עבור רכיב "לפי הטעם" — הזינו <span className="font-semibold">לטעם</span> בשדה היחידה (הכמות לא תוצג).
          </p>
          <div className="space-y-2">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded border-2 border-accent/40 bg-primary/10 font-bold text-primary text-xs">
                  {idx + 1}
                </div>
                <input
                  className={`${ingredientFieldClass} flex-1`}
                  placeholder="שם המרכיב"
                  value={ing.name}
                  onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  step="any"
                  className={`${ingredientFieldClass} w-24 flex-shrink-0`}
                  placeholder="כמות"
                  value={ing.amount}
                  onChange={(e) => updateIngredient(idx, 'amount', e.target.value)}
                />
                <select
                  className={`${ingredientFieldClass} select-rtl w-24 pl-7 cursor-pointer flex-shrink-0`}
                  value={ing.unit}
                  onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                >
                  <option value="" disabled>יחידה</option>
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  disabled={ingredients.length === 1}
                  className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded border border-accent/40 text-ink-soft text-sm hover:bg-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="הסר רכיב"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addIngredient}
            className="mt-4 text-primary font-medium border-2 border-dashed border-primary/50 rounded-lg px-4 py-2 hover:bg-primary/5 transition-colors"
          >
            ＋ הוסף רכיב
          </button>
        </section>

        {/* Instructions */}
        <section className="bg-white rounded-2xl border border-accent/20 shadow-sm p-6">
          <h2 className="font-display text-xl text-ink mb-4">הוראות הכנה</h2>
          <div className="space-y-3">
            {instructions.map((step, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <span className="flex-shrink-0 w-9 h-12 flex items-center justify-center font-bold text-primary">
                  {idx + 1}.
                </span>
                <textarea
                  className={`${fieldClass} flex-1 resize-y min-h-[48px]`}
                  placeholder={`שלב ${idx + 1}`}
                  value={step}
                  onChange={(e) => updateInstruction(idx, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeInstruction(idx)}
                  disabled={instructions.length === 1}
                  className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg border-2 border-accent/40 text-ink-soft hover:bg-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="הסר שלב"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addInstruction}
            className="mt-4 text-primary font-medium border-2 border-dashed border-primary/50 rounded-lg px-4 py-2 hover:bg-primary/5 transition-colors"
          >
            ＋ הוסף שלב
          </button>
        </section>

        {/* Tips */}
        <section className="bg-white rounded-2xl border border-accent/20 shadow-sm p-6">
          <h2 className="font-display text-xl text-ink mb-4">טיפ (לא חובה)</h2>
          <textarea
            className={`${fieldClass} resize-y min-h-[70px]`}
            placeholder="טיפ שימושי להכנה..."
            value={form.tips}
            onChange={setField('tips')}
          />
        </section>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-full font-semibold border-2 border-accent/50 text-ink hover:bg-cream transition-colors"
          >
            ביטול
          </button>
          <button
            type="submit"
            className="bg-primary text-cream font-semibold px-8 py-3 rounded-full hover:bg-primary-dark active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
          >
            {isEditing ? 'שמור שינויים' : 'פרסם מתכון'}
          </button>
        </div>
      </form>
    </div>
  );
}
