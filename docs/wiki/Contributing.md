# Contributing to Calby Wiki

This page complements the root [CONTRIBUTING.md](./../CONTRIBUTING.md). It focuses on Wiki‑specific contributions.

## Documentation updates

- When adding or changing a feature, update the relevant Wiki page(s).
- Keep writing style consistent with the rest of the Wiki (simple English, direct language, short paragraphs).
- Add or update diagrams, screenshots, or code examples as needed.
- Run `npm run build` to verify the Wiki pages still render correctly after Markdown changes.

## Pull requests

1. Create a separate branch for your Wiki changes (e.g., `docs/quick-voice-update`).
2. Make focused, self‑contained changes — ideally one page or a small set of related updates.
3. Run `npm run build` locally to check for Markdown errors.
4. Reference the relevant Wiki page in your pull request description.
5. Update the `_Sidebar.md` if the navigation structure changes.
6. Ensure the `_Footer.md` links remain valid.

## What to avoid

- Do not duplicate the entire root `CONTRIBUTING.md`; link to it instead.
- Do not add unsupported integrations or features that are not verified in the repository.
- Do not include real API keys, secrets, or credentials in any Wiki page.
- Do not create pages that duplicate content already in the README or other docs.

---

Contributions are welcome — please keep the documentation accurate, professional, and useful for both users and developers.

[Home](Home) · [Getting Started](Getting-Started.md) · [Quick Voice](Quick-Voice.md)