# Calby Release Checklist

> **Purpose:** Use this document before every Calby desktop release.
>
> **Core rule:** Build success is not release success. Test the actual packaged application on a clean machine and verify the complete user journey.

---

## 1. Release Information

- [ ] Version:
- [ ] Release date:
- [ ] Git commit:
- [ ] Git tag:
- [ ] Tested by:
- [ ] Release type: Alpha / Beta / Production

### Platforms

- [ ] Windows `.msi`
- [ ] macOS Intel `.dmg`
- [ ] macOS Apple Silicon `.dmg`
- [ ] Linux `.AppImage`
- [ ] Linux `.deb`

---

# 2. V1 Lessons / Problems Found

These are the important problems discovered after installing and testing the first packaged release.

## 2.1 Windows SmartScreen and Code Signing

### Observed

The MSI showed:

> Windows protected your PC

and:

> Publisher: Unknown publisher

The user had to click **Run anyway**.

### V2 Requirements

- [ ] Obtain an appropriate Windows code-signing certificate.
- [ ] Sign the Windows installer.
- [ ] Sign application binaries where appropriate.
- [ ] Verify the displayed publisher.
- [ ] Verify the digital signature.
- [ ] Test on a clean Windows machine.
- [ ] Check SmartScreen behavior.

**Acceptance:** The installer must not present an **Unknown publisher** experience.

> Note: signing does not guarantee that SmartScreen will never warn about a new application. The actual release artifact must be tested.

---

# 3. Professional Windows Installer

### Checklist

- [ ] Correct Calby name.
- [ ] Correct icon.
- [ ] Correct version.
- [ ] Correct publisher.
- [ ] Clear installation flow.
- [ ] Install location is understandable.
- [ ] Start Menu shortcut works.
- [ ] Desktop shortcut behavior is intentional.
- [ ] Installation finishes cleanly.
- [ ] Application can launch after installation.
- [ ] Uninstaller exists.
- [ ] Uninstallation works.
- [ ] Reinstallation works.
- [ ] Upgrade from an older version works.
- [ ] User data is not accidentally removed during upgrade.

### Target experience

```text
Installer
  -> Welcome
  -> Options / install location
  -> Install
  -> Finish
  -> Launch Calby
```

The exact number of screens can vary, but the installer should feel like a professional desktop product.

---

# 4. First Launch / Onboarding

## V1 Problem

The packaged application can open directly into the application and expose configuration errors immediately.

## V2 Goal

Use a proper first-launch experience:

```text
Welcome
  -> AI Provider
  -> API Key
  -> Microphone
  -> Google Calendar
  -> Ready
  -> Open Calby
```

### Checklist

- [ ] Welcome screen explains Calby briefly.
- [ ] User knows what to do next.
- [ ] AI provider setup is clear.
- [ ] API key input is secure.
- [ ] API key can be tested.
- [ ] API key is never shown after saving.
- [ ] Microphone setup is clear.
- [ ] Google Calendar setup is clear.
- [ ] User can skip optional setup.
- [ ] Setup can be completed later in Settings.
- [ ] Setup state persists after restart.
- [ ] Returning users do not see onboarding unnecessarily.
- [ ] Failed setup gives a useful next action.

---

# 5. Startup Error UX

## V1 Problem

The application can show:

> Calby AI is temporarily unavailable

immediately after opening.

The AI itself was tested and is working. The problem is the timing and presentation.

### V2 Requirements

- [ ] Do not show an AI failure card immediately on startup unless startup genuinely requires AI.
- [ ] Do not show an error before the user tries an AI action.
- [ ] Check configuration silently where possible.
- [ ] If AI is not configured, show setup guidance.
- [ ] Show availability errors only when the affected action is attempted.
- [ ] Keep technical details in logs, not the primary UI.
- [ ] Never expose raw API keys or sensitive configuration.

### Preferred behavior

Instead of an immediate technical error:

> AI setup isn't complete yet. Connect your AI provider in Settings.

---

# 6. AI Provider

## Current Status

AI was tested successfully.

