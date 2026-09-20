# Calby — Product Foundation

# 1. Product Purpose

Calby is a personal desktop assistant designed to help users manage information, plans, and things they need to remember without manually managing everything.

# 2. Core Problem

Users have reminders, plans, calendar events, personal context, and important information scattered across different places or held in their memory. Managing these manually creates friction and increases the chance of forgetting or missing context.

# 3. Target User

The MVP is designed for an individual user who wants a simple desktop assistant for personal reminders, calendar awareness, personal memory, and voice-first interaction.

# 4. Core Product Loop

**Remember → Understand → Act**

- **Remember:** Calby stores reminders and useful personal memory.
- **Understand:** Calby interprets natural-language voice requests and relevant context.
- **Act:** Calby executes the required action through its local application capabilities.

# 5. MVP Features

1. **Voice Assistant** — Voice-first interaction with Calby.
2. **Smart Reminders** — Create and manage reminders using natural language.
3. **Offline Reminders & Notifications** — Store reminders locally and notify the user even when external services are unavailable.
4. **Calendar Understanding** — Connect and understand Google Calendar events.
5. **Personal Memory** — Remember useful user-provided information.
6. **Meeting Preparation** — Combine calendar context and relevant memory/information into a concise preparation brief.
7. **Settings & Privacy Controls** — Manage AI connection, voice, reminders/notifications, calendar, memory/privacy, general behavior, and app information.
8. **Desktop Experience** — System tray/background operation, desktop notifications, alarm behavior, and relevant connection/error states.

# 6. Feature Boundaries

| Feature | Included | Not Included in MVP |
| --- | --- | --- |
| Voice Assistant | Natural voice interaction and voice responses | General-purpose voice platform or open-ended automation marketplace |
| Smart Reminders | Natural-language reminder creation, scheduling, and management | Complex project/task-management system |
| Offline Reminders | Local persistence, desktop notifications, alarm, snooze/dismiss | Cloud-based reminder synchronization system |
| Calendar | Google Calendar connection and contextual understanding | Full calendar replacement or advanced calendar management |
| Personal Memory | Small, useful personal facts/preferences created primarily through interaction | Full notes app, knowledge base, document repository, or knowledge graph |
| Meeting Preparation | Concise prep brief using relevant calendar + memory context | Full meeting-management suite |
| Settings | Essential user controls and privacy controls | Advanced technical/AI configuration |
| Desktop Experience | Tray, background running, notifications, connection/error states | Multi-platform power-user customization suite |

# 7. Non-MVP / Out of Scope

- Location-based reminders
- WhatsApp, Telegram, and other messaging integrations
- Multiple AI providers
- Advanced AI model selection/configuration
- Prompt editor or AI playground
- Analytics dashboards
- Full notes/knowledge-base functionality
- Document management
- Advanced task/project management
- Complex automation marketplace
- Social or team collaboration features
- Billing/account-management system
- Unnecessary customization and technical controls

# 8. Product Principles

1. **Simple over feature-heavy** — Calby should solve a small set of important problems well.
2. **Voice-first** — Voice is a primary interaction method, not a decorative feature.
3. **Action-oriented** — Calby should help the user complete useful actions, not just chat.
4. **Context-aware** — Use relevant memory and calendar context when it improves the action.
5. **Clear boundaries** — Calby should not pretend to have performed an action that was not actually completed.
6. **User control** — Personal data, memory, notifications, and integrations remain controllable by the user.
7. **Low friction** — Common actions should require minimal manual management.
8. **Calm desktop experience** — The interface should remain professional, focused, and unobtrusive.

# 9. Voice Philosophy

Calby's voice interaction should feel natural, concise, and conversational.

Voice should be the fastest way to:

- Ask for information.
- Create or manage reminders.
- Save personal memory.
- Understand calendar context.
- Prepare for meetings.

Calby should avoid unnecessarily long spoken responses and should ask for clarification when essential information is missing.

# 10. AI vs Calby Responsibility

**Gemini / AI layer**

- Understand natural-language input.
- Interpret user intent.
- Decide which Calby capability/tool is required.
- Generate concise conversational responses.
- Use relevant context supplied by Calby.

**Calby application layer**

- Execute actions.
- Store reminders and memory locally.
- Schedule and trigger notifications/alarms.
- Manage desktop capabilities.
- Connect to and retrieve calendar data.
- Enforce application rules and permissions.
- Confirm whether an action actually succeeded.

**Core rule:** Gemini is the brain; Calby is the action layer.

# 11. Privacy Principles

1. Personal memory should be stored only when the user chooses to save it or when the product flow explicitly creates it.
2. The user must be able to view and clear stored memory.
3. The user controls whether memory is enabled.
4. API credentials and personal data should not be exposed unnecessarily to the renderer/UI.
5. Calby should clearly distinguish local application data from external-service data.
6. Integrations such as Google Calendar should be disconnectable by the user.
7. Calby should collect and expose only the information required for its MVP capabilities.

# 12. Final Scope Decision

**Calby MVP is frozen around one core promise:**

> Help the user remember important things, understand relevant personal context, and take useful actions through a simple voice-first desktop experience.
> 

The design and implementation process should remain within this scope. New features should not be added during the design phase unless they are necessary to support the core MVP workflow or a critical usability/security requirement.

**Foundation status: Ready for Step 2 — Feature Architecture.**