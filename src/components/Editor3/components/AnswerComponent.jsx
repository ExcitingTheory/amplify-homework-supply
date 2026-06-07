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
  LinearProgress,
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
import { useVerifyContext } from "../../../hooks/useVerifyContext";

const SketchPad = dynamic(async () => (await import("./SketchPad")).default, {
  ssr: false,
});

import AudioWaveformPlayer from "./AudioWaveformPlayer";
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

function LinearProgressWithLabel({ value }) {
  return (
    <>
      <Box display="flex" alignItems="center" margin={1}>
        <Box width="95%">
          <LinearProgress variant="determinate" value={value} />
        </Box>
        <Box width="fit-content" marginLeft={1}>
          <Typography
            variant="body2"
            color="textSecondary"
            style={{
              marginLeft: "1rem",
              width: "55%",
            }}
          >{`${Math.round(value)}%`}</Typography>
        </Box>
      </Box>
    </>
  );
}

export default function AnswerComponent({
  className,
  format,
  nodeKey,
  // setFileIDs,
  wordIDs,
  requestDefinition,
  customPrompt,
  allowedInput,
  promptMethod,
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
  const [progress, setProgress] = useState(0);
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

  const { dictionary, grade, saveGrade, workbook } =
    React.useContext(UnitContext);

  const { studentMemory, contentContext } = useVerifyContext();

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

    // Update local progress bar
    const progressValue =
      totalWords > 0 ? Math.floor((correctCount / totalWords) * 100) : 0;
    setProgress(progressValue);

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

  const blockGradeData = grade?.data?.[nodeKey];
  const nailedIt = blockGradeData?.nailedIt === true;

  return (
    <WorkbookBlockEnhancements blockId={nodeKey} nailedIt={nailedIt}>
      <div className={className}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {thisPrompt}
          </Typography>
        </Box>

        <ToggleButtonGroup
          exclusive
          value={currentInputMethod}
          onChange={handleInputChange}
          aria-label={t("answerComponent.inputMethodSelector")}
        >
          <ToggleButton
            disabled={!allowedInputMethods.includes("text")}
            value="text"
            aria-label={t("answerComponent.inputMethods.text")}
          >
            {t("answerComponent.inputMethods.text")}
          </ToggleButton>
          <ToggleButton
            disabled={!allowedInputMethods.includes("audio")}
            value="audio"
            aria-label={t("answerComponent.inputMethods.audio")}
          >
            {t("answerComponent.inputMethods.audio")}
          </ToggleButton>
          <ToggleButton
            disabled={!allowedInputMethods.includes("writing")}
            value="writing"
            aria-label={t("answerComponent.inputMethods.writing")}
          >
            {t("answerComponent.inputMethods.writing")}
          </ToggleButton>
        </ToggleButtonGroup>

        {/**
         * Progress bar to show the user how many questions they have answered correctly
         */}
        <Box>
          <LinearProgressWithLabel value={progress} />
        </Box>
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
      </div>
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
    <ol>
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
                    bgcolor: isCorrect
                      ? "success.light"
                      : "error.light",
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
                    bgcolor: isCorrect
                      ? "success.light"
                      : "error.light",
                    opacity: 0.9,
                  }}
                >
                  <Typography variant="body2">
                    {feedback[key]?.reason || ""}
                  </Typography>
                </Box>
              )}

              <AudioAutoSubmitWrapper>
                {({ wrapOnRecordingComplete }) => (
                  <AudioWaveformPlayer
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
                    bgcolor: isCorrect
                      ? "success.light"
                      : "error.light",
                    opacity: 0.9,
                  }}
                >
                  <Typography variant="body2">
                    {feedback[key]?.reason || ""}
                  </Typography>
                </Box>
              )}

              <Suspense fallback={<Typography variant="body2">Loading...</Typography>}>
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
    </ol>
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
    <ol>
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
                    bgcolor: isCorrect
                      ? "success.light"
                      : "error.light",
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
                    bgcolor: isCorrect
                      ? "success.light"
                      : "error.light",
                    opacity: 0.9,
                  }}
                >
                  <Typography variant="body2">
                    {feedback[key]?.reason || ""}
                  </Typography>
                </Box>
              )}

              <AudioAutoSubmitWrapper>
                {({ wrapOnRecordingComplete }) => (
                  <AudioWaveformPlayer
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
                    bgcolor: isCorrect
                      ? "success.light"
                      : "error.light",
                    opacity: 0.9,
                  }}
                >
                  <Typography variant="body2">
                    {feedback[key]?.reason || ""}
                  </Typography>
                </Box>
              )}

              <Suspense fallback={<Typography variant="body2">Loading...</Typography>}>
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
    </ol>
  );
}
