# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

**All commands from `recipe-app/`:**
```bash
npm install                    # Install dependencies
npm run dev                    # Start both servers (Vite 5173 + Express 3001)
npm run build                  # Production build
npm run start                  # Run production server
npm run lint                   # ESLint

# Data sync (from MongoDB to local JSON files)
node sync-from-mongo.js        # One-time sync
node sync-from-mongo.js --watch # Auto-sync every 30s (recommended for development)
```

**Requirements:** Node.js 20+, `ANTHROPIC_API_KEY` + `MONGODB_URI` in `.env`  
**Live:** https://cookingbook-bf50.onrender.com  
**Preferences:** [@CLAUDE.local.md](CLAUDE.local.md)  
**No test suite:** there is no test framework or `test` script — verify changes by running the app (`npm run dev`), not by running tests.

---

## Tech Stack

**Frontend:** React 19 + Vite 8 + Tailwind CSS v4 (design tokens in `src/index.css` `@theme` block)  
**Backend:** Express.js + MongoDB (Mongoose ODM) — persistent data storage  
**AI:** Anthropic Claude API (`claude-haiku-4-5-20251001`)  
**Auth:** JWT tokens + bcryptjs password hashing  
**Database:** MongoDB Atlas (free tier) — stores recipes, users, reviews  
**Deployment:** Render (auto-deploy on `main` push) + UptimeRobot keep-alive  
**Sync:** sync-from-mongo.js script (downloads MongoDB → local JSON backup)  

---

## Solved Problems Log

Check this before debugging — common issues and their fixes:

- **(2026-05-28) "App doesn't work" / blank page** → Orphaned Vite servers on ports 5173–5176. Kill with `taskkill //F //IM node.exe`, then restart `npm run dev`.

- **(2026-06-07) API calls fail / recipes don't persist** *(pre-MongoDB — historical; persistence is now MongoDB, this file-path fix no longer applies)* → Express path incorrect in [server/index.js](recipe-app/server/index.js) line 16: must be `join(__dirname, '..', 'data', 'recipes.json')` (one level up).

- **(2026-06-07) "PayloadTooLargeError"** → Express body parser limit too small. Set `{ limit: '50mb' }` in [server/index.js](recipe-app/server/index.js) lines 29–30.

- **(2026-06-07) recipes.json corrupted / "Unexpected token '﻿'"** → Never use PowerShell to edit recipes.json (adds BOM). Use Node.js: `node -e "import recipes from './src/data/recipes.js'; import fs from 'fs'; fs.writeFileSync('./data/recipes.json', JSON.stringify(recipes, null, 2), 'utf-8');"`

- **(2026-06-07) AI features fail** → Missing `ANTHROPIC_API_KEY` in `.env`. Get key from https://console.anthropic.com, add to `.env`, restart `npm run dev`.

- **(2026-06-07) Smart search returns no results** → Debounce not working or API response malformed. Verify `/api/ai/search` endpoint, test with simple queries like "קל".

- **(2026-06-07) "My Recipes" page shows no recipes** → (1) RecipesProvider had wrong dependency array `[]`; should be `[token]`. (2) NavBar onClick passed event instead of params; wrap in arrow function.

- **(2026-06-07) onClick handler receives event instead of params** → Always use arrow functions: `onClick={() => handleFunc()}` not `onClick={handleFunc}`.

- **(2026-06-12) Page transitions abrupt / no animation** → Added `@keyframes page-enter` and `key={currentPage}` to `<main>` in [App.jsx](recipe-app/src/App.jsx).

- **(2026-06-12) Auto-generated images fail** → Missing `UNSPLASH_ACCESS_KEY` in `.env`. Get free key from https://unsplash.com/developers. Script translates Hebrew names to English for better matches.

- **(2026-06-12) "My Recipes" page shows no recipes after editing** → All recipes must have both `author` (string, display name) AND `authorId` (number, user ID). If recipes.json is missing `authorId` fields, run: `node -e "const fs=require('fs'),p=require('path');const r=JSON.parse(fs.readFileSync(p.join('recipe-app','data','recipes.json'),'utf8')),u=JSON.parse(fs.readFileSync(p.join('recipe-app','data','users.json'),'utf8')),m={};u.forEach(x=>{m[x.username]=x.id});r.forEach(x=>{if(!x.authorId&&x.author)x.authorId=m[x.author]});fs.writeFileSync(p.join('recipe-app','data','recipes.json'),JSON.stringify(r,null,2),'utf8');console.log('Done')"`

