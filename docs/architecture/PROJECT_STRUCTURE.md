# Calby — Project Structure

## Recommended production structure

```text
calby/
├── src/
│   ├── main/
│   │   ├── index.ts
│   │   ├── ipc/
│   │   │   ├── index.ts
│   │   │   ├── reminder.ipc.ts
│   │   │   ├── memory.ipc.ts
│   │   │   ├── calendar.ipc.ts
│   │   │   ├── settings.ipc.ts
│   │   │   └── system.ipc.ts
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   │   ├── gemini.service.ts
│   │   │   │   ├── voice.service.ts
│   │   │   │   └── tools/
│   │   │   ├── reminders/
│   │   │   ├── memory/
│   │   │   ├── calendar/
│   │   │   ├── notifications/
│   │   │   ├── tray/
│   │   │   ├── settings/
│   │   │   └── permissions/
│   │   ├── storage/
│   │   │   ├── database.ts
│   │   │   ├── migrations/
│   │   │   └── repositories/
│   │   ├── security/
│   │   └── windows/
│   ├── preload/
│   │   ├── index.ts
│   │   ├── api/
│   │   └── index.d.ts
│   └── renderer/
│       ├── index.html
│       └── src/
│           ├── app/
│           ├── routes/
│           ├── layouts/
│           ├── components/
│           │   ├── ui/
│           │   └── shared/
│           ├── features/
│           │   ├── onboarding/
│           │   ├── voice/
│           │   ├── reminders/
│           │   ├── calendar/
│           │   ├── memory/
│           │   └── settings/
│           ├── state/
│           ├── hooks/
│           ├── lib/
│           ├── styles/
│           └── types/
├── assets/
├── docs/
├── resources/
├── electron.vite.config.ts
├── electron-builder.yml
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── tsconfig.web.json
```

## Rules

### `main/`

Privileged Electron code only.

### `preload/`

Typed bridge only.

### `renderer/`

React-only application UI.

### `features/`

Feature-specific UI and feature logic.

### `components/ui/`

Reusable visual primitives. No business logic.

### `components/shared/`

Reusable application-level shell components.

### `services/`

Domain/business operations that belong to the main process.

### `storage/`

Persistence and repositories.

## Naming

Use:

```text
*.service.ts
*.repository.ts
*.ipc.ts
*.types.ts
*.api.ts
```

React components use PascalCase:

```text
VoiceOrb.tsx
ReminderItem.tsx
SettingRow.tsx
```

Avoid generic files such as:

```text
helpers.ts
misc.ts
common.ts
stuff.ts
```

unless their responsibility is genuinely narrow and clear.
