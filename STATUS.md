# STATUS

Updated: 2026-09-26 America/Los_Angeles

## Purpose
SmartPickShop Trend Lab / opportunity research engine.

## VERIFIED SOURCE STATE
- Current observed product-source head is `60d5ac6e489b9b58f018b39810656d79fc9e8a21`.
- Development-only E2E bypass requires `TRENDLAB_E2E_BYPASS=1` and a loopback Host header.
- Hosted deployments fail closed when `TRENDLAB_USER` or `TRENDLAB_PASSWORD` is missing.
- The E2E source verifies page access, labeled input targeting, score calculation, saved evidence, persistence after reload, comparison behavior, and explicit 390×844 mobile-layout behavior.
- The mobile CSS now prevents the page from overflowing horizontally by containing wide table scrolling inside the comparison card.
- SmartPickShop steampunk/neon branding is present.

## VERIFICATION PENDING
- Fresh current-main E2E result after the mobile-layout test and containment fix.
- Private-host source-revision match to the intended current revision.
- Private-host mobile/desktop acceptance and persistence proof.
- Production credentials must remain outside source control.

## Current gate
Run the latest E2E and private-host acceptance, including the explicit mobile case, then record exact deployment/source and browser evidence before calling the build ready.
