# Release and Packaging

Calby desktop installers are built and published through a combination of local build commands and a GitHub Actions workflow.

## Local build commands

Run these from the repository root (`calby/`):

| Command | Produces |
|---|---|
| `npm run build:win` | Windows MSI installer (x64) — written to `release/` |
| `npm run build:mac` | macOS DMGs (x64 and Apple Silicon) — written to `release/` |
| `npm run build:linux` | Linux AppImage (x64) and Debian (.deb) packages — written to `release/` |
| `npm run build:all` | All three platform builds (intended for a native CI runner) |

Artifacts are written to `release/`, which is intentionally ignored by Git. The `build:all` command is meant for a release environment that can execute each platform build; use the GitHub Actions workflow for native Windows, macOS, and Linux builds.

## GitHub Actions workflow

The workflow **Publish Calby Desktop Release** (`.github/workflows/desktop-packages.yml`) automates the full release process:

1. Triggered manually from the **Actions** tab.
2. Checks out the repository, installs dependencies (`npm ci`), and runs `typecheck`, `lint`, and `test`.
3. Builds installers on native runners:
   - **Windows**: `npm run build:win` → MSI (x64)
   - **macOS**: `npm run build:mac` → DMGs (x64 + arm64)
   - **Linux**: `npm run build:linux` → AppImage (x64) and DEB (x64)
4. Creates or updates the GitHub Release tag `v<version>` (read from `package.json`).
5. Attaches the five release assets:
   - `Calby-1.0.0-x64.msi`
   - `Calby-1.0.0-arm64.dmg`
   - `Calby-1.0.0-x64.dmg`
   - `Calby-1.0.0-x86_64.AppImage`
   - `Calby-1.0.0-amd64.deb`

**Signing and notarization**: The packages are unsigned by default. Before public distribution, platform signing/notarization credentials must be provided through the secure CI secret store, and the appropriate electron-builder signing settings must be enabled. Future placeholders are documented in the workflow for `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID`; none are currently used. Windows builds intentionally skip executable signing/editing so they work on hosts without symbolic‑link privileges; enable that step in a signed release environment to embed a Windows executable icon.

## Versioning

- Version is read from the root `package.json` (`1.0.0`).
- Releasing creates/updates the GitHub tag `v<version>`.
- Rerunning the workflow on an existing tag replaces the assets.

## Supported platforms and targets

| Platform | Format | Architectures |
|---|---|---|
| Windows | MSI | x64 |
| macOS | DMG | x64, Apple Silicon (arm64) |
| Linux | AppImage | x64 |
| Linux | DEB | x64 |

All installers are published on the [GitHub Releases page](https://github.com/rajesh-kayal-dev/calby-desktop/releases).

## Signing and notarization status

- **Current**: Packages are unsigned by default for local testing and development.
- **Future**: Placeholders in the workflow document `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID`; none are currently configured or used.
- **Windows**: Executable signing/editing is intentionally skipped for local builds; enable in a signed release environment to embed a Windows executable icon.

---

[Home](Home) · [Getting Started](Getting-Started.md) · [Quick Voice](Quick-Voice.md) · [How Calby Works](How-Calby-Works.md) · [Architecture](Architecture.md)