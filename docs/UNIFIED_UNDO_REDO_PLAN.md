# Unified Undo/Redo Plan

## Goal

Provide a single undo/redo stack across the entire unit detail page (Lexical body, DictionaryEditor2, QuestionEditor2, unit metadata) and a separate per-grade undo stack for the student workbook.

## Current State

| Surface                                     | Undo Support                        | Save Strategy                    | Rollback on Undo?               |
| ------------------------------------------- | ----------------------------------- | -------------------------------- | ------------------------------- |
| **Editor3 (Lexical body)**                  | `HistoryPlugin` (Cmd+Z)             | Debounced 2s + Yjs 5s            | Yes — saves skipped during undo |
| **DictionaryEditor2 word text**             | Shared Lexical history per word     | Immediate on blur                | No — DB already written         |
| **DictionaryEditor2 bulk ops** (add/delete) | None                                | Immediate                        | No                              |
| **QuestionEditor2 text**                    | Shared Lexical history per question | Immediate on change              | No — DB already written         |
| **QuestionEditor2 bulk ops**                | None                                | Immediate                        | No                              |
| **Unit name/description**                   | None (plain TextField)              | Immediate on save                | No                              |
| **Workbook student answers**                | None                                | Immediate via Yjs + Grade.update | No                              |

### Key Files

- `src/components/Editor3/index.tsx` — `HistoryPlugin` at line ~427, `onChange` tag filtering at lines 336–383
- `src/components/Editor3/context/SharedHistoryContext.jsx` — unused shared history infrastructure
- `src/components/Editor3/plugins/HistoryDebugPlugin.js` — dev-only debug tool
- `src/components/DictionaryEditor2.jsx` — standalone `LexicalComposer` + `HistoryPlugin` at line ~1775, immediate `Word.update()` on blur
- `src/components/QuestionEditor2.jsx` — standalone `LexicalComposer` + `HistoryPlugin` at line ~1200, immediate `Question.update()` on change
- `src/hooks/useYjsUnit.ts` — Yjs provider for unit editing, `Y.Text` only
- `src/yjs/WorkbookCollaborationProvider.ts` — Yjs for student workbook
- `src/yjs/workbookHooks.ts` — `useWorkbookCollaboration` hook
- `src/context/unitContext.jsx` — `saveEditorContent()`, `editorStateRef`, `versionRef`, workbook sync
- `pages/unit/[id].jsx` — unit detail page (renders Editor which hosts all side panels)
- `pages/workbook/[id].jsx` — student workbook page
- `src/components/Editor3/Workbook.tsx` — read-only Lexical + student answer blocks

### Key Insight

The codebase already uses **Yjs** as the real-time sync layer for both the editor (`CollaborationPlugin` / `useYjsUnit`) and the workbook (`WorkbookCollaborationProvider`). Yjs ships with **`Y.UndoManager`** — a CRDT-aware undo manager that can track changes across multiple shared types in the same `Y.Doc`. The test file at `test/performance/yjs-collaboration.test.ts` already exercises `Y.UndoManager`.

This is the natural backbone for unified undo/redo.

---

## Architecture: Two-Tier Yjs UndoManager

### Tier 1 — Unit Detail Page (Instructor Authoring)

Extend the existing Yjs `Y.Doc` to hold all unit-page state as shared types, then attach a single `Y.UndoManager` across them.

#### 1. Expand Y.Doc Schema

Currently only `Y.Text` for the Lexical body. Add:

- `Y.Array<Y.Map>` for dictionary words
- `Y.Array<Y.Map>` for questions
- `Y.Map` for unit metadata (name, description)

**New file**: `src/yjs/unitDocSchema.ts`

```ts
import * as Y from "yjs";

export interface UnitDocSchema {
  /** Lexical editor body content */
  content: Y.Text;
  /** Dictionary words */
  words: Y.Array<Y.Map<any>>;
  /** Questions */
  questions: Y.Array<Y.Map<any>>;
  /** Unit metadata (name, description, etc.) */
  metadata: Y.Map<any>;
}

export function getUnitDocTypes(doc: Y.Doc): UnitDocSchema {
  return {
    content: doc.getText("content"),
    words: doc.getArray("words"),
    questions: doc.getArray("questions"),
    metadata: doc.getMap("metadata"),
  };
}
```

#### 2. Create Unified UndoManager Hook

