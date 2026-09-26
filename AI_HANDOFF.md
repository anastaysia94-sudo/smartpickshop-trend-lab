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

Current observed main head: `06ac015fd39906813ac75d13ae1dd2a3971cfa2f`.

Changes since the prior continuity snapshot:
- E2E bypass logic was made explicit and restricted to `TRENDLAB_E2E_BYPASS=1` plus loopback host names.
- The browser test now fails fast on inaccessible pages, targets the niche field by its label, and scopes persistence checks to the saved row.
- The niche input received an accessibility label association.
- `61b16070847523b402f679b2f267533f27d01f88` applied the SmartPickShop steampunk/neon visual system.
- `06ac015fd39906813ac75d13ae1dd2a3971cfa2f` prepares the branded production build.

The current E2E test proves local row creation, scoring math, evidence text, persistence across reload, and ordering/comparison behavior when it runs successfully.

## Verification boundary

Do not claim the branded private deployment is healthy until current E2E and private-host access are run against the intended deployment/source revision.

## Smallest next execution block

1. Run the current E2E suite at main head.
2. Verify the private hosted build is pinned to/serving `06ac015fd39906813ac75d13ae1dd2a3971cfa2f`.
3. Confirm production access still fails closed without configured credentials.
4. Verify persistence, scoring, evidence display, project saving, refresh persistence, and desktop/mobile layout on the private host.
5. Record concrete browser/deployment evidence before changing launch status.