Voice input was also tested successfully.

The remaining work is mainly configuration and user experience.

### Checklist

- [ ] Provider selection works.
- [ ] API key entry works.
- [ ] API key validation works.
- [ ] Invalid key gives a friendly message.
- [ ] Rate-limit errors are handled.
- [ ] Temporary provider failures are handled.
- [ ] AI still works after restart.
- [ ] Provider configuration persists securely.
- [ ] Secrets never appear in normal logs.
- [ ] Secrets never appear in error messages.
- [ ] Provider can be changed.
- [ ] API key can be replaced or removed.

---

# 7. Voice Input

## Current Status

Voice input works and the AI correctly understands and responds.

### Basic tests

- [ ] Short command.
- [ ] Long command.
- [ ] Fast speech.
- [ ] Slow speech.
- [ ] Pauses while speaking.
- [ ] Background noise.
- [ ] Multiple consecutive commands.
- [ ] Empty/no-speech input.
- [ ] Very short accidental input.

### Microphone types

- [ ] Built-in microphone.
- [ ] Bluetooth headset.
- [ ] USB microphone.
- [ ] Windows system default microphone.
- [ ] Microphone changed while Calby is running.
- [ ] Microphone disconnected while Calby is running.
- [ ] Microphone reconnected.
- [ ] Application restarted after microphone changes.

### Voice UX

- [ ] Listening state is obvious.
- [ ] Processing state is obvious.
- [ ] Speaking state is obvious.
- [ ] Transcript appears correctly.
- [ ] Empty audio does not create a fake request.
- [ ] Background audio does not repeatedly trigger actions.
- [ ] Intentional interruption works.
- [ ] Voice errors are friendly.
- [ ] Technical errors remain in logs.

---

# 8. Microphone Device Handling

## V1 Problem

The packaged application can show:

> Requested device not found

and:

> Selected microphone is unavailable

A saved microphone can become invalid when hardware changes.

### Required behavior

```text
Saved microphone
      |
      v
Does it still exist?
   /        YES       NO
 |          |
Use it    Use system default
            |
            v
     Friendly message if needed
```

### Checklist

- [ ] Saved device is validated before use.
- [ ] Missing device falls back safely.
- [ ] System default works.
- [ ] Bluetooth selection works.
- [ ] USB microphone selection works.
- [ ] Device refresh works.
- [ ] Reconnecting a device works.
- [ ] Changing device while app is open works.
- [ ] Restart preserves a valid selection.
- [ ] Invalid saved selection does not break voice.
- [ ] User can manually select another device.

---

# 9. Quick Voice

### Shortcut

- [ ] Windows/Linux: `Ctrl + Shift + C`
- [ ] macOS: `Cmd + Shift + C`
- [ ] Works while Calby is open.
- [ ] Works while Calby is minimized.
- [ ] Works while Calby is in the background.
- [ ] Works when Calby is not visible.
- [ ] Does not create multiple Quick Voice windows.

### Flow

```text
Shortcut
  -> Quick Voice opens
  -> Listening
  -> User speaks
  -> Thinking
  -> Action
  -> Response
  -> Quick Voice closes
```

### Checklist

- [ ] Opens quickly.
- [ ] Compact horizontal UI.
- [ ] Voice starts reliably.
- [ ] Transcript is visible.
- [ ] Action progress is understandable.
- [ ] Result is understandable.
- [ ] Closes after successful completion.
- [ ] Manual close works.
- [ ] Friendly error states.
- [ ] No duplicate AI session.

---

# 10. Google Calendar / OAuth

## V1 Problem

The packaged application showed:

> CONFIG_ERROR: Google Calendar OAuth Client ID is not configured.

Local development can work because the development environment contains the required configuration. A packaged application does not automatically receive local `.env` values.

## V2 architecture principle

Treat these as separate environments:

```text
Local development
    -> localhost OAuth flow

Desktop application
    -> desktop OAuth flow

Production website
    -> web OAuth flow
```

### Security