**New file**: `src/hooks/useUnitUndoManager.ts`

Wraps `Y.UndoManager` tracking all shared types:

```ts
import * as Y from "yjs";
import { UnitDocSchema } from "../yjs/unitDocSchema";

const undoManager = new Y.UndoManager(
  [schema.content, schema.words, schema.questions, schema.metadata],
  { trackedOrigins: new Set([clientOrigin]) },
);
```

Single undo stack across all editor surfaces. Cmd+Z undoes whichever change happened last, regardless of which panel it was in.

#### 3. Replace Immediate DataStore Saves with Yjs-Mediated Saves

In **DictionaryEditor2** and **QuestionEditor2**:

- Mutations go through `ywords.push(...)` / `ywords.delete(...)` instead of direct `client.models.Word.update()`
- A debounced observer on the `Y.Array` syncs changes to DataStore (same pattern as current Lexical → DataStore flow)
- This makes all mutations undoable before they hit the DB

#### 4. Replace Lexical HistoryPlugin with Yjs-Backed History

In **Editor3**:

- `@lexical/yjs` already coordinates Lexical ↔ Yjs via `CollaborationPlugin`
- Remove standalone `HistoryPlugin`
- Let `Y.UndoManager` handle Cmd+Z / Cmd+Shift+Z by dispatching `UNDO_COMMAND` / `REDO_COMMAND` to Lexical through the Yjs binding

#### 5. Wire Global Keyboard Shortcuts

Register a global Cmd+Z / Cmd+Shift+Z handler in the `Editor` component that calls `undoManager.undo()` / `undoManager.redo()`, overriding per-surface Lexical handlers.

#### 6. Activate SharedHistoryContext

The unused `src/components/Editor3/context/SharedHistoryContext.jsx` becomes the real provider for the unified undo manager, consumed by all sub-editors.

#### Files to Modify

| File                                                      | Change                                                     |
| --------------------------------------------------------- | ---------------------------------------------------------- |
| `src/hooks/useYjsUnit.ts`                                 | Expand Y.Doc schema, add UndoManager                       |
| `src/components/Editor3/index.tsx`                        | Swap `HistoryPlugin` for Yjs undo, add global keybinding   |
| `src/components/Editor3/context/SharedHistoryContext.jsx` | Expose UndoManager                                         |
| `src/components/DictionaryEditor2.jsx`                    | Mutations through Y.Array, remove standalone HistoryPlugin |
| `src/components/QuestionEditor2.jsx`                      | Same as DictionaryEditor2                                  |
| `src/context/unitContext.jsx`                             | New debounced sync observers for words/questions           |

#### New Files

| File                              | Purpose                       |
| --------------------------------- | ----------------------------- |
| `src/yjs/unitDocSchema.ts`        | Shared Y.Doc type definitions |
| `src/hooks/useUnitUndoManager.ts` | Unified undo manager hook     |

---

### Tier 2 — Workbook (Student Answers)

Per-grade `Y.UndoManager` attached to the workbook's existing Yjs `Y.Map`.

#### 1. Add UndoManager to WorkbookCollaborationProvider

Track the `Y.Map` that stores block answers:

```ts
this.undoManager = new Y.UndoManager(this.workbookMap, {
  trackedOrigins: new Set([this.clientId]),
});
```

#### 2. Expose Undo/Redo in the Hook

Add `undo()` / `redo()` / `canUndo` / `canRedo` to `useWorkbookCollaboration` return value.

#### 3. Defer Grade.update

Change `onSyncToGrade` from firing on every block update to debounced (already has `syncInterval`), ensuring undo can roll back before persistence.

#### 4. History Scope

Single undo stack per grade is correct — students work through one grade at a time. No need for per-page splitting.

#### Files to Modify

| File                                       | Change                 |
| ------------------------------------------ | ---------------------- |
| `src/yjs/WorkbookCollaborationProvider.ts` | Add UndoManager        |
| `src/yjs/workbookHooks.ts`                 | Expose undo/redo       |
| `src/components/Editor3/Workbook.tsx`      | Add undo UI/keybinding |

---

## What NOT to Do

- **Don't build a custom command-pattern undo stack** — `Y.UndoManager` already solves this with CRDT awareness, conflict-free multi-user support, and origin tracking
- **Don't try to unify instructor and student undo** — They operate on different Y.Docs with different lifecycles
- **Don't keep per-sub-editor history** — That's the current fragmented state; consolidation is the goal

