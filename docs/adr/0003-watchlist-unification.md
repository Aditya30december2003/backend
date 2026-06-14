# ADR 0003: Watchlist Unification

Status: Proposed
Date: 2026-06-13

## Context

The repo currently represents one concept through multiple API families:

- `/api/watchlists`
- `/api/watchlist/*`
- `/api/lists/*`

This creates:

- duplicate contracts
- duplicate validation and auth logic
- slower refactors
- higher bug risk

## Decision

Use `/api/watchlists` as the canonical watchlist API family.

## Consequences

### Positive

- one domain owner
- one mutation/read direction
- easier pagination and permission cleanup

### Negative

- temporary migration complexity
- compatibility work while legacy routes are still live

## Follow-up actions

- document canonical contracts in `docs/api/watchlists.md`
- mark legacy routes for deprecation
- move watchlist logic into a unified service boundary
