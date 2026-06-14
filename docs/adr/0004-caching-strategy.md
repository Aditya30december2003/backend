# ADR 0004: Caching Strategy

Status: Proposed
Date: 2026-06-13

## Context

The repo has several expensive read paths and external metadata dependencies, but no verified dedicated cache layer yet.

## Decision

Introduce caching incrementally, not everywhere at once.

### Short-term priorities

- TMDB response caching
- OMDb response caching
- trending result caching
- recommendation result caching

### Deferred or cautious areas

- private watchlist detail caching
- user-scoped feed caching
- any cache path where invalidation rules are unclear

## Rules

- do not cache private payloads without clear user scoping
- prefer TTL plus explicit invalidation where possible
- document cache keys and invalidation strategy per use case

## Consequences

### Positive

- reduces repeated expensive request-time work
- lowers third-party dependency sensitivity

### Negative

- introduces staleness and invalidation complexity
- can create private-data leaks if scoped badly

## Follow-up actions

- decide whether Redis is needed immediately or after Phase 2
- document TTL strategy in performance and architecture docs
