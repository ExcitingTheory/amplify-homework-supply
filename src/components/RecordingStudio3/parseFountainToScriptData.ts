/**
 * @fileoverview Fountain → RS3 ScriptData parser
 *
 * Parses standard Fountain screenplay format into the scriptData shape
 * consumed by RecordingStudio3. Uses the `fountain-js` npm package for
 * tokenization, then walks the token stream to build speakers, dialogue
 * lines, timing offsets, and direction notes.
 *
 * Direction notes use Fountain's native [[double bracket]] syntax and are
 * extracted from dialogue text into the `direction` field on each line.
 *
 * Timing is estimated from text length (~150 words/minute for speech)
 * with a 0.5s gap between lines.
 */

// @ts-expect-error — fountain-js ships no type declarations
import { Fountain } from 'fountain-js';

/** Words-per-minute estimate for timing calculation */
const WORDS_PER_MINUTE = 150;
/** Minimum duration in seconds for any dialogue line */
const MIN_DURATION = 1.0;
/** Gap between consecutive dialogue lines in seconds */
const GAP_SECONDS = 0.5;

// ── Types ──────────────────────────────────────────────────────────

export interface ScriptMetadata {
  title: string;
  scene: string;
  date: string;
  version: string;
}

export interface Speaker {
  name: string;
  voice: string;
  description: string;
}

export interface DialogueLine {
  id: number;
  speaker: string;
  text: string;
  timing: { start: number; end: number };
  direction: string;
  emotion: string;
  takes: never[];
  activeTakeIndex: null;
}

export interface ScriptData {
  metadata: ScriptMetadata;
  speakers: Record<string, Speaker>;
  dialogue: DialogueLine[];
}

// ── Helpers ────────────────────────────────────────────────────────

/** Extract all [[note]] blocks from text and return cleaned text + notes. */
function extractNotes(raw: string): { text: string; notes: string } {
  const notePattern = /\[\[([^\]]*)\]\]/g;
  const notes: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = notePattern.exec(raw)) !== null) {
    notes.push(match[1].trim());
  }

  const text = raw.replace(notePattern, '').replace(/\n/g, ' ').trim();
  return { text, notes: notes.join(' ') };
}

/** Strip parentheses wrapper from parenthetical text. */
function stripParens(raw: string): string {
  return raw.replace(/^\(/, '').replace(/\)$/, '').trim();
}

/** Estimate speech duration in seconds from word count. */
function estimateDuration(text: string): number {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const seconds = (wordCount / WORDS_PER_MINUTE) * 60;
  return Math.max(seconds, MIN_DURATION);
}

/** Normalise a character name to a stable speaker key. */
function toSpeakerKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

// ── Token types returned by fountain-js ────────────────────────────

interface FountainToken {
  type: string;
  text?: string;
  is_title?: boolean;
}

// ── Main parser ────────────────────────────────────────────────────

/**
 * Parse a Fountain screenplay string into RS3 `ScriptData`.
 *
 * Existing voice assignments can be preserved by passing `existingVoices`,
 * a map of speaker key → voice string (e.g. loaded from File.metadata).
 */
export function parseFountainToScriptData(
  fountain: string,
  existingVoices: Record<string, string> = {},
): ScriptData {
  const parser = new Fountain();
  const result = parser.parse(fountain, true);
  const tokens: FountainToken[] = result.tokens || [];

  // ── Title page fields ──
  let title = '';
  let date = '';
  for (const t of tokens) {
    if (t.is_title && t.type === 'title') title = t.text ?? '';
    if (t.is_title && t.type === 'date') date = t.text ?? '';
  }

  // ── Walk tokens to extract dialogue ──
  const speakers: Record<string, Speaker> = {};
  const dialogue: DialogueLine[] = [];
  let currentScene = '';
  let currentCharacter = '';
  let currentParenthetical = '';
  let dialogueId = 1;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'scene_heading') {
      currentScene = token.text ?? '';
      continue;
    }

    if (token.type === 'character') {
      currentCharacter = (token.text ?? '').trim();
      currentParenthetical = '';
      continue;
    }

    if (token.type === 'parenthetical') {
      currentParenthetical = stripParens(token.text ?? '');
      continue;
    }

    if (token.type === 'dialogue' && currentCharacter) {
      const { text, notes } = extractNotes(token.text ?? '');
      const speakerKey = toSpeakerKey(currentCharacter);

      // Register speaker if new
      if (!speakers[speakerKey]) {
        speakers[speakerKey] = {
          name: currentCharacter,
          voice: existingVoices[speakerKey] || 'alloy',
          description: currentParenthetical,
        };
      }

      dialogue.push({
        id: dialogueId++,
        speaker: speakerKey,
        text,
        timing: { start: 0, end: 0 }, // filled below
        direction: notes,
        emotion: currentParenthetical,
        takes: [],
        activeTakeIndex: null,
      });

      // Reset parenthetical after consuming it for this dialogue block
      // (next dialogue line under the same character inherits character
      //  but not parenthetical unless re-specified)
      currentParenthetical = '';
      continue;
    }

    // dialogue_begin / dialogue_end / page_break / action — skip
  }

  // ── Compute sequential timing ──
  let cursor = 0;
  for (const line of dialogue) {
    const duration = estimateDuration(line.text);
    line.timing = { start: cursor, end: +(cursor + duration).toFixed(2) };
    cursor = +(cursor + duration + GAP_SECONDS).toFixed(2);
  }

  return {
    metadata: {
      title: title || 'Untitled Screenplay',
      scene: currentScene || '',
      date: date || new Date().toISOString().split('T')[0],
      version: '1.0',
    },
    speakers,
    dialogue,
  };
}

/**
 * Convert RS3 `ScriptData` back into Fountain plain text.
 *
 * Round-trips through the parser: scriptData → Fountain string. Used by the
 * ScreenplayEditor to initialise the Lexical editor from existing scriptData,
 * and to export scripts as `.fountain` files.
 */
export function scriptDataToFountain(data: ScriptData): string {
  const lines: string[] = [];

  // Title page
  if (data.metadata.title) lines.push(`Title: ${data.metadata.title}`);
  if (data.metadata.date) lines.push(`Date: ${data.metadata.date}`);
  lines.push(''); // blank line ends title page

  // Group dialogue by scene (we only track the last scene in metadata,
  // so emit it once at the top of the script body)
  if (data.metadata.scene) {
    lines.push(data.metadata.scene);
    lines.push('');
  }

  for (const line of data.dialogue) {
    const speaker = data.speakers[line.speaker];
    const characterName = speaker?.name?.toUpperCase() || line.speaker.toUpperCase();

    lines.push(characterName);

    if (line.emotion) {
      lines.push(`(${line.emotion})`);
    }

    let dialogueText = line.text;
    if (line.direction) {
      dialogueText += `\n[[${line.direction}]]`;
    }
    lines.push(dialogueText);
    lines.push('');
  }

  return lines.join('\n');
}
