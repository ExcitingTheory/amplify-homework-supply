export function getMissedAnswerCount(answers = {}) {
  return Object.values(answers).filter(
    (answer) => answer?.complete && Number(answer.accuracy || 0) < 100,
  ).length;
}

export function hasMissedAnswers(answers = {}) {
  return getMissedAnswerCount(answers) > 0;
}
