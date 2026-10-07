---
version: alpha
name: กาแฟบ้านสวน-mixed-design
description: "A mixed design language for กาแฟบ้านสวน: colors from Claude, typography from Expo, shapes from Spotify, and feel (soft elevation, gradient washes) from Stripe. Created with DESIGN.md Hub for learning and inspiration."

colors:
  canvas: "#faf9f5"
  ink: "#141413"
  ink-secondary: "#6c6a64"
  ink-mute: "#6c6a64"
  primary: "#cc785c"
  on-primary: "#ffffff"
  surface: "#efe9de"
  hairline: "#e6dfd8"
  hairline-card: "#ebe6df"
  surface-tint-1: "#e8e0d2"
  surface-tint-3: "#f5f0e8"
  band-dark: "#252320"
  on-band: "#ffffff"
  accent-1: "#a9583e"
  accent-2: "#5db8a6"
  accent-3: "#e8a55a"
  status-error: "#b63f3f"
  status-success: "#386e44"
  status-warning: "#7f600e"
  link: "#cc785c"
  focus: "#cc785c"

typography:
  display-xl:
    fontFamily: "Inter, 'Anuphan', 'Noto Sans Thai', system-ui, sans-serif"
    fontSize: 64px
    fontWeight: "600"
    lineHeight: "1.05"
    letterSpacing: -1.92px
  heading-lg:
    fontFamily: "Inter, 'Anuphan', 'Noto Sans Thai', system-ui, sans-serif"
    fontSize: 18px
    fontWeight: "600"
    lineHeight: "1.4"
    letterSpacing: 0px
  heading-md:
    fontFamily: "Inter, 'Anuphan', 'Noto Sans Thai', system-ui, sans-serif"
    fontSize: 18px
    fontWeight: "600"
    lineHeight: "1.4"
    letterSpacing: 0px
  body-md:
    fontFamily: "Inter, 'Anuphan', 'Noto Sans Thai', system-ui, sans-serif"
    fontSize: 16px
    fontWeight: "400"
    lineHeight: "1.5"
    letterSpacing: 0px
  button:
    fontFamily: "Inter, 'Anuphan', 'Noto Sans Thai', system-ui, sans-serif"
    fontSize: 14px
    fontWeight: "500"
    lineHeight: "1.0"
    letterSpacing: 0px
  caption:
    fontFamily: "Inter, 'Anuphan', 'Noto Sans Thai', system-ui, sans-serif"
    fontSize: 13px
    fontWeight: "400"
    lineHeight: "1.4"
    letterSpacing: 0px
  eyebrow:
    fontFamily: "Inter, 'Anuphan', 'Noto Sans Thai', system-ui, sans-serif"
    fontSize: 13px
    fontWeight: "600"
    lineHeight: "1.3"
    letterSpacing: 0px
  nav-link:
    fontFamily: "Inter, 'Anuphan', 'Noto Sans Thai', system-ui, sans-serif"
    fontSize: 14px
    fontWeight: "500"
    lineHeight: "1.4"
    letterSpacing: 0px

rounded:
  button: 8px
  card: 12px
  input: 8px

spacing:
  section: "88px"
  card-padding: "28px"
  button-padding: "11px 20px"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "11px 20px"
  button-secondary:
    backgroundColor: "#faf9f5"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "11px 20px"
  card-feature:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "28px"
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
    padding: "88px 24px"
---

## Overview

กาแฟบ้านสวน uses a **mixed** design language assembled from four sources. It is meant as a starting point for building a distinctive site, not as a copy of any existing brand.

- **Colors** follow Claude: a light canvas with `{colors.primary}` (`#cc785c`) reserved for primary actions.
- **Typography** follows Expo: display `Inter` (fallback stack `Inter, 'Anuphan', 'Noto Sans Thai', system-ui, sans-serif`), body `Inter, 'Anuphan', 'Noto Sans Thai', system-ui, sans-serif`.
- **Shapes** follow Spotify: buttons `8px`, cards `12px`, inputs `8px`.
- **Feel** follows Stripe: soft, restrained elevation; soft gradient washes behind hero areas.

## Colors

- **canvas** (`#faf9f5`)
- **ink** (`#141413`)
- **ink-secondary** (`#6c6a64`)
- **ink-mute** (`#6c6a64`)
- **primary** (`#cc785c`)
- **on-primary** (`#ffffff`)
- **surface** (`#efe9de`)
- **hairline** (`#e6dfd8`)
- **hairline-card** (`#ebe6df`)
- **surface-tint-1** (`#e8e0d2`)
- **surface-tint-3** (`#f5f0e8`)
- **band-dark** (`#252320`)
- **on-band** (`#ffffff`)
- **accent-1** (`#a9583e`)
- **accent-2** (`#5db8a6`)
- **accent-3** (`#e8a55a`)
- **status-error** (`#b63f3f`)
- **status-success** (`#386e44`)
- **status-warning** (`#7f600e`)
- **link** (`#cc785c`)
- **focus** (`#cc785c`)

## Typography

| Token | Size | Weight | Line height | Letter spacing |
|---|---|---|---|---|
| `display-xl` | 64px | 600 | 1.05 | -1.92px |
| `heading-lg` | 18px | 600 | 1.4 | 0px |
| `heading-md` | 18px | 600 | 1.4 | 0px |
| `body-md` | 16px | 400 | 1.5 | 0px |
| `button` | 14px | 500 | 1.0 | 0px |
| `caption` | 13px | 400 | 1.4 | 0px |
| `eyebrow` | 13px | 600 | 1.3 | 0px |
| `nav-link` | 14px | 500 | 1.4 | 0px |

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

- Section vertical padding: `88px`. Card padding: `28px`.
- Keep one clear primary action per section.

## Elevation & Depth

- Use soft shadows only under cards and floating panels. Documented values: `rgba(0,55,112,0.08) 0 1px 3px`, `rgba(0,55,112,0.08) 0 8px 24px, rgba(0,55,112,0.04) 0 2px 6px`.
- Gradient washes built from the accent colors may sit behind hero areas only — never behind body text or controls.

## Components

- **button-primary**: `{colors.primary}` fill, `{colors.on-primary}` text, radius `8px`, padding `11px 20px`.
- **button-secondary**: outlined or transparent, same radius and padding.
- **card-feature**: `{colors.surface}` with hairline border, radius `12px`.

## Do's and Don'ts

### Do

- Use `{colors.primary}` for primary actions and key links only.
- Take every color, radius and font size from the tokens above (also available in `tokens.css`).
- Keep headlines in sentence case, with the documented weight.
- Keep shadows soft and use them sparingly.
- Use gradient washes behind hero areas to create atmosphere.

### Don't

- Don't add colors that are not in the palette.
- Don't use `{colors.primary}` as the color of body text.
- Don't stack heavy shadows or glow effects.
- Don't change the button radius `8px` on individual pages.
- Don't use the name, logo or imagery of the brands this mix was inspired by.

## Sources of inspiration

- Colors: Claude
- Typography: Expo
- Shapes: Spotify
- Feel: Stripe

Created with DESIGN.md Hub (https://github.com/surakchatketniam-a11y/design-web-hub). The source analyses come from VoltAgent/awesome-design-md (MIT License). For learning and inspiration only; not affiliated with any of the brands named above.
