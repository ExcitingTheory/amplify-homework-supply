# UI Layout Issues — Review Tracker

Identified during audit of `ListItemSecondaryAction` usage and number input context.
The original issue (Badge Configuration in `app/[locale]/section/[id]/settings/gamification/page.tsx`) has already been fixed.

---

## Category A — `ListItemSecondaryAction` Overlap Risk

`ListItemSecondaryAction` positions its child with `position: absolute; right: 0`. When the `ListItemText` primary or secondary content is long enough to reach that absolute element, content collides. The fix pattern (used in the Badge Configuration fix) is:
- Wrap the `ListItemText` / label side in `<Box sx={{ flex: 1, minWidth: 0 }}>` so it clips
- Give the action side `flexShrink: 0`
- Remove `ListItemSecondaryAction` and use a flex row instead

---

### 1. `CollaboratorManager.tsx` — **HIGH priority**

**File:** `src/components/CollaboratorManager.tsx` (line 196)

**Issue:** `primary={collab.collaboratorId}` is an unconstrained string (email / Cognito username). The permission `Chip` in `secondary` + the absolutely-positioned delete `IconButton` will overlap long IDs.

**Secondary note:** `collab.collaboratorId` is displayed raw — if it is a Cognito sub UUID, it's unreadable. Should show display name or email alias.

```
[ john.doe@example.com   ● Edit ] [🗑]  ← OK
[ john.doe-with-a-very-long-email@somelongdomain.co... ] [🗑 OVERLAP]
```

---

### 2. `NotificationInvitations.tsx` — **HIGH priority**

**File:** `src/components/Notifications/NotificationInvitations.tsx` (line 75)

**Issue:** `ListItemText` has `primary={notification.title}` + a multi-element secondary (`From:` + body text). The secondary action contains a "New" `Chip` + a full-width `Button` ("Join Review" / "Accept"). Notification titles are user-generated and can be arbitrarily long; the button group is ~150 px wide.

```
[ Very long notification title text that runs into... ] [ New ] [ Join Review ]
                                                         ↑ absolute — will collide
```

---

### 3. `PeerReviewInvitations.tsx` — **MEDIUM priority**

**File:** `src/components/PeerReview/PeerReviewInvitations.tsx` (line 80)

**Issue:** Same pattern — `ListItemText` with unit name + `From: [ownerDisplayName]`, action with `Chip` + "Join Review" button. Unit names are instructor-defined (no length constraint). `ownerDisplayName` may also be long.

---

### 4. `ConversationPlaylistEditor.jsx` — **MEDIUM priority**

**File:** `src/components/Editor3/components/ConversationPlaylistEditor.jsx`

Two occurrences:

**4a.** Track list (line 124) — `ListItemText primary={file?.name || id}`. File names can be long. Delete `IconButton` in `ListItemSecondaryAction`.

**4b.** Subtitle / dialogue lines (line 184) — Primary content is a full dialogue sentence (`{line.speaker}: {line.text}`). Subtitle lines are real sentences — virtually guaranteed to collide with the edit `IconButton` on any normal-width panel.

---

### 5. `InstructorGamificationPanel.tsx` — **MEDIUM priority**

**File:** `src/components/Gamification/InstructorGamificationPanel.tsx`

Three occurrences:

**5a.** Skills list (line 489) — `primary={skill.title}` + secondary chip row. One delete `IconButton`. Skill titles are free-form; secondary chips (`N units`, `≥X%`) add height, pushing text closer to the absolute button.

**5b.** Squads list (line 693) — `primary={g.name}` + `secondary={\`${g.memberCount} members\`}`. Short secondary, lower risk.

**5c.** Easter eggs list (line 741) — `primary={egg.message}` is the reveal message (a full sentence). Chips for type/XP/keyword in secondary. Reveal messages are sentences — will collide.

---

### 6. `StorageManagement.tsx` — **MEDIUM priority**

**File:** `src/components/StorageManagement.tsx`

Two occurrences:

**6a.** AI models list (line 152) — `primary={model.name}` + secondary with size + download status. Actions: `Chip`, `IconButton`, or `Button` depending on state. Model names are controlled strings, lower overlap risk. Action changes between states may cause layout jumps.

**6b.** Cached assignments list (line 213) — `primary={\`Unit: ${status.unitId.slice(0, 8)}...\`}` is already truncated, so overlap risk is low. Delete `IconButton` only.

---

### 7. `AssignmentConfiguration.jsx` — **LOW priority**

**File:** `src/components/Editor3/components/AssignmentConfiguration.jsx` (line 331)

**Issue:** `ListItemText primary={name} secondary={description}`. Description can be multi-line, which the `position: absolute` right-edge button doesn't account for. Delete `IconButton` only, small overlap risk on short names, but description wrapping can cause visual misalignment.

**Additional note:** Inline `style={}` is used instead of MUI `sx={}` — inconsistent with the rest of the codebase.

---

## Category B — Number Inputs Missing Unit / Context

---

### 8. `AIAgentConfig.tsx` — Per-Persona Token Budget labels — **MEDIUM priority**

**File:** `src/components/AIAgentConfig.tsx` (lines 424–510)

**Issue:** Six side-by-side number fields in the "Per-Persona Overrides" sub-section have abbreviated labels that omit "tokens" or "budget":

