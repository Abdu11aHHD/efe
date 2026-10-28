# Design system

A dark, Arabic-first healthcare surface modelled on the Sehhaty mobile application, with
one restrained variation reserved for the Sukkar Plus service.

## Canvas

The whole patient experience lives in a single `.sp-canvas`:

* `max-width: 440px`, centred, with a darker page behind it on a laptop
* full viewport width on a phone, `min-height: 100dvh`
* its own scroll region, so the header sticks and the bottom bar stays fixed
* `padding-bottom` reserves the nav height plus `env(safe-area-inset-bottom)`
* `dir="rtl"` and `lang="ar"` on `<html>`

The reviewer dashboard is the one exception: it leaves the canvas and uses a `max-w-5xl`
desktop layout.

## Colour tokens

Defined once on `:root` in `src/index.css` and exposed to Tailwind by name.

| Token | Value | Use |
|---|---|---|
| `--sp-canvas` | `#02040a` | the page behind the app on desktop |
| `--sp-bg` | `#04070d` | the app canvas |
| `--sp-surface` | `#1a1d22` | cards and tiles |
| `--sp-surface-2` | `#13161b` | grouped lists, segmented control, inputs |
| `--sp-surface-3` | `#262a31` | the active nav pill, pressed and hover states |
| `--sp-border` | `#262a31` | hairlines, used at 70 % opacity |
| `--sp-primary` | `#1e8fe0` | the healthcare blue: actions, titles, leading icons |
| `--sp-primary-strong` | `#3ba6ef` | hover and focus ring |
| `--sp-primary-soft` | `rgba(30,143,224,.14)` | icon chips, badges |
| `--sp-text` | `#ffffff` | headings and values |
| `--sp-text-2` | `#99a5b2` | body text |
| `--sp-text-3` | `#6b7682` | metadata, captions |
| `--sp-unread` | `#ff3366` | the unread dot |
| `--sp-mint` | `#32d4b4` | **Sukkar Plus only**: completed steps, friendly accents |
| `--sp-ok` / `--sp-warn` / `--sp-danger` | `#2fbf8f` / `#e0a32e` / `#ef5a6f` | status, each always with an icon and a word, never colour alone |

Glucose range bands keep their own validated palette (`#a32e4e`, `#e0704e`, `#1e8fe0`,
`#b98200`, `#97470f`) and are always drawn with a labelled legend.

## Type

**Noto Sans Arabic**, weights 400 / 500 / 600 / 700, from Google Fonts.
Base 15 px with a 1.65 line-height, which Arabic needs more than Latin does.

| Role | Size / weight |
|---|---|
| Screen title | 20 px / 700 |
| Section header | 17 px / 700 |
| Card title | 14.5 px / 600 |
| Body | 13–13.5 px / 400 |
| Metadata | 11.5–12.5 px / 400 |

Latin numerals, dates, identifiers and metric values sit inside `.sp-ltr`
(`direction: ltr; unicode-bidi: isolate`) so the bidirectional algorithm cannot reorder
them. Dates shown to people are written in Arabic words — *28 أكتوبر 2026* — never as ISO
strings, for the same reason.

## Shape and spacing

Radii: 16 px cards, 14 px tiles, 12 px icon chips, full pill for buttons and badges.
Spacing follows a 4 px scale; screens use a 16 px side gutter. Touch targets are at least
46 px tall; icon buttons are 36–40 px square.

## Components

`src/components/ui.tsx` holds the kit: `Card`, `SectionHeader`, `Button` (primary,
secondary, ghost, danger, mint), `Badge`, `Notice`, `ListRow`, `RowGroup`, `Segmented`,
`ProgressBar`, `Skeleton`, `ListSkeleton`, `EmptyState`, `ErrorState`, `ConfirmDialog`,
`Toast`, `Spinner`. `AppShell.tsx` holds the canvas chrome: `ScreenHeader`, `BottomNav`,
`Screen`, `DemoBanner`. `ServiceTile.tsx` holds the square health-service tiles and the
Sukkar Plus tile. `Icons.tsx` is one stroke-weight SVG set.

Every screen implements four states — loading (skeleton), error (with retry), empty (with
the action that fills it) and content. None of them is optional.

## Sukkar Plus personality

Inside the service the foundation is unchanged; what changes is warmth:

* a mint accent (`--sp-mint`) for completed journey steps, friendly notices and the
  secondary call to action
* one small line-chart illustration (`JourneyArt`) — the only decorative graphic
* a step timeline instead of a progress percentage, because there is no real percentage
* friendly microcopy: *أهلًا بك في سكر بلس*, *خلّنا نرتّب تقريرك مع بعض*,
  *تقريرك جاهز؟ خلّنا نشوف وش يقول*, *خطوة بسيطة لاستعداد أفضل لموعدك*

What it deliberately avoids: mascots, emoji, cartoon illustration, random gradients,
celebratory animation on a medical result, and any styling that would make an alert look
like a game.

## Motion

Transitions are 120–260 ms. A card scales to 0.975 on press; screens fade up 8 px on
enter; skeletons shimmer; the upload bar animates its real width. Everything is wrapped by

```css
@media (prefers-reduced-motion: reduce) { /* animations and transitions reduced to 0.001ms */ }
```

## Accessibility

Semantic landmarks (`header`, `main`, `nav`), `aria-label` on the nav and on icon-only
buttons, `aria-current="page"` on the active tab, `role="tab"` / `aria-selected` on the
segmented control, `role="dialog"` + `aria-modal` + Escape on the confirmation dialog,
`role="alert"` on error states, `role="progressbar"` with value on upload, labelled form
controls, and a visible focus ring on every interactive element. Status is never conveyed
by colour alone.
