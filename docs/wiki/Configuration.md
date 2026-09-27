# Configuration

Calby is configured through a combination of the app's Settings UI, environment variables (for development), and per-user preferences stored locally.

## Settings UI

All day‑to‑day configuration is done through the app's Settings panels. Each section is persisted locally and survives application restarts.

### AI

- **Gemini API key** — Enter your key once (onboarding or Settings → AI). It is stored encrypted on the device and never sent as an environment variable.
- **Offline speech** — Toggle whether Calby uses the local speech recognition engine for transcription and local parsing. When enabled, voice input works without an internet connection.

### Voice & Microphone

- **Global shortcut** — Change the keyboard shortcut that opens Quick Voice (`Ctrl+Shift+C` / `⌘+Shift+C` by default) or the activate Calby shortcut (`Ctrl+Shift+Space` / `⌘+Shift+Space`).
- **Microphone device** — Select which input device Calby uses for voice capture.
- **Voice activity detection (VAD)** — Toggle whether Calby automatically detects when you start speaking (rather than requiring you to hold the push‑to‑talk key).
- **Push‑to‑talk** — Hold the Space key to speak. Release to process.

### Calendar

- **Google Calendar connection** — Connect or disconnect your Google Account. When connected, Calby can read upcoming events and suggest context for voice requests.
- **Reminder sounds** — Choose a notification sound pack from the available options.

### Notifications

- **Desktop notifications** — Toggle whether Calby shows native desktop notifications for reminders and alarms.
- **Alarm sound** — Select the sound that plays when a reminder triggers.

### Personalization

- **Your name** — A name Calby uses when referring to you in spoken responses (e.g., "OK, I'll remind **Rahul**...").

### Advanced (environment variables, development only)

Environment variables are only needed for Google Calendar OAuth in development. They are not required for normal use; the Gemini key is entered inside the app.

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

Optional:

```env
GOOGLE_OAUTH_REDIRECT_URI=your-redirect-uri
```

These values are **not** committed to the repository. They are placed in a `.env` file at the repository root (or in `apps/desktop/`), which is gitignored.

For production deployment, OAuth credentials are supplied through your CI secret store, not through `.env` files.

---

[Home](Home) · [Getting Started](Getting-Started.md) · [How Calby Works](How-Calby-Works.md) · [Integrations](Integrations.md) · [Privacy and Data](Privacy-and-Data.md)