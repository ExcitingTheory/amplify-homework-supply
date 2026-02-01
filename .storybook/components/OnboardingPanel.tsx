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
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  Divider,
  Chip,
  ThemeProvider,
  createTheme,
  Link,
  Collapse,
  IconButton,
  List,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CircleIcon from '@mui/icons-material/Circle';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import CodeIcon from '@mui/icons-material/Code';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LaunchIcon from '@mui/icons-material/Launch';
import { useTheme } from '@mui/material/styles';
import { getOnboardingEmitter, UserPersona } from '../code/onboarding-events';
import { ONBOARDING_TASKS, getTasksForPersona, getTasksByCategory, OnboardingTaskWithCriteria } from '../code/onboarding-tasks';

import './OnboardingPanel.css';

// Force dark theme for panel to match Storybook UI
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      paper: '#1a1a1a',
      default: '#1a1a1a',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#999999',
    },
  },
});

const CardOutline = styled('div')({
  position: 'relative',
  width: '100%',
  height: '100%',
  padding: 1,
  overflow: 'hidden',
  backgroundColor: '#1a1a1a',
  borderRadius: 4,
  boxShadow: 'inset 0 0 0 1px #3d3d3d',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
});

const CardContentWrapper = styled('div')({
  borderRadius: 4,
  backgroundColor: '#1a1a1a',
  position: 'relative',
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  color: '#e0e0e0',
  // Custom scrollbar styling
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: 'rgba(255, 255, 255, 0.3)',
  },
});

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
  const [mode, setMode] = useState<'tutorial' | 'quiz'>('tutorial');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

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

  const handleResetProgress = () => {
    if (window.confirm('Are you sure you want to reset all onboarding progress?')) {
      emitter.reset();
      setSelectedPersona(null);
      setCompletedTasks(new Set());
      setCompletionPercentage(0);
      setTabValue(0);
    }
  };

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const getStoryLink = (task: OnboardingTaskWithCriteria): string | null => {
    const storyId = task.completionCriteria?.storyId;
    if (!storyId) return null;
    
    // Convert story ID to URL path
    return `/?path=/story/${storyId}`;
  };

  const handleNavigateToStory = (storyId: string) => {
    if (api?.selectStory) {
      // Use Storybook API if available
      api.selectStory(storyId);
    } else {
      // Navigate directly
      window.parent.location.href = `/?path=/story/${storyId}`;
    }
  };

  const renderContent = () => {
    if (!selectedPersona) {
      return renderPersonaSelection();
    }
    return renderTaskView();
  };

  const renderPersonaSelection = () => (
    <>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', p: 3, pb: 0 }}>
        Welcome to Homework Supply
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', px: 3 }}>
        Select your role to see personalized onboarding tasks
      </Typography>

      <Stack spacing={2} sx={{ px: 3, pb: 3 }}>
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
    </>
  );

  const renderTaskView = () => {
    const persona = PERSONAS.find((p) => p.id === selectedPersona)!;
    const tasks = getTasksForPersona(selectedPersona);
    const tasksByCategory = getTasksByCategory(selectedPersona);
    const categories = Object.keys(tasksByCategory);

    return (
      <>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 2, pb: 0 }}>
          <Box sx={{ color: persona.color, fontSize: 24 }}>{persona.icon}</Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {persona.label} Onboarding
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {completedTasks.size} of {tasks.length} tasks completed
            </Typography>
          </Box>
          <Tooltip title="Learning mode">
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Chip
                label="Tutorial"
                size="small"
                color={mode === 'tutorial' ? 'primary' : 'default'}
                onClick={() => setMode('tutorial')}
                sx={{ cursor: 'pointer', fontSize: '0.7rem' }}
              />
              <Chip
                label="Quiz"
                size="small"
                color={mode === 'quiz' ? 'primary' : 'default'}
                onClick={() => setMode('quiz')}
                sx={{ cursor: 'pointer', fontSize: '0.7rem' }}
              />
            </Box>
          </Tooltip>
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
          sx={{ mb: 2, height: 8, borderRadius: 1, mx: 2 }}
        />
        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2, display: 'block', px: 2 }}>
          {completionPercentage}% Complete · {mode === 'tutorial' ? '📖 Tutorial Mode' : '🎯 Quiz Mode'}
        </Typography>

        {/* Quiz Mode Instructions */}
        {mode === 'quiz' && (
          <Box sx={{ mx: 2, mb: 2, p: 2, backgroundColor: 'rgba(33, 150, 243, 0.1)', borderRadius: 1, borderLeft: '4px solid #2196F3' }}>
            <Typography variant="caption" sx={{ color: 'text.primary', display: 'block', fontWeight: 600, mb: 0.5 }}>
              🎯 Quiz Mode Active
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Navigate to <strong>📄 Pages → Application Pages</strong> to practice using the actual app. Complete tasks to track progress below.
            </Typography>
          </Box>
        )}

        {/* Quick Stats */}
        <Stack direction="row" spacing={1} sx={{ mb: 2, px: 2 }}>
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

        {/* Task List */}
        <List>
          {tasks.map((task: OnboardingTaskWithCriteria) => {
                const isCompleted = completedTasks.has(task.id);
                const isExpanded = expandedTasks.has(task.id);
                const storyLink = getStoryLink(task);
                const hasInstructions = task.instructions && task.instructions.length > 0;
                
                return (
                  <Card
                    key={task.id}
                    sx={{
                      backgroundColor: isCompleted ? 'rgba(76, 175, 80, 0.05)' : 'transparent',
                    }}
                  >
                    <CardContent sx={{ p: 1.5, pb: hasInstructions || storyLink ? 1 : 1.5 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <Checkbox
                          checked={isCompleted}
                          disabled
                          size="small"
                          sx={{ mt: 0.5, cursor: 'default' }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <Box sx={{ flex: 1 }}>
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
                              
                              {/* Estimated time and mode indicator */}
                              <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
                                <Chip 
                                  label={`~${Math.ceil(task.estimatedTime / 60)} min`}
                                  size="small"
                                  sx={{ height: 18, fontSize: '0.65rem' }}
                                />
                                {mode === 'quiz' && storyLink && (
                                  <Chip 
                                    label="Practice Available"
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ height: 18, fontSize: '0.65rem' }}
                                  />
                                )}
                              </Box>
                            </Box>
                            
                            {(hasInstructions || storyLink) && (
                              <IconButton
                                size="small"
                                onClick={() => toggleTaskExpanded(task.id)}
                                sx={{
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.2s',
                                }}
                              >
                                <ExpandMoreIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>

                          {/* Expandable content */}
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                              {/* Instructions */}
                              {hasInstructions && (
                                <Box sx={{ mb: storyLink ? 1.5 : 0 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', display: 'block', mb: 0.5 }}>
                                    📋 Steps:
                                  </Typography>
                                  <Box component="ol" sx={{ m: 0, pl: 2.5, fontSize: '0.7rem', color: 'text.secondary' }}>
                                    {task.instructions.map((instruction, i) => (
                                      <li key={i} style={{ marginBottom: '4px' }}>{instruction}</li>
                                    ))}
                                  </Box>
                                </Box>
                              )}
                              
                              {/* Story link for Quiz mode */}
                              {storyLink && (
                                <Box sx={{ p: 1, backgroundColor: 'rgba(33, 150, 243, 0.1)', borderRadius: 1, borderLeft: '3px solid #2196F3' }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', display: 'block', mb: 0.5 }}>
                                    {mode === 'quiz' ? '🎯 Practice Here:' : '📖 Learn More:'}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Link
                                      component="button"
                                      variant="caption"
                                      onClick={() => task.completionCriteria?.storyId && handleNavigateToStory(task.completionCriteria.storyId)}
                                      sx={{ 
                                        color: '#2196F3',
                                        textAlign: 'left',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        fontSize: '0.7rem',
                                        '&:hover': {
                                          textDecoration: 'underline',
                                        }
                                      }}
                                    >
                                      Go to {task.completionCriteria?.storyId?.split('--')[0].replace(/-/g, ' ')}
                                      <LaunchIcon sx={{ fontSize: 12 }} />
                                    </Link>
                                  </Box>
                                  {mode === 'quiz' && task.completionCriteria?.requiredActions && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, fontSize: '0.65rem', fontStyle: 'italic' }}>
                                      Complete the actions to mark this task done automatically
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Collapse>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </List>

        {/* Reset Button */}
        <Divider sx={{ mb: 2, mx: 2 }} />
        <Box sx={{ px: 2, pb: 2 }}>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={handleResetProgress}
            sx={{ textTransform: 'none' }}
          >
            Reset Progress
          </Button>
        </Box>
      </>
    );
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CardOutline>
        <CardContentWrapper>
          {renderContent()}
        </CardContentWrapper>
      </CardOutline>
    </ThemeProvider>
  );
};

export default OnboardingPanel;
