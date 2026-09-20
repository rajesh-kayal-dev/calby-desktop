# Calby Technical Documentation

This documentation is the implementation companion for the frozen Calby product/design work.

## Documents

- `docs/architecture/ARCHITECTURE.md` — overall Electron + React architecture and process boundaries.
- `docs/architecture/PROJECT_STRUCTURE.md` — recommended production folder structure.
- `docs/architecture/IPC_CONTRACTS.md` — secure renderer/preload/main IPC contract.
- `docs/development/DEVELOPMENT.md` — development rules, coding boundaries, feature implementation order, and definition of done.

## Current project baseline reviewed

The learning project supplied for review is an electron-vite + React + TypeScript application. It currently contains a CRUD-oriented renderer, an Express server, Axios-based API calls, a small `ping` IPC test, and toolkit-generated preload APIs.

For Calby, the CRUD project is treated as a learning reference, not as the production application structure.
