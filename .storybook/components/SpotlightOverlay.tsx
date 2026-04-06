import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  /** Which frame to search for the target element: 'preview' (default) or 'manager' */
  targetFrame?: 'preview' | 'manager';
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
  /** If true, the user can interact with the target element without auto-advancing the tour */
  interactable?: boolean;
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
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const dragCurrentRef = useRef({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const targetClickCleanupRef = useRef<(() => void) | null>(null);
  const currentStep = steps[currentStepIndex];

  // Reset drag offset when step changes
  useEffect(() => {
    setDragOffset({ x: 0, y: 0 });
    dragCurrentRef.current = { x: 0, y: 0 };
    if (tooltipRef.current) {
      tooltipRef.current.style.transform = '';
    }
  }, [currentStepIndex]);

  // Drag handlers — direct DOM manipulation for performance
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: dragCurrentRef.current.x,
      offsetY: dragCurrentRef.current.y,
    };
    // Block iframe from stealing mousemove events during drag
    const iframe = document.querySelector('#storybook-preview-iframe') as HTMLIFrameElement;
    if (iframe) iframe.style.pointerEvents = 'none';
  }, []);

  useEffect(() => {
    const handleDragMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !tooltipRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const newX = dragStartRef.current.offsetX + dx;
      const newY = dragStartRef.current.offsetY + dy;
      dragCurrentRef.current = { x: newX, y: newY };
      // Direct DOM write — no React re-render
      tooltipRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
    };

    const handleDragEnd = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      // Restore iframe pointer events
      const iframe = document.querySelector('#storybook-preview-iframe') as HTMLIFrameElement;
      if (iframe) iframe.style.pointerEvents = '';
      // Commit final position to React state so it survives re-renders
      setDragOffset({ ...dragCurrentRef.current });
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      // Ensure iframe pointer events are restored on cleanup
      const iframe = document.querySelector('#storybook-preview-iframe') as HTMLIFrameElement;
      if (iframe) iframe.style.pointerEvents = '';
    };
  }, []);

  /**
   * Update target element position and size.
   * Also attaches a click listener to the target so clicking it advances the tour.
   */
  const updateTargetPosition = () => {
    if (!currentStep) return;

    // Clean up previous target click listener
    if (targetClickCleanupRef.current) {
      targetClickCleanupRef.current();
      targetClickCleanupRef.current = null;
    }

    if (currentStep.targetSelector) {
      // Determine which document to search based on targetFrame
      const iframe = document.querySelector('#storybook-preview-iframe') as HTMLIFrameElement;
      let targetDoc: Document;
      let targetElement: Element | null;
      let isManagerFrame = false;

      if (currentStep.targetFrame === 'manager') {
        // Search in the manager (parent) document
        targetDoc = document;
        targetElement = document.querySelector(currentStep.targetSelector);
        isManagerFrame = true;
      } else {
        // Default: search in the preview iframe
        targetDoc = iframe?.contentDocument || document;
        targetElement = targetDoc.querySelector(currentStep.targetSelector);
        isManagerFrame = !iframe?.contentDocument;
      }

      console.log('[SpotlightOverlay] Looking for selector:', currentStep.targetSelector, 'in', isManagerFrame ? 'manager' : 'preview');
      console.log('[SpotlightOverlay] Element found:', !!targetElement);

      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        
        // Adjust for iframe offset only if element is in the preview iframe
        if (iframe && !isManagerFrame) {
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
          console.log('[SpotlightOverlay] Target rect (manager):', {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
          });
        }

        // Attach click listener to advance tour when target element is clicked
        // Skip for interactable steps so the user can interact without auto-advancing
        if (!currentStep.interactable) {
          const handleTargetClick = () => {
            console.log('[SpotlightOverlay] 🎯 Target element clicked, advancing tour');
            if (currentStep.isLast || currentStepIndex === steps.length - 1) {
              onComplete?.();
            } else {
              onNext?.();
            }
          };
          targetElement.addEventListener('click', handleTargetClick);
          targetClickCleanupRef.current = () => {
            targetElement.removeEventListener('click', handleTargetClick);
          };
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
   * Calculate tooltip position based on target and preferred position.
   * Measures the actual tooltip element and tries multiple sides to avoid going off-screen.
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

    const padding = 24; // Space between spotlight and tooltip
    const tooltipEl = tooltipRef.current;
    const tooltipWidth = tooltipEl?.offsetWidth || 320;
    const tooltipHeight = tooltipEl?.offsetHeight || 200;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Calculate position for each side
    const positions: Record<string, { top: number; left: number }> = {
      right: {
        top: targetRect.top,
        left: targetRect.right + padding,
      },
      left: {
        top: targetRect.top,
        left: targetRect.left - tooltipWidth - padding,
      },
      bottom: {
        top: targetRect.bottom + padding,
        left: targetRect.left,
      },
      top: {
        top: targetRect.top - tooltipHeight - padding,
        left: targetRect.left,
      },
    };

    // Check if a position fits within the viewport
    const fits = (pos: { top: number; left: number }) =>
      pos.top >= 10 &&
      pos.left >= 10 &&
      pos.top + tooltipHeight <= vh - 10 &&
      pos.left + tooltipWidth <= vw - 10;

    // Preferred side order based on the step's tooltipPosition
    const preferred = currentStep.tooltipPosition || 'right';
    const sideOrder: string[] = {
      right: ['right', 'left', 'bottom', 'top'],
      left: ['left', 'right', 'bottom', 'top'],
      bottom: ['bottom', 'top', 'right', 'left'],
      top: ['top', 'bottom', 'right', 'left'],
      center: ['right', 'bottom', 'left', 'top'],
    }[preferred];

    // Pick the first side that fits, or fall back to the preferred side
    let chosen = positions[preferred];
    for (const side of sideOrder) {
      if (fits(positions[side])) {
        chosen = positions[side];
        break;
      }
    }

    // Final clamp to ensure it stays in viewport even if no side fully fits
    const top = Math.max(10, Math.min(chosen.top, vh - tooltipHeight - 10));
    const left = Math.max(10, Math.min(chosen.left, vw - tooltipWidth - 10));

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
      
      // Clean up target click listener
      if (targetClickCleanupRef.current) {
        targetClickCleanupRef.current();
        targetClickCleanupRef.current = null;
      }

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
          pointerEvents: 'none',
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
          ref={tooltipRef}
          sx={{
            position: 'absolute',
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
            willChange: isDraggingRef.current ? 'transform' : 'auto',
            width: 320,
            maxWidth: 'calc(100vw - 20px)',
            maxHeight: 'calc(100vh - 20px)',
            overflow: 'auto',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            borderLeft: '4px solid',
            borderColor: mode === 'tutorial' ? '#4CAF50' : '#2196F3',
            zIndex: 10000,
            pointerEvents: 'auto',
          }}
        >
            <CardContent>
              {/* Header – drag handle */}
              <Box
                onMouseDown={handleDragStart}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  mb: 2,
                  cursor: 'grab',
                  '&:active': { cursor: 'grabbing' },
                  userSelect: 'none',
                }}
              >
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
                  aria-label="Close spotlight guide"
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
      </Box>
    </Portal>
  );
};

export default SpotlightOverlay;
