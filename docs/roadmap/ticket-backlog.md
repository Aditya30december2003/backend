# Ticket Backlog

This backlog is designed for incremental shipping. Tickets are intentionally scoped so they can be delivered independently.

## Operating rules

- Epics are defined before implementation tickets.
- Each implementation ticket must belong to exactly one domain.
- Codex or any other coding agent should receive one ticket at a time, not a whole epic.
- Each ticket should be converted into an individual file under `docs/tickets/` before implementation starts.
- Each ticket should include an architecture scorecard before being accepted for work.

## EPIC 00: Baseline, CI, and Safety

Canonical Sprint 1 order: `docs/roadmap/sprint-1-execution-plan.md`

Scope lock:

- CI for lint and build
- performance baseline
- route timing logs
- benchmark scripts
- watchlist investigation only

Explicitly not in Sprint 1:

- automated smoke-test framework work
- watchlist implementation
- movie-detail implementation
- image optimization changes
- dependency cleanup
- database migration

# T0001
Title: Add GitHub CI for lint and production build
Type: infra
Priority: P0
Estimated size: S
Owner type: platform
Problem: The repo has no automated merge gate for basic health.
Goal: Run `npm run lint` and `npm run build` on pull requests.
Scope: Minimal workflow only. No product code changes.
Detailed ticket: `docs/tickets/T0001.md`

# T0002
Title: Lock performance baseline to verified facts only
Type: docs
Priority: P0
Estimated size: S
Owner type: platform
Problem: Baseline docs drift quickly if facts and assumptions are mixed together.
Goal: Keep only reproducible facts plus explicit measurement gaps.
Scope: Documentation only.
Detailed ticket: `docs/tickets/T0002.md`

# T0003
Title: Add route timing logs for hot endpoints
Type: perf
Priority: P0
Estimated size: S
Owner type: backend
Problem: Hot paths are known to be slow but timing capture is incomplete.
Goal: Standardize env-gated timing logs for priority routes.
Scope: Instrumentation only. No contract changes.
Detailed ticket: `docs/tickets/T0003.md`

# T0004
Title: Add benchmark scripts for watchlists and movie detail
Type: perf
Priority: P0
Estimated size: S
Owner type: backend
Problem: Optimization work needs repeatable local probes.
Goal: Add simple scripts for timing-oriented local checks.
Scope: Scripts and docs only.
Detailed ticket: `docs/tickets/T0004.md`

# T0005
Title: Investigate the current watchlist read path and document findings only
Type: investigation
Priority: P0
Estimated size: S
Owner type: backend
Problem: Watchlist implementation tickets are still too assumption-heavy.
Goal: Turn watchlist pain into verified findings before refactor tickets are created.
Scope: Documentation only. No runtime changes.
Detailed ticket: `docs/tickets/T0005.md`

## EPIC 01: Watchlist Performance

# E1-T01
Title: Define canonical watchlist API contract
Type: docs
Priority: P0
Estimated size: S
Owner type: backend
Problem: Three API families represent the same domain differently.
Goal: Lock the canonical `/api/watchlists` direction before refactoring code.
Scope: Finalize route inventory, deprecation targets, and target contracts.
Files likely affected: `docs/api/watchlists.md`, `docs/adr/0001-performance-architecture-direction.md`
Acceptance criteria: Canonical read/write contracts and legacy deprecation plan are documented.
Testing checklist: Architecture review signoff.
Risks: Scope ambiguity if product semantics stay fuzzy.
Dependencies: None.
Rollback plan: Revert doc decision before implementation begins.

# E1-T02
Title: Remove legacy watchlist sync from `GET /api/watchlists`
Type: perf
Priority: P0
Estimated size: M
Owner type: backend
Problem: Migration/repair logic still executes in a hot read path.
Goal: Move legacy sync out of the summary read path.
Scope: Replace runtime sync with backfill or explicit repair strategy.
Files likely affected: `src/app/api/watchlists/route.ts`, `src/app/libs/watchlists.ts`, migration docs/scripts
Acceptance criteria: Summary reads no longer trigger legacy sync work.
Testing checklist: Verify default watchlist behavior for migrated and unmigrated users.
Risks: Legacy compatibility regressions.
Dependencies: E1-T01.
Rollback plan: Restore legacy sync behind a feature flag if needed.

