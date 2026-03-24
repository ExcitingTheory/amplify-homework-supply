import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
  Portal,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import CheckIcon from '@mui/icons-material/Check';

export interface SpotlightStep {
  /** ID of the step */
  id: string;
  /** CSS selector for the element to highlight */
  targetSelector?: string;
  /** Manual position if no target selector */
  targetPosition?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  /** Title of the step */
  title: string;
  /** Description text */
  description: string;
  /** Optional list of action items */
  actions?: string[];
  /** Position of the tooltip relative to the spotlight */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Whether this is the last step */
  isLast?: boolean;
}

export interface SpotlightOverlayProps {
  /** Array of steps to guide user through */
  steps: SpotlightStep[];
  /** Current step index */
  currentStepIndex?: number;
  /** Callback when user clicks Next */
  onNext?: () => void;
  /** Callback when user clicks Skip */
  onSkip?: () => void;
  /** Callback when user completes the flow */
  onComplete?: () => void;
  /** Callback when user closes the spotlight */
  onClose?: () => void;
  /** Whether to show the overlay */
  isOpen: boolean;
  /** Mode: tutorial (show steps) or quiz (minimal guidance) */
  mode?: 'tutorial' | 'quiz';
}

/**
 * SpotlightOverlay Component
 * 
 * Creates a guided tour overlay with a highlighted spotlight area,
 * dimmed background, and contextual tooltip instructions.
 * 
 * Features:
 * - Semi-transparent overlay (scrim) to dim non-focused areas
 * - Transparent "spotlight" hole to highlight target elements
 * - Tooltip with step-by-step instructions
 * - Navigation controls (Next, Skip, Complete)
 * - Support for tutorial and quiz modes
 * - Automatic positioning based on target element
 * - Responsive to window resize and scroll
 */
