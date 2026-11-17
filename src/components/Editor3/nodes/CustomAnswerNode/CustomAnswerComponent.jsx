import React, { lazy, Suspense } from "react";
import { useTranslations } from "next-intl";
import { getAmplifyClient } from "../../../../utils/amplifyClient";

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
import { getCustomAnswerDirectionPair } from "./direction";
import { transcribeSubmission } from "../../../../utils/transcribeSubmission";
import {
  buildResponse,
  createResponseAttemptId,
  GRADING_FAILED,
  INPUT_METHOD,
} from "../../../../utils/studentResponses";
import { useResponseRecorder } from "../../../../hooks/useResponseRecorder";

/**
 * verifyShortAnswer returns `{ correct, score, feedback }` as text (sometimes in
 * a code fence); this component reads `{ answer, reason }`. Used by the text and
 * audio paths so both show results.
 */
function parseShortAnswerResult(rawText) {
  const raw = JSON.parse(
    String(rawText ?? "").match(/\{[\s\S]*\}/)?.[0] ?? "{}",
  );
  return {
    ...raw,
    answer: raw.answer ?? raw.correct,
    reason: raw.reason ?? raw.feedback,
  };
}

/** { questionId: { answer, reason } } for the block's grade data. */
function summarizeResults(questionIDs, feedback) {
  const results = {};
  for (const qid of questionIDs) {
    const f = feedback[qid];
    results[qid] = {
      answer: f?.answer === true,
      ...(typeof f?.reason === "string" ? { reason: f.reason.slice(0, 500) } : {}),
    };
  }
  return results;
}

