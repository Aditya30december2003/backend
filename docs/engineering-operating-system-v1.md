# TheMovieProject Engineering Operating System v1

## Purpose

This is the governance layer for improving a large, already-live codebase without letting architecture drift get worse.

## Components

1. `AGENTS.md`
2. domain map
3. ADR system
4. architecture principles
5. performance baseline
6. epic backlog
7. ticket backlog
8. repo current state
9. manual verification guide
10. definition of done

## Delivery workflow

```text
Audit
  -> ADR / architecture decision
  -> Epic
  -> Ticket
  -> Implementation
  -> Verification
  -> Repo memory update
```

## Rules

- no implementation before domain ownership is clear
- no new API family without justification
- no epic should begin without architecture, performance, security, and dependency review
- one ticket at a time
- update repo memory after every merged ticket

## Current implementation priority

1. platform governance and baseline
2. watchlist modernization
3. movie detail hardening
4. image and grid optimization
5. caching and heavy read-path cleanup
6. persistence decision
