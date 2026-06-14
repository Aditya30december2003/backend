# Next Ticket

Ticket: `T0001` - Add GitHub CI for lint and production build

Goal:
- create the first merge safety gate using the repo's existing `lint` and `build` commands

Allowed files:
- `.github/workflows/ci.yml`
- `package.json` only if absolutely needed
- `docs/Repo_Current_State.md`
- `docs/Known_Issues_And_Followups.md`

Do not touch:
- `src/`
- `prisma/`
- app features
- dependencies unless required

Implementation prompt:

```text
Implement ticket T0001 - Add GitHub CI for lint and production build.

Constraints:
- Only touch `.github/workflows/ci.yml`, `package.json` if absolutely needed, `docs/Repo_Current_State.md`, and `docs/Known_Issues_And_Followups.md`.
- Do not modify anything under `src/` or `prisma/`.
- Do not add dependencies.
- Use the repo's existing commands only.

Requirements:
- Add a GitHub Actions workflow that runs `npm run lint` and `npm run build` on pull requests.
- Keep the workflow minimal and easy to debug.
- Update the docs only as needed to record that CI now exists and that the first GitHub-hosted run still Needs verification until it executes.
- Run the local verification commands that are possible in this environment and report anything that still needs GitHub-side verification.
```
