# Manual Verification Guide

Status: Canonical manual verification guide
Last updated: 2026-06-13

## Purpose

This repo is in a performance-hardening phase. Verification must be explicit, small-scope, and tied to the ticket being changed.

## Minimum verification for every ticket

- run `npm run lint` when code or config changes
- run `npm run build` when code or config changes
- verify the changed user flow manually
- update the relevant docs
- mark any unproven claim as `Needs verification`

## For documentation-only tickets

- confirm links resolve
- confirm instructions match the current repo reality
- confirm ticket scope does not quietly include future work

## For API changes

- verify happy path
- verify unauthorized path
- verify invalid-input path
- verify payload shape
- verify pagination behavior if applicable

## For performance changes

- compare before vs after behavior using the current benchmark or timing method
- check whether request count changed
- check whether payload size changed
- check whether route bundle impact changed if relevant

## For caching changes

- verify cache hit path
- verify cache miss path
- verify invalidation or TTL behavior
- verify no private data is shared across users

## For watchlist changes

- verify owner access
- verify editor access
- verify viewer access
- verify empty watchlist
- verify large watchlist paging behavior

## For movie-detail changes

- verify logged-out load
- verify logged-in load
- verify external metadata fallback behavior
- verify watchlist and liked interactions still work

## When to mark `Needs verification`

Use `Needs verification` when:

- production-only behavior cannot be confirmed locally
- data volume realism is missing
- benchmark instrumentation does not yet exist
- deployment environment behavior is unknown
- GitHub-hosted automation has not yet run for a locally authored workflow

## What not to claim

- do not claim P95 gains without measurements
- do not claim bundle improvements without evidence
- do not claim scalability fixes just because code looks cleaner
- do not claim CI works until it has executed in GitHub at least once
