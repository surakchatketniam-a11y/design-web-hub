---
version: alpha
name: สำนักงานใจดีพื้นที่พิจิตร-mixed-design
description: "A mixed design language for สำนักงานใจดีพื้นที่พิจิตร: colors from IBM, typography from Stripe, shapes from Stripe, and feel (flat surfaces) from IBM. Created with DESIGN.md Hub for learning and inspiration."

colors:
  canvas: "#ffffff"
  ink: "#161616"
  ink-secondary: "#525252"
  ink-mute: "#525252"
  primary: "#0f62fe"
  on-primary: "#ffffff"
  surface: "#f4f4f4"
  hairline: "#e0e0e0"
  hairline-card: "#e0e0e0"
  surface-tint-2: "#e0e0e0"
  band-dark: "#0050e6"
  on-band: "#ffffff"
  band-cta: "#0043ce"
  on-band-cta: "#ffffff"
  accent-1: "#002d9c"
  accent-2: "#24a148"
  accent-3: "#f1c21b"
  accent-4: "#da1e28"
  status-error: "#da1e28"
  status-success: "#1d813a"
  status-warning: "#876d0f"
  link: "#0f62fe"
  focus: "#0f62fe"

typography:
  display-xl:
    fontFamily: "Inter, 'Anuphan', 'Noto Sans Thai', system-ui, sans-serif"
    fontSize: 56px
    fontWeight: "300"
    lineHeight: "1.03"
    letterSpacing: -1.4px
  heading-lg:
    fontFamily: "Inter, 'Anuphan', 'Noto Sans Thai', system-ui, sans-serif"
    fontSize: 22px
    fontWeight: "300"
    lineHeight: "1.1"
    letterSpacing: -0.22px
  heading-md:
    fontFamily: "Inter, 'Anuphan', 'Noto Sans Thai', system-ui, sans-serif"
    fontSize: 20px
    fontWeight: "300"
    lineHeight: "1.4"
    letterSpacing: -0.2px
  body-md:
    fontFamily: "Inter, 'Anuphan', 'Noto Sans Thai', system-ui, sans-serif"
    fontSize: 15px
    fontWeight: "300"
    lineHeight: "1.4"
    letterSpacing: 0px
  button:
    fontFamily: "Inter, 'Anuphan', 'Noto Sans Thai', system-ui, sans-serif"
    fontSize: 16px
    fontWeight: "400"
    lineHeight: "1.0"
    letterSpacing: 0px
  caption:
    fontFamily: "Inter, 'Anuphan', 'Noto Sans Thai', system-ui, sans-serif"
    fontSize: 13px
    fontWeight: "400"
    lineHeight: "1.4"
    letterSpacing: -0.39px
  eyebrow:
    fontFamily: "Inter, 'Anuphan', 'Noto Sans Thai', system-ui, sans-serif"
    fontSize: 10px
    fontWeight: "400"
    lineHeight: "1.15"
    letterSpacing: 0.1px
  nav-link:
    fontFamily: "Inter, 'Anuphan', 'Noto Sans Thai', system-ui, sans-serif"
    fontSize: 15px
    fontWeight: "300"
    lineHeight: "1.4"
    letterSpacing: 0px

rounded:
  button: 9999px
  card: 12px
  input: 6px

spacing:
  section: "96px"
  card-padding: "32px"
  button-padding: "8px 16px"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "#161616"
    textColor: "#ffffff"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "8px 16px"
  card-feature:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "32px"
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.input}"
    padding: "10px 14px"
  band-section:
    backgroundColor: "{colors.band-dark}"
    textColor: "{colors.on-band}"
    rounded: "{rounded.card}"
    padding: "96px 24px"
---

## Overview

สำนักงานใจดีพื้นที่พิจิตร uses a **mixed** design language assembled from four sources. It is meant as a starting point for building a distinctive site, not as a copy of any existing brand.

- **Colors** follow IBM: a light canvas with `{colors.primary}` (`#0f62fe`) reserved for primary actions.
- **Typography** follows Stripe: display `sohne-var` (fallback stack `Inter, 'Anuphan', 'Noto Sans Thai', system-ui, sans-serif`), body `Inter, 'Anuphan', 'Noto Sans Thai', system-ui, sans-serif`.
- **Shapes** follow Stripe: buttons `9999px`, cards `12px`, inputs `6px`.
- **Feel** follows IBM: flat surfaces without drop shadows.

