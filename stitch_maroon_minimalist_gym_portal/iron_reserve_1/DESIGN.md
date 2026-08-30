---
name: Iron Reserve
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#5a413d'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#8e706c'
  outline-variant: '#e2bfb9'
  surface-tint: '#b22b1d'
  primary: '#570000'
  on-primary: '#ffffff'
  primary-container: '#800000'
  on-primary-container: '#ff8371'
  inverse-primary: '#ffb4a8'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dcdddd'
  on-secondary-container: '#5f6161'
  tertiary: '#00137f'
  on-tertiary: '#ffffff'
  tertiary-container: '#0021b9'
  on-tertiary-container: '#94a0ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#ffb4a8'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#8f0f07'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#dfe0ff'
  tertiary-fixed-dim: '#bcc2ff'
  on-tertiary-fixed: '#000c61'
  on-tertiary-fixed-variant: '#1830c2'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
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
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-md-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1200px
  gutter: 24px
  margin-x: 32px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is built on a philosophy of **High-Performance Minimalism**. It targets a disciplined audience that values efficiency and clarity over visual noise. The emotional response should be one of focus, strength, and premium exclusivity.

The visual style is strictly **Minimalist**, utilizing heavy whitespace to reduce cognitive load while emphasizing the intensity of the Primary Maroon. It uses a card-based architecture to organize complex fitness data into digestible modules. Elements are characterized by high-quality typography, subtle monochromatic borders, and a complete absence of unnecessary decorative elements like shadows or gradients.

## Colors
The palette is centered around a singular, high-impact **Primary Maroon**, used sparingly for call-to-actions, status indicators, and brand touchpoints. 

- **Primary:** Maroon (#800000) for active states and critical information.
- **Surface:** Pure White (#FFFFFF) for the main background and all card containers to maintain a sterile, clean environment.
- **Accents:** Soft Grays are used exclusively for structural boundaries and secondary background fills in table headers or subtle progress tracks.
- **Contrast:** Deep Charcoal is used for text to ensure maximum readability without the harshness of pure black.

## Typography
This design system employs **Inter** for its systematic, neutral, and highly legible qualities. The typographic hierarchy is strictly enforced to create an obvious information scent. 

- **Headlines:** Set with tighter letter-spacing and heavier weights to project strength. 
- **Labels:** Small caps are used for category headers (e.g., "MEMBERSHIP TYPE") to distinguish metadata from content.
- **Body:** Standardized on a 16px base for comfort during high-activity use (e.g., viewing on a treadmill).

## Layout & Spacing
The layout follows a **Fixed Grid** model centered on the screen to maintain a premium "gallery" feel. 

- **Navigation:** A persistent top-bar navigation (80px height) houses the primary links and user profile. There is no sidebar; all navigation must be horizontal.
- **Grid:** A 12-column system is used for desktop. Membership status and activity charts should span 6 or 8 columns, while side-widgets like "Upcoming Classes" occupy the remaining spans.
- **Responsive:** On mobile, the grid collapses to a single column. Horizontal margins reduce from 32px to 16px to maximize screen real estate.

## Elevation & Depth
This design system rejects shadows in favor of **Low-Contrast Outlines**. 

Depth is communicated through 1px solid borders using the `border_hex` (#E5E5E5). Background layering is minimal: the page background is Pure White, and cards are also Pure White, separated only by their borders. This creates a "blueprint" aesthetic that feels precise and architectural. For interactive states, borders may transition to the Primary Maroon.

## Shapes
A **Soft** (0.25rem) corner radius is applied to all UI elements. This subtle rounding prevents the interface from feeling dangerously sharp while maintaining the disciplined, geometric rigor of the brand. Buttons, input fields, and cards all share this uniform radius.

## Components
- **Top Navigation:** 80px tall, Pure White background with a 1px bottom border. Links are in `label-caps`. The user profile is a simple circular avatar with a 1px border.
- **Membership Cards:** Large-scale components featuring `headline-md` for the plan name. Usage of Primary Maroon is restricted to the "Active" status badge.
- **Buttons:** 
  - *Primary:* Solid Maroon with White text. No rounded-pill shapes; use the standard 0.25rem radius.
  - *Secondary:* White background with a 1px Gray border and Maroon text.
- **Activity Charts:** Line or bar charts using Maroon for the data series. Grid lines within charts should be extremely faint (#F4F4F4).
- **Class Lists:** Vertical stacks with 1px bottom dividers. Each row should feature the time in `label-caps` and the class name in `body-lg`.
- **Input Fields:** Minimalist boxes with 1px gray borders. On focus, the border changes to Maroon with no outer glow.