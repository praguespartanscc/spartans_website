# Prague Spartans Cricket Club website – working rules

Next.js 15 (App Router) + React 19 + Tailwind CSS v4, deployed on Vercel, data in Supabase.
Live: https://praguespartanscc.com. English is the default; every public page also has a Czech
version under `/cs`.

## Process

- Work on a branch. Production changes only when the owner says **"push to prod"**: fast-forward
  `main` from the branch, push, then confirm the Vercel deployment is READY and has no runtime errors.
- Before pushing: `npx tsc --noEmit`, `npm run lint`, and `npx next build`. Check visual changes at
  390px, 1024px and 1280px wide with no horizontal overflow, in both `/` and `/cs`.
- Never commit secrets. Env vars live in Vercel; `.env.example` documents the names.

## Project structure

```
src/
  app/
    layout.tsx            root <html>, fonts, metadata defaults, Analytics
    globals.css           ALL design tokens + component classes + motion (single source)
    template.tsx          page fade-in on every navigation (.page-enter)
    (site)/               English routes + admin, dashboard, auth pages; layout adds Header/Footer
    cs/                   Czech routes (same views, lang="cs"); layout wraps in <div lang="cs">
    api/                  route handlers (emails, hooks, live status)
    robots.ts, sitemap.ts
  views/                  one file per public page: default component({ lang }) + xxxMeta(lang)
  components/             page sections (HeroSection, SquadsSection, …) and shared pieces
    ui/                   primitives: Reveal, PageHero, SectionHeading, Icons, Skeleton, EmptyState, Avatar, Ticker
    admin/                admin dashboard screens (light theme, see below)
    gallery/, dashboard/
  lib/                    club facts (club.ts), i18n, seo, structured data, data fetching, Drive, YouTube, email
```

### Route pattern (both languages share one view)

```tsx
// src/app/(site)/committee/page.tsx
import CommitteeView, { committeeMeta } from '@/views/CommitteeView';
export const revalidate = 60;
export const metadata = committeeMeta('en');
export default function Page() { return <CommitteeView lang="en" />; }
// src/app/cs/committee/page.tsx is identical with 'cs'.
```

- New public page = a view in `src/views/` + two thin route files + sitemap entry in `src/app/sitemap.ts`.
- Copy is written inline as `tr(lang, { en: '…', cs: '…' })` (`src/lib/i18n.ts`). Every user-facing
  string on public pages needs both languages. Links go through `localePath(lang, '/path')`.
- Page metadata goes through `pageMeta()` in `src/lib/seo.ts` (canonical, hreflang, Open Graph).
- Club facts (founding year, ground, venues, training, membership, honours, squads) live in
  `src/lib/club.ts`. Never hard-code them in a view.

## Design tokens

Tailwind v4, CSS-first: there is **no `tailwind.config`**. Tokens are declared in
`src/app/globals.css` inside `@theme inline`, which generates utilities (`bg-gold`, `text-muted`,
`font-display`, `ease-out-expo`, …).

| Token | Value | Use |
|---|---|---|
| `ink` / `ink-2` | `#000` / `#0a0a0a` | page background (Deep Black) |
| `panel` / `panel-2` | `#111` / `#1a1a1a` | cards, raised surfaces |
| `cream` | `#fff` | primary text (Pure White) |
| `sand` | `#e6e6e6` | intro and lead text |
| `muted` / `faint` / `dim` | `#bdbdbd` / `#959595` / `#808080` | secondary text, captions, placeholders |
| `gold` / `gold-hi` / `gold-lo` | `#cc9901` / `#daa520` / `#a67c01` | brand accent, CTAs, focus ring (Spartan Gold) |
| `crimson` / `crimson-hi` | `#7c0a01` / `#96140a` | Warrior Red: live and alert states, sparingly |
| `brown`, `charcoal` | `#3d0c01`, `#333` | deep backgrounds, dark button hover |

Borders are white at low opacity: `border-cream/12` (default), `/22` for fields.

