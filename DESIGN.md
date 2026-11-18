---
name: RescueRoom
description: Live Field Equipment Emergency Dispatch & Diagnostics Platform
colors:
  primary: "#E4421E"
  hazard: "#F2B705"
  teal: "#1F6F68"
  dark-panel: "#14201F"
  ink: "#1C1B18"
  bone: "#EFE8D8"
  paper-light: "#F7F3E9"
  paper-muted: "#E2DAC4"
  paper-dark: "#D4C9AF"
  ink-muted: "#535048"
  ink-subtle: "#847F74"
  white: "#FFFFFF"
  cad-bg: "#0F1A1C"
  cad-grid: "rgba(0, 255, 200, 0.06)"
  cad-stroke: "rgba(120, 200, 220, 0.6)"
  cad-stroke-accent: "rgba(120, 200, 220, 0.85)"
  cad-fault: "#EF4444"
  cad-nominal: "#34D399"
  cad-active: "#0EA5E9"
typography:
  display:
    fontFamily: "Bricolage Grotesque, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Bricolage Grotesque, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Bricolage Grotesque, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.02em"
  body:
    fontFamily: "Bricolage Grotesque, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "0.01em"
  label:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "0.85rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.06em"
rounded:
  none: "0px"
spacing:
  2xs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-action-hazard:
    backgroundColor: "{colors.hazard}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "10px 18px"
  button-action-hazard-hover:
    backgroundColor: "{colors.hazard}"
  button-standard:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "10px 18px"
  button-standard-hover:
    backgroundColor: "{colors.bone}"
  button-resolution-teal:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.bone}"
    rounded: "{rounded.none}"
    padding: "10px 18px"
  button-critical-vermilion:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.bone}"
    rounded: "{rounded.none}"
    padding: "10px 18px"
  button-emergency:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    padding: "24px 20px"
  card-paper:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "20px"
---

# Design System: RescueRoom

## Overview

**Creative North Star: "The Grease-Stained Workshop Manual"**

RescueRoom's visual design system rejects the polished, sterile cliches of modern cloud SaaS in favor of a rugged, tangible field-grade reality. The interface simulates a physical heavy equipment service binder paired with a battle-hardened two-way radio dispatch console. Every surface feels like weather-beaten cardstock stamped with indelible carbon ink, punctuated by high-visibility industrial warning signals.

The aesthetic prioritizes high-stakes legibility in intense outdoor conditions—such as direct sunlight on tablet screens, gloved operational inputs, and high-vibration equipment cabins. Components are flat-by-default with unyielding, zero-blur mechanical drop shadows and tactile physical depression on interaction. Digital abstractions like glassmorphism, rounded pill buttons, and soft gradient halos are strictly avoided; instead, the physical reality of mechanical switches, rubber stamps, caution hazard tape, and vector CAD schematics governs the entire sensory landscape.

**Key Characteristics:**
- **Zero-Radius Mechanical Integrity**: Absolutely every border corner is strictly 90° (`border-radius: 0px`).
- **Tactile Ink Elevation**: Solid, hard-offset carbon ink shadows with zero blur that compress mechanically on press.
- **Physical Document Artifacts**: Interactive components behave like workshop tickets, physical requisition sheets, calibration watermarks, and stamped authorizations.
- **Kinetic Escalation Contrast**: Calm bone cardstock accelerates into high-visibility hazard amber for operational movement, and industrial vermilion for emergency alerts.

---

## Colors

The color palette is grounded in the physical materials of a heavy machinery maintenance bay: aged technical documentation, carbon ink stamps, safety warning paint, tactical instrument panels, and oxidised workshop seals.

### Approved Semantic Action & Role Hierarchy

1. **Caution Hazard Amber (`#F2B705`) — Primary Operational Workflow Action**:
   - The designated primary high-visibility action color across all consoles.
   - Applied to forward-advancing operational workflow buttons (`.btn-hazard`), including:
     - `OPEN DISPATCH ROOM →` (Triage Board)
     - `AUTHORIZE STATION` (Login Page)
     - `SWITCH USER` (Navbar)
     - `📸 CAMERA` and `📁 ATTACH` (Plate uploads)
     - `COPY P/N` (OEM parts manifest)
     - `🖨 PRINT / EXPORT PDF` (Service Report)
