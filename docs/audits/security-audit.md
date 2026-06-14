# Security Audit

Status: Initial repo-level review, not a formal penetration test

## Verified concerns

- hardcoded TMDB keys exist in source
- fallback TMDB key exists in source
- browser-side third-party movie API access still exists
- env usage is scattered and not centrally validated

## Additional review notes

- auth code quality is better than average for sanitization and credential handling
- rate limiting exists in auth flow
- Mux webhook signature verification is present

## Immediate actions

1. remove hardcoded third-party keys
2. move remaining browser-side third-party API access behind the server
3. add env validation strategy
4. add `.env.example`

## Needs verification

- CSP completeness against all current integrations
- production secret rotation process
- log redaction practices
