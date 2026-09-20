# Calby — Development Rules

## 1. Development philosophy

Build Calby in vertical slices.

Do not implement all screens with fake data first.

Each milestone should move one real user flow closer to working end-to-end.

## 2. Order

### Milestone 1 — Electron foundation

- BrowserWindow
- preload
- contextBridge
- secure IPC
- window behavior

### Milestone 2 — React shell

- Tailwind/theme
- shared UI primitives
- routing
- main shell
- settings shell

### Milestone 3 — Phase 1

- welcome
- Gemini connection
- connection progress
- success
- microphone permission

### Milestone 4 — Reminders

- storage
- CRUD
- scheduler
- snooze
- dismiss
- completion

### Milestone 5 — Native desktop

- notifications
- alarm
- tray
- background operation

### Milestone 6 — Voice + Gemini

- realtime session
- voice states
- interruption
- tool calls
- verified action results

### Milestone 7 — Memory

### Milestone 8 — Calendar

### Milestone 9 — Settings

### Milestone 10 — Final integration and QA

## 3. Feature boundaries

Domain logic belongs in main-process services.

Renderer features should not directly manipulate database files, timers, OS notifications, or secrets.

## 4. UI rules

Implement the frozen design instead of improvising.

Use the Calby Design System tokens and shared components.

Do not add product features while implementing a screen unless a real usability/security issue requires it.

## 5. State rules

Every important async action should expose a meaningful state:

```text
idle
loading
processing
success
error
offline
permission-required
reconnect
```

Voice additionally needs:

```text
listening
responding
interrupted
```

## 6. Persistence rules

Local data must survive application restart.

Reminder scheduling must be restored from persisted reminders on startup.

Settings changes must persist.

Memory enable/disable must persist.

## 7. Error rules

Errors should:

- explain what happened
- provide a useful next step
- avoid leaking secrets
- never be represented as success

## 8. Testing expectations

Before marking a feature complete, test:

- normal flow
- restart
- unavailable external service
- invalid input
- permission failure
- duplicate/edge cases
- destructive action confirmation
- expected UI state

## 9. Git workflow

Use small, feature-focused commits.

Suggested branches:

```text
main
develop
feature/electron-foundation
feature/react-shell
feature/onboarding
feature/reminders
feature/voice
feature/memory
feature/calendar
feature/settings
feature/desktop-integration
```

Do not commit secrets, `.env` files, build output, or personal test data.

## 10. Definition of done

A feature is done only when:

- UI matches the approved design
- main/preload/renderer responsibilities are correct
- persistence works where required
- loading/error/success states work
- restart behavior works
- security boundaries remain intact
- typecheck passes
- lint passes
- feature does not expand MVP scope
