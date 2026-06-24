import { describe, it, expect } from 'vitest';
import {
  createWordPreset,
  createConversationPreset,
  createQuestionPreset,
} from '../../utils/recordingStudioPresets';

/**
 * Validates a dialogue line has the required shape for RecordingStudio3.
 */
function expectValidDialogueLine(line: any) {
  expect(line).toHaveProperty('id');
  expect(line).toHaveProperty('speaker');
  expect(typeof line.speaker).toBe('string');
  expect(line).toHaveProperty('text');
  expect(typeof line.text).toBe('string');
  expect(line).toHaveProperty('timing');
  expect(line.timing).toHaveProperty('start');
  expect(line.timing).toHaveProperty('end');
  expect(typeof line.timing.start).toBe('number');
  expect(typeof line.timing.end).toBe('number');
  expect(line).toHaveProperty('direction');
  expect(line).toHaveProperty('emotion');
  expect(line).toHaveProperty('takes');
  expect(Array.isArray(line.takes)).toBe(true);
  expect(line.takes).toHaveLength(0);
  expect(line).toHaveProperty('activeTakeIndex');
  expect(line.activeTakeIndex).toBeNull();
}

/**
 * Validates the top-level scriptData shape.
 */
function expectValidScriptData(scriptData: any) {
  expect(scriptData).toHaveProperty('metadata');
  expect(scriptData.metadata).toHaveProperty('title');
  expect(scriptData.metadata).toHaveProperty('scene');
  expect(scriptData.metadata).toHaveProperty('date');
  expect(scriptData.metadata).toHaveProperty('version');
  expect(typeof scriptData.metadata.title).toBe('string');
  expect(typeof scriptData.metadata.date).toBe('string');
  // Date format YYYY-MM-DD
  expect(scriptData.metadata.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

  expect(scriptData).toHaveProperty('speakers');
  expect(typeof scriptData.speakers).toBe('object');

  expect(scriptData).toHaveProperty('dialogue');
  expect(Array.isArray(scriptData.dialogue)).toBe(true);
}

describe('createWordPreset', () => {
  it('returns correct speakers and locked tracks from a Word object', () => {
    const result: any = createWordPreset({
      phrase: 'こんにちは',
      pronunciation: 'konnichiwa',
      definition: 'Hello. Good afternoon.',
    });

    expect(result).toHaveProperty('scriptData');
    expect(result).toHaveProperty('lockedTracks');
    expectValidScriptData(result.scriptData);

    // Speakers
    expect(result.scriptData.speakers).toHaveProperty('phrase_track');
    expect(result.scriptData.speakers).toHaveProperty('definition_track');
    expect(result.scriptData.speakers.phrase_track.name).toContain('こんにちは');
    expect(result.scriptData.speakers.phrase_track.voice).toBe('shimmer');
    expect(result.scriptData.speakers.definition_track.name).toBe('Definition');
    expect(result.scriptData.speakers.definition_track.voice).toBe('alloy');

    // Dialogue - two lines
    expect(result.scriptData.dialogue).toHaveLength(2);
    expect(result.scriptData.dialogue[0].speaker).toBe('phrase_track');
    expect(result.scriptData.dialogue[0].text).toBe('konnichiwa');
    expect(result.scriptData.dialogue[1].speaker).toBe('definition_track');
    expect(result.scriptData.dialogue[1].text).toBe('Hello. Good afternoon.');

    // Locked tracks
    expect(result.lockedTracks).toEqual(['phrase_track', 'definition_track']);
  });

  it('produces valid dialogue line shapes', () => {
    const result: any = createWordPreset({
      phrase: 'test',
      pronunciation: 'test',
      definition: 'a test',
    });
    result.scriptData.dialogue.forEach(expectValidDialogueLine);
  });

  it('uses phrase as pronunciation fallback when pronunciation is missing', () => {
    const result: any = createWordPreset({
      phrase: 'bonjour',
      definition: 'Hello',
    });

    expect(result.scriptData.dialogue[0].text).toBe('bonjour');
  });

  it('handles empty definition gracefully', () => {
    const result: any = createWordPreset({
      phrase: 'test',
      pronunciation: 'test',
      definition: '',
    });

    expectValidScriptData(result.scriptData);
    expect(result.scriptData.dialogue[1].text).toBe('');
    expect(result.scriptData.dialogue).toHaveLength(2);
  });

  it('handles null/undefined input gracefully', () => {
    const result: any = createWordPreset(null as any);
    expectValidScriptData(result.scriptData);
    expect(result.scriptData.dialogue).toHaveLength(2);
    expect(result.lockedTracks).toEqual(['phrase_track', 'definition_track']);
  });

  it('includes phrase in metadata title', () => {
    const result: any = createWordPreset({ phrase: 'agua', definition: 'water' });
    expect(result.scriptData.metadata.title).toContain('agua');
    expect(result.scriptData.metadata.title).toContain('Vocabulary');
  });
});

describe('createConversationPreset', () => {
  it('returns empty dialogue and no locked tracks by default', () => {
    const result: any = createConversationPreset();
    expectValidScriptData(result.scriptData);

    expect(result.scriptData.dialogue).toHaveLength(0);
    expect(result.lockedTracks).toEqual([]);
    expect(Object.keys(result.scriptData.speakers)).toHaveLength(0);
    expect(result.scriptData.metadata.title).toBe('New Conversation');
  });

  it('uses provided title', () => {
    const result: any = createConversationPreset('Coffee Shop');
    expect(result.scriptData.metadata.title).toBe('Coffee Shop');
  });

  it('seeds speakers when provided', () => {
    const result: any = createConversationPreset('Interview', [
      { id: 'host', name: 'Host', voice: 'fable' },
      { id: 'guest', name: 'Guest' },
    ]);

    expect(Object.keys(result.scriptData.speakers)).toHaveLength(2);
    expect(result.scriptData.speakers.host.name).toBe('Host');
    expect(result.scriptData.speakers.host.voice).toBe('fable');
    expect(result.scriptData.speakers.guest.name).toBe('Guest');
    expect(result.scriptData.speakers.guest.voice).toBe('alloy'); // default
    expect(result.lockedTracks).toEqual([]);
  });

  it('handles empty speakers array', () => {
    const result: any = createConversationPreset('Test', []);
    expect(Object.keys(result.scriptData.speakers)).toHaveLength(0);
  });
});

describe('createQuestionPreset', () => {
  it('returns correct speakers, dialogue, and locked tracks', () => {
    const result: any = createQuestionPreset({
      prompt: 'What is the capital of France?',
      correctAnswer: 'Paris',
    });

    expect(result).toHaveProperty('scriptData');
    expect(result).toHaveProperty('lockedTracks');
    expectValidScriptData(result.scriptData);

    // Speakers
    expect(result.scriptData.speakers).toHaveProperty('prompt_track');
    expect(result.scriptData.speakers).toHaveProperty('answer_track');
    expect(result.scriptData.speakers.prompt_track.name).toBe('Question Prompt');
    expect(result.scriptData.speakers.prompt_track.voice).toBe('fable');
    expect(result.scriptData.speakers.answer_track.name).toBe('Answer');
    expect(result.scriptData.speakers.answer_track.voice).toBe('nova');

    // Dialogue
    expect(result.scriptData.dialogue).toHaveLength(2);
    expect(result.scriptData.dialogue[0].speaker).toBe('prompt_track');
    expect(result.scriptData.dialogue[0].text).toBe('What is the capital of France?');
    expect(result.scriptData.dialogue[1].speaker).toBe('answer_track');
    expect(result.scriptData.dialogue[1].text).toBe('Paris');

    // Locked tracks
    expect(result.lockedTracks).toEqual(['prompt_track', 'answer_track']);
  });

  it('produces valid dialogue line shapes', () => {
    const result: any = createQuestionPreset({
      prompt: 'Question?',
      correctAnswer: 'Answer.',
    });
    result.scriptData.dialogue.forEach(expectValidDialogueLine);
  });

  it('handles missing correctAnswer', () => {
    const result: any = createQuestionPreset({
      prompt: 'What color is the sky?',
    } as any);

    expectValidScriptData(result.scriptData);
    expect(result.scriptData.dialogue[1].text).toBe('');
  });

  it('handles null input gracefully', () => {
    const result: any = createQuestionPreset(null as any);
    expectValidScriptData(result.scriptData);
    expect(result.scriptData.dialogue).toHaveLength(2);
    expect(result.lockedTracks).toEqual(['prompt_track', 'answer_track']);
  });

  it('truncates long prompts in metadata title', () => {
    const longPrompt = 'A'.repeat(60);
    const result: any = createQuestionPreset({ prompt: longPrompt, correctAnswer: 'B' });
    expect(result.scriptData.metadata.title.length).toBeLessThan(longPrompt.length);
    expect(result.scriptData.metadata.title).toContain('…');
    expect(result.scriptData.metadata.title).toContain('Question');
  });
});
