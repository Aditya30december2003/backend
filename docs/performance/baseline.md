# Performance Baseline

Date captured: 2026-06-14
Status: Verified repo and build snapshot only. Runtime timing and payload measurement are still incomplete.

## Verified checks

Verified on 2026-06-14:

- `npm run lint`: passes with existing image and accessibility warnings
- `npm run build`: passes with placeholder environment variables

## Verified repo snapshot

From reproducible repo-count commands:

- app API route files under `src/app/api`: `71`
- page files under `src/app`: `24`
- JS/TS source files under `src`: `187`
- JS/JSX source files under `src`: `97`
- TS/TSX source files under `src`: `90`
- files containing `use client` under `src`: `69`

## Verified build snapshot

From `npm run build` on 2026-06-14:

- `/theater/watch`: `331 kB` first load JS
- `/movies/[id]`: `190 kB` first load JS
- `/people/[id]`: `148 kB` first load JS
- `/signup`: `143 kB` first load JS
- `/watchlists`: `115 kB` first load JS
- `/watchlists/[id]`: `115 kB` first load JS
- first-load shared JS: `88.3 kB`
- middleware bundle: `48.7 kB`

## Verified source-backed signals

- watchlist entry pages currently render a client shell only:
  - `src/app/(pages)/watchlists/page.tsx`
  - `src/app/(pages)/watchlists/[id]/page.tsx`
- watchlist incremental loading is client-side slicing of an already-fetched array in `src/app/hooks/useIncrementalList.ts`
- image optimization is disabled in `next.config.mjs` through `images.unoptimized = true`
- the movie detail page performs browser-side fan-out to TMDB, OMDb, and internal APIs in `src/app/(pages)/movies/[id]/page.jsx`

## Verified build caveats

- `npm run build` succeeds even when MongoDB is unavailable locally
- during static generation, the build logs Prisma `P2010` connection failures for:
  - `src/app/api/trending_blogs/route.*`
  - `src/app/api/trending_reviews/route.*`
  - `src/app/api/trending_movies_week/route.*`
- this is a verified build-time behavior, not yet a measured production impact

## Verified warning snapshot

Current lint/build warnings observed on 2026-06-14:

- raw `<img>` warnings in theater pages
- raw `<img>` warnings in `src/app/components/PostCard.jsx`
- raw `<img>` warning in `src/app/components/WatchListClient/WatchListClientRevamp.jsx`
- missing `alt` warning in `src/app/(pages)/theater/watch/page.tsx`

## Verified local timing instrumentation

Instrumented in `T0003` behind `DEBUG_API_TIMING=1`:

- `GET /api/watchlists`
- `GET /api/watchlists/[id]`
- `GET /api/movies/discovery`
- `GET /api/movies/recommendations/[movieId]`
- `GET /api/trending_movies_week`

Verified locally on 2026-06-14:

- with `DEBUG_API_TIMING=1`, custom timing lines were emitted for `/api/watchlists` and `/api/trending_movies_week`
- with `DEBUG_API_TIMING` unset, the same requests produced only normal Next.js request logs and no custom timing lines

## Needs measurement

- watchlist summary endpoint latency
- watchlist detail endpoint latency
- watchlist detail payload size
- movie detail load waterfall timing
- discovery, trending, and recommendation route latency
- cache hit rate
- cold-start behavior in deployment
- slow Prisma query distribution
- image payload sizes on poster-heavy pages
- remaining instrumented routes under realistic auth and data conditions

## Next measurement tickets

1. `T0003` adds env-gated route timing logs for hot endpoints.
2. `T0004` adds repeatable local benchmark scripts for watchlists and movie detail.
3. `T0005` documents the current watchlist read path and ownership boundaries before refactor tickets are written.

## Reproduction commands

```powershell
npm run lint
npm run build
(set DEBUG_API_TIMING=1) and hit the instrumented routes locally
(Get-ChildItem src\app\api -Recurse -File | Measure-Object).Count
(Get-ChildItem src\app -Recurse -Include page.tsx,page.ts,page.jsx,page.js -File | Measure-Object).Count
(Get-ChildItem src -Recurse -Include *.js,*.jsx,*.ts,*.tsx -File | Measure-Object).Count
(Get-ChildItem src -Recurse -Include *.js,*.jsx -File | Measure-Object).Count
(Get-ChildItem src -Recurse -Include *.ts,*.tsx -File | Measure-Object).Count
rg -l "use client" src | Measure-Object | Select-Object -ExpandProperty Count
```

## Current assessment

The repo already shows clear structural performance risk, but the baseline is now limited to facts the repository and local build output can reproduce. Route timings, payload sizes, and deployment behavior still need dedicated measurement work.
