---
name: Calby Desktop
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363941'
  surface-container-lowest: '#0b0e15'
  surface-container-low: '#191b23'
  surface-container: '#1d1f27'
  surface-container-high: '#272a32'
  surface-container-highest: '#32353d'
  on-surface: '#e1e2ec'
  on-surface-variant: '#bdc8d1'
  inverse-surface: '#e1e2ec'
  inverse-on-surface: '#2d3038'
  outline: '#87929a'
  outline-variant: '#3e484f'
  surface-tint: '#7bd0ff'
  primary: '#8ed5ff'
  on-primary: '#00354a'
  primary-container: '#38bdf8'
  on-primary-container: '#004965'
  inverse-primary: '#00668a'
  secondary: '#b4c5ff'
  on-secondary: '#002a78'
  secondary-container: '#0053db'
  on-secondary-container: '#cdd7ff'
  tertiary: '#c7c8ff'
  on-tertiary: '#1000a9'
  tertiary-container: '#a7a9ff'
  on-tertiary-container: '#2b29bb'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c4e7ff'
  primary-fixed-dim: '#7bd0ff'
  on-primary-fixed: '#001e2c'
  on-primary-fixed-variant: '#004c69'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#10131a'
  on-background: '#e1e2ec'
  surface-variant: '#32353d'
  canvas-base: '#0A0D14'
  surface-subtle: '#0F1420'
  surface-card: '#151C2C'
  surface-overlay: '#1E273D'
  border-subtle: '#1E293B'
  border-strong: '#334155'
  text-primary: '#F8FAFC'
  text-secondary: '#94A3B8'
  text-muted: '#64748B'
  calby-glow: rgba(56, 189, 248, 0.15)
  status-success: '#10B981'
  status-warning: '#F59E0B'
  status-error: '#EF4444'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.5rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
---

## Brand & Style

Calby is a calm, focused, personal desktop voice-first assistant engineered to reduce cognitive load. The UI embodies thoughtful minimalism blended with subtle dark glassmorphic depth—avoiding aggressive neon futurism or over-dense SaaS paradigms in favor of an intentional, quiet presence. 

The aesthetic is anchored by deep navy and obsidian canvas layers, crisp 1px structural outlines, restrained cyan/blue luminous accents, and a focused dynamic voice-orb presence. Every surface prioritizes legibility, spatial calm, and unambiguous feedback across the core loop: **Remember → Understand → Act**.

## Colors

The palette is tuned specifically for focused desktop environments, providing deep black-navy surfaces that eliminate eye strain while preserving crisp hierarchy. 

- **Primary (`#38BDF8`)**: Calby Cyan—reserved for active voice interaction cues, focused input states, and primary micro-indicators.
- **Secondary (`#2563EB`)**: Technical action blue—applied to solid button fills and completed status markers.
- **Tertiary (`#6366F1`)**: Soft indigo-accent used for calendar context and contextual memory tags.
- **Neutral Surface Hierarchy**:
  - `canvas-base` (`#0A0D14`): App background and titlebar.
  - `surface-subtle` (`#0F1420`): Sidebars and secondary utility panes.
  - `surface-card` (`#151C2C`): Interactive cards, list containers, and popovers.
  - `surface-overlay` (`#1E273D`): Elevated dialogs, dropdowns, and flyout menus.
- **Borders & Separation**: Strict 1px borders using `#1E293B` for default card boundaries and `#334155` for active/hover states.
- **Accessibility**: All text hierarchy pairings (`#F8FAFC` and `#94A3B8` against surface tokens) strictly exceed WCAG AA 4.5:1 contrast requirements.

## Typography

Typography prioritizes rapid desktop scanning and optimal legibility at arm's-length monitor distances. Built on **Inter**, the scale employs tight tracking on headers for a refined editorial feel, and relaxed line heights on conversational and transcription streams.

- **Headline Hierarchy**: Reserved for major page targets, voice status greetings, and modal titles. Never bloated; desktop sizes cap at `32px` to prevent layout overwhelming.
- **Body Hierarchy**: `body-md` (14px) serves as the system default for reminder descriptions, memory notes, and setting controls. `body-lg` (16px) is dedicated to voice response dialogue and natural language query input.
- **Labels & Badges**: Monospace numerals (`JetBrains Mono`) for time stamps, duration counters, and shortcut keys.

