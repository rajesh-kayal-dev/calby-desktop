# Calby — Implementation Specification v1.0

## 1. Purpose

This document is the bridge between the frozen Calby product/design work and implementation.

Calby is a personal desktop assistant for managing information, plans, reminders, calendar context, and useful personal memory through a simple voice-first experience.

Core product loop:

**Remember → Understand → Act**

Product and implementation should stay inside the frozen MVP scope.

---

## 2. Source-of-Truth Order

When sources disagree, use this order:

1. The approved final Phase 1–7 reference designs.
2. The Calby Design System reference.
3. Calby Product Foundation.
4. Calby Global Product Requirements.
5. Feature Architecture and Information Architecture.
6. Exported Stitch HTML/code as implementation reference.

Generated HTML may contain intermediate or extra controls that are not part of the frozen design. Do not implement those extras automatically.

---

## 3. Frozen MVP Scope

### Included

- First-launch setup
- Gemini API connection
- Microphone permission
- Voice-first home
- Voice states
- Natural-language reminders
- Local reminder persistence
- Desktop notifications
- Alarm, snooze and dismiss
- Google Calendar connection
- Upcoming calendar events
- Event details
- Meeting preparation
- Personal memory
- Memory search/view/edit/delete
- AI, Voice, Reminder/Notification, Calendar, Memory/Privacy, General and About settings
- System tray/background operation
- Connection/error/empty states

### Out of Scope

- Location reminders
- WhatsApp/Telegram/messaging integrations
- Multiple AI providers
- User-facing model selection
- Advanced AI configuration
- Prompt editor/playground
- Analytics dashboards
- Full notes/knowledge base
- Document management
- Advanced task/project management
- Collaboration
- Billing/account system
- Automation marketplace
- Unnecessary technical controls

---

## 4. Product Rules

- Voice remains a primary interaction method.
- Responses should be concise for action-oriented requests.
- Important actions must communicate their real state.
- Never show success before Calby confirms execution.
- AI intent interpretation and application execution remain separate.
- Reminders and memory are local capabilities.
- Gemini is the AI layer; Calby is the execution/action layer.
- Memory is saved through an explicit user flow.
- Users can view, disable and clear memory.
- External integrations are explicitly connectable/disconnectable.
- Notifications must be relevant, actionable and controllable.
- The product remains calm, focused and unobtrusive.

---

## 5. Desktop Shell

### Primary implementation target

- Desktop Electron application.
- Baseline working viewport: approximately **1280×680** for compact application views.
- Support smaller practical desktop sizes without clipping.
- Long settings/content views may scroll vertically.
- Avoid unnecessary horizontal scrolling.

### Shared shell

The main application shell contains:

- Calby branding/title area
- Connection indicator
- Window controls
- Global navigation where applicable
- Main content area

Global main navigation:

- Home
- Reminders
- Calendar
- Memory
- Settings

Settings uses its own compact left navigation.

Onboarding and focused voice interaction do not require the full main navigation.

---

## 6. Screen Inventory

### Phase 1 — First Launch & Setup

1. Welcome
2. Connect Gemini API
3. API Validation / Connecting
4. Connection Success
5. Microphone Permission

Flow:

`Welcome → Gemini API → Connecting → Success → Microphone → Home`

---

### Phase 2 — Voice Assistant

One Home/Voice experience with these states:

1. Idle
2. Listening
3. Processing
4. Speaking
5. Action Result
6. Error

These are UI states, not six separate application routes.

---

### Phase 3 — Reminders

1. Reminders List
2. Create/Edit Reminder modal
3. Native Reminder Notification / Alarm

Supporting states belong to the relevant page rather than becoming new routes.

---

### Phase 4 — Calendar

1. Calendar / Schedule
2. Event Details modal
3. Meeting Preparation modal

Same-page states:

- No upcoming events
- Connect Google Calendar
- Calendar load error / Retry

---

### Phase 5 — Personal Memory

1. Memory List
2. Memory View modal
3. Memory Edit modal

Empty state remains a state of the Memory page.

---

### Phase 6 — Settings & Privacy

1. Settings Main
2. AI
3. Voice
4. Reminders & Notifications
5. Calendar
6. Memory & Privacy
7. General
8. About

---

### Phase 7 — Final Desktop Integration

1. Global App / Navigation
2. System Tray / Background
3. Desktop Notification / Alarm
4. Connection / Error States
5. Final Integrated Home

System Tray and desktop notification are native desktop behaviors, not normal React routes.

---

## 7. React Route / View Map

Recommended route structure:

