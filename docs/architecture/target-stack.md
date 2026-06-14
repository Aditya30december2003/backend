# Target Stack Recommendation

Status: Recommended direction

## Frontend

- Next.js App Router
- Server Components by default
- Client components only for interactive islands
- Tailwind CSS
- `next/image`
- dynamic imports for heavy feature-only components

## Backend / BFF

- Next.js route handlers for mutations and paginated reads
- server-side page loaders for page-critical data
- domain service layer
- repository/data-access layer
- centralized validation
- centralized auth and permission helpers

## Database

### Short term

- MongoDB + Prisma

Reason:

- lowest-disruption path while fixing architecture and data flow

### Medium-term candidate

- PostgreSQL + Prisma

Reason:

- watchlists, members, invites, follows, ratings, reviews, and notifications are more naturally relational
- query semantics and integrity constraints fit the product better

## Caching

Recommended medium-term layer:

- Redis or equivalent KV/cache

Primary use cases:

- TMDB/OMDb response cache
- trending result cache
- recommendation result cache
- safe watchlist summary cache where permissions are clear
- rate limiting
- short-lived migration/repair locks if needed

## Background jobs

Recommended responsibilities:

- scheduled trending refresh
- recommendation precomputation
- legacy migration/backfill
- notification fanout
- video-processing-related asynchronous coordination if needed

## Media

- keep large media out of the database
- store metadata only in the DB
- keep object storage / Firebase / Mux responsibilities separate

## Observability

- route timing logs
- response-size logging for large payloads
- Web Vitals tracking
- slow-query logging
- benchmark scripts for watchlists and movie detail

## Testing

- API tests
- manual verification first
- smoke tests after the baseline and CI work are stable
- performance regression checks

## Decision

- optimize current architecture first
- add caching incrementally
- evaluate PostgreSQL migration after architecture cleanup and measurement
