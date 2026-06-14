# 2026-06 Performance and Architecture Audit

Date: 2026-06-13
Status: Active
Tone: Direct by design

## 1. Executive summary

TheMovieProject is trying to ship too many product capabilities through one client-heavy, partially duplicated application architecture.

The app is slow because:

- page-critical data is often fetched after hydration
- watchlist APIs are duplicated and inconsistent
- some routes return too much data
- external movie metadata is fetched too often and too late
- image optimization is disabled
- some expensive endpoints do too much work on request

The app is hard to maintain because:

- the same domain exists under multiple API surfaces
- page components often own orchestration logic
- tests and CI are still missing, and the new documentation/process layer is not battle-tested yet
- hardcoded API keys still exist in source

This is recoverable without a rewrite.

## 2. Repo inspection summary

Verified during re-inspection:

- framework: Next.js App Router
- Next.js version: `14.2.5`
- database provider: MongoDB via Prisma
- auth: NextAuth with Google + credentials provider
- route files in `src/app/api`: `71`
- page files in `src/app`: `24`
- client-marked files: `69`
- tests found: none
- GitHub Actions workflows found: none
- lint/build: both pass, with image-related warnings

Key verified concerns:

- watchlist logic exists across `/api/watchlists`, `/api/watchlist/*`, and `/api/lists/*`
- watchlist pages are client-first
- watchlist detail loads all items at once
- TMDB keys are hardcoded in source in more than one file
- browser-side TMDB/OMDb fetches still exist
- `images.unoptimized = true` is enabled in `next.config.mjs`

## 3. Current product goal

Based on the repo, the product goal appears to be:

- a movie-centric social product
- personal and collaborative curation through watchlists
- community engagement through reviews, blogs, feed, and reactions
- movie discovery and recommendations
- some creator/video capability

This is not a simple movie browser anymore. It is becoming a social platform with collaborative data models.

## 4. Current technical reality

Short version:

- one Next.js app is acting as frontend, backend-for-frontend, API layer, and some domain orchestration layer
- MongoDB is backing increasingly relational product behavior
- performance-sensitive pages lean heavily on client fetching
- some hot paths are carrying legacy compatibility logic

This is workable in the short term, but the current shape is too messy to scale calmly.

## 5. Main causes of slowness

### 5.1 Watchlists

- `/watchlists` is not server-first
- watchlist summary and watchlist detail are separate client fetches
- detail payloads return too much data
- pagination is visual only, not data-level
- legacy sync still runs in the read path

### 5.2 Movie detail

- too many client-side requests for one page
- external API fan-out is browser-driven
- user-specific status is fetched separately

### 5.3 Movie grids

- many interactive `MovieBlock` instances mount at once
- liked/watchlist controls hydrate on many cards
- animation overhead is repeated per card

### 5.4 Discovery / trending / recommendations

- too much request-time computation
- too much request-time third-party enrichment
- insufficient caching/precomputation

### 5.5 Images

- optimization is disabled
- raw `<img>` is still used in important surfaces

## 6. Main causes of engineering complexity

- duplicated API families for the same domain
- mixed JS/TS backend logic
- page components doing orchestration
- inconsistent naming: list, watchlist, collection
- no test safety net
- no CI safety net
- incomplete architecture documentation
- committed hardcoded API keys

## 7. Current architecture diagram in text form

```text
Browser
  -> Next.js App Router pages
    -> many client components
      -> browser fetches internal APIs
      -> browser fetches TMDB/OMDb directly in some flows

Next.js route handlers
  -> auth/session lookup
  -> Prisma client
  -> MongoDB
  -> TMDB / OMDb
  -> Mux
  -> Firebase

Shared domain reality
  -> watchlists domain split across:
     - /api/watchlists
     - /api/watchlist/*
     - /api/lists/*
```

## 8. Target architecture diagram in text form

```text
Browser
  -> Server-rendered page shell and primary data
  -> small client islands only for:
     - likes
     - watchlist toggles
     - comments
     - drag/reorder

Next.js server layer
  -> page loaders / server components
  -> route handlers for mutations and paginated reads
  -> domain services
  -> repository/data-access helpers
  -> centralized validation and auth helpers

Data and integration layer
  -> Prisma
  -> MongoDB short term
  -> PostgreSQL candidate for relational/social core later
  -> Redis/KV candidate for safe caches and ephemeral coordination
  -> background jobs for trending, recommendations, migrations, fanout
```

## 9. What to fix now

### Must fix first

- unify watchlist APIs
- remove legacy sync from the watchlist read path
- add real server-side watchlist pagination
- move watchlist pages toward server-first rendering
- re-enable image optimization
- move movie detail orchestration server-side
- cache or precompute expensive movie data flows
- remove hardcoded API keys from source
- add CI and manual verification discipline first; treat smoke tests as follow-up work

## 10. What NOT to rewrite yet

- do not rewrite the whole app
- do not split into microservices
- do not migrate databases before cleaning up data flow and API duplication
- do not replace NextAuth during the first performance pass
- do not redesign every UI component before fixing the worst data-loading mistakes

## 11. What to migrate later

- candidate migration of social/watchlist relational core to PostgreSQL
- candidate addition of Redis for caching and rate-limiting
- candidate background-job execution layer
- candidate stronger test harness and bundle analysis tooling

## 12. Risks

- watchlist work can break data compatibility if legacy cutover is rushed
- caching can leak private state if scoped badly
- Postgres migration can create dual-write inconsistency if attempted too early
- recommendation/trending work can become a time sink if not scoped tightly
- bundle cleanup can cause regressions if packages are removed without verification

## 13. Assumptions

- collaborative watchlists are a strategic feature, not a side experiment
- movie detail performance matters materially to engagement
- social/feed/notification features are intended to remain
- the team wants incremental delivery rather than a rewrite gamble
- Redis is not yet required to begin the first performance sprint

## 14. Decision log

- Decision: do not begin with a rewrite
  - Reason: the biggest issues are architectural flow and payload shape, not total stack failure

- Decision: treat watchlists as the first performance vertical
  - Reason: it is explicitly user-reported, structurally weak, and duplicated

- Decision: keep MongoDB short term while fixing data flow
  - Reason: migration before cleanup would multiply risk

- Decision: evaluate PostgreSQL after Phase 1 and Phase 2
  - Reason: the relational pressure is real, but benchmarked need should drive the move

- Decision: avoid microservices
  - Reason: current problems are local architecture problems, not service-boundary problems

## 15. Blunt conclusion

The project is still salvageable, but it is already expensive to reason about.

If the team keeps adding features without first consolidating watchlists, server-side data composition, and image/runtime performance, delivery speed will keep dropping and every new feature will cost more than it should.