| Label shown | What it means |
|---|---|
| "Kai System Prompt" | Max tokens in Kai's system prompt context |
| "Sage System Prompt" | Max tokens in Sage's system prompt context |
| "Kai Tool Result" | Max tokens per tool result for Kai |
| "Sage Tool Result" | Max tokens per tool result for Sage |
| "Kai Total Turn" | Max total tokens per Kai turn |
| "Sage Total Turn" | Max total tokens per Sage turn |

None of these fields have `helperText` or an adornment indicating the unit is **tokens**. The parent section heading says "Token Budgets" but isn't visible once the accordion is scrolled.

**Suggested fix:** Add `helperText="tokens"` or `endAdornment="tok"` to each field, or add a `Typography` sub-header directly above the `Stack` pairs saying _"All values are in tokens."_

---

### 9. `EasterEggEditor.tsx` — Ambiguous "Value" field — **MEDIUM priority**

**File:** `src/components/EasterEggEditor.tsx` (line 267)

**Issue:** The achievement condition form has a `Metric` select (e.g. accuracy, XP, streak) and an operator select, then a `type="number"` field labeled only **"Value"** with no adornment or `helperText`. The expected unit changes with the selected Metric:

- If Metric = `accuracy` → value is a percentage (0–100)
- If Metric = `xp` → value is an XP count
- If Metric = `streak` → value is days

No dynamic unit hint is shown. `EasterEggForm.tsx` (line 309) _does_ handle this correctly with a dynamic `endAdornment`, but the separate `EasterEggEditor.tsx` version does not.

**Suggested fix:** Mirror the dynamic adornment from `EasterEggForm.tsx` into `EasterEggEditor.tsx`.

---

### 10. `CampaignSetupWizard.tsx` — "Chapter order" missing helperText — **LOW priority**

**File:** `src/components/Gamification/CampaignSetupWizard.tsx` (line 299)

**Issue:** "Chapter order" number field has `min: 1, step: 1` but no `helperText`. It's not immediately obvious that this controls display order (1 = shown first to students), not the chapter ID.

**Suggested fix:** Add `helperText="Display position — 1 is shown first"`.

---

### 11. `RedemptionConditionForm.tsx` — "Count" label is ambiguous — **LOW priority**

**File:** `src/components/Gamification/RedemptionConditionForm.tsx` (line 173)

**Issue:** A field labelled "Count" appears when the condition type involves a repeating action. There is no `helperText` explaining what is being counted (submissions, correct answers, streak days, etc.). The "Threshold" field on line 185 is clearer because it has a `%` adornment, but "Count" has none.

---

## Category C — Other Issues

---

### 12. `FileManager2.jsx` — Unused import — **LOW priority**

**File:** `src/components/Editor3/components/FileManager2.jsx` (line 13)

**Issue:** `ListItemSecondaryAction` is imported but never appears in JSX. Dead import adds minor bundle weight and confuses future readers who might assume it's used.

---

### 13. `CollaboratorManager.tsx` — Raw Cognito ID displayed as primary label — **LOW priority** (UX, not layout)

**File:** `src/components/CollaboratorManager.tsx` (line 198)

**Issue:** `primary={collab.collaboratorId}` — when `collaboratorId` is a Cognito username that looks like a UUID or email, it's displayed verbatim. No display-name fallback. Instructors will see cryptic strings for collaborators added via API rather than the UI invite flow. We should not display emails or uuids, but usernames or display names instead. This is a data-layer concern, not a layout issue, but it was noted during the audit.

---

## Already Fixed

| # | Component | Issue | Fixed |
|---|---|---|---|
| — | `app/[locale]/section/[id]/settings/gamification/page.tsx` | Badge Configuration `ListItemSecondaryAction` overlap + missing threshold context | ✅ |
| 1 | `src/components/CollaboratorManager.tsx` | `ListItemSecondaryAction` overlap on long collaborator IDs | ✅ |
| 2 | `src/components/Notifications/NotificationInvitations.tsx` | `ListItemSecondaryAction` overlap — title vs Chip + Button | ✅ |
| 3 | `src/components/PeerReview/PeerReviewInvitations.tsx` | `ListItemSecondaryAction` overlap — unit name vs Chip + Button | ✅ |
| 4 | `src/components/Editor3/components/ConversationPlaylistEditor.jsx` | Both list items (track list + subtitle lines) fixed | ✅ |
| 5 | `src/components/Gamification/InstructorGamificationPanel.tsx` | Skills, Squads, and Easter eggs list items fixed | ✅ |
| 6 | `src/components/StorageManagement.tsx` | AI models list + cached assignments list fixed | ✅ |
| 7 | `src/components/Editor3/components/AssignmentConfiguration.jsx` | Layout fixed; `style={{}}` converted to `sx={{}}` | ✅ |
| 8 | `src/components/AIAgentConfig.tsx` | Per-persona token budget fields: added `helperText="tokens"` to all 6 fields | ✅ |
| 9 | `src/components/EasterEggEditor.tsx` | "Value" field: dynamic `endAdornment` (`%` / `days` / `XP`) based on selected metric | ✅ |
| 10 | `src/components/Gamification/CampaignSetupWizard.tsx` | "Chapter order": added `helperText="Display position — 1 is shown first"` | ✅ |
| 11 | `src/components/Gamification/RedemptionConditionForm.tsx` | "Count" field: dynamic `helperText` derived from condition type | ✅ |
| 12 | `src/components/Editor3/components/FileManager2.jsx` | Removed unused `ListItemSecondaryAction` import | ✅ |
| 13 | `src/components/CollaboratorManager.tsx` | Raw Cognito ID as primary label — layout fixed; display-name fallback is a separate data-layer concern | ℹ️ noted |
