export function getCustomAnswerDirectionPair(
  question,
  direction = "question-to-answer",
) {
  return direction === "answer-to-question"
    ? { prompt: question.answer, expected: question.prompt }
    : { prompt: question.prompt, expected: question.answer };
}
