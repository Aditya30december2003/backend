# ADR 0001: Performance and Architecture Direction

Status: Proposed
Date: 2026-06-13

## Context

The app is slow and structurally messy, especially around watchlists, movie detail, and image-heavy grids.

We need to decide whether to:

- optimize the current stack
- migrate the relational core
- rewrite
- split into services

## Option A: Keep Next.js + MongoDB + Prisma, optimize current architecture

### Pros

- lowest immediate disruption
- fastest path to user-visible wins
- lets us fix data flow before changing persistence
- preserves current shipping velocity better than a rewrite

### Cons

- MongoDB remains an awkward fit for growing relational/social features
- duplicated and legacy logic still needs cleanup first
- some future reporting and ranking work remains harder than in SQL

### Cost

- medium

### Risk

- medium

### When it makes sense

- when the team needs fast performance wins without pausing feature delivery
- when architecture mistakes, not raw infrastructure limits, are the main current issue

### When it is a trap

- if the team treats “optimize current stack” as permission to avoid the relational database question forever

## Option B: Next.js + PostgreSQL + Prisma + Redis, migrate relational/social/watchlist core

### Pros

- better long-term fit for watchlists, memberships, invites, follows, ratings, reviews, and notifications
- clearer query semantics for relational reads and ranking
- Redis adds safe opportunities for response caching, rate limiting, and ephemeral coordination

### Cons

- migration planning is non-trivial
- dual-write and cutover risks are real
- doing this before fixing API/data-flow duplication would stack complexity on complexity

### Cost

- high

### Risk

- medium to high

### When it makes sense

- when collaborative watchlists + social graph + feed + notifications are confirmed as core product bets
- after watchlist and movie-detail architecture is cleaned up enough to measure true bottlenecks

### When it is a trap

- when used as an emotional escape from fixing current design problems
- when attempted before clear migration boundaries and rollback rules exist

## Option C: Full rewrite

### Pros

- clean slate
- easier to impose new boundaries in theory

### Cons

- highest delivery risk
- likely to recreate many current mistakes under deadline pressure
- blocks user-visible improvement too long
- destroys momentum if requirements are still evolving

### Cost

- very high

### Risk

- very high

### When it makes sense

- only if measured evidence shows the current codebase cannot be incrementally stabilized

### When it is a trap

- almost always at this stage

## Option D: Microservices

### Pros

- isolates domains eventually
- can help at much larger scale with mature boundaries

### Cons

- operational overhead
- distributed consistency complexity
- much worse debugging and delivery burden for the current team/repo state
- does not solve client-heavy rendering or duplicate-domain design by itself

### Cost

- very high

### Risk

- very high

### When it makes sense

- only after a stable monolith exists and real service boundaries are proven

### When it is a trap

- right now

## Decision

### Recommended direction

Short term:

- keep Next.js + Prisma + MongoDB
- fix architecture and data flow first
- unify watchlist APIs
- move page-critical data server-side
- add real pagination
- re-enable image optimization
- cache or precompute expensive read paths

Medium term:

- strongly consider PostgreSQL + Redis for the relational/social core if collaborative watchlists, feed, follows, ratings, reviews, and notifications remain strategic

Avoid:

- full rewrite before metrics justify it
- microservices

## Consequences

### Positive

- fastest path to visible improvements
- lower rewrite risk
- cleaner basis for later persistence decisions

### Negative

- requires discipline to avoid “temporary” legacy patterns lingering
- does not remove the need for a future database decision

## Final recommendation

Choose Option A now, design toward Option B later, and explicitly reject Options C and D for the current phase.
