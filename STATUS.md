# STATUS

Updated: 2026-10-09 America/Los_Angeles

## Purpose
SmartPickShop Trend Lab / opportunity research engine.

## VERIFIED SOURCE STATE
- Audited main head is `9d3ab41b243127389d6210c6596229c523a7d00c` (2026-10-09); `60d5ac6...` is a historical checkpoint.
- Development-only E2E bypass requires `TRENDLAB_E2E_BYPASS=1` and a loopback Host header.
- Source rejects protected requests when `TRENDLAB_USER` or `TRENDLAB_PASSWORD` is missing; `/api/health` is intentionally public. Hosted behavior is not yet verified.
- The E2E source verifies page access, labeled input targeting, score calculation, saved evidence, persistence after reload, comparison behavior, and explicit 390×844 mobile-layout behavior.
- The mobile CSS now prevents the page from overflowing horizontally by containing wide table scrolling inside the comparison card.
- SmartPickShop steampunk/neon branding is present.

## VERIFICATION PENDING
- Main verify passed: Actions run 37220138372. Browser verify passed at `107cfba9be6a08731e4dd5515035219e1b8f48bc`: run 37220133455; only STATUS/NEXT_ACTIONS differ from audited main. This is local CI evidence, not private-host acceptance.
- Private-host source-revision match to the intended current revision.
- Private-host mobile/desktop acceptance and persistence proof.
- Production credentials must remain outside source control.

## Current gate
Run the latest E2E and private-host acceptance, including the explicit mobile case, then record exact deployment/source and browser evidence before calling the build ready.

## 2026-10-04 PT — repo maintenance notes (The Albino · Pit Keeper)
- README proposed in PR https://github.com/anastaysia94-sudo/smartpickshop-trend-lab/pull/3 (MERGED 2026-10-04; CI test + e2e passed).
- Minor dependency bump (next 16.3.8, react/react-dom 19.3.0, @playwright/test 1.63.0, lockfile regenerated) proposed in PR https://github.com/anastaysia94-sudo/smartpickshop-trend-lab/pull/4 (MERGED 2026-10-04; test, build and Playwright e2e passed on the PR).
- Major upgrades (eslint 10, TypeScript 7) deliberately held back.
- Licence: an all-rights-reserved SmartPickShop Holdings `LICENSE` notice was merged in PR https://github.com/anastaysia94-sudo/smartpickshop-trend-lab/pull/2 on 2026-10-04; LICENSE is present on main.
- PRs #2, #3, #4 and maintenance-note PR #5 are merged. No secrets were read or changed.
