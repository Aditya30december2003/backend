# EPIC 00: Platform Governance and Baseline

## Domain

- Platform / cross-cutting

## Problem

The repo still needs stronger execution discipline:

- no CI
- no tests
- manual verification is now documented but not yet battle-tested
- repo memory now exists but still needs to be kept current through real ticket flow
- weak performance measurement

## Goal

Create the minimum operating system needed for safe performance work.

## Non-goals

- no feature redesign
- no database migration
- no broad refactor

## Required reviews before implementation

- architecture review
- performance review
- security review
- dependency review

## Planned tickets

- `T0001` Add GitHub CI for lint and production build
- `T0002` Finalize performance baseline and measurement gap register
- `T0003` Add route timing logs for hot endpoints
- `T0004` Add benchmark scripts for watchlists and movie detail
- `T0005` Investigate watchlist read path and document findings only

## Exit criteria

- CI exists
- baseline doc is locked to verified facts and explicit gaps
- hot-path measurement scaffolding exists
- watchlist investigation findings are documented without shipping refactors
- repo memory update process is in use
