/**
 * @fileoverview CustomAIComponent - Student-facing AI-graded exercise.
 *
 * Renders an immutable exercise interface where students submit answers
 * in the configured input mode (text/audio/image/drawing). Submissions
 * are graded via the secure /api/grade-ai endpoint.
 *
 * @module CustomAINode/CustomAIComponent
 */

import React, { useState, useRef, useEffect, useContext, lazy, Suspense } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  LinearProgress,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
} from "@mui/material";
import { createEmptyHistoryState } from "@lexical/react/LexicalHistoryPlugin";

import PlainTextAnswerInput from "../../components/PlainTextAnswerInput";
import AudioAutoSubmitWrapper from "../../components/AudioAutoSubmitWrapper";
import AudioWaveformPlayer from "../../components/AudioWaveformPlayer";
import UnitContext from "../../../../context/unitContext";
import DictionaryContext from "../../../../context/dictionaryContext";
import { WorkbookBlockEnhancements } from "../../components/WorkbookBlockEnhancements";

import type { CustomAIInputMode } from "../../plugins/CustomAIPlugin";

const SketchPad = lazy(() => import("../../components/SketchPad"));

interface GradingResponse {
  correct: boolean;
  score: number;
  feedback: string;
}

interface CustomAIComponentProps {
  className: { base: string; focus: string };
  format: string;
  nodeKey: string;
  ids: string[];
  inputMode: CustomAIInputMode;
  criteria: string;
  allowedInput: CustomAIInputMode[];
}

