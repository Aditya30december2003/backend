# Repo Current State

Last updated: 2026-06-13
Status: Sprint 1 planning baseline locked during documentation QA

## Current Architecture

- single Next.js App Router application
- frontend, BFF, API layer, and domain orchestration are all in the same repo/runtime
- many client-heavy pages still fetch page-critical data after hydration
- watchlist domain ownership is duplicated across multiple API families

## Current DB

- MongoDB + Prisma

## Current Cache

- no dedicated Redis/KV cache verified
- some in-memory request-path logic exists
- some Next.js fetch caching is used inconsistently

## Current Problems

1. Watchlists are structurally slow.
2. Watchlist APIs are duplicated across `/api/watchlists`, `/api/watchlist/*`, and `/api/lists/*`.
3. Movie detail still performs too much browser-side orchestration.
4. Image optimization is disabled.
5. Hardcoded TMDB keys still exist in source.
6. Discovery, trending, and recommendations do too much request-time work.
7. No tests.
8. No verified GitHub-hosted CI run yet.
9. Verified performance measurement is still incomplete.

## Completed Tickets

- `T0001` Add GitHub CI for lint and production build

## Known Risks

- legacy watchlist behavior may regress if cutover is rushed
- cache design can leak private data if user scoping is weak
- architecture cleanup without tests can create regressions
- database migration pressure may distract from higher-value short-term fixes
- the first GitHub-hosted CI run may reveal additional environment assumptions
- production build currently logs Prisma connection errors from some trending routes when MongoDB is unavailable during static generation

## Active Epic

- EPIC 00: Platform Governance and Baseline

## Next Ticket

- `T0002` Lock performance baseline to verified facts only

## Canonical Sprint 1 Docs

- `AGENTS.md`
- `docs/Manual_Verification_Guide.md`
- `docs/Known_Issues_And_Followups.md`
- `docs/performance/baseline.md`
- `docs/roadmap/sprint-1-execution-plan.md`

## Update Rule

Every merged ticket should update:

- Completed Tickets
- Known Risks
- Next Ticket
- any architecture or cache state that materially changed
