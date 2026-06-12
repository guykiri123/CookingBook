# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

**All commands from `recipe-app/`:**
```bash
npm install       # Install dependencies
npm run dev       # Start both servers (Vite 5173 + Express 3001)
npm run build     # Production build
npm run start     # Run production server
npm run lint      # ESLint
```

**Requirements:** Node.js 20+, `ANTHROPIC_API_KEY` in `.env`  
**Live:** https://cookingbook-bf50.onrender.com  
**Preferences:** [@CLAUDE.local.md](CLAUDE.local.md)

---

## Tech Stack

**Frontend:** React 19 + Vite 8 + Tailwind CSS v4 (design tokens in `src/index.css` `@theme` block)  
**Backend:** Express.js (Node.js, file-based persistence)  
**AI:** Anthropic Claude API (`claude-haiku-4-5-20251001`)  
**Auth:** JWT tokens + bcryptjs password hashing  
**Deployment:** Render (auto-deploy on `main` push) + UptimeRobot keep-alive  

---

## Solved Problems Log

Check this before debugging — common issues and their fixes:

- **(2026-05-28) "App doesn't work" / blank page** → Orphaned Vite servers on ports 5173–5176. Kill with `taskkill //F //IM node.exe`, then restart `npm run dev`.

- **(2026-06-07) API calls fail / recipes don't persist** → Express path incorrect in [server/index.js](recipe-app/server/index.js) line 16: must be `join(__dirname, '..', 'data', 'recipes.json')` (one level up).

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

---

## Architecture Overview

**No router.** Simple state machine in [App.jsx](recipe-app/src/App.jsx): `currentPage` is one of `'home'` | `'recipe'` | `'login'` | `'register'` | `'admin'` | `'myRecipes'`. To add a screen, extend the switch.

**Data flow:**
- **Source of truth:** [src/data/recipes.js](recipe-app/src/data/recipes.js) → auto-exported to [data/recipes.json](recipe-app/data/recipes.json)
- **Frontend:** Fetches from `/api/recipes` (Express serves recipes.json)
- **Context:** `RecipesProvider` + `AuthProvider` + `FavoritesProvider`
- **Persistence:** Files on disk (recipes.json, users.json)

**Key concepts:**
- **Ingredient scaling:** RecipePage multiplies amounts by `currentServings / recipe.servings`. Special case: `'לטעם'` ("to taste") never scales.
- **Nutrition:** NutritionFacts calculates from ingredients via `calculateRecipeNutrition()` in [nutritionDatabase.js](recipe-app/src/data/nutritionDatabase.js).
- **Reviews:** Stored in recipe.reviews[]. Average rating recalculated on each change.
- **AI:** Two endpoints: `/api/ai/search` (Claude ranks recipes by relevance), `/api/ai/chat` (cooking advice in Hebrew).
- **Auth:** JWT tokens in localStorage, validated on app mount. Users can be `'user'` or `'admin'`.
- **Author ownership:** Each recipe has `authorId` (user ID) + `author` (display name). "My Recipes" filters by `authorId`. PUT/DELETE check `recipe.authorId === user.id OR user.role === 'admin'`. **Only admins can change author** (changes both name + ID).

---

## Backend & Persistence

Express server ([server/index.js](recipe-app/server/index.js)) provides REST API. All endpoints in code; key ones:
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET/POST/PUT/DELETE /api/recipes` (CRUD requires JWT)
- `POST/DELETE /api/recipes/:id/reviews`
- `POST /api/ai/search`, `POST /api/ai/chat`

**Data files:**
- [data/recipes.json](recipe-app/data/recipes.json) — canonical recipes. **Critical fields:** `id`, `authorId` (number, matches user.id), `author` (string, display name), `name`, `difficulty`, `ingredients[]`, `instructions[]`, `reviews[]`, `averageRating`. **Note:** `authorId` is required for "My Recipes" filtering and owner permission checks.
- [data/users.json](recipe-app/data/users.json) — canonical users (id, username, email, passwordHash, role). **When admin edits recipe author:** look up user by new author username and update both `author` (name) and `authorId` (ID).

**Environment variables:**

| Variable | Required | Purpose |
|----------|----------|---------|
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

**Modifying recipes:**
1. Edit [src/data/recipes.js](recipe-app/src/data/recipes.js)
2. Regenerate JSON: `node -e "import recipes from './src/data/recipes.js'; import fs from 'fs'; fs.writeFileSync('./data/recipes.json', JSON.stringify(recipes, null, 2), 'utf-8');"`
3. Restart `npm run dev` (server reloads recipes.json)

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
- Verify `.env` has `ANTHROPIC_API_KEY` + valid credits.
- Verify recipes.json and users.json exist and are valid JSON.

---

## Contributing

**Adding a new recipe:**
1. Edit [src/data/recipes.js](recipe-app/src/data/recipes.js) — add object to recipes array with: `id, name, description, difficulty ('קל'|'בינוני'|'קשה'), cuisine, dietType ('בשרי'|'חלבי'|'פרווה'|'דגים'), prepTime ('פחות מ-30'|'30-60'|'יותר משעה'), servings, ingredients[{name, amount, unit}], instructions[], cookTime, tips, author`
2. Regenerate JSON export: `node -e "import recipes from './src/data/recipes.js'; import fs from 'fs'; fs.writeFileSync('./data/recipes.json', JSON.stringify(recipes, null, 2), 'utf-8');"`
3. Restart `npm run dev` (server reloads)
4. Test locally at http://localhost:5173

**Adding a new feature:**
- Frontend: Add page to [pages/](recipe-app/src/pages/) or component to [components/](recipe-app/src/components/), extend `currentPage` switch in [App.jsx](recipe-app/src/App.jsx).
- Backend: Add endpoint to [server/index.js](recipe-app/server/index.js), handle auth + persistence.
- Test locally first with `npm run dev`, then push to `main` for auto-deploy.

---

## Deployment (Render)

**Live:** https://cookingbook-bf50.onrender.com  
**Branch:** `main` (auto-deploy on push)

**Setup files:**
- `.nvmrc` — specifies Node.js 20
- [server/index.js](recipe-app/server/index.js) — serves both API + static files from `dist/`
- [package.json](recipe-app/package.json) — has `"start": "node server/index.js"`

**Environment (set in Render dashboard):**
- `ANTHROPIC_API_KEY` — required for AI
- `JWT_SECRET` — optional, defaults to dev value

**Keep-alive:** UptimeRobot pings every 5 min (prevents Render free tier sleep after 15 min inactivity).

**Note:** Data persists (recipes.json, users.json safe), but instance sleeps if not pinged. Upgrade to paid tier for always-on.