# E1-T03
Title: Add server-side pagination to watchlist detail reads
Type: perf
Priority: P0
Estimated size: M
Owner type: backend
Problem: Watchlist detail returns all items at once.
Goal: Paginate watchlist items at the API layer.
Scope: Add cursor or limit-based paging for item reads.
Files likely affected: `src/app/api/watchlists/[id]/route.ts`, new items endpoint if required
Acceptance criteria: Large watchlists no longer return full item sets by default.
Testing checklist: Verify first page, next page, empty page, invalid cursor.
Risks: UI/client compatibility break.
Dependencies: E1-T01.
Rollback plan: Keep old full-detail mode behind temporary compatibility flag.

# E1-T04
Title: Add dedicated paginated watchlist-items endpoint
Type: refactor
Priority: P0
Estimated size: M
Owner type: backend
Problem: Summary/detail/item concerns are mixed in one detail route.
Goal: Separate item pagination from summary metadata.
Scope: Introduce a focused items read endpoint under the canonical watchlist family.
Files likely affected: `src/app/api/watchlists/[id]/items/*`, watchlist docs
Acceptance criteria: A dedicated paginated item read route exists and is documented.
Testing checklist: Verify permission checks and paging behavior.
Risks: Temporary contract duplication during migration.
Dependencies: E1-T03.
Rollback plan: Continue using detail route while endpoint stabilizes.

# E1-T05
Title: Convert watchlist landing page to server-first rendering
Type: perf
Priority: P0
Estimated size: M
Owner type: frontend
Problem: `/watchlists` currently ships a client shell first and fetches data after hydration.
Goal: Render watchlist summaries on first server response.
Scope: Move initial summary loading into server-rendered page flow.
Files likely affected: `src/app/(pages)/watchlists/page.tsx`, watchlist client components
Acceptance criteria: Initial watchlist summary content is available without client-only bootstrap fetch.
Testing checklist: Verify authenticated, unauthenticated, and empty states.
Risks: Auth/session rendering edge cases.
Dependencies: E1-T01.
Rollback plan: Keep old client path behind a temporary fallback.

# E1-T06
Title: Convert watchlist detail page to server-first first-page loading
Type: perf
Priority: P0
Estimated size: M
Owner type: frontend
Problem: Watchlist detail is loaded only after client hydration.
Goal: Render summary and first page of items on the server.
Scope: Server-load page-critical detail; keep incremental pagination client-side if needed.
Files likely affected: `src/app/(pages)/watchlists/[id]/page.tsx`, watchlist detail components
Acceptance criteria: The page shows usable detail on first response with only follow-up page loads client-side.
Testing checklist: Verify first-page rendering and next-page loading.
Risks: Existing client assumptions may break.
Dependencies: E1-T03, E1-T04.
Rollback plan: Re-enable client detail fetch temporarily.

# E1-T07
Title: Replace local watchlist item slicing with real pagination/infinite scroll
Type: perf
Priority: P1
Estimated size: M
Owner type: frontend
Problem: `useIncrementalList` hides payload bloat but does not solve it.
Goal: Load more items by page from the server instead of slicing preloaded arrays.
Scope: Refactor watchlist UI to consume paginated results.
Files likely affected: `src/app/components/WatchListClient/WatchListClientRevamp.jsx`, related hooks
Acceptance criteria: Additional items load via API pagination; full payload is not preloaded.
Testing checklist: Verify scrolling, empty pages, duplicate prevention.
Risks: UX regressions during scroll transitions.
Dependencies: E1-T04, E1-T06.
Rollback plan: Fall back to first-page-only UI while fixing pagination bugs.

# E1-T08
Title: Introduce a watchlist service layer
Type: refactor
Priority: P1
Estimated size: M
Owner type: backend
Problem: Watchlist logic is scattered across routes and helpers.
Goal: Centralize watchlist operations and policies in one service boundary.
Scope: Extract shared flows for create/read/update/delete/item mutation.
Files likely affected: `src/app/libs/watchlists.ts`, watchlist routes, new service files
Acceptance criteria: Shared watchlist flows no longer need to be reimplemented per route.
Testing checklist: Verify no behavior drift across create/add/remove paths.
Risks: Refactor regressions.
Dependencies: E1-T01.
Rollback plan: Revert route-by-route if extraction destabilizes behavior.