- [ ] No Google client secret hardcoded into the desktop application.
- [ ] Local configuration remains local.
- [ ] Production configuration is separate.
- [ ] Environment variables are documented.
- [ ] OAuth tokens are stored securely.

### OAuth flow

- [ ] Connect button works.
- [ ] Browser opens correctly.
- [ ] Google login works.
- [ ] Consent screen works.
- [ ] Redirect works.
- [ ] Calby receives the OAuth result.
- [ ] Tokens are stored securely.
- [ ] Calendar loads.
- [ ] Restart preserves authorization.
- [ ] Token refresh works.
- [ ] Disconnect works.
- [ ] Reconnect works.

### Mandatory clean-machine test

```text
Fresh Windows machine
  -> Install Calby
  -> Launch
  -> Connect Google Calendar
  -> Sign in
  -> Authorize
  -> Return to Calby
  -> Calendar loads
```

Do not mark OAuth release-ready based only on localhost testing.

---

# 11. Calendar Feature

- [ ] Calendar page opens.
- [ ] Current date is correct.
- [ ] Calendar navigation works.
- [ ] Upcoming events load.
- [ ] Empty calendar works.
- [ ] Events display correctly.
- [ ] Time zones are correct.
- [ ] Event creation works.
- [ ] Event update works.
- [ ] Event cancellation works.
- [ ] Collision detection works.
- [ ] Confirmation guards work.
- [ ] Calendar refresh works.
- [ ] Expired authorization gives a recovery path.
- [ ] Missing configuration does not create an ugly technical screen.

---

# 12. Offline / Online Behavior

## Online

- [ ] Online indicator is correct.
- [ ] AI actions work.
- [ ] Calendar actions work when configured.
- [ ] Voice works when configured.

## Offline

- [ ] Offline indicator appears.
- [ ] User understands why an online action cannot run.
- [ ] Technical network errors are not shown as the primary message.
- [ ] Local features remain usable.
- [ ] No repeated retry loop occurs.

## Reconnection

- [ ] Internet returns.
- [ ] Status becomes Online.
- [ ] AI works again.
- [ ] Calendar works again.
- [ ] User gets a clear recovery state if useful.

---

# 13. Permissions

- [ ] Microphone permission request is clear.
- [ ] Permission denial is handled.
- [ ] Retry works.
- [ ] Permission state survives restart.
- [ ] No unnecessary permissions are requested.
- [ ] Permission errors are friendly.

---

# 14. Security

- [ ] No API keys committed to Git.
- [ ] No API keys in logs.
- [ ] No OAuth tokens in logs.
- [ ] No secrets in screenshots.
- [ ] Sensitive configuration is encrypted where required.
- [ ] OAuth tokens are stored securely.
- [ ] Renderer cannot directly access privileged secrets.
- [ ] IPC input is validated.
- [ ] External URLs are validated.
- [ ] User data is not unnecessarily stored.
- [ ] Production secrets are not bundled into the client.
- [ ] Release artifacts contain no development secrets.

---

# 15. Electron / Desktop Security

- [ ] Context isolation reviewed.
- [ ] Node integration disabled in renderer where appropriate.
- [ ] Preload API is minimal.
- [ ] IPC handlers validate input.
- [ ] Navigation is controlled.
- [ ] External links open intentionally.
- [ ] DevTools are not accidentally exposed in production.
- [ ] Debug logging is reviewed.
- [ ] Production logs contain no sensitive information.

---

# 16. UI / UX Quality

- [ ] First launch feels polished.
- [ ] No unexpected error cards.
- [ ] No technical error strings shown to normal users.
- [ ] Buttons have clear actions.
- [ ] Loading states exist.
- [ ] Empty states exist.
- [ ] Error states exist.
- [ ] Success states exist.
- [ ] Disabled states are understandable.
- [ ] Keyboard shortcuts are discoverable.
- [ ] Settings are easy to find.
- [ ] Voice settings are easy to find.
- [ ] Microphone status is understandable.
- [ ] Online/offline status is understandable.
- [ ] Window resizing does not break layout.
- [ ] Text does not overflow.
- [ ] No accidental scrollbars.
- [ ] No debug UI remains.
- [ ] No placeholder text remains.
- [ ] No unfinished sections remain.

