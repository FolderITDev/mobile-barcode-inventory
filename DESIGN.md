# Barcode Inventory design system

A compact precision instrument: dark-first, fast to read under warehouse lighting and explicit about numerical differences. The memorable element is the **large aligned observed / expected pair** and the strong lime scan action. The light appearance is a complete alternative, not an afterthought.

This document is the source of truth for the interface. Tokens live in [`src/theme/tokens.ts`](src/theme/tokens.ts) and shared components in [`src/ui/`](src/ui); screens use both and never hard-code colors, fonts or spacing.

## Principles

- Numbers are the content: condensed display figures and tabular mono columns that align across rows.
- Every difference reads as a word and a signed quantity: *Short by 2*, *Over by 1*, *Unexpected*.
- A line nobody counted yet reads *Not counted yet*, never *Short*.
- The scanner is quiet: dark camera view, a simple reticle, and manual entry always one tap away.

## Color

Dark is the primary appearance; every token has a value in both. Use tokens by role, not by hue.

| Token | Dark | Light | Use |
| --- | --- | --- | --- |
| `canvas` | `#0F1722` | `#F2F7F6` | Screen background |
| `surface` | `#1A2632` | `#FFFFFF` | Fields, cards and grouped content |
| `raised` | `#2E3F4E` | `#FFFFFF` | Control that sits on a `fill` track, such as the segmented thumb |
| `fill` | `#1F2D3A` | `#E3ECEB` | Tracks, pressed rows and quiet containers |
| `ink` | `#EAF2F3` | `#10232B` | Primary text and icons |
| `muted` | `#A9BDC2` | `#50626A` | Secondary text and metadata |
| `tertiary` | `#7F939B` | `#687A82` | Placeholders and de-emphasized captions |
| `accent` | `#D4F45B` | `#155E64` | Primary action, current step and selection |
| `accentSubtle` | `#28331A` | `#DCEBEA` | Background behind accent content |
| `onAccent` | `#0F1722` | `#FFFFFF` | Text and icons on `accent` |
| `info` | `#67D6D6` | `#0E6B6B` | Matched lines and scan guidance |
| `infoSubtle` | `#163236` | `#DCF0EF` | Background behind info content |
| `caution` | `#F2B35A` | `#8A4B00` | Short, over and unexpected lines |
| `cautionSubtle` | `#33281A` | `#FBEBD6` | Background behind caution content |
| `rule` | `#34444F` | `#C7D8D9` | Dividers and list rules |
| `control` | `#667B87` | `#7C9096` | Field and control borders |
| `imageOutline` | `rgba(255, 255, 255, 0.1)` | `rgba(0, 0, 0, 0.1)` | 1 px outline around photos |

Measured contrast for the core pairs. Dark: ink on canvas 15.86:1, muted on canvas 9.22:1, on-accent on accent 14.49:1. Light: ink on canvas 14.96:1, muted on canvas 5.89:1, on-accent on accent 7.45:1.

## Typography

**Barlow Condensed** for titles and counters, **Barlow** for interface text and **IBM Plex Mono** with tabular numerals for barcodes and quantities. Fonts are bundled from `@expo-google-fonts`; licenses are in `docs/font-licenses/`.

| Variant | Font | Size / line | Tracking | Max scale | Use |
| --- | --- | --- | --- | --- | --- |
| `meter` | BarlowCondensed 600 | 64 / 64 | -0.5 | 1.3× | Counted / expected metric on the count screen |
| `display` | BarlowCondensed 600 | 34 / 38 | -0.2 | 1.4× | Large screen titles |
| `title` | BarlowCondensed 600 | 28 / 32 | 0 | 1.6× | Section and sheet titles |
| `number` | BarlowCondensed 600 | 24 / 28 | 0 | 1.5× | Per-line and tally quantities |
| `headline` | Barlow 600 | 17 / 22 | 0 | 2× | Row titles and emphasized values |
| `body` | Barlow 400 | 16 / 23 | 0 | 2× | Paragraphs and field values |
| `button` | Barlow 600 | 16 / 20 | 0.1 | 1.6× | Button labels |
| `label` | Barlow 500 | 15 / 20 | 0 | 2× | Field labels and compact actions |
| `subhead` | Barlow 400 | 14 / 20 | 0 | 2× | Supporting text under titles |
| `footnote` | Barlow 400 | 13 / 18 | 0.1 | 2× | Metadata, timestamps and hints |
| `eyebrow` | IBMPlexMono 500 | 12 / 16 | 0.8 | 1.8× | Uppercase section labels (screen readers get sentence case) |
| `code` | IBMPlexMono 500 | 13 / 18 | 0.4 | 2× | Codes and references |

Tracking tightens as size grows and opens slightly on small text. `Max scale` caps Dynamic Type only where a display size would otherwise overflow.

## Spacing and shape

