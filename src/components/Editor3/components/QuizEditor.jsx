import React, { useState, useRef, useEffect, useContext } from "react";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import ClearIcon from "@mui/icons-material/Clear";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import EditIcon from "@mui/icons-material/Edit";
import { alpha } from "@mui/material/styles";
import { useTranslations } from "next-intl";
// import { GutterContext } from '../context/gutterContext';
import SortableAnswers from "../../SortableAnswers";
import UnitContext from "../../../context/unitContext";
import { $isQuizNode } from "../plugins/QuizPlugin";
import { ExerciseBlockCard } from "./ExerciseBlockCard";
import { QuizProgressMeters } from "./QuizProgressMeters";
import { SEMANTIC_THEME } from "../../../themes/semanticTheme";

import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ESCAPE_COMMAND,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";

const QuizEditor = ({ className, nodeKey, data }) => {
  const t = useTranslations("editor.blocks");
  const [editMode, setEditMode] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [grade, setGrade] = useState(0.0);
  const [attemptedAnswers, setAttemptedAnswers] = useState({});
  const [correct, setCorrect] = useState({});
  //   const questionValue = useRef(data);
  const [questionValue, _setQuestionValue] = useState(data);
  const [invalidQuestion, setInvalidQuestion] = useState(false);
  const [verifiedAnswers, setVerifiedAnswers] = useState({});

  const [editor] = useLexicalComposerContext();
  const quizRef = useRef(null);
  const { grade: contextGrade, saveGrade } = useContext(UnitContext);
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);

  const onDelete = React.useCallback(
    (payload) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        const event = payload;
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isQuizNode(node)) {
          node.remove();
        }
      }
      return false;
    },
    [isSelected, nodeKey],
  );

  const onEscape = React.useCallback(
    (payload) => {
      if (isSelected) {
        const event = payload;
        event.preventDefault();
        clearSelection();
        return true;
      }
      return false;
    },
    [isSelected, clearSelection],
  );

  const setQuestionValue = (data) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isQuizNode(node)) {
        node.saveData(data);
      }
    });
  };

  useEffect(() => {
    _setQuestionValue(data);
  }, [data]);

  useEffect(() => {
    const unregister = mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (payload) => {
          const event = payload;
          if (quizRef.current && quizRef.current.contains(event.target)) {
            // Let interactive form elements (Switch, Checkbox, Button, etc.) handle their own clicks.
            // Use closest() to walk up the DOM — MUI Switch renders <span> elements
            // (thumb, track) that don't have interactive tags/roles on the direct target.
            if (
              event.target.closest(
                'input, button, textarea, [role="checkbox"], [role="switch"], [role="button"], label',
              )
            ) {
              return false;
            }
            event.preventDefault();
            if (event.shiftKey) {
              setSelected(!isSelected);
            } else {
              clearSelection();
              setSelected(true);
            }
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        onEscape,
        COMMAND_PRIORITY_LOW,
      ),
    );
    return () => {
      unregister();
    };
  }, [
    clearSelection,
    editor,
    isSelected,
    nodeKey,
    onDelete,
    onEscape,
    setSelected,
  ]);

  useEffect(() => {
    // Restore progress from UnitContext if nodeKey is provided
    if (nodeKey && contextGrade) {
      const inProgress = contextGrade?.data?.[nodeKey] || {};
      if (inProgress.attemptedAnswers || inProgress.verifiedAnswers) {
        setAttemptedAnswers(inProgress.attemptedAnswers || {});
        setVerifiedAnswers(inProgress.verifiedAnswers || {});
        setGrade(inProgress.accuracy || 0);
        setIsLocked(inProgress.complete || false);
      }
    }
  }, [nodeKey, contextGrade]);

  const onClick = () => {
    if (editMode) {
      return;
    }

    setEditMode(true);
    startEdit();
  };

  const onValueChange = (evt) => {
    let value = evt.target.value;
    let invalid = false;
    setInvalidQuestion(invalid);
    _setQuestionValue(value);
    setQuestionValue(value);
  };

  const onCorrectChange = (evt, id) => {
    let checked = evt.target.checked;
    let tmp = JSON.parse(JSON.stringify(questionValue));
    tmp[id].correct = checked;
    _setQuestionValue(tmp);
    setQuestionValue(tmp);
  };

  const onQuestionChange = (evt, id) => {
    let value = evt.target.value;
    let tmp = JSON.parse(JSON.stringify(questionValue));
    tmp[id].answer = value;
    _setQuestionValue(tmp);
    setQuestionValue(tmp);
  };

  const gradeAnswer = async (e, thisKey, thisAnswer, questionContent) => {
    e.preventDefault();
    e.stopPropagation();
    const { correct: isCorrect } = thisAnswer;
    const isChecked = e.target.checked;

    let _verifiedAnswers = { ...verifiedAnswers };
    let _attemptedAnswers = { ...attemptedAnswers };
    let _isLocked = isLocked;
    let _grade = grade;
    let _correct = {};

    if (!_verifiedAnswers) {
      _verifiedAnswers = {};
    }
    if (!_attemptedAnswers) {
      _attemptedAnswers = {};
    }

    questionContent.forEach((question, questionKey) => {
      if (question.correct === true) {
        _correct[questionKey] = question;
      }
    });

    _attemptedAnswers[thisKey] = thisAnswer;

    if (isCorrect === true && isChecked === true) {
      _verifiedAnswers[thisKey] = thisAnswer;
    } else if (isCorrect === true && isChecked === false) {
      delete _verifiedAnswers[thisKey];
      delete _attemptedAnswers[thisKey];
    } else if (isCorrect === false && isChecked === false) {
      delete _attemptedAnswers[thisKey];
    }

    const correctArr = Object.entries(_correct);
    const verifiedArr = Object.entries(_verifiedAnswers);
    const attemptedArr = Object.entries(_attemptedAnswers);

    _grade = Math.floor((verifiedArr.length / correctArr.length) * 100);
    let thisExerciseComplete = false;

    if (attemptedArr.length === correctArr.length) {
      _isLocked = true;
    }

    if (verifiedArr.length === correctArr.length) {
      _isLocked = true;
      thisExerciseComplete = true;
    }

    // Save completion tracking to UnitContext
    if (nodeKey && saveGrade) {
      try {
        let savedGradeCopy = JSON.parse(
          JSON.stringify(contextGrade?.data || {}),
        );

        savedGradeCopy[nodeKey] = {
          accuracy: _grade,
          attemptedAnswers: _attemptedAnswers,
          verifiedAnswers: _verifiedAnswers,
          complete: thisExerciseComplete,
          percentComplete: Math.floor(
            (attemptedArr.length / correctArr.length) * 100,
          ),
        };

        await saveGrade(savedGradeCopy);
      } catch (error) {
        console.error("Failed to save grade progress for QuizEditor:", error);
        // Continue with local state update even if save fails
      }
    }

    setAttemptedAnswers(_attemptedAnswers);
    setVerifiedAnswers(_verifiedAnswers);
    setIsLocked(_isLocked);
    setCorrect(_correct);
    setGrade(_grade);
  };

  const onQuestionReorder = (answers) => {
    _setQuestionValue(answers);
    setQuestionValue(answers);
  };

  const onQuestionDelete = (id) => {
    let tmp = JSON.parse(JSON.stringify(questionValue));
    tmp.splice(id, 1);
    _setQuestionValue(tmp);
    setQuestionValue(tmp);
  };

  const onAddQuestion = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    let tmp = JSON.parse(JSON.stringify(questionValue));

    const nextId = tmp.length + 1;
    tmp.push({
      id: `id-${nextId}`,
      answer: "",
      correct: false,
    });

    setQuestionValue(tmp);
  };

  const save = () => {
    setQuestionValue(questionValue);
    setInvalidQuestion(false);
    setEditMode(false);
  };

  const reset = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAttemptedAnswers({});
    setVerifiedAnswers({});
    setIsLocked(false);
    setGrade(0.0);
  };

  const remove = () => {
    console.log("remove");
  };

  const startEdit = () => {
    console.log("startEdit");
  };

  const correctCount = (questionValue || []).filter(
    (q) => q && q.correct === true,
  ).length;
  const attemptedCount = Object.keys(attemptedAnswers || {}).length;
  const percentComplete =
    correctCount > 0 ? Math.floor((attemptedCount / correctCount) * 100) : 0;

  let checkboxes = [];

  if (questionValue && questionValue.length > 0) {
    checkboxes = questionValue.map((data, key) => {
      const _attemptedAnswers = attemptedAnswers || {};
      const checked = _attemptedAnswers[key] != null;
      const isCorrectAnswer = data.correct === true;
      const showCorrectFeedback = isLocked && checked && isCorrectAnswer;
      const showWrongFeedback = isLocked && checked && !isCorrectAnswer;
      const feedbackColor = showCorrectFeedback
        ? "success.main"
        : showWrongFeedback
          ? "error.main"
          : "primary.main";
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
          data-testid="quiz-answer-option"
          control={
            <Checkbox
              checked={checked}
              disabled={isLocked}
              onClick={(e) => {
                gradeAnswer(e, key, data, questionValue);
              }}
              sx={{
                borderRadius: `${SEMANTIC_THEME.radius.chip}px`,
                "&.Mui-disabled": {
                  color: feedbackColor,
                  opacity: 1,
                },
              }}
            />
          }
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {data.answer}
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
              color: checked ? "text.primary" : "text.disabled",
            },
          }}
        />
      );
    });
  }

  return (
    <div
      ref={quizRef}
      className={className}
      data-tour="quiz-block"
      contentEditable={false}
      readOnly
      style={{ cursor: "pointer" }}
    >
      <style global jsx>{`
        figure[data-block="true"] {
          margin: 0;
        }
      `}</style>
      <ExerciseBlockCard
        blockType="quiz"
        selected={isSelected}
        accuracy={grade}
        graded={isLocked}
      >
        {!editMode && (
          <>
            <QuizProgressMeters
              percentComplete={percentComplete}
              accuracy={grade}
              hasAttempts={attemptedCount > 0}
            />
            <FormGroup sx={{ gap: 0.75 }}>{checkboxes}</FormGroup>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                mt: 1.5,
              }}
            >
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={reset}
              >
                {t("quizEditor.reset")}
              </Button>
              <Button
                data-testid="quiz-edit-toggle"
                size="small"
                variant="contained"
                startIcon={<EditIcon />}
                onClick={onClick}
              >
                {t("quizEditor.edit")}
              </Button>
            </Box>
          </>
        )}
        {editMode && (
          <>
            <SortableAnswers
              answers={questionValue}
              onQuestionChange={onQuestionChange}
              onCorrectChange={onCorrectChange}
              onQuestionDelete={onQuestionDelete}
              onQuestionReorder={onQuestionReorder}
            />
            <Box
              sx={{
                mt: 0.5,
                position: "relative",
              }}
            >
              <DragIndicatorIcon
                color="disabled"
                fontSize="small"
                sx={{
                  opacity: 0.7,
                  position: "absolute",
                  left: { xs: 8, sm: 10 },
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <Checkbox
                disabled
                sx={{
                  p: 0.5,
                  m: 0,
                  position: "absolute",
                  left: { xs: 28, sm: 32 },
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <TextField
                data-testid="quiz-add-answer"
                placeholder={t("quizEditor.addAnswer")}
                onClick={onAddQuestion}
                size="small"
                fullWidth
                variant="standard"
                aria-label={t("quizEditor.addAnswer")}
                sx={{
                  "& .MuiInput-root": {
                    border: "1px dashed",
                    borderColor: "divider",
                    borderRadius: `${SEMANTIC_THEME.radius.control}px`,
                    bgcolor: "transparent",
                    px: 1,
                    py: 0.5,
                  },
                  "& input": {
                    pl: { xs: 5, sm: 5.5 },
                    pr: { xs: 5, sm: 5.5 },
                  },
                }}
                slotProps={{
                  input: {
                    disableUnderline: true,
                    sx: { px: 0.5 },
                  },
                }}
              />
              <IconButton
                disabled
                size="small"
                aria-hidden="true"
                sx={{
                  position: "absolute",
                  right: { xs: 4, sm: 6 },
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
              <Button
                data-testid="quiz-edit-toggle"
                size="small"
                variant="contained"
                disabled={invalidQuestion}
                onClick={save}
              >
                {invalidQuestion
                  ? t("quizEditor.invalid")
                  : t("quizEditor.done")}
              </Button>
            </Box>
          </>
        )}
      </ExerciseBlockCard>
    </div>
  );
};

export default QuizEditor;