export const SpotlightOverlay: React.FC<SpotlightOverlayProps> = ({
  steps,
  currentStepIndex = 0,
  onNext,
  onSkip,
  onComplete,
  onClose,
  isOpen,
  mode = 'tutorial',
}) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const currentStep = steps[currentStepIndex];

  /**
   * Update target element position and size
   */
  const updateTargetPosition = () => {
    if (!currentStep) return;

    if (currentStep.targetSelector) {
      // Find element in the iframe (Storybook preview) or main window
      const iframe = document.querySelector('#storybook-preview-iframe') as HTMLIFrameElement;
      const targetDoc = iframe?.contentDocument || document;
      const targetElement = targetDoc.querySelector(currentStep.targetSelector);

      console.log('[SpotlightOverlay] Looking for selector:', currentStep.targetSelector);
      console.log('[SpotlightOverlay] Element found:', !!targetElement);

      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        
        // Adjust for iframe offset if element is in iframe
        if (iframe) {
          const iframeRect = iframe.getBoundingClientRect();
          setTargetRect(new DOMRect(
            rect.left + iframeRect.left,
            rect.top + iframeRect.top,
            rect.width,
            rect.height
          ));
          console.log('[SpotlightOverlay] Target rect (iframe-adjusted):', {
            left: rect.left + iframeRect.left,
            top: rect.top + iframeRect.top,
            width: rect.width,
            height: rect.height
          });
        } else {
          setTargetRect(rect);
          console.log('[SpotlightOverlay] Target rect:', {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
          });
        }
      } else {
        // Element not found - use center of screen
        console.warn('[SpotlightOverlay] Target element not found, using center position');
        setTargetRect(null);
      }
    } else if (currentStep.targetPosition) {
      // Use manual position
      const { top, left, width, height } = currentStep.targetPosition;
      setTargetRect(new DOMRect(left, top, width, height));
      console.log('[SpotlightOverlay] Using manual position:', currentStep.targetPosition);
    } else {
      // No target - center of screen
      console.log('[SpotlightOverlay] No target selector or position, centering');
      setTargetRect(null);
    }
  };

  /**
   * Calculate tooltip position based on target and preferred position
   */
  const calculateTooltipPosition = () => {
    if (!targetRect) {
      // Center of screen
      setTooltipPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 150,
      });
      return;
    }

    const tooltipPref = currentStep.tooltipPosition || 'right';
    const padding = 24; // Space between spotlight and tooltip
    const tooltipWidth = 320;
    const tooltipHeight = 200; // Approximate

    let top = 0;
    let left = 0;

    switch (tooltipPref) {
      case 'right':
        top = targetRect.top;
        left = targetRect.right + padding;
        // Adjust if goes off screen
        if (left + tooltipWidth > window.innerWidth) {
          left = targetRect.left - tooltipWidth - padding;
        }
        break;
      case 'left':
        top = targetRect.top;
        left = targetRect.left - tooltipWidth - padding;
        if (left < 0) {
          left = targetRect.right + padding;
        }
        break;
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left;
        if (top + tooltipHeight > window.innerHeight) {
          top = targetRect.top - tooltipHeight - padding;
        }
        break;
      case 'top':
        top = targetRect.top - tooltipHeight - padding;
        left = targetRect.left;
        if (top < 0) {
          top = targetRect.bottom + padding;
        }
        break;
      case 'center':
        top = window.innerHeight / 2 - tooltipHeight / 2;
        left = window.innerWidth / 2 - tooltipWidth / 2;
        break;
    }

    // Ensure tooltip stays in viewport
    top = Math.max(10, Math.min(top, window.innerHeight - tooltipHeight - 10));
    left = Math.max(10, Math.min(left, window.innerWidth - tooltipWidth - 10));

    setTooltipPosition({ top, left });
  };

  useEffect(() => {
    if (!isOpen) return;

    // Initial update
    updateTargetPosition();
    calculateTooltipPosition();

    const handleUpdate = () => {
      updateTargetPosition();
      calculateTooltipPosition();
    };

    // Listen to iframe load event - fires when new story is loaded
    const iframe = document.querySelector('#storybook-preview-iframe') as HTMLIFrameElement;
    
    const handleIframeLoad = () => {
      console.log('[SpotlightOverlay] 🎬 Iframe loaded - story rendered, updating target position');
      // Small delay to ensure DOM is fully ready
      setTimeout(() => {
        updateTargetPosition();
        calculateTooltipPosition();
      }, 50);
    };

    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
    }

    // Listen to Storybook's storyRendered event via postMessage
    const handleMessage = (event: MessageEvent) => {
      // Check if message is from Storybook iframe
      if (event.source === iframe?.contentWindow) {
        const data = event.data;
        
        // Storybook emits various events - look for story rendering completion
        if (data?.type === 'storyRendered' || 
            data?.event === 'storyRendered' ||
            data?.eventName === 'storyRendered' ||
            data?.name === 'storyRendered') {
          console.log('[SpotlightOverlay] ✨ Story rendered event received:', data);
          setTimeout(() => {
            updateTargetPosition();
            calculateTooltipPosition();
          }, 100);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Retry finding target element after navigation as fallback
    // This handles edge cases where events might be missed
    const retryIntervals = [100, 300, 500, 1000, 2000];
    const retryTimeouts: NodeJS.Timeout[] = [];
    
    retryIntervals.forEach(delay => {
      const timeout = setTimeout(() => {
        console.log('[SpotlightOverlay] ⏱️ Retry attempt after', delay, 'ms');
        updateTargetPosition();
        calculateTooltipPosition();
      }, delay);
      retryTimeouts.push(timeout);
    });

    // Update on resize and scroll
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    if (iframe?.contentWindow) {
      iframe.contentWindow.addEventListener('scroll', handleUpdate, true);
      iframe.contentWindow.addEventListener('resize', handleUpdate);
    }

    return () => {
      // Clear retry timeouts
      retryTimeouts.forEach(timeout => clearTimeout(timeout));
      
      // Remove event listeners
      if (iframe) {
        iframe.removeEventListener('load', handleIframeLoad);
      }
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
      
      if (iframe?.contentWindow) {
        iframe.contentWindow.removeEventListener('scroll', handleUpdate, true);
        iframe.contentWindow.removeEventListener('resize', handleUpdate);
      }
    };
  }, [isOpen, currentStep, currentStepIndex]);

  useEffect(() => {
    calculateTooltipPosition();
  }, [targetRect]);

  if (!isOpen || !currentStep) return null;

  const handleNext = () => {
    if (currentStep.isLast || currentStepIndex === steps.length - 1) {
      onComplete?.();
    } else {
      onNext?.();
    }
  };

  const isLastStep = currentStep.isLast || currentStepIndex === steps.length - 1;

  return (
    <Portal>
      {/* Overlay with spotlight cutout */}
      <Box
        ref={overlayRef}
        data-testid="spotlight-overlay"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          pointerEvents: 'auto',
        }}
      >
        {/* SVG mask for spotlight effect */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <defs>
            <mask id="spotlight-mask">
              {/* White background - visible area */}
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {/* Black spotlight - transparent area */}
              {targetRect && (
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          {/* Semi-transparent overlay with mask */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.6)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Spotlight border highlight */}
        {targetRect && (
          <Box
            sx={{
              position: 'absolute',
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              border: '3px solid',
              borderColor: mode === 'tutorial' ? '#4CAF50' : '#2196F3',
              borderRadius: '8px',
              pointerEvents: 'none',
              boxShadow: mode === 'tutorial' 
                ? '0 0 0 4px rgba(76, 175, 80, 0.2), 0 0 20px rgba(76, 175, 80, 0.4)'
                : '0 0 0 4px rgba(33, 150, 243, 0.2), 0 0 20px rgba(33, 150, 243, 0.4)',
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  boxShadow: mode === 'tutorial'
                    ? '0 0 0 4px rgba(76, 175, 80, 0.2), 0 0 20px rgba(76, 175, 80, 0.4)'
                    : '0 0 0 4px rgba(33, 150, 243, 0.2), 0 0 20px rgba(33, 150, 243, 0.4)',
                },
                '50%': {
                  boxShadow: mode === 'tutorial'
                    ? '0 0 0 8px rgba(76, 175, 80, 0.1), 0 0 30px rgba(76, 175, 80, 0.6)'
                    : '0 0 0 8px rgba(33, 150, 243, 0.1), 0 0 30px rgba(33, 150, 243, 0.6)',
                },
              },
            }}
          />
        )}

        {/* Tooltip/Coachmark */}
        <Card
          sx={{
            position: 'absolute',
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            width: 320,
            maxWidth: 'calc(100vw - 20px)',
            maxHeight: 'calc(100vh - 20px)',
            overflow: 'auto',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            borderLeft: '4px solid',
            borderColor: mode === 'tutorial' ? '#4CAF50' : '#2196F3',
            zIndex: 10000,
          }}
        >
            <CardContent>
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="overline" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                    {mode === 'tutorial' ? '📖 Tutorial' : '🎯 Quiz'} • Step {currentStepIndex + 1} of {steps.length}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: mode === 'tutorial' ? '#4CAF50' : '#2196F3' }}>
                    {currentStep.title}
                  </Typography>
                </Box>
                <Button 
                  size="small" 
                  onClick={onClose} 
                  sx={{ 
                    ml: 1, 
                    minWidth: 'auto',
                    color: 'inherit',
                    p: 0.5,
                  }}
                  ariaLabel="Close spotlight guide"
                >
                  <CloseIcon fontSize="small" />
                </Button>
              </Box>

              {/* Description */}
              <Typography variant="body2" sx={{ mb: 2, color: 'text.primary' }}>
                {currentStep.description}
              </Typography>

              {/* Warning if target element not found */}
              {currentStep.targetSelector && !targetRect && (
                <Box sx={{ mb: 2, p: 1.5, backgroundColor: 'rgba(255, 152, 0, 0.1)', borderRadius: 1, borderLeft: '3px solid #FF9800' }}>
                  <Typography variant="caption" sx={{ color: '#F57C00', fontWeight: 600, display: 'block', mb: 0.5 }}>
                    ⚠️ Target Element Not Found
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block' }}>
                    The component we're looking for hasn't loaded yet. The spotlight will keep trying to find it. Follow the instructions below to complete this step.
                  </Typography>
                </Box>
              )}

              {/* Action items - Tutorial mode only */}
              {mode === 'tutorial' && currentStep.actions && currentStep.actions.length > 0 && (
                <Box sx={{ mb: 2, p: 1.5, backgroundColor: 'rgba(76, 175, 80, 0.08)', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1, color: 'text.primary' }}>
                    Follow these steps:
                  </Typography>
                  <Box component="ol" sx={{ m: 0, pl: 2, color: 'text.secondary' }}>
                    {currentStep.actions.map((action, idx) => (
                      <Typography 
                        key={idx} 
                        component="li" 
                        variant="caption" 
                        sx={{ mb: 0.5, fontSize: '0.75rem' }}
                      >
                        {action}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Quiz mode hint */}
              {mode === 'quiz' && (
                <Box sx={{ mb: 2, p: 1.5, backgroundColor: 'rgba(33, 150, 243, 0.08)', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontStyle: 'italic' }}>
                    💡 Try to complete this task on your own. Click "Next" when you're ready to continue.
                  </Typography>
                </Box>
              )}

              {/* Navigation buttons */}
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={onSkip}
                  startIcon={<SkipNextIcon />}
                  sx={{ textTransform: 'none' }}
                  ariaLabel={false}
                >
                  Skip
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleNext}
                  endIcon={isLastStep ? <CheckIcon /> : <ArrowForwardIcon />}
                  sx={{ 
                    textTransform: 'none',
                    flex: 1,
                    backgroundColor: mode === 'tutorial' ? '#4CAF50' : '#2196F3',
                    '&:hover': {
                      backgroundColor: mode === 'tutorial' ? '#45a049' : '#1976D2',
                    },
                  }}
                  ariaLabel={false}
                >
                  {isLastStep ? 'Complete' : 'Next'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
      </Box>
    </Portal>
  );
};

export default SpotlightOverlay;