- Spacing (pt): `xxs` 2 · `xs` 4 · `sm` 8 · `md` 12 · `lg` 16 · `xl` 24 · `xxl` 32 · `xxxl` 48 · `gutter` 18. `gutter` is the screen edge inset.
- Radius (pt): `sm` 4 · `md` 8 · `lg` 10 · `pill` 999.
- Narrow corners: 4 pt for small elements, 8 pt for controls and 10 pt for surfaces, with thin outlines. Dense but not cramped: 4-point grid and an 18 pt gutter. No glow or gaming effects.
- The app stores no images. Documentation screenshots use fictional items and codes from the GS1 restricted range (prefix `200`).

## Motion

- Durations (ms): press: 120, quick: 160, base: 220, enter: 260. UI motion stays under 300 ms; navigation transitions belong to the platform.
- Curves: strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)` for entering and state changes, ease-in-out `cubic-bezier(0.77, 0, 0.175, 1)` for movement between two positions. Never ease-in on UI.
- Press feedback starts on press-in and scales to 0.97; it commits on release.
- One haptic per user action, on the same frame as the visual change. Haptics are never the only feedback.
- Animate only meaningful state changes. No decorative loops, confetti or counters that hide the real value.
- An accepted scan triggers one short success haptic and a text confirmation. Counters never animate in a way that hides the actual value.

## Components

| Component | Use it for |
| --- | --- |
| `Text` | Every string. Pick a `variant` from the type scale and a `tone` from the palette; never set font family or size inline. |
| `Button` | `primary`, `secondary`, `plain` and `destructive` actions. `busy` keeps the label in place and swaps the icon for a spinner. |
| `HeaderButton` | Native-header actions. Icon-only buttons always carry an accessible name. |
| `ScrollScreen`, `Block`, `Footer` | Screen body. `Block` aligns free-standing content to the gutter; `Footer` is the pinned action bar that clears the home indicator and the keyboard. |
| `Section`, `Row`, `ActionRow`, `Separator` | Ruled lists with `Row`, `ActionRow` and `Separator`. Rows are full-bleed with a background highlight on press, not cards. |
| `TextField` | Labelled inputs. `requirement` writes Required or Optional next to the label; `error` replaces the hint under the field. |
| `SegmentedControl` | Two or three mutually exclusive views, each with its count. |
| `EmptyState`, `Notice` | Empty lists (`EmptyState`) and inline errors next to the action that failed (`Notice`). |
| `Icon` | Semantic icon names mapped to SF Symbols on iOS and Material Symbols on Android and web. Screens never reference raw glyphs. |
| `PressableScale` | Custom pressable surfaces that need press feedback. |

Add a component to `src/ui/` only when a second screen needs it; otherwise keep it beside its feature in `src/features/<feature>/components/`.

## Screens

1. **Counts.** Large title and the sessions list: active counts first, each with name, state, line count and an observed / expected units pair.
2. **New count (modal).** Count name, the expected items with barcode and quantity, and a form to add an item with EAN-13 check-digit validation. **Start** sits in the header and fixes the expected quantities.
3. **Count.** Name, the large counted / expected metric, a one-line summary (`2 of 6 lines matched · 2 short · 1 over · 1 unexpected`), an **All lines / Differences** filter and rows with status words and − / + steppers. **Scan barcode** is pinned in the footer and **Review** sits in the header.
4. **Scanner (full-screen modal).** Dark camera view with a rectangular reticle, torch toggle where supported and a close button. After an accepted read it shows what was recorded and pauses until **Scan next unit**. Manual entry is always available and becomes the main path when camera access is off.
5. **Close count (modal).** Tallies of matched, short, over and unexpected, the list of differences, and **Close count**, which makes the count read-only.
6. **About.** How counting works, a destructive **Delete all counts** row and the version and license line.

Navigation uses native Expo Router stacks: large titles on root screens, modals for creation and review, and platform back gestures everywhere.

## States

Every screen designs four states explicitly:

- **Loading:** the splash stays up until stored records are readable, so lists never flash empty.
- **Empty:** an `EmptyState` with an icon, one sentence on what to do and the primary action.
- **Error:** a `Notice` next to the action that failed. Forms keep their values and any selected photo so the person can retry.
- **Content:** the normal layout. Destructive actions ask for confirmation with the platform dialog.

## Accessibility

- Touch targets are at least 48 pt (`hitTarget`), including icon buttons and steppers.
- Every status is conveyed with an icon **and** words; color is never the only signal.
- Text scales with the system setting up to each variant's max scale; layouts wrap instead of truncating meaningful content.
- Every interactive element has an accessible role and name; custom controls expose their state (selected, checked, disabled, busy).
- Screen-reader labels read as sentences, without doubled punctuation, and announce errors when they appear.
- Reduce Motion replaces scale and slide effects with short opacity changes.
- Contrast targets: body text ≥ 4.5:1, large text and control borders ≥ 3:1, in both appearances.

## Copy

- English, sentence case, short and specific. Buttons say what happens (**Confirm delivery**, not **OK**).
- Errors say what went wrong and what to do next.
- Never claim more than the app does: no verified identity, certified time, compliance or authenticity statements.
