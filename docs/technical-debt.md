# Technical Debt Register

## P0

- duplicated watchlist/list API families
- watchlist client-first loading and full-detail payloads
- legacy sync in watchlist read path
- disabled image optimization
- hardcoded TMDB keys in source
- browser-side third-party movie API fan-out
- no tests
- no CI

## P1

- over-hydrated movie-card interactions
- request-time heavy discovery/trending/recommendation logic
- mixed JS/TS backend logic
- inconsistent naming: list/watchlist/collection
- scattered env usage and validation

## P2

- possible unused dependencies
- narrow-use heavy dependencies not isolated enough
- limited observability and benchmark tooling
- incomplete architecture docs

## Notes

- do not try to pay all debt at once
- pay debt by domain and by user pain
- watchlists should be the first debt-removal vertical
