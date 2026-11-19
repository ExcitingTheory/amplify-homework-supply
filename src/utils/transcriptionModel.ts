/**
 * Speech-to-text model for every transcription the Lambdas run.
 *
 * gpt-transcribe replaces whisper-1, which OpenAI retires on Feb 26, 2027
 * (along with gpt-4o-transcribe and gpt-4o-mini-transcribe). It uses the
 * same /v1/audio/transcriptions endpoint and returns { text }, and costs
 * $0.0045 per minute against whisper-1's $0.006.
 * https://developers.openai.com/api/docs/models/gpt-transcribe
 */
export const TRANSCRIPTION_MODEL = "gpt-transcribe";