# E1-T09
Title: Centralize watchlist permission and ownership helpers
Type: refactor
Priority: P1
Estimated size: S
Owner type: backend
Problem: Access and role logic is repeated and easy to drift.
Goal: Standardize owner/editor/viewer permission checks.
Scope: Extract canonical permission helpers for watchlist operations.
Files likely affected: watchlist routes and shared helpers
Acceptance criteria: Permission checks are reused consistently across canonical routes.
Testing checklist: Verify owner/editor/viewer behavior on read and write paths.
Risks: Access regressions if role assumptions are wrong.
Dependencies: E1-T08.
Rollback plan: Revert helper usage for affected routes.

## EPIC 02: Movie Detail Performance

# E2-T01
Title: Inventory current movie-detail browser request waterfall
Type: perf
Priority: P0
Estimated size: S
Owner type: frontend
Problem: The page is known to over-fetch, but the exact current waterfall should be documented before refactor.
Goal: Capture and document the current browser request graph.
Scope: Record request sources, sequence, and ownership.
Files likely affected: `docs/performance/movie-detail-deep-dive.md`
Acceptance criteria: The current waterfall is documented and reviewed.
Testing checklist: Validate against devtools network trace.
Risks: None.
Dependencies: None.
Rollback plan: N/A.

# E2-T02
Title: Create server-composed movie-detail loader
Type: perf
Priority: P0
Estimated size: L
Owner type: fullstack
Problem: Movie detail orchestration is spread across browser and internal APIs.
Goal: Introduce one server-side loader for primary movie-detail data.
Scope: Aggregate TMDB metadata, credits, providers, release info, OMDb enrichment, and user-specific state server-side where appropriate.
Files likely affected: movie detail page, movie APIs, shared movie loader files
Acceptance criteria: Primary movie detail renders from one server-composed path.
Testing checklist: Verify detail page renders correctly for logged-in and logged-out users.
Risks: Larger first refactor surface.
Dependencies: E2-T01.
Rollback plan: Keep old browser path behind a temporary fallback.

# E2-T03
Title: Cache TMDB and OMDb movie-detail metadata server-side
Type: perf
Priority: P0
Estimated size: M
Owner type: backend
Problem: External metadata is fetched too often and too late.
Goal: Add safe server-side caching for external movie-detail metadata.
Scope: Cache TMDB and OMDb detail fragments with documented TTLs.
Files likely affected: movie loaders/routes, cache helpers, docs
Acceptance criteria: Repeated movie detail loads reuse cached external metadata where safe.
Testing checklist: Verify cache hit/miss behavior and TTL expiration.
Risks: Stale metadata if TTL is too long.
Dependencies: E2-T02.
Rollback plan: Disable cache and fall back to direct fetches.

# E2-T04
Title: Remove browser-side TMDB/OMDb fan-out from movie detail page
Type: perf
Priority: P0
Estimated size: M
Owner type: frontend
Problem: Browser is doing too much primary-data work.
Goal: Reduce browser requests to page-local interactive needs only.
Scope: Remove direct browser calls that are replaced by the server loader.
Files likely affected: `src/app/(pages)/movies/[id]/page.jsx`, related components
Acceptance criteria: Browser no longer makes the current multi-call primary data waterfall.
Testing checklist: Verify devtools network requests before and after.
Risks: Partial data regressions during transition.
Dependencies: E2-T02.
Rollback plan: Restore specific browser fetches selectively if server loader is incomplete.

# E2-T05
Title: Split movie-detail interactive controls into small client islands
Type: refactor
Priority: P1
Estimated size: M
Owner type: frontend
Problem: Page-level client orchestration is heavier than necessary.
Goal: Keep only rating/like/watchlist controls client-side.
Scope: Ensure the detail shell and static content stay server-rendered while interactive controls hydrate separately.
Files likely affected: movie detail page and control components
Acceptance criteria: Movie detail shell is mostly server-rendered; interactive islands remain functional.
Testing checklist: Verify rating, liked, and watchlist actions still work.
Risks: hydration mismatches.
Dependencies: E2-T02.
Rollback plan: Restore previous component composition temporarily.

