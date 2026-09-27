# Calby

> Your personal desktop assistant.

Calby helps you remember things, understand your schedule, and get things done — by voice or by text. It runs on your desktop, stays out of your way, and keeps your data locally.

## What Calby can do

- **Reminders** — Set location- or time-based reminders with notifications, snooze, and dismiss.
- **Calendar** — Connect Google Calendar, view upcoming events, and create/manage events and Meet links.
- **Memory** — Save, search, edit, and delete personal facts. Stored in SQLite on your device.
- **Quick Voice** — A compact always-on-top voice window opened from anywhere with a global shortcut.
- **Voice Assistant** — Full Gemini Live voice session with push-to-talk, listening/responding states, and spoken answers.
- **Settings & Privacy** — Granular controls for AI key, voice input, microphone, reminders, calendar, and memory.

## Explore Calby

| Page | What it covers |
|---|---|
| [Getting Started](Getting-Started) | Install and run Calby |
| [Quick Voice](Quick-Voice) | Use Calby with the global keyboard shortcut |
| [How Calby Works](How-Calby-Works) | Product-level workflow |
| [Architecture](Architecture.md) | Technical system design |
| [Integrations](Integrations.md) | Google and other supported connections |
| [Configuration](Configuration.md) | AI, voice, and application settings |
| [Privacy and Data](Privacy-and-Data.md) | What stays local and what leaves the device |
| [Development](Development.md) | Local development workflow |
| [Testing](Testing.md) | Automated and manual validation |
| [Release and Packaging](Release-and-Packaging.md) | Desktop builds |
| [Troubleshooting](Troubleshooting.md) | Common issues |

## Quick Voice highlight

Quick Voice is for when you need Calby for ten seconds and do not want to open the full app. It opens with a global keyboard shortcut from anywhere on your desktop, listens to your request, and then closes automatically when done.

- **Shortcut**: `Ctrl + Shift + C` on Windows / Linux, `⌘ + Shift + C` on macOS
- **Floating compact UI** — a small frameless window that is always on top, stays out of the taskbar, and anchors to the top-right of the screen
- **Works from the background** — launch it from the tray menu or the shortcut while Calby is minimized
- **One session owner** — the main window and Quick Voice never share the voice session at the same time
- **Friendly online/offline state** — the header shows the running timer while online and a plain "Offline" pill when the connection drops

---

[Download Calby](https://github.com/rajesh-kayal-dev/calby-desktop/releases) · [GitHub Repository](https://github.com/rajesh-kayal-dev/calby-desktop) · [Wiki Home](Home) · [Contributing](Contributing) · [License](https://github.com/rajesh-kayal-dev/calby-desktop/blob/main/LICENSE)