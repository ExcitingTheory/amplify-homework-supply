# Excalidraw Stroke Order Replay

## Goal

Capture the order and timing of student freehand strokes in Excalidraw, persist that information in the existing `Grade.data` payload, and let instructors replay the drawing in the grade review workflow.

## Scope

- Applies to the existing drawing response flow backed by `SketchPad`.
- Preserves the existing PNG submission and AI image-grading behavior.
- Stores drawing data inside the existing per-block `Grade.data` object; no data schema change is required.
- Adds replay controls to the instructor grade review experience.
- Existing grades without stroke metadata remain viewable as static drawings.

## Proposed Data Contract

The drawing block keeps its existing response data and adds a versioned replay payload:

```js
{
  responseType: "drawing",
  excalidrawData: {
    elements: [],
    appState: {},
    version: 1
  },
  strokeReplay: {
    version: 1,
    strokes: [
      {
        elementId: "excalidraw-element-id",
        strokeIndex: 0,
        startedAt: 1720000000000,
        completedAt: 1720000001200,
        points: [[0, 0], [2, 3], [5, 8]],
        pressures: [0.5, 0.6, 0.7]
      }
    ]
  }
}
```

Notes:

- `points` are stored in Excalidraw local coordinates and retain their original order.
- `pressures` is optional because mouse input may not provide meaningful pressure values.
- `startedAt` and `completedAt` provide stroke timing; point-level timestamps are intentionally omitted initially to limit `Grade.data` size.
- The full Excalidraw scene remains available for static rendering and compatibility.
- Replay metadata should be treated as untrusted persisted data and validated before rendering.

## Capture Design

1. Track pointer-down state for the active `freedraw` tool.
2. Use `onChange` to detect the newly created or updated freehand element.
3. When a stroke is completed, copy its ordered points and optional pressure values into the replay payload.
4. Assign a stable `strokeIndex` based on creation order and associate the record with the Excalidraw element ID.
5. Persist the scene and replay payload through the existing `persistData` callback, keeping the current PNG upload path unchanged.
6. Ensure undo, erase, and redraw operations do not leave replay records for deleted elements. Reconcile replay records against the current `freedraw` elements before saving.

The implementation should avoid mutating Excalidraw elements directly. If metadata is also placed on elements, use Excalidraw's supported custom data field and keep the canonical replay payload in `Grade.data`.

## Instructor Replay Design

Add a reusable client component near the existing instructor grade review components:

- Render the drawing in an Excalidraw read-only scene or a lightweight replay canvas.
- Start with no visible strokes, then reveal strokes in `strokeIndex` order.
- Use recorded timing when available, with a bounded playback speed control so unusually long pauses do not make replay impractical.
- Provide play/pause, restart, and a progress indicator.
- Allow scrubbing or selecting a stroke only if it can be implemented without making the first version unnecessarily complex.
- Fall back to the final static scene when `strokeReplay` is absent or invalid.
- Keep replay controls keyboard accessible and respect reduced-motion preferences.

The replay should be shown in the existing instructor grade review page alongside the student's other response content, with the drawing block's expected answer and feedback still visible.

## Compatibility and Storage

- No changes to `amplify/data/resource.ts` are expected.
- `Grade.data` remains JSON-serialized and keyed by the graded block/node key.
- Older grades continue to work because replay is optional.
- New saves should not overwrite unrelated fields in the block response.
- The persisted payload should be size-checked before saving; if replay data is too large, retain the final Excalidraw scene and PNG and surface a non-blocking warning.

## Implementation Phases

### Phase 1: Capture and persistence

- Define small shared types/helpers for replay metadata.
- Capture completed freehand strokes in `SketchPad`.
- Reconcile metadata after edits, undo, and erase.
- Add focused unit tests for ordering, deletion, malformed data, and legacy payloads.

### Phase 2: Instructor replay

- Add the replay viewer component.
- Integrate it into the instructor grade review rendering path.
- Add loading, empty, invalid-data, and static-fallback states.
- Add a Storybook story with a multi-stroke sample and a no-replay legacy sample.

### Phase 3: End-to-end verification

- Draw multiple strokes in the student flow and submit the response.
- Confirm `Grade.data` contains ordered replay metadata after persistence.
- Open the instructor grade review page and verify playback order and controls.
- Verify existing static drawing submissions still render.
- Run focused unit tests, Storybook tests, lint, and the relevant Playwright flow.

## Risks and Mitigations

- **Payload growth:** Store one point array per stroke, avoid point timestamps initially, and enforce a size guard.
- **Excalidraw edits:** Reconcile by element ID so erased strokes are not replayed.
- **Version differences:** Read only the installed Excalidraw element fields and keep replay metadata versioned.
- **Incomplete pointer events:** Use `onChange` as the source of truth for completed element data; pointer callbacks provide timing context only.
- **Reduced-motion/accessibility:** Make replay optional, provide pause/restart controls, and support reduced-motion behavior.

## Open Decisions Before Implementation

- Should replay use recorded pauses exactly, or normalize pauses to a maximum duration?
- Should instructors be able to scrub to an individual stroke in the first release?
- Should replay be available for every drawing response or only AI-graded drawing blocks?