function LinearProgressWithLabel({ value }: { value: number }) {
  return (
    <Box display="flex" alignItems="center" margin={1}>
      <Box width="95%">
        <LinearProgress variant="determinate" value={value} />
      </Box>
      <Box width="fit-content" marginLeft={1}>
        <Typography variant="body2" color="textSecondary">
          {`${Math.round(value)}%`}
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * Call the secure AI grading endpoint.
 */
async function gradeWithAI(params: {
  questionId: string;
  question: string;
  answer: string;
  inputMode: CustomAIInputMode;
  criteria: string;
  imageData?: string;
}): Promise<GradingResponse> {
  const response = await fetch("/api/grade-ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Grading failed: ${response.statusText}`);
  }

  return response.json();
}

export default function CustomAIComponent({
  className,
  nodeKey,
  ids: questionIDs,
  inputMode: defaultInputMode,
  criteria,
  allowedInput,
}: CustomAIComponentProps) {
  const t = useTranslations("workbook");
  const tEditor = useTranslations("editor");

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, GradingResponse>>({});
  const [grading, setGrading] = useState<Record<string, boolean>>({});
  const [currentInputMethod, setCurrentInputMethod] = useState<CustomAIInputMode>(
    allowedInput?.[0] || defaultInputMode || "text",
  );

  const sharedHistoryState = useRef(createEmptyHistoryState());
  const completionSavedRef = useRef(false);

  const { grade, saveGrade, workbook } = useContext(UnitContext);
  const { questionBank } = useContext(DictionaryContext);
  const questionBankMap = (questionBank || {}) as Record<string, any>;
  const workbookApi = workbook as any;

  const gradeId = grade?.id;
  const inProgress = grade?.data?.[nodeKey];

  // Reset when grade changes
  const gradeIdRef = useRef(gradeId);
  useEffect(() => {
    if (gradeId && gradeId !== gradeIdRef.current) {
      gradeIdRef.current = gradeId;
      if (!grade?.data?.[nodeKey]) {
        setAnswers({});
        setFeedback({});
        setGrading({});
        completionSavedRef.current = false;
      }
    }
  }, [gradeId, grade?.data, nodeKey]);

  // Load saved feedback from progress data
  useEffect(() => {
    if (inProgress?.complete && inProgress?.feedback) {
      const completeFeedback: Record<string, GradingResponse> = {};
      questionIDs?.forEach((qid) => {
        completeFeedback[qid] = {
          correct: true,
          score: inProgress.score || 100,
          feedback: inProgress.feedback || "Completed",
        };
      });
      setFeedback(completeFeedback);
    }
  }, [inProgress, questionIDs]);

  // Reset completion guard when exercise changes
  useEffect(() => {
    completionSavedRef.current = false;
  }, [nodeKey]);

  // Track completion
  useEffect(() => {
    if (completionSavedRef.current) return;
    if (!questionIDs || questionIDs.length === 0) return;

    const allAnswered = questionIDs.every((qid) => feedback[qid] !== undefined);

    if (allAnswered && !inProgress?.complete) {
      completionSavedRef.current = true;

      // Calculate average score
      const scores = questionIDs.map((qid) => feedback[qid]?.score || 0);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

      const firstId = questionIDs[0];
      const updatedData = {
        ...(grade?.data || {}),
        [nodeKey]: {
          ...inProgress,
          complete: true,
          userResponse: answers[firstId] || "",
          feedback: feedback[firstId]?.feedback || "All questions completed",
          accuracy: avgScore / 100,
          score: avgScore,
        },
      };
      saveGrade(updatedData);
    }
  }, [feedback, questionIDs, saveGrade, nodeKey, grade, inProgress, answers]);

  const handleInputChange = (
    _: React.MouseEvent<HTMLElement>,
    newMethod: CustomAIInputMode,
  ) => {
    if (newMethod) setCurrentInputMethod(newMethod);
  };

  const handleTextSubmit = async (questionID: string, text: string) => {
    const question = questionBankMap[questionID];
    if (!question) return;

    setGrading((prev) => ({ ...prev, [questionID]: true }));

    try {
      const result = await gradeWithAI({
        questionId: questionID,
        question: question.prompt || question.question || "",
        answer: text,
        inputMode: "text",
        criteria,
      });

      setFeedback((prev) => ({ ...prev, [questionID]: result }));
      workbookApi?.setFeedback?.(nodeKey, {
        text: result.feedback,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("[CustomAIComponent] Grading error:", error);
      setFeedback((prev) => ({
        ...prev,
        [questionID]: {
          correct: false,
          score: 0,
          feedback: "An error occurred while grading. Please try again.",
        },
      }));
    } finally {
      setGrading((prev) => ({ ...prev, [questionID]: false }));
    }
  };

  const handleDrawingSubmit = async (
    questionID: string,
    imageBase64: string,
  ) => {
    const question = questionBankMap[questionID];
    if (!question) return;

    setGrading((prev) => ({ ...prev, [questionID]: true }));

    try {
      const result = await gradeWithAI({
        questionId: questionID,
        question: question.prompt || question.question || "",
        answer: question.answer || "See drawing",
        inputMode: "drawing",
        criteria,
        imageData: imageBase64,
      });

      setFeedback((prev) => ({ ...prev, [questionID]: result }));
      workbookApi?.setFeedback?.(nodeKey, {
        text: result.feedback,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("[CustomAIComponent] Drawing grading error:", error);
      setFeedback((prev) => ({
        ...prev,
        [questionID]: {
          correct: false,
          score: 0,
          feedback: "An error occurred while grading. Please try again.",
        },
      }));
    } finally {
      setGrading((prev) => ({ ...prev, [questionID]: false }));
    }
  };

  const progress = React.useMemo(() => {
    if (!questionIDs || questionIDs.length === 0) return 0;
    const answered = questionIDs.filter((qid) => feedback[qid]).length;
    return (answered / questionIDs.length) * 100;
  }, [questionIDs, feedback]);

  const blockGradeData = grade?.data?.[nodeKey];
  const nailedIt = blockGradeData?.nailedIt === true;

  return (
    <WorkbookBlockEnhancements blockId={nodeKey} nailedIt={nailedIt}>
      <div
        className={className?.base}
        style={{
          display: "flex",
          flexDirection: "column",
          marginBottom: "6rem",
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {t("customAnswerComponent.answerQuestions")}
          </Typography>
        </Box>

        {/* Input mode toggle */}
        {allowedInput?.length > 1 && (
          <ToggleButtonGroup
            exclusive
            value={currentInputMethod}
            onChange={handleInputChange}
            aria-label="Input method"
            sx={{ mb: 1 }}
          >
            {allowedInput.map((mode) => (
              <ToggleButton key={mode} value={mode} aria-label={mode}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}

        <Box>
          <LinearProgressWithLabel value={progress} />
        </Box>

        <ol>
          {questionIDs?.map((questionID) => {
            const question = questionBankMap[questionID] || {};
            const isCompleted = feedback[questionID] !== undefined;
            const isGrading = grading[questionID] === true;
            const displayPrompt =
              question.prompt || question.question || `Question ${questionID}`;

            let borderStyle = "1px solid #ccc";
            if (feedback[questionID]?.correct === true) {
              borderStyle = "1px solid green";
            } else if (feedback[questionID]?.correct === false) {
              borderStyle = "1px solid red";
            }

            return (
              <li key={questionID} style={{ marginBottom: "1.5rem" }}>
                {/* Question prompt */}
                <Typography
                  variant="body1"
                  sx={{ mb: 1, wordBreak: "normal", textWrap: "wrap" }}
                >
                  <strong>{t("customAnswerComponent.question")}</strong>
                  &nbsp;{displayPrompt}
                </Typography>

                {/* Feedback area */}
                {feedback[questionID] && (
                  <Box
                    sx={{
                      mb: 1.5,
                      p: 1.5,
                      border: 1,
                      borderColor: feedback[questionID].correct
                        ? "success.main"
                        : "error.main",
                      borderRadius: 1,
                      bgcolor: "action.hover",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Score: {feedback[questionID].score}/100
                      </Typography>
                      <Typography
                        variant="body2"
                        color={
                          feedback[questionID].correct
                            ? "success.main"
                            : "error.main"
                        }
                      >
                        {feedback[questionID].correct
                          ? "Correct"
                          : "Needs Improvement"}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.primary">
                      {feedback[questionID].feedback}
                    </Typography>
                  </Box>
                )}

                {/* Grading spinner */}
                {isGrading && (
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1, gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      AI is grading your response...
                    </Typography>
                  </Box>
                )}

                {/* Text input */}
                {currentInputMethod === "text" && (
                  <Box sx={{ mb: 1 }}>
                    <PlainTextAnswerInput
                      value={answers[questionID] || ""}
                      onChange={(text: string) => {
                        setAnswers((prev) => ({ ...prev, [questionID]: text }));
                      }}
                      onAutoSubmit={(text: string) =>
                        handleTextSubmit(questionID, text)
                      }
                      historyState={sharedHistoryState.current}
                      placeholder={t("customAnswerComponent.answerPlaceholder")}
                      ariaLabel="Your answer"
                      borderStyle={borderStyle}
                      textColor={
                        feedback[questionID]?.correct === true
                          ? "green"
                          : feedback[questionID]?.correct === false
                            ? "red"
                            : "inherit"
                      }
                      testId="custom-ai-input"
                      wordId={questionID}
                      questionId={questionID}
                      disabled={isCompleted}
                    />
                  </Box>
                )}

                {/* Audio input */}
                {currentInputMethod === "audio" && (
                  <Box sx={{ mb: 1 }}>
                    <AudioAutoSubmitWrapper>
                      {({ wrapOnRecordingComplete }: { wrapOnRecordingComplete: Function }) => (
                        <AudioWaveformPlayer
                          audioUrl=""
                          file={{}}
                          width={600}
                          height={80}
                          showDuration={true}
                          enableRecording={true}
                          gradeId={grade?.id || ""}
                          nodeKey={`custom-ai-${questionID}`}
                          metadata={{}}
                          title={displayPrompt}
                          onRecordingComplete={wrapOnRecordingComplete(
                            async (audioFile: any) => {
                              // For audio, we'd transcribe then grade
                              // For now, save the audio reference
                              const currentGradeData = grade?.data || {};
                              const audioNodeKey = `custom-ai-${questionID}`;
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

                              try {
                                if (audioFile?.path) {
                                  const result = await gradeWithAI({
                                    questionId: questionID,
                                    question: displayPrompt,
                                    answer: `[Audio submission: ${audioFile.path}]`,
                                    inputMode: "audio",
                                    criteria,
                                  });
                                  setFeedback((prev) => ({
                                    ...prev,
                                    [questionID]: result,
                                  }));
                                  workbookApi?.setFeedback?.(nodeKey, {
                                    text: result.feedback,
                                    timestamp: Date.now(),
                                  });
                                }
                              } catch (err) {
                                console.error(
                                  "[CustomAIComponent] Audio grading error:",
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

                {/* Drawing input */}
                {currentInputMethod === "drawing" && (
                  <Box sx={{ mb: 1 }}>
                    <Suspense fallback={<div>Loading...</div>}>
                      <SketchPad
                        excalidrawData={inProgress?.excalidrawData ?? {}}
                        expect={question.answer || ""}
                        questionID={questionID}
                        setFeedback={(data: any) => {
                          if (data?.imageBase64) {
                            handleDrawingSubmit(questionID, data.imageBase64);
                          } else {
                            setFeedback((prev) => ({
                              ...prev,
                              [questionID]: {
                                correct: data?.answer ?? false,
                                score: data?.accuracy ?? 0,
                                feedback: data?.reason || "",
                              },
                            }));
                          }
                          workbookApi?.setFeedback?.(nodeKey, {
                            text: data?.reason || "",
                            timestamp: Date.now(),
                          });
                        }}
                        feedback={feedback}
                      />
                    </Suspense>
                  </Box>
                )}

                {/* Image input */}
                {currentInputMethod === "image" && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Image upload input - submit an image for AI evaluation
                    </Typography>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isCompleted}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const reader = new FileReader();
                        reader.onload = async () => {
                          const base64 = (reader.result as string).split(",")[1];
                          if (base64) {
                            setAnswers((prev) => ({
                              ...prev,
                              [questionID]: `[Image: ${file.name}]`,
                            }));
                            await handleDrawingSubmit(questionID, base64);
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
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
