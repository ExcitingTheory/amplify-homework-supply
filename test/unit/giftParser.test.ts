import { describe, it, expect } from 'vitest';
import { parseGiftText } from '../../amplify/functions/documentAnalysis/giftParser';

describe('giftParser', () => {
  describe('parseGiftText', () => {
    it('returns empty array for empty input', () => {
      expect(parseGiftText('')).toEqual([]);
    });

    it('ignores comment lines', () => {
      const input = `// This is a comment
// Another comment`;
      expect(parseGiftText(input)).toEqual([]);
    });

    it('parses multiple choice questions', () => {
      const input = `::Japanese Greeting:: What does こんにちは mean? {
  =Hello / Good afternoon
  ~Goodbye
  ~Thank you
  ~Good morning
}`;
      const questions = parseGiftText(input);
      expect(questions).toHaveLength(1);
      expect(questions[0].prompt).toBe('What does こんにちは mean?');
      expect(questions[0].answer).toBe('Hello / Good afternoon');
      expect(questions[0].questionType).toBe('multiple-choice');
      expect(questions[0].options).toHaveLength(4);
      expect(questions[0].metadata).toEqual({ title: 'Japanese Greeting' });
    });

    it('parses true/false questions', () => {
      const input = `::True False:: Kanji originated from Chinese characters. {TRUE}`;
      const questions = parseGiftText(input);
      expect(questions).toHaveLength(1);
      expect(questions[0].answer).toBe('True');
      expect(questions[0].questionType).toBe('true-false');
      expect(questions[0].options).toEqual(['True', 'False']);
    });

    it('parses FALSE answers', () => {
      const input = `The moon is made of cheese. {FALSE}`;
      const questions = parseGiftText(input);
      expect(questions).toHaveLength(1);
      expect(questions[0].answer).toBe('False');
      expect(questions[0].questionType).toBe('true-false');
    });

    it('parses short answer questions', () => {
      const input = `What is the capital of Japan? {=Tokyo}`;
      const questions = parseGiftText(input);
      expect(questions).toHaveLength(1);
      expect(questions[0].answer).toBe('Tokyo');
      expect(questions[0].questionType).toBe('short-answer');
    });

    it('parses matching questions', () => {
      const input = `Match the greeting to the time of day. {
  =おはよう -> Morning
  =こんにちは -> Afternoon
  =こんばんは -> Evening
}`;
      const questions = parseGiftText(input);
      expect(questions).toHaveLength(1);
      expect(questions[0].questionType).toBe('matching');
      expect(questions[0].answer).toContain('Morning');
      expect(questions[0].answer).toContain('Afternoon');
      expect(questions[0].answer).toContain('Evening');
    });

    it('parses essay questions (empty braces)', () => {
      const input = `Describe the significance of hanami in Japanese culture. {}`;
      const questions = parseGiftText(input);
      expect(questions).toHaveLength(1);
      expect(questions[0].questionType).toBe('essay');
      expect(questions[0].answer).toBe('');
    });

    it('parses numerical questions', () => {
      const input = `What is the value of pi to 2 decimal places? {#3.14:0.01}`;
      const questions = parseGiftText(input);
      expect(questions).toHaveLength(1);
      expect(questions[0].questionType).toBe('numerical');
      expect(questions[0].answer).toBe('3.14');
    });

    it('parses fill-in-the-blank (missing word)', () => {
      const input = `The Japanese word for water is {=mizu} in romaji.`;
      const questions = parseGiftText(input);
      expect(questions).toHaveLength(1);
      expect(questions[0].questionType).toBe('fill-in-the-blank');
      expect(questions[0].prompt).toContain('___');
    });

    it('parses multiple questions separated by blank lines', () => {
      const input = `What is 2+2? {=4}

What is 3+3? {=6}

What is 5+5? {=10}`;
      const questions = parseGiftText(input);
      expect(questions).toHaveLength(3);
      expect(questions[0].answer).toBe('4');
      expect(questions[1].answer).toBe('6');
      expect(questions[2].answer).toBe('10');
    });

    it('handles T/F shorthand', () => {
      const input = `The earth is round. {T}`;
      const questions = parseGiftText(input);
      expect(questions).toHaveLength(1);
      expect(questions[0].answer).toBe('True');
      expect(questions[0].questionType).toBe('true-false');
    });

    it('sets difficulty to medium by default', () => {
      const input = `What is 1+1? {=2}`;
      const questions = parseGiftText(input);
      expect(questions[0].difficulty).toBe('medium');
    });

    it('sets easy difficulty for true/false', () => {
      const input = `The sky is blue. {TRUE}`;
      const questions = parseGiftText(input);
      expect(questions[0].difficulty).toBe('easy');
    });
  });
});
