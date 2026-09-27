# Calby Desktop releases

## Build commands

Run these from the repository root:

```powershell
npm run build:win
npm run build:mac
npm run build:linux
npm run build:all
```

Artifacts are written to `release/`, which is intentionally ignored by Git. `build:all` is for a release environment that can execute each platform build; use the manual GitHub Actions workflow for native Windows, macOS, and Linux builds.

The targets are Windows MSI (x64), macOS DMG (x64 and Apple Silicon), Linux AppImage (x64), and Linux DEB (x64). Local commands only create local artifacts.

## GitHub Actions

To create the `v1.0.0` release, push the release configuration to GitHub, then open **Actions** → **Publish Calby Desktop Release** → **Run workflow**. Select the branch containing the release changes and start the workflow. It reads `1.0.0` from the root `package.json`, builds installers on native Windows, macOS, and Linux runners, creates the `v1.0.0` GitHub Release, and attaches the MSI, both DMGs, AppImage, and DEB. Rerunning it replaces assets on the existing tag.

The workflow uses the repository-provided `GITHUB_TOKEN` with `contents: write`. If your organization restricts workflow write permissions, enable **Read and write permissions** for workflows or provide an equivalent release token through repository configuration.

## Production configuration

Calby keeps its user database and runtime configuration in Electron's per-user `userData` directory, so application upgrades preserve existing user data. The packaged application loads its renderer from local files; `ELECTRON_RENDERER_URL` is development-only.

Google Calendar OAuth requires a production OAuth client configured for the application. Supply the existing supported runtime environment variables during development or controlled deployment:

- `GOOGLE_CLIENT_ID` or `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET` or `GOOGLE_OAUTH_CLIENT_SECRET`
- optional `GOOGLE_OAUTH_REDIRECT_URI`

Do not commit `.env` files, OAuth secrets, access tokens, signing certificates, or API keys. Gemini credentials continue to use Calby's existing credential storage and are not bundled in release artifacts. The localhost loopback address used by the OAuth callback is intentional for desktop OAuth and is not a production backend endpoint.

## Signing and publishing

The packages are unsigned by default for local testing. Before public distribution, provide platform signing/notarization credentials through your secure CI secret store, then enable the appropriate electron-builder signing settings. Future placeholders are documented in the workflow for `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID`; none are currently used. Windows builds intentionally skip executable signing/editing so they work on hosts without symbolic-link privileges; enable that step in a signed release environment to embed a Windows executable icon. Keep credentials out of source control.
