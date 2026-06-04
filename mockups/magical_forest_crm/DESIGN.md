---
name: Magical Forest CRM
colors:
  surface: '#fdf9f0'
  surface-dim: '#dddad1'
  surface-bright: '#fdf9f0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3ea'
  surface-container: '#f1eee5'
  surface-container-high: '#ece8df'
  surface-container-highest: '#e6e2d9'
  on-surface: '#1c1c17'
  on-surface-variant: '#43483f'
  inverse-surface: '#31312b'
  inverse-on-surface: '#f4f0e7'
  outline: '#73796e'
  outline-variant: '#c3c8bc'
  surface-tint: '#46673a'
  primary: '#17350e'
  on-primary: '#ffffff'
  primary-container: '#2d4c22'
  on-primary-container: '#98bc87'
  inverse-primary: '#acd19a'
  secondary: '#805533'
  on-secondary: '#ffffff'
  secondary-container: '#fdc39a'
  on-secondary-container: '#794e2e'
  tertiary: '#735c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#cca730'
  on-tertiary-container: '#4f3e00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c7edb4'
  primary-fixed-dim: '#acd19a'
  on-primary-fixed: '#042100'
  on-primary-fixed-variant: '#2f4e24'
  secondary-fixed: '#ffdcc5'
  secondary-fixed-dim: '#f4bb92'
  on-secondary-fixed: '#301400'
  on-secondary-fixed-variant: '#653d1e'
  tertiary-fixed: '#ffe088'
  tertiary-fixed-dim: '#e9c349'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#574500'
  background: '#fdf9f0'
  on-background: '#1c1c17'
  surface-variant: '#e6e2d9'
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
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  margin-desktop: 32px
  margin-mobile: 16px
  gutter: 24px
  card-padding: 24px
  input-padding: 12px 16px
---

## Brand & Style
The design system for Bosque Mágico balances the efficiency of a high-performance CRM with a warm, artisanal aesthetic. It is tailored for a professional audience that values organic growth, sustainability, and personal connection.

The visual style is **Tactile Modernism**. It avoids the sterility of typical SaaS platforms by using cream-based surfaces instead of pure white and wood-toned neutrals instead of cold greys. The interface feels "alive"—utilizing soft organic shapes, subtle gradients that mimic natural lighting, and a depth model that suggests stacked paper and carved wood. It is premium, trustworthy, and sophisticated, never drifting into childlike whimsy.

## Colors
The palette is grounded in the "Forest Floor" concept. 

*   **Primary (Forest Green):** Used for primary actions, navigation headers, and active states. It represents stability and growth.
*   **Secondary (Warm Wood):** Used for structural elements like sidebars or secondary buttons, providing a grounded, tactile feel.
*   **Tertiary (Soft Gold):** Reserved for highlights, "magic moments" (like closing a deal), and important notifications.
*   **Neutral (Cream):** The primary background color. It reduces eye strain compared to pure white and adds a premium, "stationery" quality to the CRM.
*   **Success/Status:** Use earth-toned variations of standard semantic colors (e.g., moss green for success, terracotta for errors).

## Typography
Plus Jakarta Sans is the cornerstone of this design system. Its modern geometric structure paired with soft, humanist curves aligns perfectly with the "Magical Forest" narrative.

*   **Headlines:** Use Bold weights with tighter letter-spacing for a confident, editorial look.
*   **Body Text:** Prioritize readability. Use "Bark Text" (#3C2F2F) instead of black to maintain warmth.
*   **Labels:** Use Uppercase for metadata and status headers to provide clear hierarchy within data-heavy tables and KPI cards.

## Layout & Spacing
The layout employs a **Fluid Grid** with generous white space (or "cream space") to evoke a sense of calm. 

*   **Desktop:** A 12-column grid with a fixed-width sidebar (280px). 32px outer margins provide a breathable, high-end feel.
*   **Tablet:** Reflows to 8 columns; sidebar collapses into an icon-rail or "hamburger" drawer.
*   **Mobile:** A single-column layout with 16px margins. 
*   **Rhythm:** Spacing follows an 8px linear scale. Large components (KPI cards, sections) should use 32px or 48px gaps to prevent the CRM from feeling cluttered.

## Elevation & Depth
This design system uses **Tonal Layering** combined with **Ambient Shadows** to create a physical presence.

*   **Level 0 (Canvas):** Cream Surface (#FDF9F0).
*   **Level 1 (Cards/Lists):** White or slightly lighter cream, with a very soft, diffused shadow (15% opacity Forest Green tint, 20px blur) to make elements appear "lifted."
*   **Level 2 (Modals/Popovers):** Higher elevation with a secondary 2px border in a "Wood" tint to define boundaries clearly.
*   **Interactions:** Elements should subtly "sink" on press (neomorphic influence) and lift on hover to provide tactile feedback.

## Shapes
The shape language is organic and inviting. We avoid sharp corners entirely to maintain the "Natural" identity.

*   **Standard Components:** 0.5rem (8px) radius for buttons and input fields.
*   **Large Components:** 1rem (16px) for KPI cards and main content containers.
*   **Special Accents:** Use "Squircle" shapes or asymmetrical radii for decorative elements to mimic natural stones or leaves.

## Components

### Navigation Sidebar
A vertical "Warm Wood" (#8B5E3C) panel. Icons are soft-gold when active. Top-level navigation items use semi-transparent white backgrounds for the "selected" state.

### KPI Cards
Cards feature a thick 4px top-border in "Forest Green" or "Soft Gold." The primary metric is displayed in `display-lg` typography. Include a subtle background watermark of a leaf or tree ring for "magical" texture.

### Data Tables
Rows have a subtle cream hover state. Avoid heavy vertical lines; use horizontal dividers in a very light "Wood" tint. Cell text uses `body-sm`.

### Status Badges
Pill-shaped with a low-saturation background and high-saturation text:
*   **New:** Light Sage background / Forest Green text.
*   **In Progress:** Light Tan background / Warm Wood text.
*   **Quoted:** Light Gold background / Deep Gold text.
*   **Closed:** Pale Grey background / Bark text.

### Action Buttons
*   **Primary:** Solid "Forest Green" with white text. High tactile elevation.
*   **Secondary:** "Warm Wood" outline with a 2px stroke.
*   **Tertiary/Ghost:** Text-only in "Forest Green" with a soft-gold underline on hover.

### Input Fields
Cream background slightly darker than the canvas, with a "Wood" border that thickens and turns "Forest Green" on focus. Labels sit just above the field in `label-caps`.