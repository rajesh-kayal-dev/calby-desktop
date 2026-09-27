# Calendar and Reminders

Calby handles two related but distinct features: local reminders and Google Calendar integration.

## Reminders (local)

Reminders are fully local — they are stored in SQLite on your device and do not require an internet connection to function.

### What they do

- **Create** — Set a reminder for a specific time or location.
- **Snooze** — Postpone a reminder by a selected interval (e.g., 10 minutes, 30 minutes).
- **Dismiss** — Remove a reminder without completing it.
- **Complete** — Mark a reminder as done; it will no longer trigger.
- **Catch-up** — On app restart, any reminders that fired while Calby was closed are still tracked; the UI shows which were missed.

### Example

> "Remind me tomorrow at 9 AM to call Rahul."

Reminders can also include a custom alarm sound from a selection of bundled packs.

### Native notifications

When a reminder triggers, a native desktop notification appears with actions to **Snooze**, **Dismiss**, or **Mark Complete**. The notification includes a sound pack you can choose in Settings.

### Offline behavior

Reminders work without an internet connection. The local scheduler fires at the scheduled time regardless of network status. If the app is closed, the operating system's alarm system fires the notification.

## Google Calendar (optional integration)

Calby can connect to Google Calendar to read upcoming events and create/edit events. This is an opt-in feature — you must explicitly connect your Google account.

### What it does

- **Read upcoming events** — View the next few days' events in the app.
- **Create events** — Add a new calendar event with title, time, and optional location/description.
- **Google Meet links** — Supported on event flows that include a meeting.
- **Delete events** — Remove an event you created through Calby.

### Connection

Connect via **Settings → Calendar → Connect Google Calendar**. This launches the desktop OAuth flow. Once connected, Calby can read your schedule and suggest context for voice requests.

### Limitations

- Calby can only create events; it cannot delete events created by other users or through other apps.
- Google Meet links are supported on specific event flows; not all events include them.
- The connection can be disconnected at any time from Settings → Calendar → Disconnect.

### Example

> "Create a meeting with Alex tomorrow at 3 PM."

---

[Home](Home) · [Getting Started](Getting-Started) · [How Calby Works](How-Calby-Works.md) · [Integrations](Integrations.md) · [Privacy and Data](Privacy-and-Data.md)