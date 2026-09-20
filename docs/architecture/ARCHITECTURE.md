# Calby — Architecture

## 1. Goal

Calby is a desktop-first Electron application with a React renderer, a secure preload bridge, local application services, and external integrations.

Core rule:

> Gemini understands and decides. Calby executes, stores, schedules, notifies, and verifies.

## 2. High-level architecture

```text
React Renderer
      |
      | typed, allowlisted preload API
      v
Preload / contextBridge
      |
      | IPC
      v
Electron Main Process
      |
      +-- AI / Gemini
      +-- Reminder Service
      +-- Memory Service
      +-- Calendar Service
      +-- Notification / Alarm Service
      +-- Tray Service
      +-- Settings Service
      +-- Protected Storage
      +-- Permissions
```

## 3. Renderer responsibilities

The renderer owns:

- application UI
- routing
- component state
- view models
- visual voice states
- form interaction
- loading/error/success presentation

The renderer must not:

- access Node APIs directly
- read/write arbitrary files
- hold long-lived secrets
- own reminder scheduling
- call Electron internals directly
- treat AI responses as completed actions without application confirmation

## 4. Preload responsibilities

Preload is the only bridge between renderer and privileged Electron code.

Expose a small typed `window.calby` API.

Do not expose raw `ipcRenderer`.

Recommended namespaces:

```text
window.calby.voice
window.calby.reminders
window.calby.memory
window.calby.calendar
window.calby.settings
window.calby.system
```

## 5. Main-process services

### AI Service

Owns Gemini realtime sessions, tool definitions, conversation state required by the AI integration, and AI-originated action requests.

The AI service must call Calby services rather than writing storage directly.

### Reminder Service

Owns reminder CRUD, scheduling, snooze, completion, and dismissal.

### Memory Service

Owns explicit memory creation, search, read, update, delete, clear-all, and enabled/disabled behavior.

### Calendar Service

Owns Google Calendar connection lifecycle and retrieval of upcoming events/event details.

### Notification Service

Owns native notifications, sound, alarms, snooze, dismiss, and alarm duration.

### Tray Service

Owns system tray lifecycle, open, settings, and quit behavior.

### Settings Service

Owns persisted application preferences.

### Protected Storage

Owns local structured application data and protected credentials/tokens.

## 6. Security boundary

Enable Electron security features and keep privileged access in the main process.

Required principles:

- context isolation enabled
- narrow preload bridge
- validate all IPC inputs in main
- no raw Electron API in renderer
- no secrets in renderer localStorage
- no secrets in URLs
- no unnecessary personal-data exposure
- external integrations disconnectable
- destructive memory deletion requires confirmation

The current learning project uses a broad toolkit preload API and `sandbox: false`; those choices are not the final Calby security boundary.

## 7. UI shells

Calby uses contextual shells rather than forcing one shell everywhere:

- onboarding shell
- focused voice shell
- main app shell
- settings shell
- native tray/notification surfaces

## 8. Core state flow

Voice:

```text
Idle
  -> Listening
  -> Processing
  -> Responding
  -> Idle
```

Action:

```text
Processing
  -> Tool Request
  -> Action In Progress
  -> Success | Error
  -> Responding
  -> Idle
```

## 9. Failure rule

Never show a successful result merely because Gemini produced a response.

The application service must confirm execution first.

## 10. Design integration

Use the frozen Calby Design System and Phase 1–7 references as the UI source of truth.

Implementation must reuse:

- typography
- semantic colors
- spacing
- radius
- buttons
- inputs
- cards
- modals
- navigation
- voice states
- reminder states
- notifications
- connection/error patterns