# E2-T06
Title: Add resilient fallback and error handling for movie-detail enrichment
Type: bug
Priority: P1
Estimated size: S
Owner type: fullstack
Problem: External enrichment failures can degrade the page unpredictably.
Goal: Standardize fallback behavior when TMDB/OMDb partial calls fail.
Scope: Define which fields are optional and renderable without breaking the page.
Files likely affected: movie loader, detail page, docs
Acceptance criteria: Partial external failures degrade gracefully without blanking the page.
Testing checklist: Simulate TMDB/OMDb failures and verify fallback behavior.
Risks: None beyond normal regression risk.
Dependencies: E2-T02.
Rollback plan: Revert fallback rules if they hide critical errors.

## EPIC 03: Image and Movie Grid Optimization

# E3-T01
Title: Re-enable Next.js image optimization
Type: perf
Priority: P0
Estimated size: S
Owner type: frontend
Problem: Image optimization is globally disabled in an image-heavy app.
Goal: Restore `next/image` optimization as the default.
Scope: Update Next config and validate remote domains/behavior.
Files likely affected: `next.config.mjs`
Acceptance criteria: `images.unoptimized = true` is removed or justified case-by-case.
Testing checklist: Verify posters, avatars, and remote images still render correctly.
Risks: provider cost and remote-domain edge cases.
Dependencies: None.
Rollback plan: Re-enable the old setting temporarily if critical regressions appear.

# E3-T02
Title: Replace raw `<img>` on critical watchlist and theater surfaces
Type: perf
Priority: P0
Estimated size: M
Owner type: frontend
Problem: Raw images hurt LCP and bypass framework optimizations.
Goal: Replace critical raw image usage with `next/image` or justified alternatives.
Scope: Start with lint-flagged critical pages and shared watchlist components.
Files likely affected: theater pages, watchlist UI, post cards
Acceptance criteria: Critical lint warnings for raw `<img>` are removed or intentionally documented.
Testing checklist: Verify layout stability, alt text, and responsive behavior.
Risks: layout shifts if sizing is not explicit.
Dependencies: E3-T01.
Rollback plan: Revert individual replacements if rendering breaks.

# E3-T03
Title: Audit poster, avatar, and thumbnail sizing strategy
Type: perf
Priority: P1
Estimated size: S
Owner type: frontend
Problem: Even optimized images can still be oversized or inconsistently requested.
Goal: Define intended dimensions and usage patterns for major image types.
Scope: Document target sizes and high-priority violations.
Files likely affected: `docs/performance/baseline.md`, image-heavy components
Acceptance criteria: Image size policy exists for key surfaces.
Testing checklist: Compare rendered sizes with requested asset sizes.
Risks: None.
Dependencies: E3-T01.
Rollback plan: N/A.

# E3-T04
Title: Reduce `MovieBlock` hydration cost
Type: perf
Priority: P1
Estimated size: M
Owner type: frontend
Problem: Each card mounts too much behavior in large grids.
Goal: Minimize default client work per card.
Scope: Review liked/watchlist/animation behavior and remove unnecessary always-on logic.
Files likely affected: `src/app/components/MovieBlock/MovieBlock.jsx`
Acceptance criteria: Card runtime behavior is measurably lighter and code responsibilities are slimmer.
Testing checklist: Verify card navigation, liked, and watchlist actions still work.
Risks: subtle UX regressions.
Dependencies: None.
Rollback plan: Revert specific card behaviors individually.

# E3-T05
Title: Lazy-load heavy card controls where possible
Type: perf
Priority: P1
Estimated size: M
Owner type: frontend
Problem: Every card loads controls whether or not the user interacts with them.
Goal: Defer heavier controls until needed.
Scope: Evaluate lazy or on-demand loading for watchlist chooser and similar controls.
Files likely affected: `MovieBlock`, watchlist control components
Acceptance criteria: Non-essential control code is not eagerly loaded on every grid render.
Testing checklist: Verify interaction still feels acceptable and accessible.
Risks: perceived lag on first interaction if over-deferred.
Dependencies: E3-T04.
Rollback plan: Eager-load specific controls again if UX suffers.

