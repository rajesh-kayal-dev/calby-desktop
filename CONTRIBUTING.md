# Contributing to Calby

Thanks for your interest in Calby.

Calby is an open-source desktop assistant focused on voice interaction, reminders, calendar workflows, memory, and everyday productivity.

We welcome bug fixes, improvements, documentation updates, UI improvements, tests, and thoughtful feature ideas.

## Before You Start

Please:

- Read the [README](./README.md)
- Check existing issues and pull requests before starting larger changes
- For major features, open an issue first so the approach can be discussed
- Keep changes focused and avoid unrelated modifications

## Development Setup

### Requirements

- Node.js 24
- npm

### Clone

```bash
git clone https://github.com/rajesh-kayal-dev/calby-desktop.git
cd calby-desktop
npm install
```

### Run Calby

```bash
npm run dev
```

## Useful Commands

### Typecheck

```bash
npm run typecheck
```

### Lint

```bash
npm run lint
```

### Tests

```bash
npm test
```

### Build

```bash
npm run build
```

### Desktop Packages

```bash
npm run build:win
npm run build:mac
npm run build:linux
```

## Project Structure

```text
apps/desktop/     Electron desktop application
server/           Backend services
client/           Web client
e2e/              End-to-end tests
docs/             Documentation
assets/           Application assets
.github/          GitHub workflows
```

See the repository source for the current structure before making architectural changes.

## Branches

Create a separate branch for your work.

Use clear names such as:

```text
feat/quick-voice
fix/calendar-timezone
docs/readme
chore/release
```

Do not work directly on `main`.

## Commits

Use clear, consistent commit messages.

Preferred format:

```text
feat: add quick voice shortcut
fix: prevent duplicate reminders
docs: improve setup guide
test: add calendar validation tests
chore: update release workflow
```

Keep each commit focused on one logical change.

## Pull Requests

Before opening a pull request:

- Run typecheck
- Run lint
- Run tests
- Run the relevant build
- Make sure your changes are focused
- Update documentation when behavior changes

For UI changes, include screenshots or a short recording when useful.

Your pull request should include:

### What changed

A short explanation of the implementation.

### Why

Explain the problem or user need.

### Testing

List the commands you ran and the result.

### Screenshots

Include before/after images for meaningful UI changes.

## Code Style

Follow the existing project patterns.

Prefer:

- Simple, readable code
- Small focused functions
- Reusable components
- Clear names
- Existing utilities and patterns over duplicate implementations

Avoid:

- Unnecessary dependencies
- Large unrelated refactors
- Dead code
- Temporary debugging code
- Changing project architecture without discussion

## UI and UX

Calby is designed for normal users, not only developers.

When changing the UI:

- Keep interactions simple
- Use clear human language
- Avoid unnecessary technical terminology
- Keep accessibility and responsive behavior in mind
- Preserve the existing visual language unless the change has a clear reason

## Tests

New behavior should include tests when practical.

Bug fixes should include a regression test when possible.

Run the existing test suite before submitting a pull request.

## Reporting Bugs

Open a GitHub issue and include:

- What happened
- What you expected
- Steps to reproduce
- Operating system
- Calby version
- Relevant logs or screenshots

Please remove API keys, tokens, passwords, and other sensitive information before posting.

## Feature Requests

For a feature request, explain:

- The problem
- Why it would be useful
- Your proposed solution, if you have one
- Any alternatives you considered

## Security

Please do not report security vulnerabilities through public GitHub issues.

See [SECURITY.md](./SECURITY.md) for the security reporting process.

## License

By contributing to Calby, you agree that your contributions are made available under the project's [MIT License](./LICENSE).

## Questions

For general questions, use GitHub Issues or the project's public discussion channels.

Thank you for helping improve Calby.
