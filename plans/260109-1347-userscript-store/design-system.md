# Design System - UserJS Store

## Style Direction

**Primary Style:** Dark Mode (OLED) + Minimalism
**Secondary:** Flat Design, Bento Box Grid
**Target Audience:** Developers
**Complexity:** Low
**Performance:** Excellent
**Accessibility:** WCAG AAA compliant

## Color Palette

### Dark Mode (Primary)

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Primary | `#3B82F6` | `blue-500` | Links, buttons, focus |
| Secondary | `#1E293B` | `slate-800` | Cards, surfaces |
| CTA | `#22C55E` | `green-500` | Install buttons |
| Background | `#0F172A` | `slate-900` | Page background |
| Surface | `#1E293B` | `slate-800` | Card background |
| Text | `#F1F5F9` | `slate-100` | Primary text |
| Text Muted | `#94A3B8` | `slate-400` | Secondary text |
| Border | `#334155` | `slate-700` | Dividers, card borders |

### Light Mode

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Primary | `#2563EB` | `blue-600` | Links, buttons |
| Background | `#F8FAFC` | `slate-50` | Page background |
| Surface | `#FFFFFF` | `white` | Card background |
| Text | `#0F172A` | `slate-900` | Primary text |
| Text Muted | `#64748B` | `slate-500` | Secondary text |
| Border | `#E2E8F0` | `slate-200` | Dividers |

## Typography

**Font Pairing:** Developer Mono (JetBrains Mono + IBM Plex Sans)

```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

**Tailwind Config:**
```js
fontFamily: {
  sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
}
```

### Type Scale

| Element | Size | Weight | Font |
|---------|------|--------|------|
| H1 | `text-2xl` / `text-3xl` | `font-bold` | sans |
| H2 | `text-xl` | `font-semibold` | sans |
| H3 | `text-lg` | `font-semibold` | sans |
| Body | `text-base` | `font-normal` | sans |
| Small | `text-sm` | `font-normal` | sans |
| Code/Version | `text-sm` | `font-medium` | mono |

## Component Specifications

### Script Card

```
┌─────────────────────────────────────────┐
│ [Category Badge]              v1.0.0    │
│                                         │
│ Script Name                             │
│ Description text goes here...           │
│                                         │
│ [youtube.com] [github.com]              │
│                                         │
│ ┌─────────┐  ┌─────────┐                │
│ │ Install │  │ Source  │                │
│ └─────────┘  └─────────┘                │
└─────────────────────────────────────────┘
```

**Specs:**
- Border radius: `rounded-lg` (8px)
- Padding: `p-4` (16px)
- Border: `border border-slate-700` (dark) / `border-slate-200` (light)
- Hover: `hover:border-blue-500/50` + `cursor-pointer`
- Transition: `transition-colors duration-200`

### Header/Navbar

```
┌───────────────────────────────────────────────────────┐
│  UserJS Store          Scripts   Bookmarks   [🌙/☀️]  │
└───────────────────────────────────────────────────────┘
```

**Specs:**
- Position: `sticky top-0`
- Background: `bg-slate-900/80 backdrop-blur-sm` (dark)
- Border bottom: `border-b border-slate-700`
- Height: `h-16`

### Search Bar

```
┌──────────────────────────────────────┐
│ 🔍  Search scripts...                │
└──────────────────────────────────────┘
```

**Specs:**
- Border radius: `rounded-lg`
- Padding: `pl-10 pr-4 py-2`
- Focus: `focus:ring-2 focus:ring-blue-500 focus:outline-none`
- Background: `bg-slate-800` (dark) / `bg-white` (light)

### Buttons

| Type | Classes |
|------|---------|
| Primary (Install) | `bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg` |
| Secondary | `border border-slate-600 hover:bg-slate-800 px-4 py-2 rounded-lg` |
| Ghost | `hover:bg-slate-800 p-2 rounded-lg` |

### Badge/Tag

```
Category: `bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-medium`
Match URL: `bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs`
```

## Layout

### Grid System

```
Home page (scripts):
- Mobile: 1 column
- Tablet (md): 2 columns
- Desktop (lg): 3 columns

grid gap-4 md:grid-cols-2 lg:grid-cols-3
```

### Spacing

| Context | Value |
|---------|-------|
| Page padding | `px-4 py-6` |
| Section gap | `space-y-6` |
| Card gap | `gap-4` |
| Element gap (small) | `gap-2` |

### Container

```
max-w-6xl mx-auto px-4
```

## Animation Guidelines

| Property | Duration | Easing |
|----------|----------|--------|
| Color transitions | 200ms | ease-out |
| Opacity | 150ms | ease-out |
| Transform (avoid) | - | - |

**Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0.01ms !important; }
}
```

## Icons

**Library:** Lucide Vue Next

| Context | Icon |
|---------|------|
| Search | `Search` |
| Install | `Download` |
| External link | `ExternalLink` |
| Back | `ArrowLeft` |
| Dark mode | `Moon` |
| Light mode | `Sun` |
| History | `History` |
| Bookmark | `Bookmark` |

## Accessibility Checklist

- [ ] Contrast ratio 4.5:1 minimum for text
- [ ] Focus states visible on all interactive elements
- [ ] `cursor-pointer` on all clickable elements
- [ ] No layout shift on hover
- [ ] Respect `prefers-reduced-motion`
- [ ] Semantic HTML (`<nav>`, `<main>`, `<article>`)
- [ ] Alt text for images (if any)
