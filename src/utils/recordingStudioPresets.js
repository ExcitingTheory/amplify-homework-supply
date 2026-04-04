/**
 * @fileoverview Preset factories for RecordingStudio3
 *
 * Each factory returns { scriptData, lockedTracks } matching RecordingStudio3 prop shapes.
 * Used by RecordingStudio3Modal in Dictionary, Editor, and Question workflows.
 */

/**
 * Creates a dialogue entry with the required shape for RecordingStudio3.
 * @param {Object} params
 * @param {number} params.id
 * @param {string} params.speaker - Speaker key
 * @param {string} params.text
 * @param {{ start: number, end: number }} [params.timing]
 * @param {string} [params.direction]
 * @param {string} [params.emotion]
 * @returns {Object} Dialogue line
 */
function createDialogueLine({ id, speaker, text, timing, direction = '', emotion = 'neutral' }) {
  return {
    id,
    speaker,
    text: text || '',
    timing: timing || { start: 0, end: 0 },
    direction,
    emotion,
    takes: [],
    activeTakeIndex: null,
  };
}

/**
 * Creates a word preset for recording vocabulary audio.
 *
 * Generates a two-track script (phrase + definition) from a Word model object.
 *
 * @param {Object} word
 * @param {string} word.phrase - The vocabulary word/phrase
 * @param {string} [word.pronunciation] - Phonetic pronunciation text
 * @param {string} [word.definition] - English definition
 * @returns {{ scriptData: Object, lockedTracks: string[] }}
 */
export function createWordPreset(word) {
  const phrase = word?.phrase || '';
  const pronunciation = word?.pronunciation || phrase;
  const definition = word?.definition || '';

  const scriptData = {
    metadata: {
      title: phrase ? `${phrase} — Vocabulary` : 'Vocabulary',
      scene: 'Vocabulary Practice',
      date: new Date().toISOString().split('T')[0],
      version: '1.0',
    },
    speakers: {
      phrase_track: {
        name: `Phrase (${phrase || 'untitled'})`,
        voice: 'shimmer',
        description: 'Pronunciation',
      },
      definition_track: {
        name: 'Definition',
        voice: 'alloy',
        description: 'English explanation',
      },
    },
    dialogue: [
      createDialogueLine({
        id: 1,
        speaker: 'phrase_track',
        text: pronunciation,
        timing: { start: 0.0, end: 2.0 },
        direction: 'clear pronunciation',
      }),
      createDialogueLine({
        id: 2,
        speaker: 'definition_track',
        text: definition,
        timing: { start: 2.5, end: 4.5 },
        direction: 'clear enunciation',
      }),
    ],
  };

  return {
    scriptData,
    lockedTracks: ['phrase_track', 'definition_track'],
  };
}

/**
 * Creates a conversation preset for open-ended dialogue recording.
 *
 * @param {string} [title] - Optional title for the conversation
 * @param {Array<{ id: string, name: string, voice?: string }>} [speakers] - Optional initial speakers
 * @returns {{ scriptData: Object, lockedTracks: string[] }}
 */
export function createConversationPreset(title, speakers) {
  const speakersMap = {};
  if (Array.isArray(speakers)) {
    speakers.forEach((s) => {
      speakersMap[s.id] = {
        name: s.name,
        voice: s.voice || 'alloy',
        description: '',
      };
    });
  }

  const scriptData = {
    metadata: {
      title: title || 'New Conversation',
      scene: '',
      date: new Date().toISOString().split('T')[0],
      version: '1.0',
    },
    speakers: speakersMap,
    dialogue: [],
  };

  return {
    scriptData,
    lockedTracks: [],
  };
}

/**
 * Creates a question preset for quiz question/answer audio.
 *
 * Generates a two-track script (prompt + answer) from a Question model object.
 *
 * @param {Object} question
 * @param {string} question.prompt - The question text
 * @param {string} [question.correctAnswer] - The answer text
 * @returns {{ scriptData: Object, lockedTracks: string[] }}
 */
export function createQuestionPreset(question) {
  const prompt = question?.prompt || '';
  const correctAnswer = question?.correctAnswer || '';

  const scriptData = {
    metadata: {
      title: prompt ? `${prompt.slice(0, 40)}${prompt.length > 40 ? '…' : ''} — Question` : 'Question',
      scene: 'Quiz Practice',
      date: new Date().toISOString().split('T')[0],
      version: '1.0',
    },
    speakers: {
      prompt_track: {
        name: 'Question Prompt',
        voice: 'fable',
        description: 'Quiz host voice',
      },
      answer_track: {
        name: 'Answer',
        voice: 'nova',
        description: 'Response voice',
      },
    },
    dialogue: [
      createDialogueLine({
        id: 1,
        speaker: 'prompt_track',
        text: prompt,
        timing: { start: 0.0, end: 2.5 },
        direction: 'questioning tone',
        emotion: 'inquisitive',
      }),
      createDialogueLine({
        id: 2,
        speaker: 'answer_track',
        text: correctAnswer,
        timing: { start: 3.0, end: 4.0 },
        direction: 'confident',
        emotion: 'assured',
      }),
    ],
  };

  return {
    scriptData,
    lockedTracks: ['prompt_track', 'answer_track'],
  };
}
