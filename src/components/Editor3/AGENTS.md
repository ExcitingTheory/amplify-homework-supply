# Editor3 Guide

- Lexical editor state is authoritative. Make content changes through Lexical commands, nodes, transforms, and editor updates, never direct DOM mutation.
- Save unit content through `saveEditorContent()` from `UnitContext`; do not mutate `unit.data` directly.
- Register custom nodes in the existing editor configuration and return cleanup functions from command, listener, and mutation registrations.
- Preserve serialized node compatibility. Existing unit JSON may outlive any component implementation.
- Check the installed Lexical package versions and current Lexical docs before API changes; core packages are currently 0.39.x while `@lexical/yjs` is 0.40.x.
- Guard Yjs reads until the shared type is attached to a document (`ytype.doc !== null`) and protect observer reads from teardown races.
- If an empty editor overlay mysteriously receives `display: none`, inspect `div:empty:last-child` rules in `theme.css`; use non-empty portal content rather than fighting the rule with broader CSS.
- Block autocomplete is owned by `plugins/BlockSuggestionPlugin.jsx` and `src/utils/layoutNgrams.ts`. Preserve the synchronous cached scoring path and derive signatures from Lexical JSON.
- Add or update the nearest node/plugin test and an interaction story when behavior is visible.
