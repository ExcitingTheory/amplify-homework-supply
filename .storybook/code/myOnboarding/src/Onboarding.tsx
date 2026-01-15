import React, { useCallback, useEffect, useState } from 'react';

import { SyntaxHighlighter } from 'storybook/internal/components';
import { SAVE_STORY_RESPONSE } from 'storybook/internal/core-events';

import { type API } from 'storybook/manager-api';
import { ThemeProvider, convert, styled, themes } from 'storybook/theming';

import { HighlightElement } from '../../../core/src/manager/components/TourGuide/HighlightElement';
import { TourGuide } from '../../../core/src/manager/components/TourGuide/TourGuide';
import { Confetti } from './components/Confetti/Confetti';
import type { STORYBOOK_ADDON_ONBOARDING_STEPS } from './constants';
import { ADDON_CONTROLS_ID, ADDON_ONBOARDING_CHANNEL } from './constants';
import { IntentSurvey } from './features/IntentSurvey/IntentSurvey';
import { SplashScreen } from './features/SplashScreen/SplashScreen';

// ============================================================================
// CONFIGURATION - Edit these values to customize the onboarding experience
// ============================================================================

const CONFIG = {
  // Initial story to display when onboarding starts
  initialStoryId: 'example-button--primary',
  
  // Story to show when survey is completed
  finalStoryId: 'configure-your-project--docs',
  
  // Panel configuration
  panelSettings: {
    position: 'bottom' as 'bottom' | 'right',
    height: 300,
    defaultPanelId: ADDON_CONTROLS_ID,
  },
  
  // Element selectors for tour steps
  selectors: {
    primaryControl: '#control-primary',
    saveButton: 'button[aria-label="Create new story with these settings"]',
    selectedStory: '#storybook-explorer-tree [data-selected="true"]',
    checklistModule: '#storybook-checklist-module',
  },
  
  // Confetti configuration
  confetti: {
    duration: 10000, // milliseconds
  },
  
  // Feature flags
  features: {
    enableSurvey: true,
    enableConfetti: true,
    enableCodeSnippets: true,
  },
};

// ============================================================================
// CONTENT - Edit these to customize text and messaging
// ============================================================================

const CONTENT = {
  controlsStep: {
    title: 'Interactive story playground',
    description: 'See how a story renders with different data and state without touching code. Try it out by toggling this button.',
  },
  
  saveStep: {
    title: 'Save your changes as a new story',
    description: 'Great! Storybook stories represent the key states of each of your components. After modifying a story, you can save your changes from here or reset it.',
  },
  
  storyCreatedStep: {
    title: 'You just added your first story!',
    descriptionPrefix: 'Well done! You just created your first story from the Storybook manager. This automatically added a few lines of code in',
  },
  
  finalStep: {
    title: 'Continue at your own pace using the guide',
    description: 'Nice! You\'ve got the essentials. You can continue at your own pace using the guide to discover more of Storybook\'s capabilities.',
  },
};

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const SpanHighlight = styled.span(({ theme }) => ({
  display: 'inline-flex',
  borderRadius: 3,
  padding: '0 5px',
  marginBottom: -2,
  opacity: 0.8,
  fontFamily: theme.typography.fonts.mono,
  fontSize: 11,
  border: theme.base === 'dark' ? theme.color.darkest : theme.color.lightest,
  color: theme.base === 'dark' ? theme.color.lightest : theme.color.darkest,
  backgroundColor: theme.base === 'dark' ? 'black' : theme.color.light,
  boxSizing: 'border-box',
  lineHeight: '17px',
}));

const CodeWrapper = styled.div(({ theme }) => ({
  background: theme.background.content,
  borderRadius: 3,
  marginTop: 15,
  padding: 10,
  fontSize: theme.typography.size.s1,
  '.linenumber': {
    opacity: 0.5,
  },
}));

const theme = convert();

// ============================================================================
// TYPES
// ============================================================================

export type StepKey = (typeof STORYBOOK_ADDON_ONBOARDING_STEPS)[number];

interface CreatedStory {
  newStoryName: string;
  newStoryExportName: string;
  sourceFileContent: string;
  sourceFileName: string;
}

