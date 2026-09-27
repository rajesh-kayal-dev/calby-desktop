# Testing

Calby has several test layers. This page documents what exists and how to run each one.

## Unit tests

- **Framework**: Vitest
- **Location**: `vitest.run` from the root (`npm test`)
- **Coverage**: Main‑process services, shared rules, and IPC contracts
- **What they test**: Normal flow, restart, unavailable external service, invalid input, permission failure, duplicate/edge cases, destructive action confirmation, expected UI state
- **Run**: `npm test`

## Integration tests

- **Framework**: Playwright (end‑to‑end)
- **Location**: `e2e/tests/` organised by product phase (phase‑1 through phase‑8)
- **Run**: `npm run test:e2e`
- **UI mode**: `npm run test:e2e:ui`
- **What they test**: Full product flows — onboarding, voice assistant, reminders, calendar, memory, settings, Quick Voice, integration between features
- **Key fixtures**: `launchCalbyApp` (starts the app, completes onboarding, monitors console errors), `electronApp` (access to the main window and IPC), `calbyPage` (the rendered React page)

## Typecheck

- **Command**: `npm run typecheck`
- **What it checks**: Node TypeScript (`tsconfig.node.json`) and web TypeScript (`tsconfig.web.json`). Catches type errors across the main and renderer processes.

## Lint

- **Command**: `npm run lint`
- **What it checks**: ESLint across the desktop app with `--max-warnings 0`. Catches code style and potential issues.

## Build verification

- **Command**: `npm run build`
- **What it checks**: The full build pipeline — electron‑vite builds the main, preload, and renderer bundles. A successful build is a prerequisite for creating release installers.

## Test matrix summary

| Layer | Framework | Command | Purpose |
|---|---|---|---|
| Unit | Vitest | `npm test` | Service logic, shared rules, IPC contracts |
| E2E | Playwright | `npm run test:e2e` | Full product flows (onboarding → voice → reminders → calendar → memory → settings) |
| Typecheck | TypeScript | `npm run typecheck` | Type safety across the project |
| Lint | ESLint | `npm run lint` | Code style and simple error detection |
| Build | Vite + Electron | `npm run build` | Verifies the compile pipeline works end‑to‑end |

---

[Home](Home) · [Getting Started](Getting-Started.md) · [Quick Voice](Quick-Voice.md) · [How Calby Works](How-Calby-Works.md) · [Architecture](Architecture.md)