```text
/setup/welcome
/setup/gemini
/setup/gemini/connecting
/setup/gemini/success
/setup/microphone

/home
/reminders
/calendar
/memory

/settings
/settings/ai
/settings/voice
/settings/reminders
/settings/calendar
/settings/memory
/settings/general
/settings/about
```

Use local UI state for modals:

```text
Reminder Create/Edit Modal
Calendar Event Details Modal
Meeting Preparation Modal
Memory View Modal
Memory Edit Modal
Confirmation Dialogs
```

Voice states live inside the Home view.

Native tray/notification states live outside React routing.

---

## 8. Electron Architecture

Use the standard secure Electron architecture:

```text
React Renderer
      │
      │ secure preload API
      ▼
Preload / contextBridge
      │
      │ IPC
      ▼
Electron Main Process
      │
      ├── AI Service
      ├── Reminder Service
      ├── Memory Service
      ├── Calendar Service
      ├── Notification Service
      ├── Tray Service
      ├── Settings Service
      └── Storage
```

### Renderer

Responsible for:

- UI
- navigation
- component state
- local visual state
- user interaction

The renderer must not receive direct Node.js access.

### Preload

Expose a small allowlisted API through `contextBridge`.

Do not expose raw `ipcRenderer`.

Example API shape:

```ts
window.calby.reminders.list()
window.calby.reminders.create(data)
window.calby.memory.search(query)
window.calby.calendar.getUpcoming()
window.calby.settings.get()
window.calby.voice.start()
window.calby.voice.stop()
```

### Main Process

Responsible for:

- filesystem access
- secure credential handling
- database/storage
- timers/scheduling
- OS notifications
- system tray
- background lifecycle
- calendar integration
- Gemini session/tool execution

---

## 9. Service Boundaries

### AI Service

Responsible for:

- Gemini realtime session
- natural-language understanding
- concise responses
- tool/function-call handling
- voice interaction lifecycle

The AI service does not directly edit the database.

### Tool/Action Executor

Receives an AI-requested capability and calls the appropriate Calby service.

Example tools:

```text
createReminder
updateReminder
deleteReminder
listReminders
snoozeReminder
completeReminder

createMemory
updateMemory
deleteMemory
searchMemory

getUpcomingCalendarEvents
getCalendarEvent
prepareMeeting
```

Every tool must return an explicit success/failure result.

### Reminder Service

Responsible for:

- CRUD
- scheduling
- status changes
- snooze
- completion/dismissal

Once a reminder is stored and scheduled, Gemini is not required for the reminder to fire.

### Notification Service

Responsible for:

- desktop notification
- notification sound
- alarm
- snooze
- dismiss
- alarm duration

Reminder delivery must continue when Gemini is unavailable.

### Calendar Service

Responsible for:

- Google Calendar connection lifecycle
- retrieving upcoming events
- retrieving event details
- disconnecting
- reporting unavailable/error state

Meeting preparation combines calendar data with relevant memory and asks the AI layer to produce the concise brief.

### Memory Service

Responsible for:

- create
- search
- read
- update
- delete
- clear all
- enabled/disabled state

Memory should remain small and explicit.

### Tray Service

Responsible for:

- tray icon
- open Calby
- settings
- quit
- background-running state

### Settings Service

Responsible for persisted application preferences.

---

## 10. Local Data Model

Recommended local structured storage:

### Reminder

```ts
type Reminder = {
  id: string
  title: string
  scheduledAt: string
  alarmEnabled: boolean
  alarmDuration: "1m" | "2m" | "until-stopped"
  status: "upcoming" | "completed" | "dismissed"
  createdAt: string
  updatedAt: string
}
```

### Memory

```ts
type Memory = {
  id: string
  content: string
  createdAt: string
  updatedAt: string
}
```

### Calendar Event

```ts
type CalendarEvent = {
  id: string
  title: string
  startAt: string
  endAt: string
  description?: string
  location?: string
  meetingUrl?: string
}
```

Calendar events are external data and should not be treated as Calby-owned records.

### Settings

```ts
type CalbySettings = {
  voiceResponses: boolean
  voiceId: string
  speechSpeed: "slow" | "normal" | "fast"

  desktopNotifications: boolean
  notificationSound: boolean
  alarm: boolean
  alarmDuration: "1m" | "2m" | "until-stopped"

  calendarConnected: boolean
  memoryEnabled: boolean

  startWithComputer: boolean
  runInBackground: boolean
  language: "en"
}
```

### Credentials

Gemini API credentials and external-service tokens are main-process-only data.