interface OnboardingProps {
  api: API;
  hasCompletedSurvey: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Onboarding({ api, hasCompletedSurvey }: OnboardingProps) {
  // State management
  const [enabled, setEnabled] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [step, setStep] = useState<StepKey>('1:Intro');
  
  // DOM element references
  const [primaryControl, setPrimaryControl] = useState<HTMLElement | null>();
  const [saveFromControls, setSaveFromControls] = useState<HTMLElement | null>();
  const [createNewStoryForm, setCreateNewStoryForm] = useState<HTMLElement | null>();
  const [createdStory, setCreatedStory] = useState<CreatedStory | null>();

  const userAgent = globalThis?.navigator?.userAgent;

  // ============================================================================
  // HELPER FUNCTIONS - Customize behavior here
  // ============================================================================

  const selectStory = useCallback(
    (storyId: string) => {
      try {
        const { id, refId } = api.getCurrentStoryData() || {};

        if (id !== storyId || refId !== undefined) {
          api.selectStory(storyId);
        }
      } catch (e) {
        console.error('Error selecting story:', e);
      }
    },
    [api]
  );

  const disableOnboarding = useCallback(
    (dismissedStep?: StepKey) => {
      if (dismissedStep) {
        api.emit(ADDON_ONBOARDING_CHANNEL, {
          dismissedStep,
          type: 'dismiss',
          userAgent,
        });
      }
      api.applyQueryParams({ onboarding: undefined }, { replace: true });
      setEnabled(false);
    },
    [api, userAgent]
  );

  const completeSurvey = useCallback(
    (answers: Record<string, unknown>) => {
      api.emit(ADDON_ONBOARDING_CHANNEL, {
        answers,
        type: 'survey',
        userAgent,
      });
      setStep('7:FinishedOnboarding');
      selectStory(CONFIG.finalStoryId);
    },
    [api, selectStory, userAgent]
  );

  // ============================================================================
  // EFFECTS - Initialize and manage lifecycle
  // ============================================================================

  // Emit survey event when needed
  useEffect(() => {
    if (step === '6:IntentSurvey' && !hasCompletedSurvey && CONFIG.features.enableSurvey) {
      api.emit(ADDON_ONBOARDING_CHANNEL, {
        from: 'onboarding',
        type: 'openSurvey',
        userAgent,
      });
    }
  }, [api, hasCompletedSurvey, step, userAgent]);

  // Initialize Storybook UI on mount
  useEffect(() => {
    api.setQueryParams({ onboarding: 'true' });
    selectStory(CONFIG.initialStoryId);
    api.togglePanel(true);
    api.togglePanelPosition(CONFIG.panelSettings.position);
    api.setSelectedPanel(CONFIG.panelSettings.defaultPanelId);
    api.setSizes({ bottomPanelHeight: CONFIG.panelSettings.height });
  }, [api, selectStory]);

  // Observe DOM changes to detect interactive elements
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setPrimaryControl(document.querySelector(CONFIG.selectors.primaryControl));
      setSaveFromControls(document.getElementById('save-from-controls'));
      setCreateNewStoryForm(document.getElementById('create-new-story-form'));
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // Manage step progression based on UI state
  useEffect(() => {
    setStep((current) => {
      if (hasCompletedSurvey && current === '6:IntentSurvey') {
        return '7:FinishedOnboarding';
      }

      if (
        ['1:Intro', '5:StoryCreated', '6:IntentSurvey', '7:FinishedOnboarding'].includes(current)
      ) {
        return current;
      }

      if (createNewStoryForm) {
        return '4:CreateStory';
      }

      if (saveFromControls) {
        return '3:SaveFromControls';
      }

      if (primaryControl || current === '2:Controls') {
        return '2:Controls';
      }

      return '1:Intro';
    });
  }, [hasCompletedSurvey, createNewStoryForm, primaryControl, saveFromControls]);

  // Handle story creation success
  useEffect(() => {
    return api.on(SAVE_STORY_RESPONSE, ({ payload, success }) => {
      if (!success || !payload?.newStoryName) {
        return;
      }
      setCreatedStory(payload);
      
      if (CONFIG.features.enableConfetti) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), CONFIG.confetti.duration);
      }
      
      setStep('5:StoryCreated');
      setTimeout(() => api.clearNotification('save-story-success'));
    });
  }, [api]);

  // Telemetry tracking
  useEffect(
    () => api.emit(ADDON_ONBOARDING_CHANNEL, { step, type: 'telemetry', userAgent }),
    [api, step, userAgent]
  );

  // ============================================================================
  // TOUR STEP CONFIGURATIONS - Customize tour steps here
  // ============================================================================

  const controlsTour = [
    {
      key: '2:Controls',
      target: CONFIG.selectors.primaryControl,
      title: CONTENT.controlsStep.title,
      content: (
        <>
          {CONTENT.controlsStep.description}
          <HighlightElement targetSelector={CONFIG.selectors.primaryControl} pulsating />
        </>
      ),
      offset: 20,
      placement: 'right',
      disableBeacon: true,
      disableOverlay: true,
      spotlightClicks: true,
      onNext: () => {
        const input = document.querySelector(CONFIG.selectors.primaryControl) as HTMLInputElement;
        input?.click();
      },
    },
    {
      key: '3:SaveFromControls',
      target: CONFIG.selectors.saveButton,
      title: CONTENT.saveStep.title,
      content: (
        <>
          {CONTENT.saveStep.description}
          <HighlightElement targetSelector={CONFIG.selectors.saveButton} />
        </>
      ),
      offset: 6,
      placement: 'top',
      disableBeacon: true,
      disableOverlay: true,
      spotlightClicks: true,
      onNext: () => {
        const button = document.querySelector(CONFIG.selectors.saveButton) as HTMLButtonElement;
        button?.click();
      },
      styles: {
        tooltip: {
          width: 400,
        },
      },
    },
    {
      key: '5:StoryCreated',
      target: CONFIG.selectors.selectedStory,
      title: CONTENT.storyCreatedStep.title,
      content: (
        <>
          {CONTENT.storyCreatedStep.descriptionPrefix}{' '}
          <SpanHighlight>{createdStory?.sourceFileName}</SpanHighlight>.
          {CONFIG.features.enableCodeSnippets && renderCodeSnippet(createdStory)}
        </>
      ),
      offset: 12,
      placement: 'right',
      disableBeacon: true,
      disableOverlay: true,
      styles: {
        tooltip: {
          width: 400,
        },
      },
    },
  ];

  const checklistTour = [
    {
      key: '7:FinishedOnboarding',
      target: CONFIG.selectors.checklistModule,
      title: CONTENT.finalStep.title,
      content: (
        <>
          {CONTENT.finalStep.description}
          <HighlightElement targetSelector={CONFIG.selectors.checklistModule} pulsating />
        </>
      ),
      offset: 0,
      placement: 'right-start',
      disableBeacon: true,
      disableOverlay: true,
      styles: {
        tooltip: {
          width: 350,
        },
      },
    },
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!enabled) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      {showConfetti && CONFIG.features.enableConfetti && <Confetti />}
      
      {step === '1:Intro' ? (
        <SplashScreen onDismiss={() => setStep('2:Controls')} />
      ) : step === '6:IntentSurvey' && CONFIG.features.enableSurvey ? (
        <IntentSurvey
          isOpen={enabled}
          onComplete={completeSurvey}
          onDismiss={() => disableOnboarding('6:IntentSurvey')}
        />
      ) : step === '7:FinishedOnboarding' ? (
        <TourGuide
          // @ts-ignore Circular reference in Step type
          step={step}
          steps={checklistTour}
          onComplete={() => disableOnboarding()}
          onDismiss={() => disableOnboarding(step)}
        />
      ) : (
        <TourGuide
          // @ts-ignore Circular reference in Step type
          step={step}
          steps={controlsTour}
          onComplete={() => setStep(hasCompletedSurvey ? '7:FinishedOnboarding' : '6:IntentSurvey')}
          onDismiss={() => disableOnboarding(step)}
        />
      )}
    </ThemeProvider>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function renderCodeSnippet(createdStory: CreatedStory | null | undefined) {
  if (!createdStory) return null;
  
  const source = createdStory.sourceFileContent;
  const startIndex = source?.lastIndexOf(`export const ${createdStory.newStoryExportName}`);
  const snippet = source?.slice(startIndex).trim();
  const startingLineNumber = source?.slice(0, startIndex).split('\n').length;

  if (!snippet) return null;

  return (
    <ThemeProvider theme={convert(themes.dark)}>
      <CodeWrapper>
        <SyntaxHighlighter
          language="jsx"
          showLineNumbers
          startingLineNumber={startingLineNumber}
        >
          {snippet}
        </SyntaxHighlighter>
      </CodeWrapper>
    </ThemeProvider>
  );
}
