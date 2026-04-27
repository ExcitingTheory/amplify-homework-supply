/**
 * OfflineChatEngine — On-device AI for chat and grading when offline.
 *
 * Tiered strategy:
 * 1. Chrome Built-in AI (Gemini Nano) — zero download, pre-installed
 * 2. WebLLM with Phi-3.5-mini-instruct — broader capabilities, ~2.4 GB
 * 3. Heuristic fallback — embedding similarity + keyword matching, no model needed
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OfflineChatContext {
  unitName: string;
  unitDescription?: string;
  vocabulary: Array<{ phrase: string; definition: string }>;
  questions: Array<{ prompt: string; answer: string }>;
  studentMemory?: string;
  gradeAccuracy?: number;
}

export interface GradeResult {
  score: number;
  feedback: string;
  accurate: boolean;
  gradedOffline: true;
}

type EngineBackend = 'chrome-ai' | 'webllm' | 'heuristic' | 'none';

// ── Chrome Built-in AI types ──────────────────────────────────────────────────

interface ChromeAISession {
  prompt(input: string): Promise<string>;
  promptStreaming(input: string): AsyncIterable<string>;
  destroy(): void;
}

interface ChromeAI {
  canCreate(): Promise<string>;
  create(options?: { systemPrompt?: string }): Promise<ChromeAISession>;
}

declare global {
  interface Window {
    ai?: {
      languageModel?: ChromeAI;
    };
  }
}

// ── Engine ────────────────────────────────────────────────────────────────────

class OfflineChatEngineImpl {
  private backend: EngineBackend = 'none';
  private chromeSession: ChromeAISession | null = null;
  private webllmEngine: any = null; // WebLLM engine instance
  private _initialized = false;

  /**
   * Detect which backend is available.
   */
  async detectBackend(): Promise<EngineBackend> {
    // 1. Chrome Built-in AI
    if (typeof window !== 'undefined' && window.ai?.languageModel) {
      try {
        const status = await window.ai.languageModel.canCreate();
        if (status === 'readily' || status === 'after-download') {
          return 'chrome-ai';
        }
      } catch {
        // Chrome AI not available
      }
    }

    // 2. WebLLM — check if the module is importable and WebGPU is available
    if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
      try {
        // String concatenation prevents Vite from statically analyzing this optional dep
        const webllmPath = '@mlc-ai/' + 'web-llm';
        await import(webllmPath);
        return 'webllm';
      } catch {
        // WebLLM not installed or not importable
      }
    }

    // 3. Heuristic fallback always available
    return 'heuristic';
  }

  /**
   * Check if any on-device AI backend is available.
   */
  async isAvailable(): Promise<boolean> {
    const backend = await this.detectBackend();
    return backend !== 'none';
  }

  /**
   * Initialize the selected backend.
   */
  async initialize(
    onProgress?: (percent: number) => void,
  ): Promise<EngineBackend> {
    if (this._initialized) return this.backend;

    this.backend = await this.detectBackend();

    if (this.backend === 'chrome-ai') {
      // Chrome AI requires no download
      onProgress?.(100);
      this._initialized = true;
      return this.backend;
    }

    if (this.backend === 'webllm') {
      try {
        const { CreateMLCEngine } = await import(/* webpackIgnore: true */ '@mlc-ai/web-llm');
        this.webllmEngine = await CreateMLCEngine('Phi-3.5-mini-instruct-q4f16_1-MLC', {
          initProgressCallback: (report: { progress: number }) => {
            onProgress?.(Math.round(report.progress * 100));
          },
        });
        this._initialized = true;
        return this.backend;
      } catch (err) {
        console.warn('[OfflineChatEngine] WebLLM init failed, falling back to heuristic', err);
        this.backend = 'heuristic';
      }
    }

    // Heuristic requires no setup
    this.backend = 'heuristic';
    onProgress?.(100);
    this._initialized = true;
    return this.backend;
  }

  /**
   * Generate a streaming chat response.
   */
  async *chat(
    messages: ChatMessage[],
    context: OfflineChatContext,
  ): AsyncGenerator<string> {
    if (!this._initialized) await this.initialize();

    const systemPrompt = buildOfflineSystemPrompt(context);
    const allMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    if (this.backend === 'chrome-ai') {
      yield* this.chatChromeAI(allMessages, systemPrompt);
      return;
    }

    if (this.backend === 'webllm' && this.webllmEngine) {
      yield* this.chatWebLLM(allMessages);
      return;
    }

    // Heuristic fallback — no real generation, provide a canned helpful response
    yield this.heuristicResponse(messages, context);
  }

  private async *chatChromeAI(
    messages: ChatMessage[],
    systemPrompt: string,
  ): AsyncGenerator<string> {
    if (!window.ai?.languageModel) throw new Error('Chrome AI not available');

    // Create session with system prompt
    this.chromeSession?.destroy();
    this.chromeSession = await window.ai.languageModel.create({ systemPrompt });

    // Build a single prompt from the message history
    const prompt = messages
      .filter((m) => m.role !== 'system')
      .map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
      .join('\n');

    // Chrome Built-in AI promptStreaming yields cumulative text (not deltas),
    // so we track the previous output and yield only the new portion.
    const stream = this.chromeSession.promptStreaming(prompt);
    let previousText = '';
    for await (const chunk of stream) {
      const delta = chunk.slice(previousText.length);
      previousText = chunk;
      if (delta) yield delta;
    }
  }

  private async *chatWebLLM(messages: ChatMessage[]): AsyncGenerator<string> {
    if (!this.webllmEngine) throw new Error('WebLLM not initialized');

    const reply = await this.webllmEngine.chat.completions.create({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    });

    for await (const chunk of reply) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  private heuristicResponse(
    messages: ChatMessage[],
    context: OfflineChatContext,
  ): string {
    const lastMsg = messages[messages.length - 1]?.content ?? '';
    const lowerMsg = lastMsg.toLowerCase();

    // Check if the question matches any vocabulary
    const matchedWord = context.vocabulary.find(
      (w) =>
        lowerMsg.includes(w.phrase.toLowerCase()) ||
        lowerMsg.includes(w.definition.toLowerCase()),
    );

    if (matchedWord) {
      return `Great question! Let me help with that. **${matchedWord.phrase}** means: ${matchedWord.definition}. Can you try using it in a sentence?`;
    }

    // Check if it matches any question
    const matchedQ = context.questions.find((q) =>
      lowerMsg.includes(q.prompt.toLowerCase().slice(0, 20)),
    );
    if (matchedQ) {
      return `That's a good question to practice! Here's a hint: think about the key concepts. Would you like to try answering it?`;
    }

    return `I'm currently working offline with limited capabilities. I can help you review vocabulary and practice questions from "${context.unitName}". What would you like to work on?`;
  }

  /**
   * Grade a student answer using on-device AI or heuristic fallback.
   */
  async gradeAnswer(params: {
    studentAnswer: string;
    expectedAnswer: string;
    prompt: string;
    type: 'definition' | 'shortAnswer' | 'word';
  }): Promise<GradeResult> {
    if (!this._initialized) await this.initialize();

    if (this.backend === 'chrome-ai' || this.backend === 'webllm') {
      return this.gradeWithLLM(params);
    }

    return gradeAnswerHeuristic(params.expectedAnswer, params.studentAnswer);
  }

  private async gradeWithLLM(params: {
    studentAnswer: string;
    expectedAnswer: string;
    prompt: string;
  }): Promise<GradeResult> {
    const gradePrompt = `Grade this student answer. Respond ONLY with valid JSON, no other text.
Question: "${params.prompt}"
Expected answer: "${params.expectedAnswer}"
Student's answer: "${params.studentAnswer}"

JSON format: { "score": 0-100, "accurate": true/false, "feedback": "brief feedback" }`;

    try {
      let response = '';

      if (this.backend === 'chrome-ai' && window.ai?.languageModel) {
        const session = await window.ai.languageModel.create();
        response = await session.prompt(gradePrompt);
        session.destroy();
      } else if (this.backend === 'webllm' && this.webllmEngine) {
        const result = await this.webllmEngine.chat.completions.create({
          messages: [{ role: 'user', content: gradePrompt }],
        });
        response = result.choices?.[0]?.message?.content ?? '';
      }

      // Parse JSON from the response (handle markdown code blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: Number(parsed.score) || 0,
          feedback: String(parsed.feedback || ''),
          accurate: Boolean(parsed.accurate),
          gradedOffline: true,
        };
      }
    } catch {
      // LLM grading failed — fall back to heuristic
    }

    return gradeAnswerHeuristic(params.expectedAnswer, params.studentAnswer);
  }

  /**
   * Tear down resources.
   */
  destroy(): void {
    this.chromeSession?.destroy();
    this.chromeSession = null;
    this.webllmEngine = null;
    this._initialized = false;
    this.backend = 'none';
  }
}

