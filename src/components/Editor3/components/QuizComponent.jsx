"use strict";

/**
 * @fileoverview QuestionBlockRo1.js - A React component for displaying a read-only
 * version of the QuestionBlock component.
 */
import * as React from "react";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Box from "@mui/material/Box";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import { alpha } from "@mui/material/styles";
import { useTranslations } from "next-intl";

import UnitContext from "../../../context/unitContext";
import { ExerciseBlockCard } from "./ExerciseBlockCard";
import { QuizProgressMeters } from "./QuizProgressMeters";
import { SEMANTIC_THEME } from "../../../themes/semanticTheme";

export default function QuestionBlockRo(props) {
  const t = useTranslations("workbook");
  const { nodeKey, data } = props;
  const { grade, saveGrade } = React.useContext(UnitContext);
  console.log("QuestionBlockRo.grade", grade);
  const gradeData = React.useMemo(() => {
    if (!grade?.data) return {};
    if (typeof grade.data === "string") {
      try {
        return JSON.parse(grade.data);
      } catch {
        return {};
      }
    }
    return grade.data;
  }, [grade?.data]);
  const inProgress = gradeData[nodeKey] || {};

  const content = data || [];
  // let questionContent = shuffle([...content]);
  let questionContent = [...content];

  const indexContent = {};
  const correct = {};

  content.forEach((q, qk) => {
    console.log("......!q", q);
    indexContent[q.answer] = q;
    if (q.correct === true) {
      correct[qk] = q;
    }
  });

  console.log("QuestionBlock.nodeKey", nodeKey, "type:", typeof nodeKey);
  console.log("QuestionBlock.questionContent", questionContent);
  console.log(
    "QuestionBlock.grade.data keys:",
    gradeData ? Object.keys(gradeData) : "no data",
  );
  console.log("QuestionBlock.grade.data[nodeKey]:", gradeData[nodeKey]);
  console.log("QuestionBlockRo.inProgress", inProgress);

  const accuracy = inProgress?.accuracy || 0;
  const complete = inProgress?.complete || false;
  const percentComplete = inProgress?.percentComplete || 0;
  const attemptedAnswers = inProgress?.attemptedAnswers || [];
  const correctAnswers = inProgress?.correctAnswers || [];

  // Calculate if quiz should be locked
  const correctArrLen = Object.entries(correct).length || 0;
  const attemptedCount = Object.keys(attemptedAnswers).length;
  const isLocked = complete || attemptedCount >= correctArrLen;

  const gradeAnswer = async (e, thisKey, thisAnswer) => {
    // e.preventDefault();
    // e.stopPropagation();

    // Don't allow changes if already locked
    if (isLocked) {
      e.preventDefault();
      return;
    }

    const { correct: isCorrect } = thisAnswer;
    const isChecked = e.target.checked;

    const correctArrLen = Object.entries(correct).length || 0;

    console.log("meow: ?thisAnswer", thisAnswer);

    const savedGrade = gradeData;
    // let { saveGrade } = this.props;
    let thisExerciseDone = false;

    attemptedAnswers[thisKey] = thisAnswer?.answer;

    if (isCorrect === true && isChecked === true) {
      correctAnswers[thisKey] = thisAnswer?.answer;
    } else if (isCorrect === true && isChecked === false) {
      delete correctAnswers[thisKey];
      delete attemptedAnswers[thisKey];
    } else if (isCorrect === false && isChecked === false) {
      delete attemptedAnswers[thisKey];
    }

    const verifiedArr = Object.entries(correctAnswers);
    const attemptedArr = Object.entries(attemptedAnswers);

    let _grade = Math.floor((verifiedArr.length / correctArrLen) * 100);

    console.log(
      "attemptedArr.length === correctArrLen",
      attemptedArr.length,
      correctArrLen,
    );
    console.log(
      "verifiedArr.length === correctArrLen",
      verifiedArr.length,
      correctArrLen,
    );

    // Lock when number of attempts equals number of correct answers
    if (attemptedArr.length >= correctArrLen) {
      thisExerciseDone = true;
    }

    console.log("thisExerciseDone", thisExerciseDone);

    let savedGradeCopy = Object.assign({}, savedGrade);

    savedGradeCopy[nodeKey] = {
      accuracy: _grade,
      attemptedAnswers,
      complete: thisExerciseDone,
      correctAnswers,
      percentComplete: Math.floor((attemptedArr.length / correctArrLen) * 100),
    };

    console.log("savedGradeCopy", savedGradeCopy);
    await saveGrade(savedGradeCopy);
  };

  var className = "Editor-question";

  return (
    <QuizView
      data={questionContent}
      attemptedAnswers={attemptedAnswers}
      isLocked={isLocked}
      accuracy={accuracy}
      percentComplete={percentComplete}
      graded={complete}
      gradeDisplayText={t("quizComponent.gradeDisplay", { score: accuracy })}
      onToggle={gradeAnswer}
      className={className}
    />
  );
}

