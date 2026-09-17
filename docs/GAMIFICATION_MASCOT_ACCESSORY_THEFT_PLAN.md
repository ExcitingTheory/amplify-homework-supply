# Gamification — Mascot Accessory "Borrow" Plan (as an Anti-Badge)

A playful, **single-user** mechanic: your mischievous **pixel mascot** (an NPC —
not another student) occasionally **"borrows" one of your own avatar
accessories** (glasses, eyepatch, hat). Your avatar loses it **temporarily**;
the mascot wears it; after a timeout it's returned automatically. This is
modeled as a **whimsical anti-badge debuff**, so it reuses the existing timed
`activeDebuffs` pipeline on `StudentProfile` — **no new model, no schema change,
no cross-user anything.**

> Scope: gamification cosmetic layer, entirely within one user's own profile.
> Timed like every other debuff, deterministic pixel rendering, reduced-motion
> aware, feature-flagged. Pure delight — there is no victim but yourself, and
> nothing is ever lost permanently.

## The three constraints that shaped this

1. **It lives in the user profile** → store it in `StudentProfile.activeDebuffs`
   (already an `a.json()` array). Owner writes their own profile, so it's fully
   allowed with no elevated backend.
2. **The thief is not a real person** → the "thief" is the mascot NPC. No
   `victimId`/`thiefId`, no squads, no PvP, no griefing surface, no opt-out from
   *others*. Just one user and their own creature.
3. **Fit into the existing anti-badges** → it's a new anti-badge whose `debuff`
   carries a cosmetic "borrowed accessory" effect. Everything downstream
   (apply, expiry, redemption, context exposure) already exists.

## Why it drops straight into anti-badges

The anti-badge/debuff system already does 95% of this:

- `activeDebuffs` is a JSON array on `StudentProfile`, each entry has
  `appliedAt` / `expiresAt`, lazily filtered by expiry in `getActiveDebuffs()`
  ([gamification-engine.ts](../app/actions/gamification-engine.ts)).
- `BadgeDebuff` already has a **cosmetic avatar effect** precedent:
  `avatarDowngrade: "simple"` temporarily swaps the avatar based on an active
  debuff ([antiBadgeRegistry.ts](../src/components/Gamification/antiBadgeRegistry.ts)).
  Borrowing an accessory is the same idea, narrower in scope.
- `cosmeticDurationHours` already defines the debuff's cosmetic timeout
  (default 24h).
- The context already exposes `activeDebuffs` + `hasActiveDebuff(badgeType)`
  ([gamificationContext.tsx](../src/context/gamificationContext.tsx)), so the
  avatar and mascot can both read the borrowed-accessory state with zero new
  plumbing.
- Accessories live in `AvatarOverrides.accessories` / `top`
  ([DiceBearAvatar.tsx](../src/components/Gamification/DiceBearAvatar.tsx)),
  read via [useAvatarConfig.ts](../src/hooks/useAvatarConfig.ts).
- The mascot ([PixelSpriteMascot.tsx](../src/components/Gamification/PixelSpriteMascot.tsx))
  now exposes **eye anchors** (`SpriteData.eyes`, `faceRow`) from
  [generatePixelSprite.ts](../src/utils/generatePixelSprite.ts), so the borrowed
  accessory overlay can align to the face.

## Data — no schema change

The borrow is just another `activeDebuffs` entry. Extend the **TypeScript**
debuff shapes (the field is stored inside the existing `a.json()`, so
`resource.ts` is untouched):

```ts
// antiBadgeRegistry.ts  → BadgeDebuff
// gamification-engine.ts → AntiBadgeCriteria["debuff"] + ActiveDebuff
// gamificationContext.tsx → ActiveDebuff
interface MascotBorrowEffect {
  /** Marks this debuff as a mascot "borrow" of a cosmetic. */
  mascotBorrow?: boolean;
  /** Which override slot was borrowed: "accessories" | "top". */
  borrowedSlot?: string;
  /** The specific accessory id taken (e.g. "sunglasses", "wayfarers"). */
  borrowedAccessoryId?: string;
}
```

