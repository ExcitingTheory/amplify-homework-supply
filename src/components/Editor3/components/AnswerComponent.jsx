// check if the answer is correct by calling the chatgpt api with the prompt and answer and ask to confirm if the answer is correct.
// provide the answer to the question to the user
// record answer for this question in a ref.
// update the progress bar with the number of correct answers.
// silently record incorrect answers for review, but allow the user to continue and try to answer the question again.

import React, { Suspense } from "react";
import { useTranslations } from "next-intl";
import {
  gradeDefinition,
  transcribeAudio,
} from "../../../../app/actions/grading";

import { useEffect, useState, useRef } from "react";

import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";

import { createEmptyHistoryState } from "@lexical/react/LexicalHistoryPlugin";
import PlainTextAnswerInput from "./PlainTextAnswerInput";
import AudioAutoSubmitWrapper from "./AudioAutoSubmitWrapper";

import UnitContext from "../../../context/unitContext";

import dynamic from "next/dynamic";

import { WorkbookBlockEnhancements } from "./WorkbookBlockEnhancements";
import { ExerciseBlockCard } from "./ExerciseBlockCard";
import { ExerciseProgressMeters } from "./ExerciseProgressMeters";
import { useVerifyContext } from "../../../hooks/useVerifyContext";

const SketchPad = dynamic(async () => (await import("./SketchPad")).default, {
  ssr: false,
});

import AudioWaveformPlayer from "./AudioWaveformPlayer";
import { LEARNER_EXERCISE_WAVEFORM_PRESET } from "../../../utils/waveformDefaults";
import getCachedUrl from "../../../utils/getCachedUrl";

// Component to handle signed URL for word audio
function SignedAudioPlayer({ audioKey, identityId, width, height, title }) {
  const t = useTranslations("workbook");
  const [signedUrl, setSignedUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const signUrl = async () => {
      if (audioKey) {
        try {
          const url = await getCachedUrl(audioKey);
          setSignedUrl(url);
        } catch (error) {
          console.error("Error signing audio URL:", error);
        }
      }
      setLoading(false);
    };
    signUrl();
  }, [audioKey, identityId]);

  if (loading) {
    return (
      <Typography variant="body2" sx={{ opacity: 0.6 }}>
        Loading audio...
      </Typography>
    );
  }

  if (!signedUrl) {
    return (
      <Typography variant="body2" sx={{ opacity: 0.6, fontStyle: "italic" }}>
        {t("answerComponent.audioNotAvailable")}
      </Typography>
    );
  }

  return (
    <AudioWaveformPlayer
      audioUrl={signedUrl}
      width={width}
      height={height}
      title={title}
    />
  );
}

