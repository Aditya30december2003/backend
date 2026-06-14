# ADR 0002: PostgreSQL and Redis Evaluation

Status: Proposed
Date: 2026-06-13

## Decision framing

Do not migrate blindly.

Recommended sequence:

1. fix data flow first
2. add safe caching where it clearly helps
3. benchmark
4. decide on PostgreSQL migration after watchlist and movie-detail optimization

## Current state

- primary database provider: MongoDB via Prisma
- product domains are increasingly relational
- cache layer: no dedicated Redis/KV layer verified
- expensive request-time computation still exists in app routes

## PostgreSQL evaluation

### Why PostgreSQL is a strong candidate

These domains are relational by nature:

- `User`
- `Watchlist`
- `WatchlistItem`
- `WatchlistMember`
- `WatchlistInvite`
- `Rating`
- `Review`
- `Follow`
- `Notification`

These are exactly the areas where SQL modeling, joins, constraints, and transactional clarity become valuable.

### What tables/entities would move first

Recommended relational-core migration candidates:

1. `User`
2. `Follow`
3. `Watchlist`
4. `WatchlistMember`
5. `WatchlistInvite`
6. `WatchlistItem`
7. `Rating`
8. `Review`
9. `Notification`

Potentially later:

- reaction entities
- blog and comment relational pieces

Not an immediate first target:

- large media objects
- external movie metadata cache blobs
- ephemeral upload state if already better handled elsewhere

### Migration complexity

- medium to high
- highest complexity lies in preserving IDs, auth references, and live writes during cutover

### Dual-write risks

- write divergence between MongoDB and PostgreSQL
- difficult rollback if both systems drift
- hidden bugs if reads come from one store and writes from another

### Data consistency risks

- partial migration of watchlists can break memberships and permissions
- cross-domain references can drift if ID mapping is not deterministic
- delayed backfills can corrupt user-visible counts

### Prisma migration strategy

Recommended staged strategy:

1. freeze target schema in an ADR and migration design doc
2. create PostgreSQL schema in a separate environment
3. backfill core relational data from MongoDB
4. verify parity with scripted checks
5. switch selected reads to PostgreSQL behind a feature flag
6. only introduce dual-write if strictly necessary and narrowly scoped
7. cut writes over after parity is proven
8. keep rollback path until sustained stability is confirmed

### Rollback strategy

- do not remove MongoDB write path until post-cutover verification is stable
- retain backfill reconciliation script
- use feature flags to revert reads to MongoDB if parity issues appear
- avoid destructive source cleanup until rollback window closes

## Redis evaluation

### Immediate use cases

- TMDB response cache
- OMDb response cache
- trending result cache
- recommendation result cache
- rate limiting
- short-lived coordination locks for migration/repair jobs if needed

### Medium-term use cases

- watchlist summary cache where permissions and invalidation are safe
- feed fragment cache for public or broadly shared data
- ephemeral notification fanout helpers

### What not to cache

- private watchlist detail blobs without strict user scoping
- sensitive user-specific state unless cache keys are permission-safe
- data with unclear invalidation rules

### TTL recommendations

Starting guidance only. Needs measurement.

- TMDB/OMDb metadata: `6h` to `24h`
- trending results: `15m` to `1h`
- recommendations by movie id: `1h` to `24h`
- rate-limit keys: aligned to security windows
- ephemeral locks: minutes, not hours

### Cache invalidation strategy

- event-driven invalidation for internal mutable domains when possible
- TTL plus explicit busting for external metadata
- never reuse private cache keys across users
- document invalidation rules per cache type

### How to avoid stale private-data leaks

- never key private responses only by entity id
- include user scope where needed
- avoid caching permission-bearing payloads unless invalidation is explicit and tested

## Recommendation

### PostgreSQL

- promising medium-term direction
- do not start migration before watchlist and movie-detail cleanup

### Redis

- useful earlier than PostgreSQL if introduced narrowly
- start with external metadata and expensive aggregate caches, not private watchlist detail caching

## Final call

- PostgreSQL: likely valuable, not yet urgent
- Redis: likely useful soon, but only for well-scoped caches
- immediate priority remains architecture cleanup and measurement, not platform churn
