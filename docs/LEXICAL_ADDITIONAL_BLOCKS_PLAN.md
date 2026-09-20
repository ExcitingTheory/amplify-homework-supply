# Lexical Additional Blocks and Editor Actions Plan

> Status: Proposed
>
> Reference examples: [Lexical Playground](https://playground.lexical.dev/)

## Purpose

Extend Editor3 without breaking stored unit content, read-only rendering, grading,
collaboration, import/export, accessibility, or localization. Existing nodes and
plugins must remain backward compatible. New blocks require an explicit serialized
contract before UI implementation.

## Existing Baseline

Editor3 already supports rich text, headings, lists, links, code, horizontal rules,
tables, images, YouTube, PDFs, playlists, layouts, quizzes, vocabulary answers,
custom answers, meaning association, word blocks, custom AI blocks, Markdown
shortcuts, search highlighting, themes, and Yjs collaboration.

Some requested ideas are therefore refinements rather than new blocks:

- Horizontal rule is implemented.
- Images accept common formats; animated GIF behavior needs a focused verification.
- Tables exist and need usability improvements, not a replacement node.
- Left, center, right, and justify alignment exist; logical start/end semantics remain.
- Markdown transformers exist for current custom blocks; import/export coverage is
  incomplete.
- Search highlighting exists, but URL-addressable line/range highlights do not.
- Collaboration exists at the document layer; invitation, permissions, presence,
  ownership, and history UX remain separate product work.

## Required Contract for Every New Node

Before implementation, define:

- Serialized type, version, required/default fields, clone/import/export behavior,
  and migration from older versions.
- Editable, learner, read-only, print, server-rendered, and offline behavior.
- Copy/paste, Markdown, HTML, collaboration, undo/redo, deletion, and fallback behavior.
- Accessibility semantics and complete keyboard operation.
- Localized labels, dates, numbers, validation, and error messages.
- Storybook variants, unit tests, round-trip serialization fixtures, and workbook or
  grading tests where relevant.
- Authorization and storage ownership for private or shared data.

## Proposed Blocks

### Date, time, and calendar block

Provide two modes:

- **Display:** instant, date, date range, relative date, or read-only day/week/month
  calendar, rendered with a configured locale and time zone.
- **Graded response:** learner selects or enters a date/time/range and grading compares
  normalized values using an explicit tolerance and time-zone policy.

Reuse the installed MUI X date-picker/scheduler capabilities already used by
assignment timing. Persist ISO values plus IANA time zone and presentation options;
never persist locale-formatted display text as the source value.

Open decisions: accepted precision, ambiguous local times, relative-date grading,
calendar event source, accessibility on touch, and whether recurrence is in scope.

### Color vocabulary block

Show a color swatch while keeping the answer out of the visual label. Link the block
to a vocabulary `Word` record when available and grade only the configured color-word
answer. Persist a stable color value, accepted answers, locale, word ID, and contrast
metadata.

Do not rely on color alone: include an accessible prompt and non-color grading state.
Define handling for synonyms, spelling, scripts, alpha, gradients, and theme changes.

### Sticky note block

Author-only note with bold, italic, and lists. Hide it from learner/read-only output,
print, export, AI context, and published plain text unless the owner explicitly opts
in. The note must be deletable and discoverable without leaking private text.

Open decision: private notes cannot safely live in shared unit JSON unless encrypted
or stored separately with owner authorization. Resolve storage and ownership first.

### Collapsible and timed section block

Start with an accessible disclosure container. A later graded-timer mode may show a
countdown, emit start/expiry/submission events, and permit work after expiry while
recording elapsed status.

Keep timing policy in assignment/grade data rather than trusting the client clock.
Define nesting, block selection, late-work semantics, accommodations, offline expiry,
screen-reader announcements, and behavior when the section is collapsed.

### Poll block

Support single choice, multiple choice, rating, and short response; optional deadline;
required/optional participation; result visibility controls; and real-time updates.
Anonymous polls require a privacy-reviewed receipt/anti-duplicate design and must not
claim anonymity if identifiers remain recoverable.

Unit/assignment polls and general chat/community polls should share a response model
but use separate placement and authorization policies. This feature requires a data
model and backend design, so infrastructure remains `NEEDS_REVIEW` until approved.

### Math equation block

Use the installed KaTeX dependency for LaTeX input and real-time preview. Support
inline and display modes, parse errors, copyable source, accessible MathML or spoken
fallback, Markdown round trips, and strict sanitization. Do not execute arbitrary
HTML or macros.

### URL-addressable highlight

Extend editor search/mark behavior with a stable fragment format that identifies a
text quote or block/range without permanently mutating content. Prefer resilient text
fragments with a block-key fallback; handle duplicate text and stale links. Let users
choose accessible highlight styles, but preserve sufficient contrast.

### Ruby annotation

Add an inline node that serializes base text and pronunciation separately and renders
semantic `<ruby>`, `<rt>`, and fallback punctuation. Support insertion from a linked
Word record and direct inline editing. Define copy/paste, search, speech, Markdown,
HTML, and line-breaking behavior for Japanese and other ruby-using languages.

### Page break

Add a semantic print/export break with a visible authoring marker and no disruptive
learner behavior. Define HTML and PDF export semantics and keyboard deletion. This is
a bounded node after export requirements are settled.

### Excalidraw block

An Excalidraw node scaffold and package already exist, but the plugin and toolbar
integration are incomplete. Decide storage format, asset ownership, snapshot/thumbnail
generation, collaboration, maximum payload, read-only fallback, and export before
wiring the existing node into production content.

### GIF support

Treat GIF as an image capability unless editing or search is required. Verify upload,
animation, pause controls, reduced-motion behavior, size limits, CDN transforms,
offline caching, alt text, and export. Prefer static previews when motion reduction is
requested.

### Table improvements

Audit keyboard navigation, header rows/columns, captions, scope, row/column insertion,
cell merging, resizing, paste, narrow-screen overflow, CSV import/export, read-only
rendering, and large-table performance. Preserve existing serialized tables.

## Editor Actions

### Keyboard shortcut reference

Expose the existing shortcut documentation from an accessible Help action. The dialog
should derive labels from registered commands where practical and be searchable and
localized.

### Speech-to-text insertion

Add an explicit recording state, permission handling, language selection, interim
transcript, review-before-insert, correction, cancellation, and privacy disclosure.
Plain transcription inserts text at the selection. Commands to insert custom blocks
must use a constrained, confirmed command grammar; never execute arbitrary transcript
text as editor commands.

### Import, export, and backup

Define three formats instead of one ambiguous action:

1. Versioned Homework Supply JSON for lossless backup and restore.
2. Markdown for a documented portable subset plus fenced custom-block syntax.
3. Sanitized semantic HTML for readable interchange.

HTML export should initially be a documented subset. Export custom blocks as semantic
fallback markup plus optional embedded metadata; reference or package media using a
manifest. Do not promise a pixel-identical styled application export. Import must
sanitize HTML, reject unsupported executable content, report losses before commit,
and remain undoable.

### Share content

Separate publishing/access control from transport. First create a permission-aware
canonical link; then use the Web Share API where available with copy-link and email
fallbacks. Social sharing must never bypass unit visibility. Community publication
needs moderation, attribution, license, fork/version, and takedown policy.

### Clear content

Provide a destructive command with confirmation, accessible focus recovery, one-step
undo, collaboration behavior, autosave coordination, and protection against clearing
content the user cannot edit.

### Custom-block Markdown

Create a versioned fenced directive syntax with a registered transformer per block.
Unknown directives must round-trip as source or an explicit unsupported block rather
than silently losing data. Add fixtures for escaping, malformed input, nested content,
older versions, and import/export parity.

### Theme toggle

Expose the application's existing semantic themes rather than storing theme data in
editor content. Respect user/system preference and verify authoring/read-only contrast.

### Collaboration controls

Surface connection/presence state, invite collaborators, assign read/edit roles,
remove access, and show ownership. Server authorization remains authoritative. Define
what is uploaded by whom, offline conflict behavior, collaborator revocation, and
audit events. Do not equate Yjs transport access with application permission.

### Version history

Document snapshots or durable update history must support named versions, diff,
preview, restore-as-new-version, authorship, retention, and audit events. Restoration
must not rewrite history or bypass optimistic concurrency. Coordinate this with
[UNIFIED_UNDO_REDO_PLAN.md](UNIFIED_UNDO_REDO_PLAN.md); undo and version history are
different user contracts.

### Logical alignment and case transforms

- Add logical `start` and `end` alignment with direction-aware rendering and import/
  export behavior.
- Add lowercase, uppercase, title/capitalize, and small-caps actions. Case conversion
  must be locale-aware and undoable. Small caps is formatting, not destructive text
  conversion. Preserve selections and skip non-text/custom nodes safely.

## Delivery Order

### Phase 0: Compatibility harness

- Inventory current node type/version contracts.
- Add round-trip fixtures for representative legacy and kitchen-sink documents.
- Define unsupported-node rendering and migration policy.
- Add performance budgets for large documents and collaboration updates.

### Phase 1: Bounded editor improvements

- Keyboard shortcut entry point.
- Case transforms and logical alignment.
- GIF verification and reduced-motion behavior.
- Table accessibility/usability fixes.
- Page break after export semantics are approved.

### Phase 2: Portable content

- Lossless JSON backup/restore.
- Versioned custom-block Markdown syntax and subset export/import.
- Sanitized subset HTML export/import with media manifest.
- Clear and share actions.

### Phase 3: Learning blocks

- Math, Ruby, color vocabulary, and date/time/calendar blocks.
- Collapsible sections without grading, followed by timed grading only after policy
  and server-time contracts are approved.

### Phase 4: Stateful and collaborative features

- Sticky-note private storage.
- Excalidraw storage/collaboration integration.
- Collaboration permissions and durable version history.
- Poll data model, real-time results, moderation, and anonymous participation.

## Good First Issues

- Add locale-aware case-transform utilities and tests.
- Add a keyboard-shortcuts Help action using the existing reference.
- Add animated GIF and reduced-motion Storybook variants.
- Audit one table interaction and add a failing-then-passing keyboard test.
- Document the proposed custom-block Markdown grammar with round-trip examples.

## Definition of Done

A block or action is complete only when its persisted contract, authoring UI,
read-only/workbook behavior, collaboration and undo behavior, import/export fallback,
accessibility, i18n, stories, tests, documentation, and backward-compatibility fixture
all pass. Graded or shared features additionally require server-side authorization,
tamper-resistant state, and end-to-end tests.
