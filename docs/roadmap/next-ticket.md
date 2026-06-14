# Next Ticket

Ticket: `T0002` - Lock performance baseline to verified facts only

Goal:
- make the baseline trustworthy before instrumentation expands it

Allowed files:
- `docs/performance/baseline.md`
- `docs/Repo_Current_State.md`
- `docs/Known_Issues_And_Followups.md`
- `docs/roadmap/sprint-1-execution-plan.md`

Do not touch:
- `src/`
- `prisma/`
- `.github/`
- dependencies

Implementation prompt:

```text
Implement ticket T0002 - Lock performance baseline to verified facts only.

Constraints:
- Only touch `docs/performance/baseline.md`, `docs/Repo_Current_State.md`, `docs/Known_Issues_And_Followups.md`, and `docs/roadmap/sprint-1-execution-plan.md`.
- Do not modify `src/`, `prisma/`, or `.github/`.
- Do not add dependencies or instrumentation in this ticket.

Requirements:
- Keep only verified facts and reproducible counts unqualified.
- Mark unknowns as `Needs measurement` or `Needs verification`.
- Remove or correct any stale numbers before expanding the baseline further.
- Run the verification commands that support the updated facts and report any remaining gaps.
```
