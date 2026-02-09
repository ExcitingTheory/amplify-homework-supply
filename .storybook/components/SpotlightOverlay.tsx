import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  Typography,
  Portal,
  ClickAwayListener,
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
        } else {
          setTargetRect(rect);
        }
      } else {
        // Element not found - use center of screen
        setTargetRect(null);
      }
    } else if (currentStep.targetPosition) {
      // Use manual position
      const { top, left, width, height } = currentStep.targetPosition;
      setTargetRect(new DOMRect(left, top, width, height));
    } else {
      // No target - center of screen
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

    updateTargetPosition();
    calculateTooltipPosition();

    // Update on resize and scroll
    const handleUpdate = () => {
      updateTargetPosition();
      calculateTooltipPosition();
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    // Also listen to iframe scroll
    const iframe = document.querySelector('#storybook-preview-iframe') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.addEventListener('scroll', handleUpdate, true);
      iframe.contentWindow.addEventListener('resize', handleUpdate);
    }

    return () => {
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
        <ClickAwayListener onClickAway={() => onClose?.()}>
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
                <IconButton size="small" onClick={onClose} sx={{ ml: 1 }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Description */}
              <Typography variant="body2" sx={{ mb: 2, color: 'text.primary' }}>
                {currentStep.description}
              </Typography>

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
                >
                  {isLastStep ? 'Complete' : 'Next'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </ClickAwayListener>
      </Box>
    </Portal>
  );
};

export default SpotlightOverlay;
