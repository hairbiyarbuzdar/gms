---
name: Iron Reserve
colors:
  surface: '#FCF9F8'
  surface-dim: '#ddd9d8'
  surface-bright: '#fdf8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f2f2'
  surface-container: '#F0EDED'
  surface-container-high: '#ece7e7'
  surface-container-highest: '#e6e1e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#5a413d'
  inverse-surface: '#313030'
  inverse-on-surface: '#f4f0ef'
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
  secondary-container: '#e2e3e2'
  on-secondary-container: '#636565'
  tertiary: '#00137f'
  on-tertiary: '#ffffff'
  tertiary-container: '#223094'
  on-tertiary-container: '#94a0ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#ffb4a8'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#8f0f07'
  secondary-fixed: '#e2e3e2'
  secondary-fixed-dim: '#c6c7c6'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#dfe0ff'
  tertiary-fixed-dim: '#bcc2ff'
  on-tertiary-fixed: '#000c61'
  on-tertiary-fixed-variant: '#2e3c9e'
  background: '#fdf8f8'
  on-background: '#1c1b1b'
  surface-variant: '#e6e1e1'
  outline-dim: '#E5E2E1'
  success: '#2D5A27'
  warning: '#B45309'
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
  headline-md-mobile:
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
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
  data-mono:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
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
  margin-x: 32px
  margin-x-mobile: 16px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  container-max: 1440px
---

## Brand & Style

The design system is centered on **High-Performance Minimalism**, designed for professional management environments that require absolute clarity and administrative discipline. The aesthetic avoids all decorative distractions, focusing instead on the utility of data and the intensity of its signature color.

The style is **Minimalist and Structured**, characterized by:
- **Efficiency over Embellishment:** A total absence of shadows, gradients, or soft blurs.
- **Architectural Rigor:** High-quality typography and a strict 1px border system that defines hierarchy.
- **Premium Utility:** A white-dominant environment that feels like a high-end, clean-room laboratory for data.
- **Intensity:** The deep maroon is used with surgical precision to draw the eye to actions and critical alerts.

## Colors

The color system is optimized for high-density administrative interfaces, prioritizing background-to-text contrast and distinct semantic signaling.

- **Primary Maroon (#800000):** Used for brand touchpoints, primary actions, and "active" status markers.
- **Surface & Backgrounds:** The primary background is `surface` (#FCF9F8). Containers and tables use pure `#FFFFFF` to stand out against the background. Secondary background fills for headers or subtle row striping use `surface-container`.
- **Typography:** Headlines and primary body text use `neutral` (#1C1B1B) for maximum legibility. Secondary metadata uses `secondary` (#5D5F5F).
- **Semantics:** While maroon is the brand driver, standard semantic colors (Success Green, Warning Amber) are permitted for financial and status reporting but should be desaturated to match the professional tone.

## Typography

**Inter** is utilized for its systematic neutrality. For this management platform, typography must handle complex tabular data and dense information displays.

- **Headlines:** Use heavy weights and tight tracking for a strong, authoritative presence.
- **Data Display:** For financial reports and inventory lists, utilize `data-mono` (Inter with tabular lining figures) to ensure columns of numbers align perfectly.
- **Information Scent:** `label-caps` must be used for all table headers, section titles, and small metadata categories to distinguish them from actionable data.
- **Scalability:** Large displays are used for dashboard overviews, but `body-sm` is the workhorse for dense data grids.

## Layout & Spacing

The layout uses a **12-Column Fluid Grid** with a maximum container width of 1440px to accommodate wide-format data tables and multi-pane management views.

- **Grid System:** A 24px gutter is consistent across desktop and tablet. In management views, side-bars for filtering or navigation should span 3 columns, with the primary content area spanning 9 columns.
- **Data Density:** For inventory and directories, vertical padding in table rows is reduced to `stack-sm` (8px) to maximize visible rows.
- **Navigation:** Primary navigation is a horizontal top-bar (80px). For the management platform, a secondary vertical sub-navigation (240px width) may be used for specific modules like "Reports" or "Inventory Settings."
- **Breakpoints:**
  - **Desktop (1024px+):** Full 12-column grid, persistent sidebars.
  - **Tablet (768px-1023px):** Sidebars collapse into drawers; margins reduce to 24px.
  - **Mobile (<768px):** Single column reflow; horizontal margins at 16px.

## Elevation & Depth

This system avoids the use of shadows and blurs. Depth is created through **Tonal Layering and Borders**.

- **Layers:** The base page uses `surface`. Containers (cards, table bodies) use `#FFFFFF`.
- **Borders:** A 1px solid border using `outline-dim` (#E5E2E1) is the primary method for defining element boundaries.
- **Interaction:** On hover or focus, borders transition from `outline-dim` to `primary` (Maroon) or a darker gray. 
- **Active State:** In navigation or selection lists, an active item is indicated by a 4px left-border in Primary Maroon rather than a background change, maintaining the white minimalist aesthetic.

## Shapes

The shape language is **Soft and Disciplined**, utilizing a 0.25rem (4px) radius for all standard UI elements.

- **Components:** Buttons, input fields, and cards must all adhere to the 4px radius.
- **Data Elements:** Status badges and chips use the same 4px radius; avoid pill-shapes (fully rounded) to maintain the architectural feel.
- **Exceptions:** Very small elements like checkboxes use a 2px (sm) radius to ensure they don't look like circles at small scales.

## Components

- **Data Tables:** Headers use `label-caps` with a `surface-container` background and a 1px bottom border. Rows use `body-md` for text and `data-mono` for numeric values.
- **Buttons:** 
  - **Primary:** Solid Maroon background, white text, 4px radius. 
  - **Secondary:** Transparent background, 1px Maroon border, Maroon text.
  - **Ghost:** No border, maroon or gray text, used for secondary actions in data rows.
- **Search & Input:** Text inputs feature a 1px `outline-dim` border. The border turns Maroon on focus. Use `body-md` for input text.
- **Status Chips:** Small, rectangular badges with a light tinted background and dark text (e.g., Light Red background with Maroon text for "Critical").
- **KPI Cards:** Large numeric displays using `display-lg` for the value, with a `label-caps` title at the top left.
- **Inventory Lists:** Compact rows with a thumbnail (4px radius), `body-lg` title, and `label-caps` metadata (e.g., "SKU: 12345").