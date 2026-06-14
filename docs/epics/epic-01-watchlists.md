# EPIC 01: Watchlist Modernization

## Domain

- Watchlists

## Problem

Watchlists are both a product pain point and an architecture mess.

Current issues:

- duplicated API families
- client-first loading
- full-detail payloads
- local slicing instead of real pagination
- legacy sync in hot read path

## Goal

Make watchlists materially faster and much easier to maintain.

## Non-goals

- no full DB migration
- no watchlist UI redesign unrelated to performance
- no new watchlist feature expansion during the core cleanup

## Required reviews before implementation

- architecture review
- performance review
- security review
- dependency review

## Planned sequence

1. audit and lock canonical watchlist API direction
2. remove legacy sync from hot reads
3. add real server pagination
4. move watchlist pages to server-first loading
5. centralize service and permission logic

## Ticket map

- `E1-T01`
- `E1-T02`
- `E1-T03`
- `E1-T04`
- `E1-T05`
- `E1-T06`
- `E1-T07`
- `E1-T08`
- `E1-T09`

## Exit criteria

- one canonical watchlist API family
- no legacy sync in hot read path
- real paginated watchlist items
- server-first watchlist summary and first-page rendering