---

# 17. Animation / First Impression

### Goal

The packaged application should feel like a polished desktop product, not a development build.

- [ ] Startup transition is intentional.
- [ ] Main window opens smoothly.
- [ ] First-launch experience has subtle animation.
- [ ] Page transitions are consistent.
- [ ] Loading states have appropriate motion.
- [ ] Quick Voice opens smoothly.
- [ ] Quick Voice closes smoothly.
- [ ] Animations do not delay interaction.
- [ ] Reduced-motion behavior is considered.
- [ ] No excessive animation.

---

# 18. Desktop Packaging

## Windows

- [ ] `.msi` generated.
- [ ] Installer installs successfully.
- [ ] Installer is signed.
- [ ] Publisher is correct.
- [ ] Application launches.
- [ ] Uninstaller works.
- [ ] Upgrade works.
- [ ] Start Menu works.
- [ ] Shortcut works.

## macOS Intel

- [ ] `.dmg` generated.
- [ ] Application opens.
- [ ] Architecture verified.
- [ ] App is signed.
- [ ] Notarization configured where applicable.
- [ ] Gatekeeper behavior tested.
- [ ] Microphone tested.
- [ ] OAuth tested.
- [ ] Quick Voice tested.

## macOS Apple Silicon

- [ ] `.dmg` generated.
- [ ] Application opens.
- [ ] Architecture verified.
- [ ] Signing tested.
- [ ] Notarization tested.
- [ ] Voice tested.
- [ ] OAuth tested.

## Linux

- [ ] `.AppImage` generated.
- [ ] `.deb` generated.
- [ ] AppImage launches.
- [ ] `.deb` installs.
- [ ] App launches after installation.
- [ ] Uninstall works.
- [ ] Microphone tested.
- [ ] Quick Voice tested.

---

# 19. CI/CD

- [ ] CI workflow passes.
- [ ] Windows build passes.
- [ ] macOS Intel build passes.
- [ ] macOS ARM build passes.
- [ ] Linux build passes.
- [ ] Tests pass.
- [ ] Typecheck passes.
- [ ] Lint passes or known exceptions are documented.
- [ ] Artifacts are generated.
- [ ] Artifact names are correct.
- [ ] Version numbers are correct.
- [ ] GitHub Release is created.
- [ ] Release assets are uploaded.
- [ ] Release notes are published.

---

# 20. Website / Download Flow

- [ ] Production website loads.
- [ ] Production domain works.
- [ ] Download selector works.
- [ ] Windows MSI downloads.
- [ ] macOS Intel DMG downloads.
- [ ] macOS ARM DMG downloads.
- [ ] Linux AppImage downloads.
- [ ] Linux `.deb` downloads.
- [ ] Correct asset is downloaded.
- [ ] Download links point to the intended release.
- [ ] Latest release version is displayed.
- [ ] No unavailable build is advertised.

---

# 21. Vercel / Website Deployment

- [ ] Correct repository connected.
- [ ] Root Directory is correct.
- [ ] Framework Preset is `Next.js`.
- [ ] Build succeeds.
- [ ] Deployment is Ready.
- [ ] Production domain points to the correct deployment.
- [ ] Deployment URL works.
- [ ] Production domain works.
- [ ] No unexpected 404.
- [ ] Static assets load.
- [ ] Client interactions work.
- [ ] Download links work.
- [ ] No production console errors.
- [ ] Required environment variables exist.

### Important V1 Lesson

A Vercel deployment can show **Ready** while the public domain still returns a 404.

Therefore:

> **Never treat `Deployment: Ready` as proof that the website works. Always open and test the real production URL.**

---

# 22. Fresh-Machine Test

This is mandatory for a serious release.

Do not test only on the development machine.

```text
Fresh machine
  -> Download release
  -> Install
  -> Launch
  -> Onboarding
  -> AI provider
  -> Microphone
  -> Google Calendar
  -> Voice
  -> Calendar
  -> Quick Voice
  -> Restart
  -> Test again
```

