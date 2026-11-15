# Attend Pal — Design System

> Source of truth: Stitch project `16824782504686943603`.  
> Screenshots are in `/design/screens/`. All tokens below are extracted from Stitch HTML.

---

## Color Palette

| Token (CSS var) | Hex | Used for |
|---|---|---|
| `--color-primary` | `#00288e` | Primary buttons, active nav, links |
| `--color-primary-container` | `#1e40af` | Filled button hover state |
| `--color-on-primary` | `#ffffff` | Text/icon on primary backgrounds |
| `--color-on-primary-container` | `#a8b8ff` | Text on primary-container |
| `--color-secondary` | `#515f74` | Secondary text, icons |
| `--color-secondary-container` | `#d5e3fc` | Chip / tag backgrounds |
| `--color-surface` | `#f8f9ff` | Page background |
| `--color-surface-container-lowest` | `#ffffff` | Card backgrounds |
| `--color-surface-container-low` | `#eff4ff` | Subtle section backgrounds |
| `--color-surface-container` | `#e5eeff` | Elevated cards |
| `--color-surface-container-high` | `#dce9ff` | Input fill |
| `--color-surface-container-highest` | `#d3e4fe` | Active list item |
| `--color-surface-dim` | `#cbdbf5` | Dividers, skeleton loaders |
| `--color-on-surface` | `#0b1c30` | Primary text |
| `--color-on-surface-variant` | `#444653` | Secondary / helper text |
| `--color-outline` | `#757684` | Input borders, dividers |
| `--color-outline-variant` | `#c4c5d5` | Subtle borders |
| `--color-error` | `#ba1a1a` | Error state text/icon |
| `--color-error-container` | `#ffdad6` | Error banner background |
| `--color-on-error-container` | `#93000a` | Text on error-container |
| `--color-tertiary` | `#003c36` | Success accent (verified) |
| `--color-tertiary-container` | `#00554e` | Verified badge bg |
| `--color-tertiary-fixed` | `#89f5e7` | Verified badge text |
| `--color-inverse-surface` | `#213145` | Dark card/tooltip |
| `--color-inverse-on-surface` | `#eaf1ff` | Text on inverse-surface |

> [!IMPORTANT]
> Status must always be **icon + text** — never color alone. Every status indicator needs a lucide-react icon alongside its label.

---

## Typography

Font: **Inter** via `next/font/google`. Variable: `--font-inter`.

| Class (Tailwind utility) | Size | Line height | Weight | Usage |
|---|---|---|---|---|
| `text-display-lg` | 36px | 44px | 700 | Hero headings |
| `text-headline-lg` | 32px | 40px | 700 | Page titles |
| `text-headline-md` | 28px | 36px | 600 | Section headings |
| `text-headline-sm` | 22px | 28px | 600 | Card headings |
| `text-title-lg` | 18px | 26px | 600 | Nav items, dialog titles |
| `text-title-md` | 16px | 24px | 600 | List item titles |
| `text-body-lg` | 18px | 28px | 400 | Prominent body copy |
| `text-body-md` | 16px | 24px | 400 | Default body text |
| `text-label-lg` | 15px | 20px | 500 | Button labels |
| `text-label-md` | 14px | 20px | 500 | Form labels, chips |
| `text-caption` | 13px | 18px | 400 | Timestamps, metadata (minimum size) |

---

## Spacing

| Token | Value | Use |
|---|---|---|
| `space-xs` | 4px | Tight gap between icon and label |
| `space-sm` | 8px | Inner padding for chips/badges |
| `space-md` | 16px | Card internal padding |
| `space-lg` | 24px | Section gap |
| `space-xl` | 40px | Large vertical gaps |
| `margin` | 32px | Page horizontal margin (desktop) |
| `gutter` | 24px | Column gutter (desktop) |
| `margin-mobile` | 16px | Page horizontal margin (mobile) |
| `gutter-mobile` | 16px | Column gutter (mobile) |

---

## Border Radius

| Token | Value | Use |
|---|---|---|
| `rounded` (DEFAULT) | 4px | Small elements: inputs, chips |
| `rounded-lg` | 8px | Cards |
| `rounded-xl` | 12px | Modals, drawers |
| `rounded-full` | 9999px | Pills, avatars |

---

## Component Conventions

### Buttons
- **Primary**: `bg-primary text-on-primary rounded-lg px-space-lg py-space-sm text-label-lg` — min height 44px
- **Secondary outlined**: `border border-outline text-primary rounded-lg` — min height 44px
- **Destructive**: `bg-error-container text-on-error-container`
- Always include a `disabled` state with 50% opacity and `cursor-not-allowed`

### Form inputs
- Fill: `bg-surface-container-high`
- Border: `border border-outline` (rest), `border-primary` (focus), `border-error` (error)
- Helper text: `text-caption text-on-surface-variant`
- Error text: `text-caption text-error`

### Status badges
Always pair an icon from `lucide-react` with the text label:

| Status | Icon | Background | Text |
|---|---|---|---|
| Verified | `CheckCircle2` | `tertiary-container` | `tertiary-fixed` |
| Pending | `Clock` | `secondary-container` | `on-surface-variant` |
| Flagged | `AlertTriangle` | `error-container` | `on-error-container` |
| Rejected | `XCircle` | `error-container` | `error` |
| Out of bounds | `MapPin` (with X) | `error-container` | `error` |

### Navigation (Lecturer — desktop sidebar)
Items: Dashboard · Classes · Sessions · Alerts (badge) · Reports · Settings  
Active item: `bg-surface-container-highest text-primary font-semibold`

### Mobile (Student)
- One task per screen
- Min tap target: 44×44px
- Full-width primary button at bottom of screen
- No navigation bar visible to students

---

## Accessibility
- WCAG AA contrast required on all text/background combinations
- Minimum font size: 13px (`text-caption`)
- Focus rings: `outline-2 outline-primary outline-offset-2` (set globally in `globals.css`)
- Never disable focus rings

---

## Stitch Screens Reference

Screenshots saved in `/design/screens/` after download.  
Full list: 32 screens in Stitch project `16824782504686943603`.

Key screen IDs:
| Screen | Stitch ID |
|---|---|
| Create Session | `9c3a368f70f5411b8457f4393784c76c` |
| Class Setup & Roster Import | `e6b351ffc6d147438d387a9da47a3a97` |
| Alerts Centre | `d6cefb011d324e4a9e744c3f4122a1d9` |
| Attendance Reports | `79d97c66141245f4a6dab3eb35747d05` |
| Lecturer Settings | `93b9dea69ed845d8966c6e4aaedf11b0` |
| Student: Enter Index Number | `1674748011951590759` (file) |
