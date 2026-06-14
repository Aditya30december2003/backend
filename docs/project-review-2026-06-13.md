# TheMovieProject Backend Review

Date: 2026-06-13
Status: Historical first-pass review. Prefer `docs/audits/2026-06-performance-architecture-audit.md` for the current canonical audit.

## 1. Why this document exists

This review is meant to help decide what to optimize first, what not to rewrite yet, and what target architecture will best support the product you are building.

The current product appears to be trying to do all of the following inside one Next.js codebase:

- movie discovery
- movie detail and recommendations
- ratings and reviews
- liked movies
- collaborative watchlists
- social feed and blogs
- notifications
- video upload and streaming

That is a valid product vision, but today the implementation is carrying too much complexity in one layer. The main issue is not a single slow query. It is a combination of:

- client-first rendering on important screens
- duplicated APIs and domain logic
- expensive work on request paths
- disabled image optimization on an image-heavy product
- weak caching strategy
- weak engineering guardrails

My recommendation is:

1. Do not start with a full rewrite.
2. Optimize the current stack first around the highest-latency surfaces.
3. Unify the watchlist domain before adding more features there.
4. Only after that, decide whether to keep MongoDB for the social core or migrate that part to PostgreSQL.

## 2. Executive summary

### The short version

The app is slow because the heaviest user-facing pages are mostly client-driven, the watchlist domain is implemented three different ways, and several endpoints do too much work on every request.

The watchlist section is slow for structural reasons:

- `/watchlists` renders a client shell first, then fetches data after hydration.
- it loads a watchlist summary request and then a second full-detail request
- the detail endpoint returns all items, members, and invites
- the UI only paginates after the full payload is already in memory
- a legacy sync job still runs in the main read path

Outside watchlists, the biggest performance drains are:

- direct browser fetches to TMDB and OMDb from the movie detail page
- many interactive movie cards mounting on list pages
- globally disabled Next.js image optimization
- recommendation, discovery, and trending routes doing too much work per request

### Recommended direction

Near term:

- keep Next.js
- keep Prisma `6.19.x` if you stay on MongoDB
- unify the watchlist/list APIs into one domain
- move heavy reads server-side
- paginate watchlist items on the server
- re-enable image optimization
- precompute or cache discovery/trending/recommendation outputs

Medium term:

- if the product focus is collaborative watchlists + social graph + feed + notifications, strongly consider moving that relational core to PostgreSQL
- if you stay on MongoDB, you need more denormalized read models, stricter query/index design, and fewer cross-collection request-time computations

## 3. Repo snapshot

### Observed project shape

- framework: Next.js `14.2.5`
- React: `18`
- auth: `next-auth` `4.24.7`
- ORM: Prisma `6.19.0`
- database: MongoDB via Prisma
- styling: Tailwind
- state/data: React state, some SWR, some Zustand
- media: Firebase uploads, Mux video, Shaka player
- motion/UI extras: GSAP, Framer Motion, Ant Design, React Icons

### Quick repository metrics

- app/api route files: `71`
- page files: `24`
- JS/TS code files under `src`: `187`
- JS/JSX files: `97`
- TS/TSX files: `90`
- files marked `use client`: `69`
- tests found: `0`
- GitHub Actions workflows found: `0`

### Build output highlights

`npm run build` succeeded, but the production bundle already shows expensive pages:

- `/theater/watch`: `331 kB` first load JS
- `/movies/[id]`: `190 kB` first load JS
- `/people/[id]`: `148 kB` first load JS
- `/watchlists`: `115 kB` first load JS

### Lint/build warnings

`npm run lint` and `npm run build` both warn about raw `<img>` usage, including in watchlist UI and theater pages. That matters because the app is poster-heavy and image rendering is part of the product experience.

## 4. Highest priority findings

## 4.1 Watchlist performance is structurally expensive

Files:

- `src/app/(pages)/watchlists/page.tsx`
- `src/app/(pages)/watchlists/[id]/page.tsx`
- `src/app/components/WatchListClient/WatchListClientRevamp.jsx`
- `src/app/api/watchlists/route.ts`
- `src/app/api/watchlists/[id]/route.ts`
- `src/app/hooks/useIncrementalList.ts`

What is happening:

- both watchlist entry pages render a client component only
- the page loads summaries first through `GET /api/watchlists`
- then it loads detail through `GET /api/watchlists/[id]`
- the detail route returns all items for the watchlist, plus members, plus pending invites
- `useIncrementalList` only slices items after the full payload has already been fetched

Why this is slow:

