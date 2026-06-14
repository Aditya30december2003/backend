# Current State Architecture

Status: Verified snapshot as of 2026-06-13

## Summary

The repo is a single Next.js App Router application acting as:

- frontend
- backend-for-frontend
- API server
- domain orchestration layer
- third-party integration layer

## Stack

- Next.js `14.2.5`
- React `18`
- NextAuth
- Prisma `6.19`
- MongoDB
- Tailwind
- Firebase
- Mux

## Current request patterns

### Watchlists

- page shell loads in the browser
- browser fetches `/api/watchlists`
- browser fetches `/api/watchlists/[id]`
- detail route returns all items, members, and invites

### Movie detail

- browser fetches TMDB directly for multiple resources
- browser fetches OMDb directly
- browser fetches internal APIs for user-specific state and recommendations

### Discovery / trending / recommendations

- several endpoints do heavy request-time work
- some routes enrich results from TMDB on request

## Domain/API duplication

Watchlist domain is split across:

- `/api/watchlists`
- `/api/watchlist/*`
- `/api/lists/*`

This is the most obvious architecture smell in the repo.

## Rendering split

Observed:

- many `use client` files
- several important pages fetch primary data in `useEffect`
- App Router server-first strengths are underused

## Persistence reality

- MongoDB provider in Prisma schema
- relational pressure is high for social/watchlist features

## Operational reality

- no verified automated tests
- no verified CI workflow
- initial architecture and governance docs now exist, but ownership and upkeep are still new
- some route timing support exists

## Needs verification

- actual production latency distribution
- actual slow query distribution
- actual collection sizes and cardinalities
- real-world watchlist size distribution