**Type** (Brand Manual v1.1; fonts loaded with `next/font` in `src/app/layout.tsx`):

| Role | Token / class | Font | Use |
|---|---|---|---|
| Display (H1) | `.display`, `font-varsity` | Graduate (one weight, `font-synthesis: none`) | page titles, big numbers |
| Section (H2) | `.h-section` | Graduate, `clamp(34px,5vw,64px)` | section titles |
| Secondary | `.h-sub`, `.eyebrow`, `font-display` | Barlow Condensed **italic** 600–800, caps | H3, labels, buttons, chips |
| Body | `font-sans` | Open Sans | running text, 16–18px, `leading-relaxed` |

Fluid sizes use `text-[clamp(min,vw,max)]`. Body copy stays at 65–75 characters wide (`max-w-2xl`).

**Motion tokens:** `--ease-out-expo` (`cubic-bezier(.16,1,.3,1)`) for movement and
`--ease-out-quart` for fades.

## Component classes (`@layer components` in globals.css)

Use these before writing new utility soup:

- Layout: `.container-x` (max 1240px, fluid gutter)
- Type: `.eyebrow`, `.display`, `.h-section`, `.h-sub`
- Buttons: `.btn` plus one of `.btn-gold` (primary), `.btn-outline`, `.btn-dark`, `.btn-ghost-dark`
  (on gold), plus `.btn-lg`. Put the arrow icon with `className="btn-arrow"` inside to get the hover nudge.
- Links: `.link-arrow` (gold caps link with an arrow)
- Surfaces: `.card`, `.card-hover` (lift + gold border on hover, hover-capable devices only), `.chip`
- Forms: `.field-label`, `.field` (16px font so iOS does not zoom), `select.field`, `.alert-error`
- Media: `.zoom-frame` (image zoom on hover inside a clipping box)

```tsx
<Link href={localePath(lang, '/join')} className="btn btn-gold btn-lg">
  {tr(lang, { en: 'Apply to join', cs: 'Chci se přidat' })}
  <ArrowRight size={18} className="btn-arrow" />
</Link>
```

## UI primitives (`src/components/ui/`)

- `PageHero` opens every inner page: eyebrow, H1, intro, optional image with Ken Burns zoom
  and an 80% black scrim. `compact` gives smaller type for long titles.
- `SectionHeading`: eyebrow + `.h-section` + intro + optional action, wrapped in `Reveal`.
- `Reveal`: scroll-in animation driven by one shared IntersectionObserver. `delay` (ms) staggers siblings.
- `Skeleton` (`SkeletonList`, `SkeletonGrid`) for loading. `EmptyState` for empty lists. Use these, not spinners.
- `Icons.tsx`: the icon set (see below). `Avatar`, `Ticker`.

Section components (`src/components/*Section.tsx`) are server components unless they need state.
Mark client components with `'use client'` and keep them small (HeroSection, Header, forms).

## Motion rules

All motion lives in globals.css. Animate **only `transform` and `opacity`** (GPU-composited).

| Class | What it does |
|---|---|
| `.page-enter` | 0.5s fade on each navigation (from `app/template.tsx`) |
| `.rise` + `--d` | hero copy fades up on load, staggered by a `--d` delay (60 / 140 / 240 / 320ms) |
| `.reveal` / `.is-visible` | scroll-in fade-up, only hidden once `.js` is on `<html>`, so content never disappears without JS |
| `.kenburns` | slow 9s scale on hero images |
| `.ticker-track` | infinite marquee, pauses on hover |
| `.live-dot` | pulsing live indicator |
| `.slide-progress` | hero slide timer bar (`--dur`) |
| `.skeleton` | shimmer placeholder |

Rules:
- Durations: 150–250ms for hover and colour, 350–500ms for UI movement, 800–1000ms for entrances. Never longer than 1.2s except ambient loops.
- Stagger siblings by 60–90ms with `Reveal delay` or `--d`; do not stagger more than about 6 items.
- Hover effects only inside `@media (hover: hover)`; give touch an `:active` state instead.
- `prefers-reduced-motion: reduce` is handled globally (animations off, reveals shown). New
  keyframes must keep working under that block, and JS-driven motion (carousel autoplay) must check
  `matchMedia('(prefers-reduced-motion: reduce)')`.