Never place raw credentials in React state, localStorage, URLs, or IPC payloads unless strictly required for a controlled connection operation.

Use OS-protected/encrypted storage through the Electron main process.

---

## 11. Voice State Machine

```text
Idle
  ↓
Listening
  ↓
Processing
  ↓
Responding
  ↓
Idle
```

Action branch:

```text
Processing
   ↓
Tool Call
   ↓
Action In Progress
   ↓
Success OR Error
   ↓
Responding
   ↓
Idle
```

Interruption:

```text
Listening/Responding
   ↓
Interrupted
   ↓
Listening or Idle
```

The visual state must match the actual runtime state.

---

## 12. Reminder Flow

### Voice

```text
User speaks
→ Gemini understands request
→ createReminder tool
→ Reminder Service persists reminder
→ Scheduler registers reminder
→ Calby confirms success
```

### Manual

```text
New Reminder
→ Form
→ Save
→ Local persistence
→ Scheduler
→ Success feedback
```

### At reminder time

```text
Scheduler fires
→ Native notification
→ optional sound
→ optional alarm
→ Snooze OR Dismiss
```

This path must work without Gemini.

---

## 13. Memory Flow

```text
User: "Remember that Rahul handles the payment module."
        ↓
Gemini identifies memory intent
        ↓
createMemory
        ↓
Memory Service stores locally
        ↓
Calby confirms
```

The UI then provides:

```text
Memory List
→ Search
→ View
→ Edit
→ Delete
→ Clear All
```

Do not turn Memory into a notes or knowledge-base product.

---

## 14. Calendar Flow

```text
Connect Google Calendar
        ↓
External authorization
        ↓
Calendar Service
        ↓
Upcoming events
        ↓
Event Details
        ↓
Prepare for this meeting
        ↓
Relevant memory + event context
        ↓
Concise preparation brief
```

When calendar access fails:

```text
Calendar error
→ explain problem
→ Retry
```

Do not replace Calendar with a full calendar-management product.

---

## 15. Settings Behavior

### AI

- Gemini connection status
- Manage/reconnect connection

No user-facing model controls.

### Voice

- Voice responses
- Voice selection
- Speech speed

### Reminders & Notifications

- Desktop notifications
- Notification sound
- Alarm
- Alarm duration

### Calendar

- Google Calendar connection
- Connect/disconnect

### Memory & Privacy

- Memory enabled/disabled
- View memory
- Clear all memory

### General

- Start Calby with computer
- Keep running in background
- Language

### About

- Version
- Check for updates
- Help & feedback

---

## 16. Component Mapping

### Shared

- App Header
- Window Controls
- Connection Indicator
- Button
- Icon Button
- Input
- Search Input
- Toggle
- Select
- Card
- Modal
- Dialog
- Status Badge
- Alert
- Empty State
- Loading State
- Error State
- Navigation Item

### Calby-specific

- Voice Orb
- Voice State Display
- Reminder Item
- Reminder Notification
- Alarm
- Calendar Event
- Meeting Prep Brief
- Memory Item
- Memory Modal
- Setting Row
- Connection State
- Tray Menu representation

Build these once and reuse them.

---

## 17. Design Consistency Findings

### A. Generated exports have inconsistent viewport sizes

The exported HTML/screens contain several different heights even though the product is desktop.

Implementation rule:

- Standardize the app shell around the chosen desktop viewport.
- Let long settings/content areas scroll.
- Never allow buttons/content to be clipped.

### B. Generated DESIGN.md contains generic/expanded tokens

The design system includes additional generated tokens and wording that are not all visible in the frozen phase references.

Implementation rule:

- Use the approved visual references as the final visual authority.
- Keep only tokens/components needed by the MVP.

### C. Some generated HTML contains technical controls that were removed from the final designs

Examples include diagnostic information, model details, sync details, test controls and technical storage details.

Implementation rule:

- Do not implement these intermediate controls.

### D. Shortcut labels are platform-sensitive

Some design references use macOS-style `⌘` labels.

Implementation rule:

- Use platform-aware shortcut labels in the actual Electron app.
- Windows/Linux should use the appropriate modifier.
- macOS can use `⌘`.

### E. Navigation is contextual

The generated design-system description suggests a persistent narrow left utility navigation, while the approved phases use different shells:

- onboarding: focused setup
- voice home: focused voice UI
- main product: global navigation
- settings: left settings navigation
- tray/notification: native OS surface

Implementation rule:

Use the frozen Phase 1–7 shell patterns rather than forcing one navigation layout everywhere.

### F. Native OS surfaces

