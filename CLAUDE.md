# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Personal preferences

@CLAUDE.local.md

## Solved problems log

**Standing instruction:** whenever you get stuck on a problem and find a working
solution, append it here as a short Problem → Cause → Solution entry. This saves
future sessions the time, work, and tokens of re-debugging the same thing. Check
this list before debugging. (Tailwind v4 and RTL/Hebrew pitfalls already have
their own dedicated sections below — don't duplicate them here.)

- **(2026-05-28) "App doesn't work" / blank or wrong page.**
  Cause: orphaned Vite dev servers from earlier runs held ports 5173–5176, so
  `npm run dev` kept landing on a different port than expected and the user
  opened the wrong URL.
  Solution: kill stray servers with `taskkill //F //IM node.exe` (Windows), then
  start one fresh `npm run dev` and report the exact port it prints.

- **(2026-06-07) API calls fail / recipes don't persist to file.**
  Cause: Express server path to `recipes.json` was incorrect (`join(__dirname, 'data', ...)` instead of `join(__dirname, '..', 'data', ...)`), so server read/wrote to the wrong location.
  Solution: Fix path in [recipe-app/server/index.js](recipe-app/server/index.js) line 12: `const RECIPES_FILE = join(__dirname, '..', 'data', 'recipes.json');` (one level up from server dir).
  
- **(2026-06-07) "PayloadTooLargeError: request entity too large"**
  Cause: Express body parser rejects requests larger than 100KB by default. Images encoded as base64 exceed this.
  Solution: Set limits in [recipe-app/server/index.js](recipe-app/server/index.js) lines 19–20: `app.use(express.json({ limit: '50mb' }))` and `app.use(express.urlencoded({ limit: '50mb', extended: true }))`.

- **(2026-06-07) recipes.json corrupted / API returns 0 recipes / "Unexpected token '﻿', not valid JSON"**
  Cause: PowerShell's `ConvertTo-Json` and `Out-File -Encoding utf8` add a UTF-8 Byte Order Mark (BOM) at the start of the file (`﻿`). Node.js's `JSON.parse()` rejects this as invalid JSON. Also, ConvertTo-Json corrupts Hebrew text encoding.
  Solution: **Never use PowerShell to create or modify recipes.json.** Always use Node.js: `node -e "import recipes from './src/data/recipes.js'; import fs from 'fs'; fs.writeFileSync('./data/recipes.json', JSON.stringify(recipes, null, 2), 'utf-8');"` This avoids BOM and preserves Hebrew correctly. If recipes.json is corrupted, regenerate it with this command.

- **(2026-06-07) AI features fail / "Could not resolve authentication method" or "Your credit balance is too low"**
  Cause: `.env` file missing, empty, or API key invalid; Anthropic account had no credits.
  Solution: (1) Create `recipe-app/.env` with `ANTHROPIC_API_KEY=sk-ant-api03-...` from https://console.anthropic.com/account/billing/overview; (2) restart `npm run dev`; (3) if error persists, verify account has billing setup at https://console.anthropic.com/account/billing/overview and sufficient credits.

- **(2026-06-07) Smart search returns no results / homepage filtering broken**
  Cause: debounce timer lingering in the useEffect cleanup; API called but results not applied to filtered recipes. Also, the AI response may have been empty or malformed JSON.
  Solution: Ensure the API response JSON is valid before parsing (`const jsonMatch = responseText.match(/\{[\s\S]*\}/)`). Verify `/api/ai/search` endpoint exists and server logs show the request coming through. Test with simple queries like "קל" or "חלבי" first.

- **(2026-06-07) "My Recipes" page shows no recipes / filtering broken**
  Cause: (1) RecipesProvider had dependency array `[]`, not loading recipes when user changes; (2) NavBar onClick handler passed browser event as userId parameter instead of null.
  Solution: (1) Change RecipesProvider dependency from `[]` to `[token]` so recipes reload when user logs in/out. (2) Change NavBar onClick from `onClick={onShowUserRecipes}` to `onClick={() => onShowUserRecipes()}` to avoid passing event object as parameter.

- **(2026-06-07) onClick handler receives event instead of parameters**
  Cause: When onClick calls a function directly (e.g., `onClick={handleFunc}`), the browser passes the SyntheticEvent as the first parameter.
  Solution: Always wrap event handlers in arrow functions: `onClick={() => handleFunc()}` or `onClick={() => handleFunc(arg1, arg2)}`. This prevents unintended parameters.

- **(2026-06-12) Page transitions feel abrupt / no animation between pages**
  Cause: `<main>` was re-rendering on `currentPage` change without animation support. Missing keyframe and CSS class definitions.
  Solution: (1) Added `@keyframes page-enter` to `src/index.css`: opacity 0→1 + translateY(14px)→0 over 0.35s. (2) Added `key={currentPage}` to `<main>` in App.jsx + class `animate-page-enter` so React re-mounts and triggers the animation. (3) Shortened `animate-fade-up` from 0.6s to 0.5s for snappier feel.

- **(2026-06-12) Image auto-generation fails / "No image found for recipe X" / `imageResponse.buffer is not a function`**
  Cause: (1) Missing or invalid `UNSPLASH_ACCESS_KEY` in `.env`; (2) Hebrew recipe names don't match Unsplash search results; (3) Using deprecated `buffer()` method with Node.js built-in fetch (use `arrayBuffer()` instead).
  Solution: (1) Get free Unsplash key from https://unsplash.com/developers and add to `.env`: `UNSPLASH_ACCESS_KEY=...`. (2) For recipes with no Hebrew match, script gracefully skips them with a warning (not an error). Claude automatically translates Hebrew recipe names to English before searching Unsplash for better results. (3) Use `await imageResponse.arrayBuffer()` then `Buffer.from(arrayBuffer)` for built-in fetch API.

- **(2026-06-12) Auto-generated images are off-topic (e.g., wrong dish)**
  Cause: Unsplash search returned irrelevant image for the recipe name, even after English translation.
  Solution: (1) Manually source image from external website (e.g., food blog, recipe site). (2) Download image, convert to base64, and embed in recipes.json via Node.js: `curl IMAGE_URL | base64 | tr -d '\n'`, then update recipe object with `"image": "data:image/jpeg;base64,..."`. (3) Or use the CLI workflow below.

## Project layout

The actual application lives in the `recipe-app/` subdirectory, not the repo root. Run all commands from `recipe-app/`.

**Documentation:** See [README.md](README.md) for user-facing guides and getting started instructions. This CLAUDE.md focuses on architecture and developer workflows.

**Repository:** https://github.com/guykiri123/CookingBook

```bash
cd recipe-app
npm install
npm run dev      # start Vite dev server (http://localhost:5173) + Express API server (http://localhost:3001)
npm run build    # production build to dist/
npm run preview  # serve the production build locally
npm run lint     # ESLint over the project
```

`npm run dev` uses `concurrently` to launch both servers simultaneously. The Vite dev server proxies all `/api` requests to the Express server.

There is no test suite configured.

## Stack

Vite 8 + React 19 + Tailwind CSS **v4**. The app is a Hebrew, right-to-left (RTL) single-page recipe book for pasta dishes.

**AI Integration:** Claude API via `@anthropic-ai/sdk` (model: `claude-haiku-4-5-20251001`). Two AI features: natural language search (smart filtering) and recipe chat assistant. API key stored in `recipe-app/.env` as `ANTHROPIC_API_KEY` (must be added by user, never committed).

## Architecture

- **Recipe source file:** [recipe-app/src/data/recipes.js](recipe-app/src/data/recipes.js) is the source-of-truth for recipe definitions. The Express server reads recipes from [recipe-app/data/recipes.json](recipe-app/data/recipes.json) (a generated JSON export). When modifying recipes.js, regenerate recipes.json with: `node -e "import recipes from './src/data/recipes.js'; import fs from 'fs'; fs.writeFileSync('./data/recipes.json', JSON.stringify(recipes, null, 2), 'utf-8');"` then restart the dev server so it reloads the updated file. To add a new recipe, append to the recipes array in recipes.js with a unique `id`.

- **No router.** Navigation is plain React state in [recipe-app/src/App.jsx](recipe-app/src/App.jsx): `currentPage` can be `'home'` | `'recipe'` | `'favorites'` | `'add'` | `'edit'` | `'login'` | `'register'` | `'admin'` | `'myRecipes'`. `App` renders `NavBar` + the appropriate page component, and smooth-scrolls to top on page change. To add a screen, extend the page switch rather than reaching for a routing library.
  - **LoginPage** ([recipe-app/src/pages/LoginPage.jsx](recipe-app/src/pages/LoginPage.jsx)): email + password form. On success, calls `useAuth().login()` and returns to home.
  - **RegisterPage** ([recipe-app/src/pages/RegisterPage.jsx](recipe-app/src/pages/RegisterPage.jsx)): username + email + password + confirm form. Validates password match and length (6+ chars). On success, calls `useAuth().login()` and returns to home.
  - **AdminPage** ([recipe-app/src/pages/AdminPage.jsx](recipe-app/src/pages/AdminPage.jsx)): visible only to admins. Displays user table with edit/delete/add buttons. Edit opens a form to change username/email/password/role; delete prompts for confirmation; add opens a form to create new user. Includes "📝 מתכונים" button to view recipes of each user.
  - **UserRecipesPage** ([recipe-app/src/pages/UserRecipesPage.jsx](recipe-app/src/pages/UserRecipesPage.jsx)): displays recipes for a specific user (the logged-in user by default, or another user if accessed from AdminPage). Regular users see only their own recipes. Admins can view and edit recipes of any user. Features: edit/delete recipe buttons, shows recipe count, displays "עדיין לא הוספת מתכונים" if no recipes exist. Author name cannot be changed (always preserved in database).

- **Dynamic data via REST API.** All recipes are fetched from [recipe-app/data/recipes.json](recipe-app/data/recipes.json) through the Express API (see Backend & Persistence section). `RecipesProvider` context manages recipe state and CRUD operations. Each recipe object shape: `id, name, description, difficulty ('קל'|'בינוני'|'קשה'), cuisine, dietType ('בשרי'|'חלבי'|'פרווה'|'דגים'), prepTime ('פחות מ-30'|'30-60'|'יותר משעה'), servings (baseline, usually 4), ingredients[{name, amount, unit}], instructions[], cookTime, tips, createdAt, isUserAdded, author`. Filter option lists in `HomePage`/`FilterBar` are derived from or must stay in sync with these exact string values. An optional `image` field stores base64 data URIs for recipe photos (e.g., `"data:image/jpeg;base64,/9j/..."`). User can add, edit, and delete recipes — all changes persist to disk.

- **Ingredient scaling** (in [recipe-app/src/pages/RecipePage.jsx](recipe-app/src/pages/RecipePage.jsx)): when user changes servings, amounts are scaled by the ratio `currentServings / recipe.servings`. For example, if a recipe serves 4 and user selects 8, each ingredient amount is multiplied by 2. The unit `'לטעם'` ("to taste") is special-cased: it renders without a number and is never scaled (always displays as just "לטעם"). The `formatAmount()` helper rounds to 2 decimals and strips trailing zeros (e.g., `2.50` → `2.5`, `3.00` → `3`).

- **Filtering** (in `HomePage`): a single `filters` object (cuisine, difficulty, dietType, prepTime, search) is matched against the recipe array in a `useMemo`. Empty filter value = "match all". Search matches name + description, case-insensitive.

- **Nutrition facts** (in [recipe-app/src/components/NutritionFacts.jsx](recipe-app/src/components/NutritionFacts.jsx)): displays a table of nutritional values (calories, protein, fat, carbs, etc.) calculated from recipe ingredients. The component accepts `servings` (current user-selected servings) and `recipeServings` (baseline servings from the recipe), calculates a scaling factor, and scales ingredient amounts before passing them to `calculateRecipeNutrition()`. This ensures the nutrition facts table updates in real-time when the user adjusts the number of diners. Values in the "סה"כ במתכון" (total in recipe) column are rounded to whole numbers using `Math.round()`. See [recipe-app/src/data/nutritionDatabase.js](recipe-app/src/data/nutritionDatabase.js) for the nutrition calculation logic (USDA database).

- **Reviews & ratings** (in [recipe-app/src/pages/RecipePage.jsx](recipe-app/src/pages/RecipePage.jsx)): each recipe can have user reviews with a numeric rating (1–5 stars). Reviews are stored in the recipe object as an array. The `RecipePage` renders `RatingDisplay` (average rating and count), `ReviewForm` (for adding new reviews), and `ReviewsList` (for viewing submitted reviews). Review submission is handled via POST to `/api/recipes/:id/reviews`, and deletion via DELETE to `/api/recipes/:id/reviews/:reviewId`. Review changes are synced back to the recipe object via `updateRecipe()`.

- **AI Features** (in [recipe-app/src/pages/HomePage.jsx](recipe-app/src/pages/HomePage.jsx) and [recipe-app/src/components/RecipeChat.jsx](recipe-app/src/components/RecipeChat.jsx)):
  - **Smart search** (HomePage): when `useAISearch` toggle is true, the search input is sent to `/api/ai/search` with a 600ms debounce. The AI returns an array of recipe IDs sorted by relevance. Results override the regular filter UI while active; clearing the search clears results. Button shows "חכם" (smart) when enabled, "רגיל" (regular) when disabled.
  - **Recipe chat** (RecipeChat): a sticky floating chat panel (bottom-6 left-6) that appears on each recipe page. User messages are sent to `/api/ai/chat` along with message history and the current recipe (name, ingredients, instructions). AI responds with cooking advice in Hebrew. Chat state is local to the component; users can clear history with the 🔄 button in the header.

- **Authentication & Authorization** (in [recipe-app/src/context/AuthProvider.jsx](recipe-app/src/context/AuthProvider.jsx)):
  - `AuthProvider` manages login state, token persistence in `localStorage` (key: `cookingbook:auth-token`), and automatic token validation on app mount via `GET /api/auth/me`.
  - `useAuth()` hook exports: `user` (id, username, email, role), `token`, `isLoggedIn`, `loading`, `login(token, user)`, `logout()`.
  - Users have `role: 'user'` (default) or `role: 'admin'`. Only admins can access the `/admin` page (AdminPage.jsx) and manage other users.
  - Recipe CRUD endpoints (`POST /api/recipes`, `PUT /api/recipes/:id`, `DELETE /api/recipes/:id`) require a valid JWT token. Creating a recipe auto-assigns `authorId` from the token. Editing/deleting: only the recipe author or admins can do so (backend checks `recipe.authorId === user.id || user.role === 'admin'`).
  - Frontend hides edit/delete buttons on recipe pages unless `user.id === recipe.authorId || user.role === 'admin'`.
  - **UserRecipesPage** (MyRecipesPage): regular users see only their own recipes; admins can view any user's recipes (via "📝 מתכונים" button in AdminPage). Recipe author cannot be changed when editing. Backend preserves `authorId` and `author` on PUT operations.

## State Management

The app uses React Context API for global state:

- **`AuthProvider`** ([recipe-app/src/context/AuthProvider.jsx](recipe-app/src/context/AuthProvider.jsx)): manages login state, token, and user object. Loads token from `localStorage` on mount and validates it via `GET /api/auth/me`. Wraps the entire app tree (outer-most provider). Exports `useAuth()` hook with: `user`, `token`, `isLoggedIn`, `loading`, `login()`, `logout()`.

- **`RecipesProvider`** ([recipe-app/src/context/recipesContext.js](recipe-app/src/context/recipesContext.js)): manages the full recipe list. Exports `useRecipes()` hook with: `recipes` (array), `addRecipe(data)`, `updateRecipe(id, updates)`, `deleteRecipe(id)`. CRUD operations call the Express API (with `Authorization: Bearer <token>` header), which syncs to disk; the context updates state optimistically or after server response. `HomePage` and `RecipePage` both consume this.

- **`FavoritesProvider`** ([recipe-app/src/context/favoritesContext.js](recipe-app/src/context/favoritesContext.js)): manages user's favorite recipe IDs. Exports `useFavorites()` hook with: `isFavorite(id)`, `toggleFavorite(id)`. Favorites are persisted to `localStorage` — they survive a page refresh but are local to the browser.

- **Prop drilling:** `App.jsx` passes `recipeId`, `onBack`, `onEdit` to `RecipePage` and `onSelectRecipe` to `HomePage`. Context is preferred for data that multiple components need; props are used for ephemeral UI state (page transitions, form inputs).

## Backend & Persistence

**Express API Server** ([recipe-app/server/index.js](recipe-app/server/index.js)) runs on `http://localhost:3001` and provides REST endpoints:

**Authentication:**

| Method | Endpoint | Behavior |
|--------|----------|----------|
| POST | `/api/auth/register` | Takes `{username, email, password, confirmPassword}`, creates user, returns `{token, user}` |
| POST | `/api/auth/login` | Takes `{email, password}`, validates, returns `{token, user}` |
| GET | `/api/auth/me` | Protected. Returns current user object from JWT token |

**Recipe CRUD (all require valid JWT token):**

| Method | Endpoint | Behavior |
|--------|----------|----------|
| GET | `/api/recipes` | Returns all recipes from [recipe-app/data/recipes.json](recipe-app/data/recipes.json) |
| POST | `/api/recipes` | Adds a new recipe, auto-assigns `id`, sets `authorId` from token. If no `image` provided, fetches one from Unsplash via recipe name, then writes to disk |
| PUT | `/api/recipes/:id` | Updates recipe by `id` (only author or admin). If no `image` in request and recipe has no image, fetches one from Unsplash, then writes to disk |
| DELETE | `/api/recipes/:id` | Deletes recipe by `id` (only author or admin), writes to disk |
| POST | `/api/recipes/:id/reviews` | Adds a review to recipe `:id` (calculates average rating), writes to disk |
| DELETE | `/api/recipes/:id/reviews/:reviewId` | Deletes review from recipe `:id`, updates average rating |

**Admin Endpoints (protected, require `role === 'admin'`):**

| Method | Endpoint | Behavior |
|--------|----------|----------|
| GET | `/api/admin/users` | Returns list of all users (without passwordHash) |
| POST | `/api/admin/users` | Creates new user, takes `{username, email, password}`, returns user object |
| PUT | `/api/admin/users/:id` | Updates user fields: `username`, `email`, `password` (optional), `role`, writes to disk |
| DELETE | `/api/admin/users/:id` | Deletes user by `id`, writes to disk |

**AI Endpoints:**

| Method | Endpoint | Behavior |
|--------|----------|----------|
| POST | `/api/ai/search` | Takes `{query, recipes[]}`, returns `{ids: []}` sorted by relevance (uses Claude API) |
| POST | `/api/ai/chat` | Takes `{message, history[], recipe{}}`, returns `{reply}` in Hebrew (uses Claude API) |

**Environment Setup:** The server requires:
- `ANTHROPIC_API_KEY` in `recipe-app/.env` — required for `/api/ai/*` endpoints. If missing or invalid, AI calls fail with 500 errors.
- `UNSPLASH_ACCESS_KEY` in `recipe-app/.env` — required for auto-generating recipe images via `/api/recipes` POST/PUT. Get a free key at https://unsplash.com/developers. If missing, image generation is skipped with a warning.
- `JWT_SECRET` in `recipe-app/.env` — used to sign/verify authentication tokens. Defaults to `'your-secret-key-change-in-production'` if not set (dev only; must be changed for production).
The `.env` file is in `.gitignore` and must never be committed.

**Data Files:**
- [recipe-app/data/recipes.json](recipe-app/data/recipes.json) — canonical recipe store. Each recipe has: `id, name, description, difficulty, cuisine, dietType, prepTime, servings, ingredients[], instructions[], createdAt, author, authorId, reviews[], averageRating, image (optional)`. Every CRUD operation writes back synchronously. If the server crashes, recipes are never lost.
- [recipe-app/data/users.json](recipe-app/data/users.json) — canonical user store. Each user has: `id, username, email, passwordHash, createdAt, role ('user'|'admin')`. Passwords are hashed with `bcryptjs` (10 salt rounds). Never store plain passwords or commit this file with real data.

**Vite Proxy:** During dev, [recipe-app/vite.config.js](recipe-app/vite.config.js) proxies all `/api/*` requests from the browser to the Express server. No CORS issues in dev.

**Future Deployment:** The Express backend can be deployed to a cloud platform with persistent storage (Railway, Render, Fly.io) alongside the static build. To migrate to a hosted DB (Supabase, MongoDB Atlas), only `server/index.js` needs changes — the React code and API contract stay the same.

## Security

The frontend is a client-side React SPA. All content is rendered as JSX text nodes (no `dangerouslySetInnerHTML`). The Express backend reads and writes recipes and users to disk as JSON — it is a local-development server with no protection against concurrent writes. For local dev only; when deploying online, use a proper database.

**Authentication:**
- Passwords hashed with `bcryptjs` (10 salt rounds) — plain passwords never stored.
- JWT tokens signed with `JWT_SECRET` from `.env`, expire in 7 days.
- Tokens passed in `Authorization: Bearer <token>` header on protected endpoints.
- Token stored in browser `localStorage` as `cookingbook:auth-token` (survives page refresh).
- Frontend validates token on app mount (`GET /api/auth/me`); if invalid/expired, clears localStorage and logs out.

**Authorization (Backend Checks):**
- Recipe POST/PUT/DELETE require valid JWT. PUT/DELETE also check `recipe.authorId === user.id || user.role === 'admin'`. Returns 403 if unauthorized.
- Admin endpoints (`/api/admin/*`) check `user.role === 'admin'`. Returns 403 if not admin.
- Frontend also hides edit/delete buttons on recipes unless user is author or admin (defensive; backend is authoritative).

**API Keys:**
- `ANTHROPIC_API_KEY` and `JWT_SECRET` stored in `recipe-app/.env` (local file, never committed). Server loads via `import 'dotenv/config'` at startup.
- `ANTHROPIC_API_KEY` used only on backend for `/api/ai/*` — never sent to frontend.
- `JWT_SECRET` used only on backend for token signing — never sent to frontend.
- If deploying online, use a proper secrets manager (e.g., environment variables on Railway, Render, Fly.io) instead of a local `.env`.

A 2026-06-01 security review (pre-backend) found no XSS, secret-exposure, or dependency issues. The frontend hardening applied was defence-in-depth:

- **Content-Security-Policy is build-only.** It is injected into the production `index.html` by the `cspPlugin` in [recipe-app/vite.config.js](recipe-app/vite.config.js) (`apply: 'build'`). **Do not move the CSP into a `<meta>` tag in `index.html`** — that would also apply it in dev, and Vite's HMR (inline scripts, `eval`, websocket) would break under a strict policy. If you add a new external origin (script, style, font, image, or API), update the `CSP` array in `vite.config.js` accordingly, then `npm run build` and confirm the new resource isn't blocked.
- **No SRI on the Google Fonts `<link>`** — intentionally. The `css2` endpoint returns browser-specific CSS and Google rotates the font files, so a pinned integrity hash silently breaks over time. The CSP's `style-src`/`font-src` lock to the Google origins mitigates the same CDN-hijack threat more robustly.
- **Referrer policy** is set via `<meta name="referrer" content="strict-origin-when-cross-origin" />` in [recipe-app/index.html](recipe-app/index.html).

## Tailwind v4 — important gotchas

- The design system (colors, fonts, animations) is defined in the `@theme` block of [recipe-app/src/index.css](recipe-app/src/index.css), **not** in `tailwind.config.js`. That config file exists but is ignored by Tailwind v4.
- CSS must use `@import "tailwindcss";` — the v3-style `@tailwind base/components/utilities` directives do **not** generate styles correctly here (this was a real bug that produced a near-empty stylesheet).
- Custom theme tokens become utility classes: colors `bg-primary`, `text-ink`, `bg-cream`, `bg-secondary`, `border-accent` etc.; fonts `font-display` (Frank Ruhl Libre, for headings) and `font-sans` (Heebo); animations `animate-fade-up` and `animate-page-enter`. There is also a hand-written `.recipe-card-hover`, `.btn-hover`, and `.select-rtl` class for interactions and the RTL dropdown arrow.

**Design system (2026-06-12 redesign):**
- **Color palette:** Warm & earthy — primary is terracotta `#b85c38` (was brown `#8b6f47`), secondary is olive `#7a9a5c` (was sage `#a8d5ba`), cream is warmer parchment `#fdf6ec` (was `#fefdf9`), ink is warm-black `#2c1f14` (was `#2c2c2c`). Accent is deeper rust `#d4855a`.
- **Animations:** (1) `fade-up` — entrance animation, 0.5s ease-out. (2) `page-enter` — page transitions, 0.35s ease-out (fade + slight slide). (3) `.recipe-card-hover` — cards lift 5px + shadow on hover. (4) `.btn-hover` — buttons scale 1.03 + brighten on hover.
- **Icons:** All emoji icons in NavBar replaced with inline SVG components (`LogoIcon`, `SearchIcon`, `HeartIcon`, `PlusIcon`, `BookmarkIcon`, `GearIcon`). SVGs are 20–24px, line-art style (stroke-based, no fill), stroke-width 1.8, currentColor for consistent theming.

## RTL / Hebrew conventions

- The app is RTL end-to-end: `dir="rtl"` on `<html>` (in [recipe-app/index.html](recipe-app/index.html)) and `html { direction: rtl }` in CSS.
- UI text is Hebrew. Headings use **Frank Ruhl Libre** (a Hebrew serif) — Latin-only display fonts like Playfair Display will not render Hebrew, so do not swap them in for headings.
- When adding RTL-sensitive spacing/borders, prefer logical directions; note existing components sometimes use physical sides chosen deliberately for the RTL layout (e.g. the tips box `border-r-4`).

## Common Development Workflows

**Modifying recipes:**
1. Edit [recipe-app/src/data/recipes.js](recipe-app/src/data/recipes.js) (the source of truth)
2. Regenerate the JSON export: `node -e "import recipes from './src/data/recipes.js'; import fs from 'fs'; fs.writeFileSync('./data/recipes.json', JSON.stringify(recipes, null, 2), 'utf-8');"`
3. Restart `npm run dev` so the server reloads `recipes.json`
4. Verify changes in the browser (hard refresh if needed)

**Image sourcing strategy:**

The app uses three approaches to populate recipe images, in order of preference:

1. **User upload** (future feature): user provides image when creating/editing recipe
2. **Auto-generation from Unsplash:** when a recipe has no image, Express server auto-fetches from Unsplash
3. **Manual sourcing:** for recipes where Unsplash results are inaccurate, manually fetch from external sources (food blogs, recipe sites)

**Auto-generating recipe images (Unsplash integration):**
When a user creates or edits a recipe without an image, the Express server automatically fetches one from Unsplash and stores it as base64. This is built into the `/api/recipes` POST and PUT endpoints via the `fetchRecipeImage()` helper in [recipe-app/server/index.js](recipe-app/server/index.js).

**Setup:**
1. Get a free Unsplash API key from https://unsplash.com/developers → create app → copy Access Key
2. Add to `recipe-app/.env`: `UNSPLASH_ACCESS_KEY=your-key-here`
3. Restart `npm run dev` (server must reload the env var)

**Backfilling existing recipes with Unsplash images:**
```bash
cd recipe-app
node scripts/update-recipe-images.js
```
This script ([recipe-app/scripts/update-recipe-images.js](recipe-app/scripts/update-recipe-images.js)):
- Iterates recipes that don't have an `image` field
- Translates Hebrew recipe names to English (via Claude API) for better Unsplash matches
- Searches Unsplash and downloads matching images
- Converts images to base64 data URIs
- Saves updated recipes to `data/recipes.json`
- 1-second delay between requests prevents rate-limiting

**Manually sourcing images from external URLs:**
If an auto-generated image is off-topic or a recipe has no Unsplash match:
```bash
cd recipe-app
node << 'EOF'
import fs from 'fs';

// Download image and convert to base64
const imageUrl = 'https://example.com/image.jpg';
const imageResponse = await fetch(imageUrl);
const arrayBuffer = await imageResponse.arrayBuffer();
const base64 = Buffer.from(arrayBuffer).toString('base64');
const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
const dataUri = `data:${mimeType};base64,${base64}`;

// Update recipe (find by name or ID)
const recipes = JSON.parse(fs.readFileSync('./data/recipes.json', 'utf-8'));
const recipe = recipes.find(r => r.id === 13); // or r.name.includes('ניוקי')
if (recipe) {
  recipe.image = dataUri;
  fs.writeFileSync('./data/recipes.json', JSON.stringify(recipes, null, 2), 'utf-8');
  console.log(`✅ Updated: "${recipe.name}"`);
}
EOF
```

**Gotchas:**
- Hebrew recipe names may not have Unsplash matches even after translation (skipped with a warning — not an error)
- Images are embedded as base64, increasing `recipes.json` file size (~50–500KB per image)
- If Unsplash key is missing/invalid, auto-gen is skipped with a warning; recipe creation still works
- External image URLs may have CORS restrictions or require User-Agent headers (curl handles this, but raw fetch may fail)

**Adding a new component or page:**
- Functional components with React hooks; prefer `useState` and context hooks over external state libraries.
- Import styles inline (Tailwind classes); avoid separate CSS files except for `index.css` (global design tokens).
- Use semantic HTML and test with a screen reader (components have `aria-` labels where appropriate).

**Customizing the design system:**
- Colors are in the `@theme` block of `src/index.css` (primary, secondary, cream, accent, ink, etc.). Update them there, not in a config file.
- Animations: add `@keyframes` and register in `@theme` as `--animate-name`. Reusable via `animate-name` class.
- Hover effects: use `.recipe-card-hover` for cards (lift + shadow), `.btn-hover` for buttons (scale + brighten). Add similar classes to `index.css` as needed.
- SVG icons in NavBar: defined as functional components at the top of [recipe-app/src/components/NavBar.jsx](recipe-app/src/components/NavBar.jsx). Each uses `stroke=currentColor` so they inherit text color; update stroke-width or size if styling changes.

**Testing AI features:**
- **Smart search:** On HomePage, toggle the "חכם" button next to search, then type a natural language query (e.g., "משהו קל וחלבי"). Results should appear after 600ms debounce. Check Express server logs (`[1]`) to see `/api/ai/search` requests.
- **Recipe chat:** Open any recipe, click the "שאל את השף" button (bottom-left), type a message, and hit enter or click ➤. Chat history is local to the component; click 🔄 to clear and start fresh. Check server logs for `/api/ai/chat` requests.

**Setting up AI features:**
1. Create `recipe-app/.env` file with `ANTHROPIC_API_KEY=sk-ant-api03-...` (get key from https://console.anthropic.com/account/billing/overview)
2. The `.env` file is in `.gitignore` — never commit API keys
3. Restart `npm run dev` after creating `.env` so the server reloads the environment variables
4. Test smart search on HomePage or chat on RecipePage to verify the key works

**Testing authentication:**
- **Register:** Click "התחבר" (Login) in NavBar → "הירשם" (Register) → fill form → "הרשם" button. On success, you're logged in and NavBar shows "שלום [username]" + "התנתק".
- **Login:** Click "התחבר" → fill email + password → "התחבר" button. On success, NavBar updates to show logged-in state.
- **Logout:** Click "התנתק" button in NavBar → returns to home, logged-out state.
- **Admin panel:** If your `role` is `'admin'`, an "⚙️ ניהול" button appears in NavBar next to your username. Click it → see user table. Add/edit/delete users. Changes persist to `data/users.json`. Click "📝 מתכונים" to view/edit recipes for a user.
- **Recipe permissions:** Create a recipe as User A, log in as User B → the edit/delete buttons on that recipe won't appear. Backend enforces this too (returns 403 if B tries to PUT/DELETE).
- **"My Recipes" page:** Click "📝 המתכונים שלי" in NavBar (visible only when logged in) → see all recipes you created. Edit or delete them. Author name is read-only and cannot be changed. If you're admin, click "📝 מתכונים" next to a user in AdminPage to see that user's recipes instead.

**Debugging API issues:**
- Express server logs print to the `[1]` stream in the dev terminal (Vite is `[0]`).
- Check [recipe-app/server/index.js](recipe-app/server/index.js) request/response logs if API calls fail.
- For auth: verify `JWT_SECRET` is set in `.env`. Token validation errors mean the secret is missing/wrong or token is expired (7 days).
- Verify [recipe-app/data/recipes.json](recipe-app/data/recipes.json) and [recipe-app/data/users.json](recipe-app/data/users.json) exist and are valid JSON (see "recipes.json corrupted" in Solved problems log if you see parsing errors).
- For AI features, check that `ANTHROPIC_API_KEY` is set in `.env` and that the Anthropic account has sufficient credits.