2. **Weathered Bone Paper (`#EFE8D8`) — Standard & Secondary Actions**:
   - Normative paper background for the entire application canvas.
   - Default styling for secondary, neutral, and exploratory actions (`.btn`), including:
     - Inspection toggles (`▼ BLUEPRINT & GAUGES`)
     - Filter chips, cancellation buttons, and auxiliary dialog controls.
3. **Industrial Vermilion (`#E4421E`) — Emergency & Critical Actions Only**:
   - Non-negotiable emergency signal. Strictly quarantined from routine workflow actions.
   - Reserved exclusively for:
     - The catastrophic emergency trigger (`.btn-emergency`: `⚠ SOMETHING'S WRONG`) on `/operator`.
     - Critical transmission confirmation (`.btn-vermilion`: `TRANSMIT EMERGENCY DISPATCH →`).
     - Severe failure alerts, redline hydraulic alarms, and active call termination (`✕ END CALL`).
4. **Oxidised Teal Ink (`#1F6F68`) — Resolution & Successful Verification**:
   - The indelible mark of completed mechanical work and safe operational sign-off.
   - Reserved for:
     - Affirmative resolution triggers (`.btn-teal`: `✓ RESOLVE INCIDENT`).
     - Animated physical rubber stamp slam (`.stamped-resolved-seal`).
     - Navigational handoff to final report (`📄 VIEW SERVICE REPORT →`).
     - Online responder presence dots (`.presence-dot`).
5. **Heavy Carbon Ink (`#1C1B18`) — Structural Boundaries & Density**:
   - The primary structural ink. Used for all container borders (`2px`/`3px solid #1C1B18`), typography, and mechanical zero-blur drop shadows. Anchors all interfaces with typewriter solidity.
6. **Tactical Dark Panel (`#14201F`) — Technical Operational Panels**:
   - High-density night/radio substrate reserved exclusively for:
     - Two-way tactical voice radio oscilloscope visualizers.
     - Optical video streams and hardware mute toggles (`.btn-dark`).
     - Equipment CAD blueprint background canvas (`#0F1A1C`).

### Neutral Supporting Paper Shades
- **Light Workshop Paper** (`#F7F3E9`): Nested container fill, requisition form cardstock, and metric tiles.
- **Muted Paper Shade** (`#E2DAC4`): Background for neutral stamp badges, offline indicators, and secondary dividers.
- **Carbon Muted** (`#535048`): Monospace secondary metadata, field labels, and subordinate serial timestamps.
- **Carbon Subtle** (`#847F74`): Hairline dividers and dashed ledger borders.
- **Pure White** (`#FFFFFF`): Reserved for active input backgrounds and emergency button text.

### CAD Blueprint & Vector Telemetry Palette
Standardized tokens extracted from the interactive vector CAD blueprint engine:
- **`--cad-bg-blueprint`**: `#0F1A1C` — Dark tactical blueprint canvas substrate.
- **`--cad-grid-line`**: `rgba(0, 255, 200, 0.06)` — 20px × 20px orthogonal blueprint grid lines.
- **`--cad-stroke-structure`**: `rgba(120, 200, 220, 0.45)` to `rgba(120, 200, 220, 0.65)` (1.8px–2.5px) — Equipment outlines (tracks, cab, boom arm).
- **`--cad-stroke-accent`**: `rgba(120, 200, 220, 0.85)` (3.0px) — Main boom hydraulic linkages and pivot joints.
- **`--cad-fill-hull`**: `rgba(20, 40, 45, 0.4)` — Machine chassis, cab body, and track undercarriage fills.
- **`--cad-window-stroke`**: `rgba(0, 255, 200, 0.6)` — Operator cab glass boundary.
- **`--cad-window-fill`**: `rgba(0, 255, 200, 0.1)` — Operator cab glass tint.
- **`--cad-fault-line`**: `#EF4444` / `#E4421E` (3.5px stroke) — Failed hydraulic line or component indicator.
- **`--cad-nominal-line`**: `#34D399` / `#1F6F68` (3.5px stroke) — Cleared or nominal subsystem stroke.
- **`--cad-node-active`**: `#0EA5E9` (Tactical cyan) — Interactive subsystem hit targets.
- **`--cad-node-selected`**: `#F2B705` (Hazard amber) — Currently inspected subsystem label and marker.

