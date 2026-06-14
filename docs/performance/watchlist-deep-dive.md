# Watchlist Deep Dive

Status: Verified architecture review, latency still needs measurement

## Why this area is P0

- user-reported as slow
- structurally duplicated
- payload design is weak
- migration logic still touches hot reads

## Current flow

```text
/watchlists page
  -> client component renders
  -> fetch /api/watchlists
  -> determine current/default list
  -> fetch /api/watchlists/[id]
  -> receive full detail payload
  -> slice items locally for incremental rendering
```

## Current problems

- client-first page load
- two fetches before useful state
- full detail payload returns all items
- local slicing is not real pagination
- legacy sync still runs from watchlist summary path
- domain duplicated across three API families

## Target flow

```text
/watchlists
  -> server-render summaries only
  -> initial page includes counts, preview poster, role, visibility

/watchlists/[id]
  -> server-render summary + first page of items
  -> client only requests next item pages as needed

mutations
  -> one canonical /api/watchlists family
```

## Immediate fixes

- unify to one watchlist API family
- remove legacy sync from hot read path
- add server-side item pagination
- return first page only
- move page-critical data to server rendering

## Metrics to collect

- summary endpoint latency
- detail endpoint latency
- detail payload size
- first useful render timing
- time to add/remove item
- time to reorder items

## Non-goals

- full database migration during the first watchlist sprint
- UI redesign unrelated to data loading
