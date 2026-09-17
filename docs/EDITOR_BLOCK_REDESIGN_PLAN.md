# Editor Block Visual Redesign Plan

Ground-up restyle of the **custom editor block nodes** (both the author/editable
render and the learner/read-only render). Styling/interaction polish only —
**no block behavior, plugin, or authoring control is removed**.

> Verify against: **Editor Blocks (Live)** story
> (`🧩 UI Components/Design System Showcase → Editor Blocks (Live)`).

## Reference: the dashboard assignment card

The target visual language is the **dashboard assignment card**
([AssignmentCardView.tsx](../src/components/Dashboard/AssignmentCardView.tsx#L131)),
not the chat/specimen `EditorBlockShell` (removed). Match its exact card
language for editor blocks:

- `Card` `elevation={0}`, `border: "1px solid"` `borderColor: "divider"`.
- **4px** left accent (`borderLeft: "4px solid"`).
- `borderRadius: DASHBOARD_TOKENS.radius.card` (= `SEMANTIC_THEME.radius.card`, 8).
- Hover: `boxShadow: 4` (`SEMANTIC_THEME.elevation.cardHover`).
- Left-accent color = the assignment card's own logic, reusing the exported
  **`gradeColor(pct)`** from `AssignmentCardView`:
  - graded/completed → `gradeColor(accuracy).main` (>=80 success, >=60 warning,
    else error) — the performance color.
  - ungraded default → state color (pending = `warning.main`), or per-type.

> The editor/workbook uses the dedicated `ExerciseBlockCard`; the chat-specific
> `EditorBlockCard` is not used here. Reuse `gradeColor` thresholds rather than
> duplicating their behavior.

## Interaction: inline word-as-dropdown

- Do **not** add a separate/additional dropdown control alongside the prompt
  word. Instead, **replace the word itself with the dropdown** inside the card so
  the word is the trigger — the user just clicks the word to open its options.
- Applies to work (answer / vocabulary) blocks where a prompt word currently
  sits next to a separate input-method or mode selector: fold that selector into
  the word so there is a single inline affordance.
- The clicked word should visually read as interactive (affordance cue) while
  still showing the word text; opening it surfaces the same choices the old
  dropdown offered — no option or mode is removed.

## Accent rules (assignment-card parity)

- Reuse `gradeColor(pct)` exported from
  [AssignmentCardView.tsx](../src/components/Dashboard/AssignmentCardView.tsx#L23):
  `>=80` success · `>=60` warning · else error.
- Ungraded default: pending state color (`warning.main`), or per-type — TBD.

## Rollout checklist

- [x] Keep chat `EditorBlockCard` semantics out of editor/workbook code.
- [x] Add the workbook-specific `ExerciseBlockCard` surface.
- [x] Rebuild a block frame modeled on **AssignmentCardView** (elevation 0,
      1px divider, 4px left accent, card radius, hover shadow, `gradeColor`).
- [ ] Apply inline word-as-dropdown to answer/vocabulary blocks.
- [x] Quiz block read-only (`QuizView` in `QuizComponent.jsx`) — verified in
      `Content Blocks/Quiz → Read Only With Quiz`.
- [ ] Quiz block editable (`QuizEditor.jsx`).
- [ ] Answer (`AnswerComponent.jsx`), custom answer, meaning association,
      custom AI.
- [ ] Media blocks: word-block, youtube, playlist, conversation-playlist, pdf,
      image.
- [ ] Verify Editor Blocks (Live) in **light + dark**.
- [ ] Regression-check: Recurring Patterns, Gamification Components, Real
      Components stories.

## Notes / constraints

- Preserve every `data-tour` hook and existing class name (`Editor-question`,
  `quiz-block`, etc.) so tours and e2e selectors keep working.
- Production edits — proceed only with confirmation per repo rules.
