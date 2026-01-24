import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  Divider,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CircleIcon from '@mui/icons-material/Circle';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import CodeIcon from '@mui/icons-material/Code';
import { useTheme } from '@mui/material/styles';
import { getOnboardingEmitter, UserPersona } from '../code/onboarding-events';
import { ONBOARDING_TASKS, getTasksForPersona, getTasksByCategory } from '../code/onboarding-tasks';

import './OnboardingPanel.css';

interface PersonaOption {
  id: UserPersona;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const PERSONAS: PersonaOption[] = [
  {
    id: 'instructor',
    label: 'Instructor',
    icon: <PersonIcon />,
    color: '#2196F3',
  },
  {
    id: 'learner',
    label: 'Learner',
    icon: <SchoolIcon />,
    color: '#4CAF50',
  },
  {
    id: 'developer',
    label: 'Developer',
    icon: <CodeIcon />,
    color: '#9C27B0',
  },
];

const OnboardingPanel: React.FC<{ api?: any }> = ({ api }) => {
  const theme = useTheme();
  const [selectedPersona, setSelectedPersona] = useState<UserPersona | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [completionPercentage, setCompletionPercentage] = useState(0);

  const emitter = getOnboardingEmitter();

  useEffect(() => {
    console.log('[OnboardingPanel] Panel mounted - select a persona to begin');
    
    // Load initial state
    const persona = emitter.getPersona();
    if (persona) {
      setSelectedPersona(persona);
      const completed = emitter.getCompletedTasks(persona);
      setCompletedTasks(new Set(completed.map((e) => e.taskId)));
      updateCompletionPercentage(persona);
    }

    // Subscribe to events
    const unsubscribe = emitter.on((event) => {
      if (event.type === 'persona-selected') {
        setSelectedPersona(event.persona);
        const completed = emitter.getCompletedTasks(event.persona);
        setCompletedTasks(new Set(completed.map((e) => e.taskId)));
        updateCompletionPercentage(event.persona);
      } else if (event.type === 'task-completed' && selectedPersona === event.persona) {
        setCompletedTasks((prev) => new Set([...prev, event.taskId]));
        updateCompletionPercentage(event.persona);
      }
    });

    return unsubscribe;
  }, [emitter, selectedPersona]);

  const updateCompletionPercentage = (persona: UserPersona) => {
    const percentage = emitter.getCompletionPercentage(persona, ONBOARDING_TASKS);
    setCompletionPercentage(percentage);
  };

  const handlePersonaSelect = (persona: UserPersona) => {
    setSelectedPersona(persona);
    emitter.setPersona(persona);
  };

  const handleTaskComplete = (taskId: string) => {
    if (!selectedPersona) return;

    const isCompleted = completedTasks.has(taskId);
    if (!isCompleted) {
      emitter.emit({
        type: 'task-completed',
        taskId,
        persona: selectedPersona,
        timestamp: Date.now(),
      });
    }
  };

  const handleResetProgress = () => {
    if (window.confirm('Are you sure you want to reset all onboarding progress?')) {
      emitter.reset();
      setSelectedPersona(null);
      setCompletedTasks(new Set());
      setCompletionPercentage(0);
      setTabValue(0);
    }
  };

  const renderContent = () => {
    if (!selectedPersona) {
      return renderPersonaSelection();
    }
    return renderTaskView();
  };

  const renderPersonaSelection = () => (
    <Paper className="onboarding-panel" sx={{ bgcolor: 'background.paper' }}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
          Welcome to Homework Supply
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Select your role to see personalized onboarding tasks
        </Typography>

        <Stack spacing={2}>
          {PERSONAS.map((persona) => (
            <Card
              key={persona.id}
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderLeft: `4px solid ${persona.color}`,
                '&:hover': {
                  boxShadow: 3,
                },
              }}
              onClick={() => handlePersonaSelect(persona.id)}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ color: persona.color, fontSize: 32 }}>{persona.icon}</Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {persona.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Click to start onboarding
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>

        <Divider sx={{ my: 3 }} />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          You can switch roles anytime by selecting a different persona below.
        </Typography>
      </Box>
    </Paper>
  );

  const renderTaskView = () => {
    const persona = PERSONAS.find((p) => p.id === selectedPersona)!;
    const tasks = getTasksForPersona(selectedPersona);
    const tasksByCategory = getTasksByCategory(selectedPersona);
    const categories = Object.keys(tasksByCategory);

    return (
    <Paper className="onboarding-panel" sx={{ bgcolor: 'background.paper' }}>
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Box sx={{ color: persona.color, fontSize: 24 }}>{persona.icon}</Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {persona.label} Onboarding
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {completedTasks.size} of {tasks.length} tasks completed
            </Typography>
          </Box>
          <Tooltip title="Change role">
            <Button
              size="small"
              variant="outlined"
              onClick={() => setSelectedPersona(null)}
              sx={{ textTransform: 'none' }}
            >
              Change
            </Button>
          </Tooltip>
        </Box>

        {/* Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={completionPercentage}
          sx={{ mb: 2, height: 8, borderRadius: 1 }}
        />
        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2, display: 'block' }}>
          {completionPercentage}% Complete
        </Typography>

        {/* Quick Stats */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip
            label={`${completedTasks.size} Completed`}
            icon={<CheckCircleIcon />}
            color="success"
            variant="outlined"
            size="small"
          />
          <Chip
            label={`${tasks.length - completedTasks.size} Remaining`}
            icon={<CircleIcon />}
            color="default"
            variant="outlined"
            size="small"
          />
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Task Tabs by Category */}
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2, minHeight: 36 }}
        >
          {categories.map((category, index) => (
            <Tab
              key={category}
              label={`${category} (${tasksByCategory[category].filter((t) => completedTasks.has(t.id)).length}/${tasksByCategory[category].length})`}
              sx={{ textTransform: 'none', fontSize: '0.85rem' }}
            />
          ))}
        </Tabs>

        {/* Task List for Current Tab */}
        <Box sx={{ mb: 2 }}>
          {categories.length > 0 && (
            <Stack spacing={1.5}>
              {tasksByCategory[categories[tabValue]].map((task) => {
                const isCompleted = completedTasks.has(task.id);
                return (
                  <Card
                    key={task.id}
                    sx={{
                      opacity: isCompleted ? 0.7 : 1,
                      transition: 'all 0.2s ease',
                      backgroundColor: isCompleted ? 'rgba(76, 175, 80, 0.05)' : 'transparent',
                    }}
                  >
                    <CardContent sx={{ p: 1.5 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <Checkbox
                          checked={isCompleted}
                          onChange={() => handleTaskComplete(task.id)}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 500,
                              textDecoration: isCompleted ? 'line-through' : 'none',
                              color: isCompleted ? 'text.secondary' : 'text.primary',
                            }}
                          >
                            {task.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
                          >
                            {task.description}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.disabled',
                              display: 'block',
                              mt: 0.5,
                            }}
                          >
                            ⏱ {Math.round(task.estimatedTime / 60)} mins
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Actions */}
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={handleResetProgress}
            fullWidth
            sx={{ textTransform: 'none' }}
          >
            Reset Progress
          </Button>
        </Stack>
      </Box>
    </Paper>
    );
  };

  return (
    <Box sx={{ 
      height: '100%',
      bgcolor: '#292929', // Storybook dark theme background
      border: '1px solid #3d3d3d', // Storybook border color
      borderRadius: 1,
      overflow: 'hidden',
    }}>
      {renderContent()}
    </Box>
  );
};

export default OnboardingPanel;
