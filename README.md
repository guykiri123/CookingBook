# 📚 ספר המתכונים — Cooking Book

<div dir="rtl">

**אפליקציית ניהול מתכונים פסטה אינטראקטיבית עם בינה מלאכותית, משלבת React 19 + Express API + Claude AI.**

[🌐 ניסיון חי](https://cookingbook-bf50.onrender.com) • [🚀 התחלה מהירה](#-התחלה-מהירה) • [📖 תיעוד](#-תיעוד-נוסף) • [🤝 תרומה](#-תרומה)

---

## ✨ מה זה ספר המתכונים?

**ספר המתכונים** היא אפליקציית ניהול מתכונים מודרנית שעזרה לך:
- 🔍 **לחפש בשפה טבעית** — חפש "משהו קל וחלבי" וה-AI יוצא מתכונים רלוונטיים
- 👨‍🍳 **שאל את השף** — שאל שאלות בעברית וקבל עצות בישול בזמן אמת מClaude
- 📋 **ניהול מתכונים** — הוסף, עדכן, וחק מתכונים שלך
- ⭐ **דירוגים וביקורות** — דרג מתכונים וקרא מה חושבים אחרים
- 💪 **מידע תזונתי** — עיין בקלוריות וערכים תזונתיים מחושבים
- 🎯 **שליטה בגודל מנה** — שנה את מספר הנמונות וכל הכמויות מתעדכנות אוטומטית
- ❤️ **מתכונים מועדפים** — שמור את המתכונים החביבים שלך

---

## 🎨 בעיצוב חדש ודינמי

ניסוי חדש בעיצוב:
- **פלטה אדמתית חמה:** terracotta + olive green + parchment
- **אייקונים SVG נקיים** — הסרת emojis לטובת line-art מינימלי
- **אנימציות חלקות** — מעברים בין עמודים, hovers על כרטיסים, וכפתורים דינמיים

---

## 🚀 התחלה מהירה

### למשתמשים סופיים

```bash
cd recipe-app
npm install
npm run dev
```

**פתח את:** http://localhost:5173

#### צעדים ראשונים:
1. **הרשם** — לחץ על "התחבר" ברnavbar וק "הירשם"
2. **דפדף** — חזור ל-homepage וחפש מתכונים
3. **חפש חכם** — לחץ על כפתור "רגיל" כדי להפוך ל"חכם" וחפש בעברית טבעית
4. **ניהול** — לחץ על "המתכונים שלי" כדי לראות ולערוך את המתכונים שלך

---

## 💻 Setup למתפתחים

### דרישות
- **Node.js** 18+ ו-npm 9+
- **Anthropic API Key** (free or paid) — עבור AI features

### התקנה

```bash
# Clone the repo
git clone https://github.com/guykiri123/CookingBook.git
cd CookingBook/recipe-app

# Install dependencies
npm install

# Create .env file
echo 'ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY-HERE' > .env
echo 'JWT_SECRET=your-secret-key-change-in-production' >> .env

# Start dev server (Vite + Express)
npm run dev
```

**Vite** תיפתח ב-http://localhost:5173  
**Express API** יריץ על http://localhost:3001

### Build & Preview

```bash
npm run build    # Production build to dist/
npm run preview  # Serve the built app locally
npm run lint     # Run ESLint
```

---

## 🚀 Deployment (Render)

**Live Demo:** https://cookingbook-bf50.onrender.com

### Deploy Your Own

1. **Fork the repo** on GitHub
2. **Create Render account** at https://render.com (connect GitHub)
3. **New Web Service:**
   - Choose your forked repo
   - Set **Branch:** `main`
   - Set **Root Directory:** `recipe-app`
   - Set **Build Command:** `cd recipe-app && npm install && npm run build`
   - Set **Start Command:** `cd recipe-app && npm start`

4. **Add Environment Variables** (in Render dashboard):
   - `ANTHROPIC_API_KEY=sk-ant-api03-...` (from https://console.anthropic.com)
   - `JWT_SECRET=your-secret-key-change-in-production`

5. **Keep-Alive (Optional):** Use [UptimeRobot](https://uptimerobot.com) (free) to ping your service every 5 minutes so it never sleeps

### Troubleshooting Deployment

- **Build fails with "Node.js 18 not supported"** — Render reads `.nvmrc` in repo root. Ensure it contains `20` or higher.
- **"Missing script: start"** — Ensure `package.json` in `recipe-app/` has `"start": "node server/index.js"`
- **AI features return 500** — Check `ANTHROPIC_API_KEY` is set in Render environment variables and account has credits

---

## ⚙️ Configuration

### `.env` פרמטרים

| משתנה | דרוש? | תיאור |
|-------|--------|-------|
| `ANTHROPIC_API_KEY` | ✅ כן | API key מ-https://console.anthropic.com |
| `JWT_SECRET` | אופציונלי | סוד החתימה, Default: `'your-secret-key-change-in-production'` |

**איך להשיג Anthropic API Key:**
1. עבור ל-https://console.anthropic.com
2. בדוק את ה-billing ודפק שיש credits
3. עבור ל-API keys וקליק "Create Key"
4. Copy את ה-key ולהדביק לתוך `.env`

---

## 📁 Project Structure

```
recipe-app/
├── src/
│   ├── components/          # React components
│   │   ├── NavBar.jsx       # Navigation with SVG icons
│   │   ├── RecipeCard.jsx   # Recipe grid card
│   │   ├── FilterBar.jsx    # Cuisine/difficulty/diet filters
│   │   ├── NutritionFacts.jsx
│   │   └── RecipeChat.jsx   # AI chat assistant
│   ├── pages/
│   │   ├── HomePage.jsx     # Recipe browsing + smart search
│   │   ├── RecipePage.jsx   # Single recipe with scaling
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── AdminPage.jsx    # User management (admins only)
│   │   ├── UserRecipesPage.jsx  # My recipes
│   │   └── FavoritesPage.jsx
│   ├── context/
│   │   ├── AuthProvider.jsx      # Login/logout, JWT token
│   │   ├── recipesContext.js     # Recipe CRUD
│   │   └── favoritesContext.js   # Favorites (localStorage)
│   ├── data/
│   │   ├── recipes.js        # Source of truth for recipes
│   │   ├── cuisines.js
│   │   ├── dietaryTags.js
│   │   └── nutritionDatabase.js
│   ├── index.css             # Tailwind + design system
│   └── App.jsx               # Main app, routing logic
├── server/
│   ├── index.js              # Express API server
│   └── middleware/           # Auth, error handling
├── data/
│   ├── recipes.json          # Generated from recipes.js
│   └── users.json            # User database (bcrypt hashed)
├── vite.config.js
├── package.json
├── tailwind.config.js        # (Ignored by Tailwind v4)
└── .env                      # API keys (never committed!)
```

---

## 📡 API Endpoints

### Authentication
| Method | URL | משמעות |
|--------|-----|----------|
| POST | `/api/auth/register` | הרשם משתמש חדש |
| POST | `/api/auth/login` | התחבר |
| GET | `/api/auth/me` | בדוק משתמש נוכחי |

### Recipes (דורש JWT token)
| Method | URL | משמעות |
|--------|-----|----------|
| GET | `/api/recipes` | קבל כל המתכונים |
| POST | `/api/recipes` | הוסף מתכון חדש |
| PUT | `/api/recipes/:id` | עדכן מתכון |
| DELETE | `/api/recipes/:id` | מחק מתכון |
| POST | `/api/recipes/:id/reviews` | הוסף דירוג/ביקורת |
| DELETE | `/api/recipes/:id/reviews/:reviewId` | מחק ביקורת |

### Admin (דורש admin role)
| Method | URL | משמעות |
|--------|-----|----------|
| GET | `/api/admin/users` | רשימת משתמשים |
| POST | `/api/admin/users` | הוסף משתמש |
| PUT | `/api/admin/users/:id` | עדכן משתמש |
| DELETE | `/api/admin/users/:id` | מחק משתמש |

### AI
| Method | URL | משמעות |
|--------|-----|----------|
| POST | `/api/ai/search` | חפש מתכונים בשפה טבעית |
| POST | `/api/ai/chat` | שאל את השף |

---

## 🧪 Tech Stack

### Frontend
- **React 19** — UI framework
- **Vite 8** — Build tool & dev server
- **Tailwind CSS v4** — Styling (with @theme design system)
- **@anthropic-ai/sdk** — Claude API client

### Backend
- **Express.js** — REST API
- **JWT** — Authentication (jsonwebtoken)
- **bcryptjs** — Password hashing
- **dotenv** — Environment variables

### Design
- **Design:** Warm & earthy (terracotta, olive, parchment)
- **Typography:** Frank Ruhl Libre (Hebrew headings), Heebo (body)
- **Direction:** RTL (right-to-left) for Hebrew

### External Services & Infrastructure
- **[Anthropic Claude API](https://www.anthropic.com)** — AI-powered natural language search and recipe chat assistant
  - Model: `claude-haiku-4-5-20251001` (fast, cost-efficient)
  - Features: Smart recipe search, cooking advice in Hebrew
- **[GitHub](https://github.com/guykiri123/CookingBook)** — Source control & version management
- **[Render](https://render.com)** — Cloud deployment platform
  - Hosts the live app: https://cookingbook-bf50.onrender.com
  - Free tier with auto-deploy on `main` branch push
  - Persistent storage for recipes.json and users.json
- **[UptimeRobot](https://uptimerobot.com)** — Uptime monitoring & keep-alive service
  - Pings the app every 5 minutes to prevent Render free tier from sleeping
  - Free tier available

---

## 🤝 תרומה

אנחנו מברכים תרומות! כך תוכל לעזור:

### הוספת מתכון חדש
1. ערוך [`recipe-app/src/data/recipes.js`](recipe-app/src/data/recipes.js)
2. הוסף recipe object חדש למערך:
   ```js
   {
     id: 'new-recipe',
     name: 'שם המתכון',
     description: 'תיאור קצר',
     difficulty: 'קל' | 'בינוני' | 'קשה',
     cuisine: 'קטגוריה',
     dietType: 'בשרי' | 'חלבי' | 'פרווה' | 'דגים',
     prepTime: 'פחות מ-30' | '30-60' | 'יותר משעה',
     servings: 4,
     ingredients: [{ name: 'חומר', amount: 2, unit: 'כוס' }],
     instructions: ['צעד 1', 'צעד 2'],
     cookTime: 20,
     tips: 'עצה שימושית',
     createdAt: new Date().toISOString(),
     author: 'שמך',
     authorId: 'your-user-id',
   }
   ```
3. ריצה:
   ```bash
   node -e "import recipes from './src/data/recipes.js'; import fs from 'fs'; fs.writeFileSync('./data/recipes.json', JSON.stringify(recipes, null, 2), 'utf-8');"
   ```
4. הפעל `npm run dev` מחדש וודא שמתכון חדש הוא כאן

### שיפור עיצוב
- Colors בקובץ [`src/index.css`](recipe-app/src/index.css) `@theme` block
- SVG icons ב-[`src/components/NavBar.jsx`](recipe-app/src/components/NavBar.jsx)
- Animations בקובץ [`src/index.css`](recipe-app/src/index.css) `@keyframes`

### דיווח על באגים
פתח issue עם:
- תיאור בעיה
- צעדים לשחזור
- סקרין שוט / video

---

## 🐛 Troubleshooting

### "App doesn't load" / blank page
→ ודא שאתה ב-http://localhost:5173 (בדוק את ה-port שנדפס על ידי Vite)

### "Recipe server is down" / API errors
→ בדוק שExpressתחת port 3001. ריצה `npm run dev` מחדש.

### AI features don't work
→ בדוק `ANTHROPIC_API_KEY` בתוך `.env` וודא accounts יש credits.

### "Unexpected token" בrecipes.json
→ **לעולם לא** השתמש בPowerShell לערוך recipes.json. תמיד השתמש ב-Node.js script.

ראה [`CLAUDE.md`](CLAUDE.md) לעוד troubleshooting tips.

---

## 📚 תיעוד נוסף

- **[CLAUDE.md](CLAUDE.md)** — Detailed dev guide, architecture, solved problems
- **[Architecture Decisions](CLAUDE.md#stack)** — Why React, Vite, Tailwind, Express

---

## 📄 License

MIT License — תוכל להשתמש בפרוייקט הזה בחופשיות עבור תכנים אישיים או מסחריים.

---

## 👤 Contact

**Author:** Guy Kiri  
**Email:** guykiri123@gmail.com  
**GitHub:** [@guykiri123](https://github.com/guykiri123)

---

<p dir="rtl" style="text-align: center; color: #888;">
  <strong>עשוי בלב עם ☕ וקצת 🍝</strong>
</p>

</div>

---

## English Summary

**CookingBook** is a Hebrew recipe management app with AI-powered natural language search and recipe assistant. Built with React 19, Vite, Tailwind CSS v4, and Express backend. Features include recipe scaling, nutrition facts, reviews, admin user management, and integration with Anthropic's Claude API.

**Quick start:** Clone → `npm install` → Set `.env` with `ANTHROPIC_API_KEY` → `npm run dev` → Open http://localhost:5173

See full documentation in `CLAUDE.md` for architecture, API endpoints, and development workflows.