When the anti-badge is applied, the engine picks **one currently-equipped
accessory from the user's own `avatarOverrides`** and records it on the debuff
entry alongside the standard `appliedAt` / `expiresAt`. That single JSON entry is
the entire persistent state — stored, as requested, on the user's profile.

## The anti-badge

Register one new anti-badge in both registries, in the existing sardonic tone:

- Client visuals: [antiBadgeRegistry.ts](../src/components/Gamification/antiBadgeRegistry.ts)
  (e.g. `MAGPIE_MASCOT` / "Sticky-Pawed Sidekick", `GiJesterHat` or a magpie
  glyph, `redeemable: true`, `redemptionHint: "Tap your mascot to ask for it back"`).
- Server criteria: `ANTI_BADGE_CRITERIA` in
  [gamification-engine.ts](../app/actions/gamification-engine.ts) with the
  `debuff` carrying `{ mascotBorrow: true, cosmeticDurationHours: 6 }`.

Because it's cosmetic mischief (not a punishment), the **trigger** should be
light/neutral rather than a failure condition. Options, all expressible in the
existing `check()` or apply path:

- **Neutral cadence:** at most once per day, only when the user actually has an
  accessory equipped (so it never fires on a bare avatar).
- **Celebratory:** on level-up or a streak milestone the mascot "gets excited"
  and grabs something.
- Keep `check()` returning true only when `borrowedAccessoryId` can be chosen;
  otherwise it's a no-op.

## Apply / return flow (reuses debuff helpers)

- **Apply:** in the existing anti-badge evaluation, when the criterion fires,
  call the current `applyDebuff()` with the new `mascotBorrow` fields.
  `expiresAt = now + cosmeticDurationHours` — identical math to today.
- **Auto-return:** nothing to do. `getActiveDebuffs()` already drops entries
  once `expiresAt` passes, so the accessory reappears on the next read with
  **zero writes**.
- **Early return ("give it back"):** reuse the anti-badge **redemption** path —
  tapping the mascot redeems/clears that debuff entry, same as any redeemable
  anti-badge. This is an owner-write to the user's own profile.

## Rendering

- **Avatar (hide the borrowed item):** in [useAvatarConfig.ts](../src/hooks/useAvatarConfig.ts),
  read active debuffs from the gamification context; for any entry with
  `mascotBorrow`, **subtract** `borrowedAccessoryId` from the returned
  `AvatarOverrides` before render. Mirrors how `avatarDowngrade` already
  conditions the avatar.
- **Mascot (wear the borrowed item):** new `src/utils/mascotAccessories.ts`
  maps DiceBear accessory ids → **pixel-art rect overlays** positioned from
  `SpriteData.eyes` / `faceRow`:
  - `round` / `prescription01/02` / `wayfarers` / `kurt` → glasses frames over
    both eye anchors + a bridge cell.
  - `sunglasses` → filled dark lenses.
  - `eyepatch` → patch over one eye + a strap row.
  - `top` hats (`hat`, `winterHat*`) → a band above the head silhouette.
  Extend `renderSpriteSvg` / `generatePixelSpriteSvg` to accept an optional
  `accessory`; add `accessory?: string` to
  [PixelSpriteMascot.tsx](../src/components/Gamification/PixelSpriteMascot.tsx),
  fed from the active `mascotBorrow` debuff.

## Constraints

- No schema change — state is a new field inside the existing `activeDebuffs`
  JSON; only TypeScript interfaces + registry entries change.
- No cross-user reads/writes — everything is the owner's own profile.
- Never destructive — the saved `avatarOverrides` is never edited; the borrow is
  a temporary render-time subtraction that self-heals on expiry.
