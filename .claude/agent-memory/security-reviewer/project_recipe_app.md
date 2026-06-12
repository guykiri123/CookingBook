---
name: project-recipe-app
description: Security-relevant facts about the recipe-app (Vite 8 + React 19 + Tailwind v4 Hebrew SPA)
metadata:
  type: project
---

Fully client-side static SPA. No backend, no persistence, no API calls. All recipe data is a hardcoded static array in `recipe-app/src/data/recipes.js`.

**Why:** There is no server to attack, no authentication surface, no database. The threat model is almost entirely limited to XSS in the browser and supply-chain risks via npm.

**How to apply:** Do not flag server-side issues (SQLi, SSRF, auth bypass, etc.) — they have no attack surface here. Focus future reviews on: XSS, unsafe DOM manipulation, dependency hygiene, secrets in client bundle, and build/deploy configuration (CSP, CORP headers).

## Key security observations (2026-06-01)

- No `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or `new Function` usage anywhere in src/. All dynamic content is rendered through React's JSX (auto-escaped text nodes).
- No secrets, API keys, or `import.meta.env` / `process.env` references anywhere in src/.
- No network requests (no `fetch`, `axios`, `XMLHttpRequest`) in application code.
- `window.print()` is called from a button click in RecipePage — not a risk.
- `window.scrollTo()` is called in App.jsx `useEffect` — not a risk.
- Google Fonts loaded from `fonts.googleapis.com` / `fonts.gstatic.com` via `<link>` in index.html — third-party resource, no SRI hash.
- No Content-Security-Policy meta tag or HTTP header configuration anywhere (vite.config.js has no `server.headers`).
- No `crossorigin` on the Google Fonts stylesheet `<link>` (only on the preconnect hints).
- `npm audit` returned 0 vulnerabilities across 191 dependencies as of 2026-06-01.
- Lockfile version 3 (npm 7+), `package.json` is `"private": true`.
- No `.env` files present in the repo.
- ESLint config does not include any security-focused plugins (e.g. `eslint-plugin-no-unsanitized`).
- `package.json` dependency ranges use `^` (semver minor/patch auto-upgrade) — standard but worth noting for supply-chain context.
