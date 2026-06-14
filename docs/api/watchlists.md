# Watchlists API

Status: Current state plus recommended canonical direction

## Current reality

Watchlist-related behavior currently exists under three families:

- `/api/watchlists`
- `/api/watchlist/*`
- `/api/lists/*`

This should be consolidated.

## Recommended canonical API family

Use `/api/watchlists` as the single long-term canonical family.

## Recommended read endpoints

### `GET /api/watchlists`

Purpose:

- return watchlist summaries only

Response should include:

- `id`
- `name`
- `slug`
- `visibility`
- `itemCount`
- `previewPosterUrl`
- `myRole`
- `isSystemDefault`

### `GET /api/watchlists/:id`

Purpose:

- return summary plus first page of items or explicit paginated structure

Recommended shape:

- `watchlist`
- `items`
- `nextCursor`

Do not return all items for large lists.

### `GET /api/watchlists/:id/items`

Purpose:

- paginated item fetch

Recommended query params:

- `cursor`
- `limit`

## Recommended write endpoints

- `POST /api/watchlists`
- `PATCH /api/watchlists/:id`
- `DELETE /api/watchlists/:id`
- `POST /api/watchlists/:id/items`
- `DELETE /api/watchlists/:id/items/:movieId`
- `PATCH /api/watchlists/:id/items/reorder`
- `POST /api/watchlists/:id/invite`
- `POST /api/watchlists/invites/:token/accept`

## Permission rules

Recommended central rules:

- owner: manage settings, members, invites, items
- editor: manage items only
- viewer: read only

## Deprecation direction

Mark these as legacy and phase out:

- `/api/watchlist/status`
- `/api/watchlist/*`
- `/api/lists/*`

## Needs verification

- final response contract for collaborative watchlist views
- whether public shared watchlists need a distinct read contract
