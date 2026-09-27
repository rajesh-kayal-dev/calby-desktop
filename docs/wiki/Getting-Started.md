# Getting Started

## Development Setup

These instructions are for developers who want to run and modify the Calby desktop app from source.

### Requirements

- [Node.js](https://nodejs.org/) (v24 as used in the release workflow)
- [npm](https://www.npmjs.com/)

### Clone and install

```bash
git clone https://github.com/rajesh-kayal-dev/calby-desktop.git
cd calby-desktop
npm install
```

### Start the app in development mode

```bash
npm run dev
```

This runs the Electron app using `electron-vite dev`. The main window opens, and you can begin the onboarding flow.

### Build the app

```bash
npm run build
```

This compiles the main, preload, and renderer bundles.

### Build installers for a specific platform

```bash
npm run build:win    # Windows MSI (x64)
npm run build:mac    # macOS DMGs (x64 + arm64)
npm run build:linux  # Linux AppImage and DEB (x64)
```

### Run typecheck

```bash
npm run typecheck
```

### Run lint

```bash
npm run lint
```

### Run tests

```bash
npm test              # Vitest unit tests
npm run test:e2e      # Playwright end-to-end tests
npm run test:e2e:ui   # Playwright UI mode
```

### Project structure

The workspace has two packages:

- **`@calby/desktop`** — the Electron desktop app (`apps/desktop/`)
- **`calby-website`** — the marketing website (`calby-website/`)

See the [README.md](../README.md) for the full project structure.

## End-user installation

Calby desktop installers are published on the [GitHub Releases page](https://github.com/rajesh-kayal-dev/calby-desktop/releases). The latest released version is **v1.0.0**.

Installers by platform:

| Platform | Installer |
|---|---|
| Windows | [Calby-1.0.0-x64.msi](https://github.com/rajesh-kayal-dev/calby-desktop/releases/download/v1.0.0/Calby-1.0.0-x64.msi) |
| macOS (Apple Silicon) | [Calby-1.0.0-arm64.dmg](https://github.com/rajesh-kayal-dev/calby-desktop/releases/download/v1.0.0/Calby-1.0.0-arm64.dmg) |
| macOS (Intel) | [Calby-1.0.0-x64.dmg](https://github.com/rajesh-kayal-dev/calby-desktop/releases/download/v1.0.0/Calby-1.0.0-x64.dmg) |
| Linux (AppImage) | [Calby-1.0.0-x86_64.AppImage](https://github.com/rajesh-kayal-dev/calby-desktop/releases/download/v1.0.0/Calby-1.0.0-x86_64.AppImage) |
| Linux (Debian / Ubuntu) | [Calby-1.0.0-amd64.deb](https://github.com/rajesh-kayal-dev/calby-desktop/releases/download/v1.0.0/Calby-1.0.0-amd64.deb) |

After installation, Calby runs in the background. Open the tray menu to access **Open**, **Quick Voice**, **Settings & Privacy**, and **Quit**.

### Optional: Google Calendar

Google Calendar requires an OAuth client. Create a `.env` in the repository root (or in `apps/desktop/`), which is gitignored:

```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

Optional: `GOOGLE_OAUTH_REDIRECT_URI`, only if you need to pin the OAuth callback. By default Calby starts a local loopback listener (`127.0.0.1`) for Google's desktop OAuth flow.

Without these, everything except the Google Calendar connection works. The Gemini key is entered inside the app (onboarding or Settings → AI), stored encrypted on the device, and never read from environment variables.

## Quick start

```bash
git clone https://github.com/rajesh-kayal-dev/calby-desktop.git
cd calby-desktop
npm install
npm run dev
```