# E3-T06
Title: Replace unnecessary GSAP usage on large grids with lighter interaction
Type: perf
Priority: P2
Estimated size: M
Owner type: frontend
Problem: Animation cost is repeated across many cards.
Goal: Use lighter CSS transitions where motion does not need GSAP.
Scope: Review large-grid card motion specifically, not all motion in the product.
Files likely affected: `MovieBlock`, shared motion helpers
Acceptance criteria: Large-grid card motion no longer depends on heavy per-card GSAP patterns where avoidable.
Testing checklist: Verify interaction quality on desktop and mobile.
Risks: visual feel may change.
Dependencies: E3-T04.
Rollback plan: Re-enable GSAP for the affected interaction if needed.

## EPIC 04: Discovery, Trending, Recommendations

# E4-T01
Title: Add caching strategy for discovery responses
Type: perf
Priority: P1
Estimated size: M
Owner type: backend
Problem: Discovery route does too much work per request.
Goal: Cache broad discovery responses by safe query/context boundaries.
Scope: Identify cacheable vs personalized response segments and implement conservative caching.
Files likely affected: `src/app/api/movies/discovery/route.ts`, cache helpers, docs
Acceptance criteria: Repeated identical discovery requests reuse cached data where safe.
Testing checklist: Verify cache key behavior across query/context variants.
Risks: stale or incorrectly shared personalized data.
Dependencies: E0-T03.
Rollback plan: Disable caching per route.

# E4-T02
Title: Precompute weekly trending instead of computing fully on request
Type: perf
Priority: P1
Estimated size: M
Owner type: backend
Problem: Trending route computes ranking and enrichment at request time.
Goal: Move weekly trending generation to a scheduled refresh path.
Scope: Define storage/cache shape and refresh trigger.
Files likely affected: trending route, job design docs, cache/storage helpers
Acceptance criteria: Request path reads from precomputed or cached trending data.
Testing checklist: Verify refresh and read behavior end-to-end.
Risks: stale rankings if refresh cadence is wrong.
Dependencies: E0-T05.
Rollback plan: Restore request-time computation temporarily.

# E4-T03
Title: Cache recommendations by movie id
Type: perf
Priority: P1
Estimated size: M
Owner type: backend
Problem: Recommendation computation is expensive and repeated.
Goal: Reuse recommendation outputs per seed movie where safe.
Scope: Add cache policy, TTL, and busting rules.
Files likely affected: `src/app/libs/movieRecommendations.ts`, recommendation route, docs
Acceptance criteria: Repeated requests for the same movie avoid full recomputation when safe.
Testing checklist: Verify cache hit behavior and correctness for repeated requests.
Risks: stale recs if invalidation is too weak.
Dependencies: E0-T03.
Rollback plan: Disable cache if correctness issues appear.

# E4-T04
Title: Reduce repeated request-time TMDB enrichment in discovery and trending
Type: perf
Priority: P1
Estimated size: M
Owner type: backend
Problem: Some routes enrich top results one-by-one on request.
Goal: Consolidate, cache, or pre-stage enrichment work.
Scope: Audit repeated enrichment loops and replace the worst ones first.
Files likely affected: discovery and trending routes, shared movie helpers
Acceptance criteria: The highest-cost repeated enrichment loops are removed from hot request paths.
Testing checklist: Compare request behavior before and after.
Risks: incomplete metadata if preload strategy is wrong.
Dependencies: E4-T01, E4-T02.
Rollback plan: Restore old logic per endpoint if needed.

# E4-T05
Title: Define background job strategy for performance-sensitive read models
Type: architecture
Priority: P1
Estimated size: S
Owner type: backend
Problem: Some expensive operations clearly belong outside request paths, but there is no shared job strategy.
Goal: Decide how scheduled refresh and async precomputation should run.
Scope: Document job responsibilities, cadence, and ownership boundaries.
Files likely affected: `docs/architecture/target-stack.md`, `docs/adr/*`, roadmap docs
Acceptance criteria: A documented job strategy exists for trending, recommendations, migration backfills, and notification fanout.
Testing checklist: Architecture review signoff.
Risks: none if kept as planning first.
Dependencies: None.
Rollback plan: N/A.

## EPIC 05: Dependency and Bundle Cleanup