- two client round-trips before the page is truly useful
- no server-side first paint with real data
- full watchlist payload cost grows linearly with watchlist size
- the app does not have true pagination, only presentation slicing

Impact:

- slow first interaction
- poor scalability for large watchlists
- unnecessary memory usage in browser and server

This is the most important watchlist fix.

## 4.2 The watchlist domain exists in three different API families

Files:

- `src/app/api/watchlists/*`
- `src/app/api/watchlist/*`
- `src/app/api/lists/*`
- `src/app/components/Watchlists/AddToWatchlistControlRevamp.tsx`
- `src/app/(pages)/movies/[id]/page.jsx`

Examples:

- watchlist summary/detail mutations use `/api/watchlists`
- movie detail checks watchlist state through `/api/watchlist/status`
- `AddToWatchlistControlRevamp` creates a list through `/api/lists` but toggles membership through `/api/watchlists`

Why this is a major issue:

- duplicate contracts
- duplicate auth and validation logic
- mixed naming: list, watchlist, collection
- different endpoints are using the same underlying Prisma models with slightly different semantics
- every optimization or bug fix costs more because it must be made in multiple places

This is both a performance issue and a design issue.

## 4.3 Legacy sync still runs on the main read path

Files:

- `src/app/libs/watchlists.ts`
- `src/app/api/watchlists/route.ts`
- `docs/watchlists-migration.md`

What is happening:

- `GET /api/watchlists` calls `syncLegacyWatchlistToDefault(me.id)`
- the sync is guarded by an in-memory `Map` with a `15s` TTL

Why this is risky:

- in-memory TTL does not help much in serverless or multi-instance environments
- cold starts reset the sync state
- a read endpoint should not be carrying migration-style repair logic long term

Recommendation:

- move this to a one-time backfill or explicit repair job
- remove legacy sync from the hot read path
- define a cutover plan to delete `LegacyWatchlist` when safe

## 4.4 The movie detail page is a client-side orchestration layer

Files:

- `src/app/(pages)/movies/[id]/page.jsx`
- `src/app/api/watchlist/status/route.jsx`
- `src/app/api/liked/status/route.jsx`
- `src/app/api/movies/recommendations/[movieId]/route.ts`

What it does today:

- fetches TMDB movie details from the browser
- fetches TMDB credits from the browser
- fetches TMDB videos from the browser
- fetches TMDB watch providers from the browser
- fetches TMDB release dates from the browser
- fetches OMDb ratings from the browser
- fetches user rating from internal API
- fetches watchlist status from internal API
- fetches liked status from internal API
- fetches recommendations from internal API

Problems:

- too many network calls
- too much work after hydration
- more failure points
- public API keys are used directly in browser requests
- duplicate movie data orchestration exists elsewhere in the codebase

This page should move toward one server-composed response, or at minimum a much smaller set of server-side cached fetches.

## 4.5 Image performance is intentionally disabled

Files:

- `next.config.mjs`
- theater pages and watchlist components with raw `<img>`

Current state:

- `images.unoptimized = true`
- lint warnings show raw `<img>` usage in important screens

Why this matters here:

- this product is dominated by posters, covers, thumbnails, avatars, and backdrops
- image optimization is one of the most meaningful performance wins available to this app

This should be treated as a platform-level performance bug.

## 4.6 Discovery, trending, and recommendations are doing too much on request

Files:

- `src/app/api/movies/discovery/route.ts`
- `src/app/api/trending_movies_week/route.jsx`
- `src/app/libs/movieRecommendations.ts`
- `src/app/api/movies/cards/route.ts`

Problems:

- discovery fans out to many TMDB calls plus personalized logic in one request
- trending calculates scores from database relations and then enriches top items one by one from TMDB
- recommendations do heavy TMDB fetches and local matrix-factorization-style work on demand
- most of this is ideal for caching, precomputation, or scheduled refresh

Result:

- higher latency
- avoidable upstream dependency sensitivity
- more compute cost

## 4.7 The movie-card layer is over-hydrated

Files:

- `src/app/components/MovieBlock/MovieBlock.jsx`
- `src/app/components/MoviesCoponent/MoviesComponent.jsx`
- `src/app/components/Weekly_Trending_Movies/TrendingMovies.jsx`
- `src/app/components/TopRated/TopRated.jsx`
- `src/app/components/Upcoming/Upcoming.jsx`

Each `MovieBlock` mounts:

- GSAP animation hooks
- liked-state hook
- watchlist control
- image rendering
- multiple hover/tap handlers

On large grids this becomes expensive quickly, especially when pages load dozens of cards at once.

