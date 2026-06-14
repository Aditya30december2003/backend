# Definition of Done

A ticket is not done when code compiles. It is done when it is safe, documented, and verifiable.

## Required for every completed ticket

- scope matches the ticket
- no unrelated rewrite was slipped in
- lint passes
- build passes
- manual verification checklist is completed
- docs are updated if architecture/API/performance behavior changed
- repo memory is updated in `docs/Repo_Current_State.md`
- followups are recorded in `docs/Known_Issues_And_Followups.md` when work is intentionally deferred

## Required for architecture-affecting tickets

- relevant ADR updated or created
- relevant architecture docs updated
- domain ownership remains clear
- no duplicate API family was introduced

## Required for performance tickets

- before/after verification method is documented
- request-count or payload-size effects are checked when relevant
- caching or pagination behavior is documented when introduced

## Required for security/config tickets

- secrets are not committed
- env expectations are documented
- failure behavior for missing config is understood

## Ticket scorecard requirement

Each ticket should be reviewed against:

- Performance
- Complexity
- Tech Debt
- Bundle Size
- Maintainability

If a ticket increases complexity or bundle size, it must justify that tradeoff.
