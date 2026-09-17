import React from "react";
import { useDrag, useDrop } from "react-dnd";
import { DndProvider } from "react-dnd-multi-backend";
import { HTML5toTouch } from "rdndmb-html5-to-touch";
import { Box, Checkbox, IconButton, Tooltip } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ClearIcon from "@mui/icons-material/Clear";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import TextField from "@mui/material/TextField";
import { useTranslations } from "next-intl";
import { SEMANTIC_THEME } from "../themes/semanticTheme";

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

export default function SortableAnswers({
  answers,
  onQuestionChange,
  onCorrectChange,
  onQuestionDelete,
  onQuestionReorder,
}) {
  function list() {
    console.log("answers", answers);
    const _answers = answers || [];
    return _answers.map((answer, index) => (
      <Answer
        data={answer}
        answers={answers}
        index={index}
        key={index}
        onQuestionChange={onQuestionChange}
        onCorrectChange={onCorrectChange}
        onQuestionDelete={onQuestionDelete}
        onQuestionReorder={onQuestionReorder}
      />
    ));
  }

  return <DndProvider options={HTML5toTouch}>{list()}</DndProvider>;
}

function Answer({
  data,
  index,
  answers,
  onQuestionReorder,
  onQuestionChange,
  onCorrectChange,
  onQuestionDelete,
}) {
  const t = useTranslations("components");
  const tCommon = useTranslations("common");
  console.log("Answer", data);
  const [{ isDragging }, drag] = useDrag({
    type: "answer",
    item: { type: "answer", id: index, index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: "answer",
    drop: (draggedItem, monitor) => {
      const draggedIndex = draggedItem.index;
      const droppedIndex = index;

      if (draggedIndex === droppedIndex) {
        return;
      }

      const newAnswers = reorder(answers, draggedIndex, droppedIndex);

      onQuestionReorder(newAnswers);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  return (
    <Box
      ref={drop}
      sx={{
        mb: 0.5,
        borderRadius: 1,
        bgcolor: isOver ? "action.hover" : "transparent",
        transition: "background-color 0.15s",
      }}
    >
      <Box ref={drag} sx={{ opacity: isDragging ? 0.5 : 1 }}>
        <Box
          sx={{
            position: "relative",
          }}
        >
          <DragIndicatorIcon
            fontSize="small"
            sx={{
              color: "text.disabled",
              opacity: 0.7,
              position: "absolute",
              left: { xs: 8, sm: 10 },
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
            }}
          />
          <Checkbox
            checked={Boolean(data.correct)}
            data-tour="correct-checkbox"
            onChange={(event) => onCorrectChange(event, index)}
            inputProps={{
              "aria-label": data.correct
                ? t("sortableAnswers.correct")
                : t("sortableAnswers.incorrect"),
            }}
            sx={{
              p: 0.5,
              m: 0,
              position: "absolute",
              left: { xs: 28, sm: 32 },
              top: "50%",
              transform: "translateY(-50%)",
              color: "text.secondary",
              zIndex: 2,
              "&.Mui-checked": { color: "success.main" },
            }}
          />
          <TextField
            aria-label={t("sortableAnswers.answerLabel", { number: index + 1 })}
            value={data.answer || ""}
            onChange={(event) => {
              onQuestionChange(event, index);
            }}
            inputRef={(input) => {
              if (input != null && !input?.value) {
                input.focus();
              }
            }}
            size="small"
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: `${SEMANTIC_THEME.radius.control}px`,
                bgcolor: "background.paper",
                "& input": {
                  pl: { xs: 6, sm: 6.5 },
                  pr: { xs: 8, sm: 8.5 },
                },
              },
            }}
          />
          {data.correct ? (
            <CheckCircleIcon
              color="success"
              fontSize="small"
              sx={{
                position: "absolute",
                right: { xs: 38, sm: 42 },
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
                pointerEvents: "none",
              }}
            />
          ) : (
            <WarningIcon
              color="action"
              fontSize="small"
              sx={{
                position: "absolute",
                right: { xs: 38, sm: 42 },
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
                pointerEvents: "none",
              }}
            />
          )}
          <Tooltip title={tCommon("actions.delete")}>
            <IconButton
              size="small"
              aria-label={tCommon("actions.delete")}
              onClick={() => onQuestionDelete(index)}
              sx={{
                position: "absolute",
                right: { xs: 4, sm: 6 },
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
              }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}
