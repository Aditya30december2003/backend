# Data Model Overview

Status: High-level summary from current Prisma schema

## Current provider

- Prisma with MongoDB

## Core relationally-heavy entities

- `User`
- `Movie`
- `LegacyWatchlist`
- `Watchlist`
- `WatchlistItem`
- `WatchlistMember`
- `WatchlistInvite`
- `WatchlistActivity`
- `Liked`
- `Rating`
- `Review`
- `EntityReaction`
- `Follow`
- `Notification`
- `Video`
- `VideoComment`
- `UploadTicket`

## Relational pressure areas

These domains are the strongest candidates for a relational database long term:

- follows
- collaborative watchlists
- memberships and invites
- ratings and reviews
- notifications
- reactions

## Current modeling concern

The schema is asking MongoDB to support behavior that increasingly looks like a collaborative relational product.

That is possible, but the app then needs:

- tighter index discipline
- more denormalized read models
- fewer request-time cross-collection computations

## Short-term recommendation

- stay on current schema provider while fixing hot-path architecture
- review indexes for watchlist, follow, rating, review, and notification reads

## Medium-term recommendation

- evaluate migration of the social/watchlist relational core to PostgreSQL

## Needs verification

- collection sizes
- hottest query shapes in production
- real write/read ratios for watchlists and feed