- Only fires when the user has an accessory to borrow (never a bare avatar).
- Deterministic pixel overlay; no network for the visual layer.
- Respect `useReducedMotion` for the grab/return animation.
- Gated behind the existing `cosmeticsEnabled` flag (plus reuse
  `antiBadgesEnabled`) — no new platform flag required.

---

## Phases

### Phase 1 — Debuff shape + anti-badge registration
- Add the `MascotBorrowEffect` fields to `BadgeDebuff` (client),
  `AntiBadgeCriteria["debuff"]` + `ActiveDebuff` (server), and `ActiveDebuff`
  (context).
- Register the `MAGPIE_MASCOT` anti-badge in both registries with a light
  trigger and `redeemable: true`.
- **Acceptance:** applying the anti-badge writes a well-formed `activeDebuffs`
  entry with `mascotBorrow`, `borrowedSlot`, `borrowedAccessoryId`, `expiresAt`;
  `getActiveDebuffs()` expires it correctly.

### Phase 2 — Apply-time accessory selection
- In the engine's anti-badge apply path, pick one equipped accessory from the
  user's own `avatarOverrides`; skip if none.
- **Acceptance:** unit tests — chooses a valid equipped accessory, no-ops on a
  bare avatar, expiry math matches other debuffs.

### Phase 3 — Avatar suppression
- `useAvatarConfig` subtracts the borrowed accessory while the debuff is active;
  it reappears at `expiresAt` with no writes.
- Follow subscription rules (single subscription, null-filtering,
  `DuplicatedOperationError` handled, `_version` change detection) per the
  `amplify-gen2-subscriptions` memory.
- **Acceptance:** avatar drops exactly the borrowed item during the window;
  other accessories untouched; auto-restores.

### Phase 4 — Mascot pixel overlay
- Build `mascotAccessories.ts`; wire `accessory?` through the renderer and
  `PixelSpriteMascot`, fed by the active `mascotBorrow` debuff.
- **Acceptance:** deterministic overlay aligns to eyes across all 5 stages;
  per-accessory snapshot tests; no overlay when nothing is borrowed.

### Phase 5 — Delight + redemption UX
- Tap-the-mascot "give it back" → redeems the debuff (owner-write to own
  profile); grab/return micro-animation gated by `useReducedMotion`.
- Optional flavor: a tiny "🐦 borrowed by your mascot · returns in 5h 12m" chip
  with countdown on the user's own avatar.
- **Acceptance:** redemption clears the entry immediately and the accessory
  returns; animation respects reduced motion.

## Timeout mechanics (already exists)

```ts
const BORROW_HOURS = 6; // cosmeticDurationHours
const expiresAt = new Date(Date.now() + BORROW_HOURS * 3_600_000).toISOString();

// read side — getActiveDebuffs() already does this:
const active = debuffs.filter(d => new Date(d.expiresAt).getTime() > Date.now());
```

No scheduled job needed; expiry is evaluated on read, exactly like every other
debuff.

## Nothing blocked

Because this fits inside anti-badges and the user's own profile:

- **No `resource.ts` change** (state rides inside existing `activeDebuffs` JSON).
- **No new model, no new auth, no notification-enum change required** (an
  optional `DEBUFF_APPLIED` notification already exists if we want one).

The only edits are TypeScript interfaces, two registry entries, apply-time
selection, and the two render sites — all standard `src/` / `app/actions/` work.

## Open questions

- Trigger flavor: neutral daily cadence, or celebratory (level-up / streak)?
- If the user has several accessories, does the mascot ever hold more than one?
- Show the countdown chip on the avatar, or keep the borrow a fun surprise until
  noticed?

## Test surface

- Engine: accessory selection + no-op on bare avatar + expiry math
  (`app/actions/__tests__`, `amplify/functions/__tests__/gamification-pipeline.test.ts`).
- `mascotAccessories`: deterministic alignment + per-accessory snapshots
  (`src/utils/__tests__`).
- `useAvatarConfig`: suppression while active, restoration at expiry.
- Storybook: mascot with each accessory across stages; avatar in
  borrowed/returned states.