### Named Rules
**The Action vs. Hazard Distinction Rule.** Hazard Amber (`#F2B705`) is the approved primary operational workflow action color, but must NEVER be used indiscriminately for all warning notifications. Routine workflow triggers (e.g. *Open Dispatch Room*, *Print Report*) must be distinguished from actual safety hazard states through explicit action verbs, distinct icons, and dedicated severity stamps (`.stamp-serious`).

**The Rarity of Vermilion Rule.** Industrial Vermilion (`#E4421E`) is restricted to critical failures, emergency dispatches, and life-safety escalations. Routine navigation or operational progression must never consume Vermilion. When everything screams emergency, nothing is heard.

**The No-Glass Rule.** Translucent glassmorphism, backdrop filters, and gradient fades are banned. If content requires separation, give it a solid bone or dark paper panel and an ink boundary.

---

## Typography

The typography implements a strict bifurcation between human structural commands and machine-read technical telemetry.

**Display Font:** `Bricolage Grotesque` (fallback: `-apple-system, BlinkMacSystemFont, sans-serif`)  
**Body Font:** `Bricolage Grotesque` (fallback: `sans-serif`)  
**Label/Mono Font:** `IBM Plex Mono` (fallback: `monospace`)  

### Typographic Division of Responsibility

1. **Bricolage Grotesque (Human Structural & Action Layer)**:
   - Structural headings (`h1` through `h6`) and page mastheads.
   - Section titles, station headers, and column banners.
   - User-facing descriptive body copy, operator incident descriptions, and technician narrative comments.
   - Physical action button labels (`.btn`, `.btn-emergency`, `.btn-hazard`, `.btn-teal`).
2. **IBM Plex Mono (Machine Telemetry & Technical Artifact Layer)**:
   - Dynamic CAN-bus sensor readouts (PSI, Oil Temp °C, Engine RPM, Radio MHz).
   - Live counting downtime clocks (`.timer-display`) and military UTC timestamps.
   - Machine identifiers (`EX-204`, `BD-801`, `HT-310`, `FL-90`) and incident serial numbers (`INC-8802`).
   - Technical form inputs, requisition textareas, and part numbers (`P/N 1R-0716`).
   - Stamped status badges (`.stamp`, `.badge-code`), unread pill counters, and signature ledger entries.

### Hierarchy
- **Display** (Bricolage Grotesque, 800 weight, `2.5rem`, `line-height: 1.1`, `-0.03em` letter-spacing, uppercase): Brand masthead, full-screen emergency alerts, and login station titles.
- **Headline** (Bricolage Grotesque, 700 weight, `1.75rem`, `line-height: 1.15`, `-0.02em` letter-spacing, uppercase): Station headers, report titles, and triage board column banners.
- **Title** (Bricolage Grotesque, 700 weight, `1.25rem`, `line-height: 1.2`, `0.02em` letter-spacing, uppercase): Card headings, sub-panel titles, and CAD blueprint drawer headers.
- **Body** (Bricolage Grotesque, 600 weight, `0.95rem`, `line-height: 1.45`, `0.01em` letter-spacing): Descriptive text, operator fault descriptions, and technician dispatch notes.
- **Action Label** (Bricolage Grotesque, 700–800 weight, `0.95rem`–`1.6rem`, `0.03em`–`0.08em` letter-spacing, uppercase): Button action triggers.
- **Technical Readout / Gauges** (IBM Plex Mono, 700 weight, `1.1rem`–`1.8rem`, `line-height: 1.2`): CAN-bus live readouts, PSI alarms, and downtime timers.
- **Label / Stamp** (IBM Plex Mono, 600–700 weight, `0.75rem`–`0.85rem`, `line-height: 1.3`, `0.06em`–`0.08em` letter-spacing, uppercase): Form field labels, UTC timestamps, serial codes, part numbers, and physical stamp text.
- **Subordinate Metadata** (IBM Plex Mono, 400–500 weight, `0.68rem`–`0.78rem`, uppercase): Unread counters, system version tags, and ledger timestamps.