/**
 * QuizView — presentational, context-free rendering of a quiz block.
 * All grading state and callbacks are passed in as props so this can be used
 * both by the connected QuestionBlockRo above and standalone (e.g. showcase).
 */
export function QuizView({
  data = [],
  attemptedAnswers = {},
  isLocked = false,
  accuracy = 0,
  percentComplete = 0,
  graded = false,
  gradeDisplayText = "",
  onToggle = () => {},
  className = "Editor-question",
}) {
  const questionContent = [...data];
  const hasAttempts = Object.keys(attemptedAnswers).length > 0;

  const checkboxes = questionContent.map((item, key) => {
    // Use != null to handle sparse arrays that become [null,null,...] after JSON round-trip
    const wasAttempted = attemptedAnswers[key] != null;
    const isCorrectAnswer = item.correct === true;
    const checked = wasAttempted;
    // Only highlight the answer the user actually selected
    const showCorrectFeedback = isLocked && wasAttempted && isCorrectAnswer;
    const showWrongFeedback = isLocked && wasAttempted && !isCorrectAnswer;

    // Bordered, rounded option row matching the Recurring Patterns quiz specimen.
    const rowBorderColor = showCorrectFeedback
      ? "success.main"
      : showWrongFeedback
        ? "error.main"
        : checked
          ? "primary.main"
          : "divider";
    const rowBgColor = (theme) =>
      showCorrectFeedback
        ? alpha(
            theme.palette.success.main,
            theme.palette.mode === "dark" ? 0.32 : 0.24,
          )
        : showWrongFeedback
          ? alpha(
              theme.palette.error.main,
              theme.palette.mode === "dark" ? 0.32 : 0.24,
            )
          : checked && !isLocked
            ? alpha(
                theme.palette.primary.main,
                theme.palette.mode === "dark" ? 0.22 : 0.12,
              )
            : "transparent";

    return (
      <FormControlLabel
        key={key}
        data-tour="quiz-answers"
        control={
          <Checkbox
            checked={checked}
            disabled={isLocked}
            onChange={async (e) => {
              onToggle(e, key, item);
            }}
            sx={{
              borderRadius: `${SEMANTIC_THEME.radius.chip}px`,
              "&.Mui-disabled": {
                color: showCorrectFeedback
                  ? "success.main"
                  : showWrongFeedback
                    ? "error.main"
                    : "text.disabled",
                opacity: 1,
              },
            }}
          />
        }
        label={
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {item.answer}
            {showCorrectFeedback && (
              <CheckCircleIcon sx={{ fontSize: 18, color: "success.main" }} />
            )}
            {showWrongFeedback && (
              <WarningIcon sx={{ fontSize: 18, color: "error.main" }} />
            )}
          </Box>
        }
        sx={{
          m: 0,
          width: "100%",
          px: 1,
          py: 0.5,
          borderRadius: `${SEMANTIC_THEME.radius.control}px`,
          border: "1px solid",
          borderColor: rowBorderColor,
          bgcolor: rowBgColor,
          transition: "border-color 0.15s, background-color 0.15s",
          color: "text.primary",
          "& .MuiFormControlLabel-label.Mui-disabled": {
            color: wasAttempted ? "text.primary" : "text.disabled",
          },
        }}
      />
    );
  });

  return (
    <div
      className={className}
      data-tour="quiz-block"
      // Don't use contentEditable={false} as it blocks child interactions
      suppressContentEditableWarning={true}
      style={{ userSelect: "none" }}
    >
      <ExerciseBlockCard blockType="quiz" accuracy={accuracy} graded={graded}>
        {gradeDisplayText ? (
          <QuizProgressMeters
            percentComplete={percentComplete}
            accuracy={accuracy}
            hasAttempts={hasAttempts}
          />
        ) : null}
        <FormGroup sx={{ gap: 0.75 }}>{checkboxes}</FormGroup>
      </ExerciseBlockCard>
    </div>
  );
}
