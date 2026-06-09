---
name: Cyber-Arena Duelist
colors:
  surface: '#12131a'
  surface-dim: '#12131a'
  surface-bright: '#383941'
  surface-container-lowest: '#0d0e15'
  surface-container-low: '#1a1b23'
  surface-container: '#1e1f27'
  surface-container-high: '#292932'
  surface-container-highest: '#33343d'
  on-surface: '#e3e1ec'
  on-surface-variant: '#e6bdb9'
  inverse-surface: '#e3e1ec'
  inverse-on-surface: '#2f3038'
  outline: '#ad8884'
  outline-variant: '#5d3f3c'
  surface-tint: '#ffb3ac'
  primary: '#ffb3ac'
  on-primary: '#680008'
  primary-container: '#ff544e'
  on-primary-container: '#5c0006'
  inverse-primary: '#c00018'
  secondary: '#b0c6ff'
  on-secondary: '#002d6e'
  secondary-container: '#0368ec'
  on-secondary-container: '#f2f3ff'
  tertiary: '#edc157'
  on-tertiary: '#3f2e00'
  tertiary-container: '#b28b26'
  on-tertiary-container: '#372700'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb3ac'
  on-primary-fixed: '#410003'
  on-primary-fixed-variant: '#930010'
  secondary-fixed: '#d9e2ff'
  secondary-fixed-dim: '#b0c6ff'
  on-secondary-fixed: '#001945'
  on-secondary-fixed-variant: '#00429b'
  tertiary-fixed: '#ffdf9b'
  tertiary-fixed-dim: '#edc157'
  on-tertiary-fixed: '#251a00'
  on-tertiary-fixed-variant: '#5b4300'
  background: '#12131a'
  on-background: '#e3e1ec'
  surface-variant: '#33343d'
  surface-deep: '#0D1020'
  surface-card: '#141827'
  stroke-default: '#2A3045'
  success-green: '#30D158'
  champion-gold: '#FFD700'
  text-primary: '#F5F7FA'
  text-secondary: '#A7ADBF'
typography:
  display-xl:
    fontFamily: Sora
    fontSize: 72px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  title-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
  status-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  arena-aspect: 16 / 9
  card-aspect: 3 / 4
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  max-width: 1440px
---

## Brand & Style

The design system embodies a **90s Retro Arcade** aesthetic fused with a **Modern AIGC (AI-Generated Content)** high-tech layer. The brand personality is aggressive, competitive, and immersive, designed to evoke the high-stakes tension of a head-to-head fighting game lobby. 

The visual style utilizes **Neon-Brutalism** with a **Glassmorphism** overlay. It relies on high-contrast dark surfaces to make neon player accents (Red vs. Blue) vibrate off the screen. Key characteristics include:
- **Symmetry as Conflict:** A layout centered around the "Left vs. Right" paradigm to reinforce the duel.
- **Digital Tactility:** Large, "squishy" interactive cards and buttons that feel like physical arcade hardware.
- **Atmospheric Depth:** Subtle pixel-scanline overlays and glowing borders that suggest a CRT monitor powered by futuristic AI hardware.

## Colors

This design system uses a **tri-tone neon palette** grounded in deep, void-like neutrals.

- **Primary & Secondary:** Dedicated to Player A (Red Neon) and Player B (Blue Neon) respectively. These colors should never be mixed unless representing a "clash" or "versus" state.
- **Tertiary:** Neon Yellow is reserved exclusively for AI processing states, progress bars, and alerts.
- **Success & Champion:** Green is used for "Ready" states, while Gold is reserved for victory screens and champion status badges.
- **Neutrals:** The background is near-black (#07080F), with elevated surfaces using deep navy tones to maintain a cold, technical atmosphere.

## Typography

The typography strategy focuses on high-impact hierarchy and technical precision.

- **Headlines:** Use **Sora** for its geometric, futuristic feel. For display headers, apply a 2px horizontal glow in the player's primary color and force uppercase for an arcade-style "CHALLENGER" look.
- **Body:** **Hanken Grotesk** provides high legibility for character descriptions and weapon stats, maintaining a modern SaaS-like clarity.
- **Data/Status:** **JetBrains Mono** is used for "Ready" labels, AI prompt text, and system metadata to evoke the "AIGC/Coding" side of the aesthetic.

## Layout & Spacing

The layout uses a **Fixed-Grid Conflict Model**.

- **Desktop:** A symmetrical 12-column layout. The central 8 columns are reserved for the 16:9 Arena Stage, while the outer 2 columns on each side house the Player A and Player B panels.
- **The Stage:** The central arena must maintain a strict 16:9 aspect ratio to ensure AI-generated battle sequences are framed correctly.
- **Mobile:** Content reflows into a vertical stack: **Arena (Top) -> Player A Panel -> VS Divider -> Player B Panel.**
- **Spacing Rhythm:** Based on an 8px base unit. Internal card padding is consistently 24px to ensure a "chunky," high-polish feel.

## Elevation & Depth

Depth is not achieved through traditional shadows but through **Luminance and Backdrop Blurs**.

- **Tonal Layers:** Surfaces move from the darkest background (#07080F) to the highest elevation card surfaces (#141827).
- **Glassmorphism:** All player panels and modals use a 12px backdrop blur with a 10% opacity white tint to create a "frosted tech" appearance.
- **Neon Inner Glow:** Active components (selected cards, ready buttons) use a `0 0 15px` outer glow and a `inset 0 0 10px` inner glow in the respective player color (Red or Blue).
- **Scanlines:** A global overlay of 1px horizontal lines at 3% opacity is applied to elevated panels to simulate a CRT effect.

## Shapes

The design uses **"Modern-Rounded"** geometry. Large radii on containers balance the aggressive color palette, making the high-contrast UI feel premium rather than dated.

- **Main Containers (Arena/Panels):** Use `rounded-xl` (24px) to create a soft, TV-screen-like frame.
- **Interactive Cards:** Use `rounded-lg` (16px) for the 3:4 character/weapon cards.
- **Status Pills:** Use fully rounded (Pill) shapes for "Ready" or "Custom" labels to distinguish them from structural elements.

## Components

### Buttons
- **Primary (Battle):** A large, high-contrast button featuring a Red-to-Blue horizontal gradient. On hover, it pulses with a white outer glow.
- **Ghost (Secondary):** 1px border using `stroke-default`, text in `text-secondary`.

### Duelist Cards (3:4 Ratio)
- **Default:** Semi-transparent surface with a subtle scanline pattern. 
- **Selected:** The entire border glows (Red for Player A, Blue for Player B) with a checkmark icon appearing in the top-right corner.

### Glassmorphism Panels
- Main player selection areas use a backdrop-blur background. The border should be a subtle gradient moving from `stroke-default` to a semi-transparent version of the player’s color at the top-left corner.

### Input Fields
- Monospaced text entry for AI prompts. Use a blinking underscore cursor (1000ms animation) to reinforce the terminal/tech aesthetic.

### Status Capsules
- Small, uppercase labels using `JetBrains Mono`. "Ready" uses a Success Green glow; "AIGC Battle" uses an Accent Yellow pulse.

### Arena Container (16:9)
- A heavy-set frame with an inner "vignette" shadow to draw focus to the central battle content.