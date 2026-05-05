# Lektionsvy — Landing Page Design Brief

This document captures the design decisions from the classroom-screen app to ensure the landing page echoes the same visual identity.

## Brand Identity

**Product name**: Lektionsvy
**Tagline idea**: Widgetbaserad klassrumsvy for svenska skolor
**Tone**: Clean, professional, pedagogiskt — inte flashigt eller oversaljande

## Logo

The logo is a filled rounded rectangle representing a screen with 2x2 widget blocks inside, plus "LEKTIONSVY" in League Spartan. No monitor stand — clean and modern.

- Light mode: indigo screen (#312e81) with white widget blocks, text in #312e81
- Dark mode: lavender screen (#c7d2fe) with dark widget blocks, text in #e0e7ff
- Logo SVGs live in `src/themes/default/logo-light.svg` and `logo-dark.svg`
- Aspect ratio: 1600x300

## Typography

- **Display/Logo font**: League Spartan (Google Fonts), weight 500
- **Body font**: Inter (Google Fonts) or system -apple-system stack
- The app uses `--font-body` and `--font-display` CSS variables

## Color Palette (Default Theme — Indigo)

### Primary (indigo)

| Token | Hex     | Usage                                 |
| ----- | ------- | ------------------------------------- |
| 900   | #1e1b4b | Text, dark base, headings             |
| 700   | #4338ca | Strong accents, buttons               |
| 600   | #4f46e5 | Primary interactive, CTA              |
| 500   | #6366f1 | Hover states, secondary               |
| 300   | #c7d2fe | Light accents, badges, dark mode icon |

### Danger (red)

| Token | Hex     |
| ----- | ------- |
| 700   | #b91c3a |
| 600   | #dc2e4a |
| 500   | #e8566e |

### Warm (orange)

| Token | Hex     |
| ----- | ------- |
| 700   | #9a4520 |
| 600   | #c25a2b |
| 500   | #d87a45 |

### Success (green)

| Token | Hex     |
| ----- | ------- |
| 700   | #2f5233 |
| 600   | #476b3d |
| 500   | #6b8e4a |

## Backgrounds

### Light mode

- Page background: #f5f6fb (very light lavender-white)
- Gradient accent: subtle #eaecf6 at bottom
- Surfaces: white at 94% opacity
- Text: #1e1b4b (primary-900)

### Dark mode

- Page background: #101020 (deep near-black with subtle indigo)
- Gradient accent: #181830 at bottom
- Surfaces: rgba(22, 22, 42, 0.92)
- Text: #eef0f8

### Atmospheric orbs (used in the app)

The app has two subtle radial gradient orbs behind the content:

- Left/bottom: indigo-tinted (#c7d2fe at 70% light / 10% dark)
- Right/top: warm-tinted (#f0a878 at 35% light / 8% dark)

These can be replicated on the landing page for visual consistency.

## Design Characteristics

- **Rounded corners**: Generous — 20-28px on cards/sections, 8-10px on smaller elements
- **Shadows**: Very subtle — rgba with 4-6% opacity
- **Borders**: Near-invisible — rgba at 10-12% opacity
- **Spacing**: Generous whitespace, content never feels cramped
- **Animations**: Minimal, purposeful — no gratuitous motion

## Key Selling Points for Landing Page

1. **Open source** — free to use, fork, and customize
2. **Theme system** — schools can brand it with their own colors, fonts, and logo
3. **Widget-based** — drag, resize, and compose your classroom view
4. **Works offline** — no accounts needed, runs entirely in the browser
5. **Swedish-first** — built for Swedish schools, UI in Swedish

## Widgets to Showcase

- Digital clock, analog clock, LCD clock
- Timer (countdown), lesson timer (analog dial)
- Stopwatch with lap function
- Text (heading) with font toggle
- Body text (rich text with Tiptap)
- QR code generator
- School logo

## Architecture Context

- Landing page: Astro (static, lektionsvy.se)
- App: SvelteKit (app.lektionsvy.se)
- School variants: separate branded repos and deployments

## File References

Core design assets live in the classroom-screen repo:

- Default theme: `src/themes/default/`
- Theme config type: `src/lib/theme/types.ts`
