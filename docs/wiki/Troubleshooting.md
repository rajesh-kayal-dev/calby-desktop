# Troubleshooting

This page documents common issues and their fixes, based on verified repository behavior and user reports.

## Microphone not working

**Problem**: Quick Voice opens, but no audio is detected; the status stays at "Listening..." without any response.

**Cause**: 
- Wrong microphone selected in Settings → Voice & Microphone.
- OS-level microphone permission denied.
- Another app is using the microphone exclusively.

**Fix**:
1. Open **Settings → Voice & Microphone** and select the correct input device.
2. If prompted, grant microphone permission in the OS system dialog (the first time Quick Voice opens).
3. Ensure no other app (e.g., Zoom, Discord, voice recorder) is using the microphone. Try closing those apps and re‑opening Quick Voice.

## Quick Voice shortcut not working

**Problem**: The global shortcut (`Ctrl+Shift+C` / `⌘+Shift+C`) does not open Quick Voice.

**Cause**:
- The shortcut is conflicted by another application.
- The shortcut was changed and the new combination is unavailable.

**Fix**:
1. Open **Settings → Voice & Microphone** and change the shortcut to a different combination.
2. If the new combination is unavailable, the previous one is automatically restored.
3. On Windows, some keyboard shortcuts involving `Ctrl+Shift` are handled by the OS before Electron receives them; try a different modifier (e.g., `Alt+Shift+C`).

## AI unavailable / "Can't reach Gemini"

**Problem**: Quick Voice opens, but after speaking, Calby responds with "I couldn't reach Calby's AI service" or similar.

**Cause**:
- No Gemini API key has been entered.
- The Gemini Live session could not be established (network issue, rate limiting, etc.).
- The key has expired or is invalid.

**Fix**:
1. Open **Settings → AI** and enter your Gemini API key.
2. If the key is correct and the issue persists, check your internet connection.
3. The Gemini key is stored encrypted on the device and never sent as an environment variable.

## Google Calendar connection problems

**Problem**: Calby cannot connect to Google Calendar, or the connection drops frequently.

**Cause**:
- OAuth credentials are expired or revoked.
- The local loopback OAuth listener is being blocked by a firewall or security software.
- The Google Calendar API quota has been exceeded.

**Fix**:
1. Open **Settings → Calendar → Disconnect**, then **Connect** again to re‑authorize.
2. Ensure no firewall or security software is blocking the local loopback listener (`127.0.0.1`).
3. If the issue continues, re‑generate OAuth credentials in the Google Cloud Console and reconnect.

## Build failures

**Problem**: `npm run build` fails with native dependency errors or electron‑vite errors.

**Cause**:
- Missing system libraries (e.g., `better-sqlite3` native build tools).
- Node version mismatch (`npm ci` expects Node 24).
- TypeScript or ESLint errors blocking the build.

**Fix**:
1. Ensure you are using Node.js 24 (the release workflow version).
2. Run `npm ci --include=optional` to install dependencies cleanly.
3. Run `npm run typecheck` and fix any reported errors.
4. Run `npm run lint` and fix any warnings.
5. On Windows, install the MSVC build tools if `better-sqlite3` falls back to a native build.
5. On macOS, ensure Xcode command line tools are installed.
6. On Linux, ensure build essentials are installed (`build-essential`).

## Linux packaging issues

**Problem**: `npm run build:linux` fails or the AppImage/DEB is not functional.

**Cause**:
- Missing system libraries (`libxkbcommon`, `libatspi`, etc.).
- `dpkg` or `appimage` tools not available.
- Architecture mismatch (building on x64 but targeting arm64, or vice‑versa).

**Fix**:
1. On Debian/Ubuntu: `sudo apt-get install build-essential libxkbcommon-dev libatspi2.0-dev`.
2. Verify the architecture: `uname -m` (should be `x86_64` for the standard builds).
3. Re‑run `npm run build:linux`.

## macOS packaging issues

**Problem**: `npm run build:mac` fails or the DMG is corrupted.

**Cause**:
- Missing Xcode command line tools.
- Code signing identifiers not configured.
- Notarization not enabled (the DMG will install but show a warning).

**Fix**:
1. Install Xcode command line tools: `xcode-select --install`.
2. Ensure the `APPLE_ID` and `APPLE_APP_SPECIFIC_PASSWORD` are configured in the CI secret store if you plan to distribute publicly.
3. For local testing, the DMG installs without notarization but may show a warning.

---

[Home](Home) · [Getting Started](Getting-Started.md) · [Quick Voice](Quick-Voice.md) · [How Calby Works](How-Calby-Works.md) · [Integrations](Integrations.md)