---

## Migration Phases

Each phase is independently deployable and testable.

### Phase 1 — Replace Editor3 HistoryPlugin with Yjs UndoManager

**Scope**: Wire `Y.UndoManager` to `useYjsUnit`, replace `HistoryPlugin` in Editor3 body only.

**Risk**: Low — behavior parity with today.

**Tasks**:

- [ ] Create `src/yjs/unitDocSchema.ts`
- [ ] Create `src/hooks/useUnitUndoManager.ts` (content type only)
- [ ] Modify `src/hooks/useYjsUnit.ts` to expose UndoManager
- [ ] Replace `HistoryPlugin` in `src/components/Editor3/index.tsx`
- [ ] Verify Cmd+Z / Cmd+Shift+Z works with Yjs undo
- [ ] Test: undo does not trigger DataStore save (existing tag-filter behavior preserved)

### Phase 2 — DictionaryEditor2 → Yjs Array

**Scope**: Move word mutations to `Y.Array<Y.Map>`, connect to unified undo stack.

**Risk**: Medium — changes save flow.

**Tasks**:

- [ ] Add `words` Y.Array to unit Y.Doc schema
- [ ] Create debounced observer that syncs Y.Array → `client.models.Word.update()`
- [ ] Rewrite DictionaryEditor2 mutations to go through Yjs
- [ ] Remove standalone `HistoryPlugin` from DictionaryEditor2
- [ ] Wire DictionaryEditor2 to unified UndoManager via SharedHistoryContext
- [ ] Handle initial load: populate Y.Array from existing Word records
- [ ] Test: undo word edit rolls back Y.Array state, debounced save sees reverted value

### Phase 3 — QuestionEditor2 → Yjs Array

**Scope**: Same as Phase 2, for questions.

**Risk**: Medium.

**Tasks**:

- [ ] Add `questions` Y.Array to unit Y.Doc schema
- [ ] Create debounced observer for `client.models.Question.update()`
- [ ] Rewrite QuestionEditor2 mutations to go through Yjs
- [ ] Remove standalone `HistoryPlugin` from QuestionEditor2
- [ ] Wire to unified UndoManager
- [ ] Handle initial load from existing Question records
- [ ] Test: undo question edit, undo question delete, undo across panels

### Phase 4 — Unit Metadata → Yjs Map

**Scope**: Add unit name/description to Y.Doc, make undoable.

**Risk**: Low — additive.

**Tasks**:

- [ ] Add `metadata` Y.Map to unit Y.Doc schema
- [ ] Wire name/description TextFields to Y.Map
- [ ] Debounced observer syncs to `client.models.Unit.update()`
- [ ] Test: undo name change

### Phase 5 — Workbook UndoManager

**Scope**: Add `Y.UndoManager` to `WorkbookCollaborationProvider`.

**Risk**: Low — additive, no existing undo to break.

**Tasks**:

- [ ] Add UndoManager to `WorkbookCollaborationProvider`
- [ ] Expose `undo()` / `redo()` / `canUndo` / `canRedo` in `useWorkbookCollaboration`
- [ ] Add undo/redo UI to Workbook (toolbar button or keyboard shortcut)
- [ ] Defer `onSyncToGrade` with debounce to allow undo window
- [ ] Test: undo student answer, redo student answer

---

## Cross-Surface Undo UX

A unified undo stack means Cmd+Z may undo a change on a surface the user isn't currently looking at. This section defines the behavior for each scenario.

### Decision Matrix

| Undo target | User is viewing | Action |
|---|---|---|
| Same visible surface | Same surface | Undo normally, no extra UI |
| Different sidebar tab | Another tab | Auto-switch to target tab + snackbar |
| Closed modal | Any surface | Undo silently (no modal reopen) + snackbar |
| Unit metadata (name/desc) | Any surface | Snackbar only (metadata always visible at top) |
| Cross-page (unit ↔ workbook) | N/A | Cannot happen — separate Y.Docs, separate undo stacks |

### Implementation: `stack-item-popped` Event Handler

`Y.UndoManager` emits `stack-item-popped` after each undo/redo. The event includes `changedParentTypes` — a `Map` of which Yjs shared types were affected. Use this to resolve the target surface:

```ts
// src/hooks/useUnitUndoManager.ts

/** Map Yjs shared types to editor surfaces */
function resolveTargetSurface(
  changedTypes: Map<Y.AbstractType<any>, Set<any>>,
  schema: UnitDocSchema,
): 'editor' | 'dictionary' | 'questions' | 'metadata' {
  if (changedTypes.has(schema.words)) return 'dictionary';
  if (changedTypes.has(schema.questions)) return 'questions';
  if (changedTypes.has(schema.metadata)) return 'metadata';
  return 'editor'; // default: Lexical body content
}

undoManager.on('stack-item-popped', (event: { changedParentTypes: Map<Y.AbstractType<any>, Set<any>>, type: 'undo' | 'redo' }) => {
  const target = resolveTargetSurface(event.changedParentTypes, schema);
  const action = event.type === 'undo' ? 'Undone' : 'Redone';

  // Auto-navigate if the undone change is on a different tab
  if (target !== activeTab && target !== 'metadata') {
    setActiveTab(target);
  }

  // Always show feedback so the user knows what happened
  showSnackbar(`${action}: ${describeChange(event, target)}`);
});
```

### Snackbar Message Format

Messages should be short and identify the surface:

- *"Undone: edited word 'photosynthesis' (Dictionary)"*
- *"Undone: deleted question #3 (Questions)"*
- *"Undone: renamed unit to 'Cell Biology'"*
- *"Redone: added word 'ecosystem' (Dictionary)"*

For Lexical body edits, no surface label needed since it's the primary editor:

- *"Undone: text edit"*

### Auto-Navigate Behavior

When undo/redo targets a **different sidebar tab**:

1. The tab switches automatically so the user sees the reverted state
2. The snackbar confirms what happened
3. Focus remains in the main content area (not stolen by the sidebar)

When undo targets a **closed modal** (e.g., word detail modal, question edit modal):

1. The modal is **not** reopened — this would be disorienting
2. The Yjs state is rolled back in the Y.Array
3. The snackbar confirms what was undone
4. When the user next opens that modal/tab, the state is already correct

### Edge Case: Rapid Cross-Surface Undo

If a user hits Cmd+Z multiple times quickly and the undo stack alternates between surfaces (e.g., word edit → body edit → question edit), the tab should **not** thrash back and forth. Debounce tab switches:

```ts
const pendingTabSwitch = useRef<ReturnType<typeof setTimeout> | null>(null);

function scheduleTabSwitch(target: string) {
  if (pendingTabSwitch.current) clearTimeout(pendingTabSwitch.current);
  pendingTabSwitch.current = setTimeout(() => {
    setActiveTab(target);
    pendingTabSwitch.current = null;
  }, 300); // only switch if user pauses
}
```

During rapid undo, only the snackbar updates immediately. The tab switch settles after 300ms of inactivity.

### New Dependencies

| Component | Responsibility |
|---|---|
| `useUnitUndoManager` hook | Listens to `stack-item-popped`, resolves target surface |
| `SharedHistoryContext` | Provides `activeTab` / `setActiveTab` bridge to Editor sidebar |
| MUI `Snackbar` (already in project) | Displays undo/redo feedback messages |

---

## Open Questions

1. **Undo stack depth** — Lexical defaults to 1000 entries. What limit for the unified stack? `Y.UndoManager` has `captureTimeout` to group rapid changes (default 500ms).

2. **Collaborative undo** — With multiple instructors editing simultaneously, `trackedOrigins` ensures each user only undoes their own changes. Confirm this is desired behavior vs. "undo last change by anyone."

3. **Conflict between Yjs undo and Lexical undo** — When replacing `HistoryPlugin`, need to verify that `CollaborationPlugin` properly routes Yjs undo operations back into Lexical editor state. The `@lexical/yjs` package should handle this but needs testing.

4. **Bulk operations** — For operations like "import 50 words from CSV", should this be a single undo entry? `Y.UndoManager` supports `doc.transact(() => { ... }, origin)` to group mutations into one undo step.

5. **Snackbar change descriptions** — How detailed should undo messages be? Options range from generic (*"Undone: dictionary change"*) to specific (*"Undone: changed definition of 'photosynthesis'"*). Specific requires storing metadata on the undo stack item via `Y.UndoManager`'s `stackItem.meta` map.
