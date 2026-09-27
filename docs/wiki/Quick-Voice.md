# Quick Voice

Quick Voice is for when you need Calby for ten seconds and do not want to open the full app.

## What it is

A compact always-on-top voice window that opens from anywhere on your desktop with a global keyboard shortcut. It listens to your request, lets Calby perform the action, and then closes automatically.

## Why it exists

To let you interact with Calby instantly — from any application, any window, even when Calby is minimized to the tray — without switching to the main app window.

## How it works

1. **Open** — Press the global shortcut. Quick Voice opens, focusing the microphone.
2. **Speak** — Calby hears you (via VAD / push-to-talk / barge-in). The status line updates.
3. **Understand** — Calby's Gemini Live session interprets your request and selects the appropriate tool (reminder, calendar, memory, etc.).
4. **Perform** — The main-process service executes the action, verifies the result, and sends it back to the overlay.
5. **Close** — The window auto-closes after an answered turn returns to idle, or stays open for clarification. Errors keep the window open so you can retry.

## Shortcuts

- **Windows / Linux**: `Ctrl + Shift + C`
- **macOS**: `⌘ + Shift + C`

The shortcut is configurable in Settings → Voice & Microphone. If the new combination is unavailable, the previous one is restored instead of silently disappearing.

## Listening state

When Quick Voice is active, the microphone is owned exclusively by the overlay. The main window cannot capture audio or play back responses while Quick Voice is open. The header shows a running timer while online and an "Offline" pill when the connection drops.

## Auto-close behavior

- After an answered turn falls back to `idle`, the window auto-closes after a 1100 ms grace period.
- If the tool reports `clarify` (needs more detail), the window stays open — the user must answer before it can close.
- On `error`, the window stays open with a "Try again" button; the session is not discarded.
- If no speech follows a successful action, a 3500 ms fallback timer fires; if speech does follow, the timer is cancelled and the window closes after the grace period.

## Supported platforms

Quick Voice works on Windows, macOS, and Linux where the desktop app is installed. The shortcut and UI adapt to the platform.

## Settings

Quick Voice settings are in the app under **Settings → Voice & Microphone**. You can:

- Change the global shortcut
- Enable/disable push-to-talk (Space)
- Adjust microphone input device
- Toggle VAD (voice activity detection)
- View online/offline status

## Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| Shortcut does not open Quick Voice | Shortcut conflict with another app | Change the shortcut in Settings → Voice & Microphone |
| Microphone not detected | Wrong input device selected | Select the correct device in Settings → Voice & Microphone |
| Window opens but no audio | Microphone permission denied | Grant microphone permission in the OS dialog |
| Window stays open after action | Tool needs clarification | Answer the question, or press the close (×) button |
| "Offline" pill in header | Gemini Live session disconnected | Check internet connection, then re-open Quick Voice |

---

[Home](Home) · [Getting Started](Getting-Started) · [How Calby Works](How-Calby-Works) · [Configuration](Configuration.md) · [Privacy and Data](Privacy-and-Data.md)