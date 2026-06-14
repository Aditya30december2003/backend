# Performance Baseline

Date captured: 2026-06-13
Status: Incomplete baseline, initial verified snapshot only

## Verified checks

- `npm run lint`: passes with image warnings
- `npm run build`: passes

## Verified build snapshot

From production build output:

- `/theater/watch`: `331 kB` first load JS
- `/movies/[id]`: `190 kB` first load JS
- `/people/[id]`: `148 kB` first load JS
- `/watchlists`: `115 kB` first load JS

## Verified code-level signals

- many `use client` files
- watchlist pages are client-first
- movie detail uses many browser requests
- image optimization is disabled
- watchlist detail is not truly paginated

## Needs measurement

- watchlist summary endpoint latency
- watchlist detail endpoint latency
- watchlist detail payload size
- movie detail load waterfall timing
- discovery/trending/recommendation route latency
- cache hit rate
- cold-start behavior in deployment
- slow Prisma query distribution

## Recommended baseline tasks

1. lock the baseline to verified facts only before adding more claims
2. capture route timings for watchlists, movie detail, discovery, trending, and recommendations
3. add benchmark scripts for watchlists and movie detail
4. document the current watchlist read path before implementation tickets are written
5. treat dedicated response-size logging and Web Vitals capture as follow-up work if Sprint 1 measurement still proves insufficient

## Current assessment

Performance issues are real and already visible from architecture and build signals, but detailed numeric benchmarking still needs to be added.
