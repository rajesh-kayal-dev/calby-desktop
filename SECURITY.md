# Security Policy

## Reporting a Vulnerability

Please do not report security vulnerabilities through public GitHub issues.

If you discover a security vulnerability in Calby, please report it privately to the project maintainer.

Include as much of the following information as possible:

- A clear description of the vulnerability
- Steps to reproduce the issue
- The affected component or feature
- The potential impact
- Any relevant logs, screenshots, or proof of concept

Please do not include API keys, passwords, access tokens, personal data, or other sensitive information in your report unless it is necessary to explain the vulnerability.

## Responsible Disclosure

Please give the maintainer a reasonable amount of time to investigate and address the issue before publicly disclosing the vulnerability.

Security reports will be reviewed and handled as promptly as reasonably possible.

## Supported Versions

Security fixes are generally focused on the latest release of Calby.

| Version | Supported |
| --- | --- |
| Latest release | Yes |
| Older releases | Best effort |

## Security Practices

Calby may process sensitive information such as:

- Calendar events
- Email and productivity data
- API credentials and access tokens
- User configuration
- AI provider credentials

Contributors should:

- Never commit secrets, API keys, passwords, or access tokens
- Never expose credentials in logs or screenshots
- Avoid storing sensitive data unnecessarily
- Follow existing encryption and authentication patterns
- Remove sensitive information from bug reports and pull requests

## Scope

This policy applies to the Calby project and its publicly distributed software.

Third-party services, dependencies, hosting providers, and external integrations may have their own security policies and reporting procedures.

## Questions

For general security questions that are not vulnerability reports, please open a GitHub issue without including sensitive information.
