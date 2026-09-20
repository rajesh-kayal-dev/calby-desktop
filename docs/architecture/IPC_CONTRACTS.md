# Calby — IPC Contracts

## Principle

IPC is an explicit contract between the renderer and the main process.

```text
Renderer -> preload API -> IPC -> main service
main service -> IPC -> preload API -> renderer
```

## Rules

1. Renderer never sends raw Electron objects.
2. Main process validates every request.
3. Responses should be serializable data.
4. Errors should be typed and actionable.
5. Do not expose generic `send(channel, ...args)` APIs to feature code.
6. Use feature-specific methods.

## Suggested API

```ts
window.calby.reminders.list()
window.calby.reminders.create(input)
window.calby.reminders.update(id, input)
window.calby.reminders.delete(id)
window.calby.reminders.snooze(id)
window.calby.reminders.complete(id)

window.calby.memory.list()
window.calby.memory.search(query)
window.calby.memory.create(input)
window.calby.memory.update(id, input)
window.calby.memory.delete(id)
window.calby.memory.clearAll()

window.calby.calendar.getStatus()
window.calby.calendar.connect()
window.calby.calendar.disconnect()
window.calby.calendar.getUpcoming()
window.calby.calendar.getEvent(id)

window.calby.settings.get()
window.calby.settings.update(patch)

window.calby.voice.start()
window.calby.voice.stop()
window.calby.voice.interrupt()
window.calby.voice.getState()

window.calby.system.openMainWindow()
window.calby.system.showNotification(input)
window.calby.system.quit()
```

## Result pattern

Prefer explicit result types:

```ts
type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }
```

Do not silently swallow failures.

## Action verification

For an action such as reminder creation:

```text
Gemini
  -> request createReminder
  -> main validates request
  -> reminder service writes data
  -> service confirms write
  -> IPC returns success
  -> renderer shows success
  -> Gemini receives action result
```

The renderer must not show “Reminder created” before the service returns success.

## Events

Use events only for genuine asynchronous state changes, for example:

```text
voice:state-changed
reminder:triggered
calendar:status-changed
system:notification-action
```

Keep the event surface small.
