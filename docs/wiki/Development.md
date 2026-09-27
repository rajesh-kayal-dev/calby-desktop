# Development

This page documents the local development workflow for the Calby desktop project.

## Node.js version

The project uses **Node.js 24** (as specified in the release workflow and `package.json`). Ensure your local Node version matches or is compatible with the project's dev dependencies.

## Install

From the repository root:

```bash
npm install
```

This installs all dependencies for both `@calby/desktop` (the Electron app) and `calby-website` (the marketing site).

## Development commands

All commands run from the repository root.

| Command | What it does |
|---|---|
| `npm run dev` | Start the desktop app in development mode (`electron-vite dev`). |
| `npm run build` | Build main, preload, and renderer bundles. |
| `npm run typecheck` | Type‑check the Node and web TypeScript projects. |
| `npm run lint` | ESLint across the desktop app (`--max-warnings 0`). |
| `npm test` | Run Vitest unit tests for main‑process services and shared rules. |
| `npm run test:e2e` | Run Playwright end‑to‑end tests (`npm run test:e2e:ui` for UI mode). |
| `npm run format` | Format the desktop app with Prettier (`--workspace=@calby/desktop`). |

### Build installers

```bash
npm run build:win    # Windows MSI (x64)
npm run build:mac    # macOS DMGs (x64 + arm64)
npm run build:linux  # Linux AppImage and DEB (x64)
npm run build:all    # All three platform builds (needs each platform runner)
```

## Project structure

The workspace contains two packages:

- **`@calby/desktop`** — the Electron desktop app (`apps/desktop/`)
  - `src/main/` — privileged Electron code (IPC, services, windows)
  - `src/preload/` — typed context‑bridge API
  - `src/renderer/` — React UI (features, components)
  - `src/shared/` — rules shared by main and renderer
- **`calby-website`** — the marketing website (`calby-website/`), a Next.js app

See the [README.md](../README.md) for the full directory tree and the [Project Structure](docs/architecture/PROJECT_STRUCTURE.md) doc for the recommended production layout.

## Branch strategy

Suggested branches (from `CONTRIBUTING.md`):

```text
main
develop
feature/electron-foundation
feature/react-shell
feature/onboarding
feature/reminders
feature/voice
feature/memory
feature/calendar
feature/settings
feature/desktop-integration
```

Use small, feature‑focused commits. Do not work directly on `main`.

## Coding conventions

- Follow the existing project patterns (see `CONTRIBUTING.md`).
- Prefer simple, readable code; small focused functions; reusable components; clear names; existing utilities over duplicate implementations.
- Avoid unnecessary dependencies, large unrelated refactors, dead code, and temporary debugging code.
- Do not change project architecture without discussion.

## Definition of done

A feature is done only when:

- UI matches the approved design
- main/preload/renderer responsibilities are correct
- persistence works where required
- loading/error/success states work
- restart behavior works
- security boundaries remain intact
- typecheck passes
- lint passes
- feature does not expand MVP scope

---

[Home](Home) · [Getting Started](Getting-Started.md) · [Quick Voice](Quick-Voice.md) · [How Calby Works](How-Calby-Works.md) · [Architecture](Architecture.md)