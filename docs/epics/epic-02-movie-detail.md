# EPIC 02: Movie Detail Hardening

## Domain

- Movies

## Problem

Movie detail is currently too browser-driven and makes too many requests.

## Goal

Move primary detail composition server-side, reduce browser waterfall, and make external metadata caching explicit.

## Non-goals

- no recommendation-model rewrite unless needed for performance
- no unrelated movie-grid redesign in this epic

## Required reviews before implementation

- architecture review
- performance review
- security review
- dependency review

## Planned sequence

1. document current request waterfall
2. introduce server-composed detail loader
3. add server-side metadata caching
4. remove browser-side primary-data fan-out
5. isolate interactive islands

## Ticket map

- `E2-T01`
- `E2-T02`
- `E2-T03`
- `E2-T04`
- `E2-T05`
- `E2-T06`

## Exit criteria

- primary movie detail is server-composed
- browser request count is reduced
- external metadata caching is explicit and documented
