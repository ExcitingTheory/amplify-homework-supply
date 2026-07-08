/**
 * @fileoverview Storybook stories demonstrating onboarding task completion patterns
 * 
 * Interactive examples showing:
 * - Auto-detection of task completion
 * - Manual task tracking
 * - Multi-step task flows
 * - Progress indicators
 * - Persona-specific onboarding experiences
 * 
 * Uses custom hooks (useCompleteTask, useTrackTask) to manage onboarding state.
 * 
 * @module stories/OnboardingExamples.stories
 */

import React from 'react';
import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  Alert,
} from '@mui/material';
import { getOnboardingEmitter } from '../../.storybook/code/onboarding-events';
import { ONBOARDING_TASKS, getTasksForPersona } from '../../.storybook/code/onboarding-tasks';
import { useCompleteTask, useTrackTask, useOnboardingStatus } from '../../.storybook/code/useOnboarding';

const meta: Meta = {
  title: '🏠 Getting Started/Onboarding/Task Completion Examples',
};

export default meta;

/**
 * Example: Detect when user completes a task by reaching a screen
 * This story shows how useCompleteTask automatically marks tasks as complete
 */
export const AutoDetectTaskCompletion: StoryObj = {
  render: () => {
    // Completes the extra-credit Documentation Explorer task — not a real workflow task
    useCompleteTask('secret-documentation-explorer');

    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="success" sx={{ mb: 3 }}>
          ✓ Extra credit unlocked! Check the Onboarding panel for your bonus task.
        </Alert>
        <Card>
          <CardContent>
            <Typography variant="h5">Auto-Detect Task Completion</Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              This story demonstrates how <code>useCompleteTask</code> automatically marks a task
              complete when the component mounts. It awards the 🔍 Documentation Explorer extra
              credit task rather than a real workflow task.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  },
};

/**
 * Example: Manual task tracking with startTask and completeTask
 * Demonstrates the useTrackTask hook for programmatic task control
 */
export const ManualTaskTracking: StoryObj = {
  render: () => {
    const { completeTask, startTask } = useTrackTask('secret-documentation-explorer', 'learner');
    const [started, setStarted] = useState(false);
    const [completed, setCompleted] = useState(false);

    const handleStart = () => {
      startTask();
      setStarted(true);
    };

    const handleComplete = () => {
      completeTask({ method: 'manual_button_click' });
      setCompleted(true);
    };

    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        {completed && <Alert severity="success">✓ Task completed!</Alert>}
        {started && !completed && <Alert severity="info">In progress...</Alert>}

        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Complete a Demo Bonus Task
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
              This example demonstrates manual task tracking with a fictional onboarding task.
              Click "Start Task" to begin tracking, then "Complete Task" when done.
            </Typography>

            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={handleStart} disabled={started}>
                Start Task
              </Button>
              <Button variant="contained" onClick={handleComplete} disabled={!started || completed}>
                Complete Task
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    );
  },
};

/**
 * Example: Display current onboarding status
 * Shows the persona, completed tasks, and completion percentage
 */
