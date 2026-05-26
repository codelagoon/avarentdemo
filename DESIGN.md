---
name: AVARENT Meridian
description: Real-time credit risk compliance monitoring and mitigation engine
colors:
  primary: "#3b82f6"
  neutral-bg: "#090d16"
  neutral-card: "#0c111d"
  border: "#1e293b"
typography:
  display:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "IBM Plex Mono, Courier New, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
rounded:
  sm: "4px"
  md: "8px"
spacing:
  sm: "8px"
  md: "16px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "#2563eb"
---

# Design System: AVARENT Meridian

## 1. Overview

**Creative North Star: "The Immutable Command Center"**

AVARENT Meridian is a high-density, authoritative credit compliance control console. It is designed to offer model risk management engineers, regulatory compliance officers, and legal counsel immediate, absolute visibility into machine learning credit decisioning engines. The system utilizes a precise dark-mode command layout that reflects extreme precision, compliance readiness, and cryptographic trust.

The visual layout prioritizes dense, structured grids over generic templates. It explicitly rejects decorative styling elements (such as neon blue-to-purple background gradients, colorful card accent lines, empty illustrations, or flat scoring scales).

**Key Characteristics:**
* **Scientific Density**: Clean grid systems containing side-by-side regulatory decimal metrics, collapsible SVG feature causal graphs, and sparkline trends.
* **Cryptographic Trust**: Immutable chronological ledgers styled with distinct, solid indicators ("Audit Sealed", "Ledger Continuity").
* **Restrained Focal Points**: Absolute dark slate backdrop with singular focal blue accents to guide operational interaction.

## 2. Colors

The color palette is built using a committed Restrained strategy. A deep, authoritative slate neutral background isolates system telemetry, while a single Cobalt Blue primary color maps to actionable controls and primary indicators.

### Primary
* **OCC Cobalt Blue** (#3b82f6): Used for interactive primary controls, gauge indicators, active menu states, and focused navigation targets.

### Neutral
* **Midnight Black Background** (#090d16): The primary background layer for the entire application interface, maximizing legibility of micro-telemetry.
* **Elevated Slate Surface** (#0c111d): Applied to cards, panels, control accordion containers, and modular layout zones.
* **Muted Divider Slate** (#1e293b): Standard boundary lines, component separators, and subtle details.

### Status Indicators
* **Compliance Pass Emerald** (#10b981): Reserved strictly for metrics meeting regulatory thresholds (e.g. AIR >= 0.80).
* **Adversarial Warning Amber** (#f59e0b): Reserved strictly for mild drift warnings and sub-critical proxy alerts.
* **Threshold Breach Rose** (#ef4444): Reserved strictly for failed tests (e.g. SPD > 0.10) and severed features in the causal graph.

### Named Rules
* **The 90-10 Swatch Rule.** Cobalt accent elements must comprise <= 10% of any given interface surface. Swatches represent actionable triggers rather than decoration.
* **The Telemetry Isolation Rule.** Alert colors (emerald, amber, and rose) are explicitly forbidden on backgrounds or structural dividers. They are strictly confined to data state labels.

## 3. Typography

**Display Font:** IBM Plex Sans (system-ui, sans-serif)
**Body Font:** IBM Plex Sans (system-ui, sans-serif)
**Label/Mono Font:** IBM Plex Mono (Courier New, monospace)

The typographic system pairs the highly readable, structured IBM Plex Sans sans-serif face with the exact data-centric IBM Plex Mono typeface to isolate numeric ratios, cryptographical ledger signatures, and telemetry lists.

### Hierarchy
* **Display** (Bold, 2rem, 1.2): Deployed exclusively for core page headers and landing checkpoints.
* **Headline** (Semibold, 1.25rem, 1.3): Applied to component panel titles and primary stat labels.
* **Body** (Regular, 0.875rem, 1.5): Standard prose text, checklist descriptions, forms, and general lists. Max line length is restricted to 70ch.
* **Label** (Medium, 0.8125rem, normal): Reserved for technical statistics, AIR decimals, SPD values, and evidence hashes.

### Named Rules
* **The Explicit Ratio Rule.** Numeric compliance ratios (AIR and SPD) must never be displayed in standard prose weight. They must be rendered using IBM Plex Mono in medium/bold weight.

## 4. Elevation

The application is structured flat-by-default to emphasize a solid, authoritative instrument canvas. Surfaces use subtle border separations rather than high shadow elevations. Shadows are strictly reactive, appearing exclusively as ambient cues to confirm interactive focus.

### Shadow Vocabulary
* **Cobalt Hover Glow** (`box-shadow: 0 0 15px 5px rgba(37, 99, 235, 0.15)`): Applied dynamically during interactive button focus or red-team parameter adjustments.

### Named Rules
* **The Rested Flatness Rule.** No card or structural panel may display shadow elevations in its resting state. Depth is defined solely by `#1e293b` border outlines.

## 5. Components

### Buttons
* **Shape:** Gently curved corners (8px radius).
* **Primary:** Deep Cobalt `#3b82f6` solid background, white text, padded `8px 16px` with custom transition states.
* **Outline:** Muted border `#1e293b`, clear background, white text.

### Cards / Containers
* **Corner Style:** Gently curved corners (8px radius).
* **Background:** Elevated Slate Surface `#0c111d`.
* **Border:** Standard 1px solid border `#1e293b`.
* **Internal Spacing:** Standard padding `16px`.

### Inputs / Fields
* **Style:** Midnight Black `#090d16` background fill, 1px solid border `#1e293b`, rounded `8px`.
* **Focus:** Transition to Cobalt outline `#3b82f6` with slight inset ring focus.

### Navigation
* **Sidebar Menu**: Minimal vertical list anchored on Slate-Black base. Active route marked by left Cobalt border indicator and solid text highlighting.

## 6. Do's and Don'ts

### Do:
* **Do** display Adverse Impact Ratio (AIR) and Statistical Parity Difference (SPD) as distinct side-by-side decimals (e.g. 0.92, 0.08) rather than composite percentages.
* **Do** use cryptographically authentic labels like "Audit Sealed" and "Ledger Continuity" for immutable record entries.
* **Do** collapse complex interactive modules (such as the causal graph) behind explicit, descriptive toggles ("Feature Dependency Graph — 82 variables mapped") to maintain clean spacing.
* **Do** use IBM Plex Mono for all numeric ratios, hashes, and times.

### Don't:
* **Don't** use standard percentage-based "Fairness Scores" which obfuscate regulatory definitions.
* **Don't** utilize standard AI visual templates like colorful card side-stripes, neon blue-to-purple background gradients, or glassmorphic blur layers.
* **Don't** include document or file illustrations in empty review tables; display clean, muted text-based empty states.
* **Don't** display circular status icons inside primary threat feed cards; rely on typography and layout bounds to group content.
