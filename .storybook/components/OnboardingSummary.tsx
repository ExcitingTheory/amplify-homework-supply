import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, Stack, Chip, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import CodeIcon from '@mui/icons-material/Code';
import { getOnboardingEmitter, UserPersona } from '../code/onboarding-events';
import { ONBOARDING_TASKS, getTasksForPersona } from '../code/onboarding-tasks';

interface OnboardingSummaryProps {
  api?: any;
  onClick?: () => void;
}

const OnboardingSummary: React.FC<OnboardingSummaryProps> = ({ api, onClick }) => {
  const emitter = getOnboardingEmitter();
  
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
      <Box
        sx={{
          p: 2,
          bgcolor: 'transparent',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 1,
        }}
      >
        <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 1.5, textTransform: 'uppercase', fontSize: '0.7rem' }}>
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
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ color: p.color }}>{p.icon}</Box>
                <Typography variant="caption" sx={{ color: '#ccc', fontSize: '0.75rem' }}>
                  {p.label}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
    );
  }

  const tasks = getTasksForPersona(persona);
  const nextTasks = tasks.filter((t) => !completedTasks.has(t.id)).slice(0, 2);

  return (
    <Box
      onClick={handleClick}
      sx={{
        p: 2,
        bgcolor: 'transparent',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 1,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.15)',
        },
      }}
    >
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="caption" sx={{ color: '#999', textTransform: 'uppercase', fontSize: '0.7rem' }}>
          Onboarding
        </Typography>
        <Chip
          label={`${percentage}%`}
          size="small"
          sx={{
            bgcolor: percentage === 100 ? '#4caf50' : '#666',
            color: '#fff',
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
          bgcolor: '#444',
          '& .MuiLinearProgress-bar': {
            bgcolor: percentage === 100 ? '#4caf50' : '#2196F3',
          },
        }}
      />

      {/* Next Tasks */}
      {nextTasks.length > 0 ? (
        <Stack spacing={0.75}>
          <Typography variant="caption" sx={{ color: '#888', fontSize: '0.7rem' }}>
            Up Next:
          </Typography>
          {nextTasks.map((task) => (
            <Stack key={task.id} direction="row" spacing={0.5} alignItems="flex-start">
              <CircleOutlinedIcon sx={{ fontSize: 12, color: '#666', mt: 0.3 }} />
              <Typography variant="caption" sx={{ color: '#bbb', fontSize: '0.75rem', lineHeight: 1.3 }}>
                {task.title}
              </Typography>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <CheckCircleIcon sx={{ fontSize: 14, color: '#4caf50' }} />
          <Typography variant="caption" sx={{ color: '#4caf50', fontSize: '0.75rem' }}>
            All tasks completed!
          </Typography>
        </Stack>
      )}

      {/* Hint */}
      <Typography
        variant="caption"
        sx={{
          color: '#666',
          fontSize: '0.65rem',
          display: 'block',
          mt: 1,
          fontStyle: 'italic',
        }}
      >
        Click to view all tasks →
      </Typography>
    </Box>
  );
};

export default OnboardingSummary;