The reminder notification, alarm and system tray should be implemented as Electron/OS capabilities rather than ordinary React pages.

---

## 18. Security / Privacy Architecture

- Renderer has no direct Node.js access.
- Keep context isolation enabled.
- Use a restrictive preload bridge.
- Validate IPC input in the main process.
- Never trust renderer input blindly.
- Keep API keys out of renderer-accessible storage.
- Keep calendar credentials/tokens in protected main-process storage.
- Store only MVP-required data.
- Memory is user-controlled.
- Clear-all-memory is destructive and requires confirmation.
- External integrations must support disconnect.
- Error messages must not expose secrets.

---

## 19. Development Order

Build in vertical feature slices instead of building every screen with fake data first.

### Step 1 — Electron Foundation

- Electron app shell
- BrowserWindow
- preload
- contextBridge
- secure IPC
- development environment
- window behavior

### Step 2 — React Shell

- global theme
- design tokens
- typography
- shared components
- app routing
- main shell
- settings shell

### Step 3 — Phase 1

Implement:

- Welcome
- Gemini connection
- connection progress
- success
- microphone permission

Goal: finish real onboarding, not just visuals.

### Step 4 — Local Storage + Reminders

- persistence
- reminder CRUD
- scheduler
- snooze
- dismiss
- completion

### Step 5 — Native Desktop

- notifications
- alarm
- tray
- background running
- window hide/show behavior

### Step 6 — Voice UI + Gemini

- voice states
- microphone capture
- realtime Gemini session
- interruption handling
- concise voice responses
- tool execution

### Step 7 — Memory

- memory CRUD
- search
- voice-created memory
- edit/delete
- clear memory
- privacy toggle

### Step 8 — Calendar

- Google Calendar connection
- upcoming events
- event details
- meeting preparation

### Step 9 — Settings

Implement the eight frozen settings views and connect them to real behavior.

### Step 10 — Phase 7 Integration

- global navigation
- integrated Home
- tray
- native notification
- connection states
- final combined flow

### Step 11 — QA

- restart persistence
- offline behavior
- connection failures
- permission failures
- reminder reliability
- alarm behavior
- tray behavior
- voice interruption
- calendar errors
- memory deletion
- settings persistence
- visual comparison against the frozen designs

---

## 20. Definition of Done

Calby MVP is ready when:

- The five onboarding states work end-to-end.
- Voice states reflect real runtime behavior.
- A voice request can create a real reminder.
- Reminders survive app restart.
- Reminders fire without Gemini.
- Snooze/dismiss work.
- Tray/background behavior works.
- Gemini connection failures are recoverable.
- Memory can be created, searched, edited, deleted and cleared.
- Google Calendar can connect, display upcoming events and provide event context.
- Meeting preparation uses relevant memory + calendar context.
- Settings actually control behavior.
- Native notifications match the frozen design direction.
- No excluded MVP features have been added.
- Important actions never claim success without confirmation.
- The implementation visually matches the approved Phase 1–7 designs closely enough for final QA.

---

## 21. Recommended Project Structure

```text
calby/
├── src/
│   ├── main/
│   │   ├── index.ts
│   │   ├── ipc/
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   ├── reminders/
│   │   │   ├── memory/
│   │   │   ├── calendar/
│   │   │   ├── notifications/
│   │   │   ├── tray/
│   │   │   └── settings/
│   │   ├── storage/
│   │   └── security/
│   │
│   ├── preload/
│   │   └── index.ts
│   │
│   └── renderer/
│       ├── app/
│       ├── routes/
│       ├── layouts/
│       ├── components/
│       ├── features/
│       │   ├── onboarding/
│       │   ├── voice/
│       │   ├── reminders/
│       │   ├── calendar/
│       │   ├── memory/
│       │   └── settings/
│       ├── hooks/
│       ├── state/
│       ├── lib/
│       └── styles/
│
├── assets/
├── docs/
└── package.json
```

Do not put Electron/Node code inside renderer feature components.

---

## 22. Final Architecture Principle

The most important boundary is:

```text
Gemini
  = Understand + Decide

Calby
  = Execute + Store + Schedule + Notify + Verify
```

This preserves the product rule:

**Gemini is the brain; Calby is the action layer.**

The implementation should remain local-first, voice-first, reliable, privacy-aware and intentionally small.

---

## 23. Immediate Next Step

The design work is frozen.

The next implementation milestone is:

**Electron Foundation → Secure IPC → React Shell**

Do not begin by implementing all screens independently.

Start with the Electron architecture and shared application shell, then implement Phase 1 as the first end-to-end feature slice.
