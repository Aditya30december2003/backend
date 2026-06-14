# Movie Detail Deep Dive

Status: Verified architecture review, needs runtime measurement

## Current flow

Current movie detail page performs too much work in the browser.

Observed request shape:

- TMDB movie details
- TMDB credits
- TMDB videos
- TMDB watch providers
- TMDB release dates
- OMDb ratings
- internal user rating API
- internal watchlist status API
- internal liked status API
- internal recommendations API

## Problems

- too many network requests
- too much post-hydration work
- public API key exposure pattern still exists
- more failure points than necessary
- mixed external/internal orchestration in the browser

## Target flow

```text
movie detail page request
  -> server-side loader gathers required data
  -> external metadata fetched server-side with caching
  -> page renders primary detail on first response
  -> small client islands hydrate for likes/watchlist/rating interactions
```

## Immediate fixes

- create one server-composed movie-detail loader
- move TMDB/OMDb fan-out server-side
- cache external metadata responses
- reduce browser request count
- isolate interactive controls as client islands only

## Metrics to collect

- browser request count for one movie detail load
- first contentful data render timing
- total waterfall time
- external metadata cache hit rate
- recommendation route latency

## Non-goals

- changing recommendation ranking logic in the first movie-detail pass unless required for performance
