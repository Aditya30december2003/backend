# Target State Architecture

Status: Recommended target

## Principles

- server-first by default
- thin route handlers
- domain services for non-trivial logic
- repository/data-access helpers for persistence concerns
- minimal client hydration
- explicit caching strategy
- documented architectural decisions

## Target application shape

```text
Browser
  -> Server Components for page-critical data
  -> Client islands for local interaction only

Next.js app layer
  -> page loaders / server components
  -> route handlers for mutations and paginated reads
  -> validation boundary
  -> auth/permission helpers

Domain services
  -> watchlists
  -> movies
  -> feed/social
  -> notifications
  -> video

Data access
  -> Prisma
  -> current MongoDB short term
  -> PostgreSQL candidate later for relational core

Cache / jobs
  -> Redis/KV candidate
  -> scheduled refresh jobs
  -> migration/repair jobs
```

## Desired watchlist shape

- one canonical watchlist API family
- one permission model
- paginated reads
- no legacy migration logic in hot read paths

## Desired movie-detail shape

- one server-composed loader
- external metadata fetched server-side
- cached external responses
- interactive controls isolated as small client components

## Desired ops shape

- CI for lint/build
- manual verification guide as the immediate safety net
- smoke tests as follow-up work after Sprint 1
- performance baseline docs
- ticket-driven architecture changes with ADR updates
