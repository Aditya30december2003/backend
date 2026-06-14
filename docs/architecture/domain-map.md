# Domain Map

## Ownership rule

Every implementation ticket must belong to exactly one domain.

If a change touches multiple domains, one domain must still be declared primary and the cross-domain impact must be documented explicitly.

## Core product domains

### Auth and identity

Responsibilities:

- sign-in
- session shaping
- email verification
- password reset

Key areas:

- `src/app/libs/auth_options.ts`
- `src/app/api/auth/*`
- `src/middleware.ts`

### Movies

Responsibilities:

- movie discovery
- movie detail
- movie metadata enrichment
- recommendations
- trending

Key areas:

- `src/app/api/movies/*`
- `src/app/(pages)/movies/*`
- `src/app/libs/movieRecommendations.ts`

Canonical ownership:

- movie details
- recommendations
- discovery
- trending

### Watchlists

Responsibilities:

- personal watchlists
- collaborative watchlists
- memberships
- invites
- reorder/add/remove
- default watchlist semantics

Current issue:

- split across multiple route families

Key areas:

- `src/app/api/watchlists/*`
- `src/app/api/watchlist/*`
- `src/app/api/lists/*`
- `src/app/libs/watchlists.ts`

Canonical ownership:

- watchlists
- watchlist items
- memberships
- invites

### Social and feed

Responsibilities:

- follows
- reviews
- ratings
- blogs
- reactions
- feed ranking
- comments
- notifications-aware social events

Key areas:

- `src/app/api/feed/*`
- `src/app/api/follow/*`
- `src/app/api/reaction/*`
- review/blog routes and components

Canonical ownership:

- follows
- reactions
- comments
- feed

### Notifications

Responsibilities:

- notification storage
- mark-read
- stream transport
- fanout triggers

Key areas:

- `src/app/api/notifications/*`
- `src/app/libs/notifications.ts`

Canonical ownership:

- notifications

### Video

Responsibilities:

- upload initiation
- media metadata persistence
- Mux webhook handling
- playback pages
- playback permissions

Key areas:

- `src/app/api/videos/*`
- `src/app/api/mux/webhook/route.ts`
- `src/app/components/VideoPlayer/ShakaPlayer.tsx`

Canonical ownership:

- uploads
- playback
- metadata

## Shared infrastructure domains

### Persistence

- Prisma client
- MongoDB schema via `prisma/schema.prisma`

### Third-party integrations

- TMDB
- OMDb
- Firebase
- Mux
- Resend

### Cross-cutting concerns

- validation
- auth helpers
- performance logging
- caching strategy

## Target ownership direction

- watchlists: one canonical service boundary
- movies: one canonical detail/discovery orchestration boundary
- feed: clearer ranking and read-model boundary
- video: separate upload metadata, playback, and webhook concerns
- notifications: keep as its own domain even when triggered from social actions
