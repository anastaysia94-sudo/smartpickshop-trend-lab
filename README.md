# SmartPickShop Trend Lab — implementation XW0175:P150 (P020 commercial parent)

SmartPickShop's opportunity research engine. You enter a product or niche idea and its evidence, Trend Lab scores it, saves the evidence, and lets you compare saved ideas side by side.

## Stack
- Next.js 16 (App Router) with React 19 and TypeScript
- Scoring logic is in `lib/scoring.ts` and the API routes are in `app/api/`
- Unit tests use `node --test` (`tests/`), and end-to-end tests use Playwright (`e2e/`)

## Run locally
```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests
npm run test:e2e   # Playwright end-to-end tests
npm run build      # production build
```

## Configuration
Requests to protected hosted routes return HTTP 401 if `TRENDLAB_USER` or `TRENDLAB_PASSWORD` is absent; the current proxy fails closed rather than preventing the server process from starting. Never commit credentials. The development-only E2E bypass needs `TRENDLAB_E2E_BYPASS=1` and a loopback Host header; never enable it on production hosts.

## CI
- `verify.yml` runs on every push and PR. It installs dependencies, then runs the unit tests and the production build.
- `browser-verify.yml` runs the browser checks.

## Production auth smoke
Run `npm run build && node tests/production-smoke.mjs` to verify the built Next.js server denies protected routes without credentials (even if the dev-only bypass is set), rejects bad credentials and accepts valid synthetic CI credentials. This is a production-mode **local runner**, not the actual deployed host or real customer account. CI runs it after the build.

## Private backup / restore
The browser workspace stores niche rows in localStorage; there is **no server-side cross-device persistence**. Export backup (.json) saves a versioned file containing all niche inputs, evidence notes, a reproducible formula and calculated scores; import validates row structure and score consistency, rejects malformed/oversized files, and replaces current browser rows. Store backups privately. This is a mitigation, not hosted durable synchronization or customer acceptance.

## Project status
See `STATUS.md`, `NEXT_ACTIONS.md`, `DECISIONS.md`, and `AI_HANDOFF.md`.
