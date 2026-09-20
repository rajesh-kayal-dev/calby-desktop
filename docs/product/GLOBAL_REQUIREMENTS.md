# Calby Global Product Requirements

##### [**Undermind**](https://undermind.ai)

---


## Table of Contents

- [Calby — Global Product Requirements](#calby-global-product-requirements)
  - [Purpose](#purpose)
  - [1. Simplicity and Focus](#simplicity-and-focus)
  - [2. Voice-First Interaction](#voice-first-interaction)
  - [3. Conversational Error Recovery](#conversational-error-recovery)
  - [4. Clear System Feedback](#clear-system-feedback)
  - [5. User Control and Agency](#user-control-and-agency)
  - [6. Privacy and Transparency](#privacy-and-transparency)
  - [7. AI Identity and Trust](#ai-identity-and-trust)
  - [8. Notifications and Attention](#notifications-and-attention)
  - [9. Consistent Cross-Feature Experience](#consistent-cross-feature-experience)
  - [10. Context-Aware Behavior](#context-aware-behavior)
  - [11. Action Reliability](#action-reliability)
  - [12. Accessibility and Desktop Usability](#accessibility-and-desktop-usability)
  - [13. Product States](#product-states)
  - [14. Design Consistency Rules](#design-consistency-rules)
  - [15. Scope Protection](#scope-protection)
  - [16. Evidence Notes](#evidence-notes)
  - [Final Requirement](#final-requirement)
  - [References](#references)

# Calby — Global Product Requirements

## Purpose

These requirements define the rules that apply across the entire Calby product. They are derived from Calby’s product foundation and relevant human-computer interaction research.

## 1. Simplicity and Focus

- Keep Calby focused on reminders, calendar context, personal memory, voice interaction, and useful desktop actions.
- Prefer the simplest interaction that completes the user’s intended task.
- Do not introduce UI, settings, workflows, or technical controls that do not support an important user need.
- Keep routine actions low-friction.

## 2. Voice-First Interaction

- Voice must remain a primary interaction method throughout the product.
- Calby should support natural turn-taking and avoid making users follow rigid command syntax.
- Responses should generally be concise, especially for action-oriented requests. \[Haa22\]
- Calby should make the current interaction state understandable to the user.
- Users should be able to recover from misunderstandings without restarting the entire interaction.

## 3. Conversational Error Recovery

- When Calby misunderstands a request, it should acknowledge the problem and help the user correct it.
- Do not perform unnecessary correction or confirmation when the system already understood the request correctly.
- Error states should explain what went wrong and provide a clear next action when appropriate. \[Cua21\]
- Calby must never claim that an action succeeded unless the application confirms the result.

## 4. Clear System Feedback

- Every important user action should produce understandable feedback.
- Feedback should distinguish between:
  - understood but not yet executed,
  - executing,
  - completed successfully,
  - failed,
  - unavailable,
  - requiring clarification.
- The interface should not leave the user guessing whether Calby heard, understood, or completed a request.

## 5. User Control and Agency

- The user must remain in control of reminders, memory, integrations, notifications, and personal data.
- Actions with meaningful consequences should have appropriate confirmation or an easy recovery path.
- Calby should not silently make important changes based on uncertain intent.
- The product should make user-controlled options easy to find without exposing unnecessary technical complexity.

## 6. Privacy and Transparency

- Calby should clearly communicate what personal information is stored and why it is used.
- Users should be able to view and manage stored memory.
- Users should be able to disable memory and clear stored memory.
- External integrations should be explicitly connected and disconnectable.
- Calby should avoid exposing personal information in unnecessary UI surfaces.
- Privacy controls should be understandable and available in the product itself rather than relying only on external consent mechanisms. \[Hen21\]
- For conversational systems, transparency around stored information and data access should be treated as a product requirement, not merely a policy document. \[Hen21, Huy23\]

## 7. AI Identity and Trust

- Calby should remain clear that it is an AI assistant.
- The product should avoid creating misleading impressions about what the AI knows, has done, or can access.
- Trust should come from transparent behavior, observable results, and appropriate system feedback rather than from anthropomorphic presentation alone. \[Huy23\]

## 8. Notifications and Attention

- Notifications should be relevant, timely, and actionable.
- Avoid unnecessary interruption and notification noise.
- Provide user controls for notification sound, desktop notifications, alarm behavior, and related preferences.
- Allow the user to dismiss or snooze reminders easily.
- Do not assume that every notification should interrupt the user immediately.
- Notification behavior should preserve user control because interruption preferences are highly individual. \[Meh20, Li22\]

## 9. Consistent Cross-Feature Experience

- Home, Reminders, Calendar, Memory, Settings, notifications, and system-tray behavior must feel like one product.
- Use shared interaction patterns for buttons, forms, modals, confirmations, errors, success feedback, and navigation.
- Reuse the same terminology across screens.
- A feature should not invent its own interaction model when an established Calby pattern already exists.

## 10. Context-Aware Behavior

- Calby should use relevant calendar and memory context when it improves the user’s request.
- Context should be relevant to the current task rather than indiscriminately surfaced.
- The product should make contextual behavior understandable when it materially affects an action or response.
- Context-aware features must respect memory and privacy controls.

## 11. Action Reliability

- AI intent interpretation and application execution must remain separate responsibilities.
- The AI may decide which capability is needed; Calby must execute and verify the action.
- Tool calls should have explicit success/failure results.
- Failed actions must be recoverable where practical.
- External service failures must not be represented as successful completion.

## 12. Accessibility and Desktop Usability

- Core actions should remain understandable without relying only on visual effects.
- Important states should have clear text or semantic feedback.
- Keyboard-accessible paths should exist for important desktop actions where practical.
- The interface should remain usable at normal desktop window sizes without requiring unnecessary scrolling or dense information displays.
- Motion and visual effects should support understanding rather than distract from the task.

## 13. Product States

Calby should define consistent patterns for:

- Default
- Listening
- Processing
- Responding
- Action in progress
- Success
- Error
- Offline / unavailable
- Permission required
- Reconnect
- Empty state
- Confirmation
- Disabled state

## 14. Design Consistency Rules

- Maintain one visual language across all seven design phases.
- Use the same design system tokens and reusable components wherever possible.
- Prefer calm, professional desktop UI over decorative or futuristic UI.
- Voice interaction may be more expressive than utility screens, but it must remain part of the same visual system.
- Empty space is preferable to invented functionality.

## 15. Scope Protection

- New ideas should be evaluated against the frozen MVP before being added.
- Do not expand Calby into a generic AI assistant platform during MVP design.
- Location reminders, messaging integrations, multiple AI providers, advanced AI configuration, analytics dashboards, full knowledge-base functionality, and other explicitly excluded capabilities remain out of scope unless the product scope is intentionally reopened.

## 16. Evidence Notes

Research supports several of these requirements:

- Concise voice responses can be perceived as more efficient for command-oriented interaction. \[Haa22\]
- Conversational repair after genuine errors can improve assessment of voice assistants. \[Cua21\]
- Personalized conversational agents need mechanisms for transparency and user control over stored personal information. \[Hen21\]
- Transparency can be implemented as an interaction property rather than relying only on external policy or consent. \[Huy23\]
- Notification systems should account for timing and interruption preferences rather than assuming all alerts should be delivered immediately. \[Meh20, Li22\]

## Final Requirement

Every future Calby design and implementation decision should satisfy this question:

> Does this make Calby simpler, clearer, more trustworthy, more controllable, or more useful for the core Remember → Understand → Act workflow?

If not, it should not be added to the MVP without a deliberate scope decision.

---

## References

\[Haa22\] G. Haas, M. Rietzler, M. Jones, and E. Rukzio, *Keep it Short: A Comparison of Voice Assistants’ Response Behavior*. 2022. doi: [10.1145/3491102.3517684](https://doi.org/10.1145/3491102.3517684).

\[Cua21\] A. Cuadra, S. Li, H. Lee, J. Cho, and W. Ju, “My Bad! Repairing Intelligent Voice Assistant Errors Improves Interaction,” *Proceedings of the ACM on Human-Computer Interaction*, vol. 5, pp. 1–24, Apr. 2021, doi: [10.1145/3449101](https://doi.org/10.1145/3449101).

\[Hen21\] I. Hendrickx, J. V. Waterschoot, A. Khan, L. T. Bosch, C. Cucchiarini, and H. Strik, “Take Back Control: User Privacy and Transparency Concerns in Personalized Conversational Agents,” *IUI Workshops*, 2021.

\[Huy23\] T. D. Huynh, W. Seymour, L. Moreau, and J. Such, “Why Are Conversational Assistants Still Black Boxes? The Case For Transparency,” *Proceedings of the 5th International Conference on Conversational User Interfaces*, Jun. 2023, doi: [10.1145/3571884.3604319](https://doi.org/10.1145/3571884.3604319).

\[Meh20\] A. Mehrotra and M. Musolesi, “Intelligent Notification Systems,” Jan. 03, 2020. doi: [10.2200/s00965ed1v01y201911mpc014](https://doi.org/10.2200/s00965ed1v01y201911mpc014).

\[Li22\] T. Li, J. Haines, M. F. R. D. Eguino, J. I. Hong, and J. Nichols, “Alert Now or Never: Understanding and Predicting Notification Preferences of Smartphone Users,” *ACM Transactions on Computer-Human Interaction*, vol. 29, pp. 1–33, Feb. 2022, doi: [10.1145/3478868](https://doi.org/10.1145/3478868).
