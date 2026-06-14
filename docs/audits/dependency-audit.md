# Dependency Audit

Status: Initial repo search-based audit

## Likely unused or near-unused candidates

These package names had no obvious repo import references during inspection:

- `@faker-js/faker`
- `@mediapipe/camera_utils`
- `@mediapipe/drawing_utils`
- `@mediapipe/face_mesh`
- `@react-three/drei`
- `@react-three/fiber`
- `date-fns`
- `dayjs`
- `jsonwebtoken`
- `mongoose`
- `nanoid`
- `shadcn-ui`
- `three`

## Narrow-use packages worth reviewing

- `antd`
- `firebase`
- `framer-motion`
- `quill`
- `react-quill`
- `shaka-player`
- `swr`
- `zustand`

## Rule

No package should be removed from this audit alone.

Each candidate needs:

- verified usage check
- lint/build verification after removal
- feature-owner confirmation if the package supports a niche path

## Needs verification

- dynamic import usage that may not show in basic search
- runtime-only references not obvious from static imports
