# Performance Roadmap

## Phase 0: Baseline and safety

Goal:

- make changes measurable and safer

Canonical execution order:

- `docs/roadmap/sprint-1-execution-plan.md`

Deliverables:

- lint/build CI
- AGENTS and current-state doc finalization
- manual verification guide finalization
- route timing logs
- baseline docs
- benchmark scripts
- watchlist investigation ticket, documentation only

## Phase 1: Watchlist performance

Goal:

- make the explicitly slowest reported area materially faster

Deliverables:

- one canonical watchlist API direction
- legacy sync removed from hot read path
- real server-side pagination
- server-first watchlist page loading
- permission helper consolidation

## Phase 2: Movie detail and image-heavy pages

Goal:

- reduce browser waterfall and hydration cost

Deliverables:

- server-composed movie detail loader
- external metadata caching
- `next/image` optimization restored
- raw `<img>` reduction on critical surfaces

## Phase 3: Discovery, trending, and recommendations

Goal:

- reduce expensive request-time work

Deliverables:

- cached discovery responses
- precomputed or cached trending
- recommendation caching strategy
- background-job design

## Phase 4: Bundle and dependency cleanup

Goal:

- reduce install, bundle, and runtime cost

Deliverables:

- dependency usage audit
- package removal plan
- dynamic import strategy for heavy feature-only modules
- bundle analysis tooling

## Phase 5: Persistence and caching architecture decision

Goal:

- decide whether MongoDB remains sufficient after cleanup

Deliverables:

- benchmark-based MongoDB review
- PostgreSQL/Redis decision ADR follow-up
- staged migration design if approved
