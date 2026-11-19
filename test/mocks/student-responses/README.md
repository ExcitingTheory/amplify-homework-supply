# Seeded student answers

Assets the sandbox seed uses to create `GradeResponse` items (see
`amplify/seed/studentResponses.ts`). Recordings are uploaded to each student's
private `user-submissions` folder; the drawing is stored as strokes on the item.

## Recordings

Encoded the way the app records a spoken answer (`speechRecorderOptions` in
`src/utils/audioRecordingFormat.ts`): mono Opus at 16 kbps in WebM, as Chrome
and Firefox record, or mono AAC at 24 kbps in MP4, as Safari records.

| File | Says (seeded transcript) | Format | Used for |
| --- | --- | --- | --- |
| `sayonara-chrome.webm` | さようなら | Opus 16 kbps | student1, correct spoken answer |
| `sayonara-casual-safari.m4a` | さよなら | AAC 24 kbps | student2, casual form, flagged for review |
| `quiet-room.webm` | (nothing; room tone) | Opus 16 kbps | student4, empty transcript, flagged for review |
| `biology-first-try.webm` | "Um, it happens in the..." | Opus 16 kbps | student1, first attempt whose transcription timed out |
| `biology-chloroplast-answer.webm` | the chloroplast answer in `scripts/demos/generate-spoken-answer.mjs` | Opus 16 kbps | student1, second attempt, graded |

The Japanese and "first try" clips are synthesized speech (espeak-ng). The
chloroplast answer is a re-encode of `test/mocks/biology-spoken-answer.wav`
(OpenAI TTS). Regenerate with:

```bash
node scripts/seed/generate-response-audio.mjs --force            # espeak-ng + ffmpeg
node scripts/seed/generate-response-audio.mjs --force --tts openai  # natural voices; needs OPENAI_API_KEY
```

If you change what a clip says, change its transcript in
`amplify/seed/studentResponses.ts` too.

## Handwriting

`kanjivg-arigatou.json` holds the stroke paths, in stroke order, for the
hiragana in ありがとう. `amplify/seed/handwriting.ts` draws them like a student
would (pointer samples every ~16 ms, a little tremor, pauses between strokes)
through the app's own `updateStrokeLog`, so the seeded strokes are the same data
a real submission stores. student1 draws it in the correct order; student2 draws
あ's first two strokes the other way round and と's long stroke backwards, which
`compareStrokeOrder` reports.

Stroke data from [KanjiVG](https://kanjivg.tagaini.net), copyright (C) Ulrich
Apel, used under the
[Creative Commons Attribution-Share Alike 3.0](https://creativecommons.org/licenses/by-sa/3.0/)
licence. The paths are copied unchanged; `kanjivg-arigatou.json` is shared under
the same licence.
