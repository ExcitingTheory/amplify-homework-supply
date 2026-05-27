import React, { lazy, Suspense } from "react";
import { useTranslations } from "next-intl";
import { getAmplifyClient } from "../../../../utils/amplifyClient";
import { gradeShortAnswer } from "../../../../../app/actions/grading";

import { useEffect, useState, useRef } from "react";

import {
  Box,
  LinearProgress,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

import { createEmptyHistoryState } from "@lexical/react/LexicalHistoryPlugin";
import PlainTextAnswerInput from "../../components/PlainTextAnswerInput";
import AudioAutoSubmitWrapper from "../../components/AudioAutoSubmitWrapper";
import dynamic from "next/dynamic";

const SketchPad = dynamic(
  async () => (await import("../../components/SketchPad")).default,
  {
    ssr: false,
  },
);
import AudioWaveformPlayer from "../../components/AudioWaveformPlayer";

import UnitContext from "../../../../context/unitContext";
import DictionaryContext from "../../../../context/dictionaryContext";
import { WorkbookBlockEnhancements } from "../../components/WorkbookBlockEnhancements";
import { useVerifyContext } from "../../../../hooks/useVerifyContext";

function LinearProgressWithLabel({ value }) {
  return (
    <>
      <Box display="flex" alignItems="center" margin={1}>
        <Box width="95%">
          <LinearProgress variant="determinate" value={value} />
        </Box>
        <Box width="fit-content" marginLeft={1}>
          <Typography variant="body2" color="textSecondary">{`${Math.round(
            value,
          )}%`}</Typography>
        </Box>
      </Box>
    </>
  );
}

export default function CustomAnswerComponent({
  className,
  nodeKey,
  // questions,
  ids: questionIDs,
  requestDefinition = false,
  customPrompt,
  allowedInput = [],
  promptMethod = [],
}) {
  const t = useTranslations("workbook");
  const tEditor = useTranslations("editor");
  const tEditorAi = useTranslations("editor.ai");
  const [answers, setAnswers] = useState({});
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState({});
  const sharedHistoryState = useRef(createEmptyHistoryState());

  const [currentInputMethod, setCurrentInputMethod] = useState(
    allowedInput[0] || "text",
  );
  const [allowedInputMethods, setAllowedInputMethods] = useState(
    allowedInput || ["text", "audio", "writing"],
  );
  const [currentPromptMethod, setCurrentPromptMethod] = useState(
    promptMethod[0] || "text",
  );

  const { grade, saveGrade, workbook } = React.useContext(UnitContext);
  const { studentMemory, contentContext } = useVerifyContext();
  const { questionBank } = React.useContext(DictionaryContext);

  const gradeId = grade?.id;
  const inProgress = grade?.data?.[nodeKey];
  const completionSavedRef = useRef(false);

  // Reset local state when grade changes (e.g., new grade after unit completion)
  const gradeIdRef = useRef(gradeId);
  React.useEffect(() => {
    if (gradeId && gradeId !== gradeIdRef.current) {
      gradeIdRef.current = gradeId;
      // Only reset if the new grade has no data for this exercise
      if (!grade?.data?.[nodeKey]) {
        setAnswers({});
        setFeedback({});
        setProgress(0);
        completionSavedRef.current = false;
      }
    }
  }, [gradeId, grade?.data, nodeKey]);

  // Load saved answers from progress data
  React.useEffect(() => {
    if (inProgress?.userResponse) {
      // For single question exercises
      const firstQuestionId = questionIDs?.[0];
      if (firstQuestionId) {
        setAnswers((prev) => ({
          ...prev,
          [firstQuestionId]: inProgress.userResponse,
        }));
      }
    }

    if (inProgress?.complete) {
      // Mark as complete if already finished with detailed feedback
      const completeFeedback = {};
      questionIDs?.forEach((qid) => {
        completeFeedback[qid] = {
          answer: true,
          reason: inProgress.feedback || "Answer verified and accepted",
          userResponse: inProgress.userResponse || answers[qid],
        };
      });
      setFeedback(completeFeedback);
    }
  }, [inProgress, questionIDs]);

  const handleInputChange = (event, newInputMethod) => {
    // console.log('newInputMethods', newInputMethods)
    setCurrentInputMethod(newInputMethod);
  };

  React.useEffect(() => {
    if (allowedInput?.length > 0) {
      console.log("allowedInput", allowedInput);
      console.log("promptMethod", promptMethod);
      console.log("AnswerComponent.currentPromptMethod", currentPromptMethod);
      setAllowedInputMethods(allowedInput);
      setCurrentInputMethod(allowedInput[0]);
    }
  }, [JSON.stringify(allowedInput)]);

  React.useEffect(() => {
    console.log("AnswerComponent.promptMethod", promptMethod);
    if (promptMethod?.length > 0) {
      setCurrentPromptMethod(promptMethod[0]);
    }
  }, [JSON.stringify(promptMethod)]);

  React.useEffect(() => {
    console.log("allowedInput", allowedInput);
    console.log("promptMethod", promptMethod);
    setAllowedInputMethods(allowedInput);
    setCurrentInputMethod(allowedInput[0]);
    setCurrentPromptMethod(promptMethod[0]);
    console.log("AnswerComponent.currentPromptMethod", promptMethod[0]);
  }, []);

  // Reset completion guard when exercise changes
  React.useEffect(() => {
    completionSavedRef.current = false;
  }, [nodeKey]);

  // Track completion of this exercise
  React.useEffect(() => {
    if (completionSavedRef.current) return;
    if (questionIDs && questionIDs.length > 0 && feedback) {
      // Check if all questions have been answered
      const allQuestionsAnswered = questionIDs.every(
        (qid) => feedback[qid] !== undefined,
      );

      if (allQuestionsAnswered && !inProgress?.complete) {
        completionSavedRef.current = true;
        console.log(
          "CustomAnswerComponent: All questions answered, marking complete",
        );
        // Get the first answer as user response (for single question exercises)
        const firstQuestionId = questionIDs?.[0];
        const userResponse =
          answers[firstQuestionId] || inProgress?.userResponse;
        const feedbackText =
          feedback[firstQuestionId]?.reason || "All questions completed";

        // Update this exercise's data while preserving all other exercise data
        const updatedData = {
          ...(grade?.data || {}),
          [nodeKey]: {
            ...inProgress,
            complete: true,
            userResponse: userResponse,
            feedback: feedbackText,
            accuracy: 1.0,
          },
        };
        saveGrade(updatedData);
      }
    }
  }, [feedback, questionIDs, saveGrade, nodeKey, grade, inProgress]);

  const blockGradeData = grade?.data?.[nodeKey];
  const nailedIt = blockGradeData?.nailedIt === true;

  return (
    <WorkbookBlockEnhancements blockId={nodeKey} nailedIt={nailedIt}>
      <div
        className={className}
        style={{
          display: "flex",
          flexDirection: "column",
          // alignItems: 'center',
          marginBottom: "6rem",
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {t("customAnswerComponent.answerQuestions")}
          </Typography>
        </Box>

        <ToggleButtonGroup
          exclusive
          value={currentInputMethod}
          onChange={handleInputChange}
          aria-label={tEditorAi("promptMethodSelector.inputButton")}
        >
          <ToggleButton
            disabled={!allowedInputMethods.includes("text")}
            value="text"
            aria-label={tEditor("customAnswerComponent.text")}
          >
            {t("customAnswerComponent.text")}
          </ToggleButton>
          <ToggleButton
            disabled={!allowedInputMethods.includes("audio")}
            value="audio"
            aria-label={tEditor("customAnswerComponent.audio")}
          >
            {t("customAnswerComponent.audio")}
          </ToggleButton>
          <ToggleButton
            disabled={!allowedInputMethods.includes("writing")}
            value="writing"
            aria-label={tEditor("customAnswerComponent.writing")}
          >
            {t("customAnswerComponent.writing")}
          </ToggleButton>
        </ToggleButtonGroup>

        <Box>
          <LinearProgressWithLabel value={0} />
        </Box>

        <ol>
          {questionIDs &&
            questionIDs.map((questionID) => {
              const question = questionBank[questionID] || {};
              console.log("CustomAnswerComponent.questionID", questionID);
              console.log("CustomAnswerComponent.questionBank", questionBank);
              console.log("CustomAnswerComponent.question", question);

              let borderStyle = "1px solid #ccc";
              if (feedback[questionID]?.answer === true) {
                console.log("feedback[questionID]", feedback[questionID]);
                borderStyle = "1px solid green";
              } else if (feedback[questionID]?.answer === false) {
                console.log("feedback[questionID]", feedback[questionID]);
                borderStyle = "1px solid red";
              }

              const { prompt, answer, phrase, definition, pronunciation } =
                question;
              console.log("CustomAnswerComponent.question", question);
              console.log("CustomAnswerComponent.prompt", prompt);
              console.log(
                "CustomAnswerComponent.feedback[questionID]",
                feedback[questionID],
              );

              // Determine if this question is completed
              const isCompleted =
                feedback[questionID] &&
                feedback[questionID].answer !== undefined;
              console.log("CustomAnswerComponent.isCompleted", isCompleted);
              console.log(
                "CustomAnswerComponent.currentPromptMethod",
                currentPromptMethod,
              );

              // Determine what to display as the prompt
              let displayPrompt = prompt;
              if (!displayPrompt && currentPromptMethod === "phrase") {
                displayPrompt = phrase;
              } else if (
                !displayPrompt &&
                currentPromptMethod === "definition"
              ) {
                displayPrompt = definition;
              } else if (
                !displayPrompt &&
                currentPromptMethod === "pronunciation"
              ) {
                displayPrompt = pronunciation;
              }

              // If still no prompt but we have feedback, try to extract from there
              if (!displayPrompt && isCompleted && feedback[questionID]) {
                // Try to extract the original question from the feedback reason
                displayPrompt = `Question for ID: ${questionID}`;
              }

              console.log("CustomAnswerComponent.displayPrompt", displayPrompt);

              return (
                <li display="flex" key={questionID}>
                  {/**
                   * Display the question prompt when not using audio OR when completed
                   */}
                  {(currentPromptMethod !== "audio" || isCompleted) &&
                    displayPrompt && (
                      <Typography
                        variant="body1"
                        display="flex"
                        style={{
                          textWrap: "wrap",
                          wordBreak: "normal",
                          marginBottom: "0.5rem",
                        }}
                        color="textPrimary"
                      >
                        <strong>{t("customAnswerComponent.question")}</strong>
                        &nbsp;{displayPrompt}
                      </Typography>
                    )}

                  {/**
                   * If completed but no prompt data, at least show there was a question
                   */}
                  {isCompleted && !displayPrompt && (
                    <Typography
                      variant="body1"
                      display="flex"
                      style={{
                        textWrap: "wrap",
                        wordBreak: "normal",
                        marginBottom: "0.5rem",
                      }}
                      color="text.secondary"
                    >
                      <strong>
                        {t("customAnswerComponent.completedQuestion")}
                      </strong>{" "}
                      {t("customAnswerComponent.promptNotAvailable")}
                    </Typography>
                  )}

                  {/**
                   * Area for feedback from api call
                   */}
                  {feedback[questionID] && (
                    <Box
                      sx={{
                        mb: 1.5,
                        p: 1.5,
                        border: 1,
                        borderColor:
                          feedback[questionID]?.answer === true
                            ? "success.main"
                            : "error.main",
                        borderRadius: 1,
                        bgcolor: "action.hover",
                      }}
                    >
                      {feedback[questionID]?.userResponse && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 0.5, fontStyle: "italic" }}
                        >
                          {t("customAnswerComponent.yourAnswer", {
                            answer: feedback[questionID].userResponse,
                          })}
                        </Typography>
                      )}
                      <Typography
                        variant="body2"
                        color="text.primary"
                        component="div"
                        sx={{ flexGrow: 1 }}
                      >
                        {feedback[questionID]?.reason || ""}
                      </Typography>
                    </Box>
                  )}

                  {currentPromptMethod === "audio" && question?.audio && (
                    <AudioWaveformPlayer
                      audioUrl={question.audio[0]}
                      width={400}
                      height={60}
                      title={
                        question.prompt ||
                        t("customAnswerComponent.audioQuestion")
                      }
                    />
                  )}

                  {currentInputMethod === "text" && (
                    <Box
                      display="flex"
                      style={{
                        marginBottom: "1rem",
                      }}
                    >
                      <PlainTextAnswerInput
                        value={answers[questionID] || ""}
                        onChange={(text) => {
                          setAnswers({
                            ...answers,
                            [questionID]: text,
                          });
                        }}
                        onAutoSubmit={async (text) => {
                          try {
                            const data = await gradeShortAnswer({
                              question: prompt,
                              answer: text,
                              expectedAnswer: answer,
                            });

                            setFeedback({
                              ...feedback,
                              [questionID]: data,
                            });
                            // Broadcast to collaborators via Yjs
                            workbook?.setFeedback?.(nodeKey, {
                              text: data?.reason || "",
                              timestamp: Date.now(),
                            });
                          } catch (error) {
                            console.error(error);
                            setFeedback({
                              ...feedback,
                              [questionID]: t(
                                "customAnswerComponent.errorOccurred",
                              ),
                            });
                          }
                        }}
                        historyState={sharedHistoryState.current}
                        placeholder={t(
                          "customAnswerComponent.answerPlaceholder",
                        )}
                        ariaLabel={t("customAnswerComponent.yourAnswer", {
                          ns: "editor",
                        })}
                        borderStyle={borderStyle}
                        textColor={
                          feedback[questionID]?.answer === true
                            ? "green"
                            : feedback[questionID]?.answer === false
                              ? "red"
                              : "inherit"
                        }
                        testId="custom-answer-input"
                        questionId={questionID}
                        disabled={isCompleted}
                      />
                    </Box>
                  )}
                  {currentInputMethod === "audio" && (
                    <Box
                      display="flex"
                      style={{
                        marginBottom: "1rem",
                      }}
                    >
                      <AudioAutoSubmitWrapper>
                        {({ wrapOnRecordingComplete }) => (
                          <AudioWaveformPlayer
                            enableRecording={true}
                            gradeId={grade?.id}
                            nodeKey={`custom-answer-${questionID}`}
                            title={prompt || question?.prompt}
                            onRecordingComplete={wrapOnRecordingComplete(
                              async (audioFile, uploadResult) => {
                                const currentGradeData = grade?.data || {};
                                const audioNodeKey = `custom-answer-${questionID}`;
                                const updatedGradeData = {
                                  ...currentGradeData,
                                  [audioNodeKey]: {
                                    ...currentGradeData[audioNodeKey],
                                    audioFilePath: audioFile?.path || null,
                                    audioFileId: audioFile?.id || null,
                                    inputMethod: "audio",
                                  },
                                };
                                saveGrade(updatedGradeData);

                                // Verify the recorded audio
                                try {
                                  const audioUrl =
                                    audioFile?.path || uploadResult?.path;
                                  if (audioUrl) {
                                    const feedbackData = await gradeShortAnswer(
                                      {
                                        question: prompt,
                                        answer: audioUrl,
                                        expectedAnswer: answer,
                                      },
                                    );
                                    if (feedbackData) {
                                      setFeedback((prev) => ({
                                        ...prev,
                                        [questionID]: feedbackData,
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
                                    "[CustomAnswerComponent] Audio verification error:",
                                    err,
                                  );
                                }
                              },
                            )}
                          />
                        )}
                      </AudioAutoSubmitWrapper>
                    </Box>
                  )}
                  {currentInputMethod === "writing" && (
                    <Box
                      display="flex"
                      style={{
                        marginBottom: "1rem",
                      }}
                    >
                      <Suspense
                        fallback={
                          <div>{t("customAnswerComponent.loading")}</div>
                        }
                      >
                        <SketchPad
                          excalidrawData={inProgress?.excalidrawData ?? {}}
                          className={className}
                          expect={answer}
                          questionID={questionID}
                          setFeedback={(data) => {
                            setFeedback({
                              ...feedback,
                              [questionID]: data,
                            });
                            // Broadcast to collaborators via Yjs
                            workbook?.setFeedback?.(nodeKey, {
                              text: data?.reason || "",
                              timestamp: Date.now(),
                            });
                          }}
                          feedback={feedback}
                          question={prompt}
                        />
                      </Suspense>
                    </Box>
                  )}
                </li>
              );
            })}
        </ol>
      </div>
    </WorkbookBlockEnhancements>
  );
}
