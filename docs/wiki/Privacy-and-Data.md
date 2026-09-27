# Privacy and Data

Calby is designed so that your personal data stays under your control. This page explains what is stored, what leaves the device, and how you can manage it.

## What is stored locally (on your device)

All of the following are stored in your per-user application data folder, using SQLite for structured data:

- **Reminders** — Time‑based and location‑based reminders, including snooze/dismiss history.
- **Memories** — Personal facts you explicitly save about people, projects, or preferences. You can view, search, edit, and delete them. Memory storage can be disabled from Privacy settings, which wipes the data.
- **Settings** — Your preferences for AI key, voice input, microphone, reminders, calendar, notifications, and personalization (your name). Persisted across application restarts.
- **Calendar connection state** — Whether your Google Calendar is currently connected or disconnected.

## What may leave the device

- **Gemini AI requests** — Your voice audio (after VAD detection) and transcribed text are sent to Google's Gemini API for interpretation. The AI does not store your data; it processes the request and returns a result.
- **Google Calendar OAuth** — When you connect your calendar, an OAuth access token is stored encrypted on the device. Calby uses this token to call the Google Calendar API on your behalf. The token is never sent to any third party outside Google.
- **Error reports** — If Calby encounters an unexpected condition, a minimal error description (without credentials or raw API payloads) may be sent to help diagnose the issue. You can disable this in Settings.

## Encryption and storage

- Reminders and memories are stored in an encrypted SQLite database using the OS‑provided keyring where available.
- Gemini API keys are entered in the app (onboarding or Settings → AI) and stored encrypted on the device. They are never sent via environment variables or written to disk in plain text.
- Google OAuth tokens are encrypted and stored in the OS keyring on supported platforms.

## What Calby never does

- **Never sends your raw microphone audio** to any third party except through the Gemini Live session (which is the voice pipeline you explicitly opt into).
- **Never claims success** before the main-process service confirms the result.
- **Never shares your data** with advertisers, data brokers, or third‑party AI trainers.
- **Never logs** API keys, tokens, or credential‑bearing URLs.

## Security boundaries

- The renderer process runs with `contextIsolation: true` and `nodeIntegration: false`. It can only call the typed `window.calby` bridge API — no direct Node APIs, no file system access, no secrets.
- All privileged operations (database writes, OAuth, AI calls, notification posting) happen in the main process.
- Destructive actions (memory clear‑all, reminder deletion) require explicit user confirmation.
- The privacy settings page lets you enable/disable memory, disconnect calendar, and clear stored data.

## Managing your data

- **View and delete memories** — Settings → Memory.
- **Disconnect Google Calendar** — Settings → Calendar → Disconnect.
- **Clear all stored data** — Settings → Privacy → Clear All Data (this removes reminders, memories, and resets settings to defaults).
- **Re‑enter your Gemini key** — Settings → AI, if you need to rotate your key.

---

[Home](Home) · [Getting Started](Getting-Started.md) · [How Calby Works](How-Calby-Works.md) · [Integrations](Integrations.md) · [Configuration](Configuration.md)