This is a classic case where a product-looking-good decision became a runtime-cost decision.

## 4.8 The codebase is not using App Router strengths consistently

Examples:

- core pages are often client components first
- `useEffect` is doing primary data fetching on important routes
- internal APIs are frequently called from the browser when the data could be assembled on the server
- route handlers are being used as the main orchestration layer even for page-critical data

The result is:

- more JS shipped to browser
- slower first meaningful paint
- weaker caching opportunities
- more hydration work

## 4.9 The schema and query patterns are relational-heavy for MongoDB

Schema evidence:

- follows
- watchlist members
- invites
- watchlist items
- reactions
- notifications
- ratings
- reviews
- blog comments

This is an inference from the repo, not from a benchmark:

The product is leaning heavily into many-to-many relationships, membership/role models, sorted feeds, counts, and cross-entity reads. That can be made to work on MongoDB, but it usually requires more denormalized read models and more discipline than the repo currently has.

If collaborative watchlists and social activity are the long-term core, PostgreSQL is likely the better fit for that domain.

## 4.10 Engineering guardrails are weak

Observed:

- no automated tests
- no CI workflow
- minimal README
- initial governance docs now exist, but they are new and not yet proven in delivery
- HLD and LLD discipline still need to stay tied to real ticket flow
- ADR practice now exists, but it is still early
- performance baseline docs now exist, but measurement is still incomplete
- benchmark scripts are still missing
- mixed JS/TS codebase with `allowJs`
- hardcoded API keys in source

This slows down every future optimization because there is no safe feedback loop.

## 5. Security and configuration concerns

Files:

- `src/app/helpers/Requests.js`
- `src/app/helpers/apiKey.js`
- `src/app/libs/movieRecommendations.ts`
- `src/app/(pages)/movies/[id]/page.jsx`
- `src/app/components/Navbar/Navbar.jsx`
- `src/app/components/InfoComponents/MovieInfo/MovieUtilityPanel.jsx`

Findings:

- TMDB keys are hardcoded in source in multiple places
- there is a fallback TMDB key committed in `movieRecommendations.ts`
- browser-side code uses `NEXT_PUBLIC_API_KEY` and `NEXT_PUBLIC_OMDB_API_KEY`
- the repo mixes server-only and browser-visible API key usage

Recommendation:

- move all third-party API access behind server-side routes or server components
- keep secrets in environment only
- remove hardcoded fallback keys from source

## 6. Package and dependency review

This review is based on repo search, so treat it as a cleanup candidate list rather than a blind delete list.

### Likely unused or near-unused dependencies

Search found no code references for these package names:

- `@faker-js/faker`
- `@mediapipe/camera_utils`
- `@mediapipe/drawing_utils`
- `@mediapipe/face_mesh`
- `@react-three/drei`
- `@react-three/fiber`
- `date-fns`
- `dayjs`
- `jsonwebtoken`
- `mongoose`
- `nanoid`
- `shadcn-ui`
- `three`

### Used, but only in narrow areas

- `antd`: star rating only
- `firebase`: upload flows
- `framer-motion`: people page
- `react-quill` and `quill`: write page
- `shaka-player`: theater watch page
- `swr`: only a couple of components
- `zustand`: one store file

### What this means

- install size and dependency surface are larger than necessary
- bundle risk is higher than necessary
- cognitive load for contributors is higher than necessary

I would not remove anything blindly, but a dependency cleanup sprint is justified.

## 7. Principles review

## 7.1 Principles used well

- Prisma client singleton reuse in `src/lib/prisma.ts`
- some batching effort for liked status in `src/lib/liked-status-client.ts`
- watchlist client caching exists
- auth code has better-than-average sanitization and login throttling
- some endpoints already use `zod`

## 7.2 Principles used inconsistently

### SRP

Not strong enough.

Many page components orchestrate networking, state, domain logic, and rendering in one place.

### DRY

Not strong enough.

The list/watchlist domain is duplicated across three API families and multiple route shapes.

### Separation of concerns

Weak at the page orchestration layer.

Data assembly, client interaction, and transport concerns are too mixed together.

### Server-first rendering

Underused.

The app is using App Router but many important screens still behave like a client-side SPA.

### YAGNI / dependency discipline

Weak.

There are too many dependencies for the amount of focused product surface actually being used.

### Observability

Early-stage only.

There is some route timing support, but no full performance baseline, no CI regression checks, and no dashboarding story.

### Testability

Weak.

No test suite means performance work and refactors are riskier than they need to be.

## 8. Recommended technical direction

## 8.1 What I would keep