### Checklist

- [ ] No development environment installed.
- [ ] No local `.env`.
- [ ] No source code.
- [ ] No development server.
- [ ] Installation succeeds.
- [ ] First launch succeeds.
- [ ] AI setup succeeds.
- [ ] Microphone setup succeeds.
- [ ] Google OAuth succeeds.
- [ ] Voice succeeds.
- [ ] Calendar succeeds.
- [ ] Quick Voice succeeds.
- [ ] Restart succeeds.
- [ ] Settings persist.
- [ ] No unexplained startup errors.

---

# 23. Regression Test

Before every release:

- [ ] Calendar still works.
- [ ] Reminders still work.
- [ ] Existing integrations still work.
- [ ] AI tool calling still works.
- [ ] Voice still works.
- [ ] Quick Voice still works.
- [ ] Notifications still work.
- [ ] Settings still work.
- [ ] Authentication still works.
- [ ] No new console/runtime errors.
- [ ] No new security warnings.

---

# 24. Final Smoke Test

## 10-Minute Test

- [ ] Launch Calby.
- [ ] Home loads.
- [ ] AI is available.
- [ ] Speak one command.
- [ ] Calby understands it.
- [ ] Calby responds.
- [ ] Create/check one calendar event.
- [ ] Open Settings.
- [ ] Check microphone.
- [ ] Trigger Quick Voice.
- [ ] Restart Calby.
- [ ] Repeat one AI command.
- [ ] Confirm no critical error.

If a critical item fails:

> **Do not publish the release.**

---

# 25. Severity Levels

## P0 — Release Blocker

Examples:

- Application does not start.
- Installer fails.
- AI cannot be used.
- Voice completely fails.
- OAuth completely fails.
- Calendar cannot connect.
- Critical security issue.
- Repeated application crashes.
- Corrupted release artifact.

**Action:** Do not release.

## P1 — Major

Examples:

- Quick Voice does not work.
- Microphone selection breaks.
- Major onboarding problem.
- Production website is broken.
- Important platform-specific feature fails.

**Action:** Fix before production release unless explicitly accepted.

## P2 — User Experience

Examples:

- Poor error message.
- Awkward animation.
- Confusing empty state.
- Unclear loading state.
- Installer needs polish.

**Action:** Fix before the next polished release.

## P3 — Minor

Examples:

- Small spacing issue.
- Minor visual inconsistency.
- Small copy improvement.

**Action:** Track for a future release.

---

# 26. Final Release Gate

Before publishing:

- [ ] Application builds.
- [ ] Tests pass.
- [ ] Packaging passes.
- [ ] Installer works.
- [ ] Signing is correct.
- [ ] First launch is clean.
- [ ] Onboarding works.
- [ ] AI works.
- [ ] Voice works.
- [ ] Microphone works.
- [ ] OAuth works.
- [ ] Calendar works.
- [ ] Quick Voice works.
- [ ] Offline behavior works.
- [ ] Online recovery works.
- [ ] Security review completed.
- [ ] Website works.
- [ ] Downloads work.
- [ ] Production domain works.
- [ ] Clean-machine test passes.
- [ ] Release artifacts verified.
- [ ] Release notes completed.

---

# 27. Release Notes

## What Changed

-

## What Was Tested

-

## Fixed Issues

-

## Known Issues

-

## Platforms Tested

-

## Installer Version

-

## Git Commit / Tag

-

## Release Decision

- [ ] Ready for release
- [ ] Release blocked
- [ ] Released with documented known issues

---

# 28. Core Rule

> **Build success is not release success.**

A release is successful only when the actual packaged application works for a user who:

- has never installed Calby before,
- does not have the development environment,
- does not have local environment variables,
- has a normal microphone,
- has normal internet access,
- needs to authorize Google Calendar,
- and installs Calby from the public release page.

This checklist exists so the same problems discovered in V1 are caught before V2, rather than after users download the application.