## Layout & Spacing

Calby employs a fluid, modular grid tailored for compact desktop viewports (minimum 800x600, standard 1024x720, expanded 1280x800). The layout uses a persistent 64px left-hand utility navigation strip, a fluid master panel, and contextual slide-over inspectors.

- **Grid & Alignments**: 8pt structural rhythm. Inner padding within cards uses `space-md` (12px) or `space-lg` (16px) to maintain a compact, native desktop feel without excessive mobile whitespace.
- **Desktop Windowing**: Margins stay tight at `1.5rem` (`24px`), with integrated title bar drag regions that transition smoothly into primary workspace content.

## Elevation & Depth

Visual hierarchy relies on tonal layering and luminous containment rather than high-contrast dropshadows:

- **Layer 0 (Canvas)**: `#0A0D14` background base.
- **Layer 1 (Card & Group Container)**: `#151C2C` with a 1px border (`#1E293B`).
- **Layer 2 (Floating & Modals)**: `#1E273D` with crisp border (`#334155`) paired with a diffused ambient shadow: `0 12px 32px -4px rgba(0, 0, 0, 0.6)`.
- **Luminous Glows**: Used exclusively for dynamic feedback (e.g., Voice Orb interaction): `0 0 24px rgba(56, 189, 248, 0.15)`. Active processing emits subtle radial gradients without obscuring surrounding content.

## Shapes

The interface balances soft, approachable corners with desktop-native structure:
- **Base Components (Inputs, Buttons, Cards)**: `8px` (`rounded-lg`) to `12px` (`rounded-xl`).
- **Overlays, Panels, and Modals**: `16px` (`rounded-2xl`).
- **Status Pills, Event Chips, and Orb Indicators**: Full pill radius (`9999px`).
- **Border Insets**: 1px inner keylines are always matched to container radii for clean geometry.

## Components

### Voice Orb Interaction Component
The central status focal point of the desktop UI. Sized at 72px (compact) or 120px (home canvas):
- **Idle**: Deep navy core (`#151C2C`) with a subtle 1px border (`#1E293B`) and faint Calby Cyan pulse every 4s.
- **Listening**: Calby Cyan core (`#38BDF8`) with active dual-layer ambient ring expansion (`calby-glow`).
- **Processing**: Smooth gradient spin between `#38BDF8` and `#2563EB` with subtle 2Hz breathing animation.
- **Responding**: Symmetrical waveform oscillation along the horizontal axis in `#38BDF8`.
- **Interrupted / Error**: Immediate transition to `#EF4444` halo with instant dampening.

### Buttons & Icon Buttons
- **Primary**: Solid `#2563EB` background, `#F8FAFC` text, hover at `#1D4ED8`. Active downscale of 0.98 for tactile feedback.
- **Secondary / Ghost**: `#151C2C` with 1px `#1E293B` border, text `#94A3B8`, hover border `#334155` and text `#F8FAFC`.
- **Icon Button**: Fixed 32x32px or 36x36px with 8px radius. Centered 16px SVG stroke icons.

### Inputs & Natural Language Command Bar
- **Natural Language Bar**: Prominent 48px height, `#0F1420` surface, 1px `#1E293B` border, 12px radius. Left-aligned mic trigger, right-aligned keyboard shortcut badge (`⌘K`). Focus ring: 1px `#38BDF8` with subtle glow.
- **Standard Input**: 36px height, `#0A0D14` inner fill, 1px `#1E293B` border, text `#F8FAFC`.

### Cards & List Items (Reminders, Calendar, Memory)
- **Reminder Item**: Row layout with custom checkbox (18px rounded-md), priority indicator dot, title, and relative time badge.
- **Calendar Event Chip**: Left-bordered indicator (3px accent bar in `#6366F1` or `#38BDF8`), showing start/end time and location.
- **Memory Item**: Compact card format containing verified memory snippet, contextual source tag (e.g., "From Voice"), and quick delete action visible on row hover.

### System Indicators & Desktop Modals
- **Connection Banner**: Small pill at top right: green dot (`Online`), amber dot (`Reconnecting`), red dot with reconnect trigger button (`Offline`).
- **Desktop Notification / Alarm Toast**: Slide-in from top-right desktop boundary. Deep `#1E273D` container, 1px `#334155` border, actionable inline "Dismiss" and "Snooze 5m" buttons.