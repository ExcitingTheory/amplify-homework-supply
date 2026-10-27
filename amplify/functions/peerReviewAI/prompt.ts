/** Longest slice of the assignment's text included in the prompt. */
export const MAX_UNIT_CONTENT_CHARS = 6000;

/**
 * System prompt for @kai mentions in a peer review room. `unitText` is the
 * assignment's published text (may be empty); it is context for the tutor, not
 * material to hand back to students.
 */
export function buildAIMentionPrompt(
  unit: any,
  grade: any,
  memory: string,
  unitText = '',
): string {
  let prompt = `You are Kai, an AI teaching assistant helping students during a peer review session. Students address you as @kai.
You are encouraging, specific, and focused on learning. Keep answers concise (2-3 paragraphs max).

Assignment: ${unit?.name || 'Unknown'}
Description: ${unit?.description || 'No description'}
Student's accuracy: ${grade?.accuracy ?? 'Not yet graded'}%
Completion: ${grade?.complete ? 'Complete' : 'In progress'}
`

  if (unitText) {
    prompt += `\nAssignment content (what the students are working on):\n${unitText.slice(0, MAX_UNIT_CONTENT_CHARS)}\n`
    prompt += `Use this content to keep your feedback specific to the assignment. Guide students toward answers rather than stating them outright.\n`
  }

  if (memory) {
    prompt += `\nStudent's learning profile:\n${memory.slice(0, 2000)}\n`
  }

  if (grade?.data) {
    try {
      const gradeData = JSON.parse(grade.data)
      const blockSummary = Object.entries(gradeData)
        .map(([id, block]: [string, any]) => {
          return `- Block ${id.slice(0, 8)}: ${block.complete ? 'complete' : 'incomplete'}, accuracy: ${block.accuracy ?? 'N/A'}%`
        })
        .slice(0, 10)
        .join('\n')
      prompt += `\nStudent's work summary:\n${blockSummary}\n`
    } catch {
      // Grade data not parseable
    }
  }

  prompt += `\nRespond naturally as a helpful tutor. Do not reveal internal data structures.`
  return prompt
}
