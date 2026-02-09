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
import SpotlightOverlay, { SpotlightStep } from './SpotlightOverlay';
import { getSpotlightConfigForTask } from '../code/spotlight-configs';

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
});

const CardContentWrapper = styled('div')({
  borderRadius: 4,
  backgroundColor: '#1a1a1a',
  position: 'relative',
  flex: '1 1 0',
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  color: '#e0e0e0',
  WebkitOverflowScrolling: 'touch',
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
  const [apiReady, setApiReady] = useState(false);
  
  // Spotlight state
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [spotlightSteps, setSpotlightSteps] = useState<SpotlightStep[]>([]);
  const [spotlightCurrentStep, setSpotlightCurrentStep] = useState(0);
  const [activeTask, setActiveTask] = useState<OnboardingTaskWithCriteria | null>(null);

  const emitter = getOnboardingEmitter();

  // Wait for Storybook API to be ready
  useEffect(() => {
    if (!api) {
      setApiReady(false);
      return;
    }
    
    // Check if store is ready
    const checkReady = async () => {
      try {
        if (api.store?.readyPromise) {
          await api.store.readyPromise;
          console.log('[OnboardingPanel] Storybook store is ready');
          setApiReady(true);
        } else if (api.selectStory) {
          // API exists but no readyPromise, assume it's ready
          console.log('[OnboardingPanel] API available without readyPromise');
          setApiReady(true);
        }
      } catch (error) {
        console.warn('[OnboardingPanel] Error waiting for store:', error);
        setApiReady(false);
      }
    };
    
    checkReady();
  }, [api]);

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

  /**
   * Get the appropriate story ID based on current mode
   */
  const getStoryIdForMode = (task: OnboardingTaskWithCriteria): string | null => {
    if (!task.completionCriteria) return null;
    
    const { tutorialStoryId, quizStoryId, storyId } = task.completionCriteria;
    
    // Use mode-specific story ID if available
    if (mode === 'tutorial' && tutorialStoryId) {
      return tutorialStoryId;
    }
    if (mode === 'quiz' && quizStoryId) {
      return quizStoryId;
    }
    
    // Fall back to legacy single storyId
    return storyId || null;
  };

  const getStoryLink = (task: OnboardingTaskWithCriteria): string | null => {
    const storyId = getStoryIdForMode(task);
    if (!storyId) return null;
    
    // Convert story ID to URL path
    return `/?path=/story/${storyId}`;
  };

  const handleNavigateToStory = (storyId: string) => {
    console.log('🚀 Navigating to story:', storyId);
    console.log('🔧 API available:', !!api?.selectStory);
    console.log('✅ API ready:', apiReady);
    console.log('🌍 Window parent:', window.parent);
    
    // Only use API if it's ready
    if (api?.selectStory && apiReady) {
      // Use Storybook API if available and ready
      try {
        console.log('📍 Using Storybook API to navigate');
        api.selectStory(storyId);
        return; // Success, exit early
      } catch (error) {
        console.error('❌ Error selecting story:', error);
        // Fall through to URL navigation
      }
    }
    
    // Fallback to URL navigation if API not ready or failed
    console.log('🌐 Using window.parent.location.href');
    const url = `/?path=/story/${encodeURIComponent(storyId)}`;
    console.log('🔗 URL:', url);
    
    try {
      if (window.parent && window.parent !== window) {
        window.parent.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch (error) {
      console.error('❌ Navigation failed:', error);
    }
  };

  /**
   * Generate spotlight steps from a task
   */
  const generateSpotlightSteps = (task: OnboardingTaskWithCriteria): SpotlightStep[] => {
    // Try to get configured steps for this task
    const configuredSteps = getSpotlightConfigForTask(task.id, mode);
    
    if (configuredSteps && configuredSteps.length > 0) {
      return configuredSteps;
    }

    // Fallback to auto-generated steps if no configuration exists
    const steps: SpotlightStep[] = [];

    // Introduction step
    steps.push({
      id: `${task.id}-intro`,
      title: task.title,
      description: task.description,
      tooltipPosition: 'center',
      actions: mode === 'tutorial' && task.instructions ? task.instructions : undefined,
    });

    // If there's a story link, add a step for navigation
    const storyId = getStoryIdForMode(task);
    if (storyId) {
      steps.push({
        id: `${task.id}-navigate`,
        title: mode === 'tutorial' ? 'View Documentation' : 'Try It Out',
        description: mode === 'tutorial' 
          ? 'We\'ll navigate to the component documentation where you can see examples and interact with the component.'
          : 'Navigate to the interactive demo and complete the task on your own.',
        tooltipPosition: 'center',
        actions: mode === 'tutorial' ? [
          'The story will open automatically',
          'Explore the interactive examples',
          'Try different configurations',
          'Read the component documentation',
        ] : undefined,
      });
    }

    // Completion step
    steps.push({
      id: `${task.id}-complete`,
      title: 'Task Complete!',
      description: mode === 'tutorial'
        ? 'Great job! You\'ve learned about this feature. Click Complete to mark this task as done.'
        : 'Did you successfully complete the task? Click Complete if you did, or Skip to try again later.',
      tooltipPosition: 'center',
      isLast: true,
    });

    return steps;
  };

  /**
   * Handle clicking on a task to start spotlight tour
   */
  const handleTaskClick = (task: OnboardingTaskWithCriteria) => {
    console.log('🎯 Task clicked:', task.id, task.title);
    
    // Don't start spotlight for already completed tasks in quiz mode
    if (mode === 'quiz' && completedTasks.has(task.id)) {
      console.log('⏭️ Task already completed in quiz mode, skipping');
      return;
    }

    // In quiz mode, navigate directly to the story without tutorial
    if (mode === 'quiz') {
      console.log('🎯 Quiz mode: Navigating directly to task page');
      const storyId = getStoryIdForMode(task);
      if (storyId) {
        handleNavigateToStory(storyId);
      } else {
        console.warn('⚠️ No story ID found for quiz mode task:', task.id);
      }
      return;
    }

    // Tutorial mode: Show spotlight tour
    console.log('✨ Tutorial mode: Starting spotlight tour...');
    setActiveTask(task);
    const steps = generateSpotlightSteps(task);
    console.log('📋 Generated steps:', steps.length);
    setSpotlightSteps(steps);
    setSpotlightCurrentStep(0);
    setSpotlightOpen(true);
    
    // Navigate to the story immediately in tutorial mode
    const storyId = getStoryIdForMode(task);
    if (storyId) {
      console.log('📍 Navigating to tutorial story:', storyId);
      handleNavigateToStory(storyId);
    }
  };

  /**
   * Handle moving to next spotlight step
   */
  const handleSpotlightNext = () => {
    const nextStepIndex = spotlightCurrentStep + 1;
    setSpotlightCurrentStep(nextStepIndex);
  };

  /**
   * Handle completing the spotlight tour
   */
  const handleSpotlightComplete = () => {
    if (activeTask && selectedPersona) {
      // Mark task as complete
      emitter.emit({
        type: 'task-completed',
        taskId: activeTask.id,
        persona: selectedPersona,
        timestamp: Date.now(),
        metadata: { completedViaSpotlight: true, mode },
      });
    }
    
    setSpotlightOpen(false);
    setSpotlightCurrentStep(0);
    setActiveTask(null);
  };

  /**
   * Handle skipping the spotlight tour
   */
  const handleSpotlightSkip = () => {
    if (activeTask && selectedPersona) {
      // Emit skip event
      emitter.emit({
        type: 'task-skipped',
        taskId: activeTask.id,
        persona: selectedPersona,
        timestamp: Date.now(),
        metadata: { skippedFromSpotlight: true },
      });
    }
    
    setSpotlightOpen(false);
    setSpotlightCurrentStep(0);
    setActiveTask(null);
  };

  /**
   * Handle closing the spotlight tour
   */
  const handleSpotlightClose = () => {
    setSpotlightOpen(false);
    setSpotlightCurrentStep(0);
    setActiveTask(null);
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
              Click on tasks below to navigate to interactive component stories. Each task will direct you to the specific Storybook story where you can practice. Complete actions to track progress automatically.
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
        <List sx={{ px: 2 }}>
          {tasks.map((task: OnboardingTaskWithCriteria) => {
                const isCompleted = completedTasks.has(task.id);
                const isExpanded = expandedTasks.has(task.id);
                const storyLink = getStoryLink(task);
                const hasInstructions = task.instructions && task.instructions.length > 0;
                
                return (
                  <Card
                    key={task.id}
                    sx={{
                      mb: 1.5,
                      backgroundColor: isCompleted ? 'rgba(76, 175, 80, 0.05)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: isCompleted 
                          ? 'rgba(76, 175, 80, 0.08)' 
                          : 'rgba(255, 255, 255, 0.05)',
                        boxShadow: 2,
                        '& .spotlight-hint': {
                          opacity: 1,
                        },
                      },
                    }}
                  >
                    <CardContent 
                      sx={{ p: 1.5, pb: hasInstructions || storyLink ? 1 : 1.5, cursor: 'pointer' }}
                      onClick={() => handleTaskClick(task)}
                    >
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <Checkbox
                          checked={isCompleted}
                          disabled
                          size="small"
                          sx={{ mt: 0.5, cursor: 'default', pointerEvents: 'none' }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0, pointerEvents: 'none' }}>
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
                              <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center', pointerEvents: 'none' }}>
                                <Chip 
                                  label={`~${Math.ceil(task.estimatedTime / 60)} min`}
                                  size="small"
                                  sx={{ height: 18, fontSize: '0.65rem', pointerEvents: 'none' }}
                                />
                                {storyLink && (
                                  <Chip 
                                    label={mode === 'tutorial' ? 'Example Available' : 'Interactive Demo'}
                                    size="small"
                                    color={mode === 'tutorial' ? 'success' : 'primary'}
                                    variant="outlined"
                                    sx={{ height: 18, fontSize: '0.65rem', pointerEvents: 'none' }}
                                  />
                                )}
                                <Chip 
                                  label="Click to start"
                                  size="small"
                                  color="info"
                                  variant="outlined"
                                  className="spotlight-hint"
                                  sx={{ 
                                    height: 18, 
                                    fontSize: '0.65rem',
                                    opacity: isCompleted ? 0 : 0.6,
                                    transition: 'opacity 0.2s',
                                    pointerEvents: 'none',
                                  }}
                                />
                              </Box>
                            </Box>
                            
                            {(hasInstructions || storyLink) && (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTaskExpanded(task.id);
                                }}
                                sx={{
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.2s',
                                  pointerEvents: 'auto',
                                }}
                              >
                                <ExpandMoreIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>

                          {/* Expandable content */}
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                              {/* Instructions - Tutorial Mode Only */}
                              {mode === 'tutorial' && hasInstructions && (
                                <Box sx={{ mb: storyLink ? 1.5 : 0 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', display: 'block', mb: 0.5 }}>
                                    📋 Step-by-Step Instructions:
                                  </Typography>
                                  <Box component="ol" sx={{ m: 0, pl: 2.5, fontSize: '0.7rem', color: 'text.secondary' }}>
                                    {task.instructions.map((instruction, i) => (
                                      <li key={i} style={{ marginBottom: '4px' }}>{instruction}</li>
                                    ))}
                                  </Box>
                                </Box>
                              )}
                              
                              {/* Quiz Mode - Brief Reminder */}
                              {mode === 'quiz' && (
                                <Box sx={{ mb: storyLink ? 1.5 : 0 }}>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem', fontStyle: 'italic' }}>
                                    💡 Remember: {task.description}
                                  </Typography>
                                </Box>
                              )}
                              
                              {/* Story Link - Both Modes */}
                              {storyLink && (
                                <Box sx={{ p: 1, backgroundColor: mode === 'tutorial' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(33, 150, 243, 0.1)', borderRadius: 1, borderLeft: mode === 'tutorial' ? '3px solid #4CAF50' : '3px solid #2196F3' }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', display: 'block', mb: 0.5 }}>
                                    {mode === 'quiz' ? '🎯 Try It Out:' : '📖 View Example:'}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Link
                                      component="button"
                                      variant="caption"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const storyId = getStoryIdForMode(task);
                                        storyId && handleNavigateToStory(storyId);
                                      }}
                                      sx={{ 
                                        color: mode === 'tutorial' ? '#4CAF50' : '#2196F3',
                                        textAlign: 'left',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        pointerEvents: 'auto',
                                        '&:hover': {
                                          textDecoration: 'underline',
                                        }
                                      }}
                                    >
                                      {mode === 'quiz' ? 'Open Interactive Demo' : 'See Documentation Example'}
                                      <LaunchIcon sx={{ fontSize: 12 }} />
                                    </Link>
                                  </Box>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, fontSize: '0.65rem', fontStyle: 'italic' }}>
                                    {mode === 'quiz' 
                                      ? 'Complete the task in the story to check it off automatically'
                                      : 'Follow along with the interactive example to learn how it works'
                                    }
                                  </Typography>
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
      
      {/* Spotlight Overlay */}
      <SpotlightOverlay
        steps={spotlightSteps}
        currentStepIndex={spotlightCurrentStep}
        isOpen={spotlightOpen}
        mode={mode}
        onNext={handleSpotlightNext}
        onSkip={handleSpotlightSkip}
        onComplete={handleSpotlightComplete}
        onClose={handleSpotlightClose}
      />
    </ThemeProvider>
  );
};

export default OnboardingPanel;