function LinearProgressWithLabel({ value }) {
  return (
    <>
      {/* eslint-disable-next-line i18next/no-literal-string -- CSS value */}
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

export function CustomAnswerView({
  className,
  nodeKey,
  // questions,
  ids: questionIDs,
  requestDefinition = false,
  customPrompt,
  allowedInput = [],
  promptMethod = [],
  direction = "question-to-answer",
  questionBank = {},
  grade,
  saveGrade,
  workbook,
  responseBlockId,
  createGrade,
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

  const gradeId = grade?.id;
  const blockDataKey = responseBlockId || nodeKey;
  const inProgress = grade?.data?.[blockDataKey];
  const completionSavedRef = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Saves what the student actually submitted for each question (typed
  // text, recording, drawing strokes) with the grader's verdict as
  // GradeResponse items, for teacher review.
  const recordResponse = useResponseRecorder({
    grade,
    blockKey: blockDataKey,
    createGrade,
  });

  // Fields this component has written to its block. Merged into every block
  // save so a save made while the grade in context is a render behind cannot
  // drop them (for example `complete`).
  const ownBlockFieldsRef = useRef({});
  const saveBlock = React.useCallback(
    (fields) => {
      ownBlockFieldsRef.current = { ...ownBlockFieldsRef.current, ...fields };
      saveGrade({
        [blockDataKey]: {
          ...(grade?.data?.[blockDataKey] || {}),
          ...ownBlockFieldsRef.current,
        },
      });
    },
    [blockDataKey, grade, saveGrade],
  );

  // Reset local state when grade changes (e.g., new grade after unit completion)
  const gradeIdRef = useRef(gradeId);
  React.useEffect(() => {
    if (gradeId && gradeId !== gradeIdRef.current) {
      gradeIdRef.current = gradeId;
      ownBlockFieldsRef.current = {};
      // Only reset if the new grade has no data for this exercise
      if (!grade?.data?.[blockDataKey]) {
        setAnswers({});
        setFeedback({});
        setProgress(0);
        completionSavedRef.current = false;
      }
    }
  }, [blockDataKey, gradeId, grade?.data]);

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
        // Show each question's saved verdict when we have it, rather than
        // marking every question correct.
        const saved = inProgress.results?.[qid];
        completeFeedback[qid] = {
          answer: saved?.answer ?? true,
          reason:
            saved?.reason ||
            inProgress.feedback ||
            t("customAnswerComponent.answerVerifiedAndAccepted"),
          userResponse: inProgress.userResponse || answersRef.current[qid],
        };
      });
      setFeedback(completeFeedback);
    }
  }, [inProgress, questionIDs, t]);

  const handleInputChange = (event, newInputMethod) => {
    // console.log('newInputMethods', newInputMethods)
    setCurrentInputMethod(newInputMethod);
  };

  const allowedInputKey = JSON.stringify(allowedInput);
  React.useEffect(() => {
    const methods = allowedInputKey ? JSON.parse(allowedInputKey) : undefined;
    if (methods?.length > 0) {
      setAllowedInputMethods(methods);
      setCurrentInputMethod(methods[0]);
    }
  }, [allowedInputKey]);

  const promptMethodKey = JSON.stringify(promptMethod);
  React.useEffect(() => {
    const methods = promptMethodKey ? JSON.parse(promptMethodKey) : undefined;
    if (methods?.length > 0) {
      setCurrentPromptMethod(methods[0]);
    }
  }, [promptMethodKey]);

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
        // Score the block from the graded answers (fraction correct, 0-1)
        // instead of saving 1.0 for every completed attempt.
        const correctCount = questionIDs.filter(
          (qid) => feedback[qid]?.answer === true,
        ).length;
        const accuracy = correctCount / questionIDs.length;

        // Update this exercise's block; saveGrade keeps the other blocks.
        saveBlock({
          complete: true,
          userResponse: userResponse,
          feedback: feedbackText,
          accuracy,
          correctCount,
          totalQuestions: questionIDs.length,
          // Per-question verdicts, so a reload shows each question's result.
          results: summarizeResults(questionIDs, feedback),
        });
      }
    }
  }, [feedback, questionIDs, saveBlock, inProgress, answers]);

  return (
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

            // eslint-disable-next-line i18next/no-literal-string -- CSS value
            let borderStyle = "1px solid #ccc";
            if (feedback[questionID]?.answer === true) {
              console.log("feedback[questionID]", feedback[questionID]);
              // eslint-disable-next-line i18next/no-literal-string -- CSS value
              borderStyle = "1px solid green";
            } else if (feedback[questionID]?.answer === false) {
              console.log("feedback[questionID]", feedback[questionID]);
              // eslint-disable-next-line i18next/no-literal-string -- CSS value
              borderStyle = "1px solid red";
            }

            const isAnswerToQuestion = direction === "answer-to-question";
            const { prompt: questionPrompt, expected: expectedAnswer } =
              getCustomAnswerDirectionPair(question, direction);
            const { phrase, definition, pronunciation } = question;
            console.log("CustomAnswerComponent.question", question);
            console.log("CustomAnswerComponent.prompt", prompt);
            console.log(
              "CustomAnswerComponent.feedback[questionID]",
              feedback[questionID],
            );

            // Determine if this question is completed
            const isCompleted =
              feedback[questionID] && feedback[questionID].answer !== undefined;
            console.log("CustomAnswerComponent.isCompleted", isCompleted);
            console.log(
              "CustomAnswerComponent.currentPromptMethod",
              currentPromptMethod,
            );

            // Determine what to display as the prompt
            let displayPrompt = questionPrompt;
            if (
              !isAnswerToQuestion &&
              !displayPrompt &&
              currentPromptMethod === "phrase"
            ) {
              displayPrompt = phrase;
            } else if (
              !isAnswerToQuestion &&
              !displayPrompt &&
              currentPromptMethod === "definition"
            ) {
              displayPrompt = definition;
            } else if (
              !isAnswerToQuestion &&
              !displayPrompt &&
              currentPromptMethod === "pronunciation"
            ) {
              displayPrompt = pronunciation;
            }

            // If still no prompt but we have feedback, try to extract from there
            if (!displayPrompt && isCompleted && feedback[questionID]) {
              displayPrompt = feedback[questionID]?.prompt || null;
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
                      // eslint-disable-next-line i18next/no-literal-string -- CSS value
                      display="flex"
                      style={{
                        textWrap: "wrap",
                        wordBreak: "normal",
                        marginBottom: "0.5rem",
                      }}
                      color="textPrimary"
                    >
                      {!isAnswerToQuestion && (
                        <>
                          <strong>
                            {t("customAnswerComponent.question")}
                          </strong>
                          &nbsp;
                        </>
                      )}
                      {displayPrompt}
                    </Typography>
                  )}

                {/**
                 * If completed but no prompt data, at least show there was a question
                 */}
                {isCompleted && !displayPrompt && (
                  <Typography
                    variant="body1"
                    // eslint-disable-next-line i18next/no-literal-string -- CSS value
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

                {currentPromptMethod === "audio" &&
                  (isAnswerToQuestion
                    ? question?.answerAudio
                    : question?.audio) && (
                  <AudioWaveformPlayer
                    audioUrl={
                      (isAnswerToQuestion
                        ? question.answerAudio
                        : question.audio)[0]
                    }
                    width={400}
                    height={60}
                    title={
                      questionPrompt ||
                      t("customAnswerComponent.audioQuestion")
                    }
                  />
                )}

                {currentInputMethod === "text" && (
                  <Box
                    // eslint-disable-next-line i18next/no-literal-string -- CSS value
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
                          const client = getAmplifyClient();

                          const response =
                            await client.queries.verifyShortAnswer({
                              answer: text,
                              prompt: questionPrompt,
                              expected: expectedAnswer,
                              // eslint-disable-next-line i18next/no-literal-string -- model identifier
                              model: "gpt-3.5-turbo",
                              studentMemory,
                              contentContext,
                            });

                          console.log("response", response);

                          const data = parseShortAnswerResult(response?.data);

                          recordResponse(
                            questionID,
                            buildResponse({
                              inputMethod: INPUT_METHOD.text,
                              prompt: questionPrompt,
                              text,
                              result: data,
                            }),
                          );
                          setFeedback((prev) => ({
                            ...prev,
                            [questionID]: data,
                          }));
                          // Broadcast to collaborators via Yjs
                          workbook?.setFeedback?.(nodeKey, {
                            text: data?.reason || "",
                            timestamp: Date.now(),
                          });
                        } catch (error) {
                          console.error(error);
                          recordResponse(
                            questionID,
                            buildResponse({
                              inputMethod: INPUT_METHOD.text,
                              prompt: questionPrompt,
                              text,
                              result: { error: error?.message || String(error) },
                            }),
                          );
                          setFeedback((prev) => ({
                            ...prev,
                            [questionID]: t(
                              "customAnswerComponent.errorOccurred",
                            ),
                          }));
                        }
                      }}
                      historyState={sharedHistoryState.current}
                      placeholder={t("customAnswerComponent.answerPlaceholder")}
                      ariaLabel={tEditor("customAnswerComponent.yourAnswer")}
                      borderStyle={borderStyle}
                      textColor={
                        feedback[questionID]?.answer === true
                          ? "green"
                          : feedback[questionID]?.answer === false
                            ? "red"
                            : "inherit"
                      }
                      // eslint-disable-next-line i18next/no-literal-string -- test id
                      testId="custom-answer-input"
                      questionId={questionID}
                      disabled={isCompleted}
                    />
                  </Box>
                )}
                {currentInputMethod === "audio" && (
                  <Box
                    // eslint-disable-next-line i18next/no-literal-string -- CSS value
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
                          title={questionPrompt}
                          onRecordingComplete={wrapOnRecordingComplete(
                            async (audioFile, uploadResult) => {
                              const attemptId = createResponseAttemptId();
                              const currentGradeData = grade?.data || {};
                              const audioNodeKey = `custom-answer-${questionID}`;
                              // Only this key: saveGrade merges it into the
                              // latest grade, so other blocks are not rolled back.
                              const updatedGradeData = {
                                [audioNodeKey]: {
                                  ...currentGradeData[audioNodeKey],
                                  audioFilePath: audioFile?.path || null,
                                  audioFileId: audioFile?.id || null,
                                  // eslint-disable-next-line i18next/no-literal-string -- stored enum value
                                  inputMethod: "audio",
                                },
                              };
                              saveGrade(updatedGradeData);

                              const audioPath =
                                audioFile?.path || uploadResult?.path;
                              // Keep the original recording with the answer
                              // before it is transcribed.
                              if (audioPath) {
                                recordResponse(
                                  questionID,
                                  buildResponse({
                                    inputMethod: INPUT_METHOD.audio,
                                    prompt: questionPrompt,
                                    audioPath,
                                    attemptId,
                                  }),
                                );
                              }

                              // Verify the recorded audio. The grader reads text, so the
                              // recording is transcribed first; sending the file path
                              // graded the path instead of what the student said.
                              try {
                                const client = getAmplifyClient();
                                if (audioPath) {
                                  const transcript =
                                    await transcribeSubmission(audioPath);
                                  // Keep the transcript with the grade so the
                                  // instructor can see what was actually heard.
                                  saveGrade({
                                    ...updatedGradeData,
                                    [audioNodeKey]: {
                                      ...updatedGradeData[audioNodeKey],
                                      transcript,
                                    },
                                  });
                                  const { data, errors } =
                                    await client.queries.verifyShortAnswer({
                                      answer: transcript,
                                      prompt: questionPrompt,
                                      expected: expectedAnswer,
                                      // eslint-disable-next-line i18next/no-literal-string -- model identifier
                                      model: "gpt-3.5-turbo",
                                      studentMemory,
                                      contentContext,
                                    });
                                  if (!errors && data) {
                                    const feedbackData =
                                      parseShortAnswerResult(data);
                                    recordResponse(
                                      questionID,
                                      buildResponse({
                                        inputMethod: INPUT_METHOD.audio,
                                        prompt: questionPrompt,
                                        transcript,
                                        result: feedbackData,
                                        attemptId,
                                      }),
                                      { sameAttempt: true, attemptId },
                                    );
                                    setFeedback((prev) => ({
                                      ...prev,
                                      [questionID]: feedbackData,
                                    }));
                                    // Broadcast to collaborators via Yjs
                                    workbook?.setFeedback?.(nodeKey, {
                                      text: feedbackData?.reason || "",
                                      timestamp: Date.now(),
                                    });
                                  } else {
                                    // Keep the transcript even when grading fails.
                                    recordResponse(
                                      questionID,
                                      buildResponse({
                                        inputMethod: INPUT_METHOD.audio,
                                        prompt: questionPrompt,
                                        transcript,
                                        result: {
                                          error:
                                            errors?.[0]?.message ||
                                            GRADING_FAILED,
                                        },
                                        attemptId,
                                      }),
                                      { sameAttempt: true, attemptId },
                                    );
                                  }
                                }
                              } catch (err) {
                                console.error(
                                  "[CustomAnswerComponent] Audio verification error:",
                                  err,
                                );
                                if (audioPath) {
                                  recordResponse(
                                    questionID,
                                    buildResponse({
                                      inputMethod: INPUT_METHOD.audio,
                                      prompt: questionPrompt,
                                      result: {
                                        error: err?.message || String(err),
                                      },
                                      attemptId,
                                    }),
                                    { sameAttempt: true, attemptId },
                                  );
                                }
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
                    // eslint-disable-next-line i18next/no-literal-string -- CSS value
                    display="flex"
                    style={{
                      marginBottom: "1rem",
                    }}
                  >
                    <Suspense
                      fallback={<div>{t("customAnswerComponent.loading")}</div>}
                    >
                      <SketchPad
                        excalidrawData={inProgress?.excalidrawData ?? {}}
                        className={className}
                        // `answer` was never defined here, so the writing
                        // input crashed on render; grade against the same
                        // expected answer the text and audio paths use.
                        expect={expectedAnswer}
                        questionID={questionID}
                        setFeedback={(data) => {
                          setFeedback((prev) => ({
                            ...prev,
                            [questionID]: data,
                          }));
                          // Broadcast to collaborators via Yjs
                          workbook?.setFeedback?.(nodeKey, {
                            text: data?.reason || "",
                            timestamp: Date.now(),
                          });
                        }}
                        onDrawingSaved={({ result, ...drawing }) =>
                          recordResponse(
                            questionID,
                            buildResponse({
                              inputMethod: INPUT_METHOD.drawing,
                              prompt: questionPrompt,
                              ...drawing,
                              result,
                            }),
                          )
                        }
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
  );
}

export default function CustomAnswerComponent({
  className,
  nodeKey,
  ids,
  requestDefinition = false,
  customPrompt,
  allowedInput = [],
  promptMethod = [],
  direction = "question-to-answer",
  responseBlockId,
}) {
  const { grade, saveGrade, workbook, createGrade, readOnly } =
    React.useContext(UnitContext);
  // Keep verify-context hook for parity (memory/personalization side effects).
  useVerifyContext();
  const { questionBank } = React.useContext(DictionaryContext);
  const nailedIt =
    grade?.data?.[responseBlockId || nodeKey]?.nailedIt === true;
  return (
    <div inert={readOnly ? true : undefined} aria-disabled={!!readOnly}>
      <WorkbookBlockEnhancements blockId={nodeKey} nailedIt={nailedIt}>
        <CustomAnswerView
          className={className}
          nodeKey={nodeKey}
          ids={ids}
          requestDefinition={requestDefinition}
          customPrompt={customPrompt}
          allowedInput={allowedInput}
          promptMethod={promptMethod}
          direction={direction}
          questionBank={questionBank}
          grade={grade}
          saveGrade={saveGrade}
          workbook={workbook}
          responseBlockId={responseBlockId}
          createGrade={createGrade}
        />
      </WorkbookBlockEnhancements>
    </div>
  );
}