### Named Rules
**The Two-Voice Rule.** `Bricolage Grotesque` in uppercase is used exclusively for structural titles, user directives, body copy, and physical action triggers. `IBM Plex Mono` is used exclusively for machine telemetry, sensor readouts, timestamps, ticket codes, and part numbers. The two never exchange roles.

**The Military Timestamp Rule.** All event logs, chat ticker messages, and system audits must render timestamps in uppercase monospace UTC (`HH:MM:SS UTC · MMM DD, YYYY`).

---

## Layout

RescueRoom employs a rigid spatial grid structured like an industrial control console, maintaining tactile density without sacrificing scanability.

### Verified Route Structure
- `/login`: Station Authorization & Fleet Selector (`LoginPage.jsx`).
- `/operator`: Operator Emergency Dispatch Station (`OperatorPage.jsx`).
- `/board`: Multi-severity Triage Board with counting downtime timers (`TriageBoardPage.jsx`).
- `/room/:guid`: Kinetic Escalation Dispatch Room with chat, voice radio, video, CAD telemetry HUD, and AI scanner (`RoomPage.jsx`).
- `/report/:guid`: Printable Workshop Service Report `FORM-RR-808` (`ServiceReportPage.jsx`).

### Grid & Responsive Breakpoints (Verified in Code)
- **Desktop Grid (> 1080px)**:
  - Incident Room (`.room-layout-grid`): 3 columns (`150px` escalation ladder rail, `1fr` interactive workspace/chat, `300px` telemetry HUD/participants).
  - Triage Board: 3 fixed severity columns (`CRITICAL`, `SERIOUS`, `MINOR`).
  - Viewport Watermark: `12px` solid technical calibration border (`rgba(28, 27, 24, 0.04)`) around the entire viewport via `body::before`.
- **Tablet Layout (768px – 1080px)**:
  - Enforced via `@media (max-width: 1080px)`.
  - `.room-layout-grid` collapses from 3 columns to 2 columns (`140px` left rail, `1fr` workspace with stacked telemetry panels).
- **Mobile Layout (< 768px)**:
  - Enforced via `@media (max-width: 768px)`.
  - `.room-layout-grid` collapses to single column (`1fr`).
  - `.report-sheet` padding reduces from `40px` to `20px`.
  - `h1` decreases from default to `1.8rem`.
- **Print Layout (`@media print`)**:
  - Hides non-printable chrome: `nav, footer, .no-print, button, .btn { display: none !important; }`.
  - Background resets to pure `#FFFFFF`, text to `#000000`, removes `body::before` watermark.
  - `.report-sheet` border sets to `2px solid #000000`, shadow removed, `page-break-inside: avoid` enforced on ledger items and metric tiles.

### Spacing Scale
Grounded strictly in an 8px base system:
- `var(--space-2xs)`: `4px`
- `var(--space-xs)`: `8px`
- `var(--space-sm)`: `12px`
- `var(--space-md)`: `16px`
- `var(--space-lg)`: `24px`
- `var(--space-xl)`: `32px`
- `var(--space-2xl)`: `48px`

---

## Elevation & Depth

Depth in RescueRoom is completely mechanical and structural. Soft ambient Gaussian shadows are forbidden; elevation is expressed through solid, zero-blur carbon ink offset shadows and physical state displacement.

### Shadow Vocabulary (All Zero-Blur)
- **Small Offset (`--shadow-hard-sm`)**: `2px 2px 0px #1C1B18` — Focus states for text inputs, small badges, unread pills.
- **Base Offset (`--shadow-hard`)**: `3px 3px 0px #1C1B18` — Standard rest elevation for cards, triage tickets, and default buttons.
- **Large Offset (`--shadow-hard-lg`)**: `5px 5px 0px #1C1B18` — Button hover state, elevated tactical panels, and floating modals.
- **Emergency Offset (`--shadow-hard-xl`)**: `8px 8px 0px #1C1B18` — Catastrophic action elements (`.btn-emergency`) and physical service report sheets.
- **Pressed Offset (`--shadow-hard-pressed`)**: `1px 1px 0px #1C1B18` — Active physical button click depression.

