# Integrations

Calby integrates with a few external services. Only integrations confirmed by the repository code are documented below.

## Google Calendar

**Purpose**: Connect your Google Calendar to Calby so it can read upcoming events, provide contextual suggestions for voice requests, and create/manage events.

**Current support**: ✅ Fully supported in v1.0.0.

**Setup**

1. Open **Settings → Calendar → Connect Google Calendar**.
2. A desktop OAuth flow launches. Follow the prompts to grant Calby read/write access to your calendar.
3. Once connected, Calby can read upcoming events and use them for contextual briefings.

**Permissions**

- Read and write access to your calendar.
- Ability to create, update, and delete events that you authorize.
- Access to event details (title, time, description, Meet links).

**Configuration**

- Disconnect anytime from **Settings → Calendar → Disconnect**.
- If OAuth credentials expire, re‑connect from the same menu.

**Limitations**

- Calby can only create events; it cannot delete events created by other users or through other apps.
- Google Meet links are supported on specific event flows; not all events include them.
- The connection can be disconnected at any time; Calby will fall back to a "disconnected" state and remind you to reconnect.

---

## Google Meet (voice‑only awareness)

**Purpose**: When a calendar event includes a Google Meet link, Calby can surface it during meeting‑preparation workflows.

**Current support**: ✅ Shown in event preparation modals when a Meet link is present.

**How it works**

- After connecting Google Calendar, any event with a Meet URL is marked as such.
- During voice interactions (e.g., "What's on my calendar today?"), if the current event has a Meet link, Calby mentions it in the response.
- No additional setup is required beyond the Google Calendar connection.

---

*No other integrations are currently implemented or confirmed in the desktop repository. Future integrations (Google Drive, Notion, Telegram, Slack, Teams, etc.) are out of scope for the MVP.*

---

[Home](Home) · [Getting Started](Getting-Started.md) · [How Calby Works](How-Calby-Works.md) · [Calendar and Reminders](Calendar-and-Reminders.md) · [Privacy and Data](Privacy-and-Data.md)