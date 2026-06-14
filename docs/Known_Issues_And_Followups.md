# Known Issues And Followups

Status: Active triage register
Last updated: 2026-06-13

## Verified current issues

- no CI workflow is merged on `main` yet
- no verified automated tests exist yet
- production build behavior with unavailable MongoDB still needs baseline capture
- watchlist ownership and API surface are duplicated across multiple route families
- watchlist detail still returns too much data for large lists
- browser-side TMDB and OMDb access still exists in page-critical flows
- image optimization is still disabled
- hardcoded TMDB keys still exist in source
- verified performance measurement is incomplete

## Sprint 1 scope lock

Sprint 1 is for safety, measurement, and execution discipline only.

Not in Sprint 1:

- watchlist performance implementation
- movie-detail refactor
- image optimization changes
- dependency removals
- database migration work
- Redis introduction
- automated smoke-test framework work

## Needs verification

- real production latency distribution
- real large-watchlist payload sizes
- hot-route P95 and P99 timings
- realistic benchmark data volume
- first GitHub-hosted CI run after T0001 is merged

## Followups after Sprint 1

- decide whether smoke tests should be Sprint 2 or later
- convert watchlist investigation findings into implementation tickets
- revisit database direction only after measured watchlist and movie-detail findings exist
