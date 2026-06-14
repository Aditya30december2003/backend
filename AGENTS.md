# AGENTS.md

## Project overview

TheMovieProject is a single Next.js App Router application that currently handles:

- movie discovery
- movie detail and recommendations
- ratings and reviews
- liked movies
- watchlists and collaborative watchlists
- blogs and social feed
- notifications
- video upload and playback

This repo is currently in a performance-hardening and architecture-consolidation phase.

## Tech stack

- Next.js `14.2.5`
- React `18`
- NextAuth `4`
- Prisma `6.19`
- MongoDB
- Tailwind CSS
- Firebase storage in some flows
- Mux for video upload/playback

## Current repo reality

- Many pages are client-heavy.
- Watchlist APIs are duplicated across `/api/watchlists`, `/api/watchlist/*`, and `/api/lists/*`.
- Some third-party movie API calls happen in the browser.
- Image optimization is currently disabled.
- Tests and CI are not yet established.

Treat all work here as incremental architecture cleanup, not freeform feature sprawl.

## Core working rules

### Architecture rules

- Prefer Server Components by default.
- Use client components only for true interactive islands.
- Do not add new duplicate APIs.
- Canonical watchlist direction is `/api/watchlists`.
- Keep domain logic out of page components when possible.
- Prefer a domain service layer plus data-access helpers for non-trivial features.
- Every ticket must belong to exactly one domain.
- One entity should have one service boundary and one canonical API family.

### Architecture principles

#### Principle 1: Server Components by default

Client Components are allowed mainly for:

- forms
- toggles
- drag-drop
- animations

#### Principle 2: No new API route without justification

Before creating a new route family, answer:

- Can an existing route be extended safely?
- Is the route inside the correct domain?
- Does this create duplicate domain ownership?

#### Principle 3: No duplicate domain ownership

- one entity
- one service boundary
- one canonical API family

#### Principle 4: No browser-side TMDB access

- third-party movie APIs should be accessed through the server layer

#### Principle 5: Architecture review before implementation

Before a multi-ticket epic begins, complete these review passes:

- architecture review
- performance review
- security review
- dependency review

### Performance rules

- Avoid client-first fetching for page-critical data.
- Do not load full collections if the UI only needs a page.
- Use real server-side pagination, not client slicing of full payloads.
- Avoid browser fan-out to multiple internal and external endpoints for a single screen.
- Prefer cached server-side aggregation for TMDB/OMDb-backed data.
- Use `next/image` unless there is a documented reason not to.
- Do not add heavy per-card client behavior to large grids without measuring impact.
- Prefer real server-side pagination over local array slicing.
- Remove migration or repair logic from hot read paths once a cutover exists.

### Performance budgets

Initial target budgets. These are governance targets, not measured current-state facts.

- movie page JS target: `< 100 KB` route-owned JS where practical
- watchlist page JS target: `< 75 KB` route-owned JS where practical
- API P95 target for hot user flows: `< 300ms` after optimization

These targets need verification and may be revised after measurement.

### Security and config rules

- Never hardcode secrets or fallback API keys in source code.
- Use environment variables for all secrets and third-party credentials.
- Prefer server-side third-party API access over exposing keys in the browser.
- Validate env assumptions in docs and code paths.

### Change-management rules

- Do not rewrite unrelated code while addressing a focused ticket.
- Do not introduce a new pattern when an approved project pattern already exists.
- Update architecture docs and ADRs when changing data flow, API shape, auth, caching, or persistence direction.
- If a change affects watchlists, movies, feed, auth, notifications, or video, update the relevant docs in `docs/`.
- Do not implement an epic from memory alone; use the epic doc plus the specific ticket doc.
- Codex or any other agent should work one ticket at a time, not the whole epic at once.

## Coding rules

- Keep edits small and ticket-sized.
- Prefer TypeScript for new infrastructure, service, validation, and route code.
- Do not add new JS files for complex backend/domain logic unless there is a strong reason.
- Reuse `@/lib/prisma` as the Prisma client entry point where possible.
- Keep route handlers thin; move logic into service helpers once complexity grows.
- Centralize validation instead of repeating ad hoc request parsing.
- Centralize authorization and permission checks for shared domains like watchlists.

## How to run checks

- Lint: `npm run lint`
- Production build: `npm run build`

### Tests

There is currently no reliable repo-wide automated test command.

If you add tests:

- add an npm script
- document it in `README.md` and this file
- do not claim full verification from lint/build alone

## How to add a new API

1. Confirm the domain does not already have an overlapping route.
2. Define the contract in `docs/api/...` if the API is non-trivial.
3. Keep the route handler thin.
4. Add validation near the boundary.
5. Reuse shared auth and permission helpers.
6. Consider pagination, caching, and response size before shipping.
7. Add at least one smoke-test path or manual verification checklist in the ticket/doc.

## How to add a new UI component

1. Decide whether it must be a client component.
2. If server-renderable, keep it server-renderable.
3. Avoid adding network orchestration into presentation components.
4. Avoid introducing new animation libraries or heavy dependencies for one-off UI.
5. For list/grid UIs, think about hydration cost before adding interactivity to every item.

## Performance-sensitive areas

Treat these as high-risk surfaces:

- watchlists
- movie detail pages
- discovery/trending/recommendations
- movie grids
- image-heavy pages
- feed and notifications
- video upload/playback flows

For these areas:

- measure before and after
- log route timing if needed
- check payload size
- check client bundle impact
- check whether the change increases browser requests

## Documentation expectations

When you make meaningful architecture or performance changes, update the relevant docs:

- `docs/architecture/current-state.md`
- `docs/architecture/target-state.md`
- `docs/Repo_Current_State.md`
- `docs/Known_Issues_And_Followups.md`
- `docs/Manual_Verification_Guide.md`
- `docs/performance/*.md`
- `docs/api/*.md`
- `docs/technical-debt.md`
- `docs/roadmap/ticket-backlog.md`
- `docs/epics/*.md`
- `docs/tickets/*.md`
- `docs/adr/*.md`

## What not to do

- Do not start a full rewrite without an approved ADR.
- Do not introduce microservices.
- Do not add more legacy-compatible endpoints if the domain already has duplicates.
- Do not keep migration/backfill logic in hot read paths longer than necessary.
- Do not expose private data through caches.
- Do not claim performance improvements without at least basic verification.
- Do not skip updating repo memory after a ticket is completed.