- **(2026-06-12) Admin can't change author name when editing** → (1) Frontend AddRecipePage must send author in PUT request (line 169-171): `if (!isEditing || user?.role === 'admin')`. (2) Backend must update both author name AND authorId by looking up the new author in users.json (server/index.js PUT endpoint).

- **(2026-06-13) MongoDB connection error / recipes not appearing** → (1) `MONGODB_URI` missing from `.env` — add connection string from MongoDB Atlas. (2) IP not whitelisted in MongoDB Atlas — add `0.0.0.0/0` to network access. (3) Render deployment shows "could not connect to any servers in MongoDB cluster" — set `MONGODB_URI` in Render dashboard environment variables.

- **(2026-06-13) Changes to recipes/reviews not syncing to local files** → Run `node sync-from-mongo.js --watch` in a separate terminal. Script automatically pulls data from MongoDB every 30s. Local JSON files are backups, not source of truth anymore.

- **(2026-06-13) Server crashes with "mongoose connection pending"** → MongoDB connection timeout. Check: (1) `MONGODB_URI` is valid + credentials correct. (2) MongoDB cluster is running. (3) Network access whitelist includes Render IP or 0.0.0.0/0.

---

## Architecture Overview

**No router.** Simple state machine in [App.jsx](recipe-app/src/App.jsx): `currentPage` is one of `'home'` | `'recipe'` | `'login'` | `'register'` | `'admin'` | `'myRecipes'`. To add a screen, extend the switch.

**Data flow:**
- **Source of truth:** MongoDB (recipes, users, reviews collections)
- **Backend:** Express queries MongoDB via Mongoose, caches responses, syncs real-time changes
- **Frontend:** Fetches from `/api/recipes` (Express queries MongoDB, not files)
- **Context:** `RecipesProvider` + `AuthProvider` + `FavoritesProvider` (all pull from `/api/*`)
- **Local backup:** [data/recipes.json](recipe-app/data/recipes.json) + [data/users.json](recipe-app/data/users.json) (synced via `sync-from-mongo.js`, read-only)