### Interaction States

| Component / State | Rest State | Hover State (`:hover`) | Active State (`:active`) | Disabled State (`:disabled`) | Focus State (`:focus-visible` / `:focus`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Operational Action (`.btn-hazard`)** | `translate(0, 0)`<br/>`3px 3px 0px #1C1B18`<br/>bg: `#F2B705` | `translate(-1px, -1px)`<br/>`5px 5px 0px #1C1B18` | `translate(2px, 2px)`<br/>`1px 1px 0px #1C1B18` | `opacity: 0.55`<br/>`cursor: not-allowed`<br/>`box-shadow: none`<br/>`transform: none` | `outline: 2px solid #1C1B18`<br/>`outline-offset: 2px` |
| **Standard Button (`.btn`)** | `translate(0, 0)`<br/>`3px 3px 0px #1C1B18`<br/>bg: `#EFE8D8` | `translate(-1px, -1px)`<br/>`5px 5px 0px #1C1B18` | `translate(2px, 2px)`<br/>`1px 1px 0px #1C1B18` | `opacity: 0.55`<br/>`cursor: not-allowed`<br/>`box-shadow: none`<br/>`transform: none` | `outline: 2px solid #1C1B18`<br/>`outline-offset: 2px` |
| **Emergency Button (`.btn-emergency`)** | `translate(0, 0)`<br/>`8px 8px 0px #1C1B18`<br/>bg: `#E4421E` | `translate(-2px, -2px)`<br/>`10px 10px 0px #1C1B18` | `translate(4px, 4px)`<br/>`2px 2px 0px #1C1B18` | `opacity: 0.55`<br/>`cursor: not-allowed`<br/>`box-shadow: none`<br/>`transform: none` | `outline: 3px solid #1C1B18`<br/>`outline-offset: 3px` |
| **Triage Ticket Card (`.triage-tag`)** | `translate(0, 0)`<br/>`3px 3px 0px #1C1B18` | `translate(-2px, -2px)`<br/>`5px 5px 0px #1C1B18` | `translate(1px, 1px)`<br/>`1px 1px 0px #1C1B18` | N/A | `outline: 2px solid #1C1B18` |
| **Form Input (`.form-input`)** | `inset 2px 2px 0px rgba(28,27,24,0.08)`<br/>bg: `#F7F3E9`, border: `#1C1B18` | bg: `#FFFFFF`<br/>border: `#1C1B18` | N/A | `opacity: 0.6`<br/>`cursor: not-allowed`<br/>bg: `#E2DAC4` | **Focus**: bg: `#FFFFFF`<br/>border: `#E4421E`<br/>`2px 2px 0px #1C1B18` |

### Named Rules
**The Mechanical Displacement Rule.** Every clickable button or interactive card must physically move on the screen when pressed (`transform: translate(...)` with shadow shrinking towards the surface). Elevation is an authentic mechanical depression, never a color fade.

**The Zero-Blur Invariant.** No shadow property in the codebase may ever specify a blur radius greater than `0px`.

---

## Shapes

RescueRoom's form language is uncompromisingly rectangular, industrial, and utilitarian.

- **Corner Radius**: Strictly `0px` across all elements (`--border-radius: 0px`). Rounded corners, pills, and squircles are forbidden.
- **Border Grammar**: Solid carbon ink strokes:
  - Standard border (`--border-ink`): `2px solid var(--color-ink)`
  - Thick emphasis border (`--border-ink-thick`): `3px solid var(--color-ink)`
  - Hairline technical divider (`--border-ink-thin`): `1px solid var(--color-ink)`
- **Silhouettes & Accents**:
  - 45° diagonal hazard stripes (`.hazard-tape`, `.hazard-tape-sm`).
  - Rubber stamp double-border borders (`.stamped-resolved-seal`: `4px double var(--color-teal)`).
  - Triage tag priority accent: `8px solid var(--color-vermilion)` left border on oldest waiting ticket (`.triage-tag-oldest`).

---

## Components

### 1. Operational Action Button (`.btn-hazard`)
The primary high-visibility action button for forward-progressing workflow steps.
- **Typography**: `Bricolage Grotesque`, 700 weight, `0.95rem`, uppercase, `0.03em` letter-spacing.
- **Dimensions**: Padding `10px 18px`, `border: 2px solid #1C1B18`, `border-radius: 0px`.
- **Colors**: Background `var(--color-hazard)` (`#F2B705`), text `var(--color-ink)` (`#1C1B18`).
- **Interaction**: Rest `3px 3px 0px #1C1B18` $\to$ Hover `translate(-1px, -1px)` with `5px 5px 0px` $\to$ Active `translate(2px, 2px)` with `1px 1px 0px`.

### 2. Standard Button (`.btn`)
Tactile bone cardstock button for standard secondary actions and non-critical navigation.
- **Dimensions**: Padding `10px 18px`, `border: 2px solid #1C1B18`, `border-radius: 0px`.
- **Colors**: Background `var(--color-bone)` (`#EFE8D8`), text `var(--color-ink)` (`#1C1B18`).
- **Variants**:
  - Resolution (`.btn-teal`): Background `var(--color-teal)` (`#1F6F68`), text `var(--color-bone)`.
  - Tactical Panel (`.btn-dark`): Background `var(--color-dark-panel)` (`#14201F`), text `var(--color-bone)`.
  - Critical Confirmation (`.btn-vermilion`): Background `var(--color-vermilion)` (`#E4421E`), text `var(--color-bone)`.

### 3. Emergency Action Button (`.btn-emergency`)
The dedicated full-width catastrophic emergency trigger on the Operator Emergency Station (`/operator`).
- **Typography**: `Bricolage Grotesque`, 800 weight, `1.6rem`, uppercase, `0.08em` letter-spacing.
- **Dimensions**: Full width (`100%`), padding `24px 20px`, `border: 3px solid #1C1B18`, `border-radius: 0px`.
- **Colors**: Background `var(--color-vermilion)` (`#E4421E`), text `#FFFFFF`.
- **Shadow**: Massive mechanical offset `8px 8px 0px #1C1B18`.
- **Interaction**: Hovers to `translate(-2px, -2px)` with `10px 10px 0px #1C1B18`; presses to `translate(4px, 4px)` with `2px 2px 0px #1C1B18`.

### 4. Interactive CAD Blueprint & Radar Telemetry HUD
The interactive vector schematic component (`TelemetryHUD.jsx`) mapping real-time CAN-bus data to physical machinery blueprints.
- **Canvas Substrate**: `#0F1A1C` with `20px` orthogonal grid (`rgba(0, 255, 200, 0.06)`).
- **Equipment Silhouette**: Heavy vector geometry in `rgba(120, 200, 220, 0.45–0.85)` with `1.8px` to `3.5px` stroke widths.
- **Concentric Radar Pinpoint Animation**:
  - Outer Ping: `stroke="#EF4444"`, `strokeWidth="1.5"`, `r="8;24;32"`, `opacity="0.9;0.4;0"`, period `1.8s`, repeat `indefinite`.
  - Inner Ping: `stroke="#F59E0B"`, `strokeWidth="1.5"`, `r="6;16"`, `opacity="1;0.2"`, period `1.2s`, repeat `indefinite`.
- **Interactive Subsystem Targets**: Clickable circle targets with outer hit radius (`r=7`–`9`, fill `#0EA5E9` or fault `#EF4444`, stroke `#FFFFFF`, stroke width `2px`) and inner pinpoint (`r=2.5`, fill `#FFFFFF`). Labels rendered in `IBM Plex Mono` (nominal `#EFE8D8`, selected `#F2B705`).

### 5. Triage Ticket Cards (`.triage-tag`)
Physical machinery job tickets pinned to the workshop triage board (`/board`).
- **Corner Style**: Strictly `0px` radius.
- **Background**: `var(--color-bone)` with `2px solid #1C1B18` and `3px 3px 0px #1C1B18`.
- **Oldest Ticket Highlight (`.triage-tag-oldest`)**: `border-left: 8px solid var(--color-vermilion) !important`.
- **Header**: Flex container with uppercase monospace incident code (`IBM Plex Mono`) and status stamp.
- **Internal Padding**: `18px` to `20px`.

### 6. Technical Inputs & Requisitions (`.form-input`, `.form-select`, `.form-textarea`)
Form fields modeled on carbon-copy equipment requisition sheets.
- **Typography**: `IBM Plex Mono`, `0.95rem`, color `var(--color-ink)`.
- **Background**: `var(--color-paper-light)` (`#F7F3E9`) at rest, `#FFFFFF` on focus.
- **Borders & Shadow**: `2px solid #1C1B18`, inset shadow `inset 2px 2px 0px rgba(28, 27, 24, 0.08)`.
- **Focus**: Border turns `var(--color-vermilion)` (`#E4421E`), external hard shadow `2px 2px 0px #1C1B18`.

### 7. Physical Rubber Stamps (`.stamp`)
State badges printed in indelible ink directly on workshop cardstock.
- **Typography**: `IBM Plex Mono`, bold 700 weight, `0.75rem`, uppercase, `0.08em` letter-spacing.
- **Dimensions**: Padding `4px 10px`, `border: 2px solid #1C1B18`, `border-radius: 0px`.
- **Critical (`.stamp-critical`)**: Background `var(--color-vermilion)`, text `#FFFFFF`.
- **Serious (`.stamp-serious`)**: Background `var(--color-hazard)`, text `var(--color-ink)`.
- **Minor (`.stamp-minor`)**: Background `var(--color-paper-light)`, text `var(--color-ink)`.
- **Resolved (`.stamp-resolved`)**: Background `var(--color-teal)`, text `#FFFFFF`.
- **Resolution Seal (`.stamped-resolved-seal`)**: `4px double var(--color-teal)`, 4° rotational cant (`rotate(-4deg)`), animated with `stampSlam` (drop scale from 3.2 with bounce settle).

### 8. Hazard Tape Utilities (`.hazard-tape`, `.hazard-tape-sm`, `.hazard-strip-banner`)
Industrial caution striping indicating machinery hazards, active alerts, or warning boundaries.
- **Style**: Repeating 45° diagonal stripes (`repeating-linear-gradient(-45deg, #F2B705, #F2B705 14px, #1C1B18 14px, #1C1B18 28px)`), framed with `2px solid #1C1B18`.

### 9. Interactive 3D Digital Twin & Mechanical Assembly (`/twin`)
High-fidelity industrial 3D digital twin and exploded-assembly inspection system designed for field technicians and equipment dispatchers.

- **Central Subject**: Excavator EX-204 High-Pressure Hydraulic Powertrain & Boom Articulation System (Main Boom Cylinder, Rexroth A8VO Dual Swashplate Pump, Proportional Flow Valve Manifold, Planetary Slew Motor, Tier 4F Turbocharged Diesel Engine, and Boxed Chassis Boom Foot).
- **Rendering & Material Architecture**:
  - Three.js WebGL rendering with ACESFilmic tone mapping and directional tactical illumination.
  - Multi-light rig: 2.2 intensity white overhead floodlight, 0.75 amber floor bounce, 1.8 teal rim backlight, and ambient dark-panel substrate fill.
  - PBR Materials: Cast iron (`roughness: 0.35`, `metalness: 0.85`), machined alloy (`roughness: 0.25`, `metalness: 0.75`), mirror chrome (`roughness: 0.08`, `metalness: 0.98`), safety amber powder coat, and high-temp rubber braided hoses.
  - Technical CAD Edge Overlays: Every geometric component incorporates high-precision `THREE.EdgesGeometry` line segments in tactical cyan (`#78C8DC`) providing instant technical blueprint clarity.
  - Visual Mode Switcher: Solid Industrial PBR $\leftrightarrow$ CAD Blueprint Wireframe $\leftrightarrow$ X-Ray Holographic Ghost.
- **6-Stage Scroll Storytelling Sequence**:
  - **Stage 01 (0%–18%)**: *Operational Overview* — Nominal assembled powertrain in resting state.
  - **Stage 02 (18%–38%)**: *Controlled Exploded Separation* — Mechanical components smoothly decouple along calibrated thrust vectors to verify mechanical clearances.
  - **Stage 03 (38%–58%)**: *Subsystem Anatomy & OEM Manifest* — Real OEM part numbers (`CAT-154-8291`, `REXROTH-A8VO-107`), burst thresholds, and torque specs pinned to 3D components.
  - **Stage 04 (58%–76%)**: *Real-Time Fault Pinpointing & Telemetry* — Camera converges on ruptured boom cylinder gland; thermal stress pulses in vermilion with CAN-bus redline alert (5,120 PSI).
  - **Stage 05 (76%–90%)**: *AI Diagnostic Forensics & Escalation* — Root cause analysis and 6-step OSHA Lockout/Tagout protocol with direct dispatch escalation.
  - **Stage 06 (90%–100%)**: *Mechanical Reassembly & Resolution Sign-Off* — Components reassemble and lock into nominal operating geometry; status stamped in oxidised teal ink.
- **Screen-Space Annotation Projection**:
  - Subsystems project 3D coordinate anchors into 2D viewport coordinates via camera projection, rendering crisp SVG leader lines and accessible DOM labels with sub-pixel alignment.
- **Interaction & Free Orbit Inspection**:
  - Mode toggle unlocks 360° `OrbitControls` with manual explode expansion slider (0% to 100%) and camera presets (Isometric, Top CAD, Boom Focus, Pump Focus).
- **Performance & Accessibility**:
  - Zero external 3D model CDN downloads; all geometries and materials are generated procedurally in sub-millisecond time.
  - Device pixel ratio capped at 2.0 to prevent GPU thermal throttling.
  - Full disposal of geometries, materials, line segments, textures, and renderer on component unmount.
  - `prefers-reduced-motion` compliance: smooth camera animations replaced with discrete step navigation tabs and static high-contrast borders.
  - WebGL hardware fallback: automatically renders high-resolution 2D vector CAD schematics with complete telemetry diagnostics if WebGL is unsupported.

---

## Do's and Don'ts

### Do:
- **Do** use Hazard Amber (`.btn-hazard`: `#F2B705`) for primary operational workflow actions, differentiating them from hazard alerts via action-oriented verbs.
- **Do** enforce `border-radius: 0px` on every new UI element without exception.
- **Do** reserve Industrial Vermilion (`#E4421E`) strictly for critical emergency transmissions, catastrophic triggers, and active redline alarms.
- **Do** use centralized CAD tokens (`--cad-bg-blueprint`, `--cad-stroke-structure`, `--cad-fault-line`, `--cad-nominal-line`) for all vector machinery blueprints.
- **Do** write structural headings and action labels in `Bricolage Grotesque` and all machine telemetry in `IBM Plex Mono`.
- **Do** compress buttons on active click with `transform: translate(2px, 2px)` and `1px 1px 0px #1C1B18` hard shadow.
- **Do** format all dates and timestamps with uppercase military UTC standards (`HH:MM:SS UTC · MMM DD, YYYY`).
- **Do** maintain the `body::before` 12px technical watermark across all desktop web views.

### Don't:
- **Don't** use Industrial Vermilion (`#E4421E`) for non-critical, decorative, or general navigational buttons.
- **Don't** use Hazard Amber indiscriminately for generic warnings without explicit severity stamps or contextual text.
- **Don't** hardcode ad-hoc stroke colors in CAD schematics when centralized CAD tokens exist.
- **Don't** use rounded corners, pill badges, or curved edges anywhere in the interface.
- **Don't** use Gaussian blurred shadows (`box-shadow: 0 4px 12px rgba(...)`); all shadows must be zero-blur hard offsets.
- **Don't** use glassmorphism, transparent acrylic filters, or pastel gradient cards.
- **Don't** render telemetry, serial numbers, or timers in `Bricolage Grotesque`.
- **Don't** use soft corporate blue accents; reserve color strictly for semantic workshop states (Vermilion, Hazard Amber, Teal, Dark Panel).
