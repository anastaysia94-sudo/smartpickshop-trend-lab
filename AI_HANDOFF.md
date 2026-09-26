# AI Handoff — SmartPickShop Trend Lab

Updated: 2026-09-26 America/Los_Angeles

## Identity

- Canonical repository: `anastaysia94-sudo/smartpickshop-trend-lab`
- Master project IDs: P020, P021
- Portfolio index: `anastaysia94-sudo/anastaysia94-sudo` → `CROSS_LLM_BOOTSTRAP.md`
- Machine-readable register: `portfolio/PROJECTS.json`

## Purpose

Evidence-based niche intelligence, opportunity scoring, content planning, and reporting.

## Continuity rules

- Preserve source traceability and evidence confidence.
- Distinguish popularity signals from real customer demand and willingness to pay.
- Production credentials stay outside source control.
- Historical chat summaries are context, not proof of the current build.
- Inspect recent commits, CI, deployment state, and handoff files before changing source.
- Record changed files, verification evidence, blockers, and rollback risk.

## Current source checkpoint

Current observed product-source head: `60d5ac6e489b9b58f018b39810656d79fc9e8a21`.

Changes since the prior continuity snapshot:
- E2E bypass logic is explicit and restricted to `TRENDLAB_E2E_BYPASS=1` plus loopback host names.
- Browser tests fail fast on inaccessible pages, target the niche field by label, and scope persistence checks to the saved row.
- The niche input has an accessibility label association.
- `61b16070847523b402f679b2f267533f27d01f88` applied the SmartPickShop steampunk/neon visual system.
- `06ac015fd39906813ac75d13ae1dd2a3971cfa2f` prepared the branded production build.
- `ff2eacd435e1d61a6d5ed9534e419f53a6ca56ff` added explicit 390×844 mobile-layout coverage.
- `60d5ac6e489b9b58f018b39810656d79fc9e8a21` contains wide comparison tables inside the card on mobile so the page itself does not horizontally overflow.

The current E2E source covers row creation, scoring math, evidence text, persistence across reload, comparison behavior, and mobile primary-workflow usability/no page overflow.

## Verification boundary

The mobile test and CSS fix are present in source. A current successful E2E/private-host run after these two newest commits was not verified in this continuity refresh.

## Smallest next execution block

1. Run the current E2E suite on the latest main.
2. Verify the private hosted build is serving the intended current revision, not merely the earlier `06ac015...` branded build checkpoint.
3. Confirm production/private access still fails closed without configured credentials.
4. Verify scoring, evidence display, saving, refresh persistence, comparison ordering, and 390×844 mobile layout on the private host.
5. Record concrete browser/deployment evidence before changing launch status.
