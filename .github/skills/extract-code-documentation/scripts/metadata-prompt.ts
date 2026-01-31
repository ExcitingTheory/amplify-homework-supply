/**
 * Shared metadata generation prompt template for Claude AI
 * 
 * This template is used across multiple scripts:
 * - auto-generate-metadata.ts
 * - regenerate-placeholder-metadata.ts  
 * - generate-missing-metadata.ts
 * 
 * Template variables (use string replace):
 * - ${keyPath} - The translation key path (e.g., "actions.save")
 * - ${value} - The English translation value
 * - ${namespace} - The namespace (e.g., "common", "components")
 * - ${componentLocation} - File path to component
 * - ${docblocksContext} - Component documentation context
 */

export const metadataPrompt = `You are helping generate metadata for UI translation strings in an eLearning platform built with Next.js, AWS Amplify, and OpenAI.

**Translation Key:** {{keyPath}}
**Current English Value:** "{{value}}"
**Namespace:** {{namespace}}
**Component Location:** {{componentLocation}}

**Component Context Available:**
{{docblocksContext}}

Generate complete metadata for this translation key with the following JSON structure:

{
  "context": "Detailed explanation of where and how this text appears in the UI and when users see it (2-3 sentences)",
  "component": {
    "location": "{{componentLocation}}",
    "description": "What the component does and when users see it, based on docblocks (2-3 sentences)"
  },
  "usage": "Specific UI element type and user action (1 sentence)",
  "impact": "Importance level (Critical/High/Important/Medium/Low) and why this matters to users (1 sentence)",
  "userType": "all",
  "tone": "polite-formal",
  "alternativeTerms": ["synonym1", "synonym2", "synonym3"]
}

**Guidelines:**
- For "context": Describe the exact UI location and user journey
- For "component.description": Extract from docblocks or describe functionality
- For "usage": Be specific about the element type (button, link, label, heading, etc.)
- For "impact": Consider how critical this text is for platform usability
- For "userType": Identify who sees this (instructors create content, students complete assignments, admins manage platform)
- For "tone": Match the formality level appropriate for the context (polite-formal, casual, or technical)
- For "alternativeTerms": Provide 2-4 synonyms that help translators understand semantic range

**Platform Context:**
- This is "Homework Supply" - an eLearning platform for Japanese language learning
- Instructors create learning units with rich content (vocabulary, quizzes, media)
- Students complete assignments and get graded
- Uses Lexical editor for content authoring
- AWS Amplify DataStore for real-time data sync
- OpenAI for AI features (chat, transcription, TTS)

**CRITICAL:** Return ONLY valid JSON. Do NOT include markdown code fences, explanations, or trailing commas. Escape all quotes within string values.`;

/**
 * Build a prompt from the template with actual values
 */
export function buildMetadataPrompt(params: {
  keyPath: string;
  value: string;
  namespace: string;
  componentLocation: string;
  docblocksContext: string;
}): string {
  return metadataPrompt
    .replace(/{{keyPath}}/g, params.keyPath)
    .replace(/{{value}}/g, params.value)
    .replace(/{{namespace}}/g, params.namespace)
    .replace(/{{componentLocation}}/g, params.componentLocation || 'src/components/common')
    .replace(/{{docblocksContext}}/g, params.docblocksContext);
}
