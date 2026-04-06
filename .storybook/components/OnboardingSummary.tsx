import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, LinearProgress, Stack, Chip, Divider, ThemeProvider, createTheme } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import CodeIcon from '@mui/icons-material/Code';
import { useTheme as useStorybookTheme } from 'storybook/theming';
import { getOnboardingEmitter, UserPersona } from '../code/onboarding-events';
import { ONBOARDING_TASKS, getTasksForPersona } from '../code/onboarding-tasks';

function buildMuiTheme(isDark: boolean) {
  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      background: {
        paper: isDark ? '#1a1a1a' : '#ffffff',
        default: isDark ? '#1a1a1a' : '#f6f9fc',
      },
      text: {
        primary: isDark ? '#e0e0e0' : '#2E3338',
        secondary: isDark ? '#999999' : '#5C6570',
      },
    },
  });
}

interface OnboardingSummaryProps {
  api?: any;
  onClick?: () => void;
}

const OnboardingSummary: React.FC<OnboardingSummaryProps> = ({ api, onClick }) => {
  const emitter = getOnboardingEmitter();

  // Derive MUI theme from Storybook theme
  let sbTheme: any;
  try { sbTheme = useStorybookTheme(); } catch { sbTheme = null; }
  const isDark = sbTheme?.base === 'dark' || (sbTheme == null && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  const muiTheme = useMemo(() => buildMuiTheme(isDark), [isDark]);
  
  // Initialize state from emitter synchronously to avoid flash
  const initialPersona = emitter.getPersona();
  const [persona, setPersona] = useState<UserPersona | null>(initialPersona);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(() => {
    if (initialPersona) {
      const completed = emitter.getCompletedTasks(initialPersona);
      return new Set(completed.map((e) => e.taskId));
    }
    return new Set();
  });
  const [percentage, setPercentage] = useState(() => {
    if (initialPersona) {
      return emitter.getCompletionPercentage(initialPersona, ONBOARDING_TASKS);
    }
    return 0;
  });

  useEffect(() => {
    const unsubscribe = emitter.on((event) => {
      if (event.type === 'persona-selected') {
        setPersona(event.persona);
        const completed = emitter.getCompletedTasks(event.persona);
        setCompletedTasks(new Set(completed.map((e) => e.taskId)));
        const pct = emitter.getCompletionPercentage(event.persona, ONBOARDING_TASKS);
        setPercentage(pct);
      } else if (event.type === 'task-completed' && persona === event.persona) {
        setCompletedTasks((prev) => new Set([...prev, event.taskId]));
        const pct = emitter.getCompletionPercentage(event.persona, ONBOARDING_TASKS);
        setPercentage(pct);
      }
    });

    return unsubscribe;
  }, [emitter, persona]);

  const handleClick = () => {
    if (api) {
      api.togglePanel(true);
      api.setSelectedPanel('storybook/addon-onboarding-custom/panel');
    }
    if (onClick) {
      onClick();
    }
  };

  const personas = [
    { id: 'instructor' as UserPersona, label: 'Instructor', icon: <PersonIcon sx={{ fontSize: 16 }} />, color: '#2196F3' },
    { id: 'learner' as UserPersona, label: 'Learner', icon: <SchoolIcon sx={{ fontSize: 16 }} />, color: '#4CAF50' },
    { id: 'developer' as UserPersona, label: 'Developer', icon: <CodeIcon sx={{ fontSize: 16 }} />, color: '#9C27B0' },
  ];

  const handlePersonaSelect = (selectedPersona: UserPersona) => {
    emitter.setPersona(selectedPersona);
  };

  if (!persona) {
    return (
      <ThemeProvider theme={muiTheme}>
      <Box
        sx={{
          p: 2,
          bgcolor: 'transparent',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5, textTransform: 'uppercase', fontSize: '0.7rem' }}>
          Select Persona
        </Typography>
        <Stack spacing={1}>
          {personas.map((p) => (
            <Box
              key={p.id}
              onClick={() => handlePersonaSelect(p.id)}
              sx={{
                p: 1,
                borderLeft: `3px solid ${p.color}`,
                bgcolor: 'action.hover',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                '&:hover': {
                  bgcolor: 'action.selected',
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ color: p.color }}>{p.icon}</Box>
                <Typography variant="caption" sx={{ color: 'text.primary', fontSize: '0.75rem' }}>
                  {p.label}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
      </ThemeProvider>
    );
  }

  const tasks = getTasksForPersona(persona);
  const nextTasks = tasks.filter((t) => !completedTasks.has(t.id)).slice(0, 2);

  return (
    <ThemeProvider theme={muiTheme}>
    <Box
      onClick={handleClick}
      sx={{
        p: 2,
        bgcolor: 'transparent',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: 'action.hover',
          borderColor: 'action.selected',
        },
      }}
    >
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>
          Onboarding
        </Typography>
        <Chip
          label={`${percentage}%`}
          size="small"
          sx={{
            bgcolor: percentage === 100 ? 'success.main' : 'action.disabledBackground',
            color: 'common.white',
            fontSize: '0.7rem',
            height: '20px',
          }}
        />
      </Stack>

      {/* Progress Bar */}
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          mb: 1.5,
          height: 4,
          borderRadius: 2,
          bgcolor: 'action.disabledBackground',
          '& .MuiLinearProgress-bar': {
            bgcolor: percentage === 100 ? 'success.main' : 'primary.main',
          },
        }}
      />

      {/* Next Tasks */}
      {nextTasks.length > 0 ? (
        <Stack spacing={0.75}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
            Up Next:
          </Typography>
          {nextTasks.map((task) => (
            <Stack key={task.id} direction="row" spacing={0.5} alignItems="flex-start">
              <CircleOutlinedIcon sx={{ fontSize: 12, color: 'text.disabled', mt: 0.3 }} />
              <Typography variant="caption" sx={{ color: 'text.primary', fontSize: '0.75rem', lineHeight: 1.3 }}>
                {task.title}
              </Typography>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
          <Typography variant="caption" sx={{ color: 'success.main', fontSize: '0.75rem' }}>
            All tasks completed!
          </Typography>
        </Stack>
      )}

      {/* Hint */}
      <Typography
        variant="caption"
        sx={{
          color: 'text.disabled',
          fontSize: '0.65rem',
          display: 'block',
          mt: 1,
          fontStyle: 'italic',
        }}
      >
        Click to view all tasks →
      </Typography>
    </Box>
    </ThemeProvider>
  );
};

export default OnboardingSummary;