- Next.js as the frontend and product shell
- Prisma as the ORM
- App Router
- Tailwind
- NextAuth for now

## 8.2 What I would not do immediately

- do not do a full rewrite
- do not split into microservices yet
- do not upgrade Prisma while staying on MongoDB just for the sake of upgrading
- do not migrate auth during the first performance sprint

## 8.3 Short-term target stack

- Next.js app router
- Prisma `6.19.x`
- MongoDB
- stricter server-side data composition
- proper caching
- one unified watchlist domain
- background jobs or scheduled refresh for expensive recommendation/trending data

## 8.4 Medium-term target stack if social/watchlists remain core

Recommended target:

- Next.js frontend/BFF
- PostgreSQL for users, follows, watchlists, memberships, reactions, notifications, ratings, reviews
- Prisma on PostgreSQL
- Redis/KV for caching, rate limits, and ephemeral feed fragments
- background job runner for recommendation refresh, trending refresh, migration/repair tasks
- object/media storage kept separate

Why:

- the product domain is highly relational
- sorted feeds and collaborative list membership are more natural in SQL
- future analytics and ranking queries become easier to reason about

## 8.5 Should you move to PostgreSQL now?

My answer:

- not before fixing the biggest architectural mistakes in the current app
- yes, if collaborative watchlists + social feed are confirmed as the main business direction
- no, if this remains mostly a personal movie discovery app with light social features

## 9. Specific recommendations by area

## 9.1 Watchlists

### Immediate

- remove full-detail fetch from the landing page initial flow
- paginate watchlist items on the server
- return summary data separately from detail data
- stop running legacy sync inside `GET /api/watchlists`
- unify on `/api/watchlists`

### Next

- delete or deprecate `/api/watchlist/*` and `/api/lists/*`
- introduce one watchlist service layer used by every route
- add dedicated read models if needed

## 9.2 Movie detail

- replace client-side fan-out with one server-composed data path
- cache TMDB/OMDb responses server-side
- keep only interactive islands as client components

## 9.3 Discovery / trending / recommendations

- precompute trending periodically
- cache recommendation output per seed movie
- cache discovery sections by query and context
- avoid repeated external enrichment on each request

## 9.4 Frontend rendering

- move more pages to server components
- hydrate only controls, not whole screens
- replace per-card GSAP on large grids with CSS transitions or lighter interaction

## 9.5 Images

- re-enable Next image optimization
- replace raw `<img>` on critical surfaces
- audit poster and avatar sizes

## 9.6 Dependencies

- remove packages with zero usage after verification
- isolate heavy feature-only dependencies behind dynamic imports

## 10. Suggested phased roadmap

## Phase 0: Baseline and safety

Goal: know what is slow before changing architecture.

- add endpoint timing logs for watchlists, discovery, trending, movie detail
- measure response sizes for watchlist detail and movie detail
- add one smoke test path for auth + watchlist + movie detail
- add CI for lint and build

## Phase 1: Watchlist vertical slice

Goal: fix the user-reported pain first.

- unify watchlist API surface
- remove legacy sync from read path
- server-render watchlist summary page
- paginate items server-side
- load only first page of watchlist items
- add dedicated endpoint for item pagination
- update UI to infinite-scroll by page, not by local slicing

Expected result:

- biggest visible win for the reported slow area

## Phase 2: Movie detail and movie grids

- move movie detail aggregation server-side
- cache external movie metadata
- re-enable image optimization
- trim `MovieBlock` interactivity cost
- stop mounting heavy client behavior on every poster card by default

## Phase 3: Expensive read models

- precompute trending
- cache recommendation results
- create materialized or denormalized read models where needed

## Phase 4: Architecture decision

- decide keep-Mongo-with-read-models vs move-social-core-to-Postgres
- record decision as an ADR

## 11. Ticket-ready backlog candidates

1. Unify all watchlist creation/read/mutation endpoints under `/api/watchlists`
2. Remove `LegacyWatchlist` sync from `GET /api/watchlists`
3. Add server-side pagination to `GET /api/watchlists/[id]`
4. Convert `/watchlists` page to server-first data loading
5. Replace `/api/watchlist/status` with unified watchlist membership lookup
6. Consolidate movie detail into one server-composed loader
7. Re-enable `next/image` optimization and remove `images.unoptimized = true`
8. Replace raw `<img>` usage on watchlist, theater, and post cards
9. Precompute weekly trending on a schedule instead of per request
10. Cache recommendation results per TMDB movie
11. Remove unused dependencies after verification
12. Add CI workflow for lint + build
13. Add watchlist API tests
14. Add architecture docs and ADRs
15. Decide whether `/watchlist`, `/watchlists`, and `/lists` all need to exist as user-facing concepts

