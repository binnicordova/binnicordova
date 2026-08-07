---
name: Tech-Noir Architect
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#c4c7c7'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c8c6c5'
  primary: '#c8c6c5'
  on-primary: '#313030'
  primary-container: '#121212'
  on-primary-container: '#7e7d7d'
  inverse-primary: '#5f5e5e'
  secondary: '#44e2cd'
  on-secondary: '#003731'
  secondary-container: '#03c6b2'
  on-secondary-container: '#004d44'
  tertiary: '#adc6ff'
  on-tertiary: '#002e6a'
  tertiary-container: '#001130'
  on-tertiary-container: '#2f7aed'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#62fae3'
  secondary-fixed-dim: '#3cddc7'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005047'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  max-width: 1200px
---

## Brand & Style

This design system is engineered for a Senior Mobile Architect's portfolio, merging the high-precision world of software engineering with a sophisticated, nocturnal aesthetic. The brand personality is authoritative yet innovative—reflecting a professional who builds robust, scalable systems without sacrificing visual excellence.

The style is a fusion of **Modern Tech** and **Minimalism**, enhanced by subtle **Glassmorphism**. It prioritizes architectural integrity through the use of structural grid lines, intentional whitespace, and "glow" accents that simulate a high-end IDE or a futuristic terminal interface. The goal is to evoke a sense of deep focus, technical mastery, and premium craftsmanship.

## Colors

The palette is strictly dark-mode, designed to reduce eye strain and emphasize technical content. 

- **Primary:** Deep Charcoal (#121212) serves as the foundational canvas.
- **Surface Tier:** Darker Grays (#1E1E1E) are used to define containers and elevated layers.
- **Accents:** Electric Teal (#2DD4BF) is the primary interactive color, used for success states and primary CTAs. Neon Blue (#3B82F6) is used for secondary accents and system-level details.
- **Typography:** Crisp White (#F8FAFC) ensures high legibility for headings, while Muted Silver (#94A3B8) provides hierarchy for secondary descriptions and metadata.

## Typography

Typography is used as a structural element. **Space Grotesk** provides a geometric, futuristic feel for headlines, implying innovation and precision. **Inter** handles the heavy lifting for body copy, ensuring maximum readability across various screen densities. 

**JetBrains Mono** is introduced for labels, metadata, and code snippets, grounding the design in the developer's reality. All monospaced elements should feel like "data output" from a high-performance system. Use the `label-caps` style for section headers to maintain an architectural, blueprint-inspired feel.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy on desktop and a **Fluid Grid** on mobile. 
- **Desktop:** A 12-column grid with a max width of 1200px. Large margins (64px) create a gallery-like focus on content.
- **Mobile:** A 4-column fluid grid with 16px margins.
- **Architectural Lines:** Use thin, 1px borders (#ffffff10) to separate sections instead of relying solely on whitespace. This mimics a blueprint or a sophisticated technical dashboard.
- **Rhythm:** Spacing follows a 4px base unit. Most components should utilize 16px (4x), 32px (8x), or 64px (16x) increments to ensure mathematical consistency.

## Elevation & Depth

This design system avoids traditional drop shadows in favor of **Tonal Layers** and **Glow Effects**.

1.  **Tiers:** The background is #121212. Cards and containers sit on #1E1E1E.
2.  **Glassmorphism:** Overlays, navigation bars, and floating menus use a `backdrop-blur` of 12px with a semi-transparent background (#1E1E1E90).
3.  **Luminescence:** Instead of shadows, use subtle outer glows for active states. A 2px blur of #2DD4BF at 30% opacity can make a button or active card feel "powered on."
4.  **Outlines:** Use low-contrast 1px outlines (#ffffff15) to define shapes without creating visual noise.

## Shapes

The shape language is "Soft-Industrial." Elements use a **0.25rem (4px)** base radius for a crisp, engineered look. Avoid high-radius pill shapes except for very specific tags or status indicators. Buttons and cards should feel like solid, machined components rather than organic blobs.

## Components

- **Buttons:** Primary buttons use a solid Electric Teal background with black text. Secondary buttons use a transparent background with a 1px border and Teal text. On hover, apply a subtle glow effect.
- **Input Fields:** Use a dark surface (#1E1E1E) with a bottom-only border or a very subtle ghost outline. The focus state should illuminate the border in Electric Teal.
- **Cards:** Project cards should feature a subtle 1px border. On hover, the border color should shift from muted silver to Neon Blue, and the background blur should intensify slightly.
- **Chips/Tags:** Use monospaced font (`code-sm`). Format as `[ Tag Name ]` or with a subtle background tint to look like metadata tags in a code editor.
- **Lists:** Use architectural lines (1px horizontal rules) between list items. Use chevron-right icons for navigation-heavy lists to imply flow.
- **Technical Readouts:** Create a custom component for "System Stats" (e.g., Tech Stack, Years of Exp) using monospaced labels and large, high-contrast values.