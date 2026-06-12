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
- **Node.js** 20+ ו-npm 9+
- **Anthropic API Key** (free or paid) — עבור AI features
- **MongoDB Atlas account** (free tier) — עבור persistence (https://www.mongodb.com/cloud/atlas)

### התקנה

```bash
# Clone the repo
git clone https://github.com/guykiri123/CookingBook.git
cd CookingBook/recipe-app

# Install dependencies
npm install

# Create .env file
echo 'ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY-HERE' > .env
echo 'MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/cookingbook' >> .env
echo 'JWT_SECRET=your-secret-key-change-in-production' >> .env
echo 'UNSPLASH_ACCESS_KEY=your-unsplash-key-optional' >> .env

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
   - `MONGODB_URI=mongodb+srv://...` (from MongoDB Atlas connection string)
   - `ANTHROPIC_API_KEY=sk-ant-api03-...` (from https://console.anthropic.com)
   - `UNSPLASH_ACCESS_KEY=...` (optional, from https://unsplash.com/developers)
   - `JWT_SECRET=your-secret-key-change-in-production`

5. **Keep-Alive (Optional):** Use [UptimeRobot](https://uptimerobot.com) (free) to ping your service every 5 minutes so it never sleeps

### Troubleshooting Deployment

- **Build fails with "Node.js 18 not supported"** — Render reads `.nvmrc` in repo root. Ensure it contains `20` or higher.
- **"Missing script: start"** — Ensure `package.json` in `recipe-app/` has `"start": "node server/index.js"`
- **AI features return 500** — Check `ANTHROPIC_API_KEY` is set in Render environment variables and account has credits

---

## 🔄 סינכרון נתונים בין Local & MongoDB

**הבעיה:** כשאתה משנה מתכונים או מוסיף ביקורות באתר Live (Render), השינויים נשמרים ב-MongoDB אבל לא בקבצים המקומיים (`recipes.json`, `users.json`).

**הפתרון:** השתמש ב-sync script להוריד את הנתונים מ-MongoDB חזרה לקבצים המקומיים.

### סינכרון חד-פעמי

```bash
cd recipe-app
node sync-from-mongo.js
```

**תוצאה:** 
```
✅ 14:30:45 - Synced 4 users, 21 recipes
```

### סינכרון אוטומטי (המומלץ!)

```bash
cd recipe-app
node sync-from-mongo.js --watch
```

**זה יעשה:**
- 🔄 סינכרון כל 30 שניות
- ♾️ ללא הפסק (עד שתסגור את הטרמינל)
- 📝 `recipes.json` ו-`users.json` יתעדכנו אוטומטית

### Workflow מומלץ

```bash
# טרמינל 1 - Development
cd recipe-app
npm run dev

# טרמינל 2 - Sync אוטומטי (עזוב פתוח לכל הזמן!)
cd recipe-app
node sync-from-mongo.js --watch
```

**עכשיו:**
1. ערוך מתכונים / הוסף ביקורות באתר Live
2. בתוך 30 שניות, הקבצים המקומיים יתעדכנו
3. Commit & push ל-GitHub לתיעוד

---

## ⚙️ Configuration

### `.env` פרמטרים

| משתנה | דרוש? | תיאור |
|-------|--------|-------|
| `MONGODB_URI` | ✅ כן | MongoDB Atlas connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/cookingbook`) |
| `ANTHROPIC_API_KEY` | ✅ כן | API key מ-https://console.anthropic.com |
| `UNSPLASH_ACCESS_KEY` | ⚠️ אופציונלי | API key מ-https://unsplash.com/developers (עבור auto-generated recipe images) |
| `JWT_SECRET` | אופציונלי | סוד החתימה, Default: `'your-secret-key-change-in-production'` |

**איך להשיג MongoDB URI:**
1. עבור ל-https://www.mongodb.com/cloud/atlas
2. הרשם (free tier זמין)
3. בנה cluster חדש
4. בחר "Drivers" → "Connect" → "Connection String"
5. Copy את ה-connection string, החלף את `<password>` בסיסמה
6. Paste ל-.env בתור `MONGODB_URI`

**איך להשיג Anthropic API Key:**
1. עבור ל-https://console.anthropic.com
2. בדוק את ה-billing ודפק שיש credits
3. עבור ל-API keys וקליק "Create Key"
4. Copy את ה-key ולהדביק לתוך `.env`

**איך להשיג Unsplash API Key (optional):**
1. עבור ל-https://unsplash.com/developers
2. הרשם וקבל אפליקציה
3. Copy את `Access Key`
4. Paste ל-.env בתור `UNSPLASH_ACCESS_KEY`

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
│   ├── recipes.json          # Synced from MongoDB (local backup)
│   ├── users.json            # Synced from MongoDB (local backup)
│   └── migrate-data.js       # Script to migrate JSON to MongoDB
├── sync-from-mongo.js        # Sync script: downloads MongoDB → local JSON
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
- **MongoDB** — NoSQL database (persistent data storage)
- **Mongoose** — ODM for MongoDB
- **JWT** — Authentication (jsonwebtoken)
- **bcryptjs** — Password hashing
- **dotenv** — Environment variables

### Design
- **Design:** Warm & earthy (terracotta, olive, parchment)
- **Typography:** Frank Ruhl Libre (Hebrew headings), Heebo (body)
- **Direction:** RTL (right-to-left) for Hebrew

### External Services & Infrastructure
- **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)** — Cloud NoSQL database
  - Free tier with 512MB storage
  - Persistent storage for recipes, users, and reviews
  - Connected via Mongoose ODM in Express
- **[Anthropic Claude API](https://www.anthropic.com)** — AI-powered natural language search and recipe chat assistant
  - Model: `claude-haiku-4-5-20251001` (fast, cost-efficient)
  - Features: Smart recipe search, cooking advice in Hebrew
- **[Unsplash API](https://unsplash.com/developers)** — Auto-generate recipe images
  - Free tier with 50 requests/hour
  - Translates Hebrew recipe names to English for better image matches
- **[GitHub](https://github.com/guykiri123/CookingBook)** — Source control & version management
- **[Render](https://render.com)** — Cloud deployment platform
  - Hosts the live app: https://cookingbook-bf50.onrender.com
  - Free tier with auto-deploy on `main` branch push
  - Connects to MongoDB Atlas for persistent data
- **[UptimeRobot](https://uptimerobot.com)** — Uptime monitoring & keep-alive service
  - Pings the app every 5 minutes to prevent Render free tier from sleeping
  - Free tier available

---

## 🤝 תרומה

אנחנו מברכים תרומות! כך תוכל לעזור:

### הוספת מתכון חדש
**דרך 1: דרך ה-UI (מומלץ)**
1. פתח http://localhost:5173 (או https://cookingbook-bf50.onrender.com)
2. התחבר לחשבון שלך
3. לחץ "⨚ הוסף מתכון" בNavBar
4. מלא פרטים והוסף
5. המתכון נשמר אוטומטית ל-MongoDB

**דרך 2: ידני (development)**
1. ערוך [`recipe-app/src/data/recipes.js`](recipe-app/src/data/recipes.js) (development backup)
2. הוסף object חדש למערך
3. **תשכח מהremigrate!** עכשיו הנתונים הם ב-MongoDB, לא בJSON

**סנכרון ל-Local:**
```bash
node sync-from-mongo.js
```
הקבצים JSON יתעדכנו מ-MongoDB

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
→ בדוק שExpress רץ על port 3001. ריצה `npm run dev` מחדש.

### "MongoDB connection error"
→ בדוק:
- `MONGODB_URI` בתוך `.env` (נוכחי?)
- IP whitelist ב-MongoDB Atlas (הוסף 0.0.0.0/0)
- Render environment variables (סט ב-dashboard?)

### "Recipes not appearing"
→ בדוק שMongoDB מחובר (לא error בserverogs). הרץ `node sync-from-mongo.js` להוריד נתונים.

### AI features don't work
→ בדוק `ANTHROPIC_API_KEY` בתוך `.env` וודא חשבון יש credits.

### Recipe images don't load
→ `UNSPLASH_ACCESS_KEY` אופציונלי. אם הוא הוגדר, בדוק את ה-API quota בUnsplash.

### Local files out of sync
→ הרץ: `node sync-from-mongo.js --watch` (סנכרון אוטומטי כל 30 שניות)

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
