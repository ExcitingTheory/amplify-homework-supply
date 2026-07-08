import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  Collapse,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import TranslateIcon from "@mui/icons-material/Translate";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { getOnboardingEmitter } from "../code/onboarding-events";
import { ONBOARDING_TASKS, getTasksForPersona } from "../code/onboarding-tasks";
import "./OnboardingSidebar.css";

const PERSONAS = [
  {
    id: "instructor",
    label: "Instructor",
    icon: <PersonIcon fontSize="small" />,
    color: "#2196F3",
  },
  {
    id: "learner",
    label: "Learner",
    icon: <SchoolIcon fontSize="small" />,
    color: "#4CAF50",
  },
  {
    id: "translator",
    label: "Translator",
    icon: <TranslateIcon fontSize="small" />,
    color: "#FF9800",
  },
];

const OnboardingSidebar = ({ api }) => {
  const theme = useTheme();
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [completionPercentage, setCompletionPercentage] = useState(0);

  const emitter = getOnboardingEmitter();

  useEffect(() => {
    // Load initial state
    const persona = emitter.getPersona();
    if (persona) {
      setSelectedPersona(persona);
      const completed = emitter.getCompletedTasks(persona, ONBOARDING_TASKS);
      setCompletedTasks(new Set(completed.map((e) => e.taskId)));
      updateCompletionPercentage(persona);
    }

    // Subscribe to events
    const unsubscribe = emitter.on((event) => {
      if (event.type === "persona-selected") {
        setSelectedPersona(event.persona);
        const completed = emitter.getCompletedTasks(
          event.persona,
          ONBOARDING_TASKS,
        );
        setCompletedTasks(new Set(completed.map((e) => e.taskId)));
        updateCompletionPercentage(event.persona);
        setExpanded(true); // Auto-expand on persona select
      } else if (event.type === "task-completed") {
        if (event.persona === selectedPersona) {
          setCompletedTasks((prev) => new Set([...prev, event.taskId]));
        } else if (selectedPersona) {
          // Cross-persona completion — re-derive to pick up shared "all" tasks
          const completed = emitter.getCompletedTasks(
            selectedPersona,
            ONBOARDING_TASKS,
          );
          setCompletedTasks(new Set(completed.map((e) => e.taskId)));
        }
        updateCompletionPercentage(selectedPersona || event.persona);
      }
    });

    return unsubscribe;
  }, [emitter, selectedPersona]);

  const updateCompletionPercentage = (persona) => {
    const percentage = emitter.getCompletionPercentage(
      persona,
      ONBOARDING_TASKS,
    );
    setCompletionPercentage(percentage);
  };

  const handlePersonaSelect = (personaId) => {
    setSelectedPersona(personaId);
    emitter.setPersona(personaId);
    setExpanded(true);
  };

  const handleOpenPanel = () => {
    // Navigate to the onboarding panel
    api.setSelectedPanel("storybook/addon-onboarding-custom/panel");
  };

  const persona = PERSONAS.find((p) => p.id === selectedPersona);
  const tasks = selectedPersona ? getTasksForPersona(selectedPersona) : [];

  if (!selectedPersona) {
    return (
      <Box
        className="onboarding-sidebar"
        sx={{ bgcolor: theme.palette.background.paper }}
      >
        <Box className="onboarding-role-header">
          <Box className="onboarding-role-icon" sx={{ fontSize: "1.2rem" }}>
            📚
          </Box>
          <Typography
            component="span"
            sx={{
              fontWeight: 600,
              fontSize: "0.875rem",
              color: theme.palette.text.primary,
            }}
          >
            Select Your Role
          </Typography>
        </Box>
        <Stack spacing={0.75}>
          {PERSONAS.map((p) => (
            <Button
              key={p.id}
              onClick={() => handlePersonaSelect(p.id)}
              sx={{
                justifyContent: "flex-start",
                textTransform: "none",
                color: theme.palette.text.primary,
                px: 1.5,
                py: 1,
                fontSize: "0.875rem",
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.03)",
                borderRadius: "6px",
                border: `1px solid ${theme.palette.divider}`,
                "&:hover": {
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.06)",
                  borderColor: p.color,
                },
              }}
              startIcon={
                <Box sx={{ color: p.color, display: "flex" }}>{p.icon}</Box>
              }
              ariaLabel={false}
            >
              {p.label}
            </Button>
          ))}
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      className="onboarding-sidebar"
      sx={{ bgcolor: theme.palette.background.paper }}
    >
      {/* Persona Header */}
      <Box
        sx={{
          mb: 1,
          cursor: "pointer",
          borderRadius: "6px",
          p: 1.5,
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.02)",
          "&:hover": {
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.05)",
          },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ color: persona.color, display: "flex" }}>
            {persona.icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                fontWeight: 600,
                fontSize: "0.7rem",
                color: theme.palette.text.secondary,
                textTransform: "uppercase",
              }}
            >
              {persona.label}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.65rem",
                color: theme.palette.text.disabled,
              }}
            >
              {completionPercentage}% Complete
            </Typography>
          </Box>
          <Button
            size="small"
            sx={{
              p: 0,
              minWidth: "auto",
              color: "inherit",
            }}
            ariaLabel="Toggle onboarding tasks"
          >
            {expanded ? (
              <ExpandLessIcon fontSize="small" />
            ) : (
              <ExpandMoreIcon fontSize="small" />
            )}
          </Button>
        </Box>

        {/* Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={completionPercentage}
          sx={{
            mt: 1,
            height: 4,
            borderRadius: 2,
            bgcolor: "action.hover",
            "& .MuiLinearProgress-bar": {
              bgcolor: persona.color,
            },
          }}
        />
      </Box>

      {/* Expanded Content */}
      <Collapse in={expanded}>
        <Box sx={{ px: 2, py: 1.5 }}>
          {/* Stats */}
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            <Chip
              label={`${completedTasks.size} Done`}
              icon={<CheckCircleIcon />}
              size="small"
              sx={{
                height: 20,
                fontSize: "0.65rem",
                "& .MuiChip-icon": {
                  fontSize: "0.8rem",
                },
              }}
              color="success"
              variant="outlined"
            />
            <Chip
              label={`${tasks.length - completedTasks.size} Left`}
              size="small"
              sx={{
                height: 20,
                fontSize: "0.65rem",
              }}
              variant="outlined"
            />
          </Stack>

          {/* Actions */}
          <Stack spacing={0.5}>
            <Button
              fullWidth
              size="small"
              variant="contained"
              onClick={handleOpenPanel}
              sx={{
                textTransform: "none",
                fontSize: "0.75rem",
                py: 0.5,
                bgcolor: persona.color,
                "&:hover": {
                  bgcolor: persona.color,
                  filter: "brightness(0.9)",
                },
              }}
              ariaLabel={false}
            >
              View All Tasks
            </Button>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              onClick={() => {
                setSelectedPersona(null);
                emitter.reset();
              }}
              sx={{
                textTransform: "none",
                fontSize: "0.75rem",
                py: 0.5,
              }}
              ariaLabel={false}
            >
              Change Role
            </Button>
          </Stack>

          {/* Quick Task Preview */}
          {tasks.length > 0 && (
            <Box sx={{ mt: 1.5 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 0.5,
                  fontWeight: 600,
                  fontSize: "0.65rem",
                  color: "text.secondary",
                }}
              >
                Next Steps
              </Typography>
              {tasks
                .filter((t) => !completedTasks.has(t.id))
                .slice(0, 3)
                .map((task) => (
                  <Box
                    key={task.id}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 0.5,
                      mb: 0.5,
                      p: 0.5,
                      borderRadius: 0.5,
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: persona.color,
                        mt: 0.5,
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.65rem",
                        lineHeight: 1.3,
                        color: "text.secondary",
                      }}
                    >
                      {task.title}
                    </Typography>
                  </Box>
                ))}
              {tasks.filter((t) => !completedTasks.has(t.id)).length === 0 && (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 1,
                    px: 1,
                    bgcolor: "success.light",
                    borderRadius: 1,
                  }}
                >
                  <CheckCircleIcon
                    sx={{ fontSize: "1.5rem", color: "success.main", mb: 0.5 }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ display: "block", fontWeight: 600 }}
                  >
                    All Done! 🎉
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default OnboardingSidebar;