## Colors

- **canvas** (`#ffffff`)
- **ink** (`#161616`)
- **ink-secondary** (`#525252`)
- **ink-mute** (`#525252`)
- **primary** (`#0f62fe`)
- **on-primary** (`#ffffff`)
- **surface** (`#f4f4f4`)
- **hairline** (`#e0e0e0`)
- **hairline-card** (`#e0e0e0`)
- **surface-tint-2** (`#e0e0e0`)
- **band-dark** (`#0050e6`)
- **on-band** (`#ffffff`)
- **band-cta** (`#0043ce`)
- **on-band-cta** (`#ffffff`)
- **accent-1** (`#002d9c`)
- **accent-2** (`#24a148`)
- **accent-3** (`#f1c21b`)
- **accent-4** (`#da1e28`)
- **status-error** (`#da1e28`)
- **status-success** (`#1d813a`)
- **status-warning** (`#876d0f`)
- **link** (`#0f62fe`)
- **focus** (`#0f62fe`)

## Typography

| Token | Size | Weight | Line height | Letter spacing |
|---|---|---|---|---|
| `display-xl` | 56px | 300 | 1.03 | -1.4px |
| `heading-lg` | 22px | 300 | 1.1 | -0.22px |
| `heading-md` | 20px | 300 | 1.4 | -0.2px |
| `body-md` | 15px | 300 | 1.4 | 0px |
| `button` | 16px | 400 | 1.0 | 0px |
| `caption` | 13px | 400 | 1.4 | -0.39px |
| `eyebrow` | 10px | 400 | 1.15 | 0.1px |
| `nav-link` | 15px | 300 | 1.4 | 0px |

Proprietary fonts are replaced by freely available fallbacks (for example Inter). Keep the documented weights and tracking so the voice stays the same.

## Thai Typography

The Latin fonts above have no Thai glyphs. For Thai content pair them with free Thai fonts so the browser does not fall back to a system font:

- Thai display / headings: **Anuphan**
- Thai body text: **Anuphan**
- CSS stacks: `--font-thai-display: 'Anuphan', 'Noto Sans Thai', sans-serif`, `--font-thai-body: 'Anuphan', 'Noto Sans Thai', sans-serif` (see tokens.css). Keep the Thai font right after the Latin font in every `font-family`.
- Load from Google Fonts: `https://fonts.googleapis.com/css2?family=Anuphan:wght@400;500;600;700&display=swap`
- Set `<html lang="th">`. Body line-height 1.7 or more and headings 1.3 or more, even if the values above are tighter.
- Never apply letter-spacing (positive or negative) to Thai text; ignore the tracking values above for Thai. No uppercase or italics on Thai.
- Body text 16px or larger; let the browser wrap Thai lines and avoid fixed-width truncation.

## Layout

- Section vertical padding: `96px`. Card padding: `32px`.
- Keep one clear primary action per section.

## Elevation & Depth

- Surfaces are flat. Separate areas with hairlines (`{colors.hairline}`) and background changes, not shadows.

## Components

- **button-primary**: `{colors.primary}` fill, `{colors.on-primary}` text, radius `9999px`, padding `8px 16px`.
- **button-secondary**: outlined or transparent, same radius and padding.
- **card-feature**: `{colors.surface}` with hairline border, radius `12px`.

## Do's and Don'ts

### Do

- Use `{colors.primary}` for primary actions and key links only.
- Take every color, radius and font size from the tokens above (also available in `tokens.css`).
- Keep headlines in sentence case, with the documented weight.
- Separate surfaces with hairlines or background color changes.

### Don't

- Don't add colors that are not in the palette.
- Don't use `{colors.primary}` as the color of body text.
- Don't add drop shadows to cards, buttons or text.
- Don't change the button radius `9999px` on individual pages.
- Don't use the name, logo or imagery of the brands this mix was inspired by.

## Sources of inspiration

- Colors: IBM
- Typography: Stripe
- Shapes: Stripe
- Feel: IBM

Created with DESIGN.md Hub (https://github.com/surakchatketniam-a11y/design-web-hub). The source analyses come from VoltAgent/awesome-design-md (MIT License). For learning and inspiration only; not affiliated with any of the brands named above.