- Never block reading on an animation: no content left at `opacity: 0` without a fallback.

## Icons

`src/components/ui/Icons.tsx`: inline SVG React components on a shared `Base`
(24×24 viewBox, `stroke="currentColor"`, stroke width 1.8, round caps, `aria-hidden`).
Names are PascalCase nouns: `ArrowRight`, `ArrowUpRight`, `Calendar`, `Clock`, `MapPin`, `Mail`,
`Menu`, `Close`, `Check`, `Users`, `Bolt`, `Glass`, `Shield`, `Facebook`, `Instagram`.

```tsx
import { MapPin } from '@/components/ui/Icons';
<MapPin size={18} className="text-gold" />
```

To add one from Figma: export the icon as a 24px outline, then add it as `export const Name = (p) => <Base {...p}>…paths…</Base>`.
Do not add an icon library.

## Assets and images

- Static images are in `public/`. Brand files are in `public/brand/` (club crest, squad logos,
  `spartans-logo-square.png`), the share image is `public/og/`, and sponsor logos are in `public/sponsors/`.
- Always use `next/image` (`fill` + `sizes`, or width/height), with `priority` only for the
  above-the-fold hero. Images from remote hosts must be allowed in `next.config.ts` `images.remotePatterns`.
  `isOptimisable()` in `src/lib/images.ts` decides whether a URL can go through `next/image`.
- Gallery photos come from Google Drive at runtime (`src/lib/drive.ts`). Build their URLs with
  `photoUrl(id, width)` / `photoSrcSet(id)` from `src/lib/photos.ts` (Google's CDN resizes them).
  Uploading to the Drive folder updates the site; there are no gallery files in the repo.
- Player and committee photos and sponsor logos uploaded in the admin go to Supabase Storage.
- Alt text needs both languages on public pages; decorative images use `alt=""`.

## Styling approach

- Tailwind utilities in JSX, design tokens from `@theme`, shared patterns in `@layer components`.
  No CSS modules, no CSS-in-JS. Arbitrary values are fine for fluid type (`text-[clamp(...)]`).
- Mobile first: base styles target phones, then `sm:` (640), `md:` (768), `lg:` (1024), `xl:` (1280).
  The header switches to the full nav at `lg`; padding tightens between 1024px and 1280px.
- Public site is dark-only (`color-scheme: dark`). Contrast: body text `cream`/`sand` on `ink`/`panel`;
  never `faint` or `dim` for paragraphs.
- The **admin** (`src/components/admin/`) is a separate light UI for data entry: black sidebar
  plus `bg-white` / `bg-gray-50` panels with Tailwind gray text. Keep it that way; don't mix the
  public dark tokens into admin forms.
- Tap targets are at least 44px (`.btn` is 48px). Focus ring: the global 2px gold `:focus-visible`.
- Every page has a skip link ("Skip to content" / "Přeskočit na obsah") into `main#main`.

## Integrating Figma designs (MCP)

1. `get_design_context` / `get_screenshot` for the node. Treat the output as a reference, not code to paste.
2. Map Figma colours to the tokens above (snap to the nearest token, don't add hex values). Map
   type to `.display` / `.h-section` / `.h-sub` / `.eyebrow` / body. Map spacing to Tailwind's 4px scale.
3. Reuse `PageHero`, `SectionHeading`, `Reveal`, `.btn*`, `.card`, `.chip`, `.field` and the icon set.
   Add a new primitive only when a pattern repeats on two or more pages.
4. Any new token goes into `@theme inline` in globals.css with a comment naming its brand role.
5. Add Czech copy for every string, check `/cs` (Czech strings run about 20% longer), and check
   the screenshot at 390px, 1024px and 1280px.
6. New motion follows the motion rules and the reduced-motion block.
