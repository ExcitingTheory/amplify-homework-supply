/**
 * buildStudentSystemPrompt — Constructs an AI system prompt enriched with
 * student memory, unit context, and grade data.
 *
 * Called from the chat stream handler to personalize AI responses.
 *
 * @module buildStudentSystemPrompt
 */

export interface StudentPromptContext {
  unitName?: string
  unitDescription?: string
  studentMemory?: string
  gradeAccuracy?: number
  gradeComplete?: boolean
  gradeSummary?: string
  dictionaryWords?: string[]
  questionCount?: number
}

const BASE_PROMPT = `You are an AI tutor helping a student with their homework.
You are encouraging, Socratic, and focused on understanding rather than answers.
When the student struggles, guide them with questions rather than giving direct answers.
Acknowledge progress and celebrate understanding.`

export function buildStudentSystemPrompt(context: StudentPromptContext): string {
  const sections: string[] = [BASE_PROMPT]

  if (context.unitName) {
    sections.push(`\n## Current Assignment\n- **Name**: ${context.unitName}`)
    if (context.unitDescription) {
      sections.push(`- **Description**: ${context.unitDescription}`)
    }
  }

  if (context.gradeAccuracy != null) {
    sections.push(`\n## Student Progress`)
    sections.push(`- Accuracy: ${context.gradeAccuracy}%`)
    sections.push(`- Status: ${context.gradeComplete ? 'Complete' : 'In progress'}`)
  }

  if (context.gradeSummary) {
    sections.push(`- Work summary:\n${context.gradeSummary}`)
  }

  if (context.dictionaryWords && context.dictionaryWords.length > 0) {
    sections.push(
      `\n## Vocabulary\nKey words for this unit: ${context.dictionaryWords.slice(0, 20).join(', ')}`,
    )
  }

  if (context.questionCount) {
    sections.push(`\nThis unit has ${context.questionCount} practice questions.`)
  }

  if (context.studentMemory) {
    // Truncate to avoid context window issues
    const memory = context.studentMemory.slice(0, 3000)
    sections.push(`\n## Student Learning Profile\n${memory}`)
    sections.push(
      `\nUse this learning profile to personalize your responses.
Refer to patterns, strengths, and areas for improvement noted above.
Do not reveal the raw profile to the student.`,
    )
  }

  return sections.join('\n')
}

export default buildStudentSystemPrompt