export const DisplayOnboardingStatus: StoryObj = {
  render: () => {
    const status = useOnboardingStatus();
    const [stats, setStats] = useState<any>(null);
    const emitter = getOnboardingEmitter();
    const personaRef = React.useRef(status.persona);

    // Keep persona ref up to date
    React.useEffect(() => {
      personaRef.current = status.persona;
    }, [status.persona]);

    // Function to recalculate stats - uses ref to avoid dependency on status functions
    const updateStats = React.useCallback(() => {
      const currentPersona = personaRef.current;
      if (currentPersona) {
        const tasks = getTasksForPersona(currentPersona);
        const completionPercentage = emitter.getCompletionPercentage(currentPersona, tasks);
        const completedTasks = tasks.filter((t) => emitter.isTaskCompleted(t.id, currentPersona));
        
        setStats({
          persona: currentPersona,
          completionPercentage,
          tasks,
          completedTasks,
        });
      }
    }, [emitter]); // Only depend on emitter which is stable

    // Initial calculation when persona changes
    useEffect(() => {
      if (status.persona) {
        updateStats();
      } else {
        setStats(null);
      }
    }, [status.persona, updateStats]);

    // Subscribe to task completion events  
    useEffect(() => {
      const unsubscribe = emitter.on((event) => {
        if (event.type === 'task-completed' || event.type === 'persona-selected') {
          updateStats();
        }
      });
      return unsubscribe;
    }, [emitter, updateStats]);

    if (!stats) {
      return (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert 
            severity="info" 
            sx={{ 
              mb: 2,
              '& .MuiAlert-message': { width: '100%' }
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              📍 Where to find the Onboarding Panel:
            </Typography>
            <Typography variant="body2" component="div">
              👉 Look at the <strong>bottom of the screen</strong> for tabs like:
              <Box component="span" sx={{ 
                display: 'inline-block', 
                mx: 1, 
                px: 1, 
                py: 0.5, 
                bgcolor: 'primary.main', 
                color: 'white', 
                borderRadius: 1,
                fontSize: '0.85rem'
              }}>
                Controls | Actions | <strong>Onboarding</strong>
              </Box>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              👉 Click the <strong>"Onboarding"</strong> tab to open the panel
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              👉 If you don't see it, press <kbd>A</kbd> to toggle the addon panel
            </Typography>
          </Alert>
          
          <Alert severity="warning">
            No persona selected. Please select a persona in the Onboarding panel first.
          </Alert>
        </Container>
      );
    }

    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h6">Your Onboarding Status</Typography>
              <Stack spacing={1} sx={{ mt: 2 }}>
                <Typography>
                  <strong>Role:</strong> {stats.persona.charAt(0).toUpperCase() + stats.persona.slice(1)}
                </Typography>
                <Typography>
                  <strong>Completion:</strong> {stats.completionPercentage}%
                </Typography>
                <Typography>
                  <strong>Tasks Completed:</strong> {stats.completedTasks.length} /{' '}
                  {stats.tasks.length}
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Completed Tasks
              </Typography>
              {stats.completedTasks.length > 0 ? (
                <Stack spacing={1}>
                  {stats.completedTasks.map((task: any) => (
                    <Box
                      key={task.id}
                      sx={{
                        p: 1.5,
                        bgcolor: 'success.light',
                        borderRadius: 1,
                        display: 'flex',
                        gap: 1,
                      }}
                    >
                      <Typography sx={{ color: 'success.main' }}>✓</Typography>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {task.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {task.description}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No tasks completed yet. Complete tasks to see them here.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              status.reset();
              setStats(null);
            }}
          >
            Reset All Progress
          </Button>
        </Stack>
      </Container>
    );
  },
};

/**
 * Example: Event emission and listening
 * Shows how to emit custom events and listen for them
 */
export const EventEmissionExample: StoryObj = {
  render: () => {
    const emitter = getOnboardingEmitter();
    const [events, setEvents] = useState<any[]>([]);
    const [persona, setPersona] = useState<string | null>(null);

    useEffect(() => {
      const unsubscribe = emitter.on((event) => {
        console.log('[Onboarding Event]', event);
        setEvents((prev) => [...prev, event].slice(-10)); // Keep last 10 events
      });

      setPersona(emitter.getPersona());

      return unsubscribe;
    }, [emitter]);

    const handleEmitEvent = (taskId: string) => {
      if (persona) {
        emitter.emit({
          type: 'task-completed',
          taskId,
          persona: persona as any,
          timestamp: Date.now(),
          metadata: { manual: true },
        });
      }
    };

    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h6">Event Monitor</Typography>
              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                Current Demo Persona: {persona ? persona.toUpperCase() : 'None selected'}
              </Typography>

              <Stack direction="row" spacing={1} sx={{ mt: 2, mb: 2 }}>
                {['secret-documentation-explorer', 'secret-shortcut-evangelist', 'secret-keyboard-master'].map(
                  (taskId) => (
                    <Button
                      key={taskId}
                      size="small"
                      variant="outlined"
                      onClick={() => handleEmitEvent(taskId)}
                      disabled={!persona}
                    >
                      Emit {taskId}
                    </Button>
                  )
                )}
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Recent Events (Last 10)
              </Typography>
              <Box
                sx={{
                  bgcolor: '#f5f5f5',
                  p: 2,
                  borderRadius: 1,
                  maxHeight: 300,
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {events.length > 0 ? (
                  events.map((event, index) => (
                    <Box key={index} sx={{ mb: 1, pb: 1, borderBottom: '1px solid #e0e0e0' }}>
                      {JSON.stringify(event, null, 2)}
                    </Box>
                  ))
                ) : (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    No events yet. Emit events above or complete tasks to see them here.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    );
  },
};

/**
 * Spotlight Integration Example
 * Demonstrates the spotlight overlay system for guided tours
 */
export const SpotlightIntegration: StoryObj = {
  render: () => {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Spotlight Overlay Demo
            </Typography>
            <Typography variant="body1" paragraph>
              The spotlight overlay is integrated with the Onboarding Panel. When you click on any task in the panel, 
              a guided tour opens with:
            </Typography>
            
            <Box component="ul" sx={{ mb: 2 }}>
              <li>Semi-transparent overlay that dims the background</li>
              <li>Highlighted spotlight on target UI elements</li>
              <li>Contextual tooltip with step-by-step instructions</li>
              <li>Navigation controls (Next, Skip, Complete)</li>
              <li>Tutorial mode (detailed guidance) or Quiz mode (self-assessment)</li>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              <strong>📖 To Try It:</strong>
              <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li>Open the <strong>Onboarding Panel</strong> (right sidebar)</li>
                <li>Select any persona (used only for demo state segmentation)</li>
                <li>Click on any task to launch the spotlight tour</li>
                <li>Follow the guided steps</li>
                <li>Try switching between Tutorial (📖) and Quiz (🎯) modes</li>
              </ol>
            </Alert>

            <Stack direction="row" spacing={2}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Features
                </Typography>
                <Box component="ul" sx={{ fontSize: '0.875rem', pl: 2 }}>
                  <li>Automatic navigation to relevant stories</li>
                  <li>Responsive positioning</li>
                  <li>Keyboard navigation support</li>
                  <li>Progress tracking</li>
                  <li>Event emission for analytics</li>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Color Coding
                </Typography>
                <Box component="ul" sx={{ fontSize: '0.875rem', pl: 2 }}>
                  <li><span style={{ color: '#4CAF50', fontWeight: 'bold' }}>Green</span> - Tutorial Mode</li>
                  <li><span style={{ color: '#2196F3', fontWeight: 'bold' }}>Blue</span> - Quiz Mode</li>
                  <li>Pulsing glow - Active highlight</li>
                </Box>
              </Box>
            </Stack>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>
                Developer Info:
              </Typography>
              <Typography variant="caption" component="pre" sx={{ fontSize: '0.7rem', overflow: 'auto' }}>
{`// Component source
.storybook/components/SpotlightOverlay.tsx

// Integration in OnboardingPanel
.storybook/components/OnboardingPanel.tsx

// Documentation
docs/SPOTLIGHT_OVERLAY_GUIDE.md
docs/SPOTLIGHT_QUICK_REFERENCE.md`}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  },
};