# E5-T01
Title: Run verified dependency usage audit
Type: docs
Priority: P1
Estimated size: S
Owner type: fullstack
Problem: The dependency surface is likely larger than necessary.
Goal: Produce a verified keep/remove review of dependencies and their usage paths.
Scope: Confirm actual imports, dynamic usage, and false positives before deletion.
Files likely affected: `package.json`, `docs/technical-debt.md`, dependency policy docs
Acceptance criteria: Each suspicious package is marked keep/remove/needs verification.
Testing checklist: Manual code search and build verification.
Risks: false unused-package conclusions.
Dependencies: None.
Rollback plan: N/A.

# E5-T02
Title: Remove verified unused dependencies
Type: refactor
Priority: P1
Estimated size: M
Owner type: fullstack
Problem: Unused packages increase install and maintenance cost.
Goal: Remove only packages confirmed unused.
Scope: Remove low-risk unused dependencies and regenerate lockfile.
Files likely affected: `package.json`, lockfile
Acceptance criteria: Selected dependencies are removed and lint/build still pass.
Testing checklist: Run install, lint, and build after removal.
Risks: hidden runtime references.
Dependencies: E5-T01.
Rollback plan: Re-add removed package and restore lockfile diff.

# E5-T03
Title: Add dynamic-import strategy for heavy feature-only packages
Type: perf
Priority: P1
Estimated size: M
Owner type: frontend
Problem: Narrow-use heavy dependencies may be bloating page bundles unnecessarily.
Goal: Defer heavy feature-only code until needed.
Scope: Target areas like editor, video, or rarely used UI tooling where appropriate.
Files likely affected: relevant page/component files
Acceptance criteria: Heavy feature-only modules are not eagerly loaded on unrelated routes.
Testing checklist: Verify route bundles and runtime behavior.
Risks: first-use latency on deferred features.
Dependencies: E5-T01.
Rollback plan: Revert dynamic imports for affected components.

# E5-T04
Title: Add bundle analyzer workflow for local architecture review
Type: infra
Priority: P2
Estimated size: S
Owner type: devops
Problem: Bundle decisions are currently inferred, not systematically reviewed.
Goal: Make route and dependency bundle impact inspectable.
Scope: Add analyzer tooling and usage docs.
Files likely affected: `package.json`, Next config, docs
Acceptance criteria: Team can generate and review bundle reports locally.
Testing checklist: Run analyzer and verify report output.
Risks: minimal tooling overhead.
Dependencies: None.
Rollback plan: Remove analyzer tooling if not used.

# E5-T05
Title: Document dependency policy for future additions
Type: docs
Priority: P2
Estimated size: S
Owner type: fullstack
Problem: The repo currently has weak dependency discipline.
Goal: Set explicit expectations for adding new libraries.
Scope: Define criteria for bundle impact, ownership, and maintenance cost.
Files likely affected: `AGENTS.md`, `CONTRIBUTING.md`, docs
Acceptance criteria: A dependency policy exists and is referenced in working docs.
Testing checklist: Team review signoff.
Risks: none.
Dependencies: E5-T01.
Rollback plan: N/A.

## EPIC 06: Security and Config

# E6-T01
Title: Remove hardcoded TMDB keys and fallback secrets from source
Type: security
Priority: P0
Estimated size: S
Owner type: backend
Problem: API keys are committed in source and fallback paths.
Goal: Eliminate hardcoded third-party secrets from the repo.
Scope: Replace committed keys with env-only configuration.
Files likely affected: movie helper files, request helper files, docs
Acceptance criteria: No third-party secret or fallback API key remains in tracked source.
Testing checklist: Verify affected routes still work with env vars configured.
Risks: breakage if env setup is incomplete.
Dependencies: None.
Rollback plan: Revert targeted changes while env setup is corrected.

# E6-T02
Title: Move remaining browser-side third-party movie API access behind server-side boundaries
Type: security
Priority: P0
Estimated size: M
Owner type: fullstack
Problem: Browser-side third-party requests expose app behavior and rely on public keys.
Goal: Centralize third-party movie API access server-side.
Scope: Replace remaining direct browser TMDB/OMDb usage on page-critical surfaces.
Files likely affected: movie detail page, search, navbar search, utility panels
Acceptance criteria: Critical movie metadata flows no longer depend on direct browser third-party fetches.
Testing checklist: Verify behavior in authenticated and anonymous states.
Risks: regression in non-primary flows if not fully inventoried.
Dependencies: E6-T01.
Rollback plan: Restore individual browser requests if a server path is temporarily missing.

