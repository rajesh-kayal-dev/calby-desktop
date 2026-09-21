# Contributing to Calby

Thanks for taking an interest in Calby.

Calby is currently maintained as a personal project and is under active development. Contributions, bug reports, and practical suggestions are welcome.

## Before You Start

For larger changes, open an issue first so the proposed change can be discussed before implementation.

Small bug fixes and documentation improvements can be submitted directly as a pull request.

## Development

1. Fork the repository.
2. Create a feature branch from `main`.
3. Make your changes.
4. Run the project's typecheck, lint, build, and relevant tests.
5. Commit your changes with a clear message.
6. Open a pull request against `main`.

## Branch Naming

Use descriptive branch names such as:

- `feature/voice-settings`
- `feature/reminder-sounds`
- `fix/calendar-timezone`
- `docs/readme-update`

## Pull Requests

A good pull request should:

- Explain what changed
- Explain why the change was needed
- Keep unrelated changes out of the PR
- Include tests when behavior changes
- Keep the existing Calby architecture and security model intact

## Code Style

Follow the existing project structure and patterns. Prefer simple, maintainable code over unnecessary abstractions.

Do not commit:

- API keys
- OAuth tokens
- `.env` files containing secrets
- Personal data
- Generated build artifacts unless they are intentionally tracked by the project

## Questions

For questions or larger feature ideas, open a GitHub issue with enough context to explain the problem and the proposed solution.
