# SmartPickShop Trend Lab (P150 / XW0175)

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
Hosted deployments refuse to start unless `TRENDLAB_USER` and `TRENDLAB_PASSWORD` are set as environment variables. Never commit them. The development-only E2E bypass needs `TRENDLAB_E2E_BYPASS=1` and a loopback Host header.

## CI
- `verify.yml` runs on every push and PR. It installs dependencies, then runs the unit tests and the production build.
- `browser-verify.yml` runs the browser checks.

## Project status
See `STATUS.md`, `NEXT_ACTIONS.md`, `DECISIONS.md`, and `AI_HANDOFF.md`.