# E6-T03
Title: Add centralized env validation strategy
Type: infra
Priority: P1
Estimated size: M
Owner type: backend
Problem: Env usage is scattered and not validated consistently.
Goal: Fail fast for missing required env vars and document optional ones.
Scope: Create env schema/validator and classify required vs optional variables.
Files likely affected: env helper files, startup paths, docs
Acceptance criteria: Required envs are validated in a consistent place.
Testing checklist: Verify friendly failure behavior for missing env vars in local/dev.
Risks: startup failures if the validator is too strict too early.
Dependencies: E6-T01.
Rollback plan: Run validator in warning-only mode temporarily.

# E6-T04
Title: Add `.env.example`
Type: docs
Priority: P1
Estimated size: S
Owner type: backend
Problem: Required configuration is not clearly shared.
Goal: Provide a safe example env contract without secrets.
Scope: List required and optional env variables with placeholders only.
Files likely affected: `.env.example`, docs
Acceptance criteria: New contributors can identify required config quickly without reading source.
Testing checklist: Compare example against actual env usage inventory.
Risks: example drift if not maintained.
Dependencies: E6-T03.
Rollback plan: Remove file if it becomes dangerously stale, though preferred path is updating it.

# E6-T05
Title: Document required env vars and ownership
Type: docs
Priority: P1
Estimated size: S
Owner type: backend
Problem: Configuration expectations are currently implicit.
Goal: Document env purpose, owner, and sensitivity.
Scope: Add env variable documentation to repo docs.
Files likely affected: docs, `README.md`
Acceptance criteria: Required envs are documented with purpose and sensitivity notes.
Testing checklist: Review against env inventory.
Risks: documentation drift.
Dependencies: E6-T03.
Rollback plan: N/A.

## EPIC 07: Database Architecture Decision

# E7-T01
Title: Benchmark current MongoDB watchlist query patterns
Type: perf
Priority: P1
Estimated size: M
Owner type: backend
Problem: Database direction should be driven by measured hot queries, not instinct alone.
Goal: Measure current watchlist read and write query behavior.
Scope: Capture timings, payload size, and likely pathological query shapes.
Files likely affected: benchmark scripts, docs
Acceptance criteria: Watchlist query benchmark notes exist and are reviewed.
Testing checklist: Run benchmarks against realistic local/staging data.
Risks: low-value benchmarks if data is too synthetic.
Dependencies: E0-T05.
Rollback plan: Keep only the measurement notes if scripts are noisy.

# E7-T02
Title: Inventory missing or questionable indexes for relationally hot collections
Type: perf
Priority: P1
Estimated size: S
Owner type: backend
Problem: Index discipline is not yet documented against real access patterns.
Goal: Review watchlist, follow, rating, review, and notification query/index fit.
Scope: Compare hot reads and writes against schema indexes.
Files likely affected: `prisma/schema.prisma`, docs
Acceptance criteria: Index review document lists keep/add/revisit decisions.
Testing checklist: Cross-check query shapes with current schema.
Risks: index advice without measurement may overfit.
Dependencies: E7-T01.
Rollback plan: N/A.

# E7-T03
Title: Add missing high-value indexes identified by benchmark review
Type: perf
Priority: P1
Estimated size: M
Owner type: backend
Problem: Hot collections may be under-indexed for current access patterns.
Goal: Apply only the highest-confidence index improvements.
Scope: Update schema and sync indexes conservatively.
Files likely affected: `prisma/schema.prisma`, deployment docs
Acceptance criteria: Selected indexes are added and validated against benchmarked paths.
Testing checklist: Verify schema push and re-measure affected queries.
Risks: write amplification or unnecessary index growth.
Dependencies: E7-T02.
Rollback plan: Remove low-value indexes in follow-up schema update.