export function AnswerView({
  className,
  nodeKey,
  wordIDs,
  requestDefinition,
  customPrompt,
  allowedInput,
  promptMethod,
  dictionary,
  grade,
  saveGrade,
}) {
  const t = useTranslations("workbook");

  /**
   * Answer Schema
   *
   * ```json
   * {
   *    id: '1',
   *    answer: 'Paris',
   *    grade: 1,
   *    completed: true,
   *    reason: 'Paris is the capital of France.'
   *    model: 'gpt-3',
   * }
   * ```
   *
   * Flow:
   *   check if the answer is correct by calling the chatgpt api with the prompt and answer and ask to confirm if the answer is correct.
   *   provide the answer to the question to the user
   *   record answer for this question in a ref.
   *   update the progress bar with the number of correct answers.
   *   silently record incorrect answers for review, but allow the user to continue and try to answer the question again.
   */

  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const sharedHistoryState = useRef(createEmptyHistoryState());

  const [currentInputMethod, setCurrentInputMethod] = useState(
    allowedInput?.[0] || "text",
  );
  const [allowedInputMethods, setAllowedInputMethods] = useState(
    allowedInput?.length > 0 ? allowedInput : ["text", "audio", "writing"],
  );
  const [currentPromptMethod, setCurrentPromptMethod] = useState(
    promptMethod?.[0] || "text",
  );

  const handleInputChange = (event, newInputMethod) => {
    if (newInputMethod !== null) {
      setCurrentInputMethod(newInputMethod);
    }
  };

  React.useEffect(() => {
    if (allowedInput?.length > 0) {
      setAllowedInputMethods(allowedInput);
      setCurrentInputMethod(allowedInput[0]);
    }
  }, [JSON.stringify(allowedInput)]);

  React.useEffect(() => {
    if (promptMethod?.length > 0) {
      setCurrentPromptMethod(promptMethod[0]);
    }
  }, [JSON.stringify(promptMethod)]);

  // Reset local state when grade changes (e.g., new grade after unit completion)
  const gradeIdRef = useRef(grade?.id);
  React.useEffect(() => {
    if (grade?.id && grade.id !== gradeIdRef.current) {
      gradeIdRef.current = grade.id;
      // Only reset if the new grade has no data for this exercise
      if (!grade?.data?.[nodeKey]) {
        setAnswers({});
        setFeedback({});
        setProgress(0);
      }
    }
  }, [grade?.id, grade?.data, nodeKey]);

  let thisPrompt = customPrompt
    ? customPrompt
    : "Provide words that best match the following definition(s):";

  thisPrompt = requestDefinition
    ? "Please define the following word(s):"
    : thisPrompt;

  // Track completion and save grade
  React.useEffect(() => {
    if (!wordIDs || !feedback || !saveGrade || !nodeKey) return;

    // Check if all words have been answered correctly
    const answeredWords = Object.keys(feedback);
    const correctAnswers = answeredWords.filter(
      (wordId) => feedback[wordId]?.answer === true,
    );

    const totalWords = wordIDs.length;
    const answeredCount = answeredWords.length;
    const correctCount = correctAnswers.length;

    // Consider complete if all words have been attempted
    const isComplete = answeredCount >= totalWords;
    const accuracy =
      totalWords > 0 ? Math.floor((correctCount / totalWords) * 100) : 0;

    // Save grade data on every answer (partial and complete)
    if (answeredCount > 0) {
      const currentGradeData = grade?.data || {};
      const updatedGradeData = {
        ...currentGradeData,
        [nodeKey]: {
          complete: isComplete,
          accuracy,
          totalWords,
          correctCount,
          answeredCount,
          feedback: feedback,
        },
      };

      saveGrade(updatedGradeData);
    }
  }, [feedback, wordIDs, saveGrade, nodeKey, grade]);

  const totalWords = wordIDs?.length || 0;
  const answeredCount = Object.keys(feedback).length;
  const correctCount = Object.values(feedback).filter(
    (result) => result?.answer === true,
  ).length;
  const percentComplete =
    totalWords > 0 ? (answeredCount / totalWords) * 100 : 0;
  const accuracy = answeredCount > 0 ? (correctCount / answeredCount) * 100 : 0;
  const graded = totalWords > 0 && answeredCount >= totalWords;

  return (
    <div className={className}>
      <ExerciseBlockCard
        blockType="answer"
        accuracy={accuracy}
        graded={graded}
        sx={{ my: 2 }}
      >
        <ExerciseProgressMeters
          percentComplete={percentComplete}
          accuracy={accuracy}
          hasAttempts={answeredCount > 0}
          progressDescription="Percentage of prompts answered."
          accuracyDescription="Percentage of submitted answers marked correct."
        />

        <Typography
          variant="subtitle1"
          component="p"
          sx={{ mt: 1, mb: 1.5, fontWeight: 700, color: "text.primary" }}
        >
          {thisPrompt}
        </Typography>

        {!requestDefinition &&
          ByDefinitionWordList(
            wordIDs,
            dictionary,
            feedback,
            setAnswers,
            answers,
            setFeedback,
            currentInputMethod,
            currentPromptMethod,
            grade,
            nodeKey,
            t,
            sharedHistoryState.current,
          )}
        {requestDefinition &&
          ByWordList(
            wordIDs,
            feedback,
            dictionary,
            answers,
            setAnswers,
            setFeedback,
            currentInputMethod,
            currentPromptMethod,
            grade,
            nodeKey,
            t,
            saveGrade,
            sharedHistoryState.current,
          )}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mt: 1.5,
            pt: 1.5,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <ToggleButtonGroup
            exclusive
            value={currentInputMethod}
            onChange={handleInputChange}
            aria-label={t("answerComponent.inputMethodSelector")}
            size="small"
            sx={{
              maxWidth: 360,
              "& .MuiToggleButton-root": {
                minHeight: 36,
                px: 1.5,
                textTransform: "none",
                borderColor: "divider",
                "&.Mui-selected": {
                  fontWeight: 700,
                  color: "secondary.main",
                  bgcolor: "action.selected",
                },
              },
            }}
          >
            <ToggleButton
              disabled={!allowedInputMethods.includes("text")}
              value="text"
              aria-label={t("answerComponent.inputMethods.text")}
            >
              Type answer
            </ToggleButton>
            <ToggleButton
              disabled={!allowedInputMethods.includes("audio")}
              value="audio"
              aria-label={t("answerComponent.inputMethods.audio")}
            >
              Speak answer
            </ToggleButton>
            <ToggleButton
              disabled={!allowedInputMethods.includes("writing")}
              value="writing"
              aria-label={t("answerComponent.inputMethods.writing")}
            >
              Draw answer
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </ExerciseBlockCard>
    </div>
  );
}

