export interface SlideGrade {
  blocks: Record<string, unknown>;
  accuracy: number;
  complete: boolean;
}

export interface CueGrade {
  transcript?: string;
  score?: number;
  audioPath?: string;
  attempts?: number;
  slide?: SlideGrade;
}

export interface GradedBlock {
  complete: boolean;
  accuracy: number;
  cues: Record<string, CueGrade>;
}

export interface GradableResponse {
  id: string;
  gradedSlide: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Summarises graded workbook blocks keyed by their nested editor node key. */
export function summarizeSlideBlocks(
  blocks: Record<string, unknown>,
): Pick<SlideGrade, "accuracy" | "complete"> {
  const entries = Object.values(blocks).filter(isRecord);
  if (entries.length === 0) return { accuracy: 0, complete: false };
  const accuracies = entries.map((entry) =>
    typeof entry.accuracy === "number" ? entry.accuracy : 0,
  );
  return {
    accuracy: Math.round(
      accuracies.reduce((sum, accuracy) => sum + accuracy, 0) /
        accuracies.length,
    ),
    complete: entries.every((entry) => entry.complete === true),
  };
}

export function isCueComplete(
  cue: CueGrade | undefined,
  gradedSlide: boolean,
): boolean {
  if (!cue || typeof cue.score !== "number") return false;
  return !gradedSlide || cue.slide?.complete === true;
}

/** Spoken score, averaged with the slide score when the cue has a graded slide. */
export function cueAccuracy(
  cue: CueGrade | undefined,
  gradedSlide: boolean,
): number {
  if (!cue || typeof cue.score !== "number") return 0;
  if (!gradedSlide) return cue.score;
  return Math.round((cue.score + (cue.slide?.accuracy ?? 0)) / 2);
}

export function summarizeBlockGrade(
  responses: GradableResponse[],
  cues: Record<string, CueGrade>,
): GradedBlock {
  const total = Math.max(1, responses.length);
  return {
    complete:
      responses.length > 0 &&
      responses.every((response) =>
        isCueComplete(cues[response.id], response.gradedSlide),
      ),
    accuracy: Math.round(
      responses.reduce(
        (sum, response) =>
          sum + cueAccuracy(cues[response.id], response.gradedSlide),
        0,
      ) / total,
    ),
    cues,
  };
}