**Key concepts:**
- **Ingredient scaling:** RecipePage multiplies amounts by `currentServings / recipe.servings`. Special case: `'לטעם'` ("to taste") never scales.
- **Nutrition:** NutritionFacts calculates from ingredients via `calculateRecipeNutrition()` in [nutritionDatabase.js](recipe-app/src/data/nutritionDatabase.js).
- **Reviews:** Stored in recipe.reviews[]. Average rating recalculated on each change. POST writes the review server-side; the client then updates local context state via `applyLocalUpdate()` (RecipesProvider) — it does **not** re-PUT the whole recipe (that path 403'd for non-author reviewers).
- **Prep/cook time display:** The time shown on cards and the recipe page is derived from the `prepTime` range (`'פחות מ-30'` | `'30-60'` | `'יותר משעה'`) via `formatPrepTime()` in [src/utils/prepTime.js](recipe-app/src/utils/prepTime.js), falling back to `'30-60'`. The numeric `cookTime` field is no longer displayed (it was unreliable — hardcoded to 15 for new recipes).
- **AI:** Two endpoints: `/api/ai/search` (Claude ranks recipes by relevance), `/api/ai/chat` (cooking advice in Hebrew).
- **Auth:** JWT tokens in localStorage, validated on app mount. Users can be `'user'` or `'admin'`.
- **Author ownership:** Each recipe has `authorId` (user ID) + `author` (display name). "My Recipes" filters by `authorId`. PUT/DELETE check `recipe.authorId === user.id OR user.role === 'admin'`. **Only admins can change author** (changes both name + ID).

---

## Backend & Persistence

**Express + MongoDB:**
- Server ([server/index.js](recipe-app/server/index.js)) connects to MongoDB via Mongoose
- Mongoose schemas: `User`, `Recipe` (with nested `reviews`)
- Endpoints automatically sync changes to MongoDB
- Each endpoint (`POST/PUT/DELETE`) also calls `syncToJSON()` to update local backup files

**API Endpoints:**
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET/POST/PUT/DELETE /api/recipes` (CRUD requires JWT, writes to MongoDB + JSON backup)
- `POST/DELETE /api/recipes/:id/reviews` (both require JWT; POST sets `author` from the token — never the body; DELETE allows admin or the review's own author)
- `POST /api/ai/search`, `POST /api/ai/chat`

**Sync scripts:**
- [sync-from-mongo.js](recipe-app/sync-from-mongo.js) — pulls recipes/users from MongoDB, writes to local JSON. Use for local development: `node sync-from-mongo.js --watch` (auto-sync every 30s, recommended!)
- [migrate-data.js](recipe-app/migrate-data.js) — one-time migration from JSON to MongoDB (already ran, keep for reference)

**MongoDB Collections:**
- `users` — `id`, `username`, `email`, `passwordHash`, `role`, `createdAt`
- `recipes` — `id`, `name`, `description`, `difficulty`, `cuisine`, `dietType`, `prepTime`, `servings`, `cookTime`, `tips`, `image`, `author`, `authorId`, `createdAt`, `averageRating`, `ingredients[]`, `instructions[]`, `reviews[]`
- `reviews` (nested in recipes) — `id`, `author`, `rating`, `text`, `createdAt`

**Local JSON files (backup only):**
- [data/recipes.json](recipe-app/data/recipes.json) — synced from MongoDB, **NOT** source of truth
- [data/users.json](recipe-app/data/users.json) — synced from MongoDB, **NOT** source of truth

> **Sync paths:** both writers target the canonical `recipe-app/data/*.json`. `sync-from-mongo.js` (run from `recipe-app/`) writes it directly; the server's in-request `syncToJSON()` resolves `__dirname` to `recipe-app/server/` and writes `join(__dirname, '..', 'data', ...)`. (Historically `syncToJSON()` pointed at the non-existent `recipe-app/server/data/` and failed silently — fixed 2026-06-13; before that, `--watch` was the only reliable refresh.) On Render the per-request write lands on the ephemeral disk (wiped each deploy) — harmless; MongoDB remains the source of truth.

**Environment variables:**

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `ANTHROPIC_API_KEY` | ✅ | AI search + chat |
| `UNSPLASH_ACCESS_KEY` | ⚠️ | Auto-generate recipe images |
| `JWT_SECRET` | ❌ | Auth token signing (default: dev value) |

---

## State Management

Three Context providers:
- **AuthProvider:** login state, token, `useAuth()` hook
- **RecipesProvider:** recipe list, `useRecipes()` for CRUD
- **FavoritesProvider:** favorites in localStorage, `useFavorites()` hook

---

## Security

- Passwords hashed with bcryptjs (10 rounds), never plain text.
- JWT tokens expire in 7 days.
- Recipe CRUD requires JWT; PUT/DELETE also check author ownership or admin role.
- Reviews require JWT (no anonymous reviews): the author is taken from the token, and only an admin or the review's author can delete it. The frontend hides the review form from logged-out visitors and uses the logged-in username automatically.
- API keys (`ANTHROPIC_API_KEY`, `UNSPLASH_ACCESS_KEY`, `JWT_SECRET`) in `.env` only, never committed.
- Frontend: no `dangerouslySetInnerHTML`, all text as JSX nodes.
- CSP in production (see [vite.config.js](recipe-app/vite.config.js), build-only, don't add to `<meta>`).

---

## Tailwind v4 Gotchas

- Design tokens in [src/index.css](recipe-app/src/index.css) `@theme` block, **not** `tailwind.config.js` (ignored in v4).
- Must import with `@import "tailwindcss";` — old `@tailwind` directives don't work.
- Custom classes: `.recipe-card-hover`, `.btn-hover`, `.select-rtl` (hand-written in CSS).
- Colors: `bg-primary` (#b85c38), `bg-secondary` (#7a9a5c), `bg-cream` (#fdf6ec), `text-ink` (#2c1f14).

---

## RTL / Hebrew

- App is RTL end-to-end: `dir="rtl"` on `<html>`, `direction: rtl` in CSS.
- Headings: Frank Ruhl Libre (Hebrew serif) — don't swap to Latin-only fonts.
- Spacing: some components use physical sides deliberately for RTL (e.g., tips box `border-r-4`).

---

## Common Workflows

**Working with MongoDB data locally:**
1. Run `npm run dev` in terminal 1 (starts Vite + Express)
2. Run `node sync-from-mongo.js --watch` in terminal 2 (auto-syncs every 30s)
3. Make changes via the app or Render website
4. Local `recipes.json` + `users.json` auto-update within 30 seconds

**Adding a new recipe (via UI):**
1. Register/login
2. Click "⨚ הוסף מתכון" in NavBar
3. Fill form, submit → saved to MongoDB + synced to local JSON via `syncToJSON()`

**Modifying recipes (development backup):**
- Don't edit `recipes.json` directly! It's a backup from MongoDB.
- Either: (1) Use the app UI, or (2) Edit `src/data/recipes.js` for development reference only.

**Adding a component:** Functional + hooks, Tailwind classes inline, use Context for shared state.

**Testing AI features:**
- **Smart search:** HomePage toggle "חכם" button, type natural language query, 600ms debounce, results appear.
- **Recipe chat:** Open recipe, click "שאל את השף", type message, chat persists in component state.

**Testing auth:**
- Register/login via NavBar buttons.
- Admin: `role: 'admin'` → "⚙️ ניהול" button appears in NavBar.
- Permissions: edit/delete buttons hidden unless user is author or admin.

**Debugging:**
- Express logs on `[1]` stream, Vite on `[0]`.
- Check [server/index.js](recipe-app/server/index.js) for request logs.
- Verify `.env` has `MONGODB_URI` + valid MongoDB Atlas cluster.
- Verify `.env` has `ANTHROPIC_API_KEY` + valid credits.
- MongoDB connection logs appear in Express output.

---

## Contributing

**Adding a new recipe:**
1. Use the app UI: Register → click "⨚ הוסף מתכון" → fill form → submit
2. Recipe saved to MongoDB → auto-synced to local JSON via `syncToJSON()` + `sync-from-mongo.js --watch`
3. Or, for development/testing, edit [src/data/recipes.js](recipe-app/src/data/recipes.js) (backup reference, **not** source of truth)

**Adding a new feature:**
- Frontend: Add page to [pages/](recipe-app/src/pages/) or component to [components/](recipe-app/src/components/), extend `currentPage` switch in [App.jsx](recipe-app/src/App.jsx).
- Backend: Add endpoint to [server/index.js](recipe-app/server/index.js). Include `await syncToJSON()` if endpoint modifies data.
- Test locally first with `npm run dev` + `node sync-from-mongo.js --watch`, then push to `main` for auto-deploy.

**Important: syncToJSON() pattern**
Every endpoint that modifies data (POST/PUT/DELETE) must call `await syncToJSON()` to keep local JSON files in sync:
```javascript
app.post('/api/recipes', async (req, res) => {
  // ... save to MongoDB ...
  await newRecipe.save();
  await syncToJSON();  // ← ALWAYS include this
  res.status(201).json(newRecipe);
});
```

---

## Deployment (Render)

**Live:** https://cookingbook-bf50.onrender.com  
**Branch:** `main` (auto-deploy on push)

**Setup files:**
- `.nvmrc` — specifies Node.js 20
- [server/index.js](recipe-app/server/index.js) — serves both API + static files from `dist/`, connects to MongoDB
- [package.json](recipe-app/package.json) — has `"start": "node server/index.js"`

**Environment variables (set in Render dashboard):**
- `MONGODB_URI` — **required** — MongoDB Atlas connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/cookingbook`)
- `ANTHROPIC_API_KEY` — required for AI features
- `UNSPLASH_ACCESS_KEY` — optional, for auto-generated recipe images
- `JWT_SECRET` — optional, defaults to dev value

**MongoDB setup on Render:**
1. Create cluster on MongoDB Atlas (free tier: 512MB)
2. Whitelist Render IP: Security → Network Access → Add `0.0.0.0/0` (or specific Render IP)
3. Get connection string: Databases → Connect → Connection String
4. Set `MONGODB_URI` in Render dashboard

**Keep-alive:** UptimeRobot pings every 5 min (prevents Render free tier sleep after 15 min inactivity).

**Data persistence:**
- Recipes, users, reviews live in MongoDB Atlas (persistent across restarts)
- Local JSON files are read-only backups (sync'd via `sync-from-mongo.js`)
- Render instance is ephemeral, but MongoDB is permanent

### Docker (alternative to Render buildpack)

A root [Dockerfile](Dockerfile) exists for container deployment: it copies `recipe-app/`, runs `npm install` + `npm run build`, exposes `3001`, and runs `npm start` (Express serves both the API and the built `dist/`). Pass the env vars above with `-e` / `--env-file`.

> ⚠️ **Node version mismatch:** the Dockerfile pins `FROM node:18-alpine`, but the project requires **Node 20+** (`package.json` `engines: ">=20.0.0"`, `.nvmrc` = `20`, Vite 8). Bump it to `node:20-alpine` before relying on the image — Node 18 will fail the build/install. There is also no `.dockerignore`, so `node_modules` and `.env` can be copied into the image unless excluded.
