# Movies API

Status: Current state plus recommended direction

## Current API areas

Observed movie-related endpoints include:

- `/api/movies/discovery`
- `/api/movies/cards`
- `/api/movies/recommendations/:movieId`
- `/api/movies/:movieId/similar`
- page-level browser requests directly to TMDB in some screens

## Current issues

- movie detail orchestration is split between browser and internal APIs
- discovery and recommendation paths are expensive
- some external metadata fetches happen repeatedly

## Recommended direction

## Movie detail

Introduce one server-composed movie-detail loader path.

Responsibilities:

- fetch core TMDB metadata server-side
- fetch credits/providers/release info server-side
- fetch OMDb enrichment server-side if still needed
- fetch user-specific state through internal server-side orchestration
- return page-ready data

## Discovery

Keep discovery server-side and cacheable.

Recommended improvements:

- cache by query/context
- reduce request-time enrichment
- separate personalized data from broadly cacheable data when possible

## Recommendations

Recommended improvements:

- cache by TMDB movie id
- move expensive repeated work out of request path where possible
- precompute selectively for hot titles if needed

## Cards

Movie card enrichment should:

- be server-side
- be cached
- avoid per-card browser fan-out

## Needs verification

- final shape of the canonical movie detail loader
- whether OMDb remains necessary for product value