export default function AnswerComponent({
  className,
  format,
  nodeKey,
  wordIDs,
  requestDefinition,
  customPrompt,
  allowedInput,
  promptMethod,
}) {
  const { dictionary, grade, saveGrade } = React.useContext(UnitContext);
  // Keep verify-context hook for parity (memory/personalization side effects).
  useVerifyContext();
  const nailedIt = grade?.data?.[nodeKey]?.nailedIt === true;
  return (
    <WorkbookBlockEnhancements blockId={nodeKey} nailedIt={nailedIt}>
      <AnswerView
        className={className}
        nodeKey={nodeKey}
        wordIDs={wordIDs}
        requestDefinition={requestDefinition}
        customPrompt={customPrompt}
        allowedInput={allowedInput}
        promptMethod={promptMethod}
        dictionary={dictionary}
        grade={grade}
        saveGrade={saveGrade}
      />
    </WorkbookBlockEnhancements>
  );
}

function ByWordList(
  wordIDs,
  feedback,
  dictionary,
  answers,
  setAnswers,
  setFeedback,
  currentInputMethod,
  currentPromptMethod,
  grade,
  nodeKey,
  t,
  saveGrade,
  historyState,
) {
  // Add defensive check for dictionary
  if (!dictionary) {
    return (
      <Typography variant="body2" color="error">
        {t("answerComponent.noDictionaryAvailable")}
      </Typography>
    );
  }

  return (
    <Box
      component="ol"
      sx={{
        m: 0,
        pl: 3,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        "& > li": {
          pl: 1,
          pr: 1,
          py: 1,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: "background.paper",
        },
      }}
    >
      {currentInputMethod === "text" &&
        wordIDs.map((wordId, key) => {
          const isCorrect = feedback[key]?.answer;

          // Skip if word not in dictionary
          if (!dictionary[wordId]) {
            console.warn(`Word ${wordId} not found in dictionary`);
            return null;
          }

          return (
            <li key={`${wordId}-${key}`}>
              <Typography
                variant="subtitle1"
                component="h3"
                sx={{ fontWeight: 700, mb: 1 }}
              >
                {dictionary[wordId]?.phrase}
              </Typography>
              {/* Prompt display */}
              {currentPromptMethod === "text" && (
                <Typography
                  variant="body2"
                  component="div"
                  sx={{ flexGrow: 1 }}
                >
                  {dictionary[wordId]?.phrase}
                </Typography>
              )}
              {currentPromptMethod === "audio" &&
                (dictionary[wordId]?.audio ? (
                  <SignedAudioPlayer
                    audioKey={dictionary[wordId].audio[0]}
                    identityId={dictionary[wordId].identityId}
                    width={400}
                    height={60}
                    title={dictionary[wordId].phrase}
                  />
                ) : (
                  <Typography
                    variant="body2"
                    component="div"
                    sx={{
                      flexGrow: 1,
                      fontStyle: "italic",
                      color: "text.disabled",
                    }}
                  >
                    {dictionary[wordId]?.phrase}{" "}
                    {t("answerComponent.audioNotAvailableParens")}
                  </Typography>
                ))}

              {/* Feedback display */}
              {isCorrect !== undefined && (
                <Box
                  sx={{
                    border: 1,
                    borderColor: isCorrect ? "success.main" : "error.main",
                    borderRadius: 1,
                    p: 1,
                    my: 1,
                    bgcolor: isCorrect ? "success.light" : "error.light",
                    opacity: 0.9,
                  }}
                >
                  <Typography variant="body2">
                    {feedback[key]?.reason || ""}
                  </Typography>
                </Box>
              )}

              {/* Text input */}
              <PlainTextAnswerInput
                value={answers[key] || ""}
                onChange={(text) => {
                  setAnswers({
                    ...answers,
                    [key]: text,
                  });
                }}
                onAutoSubmit={async (text) => {
                  const data = await gradeDefinition({
                    word: dictionary[wordId]?.phrase,
                    definition: text,
                    expectedDefinition: dictionary[wordId]?.definition,
                  });

                  setFeedback({
                    ...feedback,
                    [key]: data,
                  });
                }}
                historyState={historyState}
                placeholder={t("answerComponent.placeholder")}
                ariaLabel={t("customAnswerComponent.yourAnswer", {
                  ns: "editor",
                })}
                testId="answer-input"
                wordId={wordId}
                disabled={isCorrect !== undefined}
              />
            </li>
          );
        })}

      {currentInputMethod === "audio" &&
        wordIDs.map((wordId, key) => {
          const isCorrect = feedback[key]?.answer;

          // Skip if word not in dictionary
          if (!dictionary[wordId]) {
            console.warn(`Word ${wordId} not found in dictionary`);
            return null;
          }

          return (
            <li key={`${wordId}-${key}`}>
              {/* Prompt display */}
              {currentPromptMethod === "text" && (
                <Typography
                  variant="body2"
                  component="div"
                  sx={{ flexGrow: 1 }}
                >
                  {dictionary[wordId]?.phrase}
                </Typography>
              )}
              {currentPromptMethod === "audio" &&
                (dictionary[wordId]?.audio ? (
                  <SignedAudioPlayer
                    audioKey={dictionary[wordId].audio[0]}
                    identityId={dictionary[wordId].identityId}
                    width={400}
                    height={60}
                    title={dictionary[wordId].phrase}
                  />
                ) : (
                  <Typography
                    variant="body2"
                    component="div"
                    sx={{
                      flexGrow: 1,
                      fontStyle: "italic",
                      color: "text.disabled",
                    }}
                  >
                    {t("answerComponent.audioNotAvailable", {
                      text: dictionary[wordId]?.phrase,
                    })}
                  </Typography>
                ))}

              {/* Feedback display */}
              {isCorrect !== undefined && (
                <Box
                  sx={{
                    border: 1,
                    borderColor: isCorrect ? "success.main" : "error.main",
                    borderRadius: 1,
                    p: 1,
                    my: 1,
                    bgcolor: isCorrect ? "success.light" : "error.light",
                    opacity: 0.9,
                  }}
                >
                  <Typography variant="body2">
                    {feedback[key]?.reason || ""}
                  </Typography>
                </Box>
              )}

              <Box
                sx={{
                  width: "100%",
                  maxWidth: 560,
                  p: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  bgcolor: "background.paper",
                  overflow: "hidden",
                }}
              >
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Record your answer
                </Typography>
                <AudioAutoSubmitWrapper>
                  {({ wrapOnRecordingComplete }) => (
                    <AudioWaveformPlayer
                      width={LEARNER_EXERCISE_WAVEFORM_PRESET.width}
                      height={LEARNER_EXERCISE_WAVEFORM_PRESET.height}
                      compact
                      enableRecording={true}
                      gradeId={grade?.id}
                      nodeKey={`${nodeKey}-${wordId}`}
                      title={dictionary[wordId]?.phrase}
                      onRecordingComplete={wrapOnRecordingComplete(
                        async (audioFile, uploadResult) => {
                          // Verify the recorded audio against expected word
                          try {
                            const audioUrl =
                              audioFile?.path || uploadResult?.path;
                            if (audioUrl) {
                              const feedbackData = await transcribeAudio({
                                audioUrl,
                                expectedAnswer: dictionary[wordId]?.phrase,
                              });
                              if (feedbackData) {
                                setFeedback((prev) => ({
                                  ...prev,
                                  [key]: feedbackData,
                                }));
                                // Broadcast to collaborators via Yjs
                                workbook?.setFeedback?.(nodeKey, {
                                  text: feedbackData?.reason || "",
                                  timestamp: Date.now(),
                                });
                              }
                            }
                          } catch (err) {
                            console.error(
                              "[AnswerComponent] Audio verification error:",
                              err,
                            );
                          }
                        },
                      )}
                    />
                  )}
                </AudioAutoSubmitWrapper>
              </Box>
            </li>
          );
        })}

      {/* sketchPad for drawing */}
      {currentInputMethod === "writing" &&
        wordIDs.map((wordId, key) => {
          const isCorrect = feedback[key]?.answer;

          // Skip if word not in dictionary
          if (!dictionary[wordId]) {
            console.warn(`Word ${wordId} not found in dictionary`);
            return null;
          }

          return (
            <li key={`${wordId}-${key}`}>
              {/* Prompt display */}
              {currentPromptMethod === "text" && (
                <Typography
                  variant="body2"
                  component="div"
                  sx={{ flexGrow: 1 }}
                >
                  {dictionary[wordId]?.phrase}
                </Typography>
              )}

              {currentPromptMethod === "audio" &&
                (dictionary[wordId]?.audio ? (
                  <SignedAudioPlayer
                    audioKey={dictionary[wordId].audio[0]}
                    identityId={dictionary[wordId].identityId}
                    width={400}
                    height={60}
                    title={dictionary[wordId].phrase}
                  />
                ) : (
                  <Typography
                    variant="body2"
                    component="div"
                    sx={{
                      flexGrow: 1,
                      fontStyle: "italic",
                      color: "text.disabled",
                    }}
                  >
                    {t("answerComponent.audioNotAvailable", {
                      text: dictionary[wordId]?.phrase,
                    })}
                  </Typography>
                ))}

              {/* Feedback display */}
              {isCorrect !== undefined && (
                <Box
                  sx={{
                    border: 1,
                    borderColor: isCorrect ? "success.main" : "error.main",
                    borderRadius: 1,
                    p: 1,
                    my: 1,
                    bgcolor: isCorrect ? "success.light" : "error.light",
                    opacity: 0.9,
                  }}
                >
                  <Typography variant="body2">
                    {feedback[key]?.reason || ""}
                  </Typography>
                </Box>
              )}

              <Suspense
                fallback={<Typography variant="body2">Loading...</Typography>}
              >
                <SketchPad
                  expect={dictionary[wordId]?.definition}
                  excalidrawData={{}}
                  setFeedback={(data) => {
                    setFeedback({
                      ...feedback,
                      [key]: data,
                    });
                    // Broadcast to collaborators via Yjs
                    workbook?.setFeedback?.(nodeKey, {
                      text: data?.reason || "",
                      timestamp: Date.now(),
                    });
                  }}
                  feedback={feedback}
                  questionID={key}
                />
              </Suspense>
            </li>
          );
        })}
    </Box>
  );
}

