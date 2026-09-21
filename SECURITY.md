# Security Policy

## Reporting a Security Issue

If you find a security issue in Calby, please do not open a public GitHub issue with sensitive details.

Please report it privately to the project maintainer with:

- A short description of the issue
- Steps to reproduce it
- The possible impact
- Any relevant screenshots, logs, or proof of concept

## What to Avoid

Please never include any of the following in an issue or pull request:

- Gemini API keys
- Google OAuth tokens or refresh tokens
- Personal calendar data
- Passwords or other credentials
- Private configuration files

Calby stores sensitive credentials locally using the operating system's secure storage where supported.

## Supported Versions

Calby is currently under active development. Security fixes will normally target the latest version on the `main` branch.

## Responsible Disclosure

Please allow reasonable time for the issue to be investigated and fixed before publicly disclosing security-sensitive details.
