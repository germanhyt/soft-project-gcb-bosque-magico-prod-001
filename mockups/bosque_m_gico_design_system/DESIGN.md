---
name: Bosque Mágico Design System
colors:
  surface: '#fcf9f2'
  surface-dim: '#dcdad3'
  surface-bright: '#fcf9f2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ec'
  surface-container: '#f0eee7'
  surface-container-high: '#ebe8e1'
  surface-container-highest: '#e5e2db'
  on-surface: '#1c1c18'
  on-surface-variant: '#43483f'
  inverse-surface: '#31312c'
  inverse-on-surface: '#f3f0ea'
  outline: '#73796e'
  outline-variant: '#c3c8bc'
  surface-tint: '#46673a'
  primary: '#17350e'
  on-primary: '#ffffff'
  primary-container: '#2d4c22'
  on-primary-container: '#98bc87'
  inverse-primary: '#acd19a'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#3e2c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#594100'
  on-tertiary-container: '#e2a900'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c7edb4'
  primary-fixed-dim: '#acd19a'
  on-primary-fixed: '#042100'
  on-primary-fixed-variant: '#2f4e24'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#ffdfa0'
  tertiary-fixed-dim: '#fbbc00'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#5c4300'
  background: '#fcf9f2'
  on-background: '#1c1c18'
  surface-variant: '#e5e2db'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
  price-tag:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1200px
  gutter: 24px
---

## Brand & Style

The core philosophy of this design system is to blend the organic, whimsical nature of a "magical forest" with the sophisticated expectations of a premium venue. The target audience includes parents looking for an enchanting, safe, and professional environment for children's celebrations.

The visual style is **Corporate Modern with Tactile influences**. It utilizes clean, structured layouts to convey reliability and professionalism, while incorporating soft edges, warm lighting effects, and subtle "dust particles" (bokeh) in the background to evoke a sense of wonder. The goal is to make the user feel like they are stepping into a curated refuge—one that is both exciting for a child and reassuring for an adult.

High-quality photography of nature, sun-dappled leaves, and joyful celebrations should be used as primary visual assets, supported by a spacious UI that avoids clutter to maintain a "premium" feel.

## Colors

The palette is grounded in the deep, earthen tones of the Peruvian forest.
- **Primary:** A Deep Moss Green (#2D4C22) used for headers, secondary buttons, and structural elements to provide a sense of stability and nature.
- **Secondary/Accent:** Golden Amber (#D4AF37 and #FFBF00) is reserved for calls-to-action (CTAs), highlights, and "magical" moments like sparkles or active states.
- **Background:** An off-white Cream (#FCF9F2) serves as the canvas, providing a warmer, more premium feel than pure white and reducing eye strain.
- **Typography:** The darkest green (#1B3014) is used for body text to ensure high contrast while remaining within the organic color family.

## Typography

This design system uses a pairing of **Plus Jakarta Sans** for headings and **Nunito Sans** for body text. 

Plus Jakarta Sans provides a friendly, slightly rounded geometric feel that mimics the "Fredoka" style but with higher professional polish. It is used for all titles to create a welcoming and modern atmosphere.

Nunito Sans is chosen for its exceptional legibility and soft terminals, making it perfect for descriptive text about party packages and venue details. All currency displays (S/.) should use the bold weight of Plus Jakarta Sans to stand out as a premium detail.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** model for desktop to maintain a contained, boutique feel, transitioning to a fluid model for mobile devices.

- **Desktop:** 12-column grid with a maximum width of 1200px. Large 40px (xl) vertical spacing between sections to emphasize white space and "breathability."
- **Mobile:** Single column with 16px (md) side margins.
- **Rhythm:** All spacing components are multiples of 4px. Use `lg` (24px) for internal card padding and `md` (16px) for element grouping within forms.

## Elevation & Depth

To simulate a "refuge" feel, depth is created using **Ambient Shadows** and **Tonal Layers**.

- **Cards & Surfaces:** Use very soft, diffused shadows with a slight green tint (`rgba(27, 48, 20, 0.08)`) rather than pure grey. This makes the elements feel like they are resting gently on the mossy forest floor.
- **Interactive Depth:** On hover, cards should slightly lift (increase shadow spread) to provide tactile feedback.
- **Overlays:** Modals and dropdowns use a subtle backdrop blur (10px) to simulate "mist" or "soft focus" in the forest, keeping the background visible but unobtrusive.

## Shapes

The shape language is consistently **Rounded**, avoiding sharp corners to maintain a child-friendly and approachable aesthetic. 

Standard components like buttons and input fields use a 0.5rem radius. Larger containers like cards and image carousels use `rounded-xl` (1.5rem) to emphasize the soft, organic theme. Selection chips use a fully rounded (Pill) style to distinguish them as interactive tokens.

## Components

### Buttons
- **Primary:** Solid Golden/Amber (#FFBF00) background with Dark Green (#1B3014) text. High contrast for key actions like "Reservar Ahora."
- **Secondary:** Deep Green (#2D4C22) 2px outline with a transparent background. Used for less urgent actions like "Ver Galería."

### Selection Chips
Used for selecting shows (e.g., "Mago," "Títeres") or extras. 
- **Unselected:** Cream background with a thin green border.
- **Selected:** Solid Deep Green background with white text and a small "sparkle" icon prefix.

### Form Inputs
Clean, white backgrounds with a 1px border in `accent_soft_hex`. On focus, the border transitions to Deep Green with a soft outer glow. Labels are always positioned above the input in `label-md` style.

### Cards
Used for party packages. They feature a `rounded-xl` corner radius, a soft ambient shadow, and a top-aligned image. Pricing (S/.) is always positioned at the bottom right in the `price-tag` typography style.

### Iconography
Icons should be monolinear and "friendly." Use nature-inspired motifs: stars for "Magical," trees for "Venue," and stylized cake icons for "Celebrations." All icons should have rounded caps and joins.