function ByDefinitionWordList(
  wordIDs,
  dictionary,
  feedback,
  setAnswers,
  answers,
  setFeedback,
  currentInputMethod,
  currentPromptMethod,
  grade,
  nodeKey,
  t,
  historyState,
) {
  // Add defensive check for dictionary
  if (!dictionary) {
    return (
      <Typography variant="body2" color="error">
        {t("answerComponent.noDictionaryAvailable")}
      </Typography>
    );
  }

  return (
    <Box
      component="ol"
      sx={{
        m: 0,
        pl: 3,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        "& > li": {
          pl: 1,
          pr: 1,
          py: 1,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: "background.paper",
        },
      }}
    >
      {currentInputMethod === "text" &&
        wordIDs.map((wordId, key) => {
          const isCorrect = feedback[key]?.answer;

          // Skip if word not in dictionary
          if (!dictionary[wordId]) {
            console.warn(`Word ${wordId} not found in dictionary`);
            return null;
          }

          return (
            <li key={`${wordId}-${key}`}>
              <Typography
                variant="subtitle1"
                component="h3"
                sx={{ fontWeight: 700, mb: 1 }}
              >
                {dictionary[wordId]?.phrase}
              </Typography>
              {/* Prompt display */}
              {currentPromptMethod === "text" && (
                <Typography
                  variant="body2"
                  component="div"
                  sx={{ flexGrow: 1 }}
                >
                  {dictionary[wordId]?.definition}
                </Typography>
              )}

              {currentPromptMethod === "audio" &&
                (dictionary[wordId]?.definitionAudio ? (
                  <SignedAudioPlayer
                    audioKey={dictionary[wordId].definitionAudio[0]}
                    identityId={dictionary[wordId].identityId}
                    width={400}
                    height={60}
                    title={dictionary[wordId].definition}
                  />
                ) : (
                  <Typography
                    variant="body2"
                    component="div"
                    sx={{
                      flexGrow: 1,
                      fontStyle: "italic",
                      color: "text.disabled",
                    }}
                  >
                    {t("answerComponent.audioNotAvailable", {
                      text: dictionary[wordId]?.definition,
                    })}
                  </Typography>
                ))}

              {/* Feedback display */}
              {isCorrect !== undefined && (
                <Box
                  sx={{
                    border: 1,
                    borderColor: isCorrect ? "success.main" : "error.main",
                    borderRadius: 1,
                    p: 1,
                    my: 1,
                    bgcolor: isCorrect ? "success.light" : "error.light",
                    opacity: 0.9,
                  }}
                >
                  <Typography variant="body2">
                    {feedback[key]?.reason || ""}
                  </Typography>
                </Box>
              )}

              {/* Text input */}
              <PlainTextAnswerInput
                value={answers[key] || ""}
                onChange={(text) => {
                  setAnswers({
                    ...answers,
                    [key]: text,
                  });
                }}
                onAutoSubmit={async (text) => {
                  const data = await gradeDefinition({
                    word: text,
                    definition: dictionary[wordId]?.definition,
                    expectedDefinition: dictionary[wordId]?.phrase,
                  });

                  setFeedback({
                    ...feedback,
                    [key]: data,
                  });
                }}
                historyState={historyState}
                placeholder={t("answerComponent.placeholder")}
                ariaLabel={t("customAnswerComponent.yourAnswer", {
                  ns: "editor",
                })}
                testId="answer-input"
                wordId={wordId}
                disabled={isCorrect !== undefined}
              />
            </li>
          );
        })}

      {currentInputMethod === "audio" &&
        wordIDs.map((wordId, key) => {
          const isCorrect = feedback[key]?.answer;

          // Skip if word not in dictionary
          if (!dictionary[wordId]) {
            console.warn(`Word ${wordId} not found in dictionary`);
            return null;
          }

          return (
            <li key={`${wordId}-${key}`}>
              {/* Display prompt based on currentPromptMethod */}
              {currentPromptMethod === "text" && (
                <Typography
                  variant="body2"
                  component="div"
                  sx={{ flexGrow: 1 }}
                >
                  {dictionary[wordId]?.definition}
                </Typography>
              )}

              {currentPromptMethod === "audio" &&
                (dictionary[wordId]?.definitionAudio ? (
                  <SignedAudioPlayer
                    audioKey={dictionary[wordId].definitionAudio[0]}
                    identityId={dictionary[wordId].identityId}
                    width={400}
                    height={60}
                    title={dictionary[wordId].definition}
                  />
                ) : (
                  <Typography
                    variant="body2"
                    component="div"
                    sx={{
                      flexGrow: 1,
                      fontStyle: "italic",
                      color: "text.disabled",
                    }}
                  >
                    {t("answerComponent.audioNotAvailable", {
                      text: dictionary[wordId]?.definition,
                    })}
                  </Typography>
                ))}

              {/* Feedback display */}
              {isCorrect !== undefined && (
                <Box
                  sx={{
                    border: 1,
                    borderColor: isCorrect ? "success.main" : "error.main",
                    borderRadius: 1,
                    p: 1,
                    my: 1,
                    bgcolor: isCorrect ? "success.light" : "error.light",
                    opacity: 0.9,
                  }}
                >
                  <Typography variant="body2">
                    {feedback[key]?.reason || ""}
                  </Typography>
                </Box>
              )}

              <Box
                sx={{
                  width: "100%",
                  maxWidth: 560,
                  p: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  bgcolor: "background.paper",
                  overflow: "hidden",
                }}
              >
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Record your answer
                </Typography>
                <AudioAutoSubmitWrapper>
                  {({ wrapOnRecordingComplete }) => (
                    <AudioWaveformPlayer
                      width={LEARNER_EXERCISE_WAVEFORM_PRESET.width}
                      height={LEARNER_EXERCISE_WAVEFORM_PRESET.height}
                      compact
                      enableRecording={true}
                      gradeId={grade?.id}
                      nodeKey={`${nodeKey}-${wordId}`}
                      title={dictionary[wordId]?.definition}
                      onRecordingComplete={wrapOnRecordingComplete(
                        async (audioFile, uploadResult) => {
                          // Verify the recorded audio against expected word
                          try {
                            const audioUrl =
                              audioFile?.path || uploadResult?.path;
                            if (audioUrl) {
                              const feedbackData = await transcribeAudio({
                                audioUrl,
                                expectedAnswer: dictionary[wordId]?.phrase,
                              });
                              if (feedbackData) {
                                setFeedback((prev) => ({
                                  ...prev,
                                  [key]: feedbackData,
                                }));
                              }
                            }
                          } catch (err) {
                            console.error(
                              "[AnswerComponent] Audio verification error:",
                              err,
                            );
                          }
                        },
                      )}
                    />
                  )}
                </AudioAutoSubmitWrapper>
              </Box>
            </li>
          );
        })}

      {currentInputMethod === "writing" &&
        wordIDs.map((wordId, key) => {
          const isCorrect = feedback[key]?.answer;

          // Skip if word not in dictionary
          if (!dictionary[wordId]) {
            console.warn(`Word ${wordId} not found in dictionary`);
            return null;
          }

          return (
            <li key={`${wordId}-${key}`}>
              {/* Prompt display */}
              {currentPromptMethod === "text" && (
                <Typography
                  variant="body2"
                  component="div"
                  sx={{ flexGrow: 1 }}
                >
                  {dictionary[wordId]?.definition}
                </Typography>
              )}

              {currentPromptMethod === "audio" &&
                (dictionary[wordId]?.definitionAudio ? (
                  <SignedAudioPlayer
                    audioKey={dictionary[wordId].definitionAudio[0]}
                    identityId={dictionary[wordId].identityId}
                    width={400}
                    height={60}
                    title={dictionary[wordId].definition}
                  />
                ) : (
                  <Typography
                    variant="body2"
                    component="div"
                    sx={{
                      flexGrow: 1,
                      fontStyle: "italic",
                      color: "text.disabled",
                    }}
                  >
                    {t("answerComponent.audioNotAvailable", {
                      text: dictionary[wordId]?.definition,
                    })}
                  </Typography>
                ))}

              {/* Feedback display */}
              {isCorrect !== undefined && (
                <Box
                  sx={{
                    border: 1,
                    borderColor: isCorrect ? "success.main" : "error.main",
                    borderRadius: 1,
                    p: 1,
                    my: 1,
                    bgcolor: isCorrect ? "success.light" : "error.light",
                    opacity: 0.9,
                  }}
                >
                  <Typography variant="body2">
                    {feedback[key]?.reason || ""}
                  </Typography>
                </Box>
              )}

              <Suspense
                fallback={<Typography variant="body2">Loading...</Typography>}
              >
                <SketchPad
                  expect={dictionary[wordId]?.definition}
                  excalidrawData={{}}
                  requestDefinition={true}
                  setFeedback={(data) => {
                    setFeedback({
                      ...feedback,
                      [key]: data,
                    });
                  }}
                  feedback={feedback}
                  questionID={key}
                />
              </Suspense>
            </li>
          );
        })}
    </Box>
  );
}