// ── Heuristic grading (always available, no model needed) ─────────────────────

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^\w\s]/g, '').trim();
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
    'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or', 'nor',
    'not', 'so', 'very', 'just', 'than', 'too', 'also', 'that', 'this',
    'it', 'its', 'they', 'them', 'their',
  ]);

  return normalize(text)
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

/**
 * Simple heuristic grading based on keyword overlap.
 * Uses keyword matching + character-level overlap ratio.
 */
export function gradeAnswerHeuristic(
  expected: string,
  student: string,
): GradeResult {
  const normExpected = normalize(expected);
  const normStudent = normalize(student);

  // Empty answer
  if (!normStudent) {
    return {
      score: 0,
      accurate: false,
      feedback: 'Please provide an answer.',
      gradedOffline: true,
    };
  }

  // Exact match
  if (normExpected === normStudent) {
    return {
      score: 100,
      accurate: true,
      feedback: 'Perfect answer!',
      gradedOffline: true,
    };
  }

  const keywords = extractKeywords(expected);
  const studentLower = normStudent;
  const keywordHits = keywords.filter((k) => studentLower.includes(k));
  const keywordScore = keywords.length > 0 ? keywordHits.length / keywords.length : 0;

  // Simple character overlap ratio
  const expectedChars = new Set(normExpected.split(''));
  const studentChars = new Set(normStudent.split(''));
  const intersection = [...expectedChars].filter((c) => studentChars.has(c));
  const charOverlap = intersection.length / Math.max(expectedChars.size, 1);

  const score = Math.round((keywordScore * 0.6 + charOverlap * 0.4) * 100);
  const accurate = score >= 70;

  const missingKeywords = keywords.filter((k) => !studentLower.includes(k));

  return {
    score,
    accurate,
    feedback: accurate
      ? 'Good answer! Your response captures the key concepts.'
      : missingKeywords.length > 0
        ? `Try to include these key ideas: ${missingKeywords.slice(0, 3).join(', ')}`
        : 'Your answer could be more complete. Review the material and try again.',
    gradedOffline: true,
  };
}

// ── System prompt builder ─────────────────────────────────────────────────────

export function buildOfflineSystemPrompt(context: OfflineChatContext): string {
  const vocabSection =
    context.vocabulary.length > 0
      ? `\nVocabulary to help with: ${context.vocabulary
          .slice(0, 15)
          .map((w) => `${w.phrase}: ${w.definition}`)
          .join('; ')}`
      : '';

  const accuracySection =
    context.gradeAccuracy != null
      ? `\nStudent's current accuracy: ${context.gradeAccuracy}%.`
      : '';

  const memorySection =
    context.studentMemory
      ? `\nStudent notes: ${context.studentMemory.slice(0, 500)}`
      : '';

  return `You are a helpful tutor for "${context.unitName}".${
    context.unitDescription ? ` Topic: ${context.unitDescription}` : ''
  }${vocabSection}${accuracySection}${memorySection}

Guidelines:
- Be encouraging and Socratic — ask guiding questions rather than giving answers directly.
- Keep responses under 150 words.
- Reference the vocabulary and questions from this unit.
- If the student seems stuck, offer a hint rather than the full answer.`;
}

// ── Singleton export ──────────────────────────────────────────────────────────

export const offlineChatEngine = new OfflineChatEngineImpl();
