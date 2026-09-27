# How Calby Works

Calby follows a simple product-level workflow: the user interacts, Calby understands, Calby decides what action is needed, Calby performs the action, and the user receives a result.

## 1. User speaks or interacts

The user can interact with Calby in several ways:

- **Quick Voice** — Press the global shortcut (`Ctrl+Shift+C` / `⌘+Shift+C`) to open the compact voice overlay from anywhere.
- **Voice Assistant** — Open the main app and use the full Gemini Live voice session with push-to-talk (Space).
- **Text** — Type in the main app or Quick Voice's transcript field.

## 2. Calby understands the request

Calby's Gemini Live session interprets the user's words. The AI decides what capability is needed (reminder, calendar event, memory entry, notification) and generates a tool call with arguments.

**Core rule**: *Gemini understands and decides. Calby executes, stores, schedules, notifies, and verifies.*

The renderer never shows "success" before the main-process service confirms the result.

## 3. Calby decides what action is needed

Based on the interpreted intent, Calby's main-process services determine the next step:

- **Reminder** — Schedule a local reminder with a time/date and optional notification sound.
- **Calendar** — Create or update a Google Calendar event (after OAuth connection).
- **Memory** — Store a fact about a person, project, or preference in the local SQLite database.
- **Notification** — Send a native desktop notification immediately or at a scheduled time.

## 4. Calby performs the action

The main-process service executes the action:

- **Reminder** — The reminder service writes to SQLite, schedules the alarm, and confirms the write.
- **Calendar** — The calendar service connects via Google OAuth, writes the event, and confirms the result.
- **Memory** — The memory service creates, updates, or deletes the entry in SQLite.
- **Notification** — The notification service sends the native OS notification.

**Verification**: Before anything is shown as success, the service must confirm the action completed. If the action fails, the error is reported to the user.

## 5. The user receives a result

The renderer shows the outcome:

- **Success** — A brief result card (e.g., "Reminder created", "Event scheduled").
- **Error** — A friendly message explaining what went wrong and a "Try again" option.
- **Clarification** — If Gemini needs more detail, the Quick Voice window stays open with a question.

The workflow then returns to `idle`, and Quick Voice closes automatically (if open).

## Supported workflows

| Workflow | Description |
|---|---|
| **Reminder** | "Remind me Friday at 9 AM to call Rahul." |
| **Calendar** | "Create a meeting with Alex tomorrow at 3 PM." |
| **Memory** | "Remember: Rahul handles the payment module." |
| **Notification** | "Notify me when the shipment arrives." |

---

[Home](Home) · [Getting Started](Getting-Started) · [Quick Voice](Quick-Voice) · [Calendar and Reminders](Calendar-and-Reminders.md) · [Integrations](Integrations.md)