# E7-T04
Title: Produce MongoDB-vs-PostgreSQL follow-up decision input from measured watchlist data
Type: architecture
Priority: P1
Estimated size: S
Owner type: backend
Problem: The long-term persistence decision needs actual measured evidence.
Goal: Convert benchmark findings into decision criteria for database direction.
Scope: Summarize measured pain points and whether cleanup materially reduced them.
Files likely affected: `docs/adr/0002-postgres-redis-evaluation.md`
Acceptance criteria: ADR input is updated with measured findings, not just theory.
Testing checklist: Architecture review signoff.
Risks: premature conclusion if benchmarks are thin.
Dependencies: E7-T01, E7-T03.
Rollback plan: Mark decision as deferred if evidence is inconclusive.

# E7-T05
Title: Design staged PostgreSQL migration plan for relational/social core
Type: migration
Priority: P2
Estimated size: M
Owner type: backend
Problem: If migration is approved later, planning should already exist.
Goal: Define migration order, cutover strategy, and rollback approach.
Scope: Plan only; do not implement dual-write yet.
Files likely affected: ADRs, architecture docs, data-model docs
Acceptance criteria: A staged migration plan exists for the relational core.
Testing checklist: Architecture review signoff.
Risks: wasted planning if migration is rejected.
Dependencies: E7-T04.
Rollback plan: Archive plan if strategy changes.

# E7-T06
Title: Decide whether Redis is needed immediately or after Phase 2
Type: architecture
Priority: P2
Estimated size: S
Owner type: backend
Problem: Redis is attractive but should not be added by default.
Goal: Define immediate vs medium-term Redis need based on measured hotspots.
Scope: Review cache candidates after watchlist and movie-detail findings.
Files likely affected: `docs/adr/0002-postgres-redis-evaluation.md`, roadmap docs
Acceptance criteria: Redis timing decision is explicit and documented.
Testing checklist: Architecture review signoff.
Risks: premature infrastructure growth.
Dependencies: E2-T03, E4-T01, E7-T01.
Rollback plan: Defer Redis if need is not proven.

## EPIC 08: Video Feature Hardening

# E8-T01
Title: Audit current Firebase/Mux/video responsibilities
Type: docs
Priority: P2
Estimated size: S
Owner type: fullstack
Problem: Video flow exists but ownership boundaries are not clearly documented.
Goal: Document upload, metadata, playback, webhook, and permission responsibilities.
Scope: Audit current flow only; no redesign yet.
Files likely affected: `docs/api/movies.md`, architecture docs, video docs if added
Acceptance criteria: Current video flow and integration boundaries are documented.
Testing checklist: Compare docs against route/component inventory.
Risks: none.
Dependencies: None.
Rollback plan: N/A.

# E8-T02
Title: Validate video upload size, type, and metadata constraints
Type: bug
Priority: P2
Estimated size: M
Owner type: backend
Problem: Upload flows need stronger validation and guardrails.
Goal: Enforce safer file and metadata constraints.
Scope: Validate request shape and document expected constraints.
Files likely affected: video upload routes, docs
Acceptance criteria: Upload constraints are enforced and documented.
Testing checklist: Verify invalid metadata/file scenarios fail cleanly.
Risks: breaking existing loose clients.
Dependencies: E8-T01.
Rollback plan: Relax validation while preserving critical protections.

# E8-T03
Title: Separate video upload, metadata, playback, and permission responsibilities more cleanly
Type: refactor
Priority: P2
Estimated size: M
Owner type: fullstack
Problem: Video logic is currently thin but not well-bounded.
Goal: Clarify which code handles upload initiation, webhook completion, playback fetches, and access control.
Scope: Refactor boundaries without redesigning the full video product.
Files likely affected: video routes, shared helpers, docs
Acceptance criteria: Responsibilities are cleaner and easier to extend safely.
Testing checklist: Verify upload, webhook, and playback flows still work.
Risks: integration regressions with Mux.
Dependencies: E8-T01.
Rollback plan: Revert boundary refactor if flow breaks.

# E8-T04
Title: Document video API and operational expectations
Type: docs
Priority: P2
Estimated size: S
Owner type: backend
Problem: Video APIs are not documented for maintenance and hardening work.
Goal: Add concise docs for video routes, webhook behavior, and metadata ownership.
Scope: Documentation only.
Files likely affected: `docs/api/movies.md` or new video docs, roadmap docs
Acceptance criteria: Video API responsibilities and assumptions are documented.
Testing checklist: Team review.
Risks: documentation drift.
Dependencies: E8-T01.
Rollback plan: N/A.
