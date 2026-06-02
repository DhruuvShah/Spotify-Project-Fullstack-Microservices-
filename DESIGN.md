---
name: Lumina
colors:
  surface: "#f9f9f6"
  surface-dim: "#dadad7"
  surface-bright: "#f9f9f6"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f4f4f1"
  surface-container: "#eeeeeb"
  surface-container-high: "#e8e8e5"
  surface-container-highest: "#e2e3e0"
  on-surface: "#1a1c1b"
  on-surface-variant: "#58413c"
  inverse-surface: "#2f312f"
  inverse-on-surface: "#f1f1ee"
  outline: "#8c716b"
  outline-variant: "#e0bfb9"
  surface-tint: "#aa361e"
  primary: "#a6331b"
  on-primary: "#ffffff"
  primary-container: "#c84b31"
  on-primary-container: "#fffbff"
  inverse-primary: "#ffb4a4"
  secondary: "#6d5098"
  on-secondary: "#ffffff"
  secondary-container: "#d0b0ff"
  on-secondary-container: "#5b3e85"
  tertiary: "#725c00"
  on-tertiary: "#ffffff"
  tertiary-container: "#c9a82b"
  on-tertiary-container: "#4d3e00"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#ffdad3"
  primary-fixed-dim: "#ffb4a4"
  on-primary-fixed: "#3e0500"
  on-primary-fixed-variant: "#891e07"
  secondary-fixed: "#ecdcff"
  secondary-fixed-dim: "#d6baff"
  on-secondary-fixed: "#270550"
  on-secondary-fixed-variant: "#54387e"
  tertiary-fixed: "#ffe07c"
  tertiary-fixed-dim: "#e7c446"
  on-tertiary-fixed: "#231b00"
  on-tertiary-fixed-variant: "#564500"
  background: "#f9f9f6"
  on-background: "#1a1c1b"
  surface-variant: "#e2e3e0"
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: "700"
    lineHeight: "1.1"
    letterSpacing: -0.02em
  display-md:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: "700"
    lineHeight: "1.2"
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: "600"
    lineHeight: "1.3"
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: "600"
    lineHeight: "1.3"
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: "600"
    lineHeight: "1.4"
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: "400"
    lineHeight: "1.6"
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: "1.5"
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "500"
    lineHeight: "1.4"
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "600"
    lineHeight: "1.2"
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  sidebar-width: 240px
  player-height: 96px
  container-margin: 40px
  gutter: 24px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is centered on a "Digital Editorial" aesthetic, bridging the gap between high-end print magazines and modern streaming interfaces. It targets a discerning audience that values curation, artistry, and a warm, inviting atmosphere over the typical cold, dark-mode tech aesthetic.

The visual language is characterized by **Sophisticated Minimalism**. It utilizes generous whitespace to let album art and typography breathe, while employing high-contrast serif headlines to create an authoritative, literary feel. The emotional response is one of calm, premium quality, and curated discovery.

## Colors

The palette is built on a foundation of warm, organic tones.

- **Base Background:** A warm ivory (#FAFAF7) serves as the primary canvas, reducing eye strain compared to pure white.
- **Primary Accent:** A bold Burnt Orange (#C84B31) is used for key actions (Play, Follow) and active states.
- **Secondary Elements:** Muted Grape Violet (#7B5EA7) provides a sophisticated contrast for secondary metadata and tag elements.
- **Highlights:** Golden Amber (#E8C547) is reserved for subtle accents, ratings, or premium badges.
- **Surface Neutrals:** Sidebar panels and container backgrounds use a slightly deeper Warm Cream (#F3F0E8) to create subtle structural differentiation without harsh borders.

## Typography

This design system uses a high-contrast typographic pairing to reinforce the editorial narrative.

- **Playfair Display** is used for all display and headline roles. It should be set with tight letter-spacing in larger sizes to emphasize its elegant, high-contrast strokes.
- **Inter** handles all functional UI text, body copy, and navigation labels. Its neutral, grotesque structure ensures maximum legibility against the more decorative headlines.
- **Uppercase Labels:** Small labels (e.g., track durations, metadata headers) should use Inter Bold with increased letter-spacing for a refined, catalog-style appearance.

## Layout & Spacing

The layout follows a **Fixed-Fluid hybrid model**:

- **Sidebar:** A fixed 240px left-hand navigation panel providing constant access to the library.
- **Main Content:** A fluid area using a 12-column grid. On desktop, generous 40px outer margins provide an "open-book" feel.
- **Sticky Player:** A constant 96px bottom bar that spans the full width of the viewport.

**Rhythm:** We utilize an 8px base grid. Spacing between related items (like a track name and artist) should be 4px or 8px, while sections are separated by 32px to 48px to maintain the minimalist, airy aesthetic.

## Elevation & Depth

Depth in this design system is achieved through **Tonal Layering** and **Soft Diffusion** rather than harsh shadows.

- **Base Layer:** The Warm Ivory main background.
- **Mid Layer:** Sidebar panels and card backgrounds use the Warm Cream color with no shadow, relying on slight hue shifts for separation.
- **Top Layer:** Floating elements like the bottom player bar use a high-density backdrop blur (frosted glass effect) with a very soft, long-range shadow (#C84B31 at 5% opacity) to provide a warm, ambient glow.
- **Focus States:** Elements being hovered or interacted with should lift slightly using a subtle 4px blur shadow, maintaining a "light-as-air" feel.

## Shapes

The shape language is **Soft and Precise**. We avoid overly round "bubble" aesthetics in favor of professional, architectural corners.

- **Standard UI (Buttons, Inputs):** 4px (0.25rem) radius for a crisp look.
- **Cards (Albums, Playlists):** 8px (0.5rem) radius to soften larger visual assets.
- **Active Indicators:** Sidebar active states use a vertical 2px wide line on the far left of the item, rather than rounded background pills, to maintain the editorial grid.

## Components

- **Buttons:** Primary buttons are Burnt Orange with white Inter text (Semi-bold). Secondary buttons use a hairline 1px border of the primary color.
- **Track Lists:** Designed as a table-row format. Use 1px hairline separators in a slightly darker cream (#EAE7DE). On hover, the entire row should transition to a very subtle tint of the primary color (2% opacity).
- **Sidebar Navigation:** Items use Inter (Medium) at 14px. The active state is indicated by the primary color text and a 2px vertical "ink-line" on the left edge.
- **Sticky Player:** Uses a frosted glass effect (Backdrop Filter: blur 20px) over the background ivory. Controls are centered, with the primary "Play" button being a slightly larger, circular Burnt Orange element.
- **Input Fields:** Minimalist design with only a bottom-border (1px) in the neutral-muted tone, shifting to Burnt Orange on focus.
- **Chips/Tags:** Small Grape Violet capsules with white 10px uppercase text for genre or mood tagging.