## 12. Files I recommend adding

Status note:

- several of these files have since been added during documentation QA
- treat this section as historical first-pass guidance, not the current missing-files list

## Must add soon

- `AGENTS.md`
- `CONTRIBUTING.md`
- `.github/workflows/ci.yml`
- `docs/architecture/current-state.md`
- `docs/architecture/target-state.md`
- `docs/performance/baseline.md`
- `docs/performance/watchlist-deep-dive.md`
- `docs/api/watchlists.md`
- `docs/adr/0001-unify-watchlist-domain.md`
- `docs/adr/0002-keep-mongo-or-migrate-social-core.md`

## Nice to add

- `scripts/benchmark-watchlists.mjs`
- `scripts/profile-movie-detail.mjs`
- `tests/watchlists/*.test.ts`
- `tests/movies/*.test.ts`
- `docs/data-model.md`

## 13. HLD recommendation

High-level design I would target:

- Presentation layer
  - server-first page composition
  - small client islands for likes, watchlist toggles, comments, drag/drop
- Domain layer
  - watchlists
  - movies
  - social/feed
  - video
- Data access layer
  - Prisma repositories or service modules by domain
- Read-model/caching layer
  - cached aggregates for trending, recommendations, highlights
- Background jobs
  - repair/migration
  - trending refresh
  - recommendation refresh
  - notification fan-out

## 14. LLD recommendation for watchlists

Suggested watchlist read flow:

1. `GET /watchlists`
   - server component fetches watchlist summaries only
   - response includes counts, preview poster, role, visibility

2. `GET /watchlists/[id]?cursor=...`
   - returns paginated items only
   - summary loaded separately or embedded once

3. write endpoints
   - `POST /api/watchlists`
   - `PATCH /api/watchlists/[id]`
   - `DELETE /api/watchlists/[id]`
   - `POST /api/watchlists/[id]/items`
   - `DELETE /api/watchlists/[id]/items/[movieId]`
   - `PATCH /api/watchlists/[id]/items/reorder`

4. migration
   - one backfill job
   - one cutover flag
   - delete legacy logic from hot paths after cutover

## 15. Recommended decisions

### Decision 1

Optimize before rewrite.

### Decision 2

Treat watchlists as the first performance program.

### Decision 3

Unify the list/watchlist APIs before adding more features there.

### Decision 4

Keep Prisma `6.19.x` if you remain on MongoDB for now.

### Decision 5

Do a deliberate architecture decision on MongoDB vs PostgreSQL after Phase 1 and Phase 2, not before.

## 16. Official references used for recommendations

These are current official references I used to validate the direction:

- Next.js route handlers and caching:
  - https://nextjs.org/docs/app/getting-started/route-handlers
  - https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config

- Next.js server and client components:
  - https://nextjs.org/docs/app/getting-started/server-and-client-components

- Next.js image optimization:
  - https://nextjs.org/docs/app/getting-started/images
  - https://nextjs.org/docs/pages/api-reference/components/image

- Next.js bundle analysis:
  - https://nextjs.org/docs/app/guides/package-bundling
  - https://nextjs.org/blog/next-16-1

- Next.js releases and upgrade path:
  - https://nextjs.org/blog/next-16
  - https://nextjs.org/docs/app/guides/upgrading/version-16

- Prisma query optimization and indexes:
  - https://www.prisma.io/docs/orm/prisma-client/queries/advanced/query-optimization-performance
  - https://www.prisma.io/docs/orm/prisma-schema/data-model/indexes

- Prisma and MongoDB support status:
  - https://www.prisma.io/docs/prisma-orm/quickstart/mongodb
  - https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7

- MongoDB data modeling and indexes:
  - https://www.mongodb.com/docs/manual/data-modeling/
  - https://www.mongodb.com/docs/manual/tutorial/model-embedded-one-to-many-relationships-between-documents/
  - https://www.mongodb.com/docs/manual/tutorial/model-referenced-one-to-many-relationships-between-documents/
  - https://www.mongodb.com/docs/manual/tutorial/sort-results-with-indexes/

## 17. Final call

The current stack can be made much faster without a rewrite.

But the repo needs one strategic simplification first:

pick one watchlist domain model, one API surface, one data flow, and one migration path.

If you do only that, plus server-side pagination and image optimization, the product will already feel materially faster.

If the product direction stays deeply collaborative and social, I would then seriously evaluate moving the social/watchlist core to PostgreSQL.
