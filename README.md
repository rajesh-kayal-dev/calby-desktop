# Calby

Calby is a personal desktop voice assistant built to help you remember things, understand your schedule, and take simple actions without making you manage everything manually.

You speak to Calby, Calby understands what you need, and then it remembers or acts for you.

> **Status:** In active development

## What Calby does

- Voice-first interaction with Gemini
- Local reminders and desktop notifications
- Google Calendar integration
- Personal memory stored on the device
- Meeting preparation using calendar and memory context
- Desktop tray, global shortcut, and notification deep links
- Settings for AI, voice, reminders, connections, privacy, and personalization

## How it works

```text
You speak
   ↓
Calby understands
   ↓
Calby remembers or acts
   ↓
You get the result
```

Calby uses Gemini for understanding and decision-making. The desktop application handles the actual actions such as saving memories, creating reminders, working with calendar events, and showing notifications.

## Tech Stack

- Electron
- React
- TypeScript
- Vite
- NodeJS
- SQLite
- better-sqlite3
- Google Calendar API
- Gemini API
- Playwright

## Project Structure

```text
calby/
├── apps/
│   └── desktop/
│       ├── src/
│       │   ├── main/        # Electron main process and services
│       │   ├── preload/     # Secure renderer bridge
│       │   └── renderer/    # React application
│       └── assets/
├── e2e/                     # End-to-end tests
├── docs/                    # Project documentation
├── design/                  # Design system and UI work
├── research/                # Product research
└── package.json
```

## Architecture

Calby keeps the renderer separated from Electron and system APIs.

```text
React Renderer
      ↓
Preload / Context Bridge
      ↓
Typed IPC
      ↓
Electron Main Process
      ↓
Local Services / SQLite / OS APIs
```

This keeps Node.js and system-level access out of the renderer.

## Getting Started

### Requirements

- Node.js
- npm
- A Gemini API key
- Google account for the optional Calendar integration

### Install

Clone the repository and install dependencies:

```bash
git clone https://github.com/rajesh-kayal-dev/calby-desktop.git
cd calby-desktop
npm install
```

### Run in development

```bash
npm run dev --workspace=@calby/desktop
```

### Build

```bash
npm run build --workspace=@calby/desktop
```

### Test

Run the end-to-end test suite:

```bash
npx playwright test -c e2e/playwright.config.ts
```

Run the desktop checks:

```bash
npm run typecheck --workspace=@calby/desktop
npm run lint --workspace=@calby/desktop
```

## Data and Privacy

Calby is designed as a local-first desktop application.

- Memories and reminders are stored locally.
- Gemini credentials are encrypted before being stored on the device.
- Google Calendar is optional and is connected only when the user chooses to use it.
- Calendar data is fetched when calendar features are used rather than copied into Calby's local database.

Local application data is stored in the operating system's application data directory.

## Google Calendar

Calendar access is optional. Calby uses Google's desktop OAuth flow and stores the resulting credentials securely on the user's device.

The current calendar integration supports reading upcoming events and creating calendar events. Google Meet links can also be created for supported event creation flows.

## Development Notes

The project uses feature branches for development and merges completed work into `main` through pull requests.

Keep changes focused on one feature at a time and avoid putting unrelated refactors into feature branches.

## Roadmap

Planned areas include:

- Premium notification and alarm sounds
- More integrations such as Google Drive and Notion
- Improved voice experience
- More desktop automation
- Additional cross-platform polish

## Contributing

This project is currently developed as a personal project. Contributions, issues, and suggestions are welcome as the project becomes more open to collaboration.

## Author

**Rajesh Kayal**

GitHub: [rajesh-kayal-dev](https://github.com/rajesh-kayal-dev)

## License

License information will be added as the project is prepared for wider distribution.
