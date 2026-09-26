# STATUS

Updated: 2026-09-26 America/Los_Angeles

## Purpose
SmartPickShop Trend Lab / opportunity research engine.

## VERIFIED SOURCE STATE
- Current observed main head is `06ac015fd39906813ac75d13ae1dd2a3971cfa2f`.
- Development-only E2E bypass requires `TRENDLAB_E2E_BYPASS=1` and a loopback Host header.
- Hosted deployments fail closed when `TRENDLAB_USER` or `TRENDLAB_PASSWORD` is missing.
- The E2E test now verifies page access, labeled input targeting, score calculation, saved evidence, persistence after reload, and comparison ordering.
- SmartPickShop steampunk/neon branding was added at `61b16070847523b402f679b2f267533f27d01f88`.
- The current head prepares the branded production build.

## VERIFICATION PENDING
- Fresh current-main E2E result.
- Private-host source-revision match.
- Private-host mobile/desktop acceptance and persistence proof after the new E2E/auth changes.
- Production credentials must remain outside source control.

## Current gate
Run current-main E2E and private-host acceptance, then record exact deployment/source and browser evidence before calling the branded build ready.
