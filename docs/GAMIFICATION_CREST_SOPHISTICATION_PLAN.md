# Gamification Crest & Badge Sophistication Plan

Plan to raise the perceived craft of the gamification visuals — squad crests,
badges, and shields — without adding heavy dependencies, without external calls,
and **without removing any existing feature or the Armoria heraldry editor**.

> Scope: presentational/visual only. Deterministic from existing IDs. SVG + CSS
> gradients + the already-installed `framer-motion`. Everything themeable across
> the 5 palettes + dark and gated by `useReducedMotion`.

## Why

- [BadgeIcon](../src/components/Gamification/BadgeIcon.tsx) is already rich
  (react-icons, shaped clip-paths, gradients, `RARITY_EFFECTS`, line-draw,
  reduced-motion aware).
- [ArmoriaShield](../src/components/Gamification/ArmoriaShield.tsx) renders a real
  designed `crestSvg` when a squad has used the Armoria editor.
- [SquadCrest](../src/components/Gamification/SquadCrest.tsx) — the **default
  fallback** for every squad without a designed crest — is a flat MUI `Avatar`
  with initials, one random `hsl()` from a hash, and a plain divider ring. This
  is what makes the default gamification surface feel unsophisticated.

The biggest win is elevating the **default** crest and giving crests/badges a
shared **material + depth** language.

## Constraints

- No feature loss; the Armoria custom-crest path (`crestSvg`) stays the priority
  render in `ArmoriaShield`. This work only upgrades the fallback + finish.
- No new heavy deps (SVG + CSS gradients; `framer-motion` already present).
- Deterministic from `squadId` / `badgeType` — no network, crisp at any size.
- All color/rim/rounding via theme tokens + a new heraldry palette so it works
  across every theme and dark mode.
- Respect `useReducedMotion` for every animated effect.

---

## Phase 1 — Foundations

### 1a. Heraldry tincture palette
- New token module `src/themes/heraldry.ts` exporting `HERALDRY`:
  tinctures (or, argent, gules, azure, vert, sable, purpure) with `main`/`shade`/
  `light` stops, plus metal ramps (bronze → silver → gold → platinum) for rims.
- Deterministic pickers: `pickTinctures(seed)` → `{ field, charge }`;
  `metalForTier(xpOrLevel)` → metal ramp. Curated set (not random HSL) so output
  reads as "designed crest," not "generated avatar."
- Acceptance: pure functions with unit tests (`src/themes/__tests__/heraldry.test.ts`),
  stable output for a given seed, all values theme/dark safe.

### 1b. `Medallion` primitive
- New `src/components/Gamification/Medallion.tsx` — one SVG primitive owning the
  shared finish:
  - silhouette (`shield` | `disc` | `hex`), reusing `SHAPE_PATHS` from `BadgeIcon`,
  - **metallic rim** (gradient stroke, metal from props),
  - **inner bevel** (inset shadow), **top gloss** (radial specular highlight),
  - drop shadow via `SEMANTIC_THEME.elevation`.
- Props: `shape`, `size`, `rimMetal`, `fieldColor`, `charge` (ReactNode slot),
  `division?`, `sx`. No app context.
- Acceptance: renders standalone; a11y `role="img"` + `aria-label`; Storybook
  story `Medallion.stories.tsx` showing shapes × metals × sizes.

---

## Phase 2 — SquadCrest upgrade (highest impact, self-contained)

Rework [SquadCrest](../src/components/Gamification/SquadCrest.tsx) to compose a real
heraldic mini-crest via `Medallion`:
- shield silhouette instead of the flat circle avatar,
- deterministic **division/ordinary** from `squadId` (per-pale, per-fess,
  chevron, bend) → immediately reads as heraldry,
- **field + charge** tinctures from `pickTinctures(squadId)`,
- **metallic rim** keyed to `totalXP` via `metalForTier` (visible progression),
- center **charge**: initials in a serif, or a deterministic `react-icons` device.
- Keep the existing prop API (`squadId`, `squadName`, `totalXP`, `size`,
  `showName`) so all call sites (`ArmoriaShield`, dashboard, profile, squad detail)
  work unchanged.
- Acceptance: same props, richer render; `ArmoriaShield` fallback path visibly
  upgraded; existing `SquadCrest.stories` still pass; visual diff in the
  showcase Gamification story.

---

## Phase 3 — Badge material & tier framing

Enhance [BadgeIcon](../src/components/Gamification/BadgeIcon.tsx) (additive, keep
current animation):
- enamel/metal layering: base + shade + specular gloss,
- beveled metal ring + rarity-scaled decorative frame keyed to `RARITY_EFFECTS`,
- optional shared bevel/gloss via `Medallion` where it doesn't fight the existing
  clip-path animation.
- Acceptance: earned/locked states intact; animations intact; rarity reads as a
  material step (bronze/silver/gold/gem); no regressions in `BadgeIcon.stories`.

---

## Phase 4 — Cohesion

- Adopt `Medallion` in [StreakShield](../src/components/Gamification/StreakShield.tsx)
  and any other shield/disc surfaces so depth/finish is one language.
- Ensure crest/badge rims/tinctures pull from `HERALDRY` + `SEMANTIC_THEME`
  across all 5 themes + dark.
- Acceptance: consistent finish across SquadCrest, BadgeIcon, StreakShield in the
  showcase Gamification story.

---

## Phase 5 — Motion polish (restrained)

- Hover parallax/tilt on medallions; earn-time sheen sweep on badges.
- All gated by `useReducedMotion`; no motion on reduced-motion.
- Acceptance: motion is subtle, 60fps, disabled under reduced-motion.

---

## Sequencing

Phase 1 (foundations) → Phase 2 (SquadCrest — ship the visible win first) →
Phase 3 (badges) → Phase 4 (cohesion) → Phase 5 (motion). Phases 1–2 deliver the
biggest perceived-quality jump and are self-contained.

## Risks / watch-outs

- Keep `dangerouslySetInnerHTML` for real `crestSvg` behind `sanitizeSvg`
  (unchanged) — do not route generated crests through raw HTML; build them as
  React SVG.
- Don't let new SVG/gradients bloat shared chunks; keep `Medallion` in the
  gamification chunk with the other components.
- Verify contrast of tinctures/charge on dark mode (AA for any text/initials).

## Validation

- Unit tests for `heraldry` pickers.
- Storybook stories for `Medallion`, updated `SquadCrest`, `BadgeIcon`.
- `tsc --noEmit --project config/tsconfig.build-gamification.json` + lint on
  changed files.
- Visual check in `🧩 UI Components/Design System Showcase → Gamification
  Components`.
