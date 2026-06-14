# Sprint 1 Execution Plan

Date: 2026-06-13
Sprint goal: Create safety, measurement, and execution discipline before any performance refactor begins.

## Scope Lock

Sprint 1 includes only:

- CI for lint and build
- performance baseline
- route timing logs
- benchmark scripts
- watchlist investigation only

Already finalized during documentation QA:

- `AGENTS.md`
- `docs/Repo_Current_State.md`
- `docs/Manual_Verification_Guide.md`
- `docs/Known_Issues_And_Followups.md`

Not in Sprint 1:

- watchlist implementation work
- movie-detail refactor
- image optimization work
- dependency cleanup
- database migration
- Redis introduction
- automated smoke-test framework work

## Execution Order

### T0001 - Add GitHub CI for lint and production build

Goal:
- create the first merge safety gate

Allowed files:
- `.github/workflows/ci.yml`
- `package.json` only if absolutely needed
- `docs/Repo_Current_State.md`
- `docs/Known_Issues_And_Followups.md`

Do not touch:
- `src/`
- `prisma/`
- app features
- dependencies unless absolutely required

Acceptance criteria:
- pull requests trigger lint and build checks
- the workflow uses existing project commands only
- docs record that the first GitHub-hosted run still needs verification until it executes

Manual verification:
- run lint locally
- run build locally
- inspect workflow triggers and steps for correctness
- mark GitHub execution as `Needs verification` until the first PR run happens

Commands to run:
```powershell
npm run lint
npm run build
```

Rollback plan:
- revert or disable `.github/workflows/ci.yml` if it blocks urgent releases for non-product reasons

### T0002 - Lock performance baseline to verified facts only

Goal:
- make the baseline trustworthy before instrumentation expands it

Allowed files:
- `docs/performance/baseline.md`
- `docs/Repo_Current_State.md`
- `docs/Known_Issues_And_Followups.md`
- `docs/roadmap/sprint-1-execution-plan.md`

Do not touch:
- `src/`
- `prisma/`
- `.github/`
- dependencies

Acceptance criteria:
- baseline separates verified facts from `Needs measurement`
- stale counts are corrected or removed
- open measurements point to future tickets instead of being guessed

Manual verification:
- rerun the repo-count commands used in the doc
- rerun the production build if build-snapshot numbers are edited
- confirm every unproven statement is labeled clearly

Commands to run:
```powershell
npm run build
(Get-ChildItem src\\app\\api -Recurse -File | Measure-Object).Count
(Get-ChildItem src\\app -Recurse -Include page.tsx,page.ts,page.jsx,page.js -File | Measure-Object).Count
rg -l "use client" src | Measure-Object | Select-Object -ExpandProperty Count
```

Rollback plan:
- revert the doc update if any statement cannot be reproduced

### T0003 - Add route timing logs for hot endpoints

Goal:
- measure hot routes without changing their behavior

Allowed files:
- `src/lib/api-debug.ts`
- selected route handlers under `src/app/api/`
- `docs/performance/baseline.md`
- `docs/Known_Issues_And_Followups.md`

Do not touch:
- `src/app/(pages)/`
- `src/app/components/`
- `prisma/`
- dependencies

Acceptance criteria:
- timing stays env-gated
- selected hot routes emit handler and major-step timings
- no response contract changes are introduced

Manual verification:
- run locally with `DEBUG_API_TIMING=1`
- hit the instrumented routes and confirm logs appear
- run again without the flag and confirm the logs stay quiet

Commands to run:
```powershell
$env:DEBUG_API_TIMING='1'
npm run lint
npm run build
```

Rollback plan:
- remove the added route-logger calls or rely on the env gate while reverting

### T0004 - Add benchmark scripts for watchlists and movie detail

Goal:
- create repeatable local probes for the two highest-risk areas

Allowed files:
- `scripts/benchmark-watchlists.mjs`
- `scripts/profile-movie-detail.mjs`
- `docs/performance/baseline.md`
- `docs/Manual_Verification_Guide.md`
- `docs/Known_Issues_And_Followups.md`
- `package.json` only if a script alias is absolutely needed

Do not touch:
- `src/app/(pages)/`
- feature logic under `src/app/libs/`
- `prisma/`
- dependencies

Acceptance criteria:
- both scripts run locally against a documented base URL or local dev server
- output is useful without claiming wins
- setup gaps are documented instead of hidden

Manual verification:
- run both scripts locally
- confirm output is understandable
- mark auth or data-realism gaps as `Needs verification`

Commands to run:
```powershell
node scripts/benchmark-watchlists.mjs
node scripts/profile-movie-detail.mjs
```

Rollback plan:
- remove the scripts and keep the documented measurement approach if they add noise without value

### T0005 - Investigate the current watchlist read path and document findings only

Goal:
- turn watchlist pain into code-backed findings before implementation tickets are created

Allowed files:
- `docs/performance/watchlist-deep-dive.md`
- `docs/api/watchlists.md`
- `docs/architecture/domain-map.md`
- `docs/Known_Issues_And_Followups.md`
- `docs/roadmap/ticket-backlog.md`

Do not touch:
- `src/`
- `prisma/`
- `.github/`
- dependencies

Acceptance criteria:
- the current watchlist summary and detail read path is documented from page entry to route/helper level
- duplicated ownership boundaries are listed explicitly
- unknowns are marked `Needs verification`
- the result ends in small follow-up ticket candidates, not implementation

Manual verification:
- compare the documented inventory against repo search results
- confirm no code path is labeled canonical unless the repo proves it

Commands to run:
```powershell
rg -n "watchlist|watchlists|/api/lists|/api/watchlist" src
rg -n "syncLegacyWatchlistToDefault|useIncrementalList|AddToWatchlistControlRevamp" src
```

Rollback plan:
- revert the doc update if it drifts beyond verified findings
