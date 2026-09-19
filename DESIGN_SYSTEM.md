# SabiLearn Design System Specification

> Extracted & codified from [Taste Engine Design System Specification (Submission 3cc42a2a)](https://engine.tastelabs.com/public/3cc42a2a-3b65-4a6e-8daf-70a389cd7812).

---

## 1. Brand Core & Identity

* **Brand Name**: SabiLearn
* **Tagline**: Make your study workflow faster and smarter
* **Industry**: EdTech / Online Learning (Nigerian Higher Education & Lifelong Learning)
* **Tone of Voice**: Friendly, Encouraging, Accessible, Modern, Energetic
* **Visual Signature**: 
  - Warm organic off-white canvas (`#FAF9F7`) creating an approachable, paper-like reading environment.
  - High-energy **Golden Amber** (`#F8BE43` / `#F2A900`) for primary calls to action and active highlights.
  - Electric **AI Violet** (`#5B4FE8`) anchoring intelligent features and AI study tools.
  - Stark **Heavy Dark Ink** (`#0E0E1A`) for ultra-legible typography and distinctive **2px structural borders**.

---

## 2. Color Tokens & Palette

### Primary Brand Colors
| Token | Variable | Hex | Usage |
|---|---|---|---|
| `primary.gold` | `--brand-gold` | `#F8BE43` | Primary CTAs, active tab fills, brand badges |
| `primary.goldDark` | `--brand-gold-dark` | `#F2A900` | Modal primary buttons, gradient stop |
| `primary.goldHover` | `--brand-gold-600` | `#D89400` | Hover states on primary buttons |
| `primary.goldLight` | `--brand-gold-100` | `#FBDDB0` | Text selections, subtle amber badge backgrounds |

### AI Accent Colors
| Token | Variable | Hex | Usage |
|---|---|---|---|
| `ai.violet` | `--brand-violet` | `#5B4FE8` | AI assistant highlights, secondary focus elements |
| `ai.violetDark` | `--brand-violet-600` | `#4A3FD1` | AI button hover states |
| `ai.violetLight` | `--brand-violet-100` | `#E7E3FB` | AI pill badge background |

### Ink & Typography Hierarchy
| Token | Variable | Hex | Usage |
|---|---|---|---|
| `ink.900` | `--ink-900` | `#0E0E1A` | H1–H6 Headings, heavy structural borders, dark footer |
| `ink.700` | `--ink-700` | `#35354A` | Primary body text, main navigation links |
| `ink.500` | `--ink-500` | `#6B6B80` | Subtitle copy, metadata, secondary descriptions |
| `ink.300` | `--ink-300` | `#A9A9BC` | Muted footer text, placeholder text |
| `ink.100` | `--ink-100` | `#DEDAD0` | Subtle warm line dividers, neutral borders |

### Canvas & Surfaces
| Token | Variable | Hex | Usage |
|---|---|---|---|
| `surfaces.canvas` | `--surface-page` | `#FAF9F7` | Main page body canvas |
| `surfaces.card` | `--surface-card` | `#FFFFFF` | Elevated interactive cards, dialog modals |
| `surfaces.sunken` | `--surface-sunken` | `#ECE8DF` | Input boxes, sunken panels, chip backgrounds |
| `surfaces.inverse` | `--surface-inverse` | `#0E0E1A` | Inverted dark sections and footer container |

### Semantic & Feedback
| Token | Variable | Hex | Usage |
|---|---|---|---|
| `feedback.success` | `--success` | `#10B981` | Validation green, success states, completed tasks |
| `feedback.danger` | `--danger` | `#E5484D` | Error alerts, destructive actions |
| `feedback.warning` | `--warning` | `#E8890C` | Warning callouts, pending status |

---

## 3. Typography Hierarchy

* **Display Font**: `"Space Grotesk", system-ui, -apple-system, sans-serif`
* **Body Font**: `"Space Grotesk", system-ui, -apple-system, sans-serif`
* **Monospace Font**: `"Space Mono", "Space Grotesk", monospace`

| Scale Level | CSS Variable | Font Size | Weight | Line Height | Letter Spacing | Purpose |
|---|---|---|---|---|---|---|
| **H1 Display** | `--text-5xl` | `62px` | `700` (Bold) | `1.08` | `-0.03em` | Main Hero Headline |
| **Price / Stat** | `--text-4xl` | `48px` | `800` (ExtraBold) | `1.11` | `-0.02em` | Pricing plan numbers, stat counters |
| **H2 Section** | `--text-3xl` | `42px` | `700` (Bold) | `1.15` | `-0.02em` | Feature section titles |
| **H3 Subsection** | `--text-2xl` | `30px` | `700` (Bold) | `1.33` | Normal | Subsection headers |
| **H4 Card Title** | `--text-xl` | `24px` | `700` (Bold) | `1.40` | Normal | Card headers, feature labels |
| **Lead Body** | `--text-lg` | `20px` | `400` (Regular) | `1.65` | Normal | Hero intro paragraphs |
| **Regular Body**| `--text-base` | `16px` | `400` (Regular) | `1.65` | Normal | Standard article & body copy |
| **Button Large**| `--text-base` | `16px` | `700` (Bold) | `1.50` | Normal | Primary CTAs |
| **Small Body**  | `--text-sm` | `14px` | `400` (Regular) | `1.43` | Normal | Secondary copy, helper labels |
| **Caption**     | `--text-xs` | `12px` | `600` (SemiBold)| `1.33` | `+0.04em` | Pill badges, metadata tags |

---

## 4. Spacing, Borders & Shadows

### Border Radius Scale
```css
--radius-sm:  8px;    /* Action buttons, input boxes */
--radius-md:  12px;   /* Modal dialogs, small panels */
--radius-lg:  16px;   /* Content cards */
--radius-xl:  20px;   /* Medium elevated containers */
--radius-2xl: 28px;   /* Large pricing cards & feature containers */
--radius-full: 9999px;/* Circular buttons & pill tabs */
```

### Elevation & Drop Shadows
```css
--shadow-xs: 0 1px 2px rgba(14, 14, 26, 0.06);   /* Input focus & subtle lift */
--shadow-sm: 0 2px 8px rgba(14, 14, 26, 0.08);   /* Default card elevation */
--shadow-md: 0 8px 24px rgba(14, 14, 26, 0.10);  /* Hover elevation */
--shadow-lg: 0 16px 40px rgba(14, 14, 26, 0.14); /* Floating modals & popovers */
--shadow-xl: 0 24px 60px rgba(14, 14, 26, 0.18); /* High-impact overlays */
```

### Structural Borders
* **Structural Border**: `2px solid var(--ink-900)` (`#0E0E1A`) for primary cards, feature outlines, and distinctive brand accents.
* **Warm Divider**: `1px solid var(--line)` (`#DEDAD0`) for table rows, section splits, and subtle boundaries.

---

## 5. UI Component Specifications

### 1. Buttons
* **Primary**: `bg-[var(--brand-gold)] text-[var(--ink-900)] rounded-[var(--radius-sm)] font-bold hover:bg-[var(--brand-gold-600)]`
* **Secondary**: `bg-transparent text-[var(--ink-900)] border-[1.5px] border-[var(--ink-900)] rounded-[var(--radius-sm)] hover:bg-[var(--surface-sunken)]`
* **AI Tool Action**: `bg-[var(--brand-violet)] text-white rounded-[var(--radius-sm)] hover:bg-[var(--brand-violet-600)]`
* **Ghost**: `text-[var(--ink-700)] hover:bg-[var(--surface-sunken)]`

### 2. Cards
* **Standard Content Card**: `bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--line)] shadow-[var(--shadow-xs)]`
* **Feature Highlight Card**: `bg-[var(--surface-card)] rounded-[var(--radius-2xl)] border-2 border-[var(--ink-900)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]`

### 3. Badges & Status Pills
* **AI Feature Tag**: `bg-[var(--brand-violet-100)] text-[var(--brand-violet)] font-semibold rounded-full px-3 py-1 text-xs`
* **Brand Highlight**: `bg-[var(--brand-gold-100)] text-[var(--ink-900)] font-semibold rounded-full px-3 py-1 text-xs`
* **Success Tag**: `bg-[var(--success-100)] text-[var(--success)] font-semibold rounded-full px-3 py-1 text-xs`

---

## 6. Programmatic Consumption

### In CSS:
```css
@import "../styles/tokens/colors.css";
@import "../styles/tokens/typography.css";
@import "../styles/tokens/spacing.css";
@import "../styles/tokens/effects.css";
```

### In TypeScript / React:
```tsx
import { DESIGN_TOKENS } from '@/lib/design-tokens';

console.log(DESIGN_TOKENS.colors.primary.gold); // '#F8BE43'
console.log(DESIGN_TOKENS.typography.fonts.display); // '"Space Grotesk", system-ui, ...'
```
