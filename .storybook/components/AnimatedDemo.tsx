import React, { useState, useEffect, useCallback, useRef } from 'react';
import './AnimatedDemo.css';

export interface DemoStep {
  /** Path to screenshot image (relative to staticDirs or absolute URL) */
  screenshot: string;
  /** Where the cursor moves to as percentage [x%, y%] */
  cursorTarget: [number, number];
  /** Whether to show a click animation at the target */
  click?: boolean;
  /** Caption text shown below the demo */
  caption: string;
  /** Optional annotation text shown near the cursor */
  annotation?: string;
  /** Annotation position offset from cursor [x, y] in px */
  annotationOffset?: [number, number];
  /** Duration to stay on this step in ms (default: 2000) */
  duration?: number;
}

interface AnimatedDemoProps {
  /** Array of demo steps to animate through */
  steps: DemoStep[];
  /** Width of the demo container */
  width?: number | string;
  /** Whether to auto-play on mount */
  autoPlay?: boolean;
  /** Whether to loop the animation */
  loop?: boolean;
  /** Speed multiplier (1 = normal, 2 = double speed) */
  speed?: number;
}

/**
 * AnimatedDemo - Shows a sequence of screenshots with an animated cursor
 * demonstrating a user workflow. Pure CSS animations, no Actions needed.
 */
export function AnimatedDemo({
  steps,
  width = 800,
  autoPlay = true,
  loop = true,
  speed = 1,
}: AnimatedDemoProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [showRipple, setShowRipple] = useState(false);
  const [cursorPos, setCursorPos] = useState<[number, number]>([50, 50]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = steps[currentStep];
  const duration = (step?.duration || 2000) / speed;

  const advanceStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1;
      if (next >= steps.length) {
        if (loop) return 0;
        setIsPlaying(false);
        return prev;
      }
      return next;
    });
  }, [steps.length, loop]);

  // Animate cursor to target when step changes
  useEffect(() => {
    if (!step) return;
    // Small delay before moving cursor for visual clarity
    const moveTimer = setTimeout(() => {
      setCursorPos(step.cursorTarget);
    }, 100);

    // Click animation after cursor arrives
    let clickTimer: ReturnType<typeof setTimeout> | null = null;
    if (step.click) {
      clickTimer = setTimeout(() => {
        setShowRipple(true);
        setTimeout(() => setShowRipple(false), 600);
      }, 500 / speed);
    }

    return () => {
      clearTimeout(moveTimer);
      if (clickTimer) clearTimeout(clickTimer);
    };
  }, [currentStep, step, speed]);

  // Auto-advance timer
  useEffect(() => {
    if (!isPlaying) return;
    timerRef.current = setTimeout(advanceStep, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, duration, advanceStep]);

  if (!steps.length) return null;

  return (
    <div style={{ width, maxWidth: '100%' }}>
      <div className="animated-demo">
        <img
          src={step.screenshot}
          alt={step.caption}
          className="animated-demo__screenshot"
        />

        {/* Animated cursor */}
        <div
          className="animated-demo__cursor"
          style={{
            left: `${cursorPos[0]}%`,
            top: `${cursorPos[1]}%`,
            transition: `left 0.5s cubic-bezier(0.4, 0, 0.2, 1), top 0.5s cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
        >
          <svg
            className="animated-demo__cursor-icon"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M5 3l14 8-6 2-4 6-4-16z"
              fill="#000"
              stroke="#fff"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* Click ripple */}
        {step.click && (
          <div
            className={`animated-demo__ripple ${showRipple ? 'animated-demo__ripple--active' : ''}`}
            style={{
              left: `${cursorPos[0]}%`,
              top: `${cursorPos[1]}%`,
            }}
          />
        )}

        {/* Annotation */}
        {step.annotation && (
          <div
            className={`animated-demo__annotation animated-demo__annotation--visible`}
            style={{
              left: `${cursorPos[0]}%`,
              top: `${cursorPos[1]}%`,
              marginLeft: step.annotationOffset?.[0] || -100,
              marginTop: step.annotationOffset?.[1] || -40,
            }}
          >
            {step.annotation}
          </div>
        )}
      </div>

      {/* Step dots */}
      <div className="animated-demo__steps">
        {steps.map((_, i) => (
          <button
            key={i}
            className={`animated-demo__step-dot ${
              i === currentStep
                ? 'animated-demo__step-dot--active'
                : i < currentStep
                  ? 'animated-demo__step-dot--completed'
                  : ''
            }`}
            onClick={() => {
              setCurrentStep(i);
              setIsPlaying(false);
            }}
            aria-label={`Go to step ${i + 1}`}
          />
        ))}
      </div>

      {/* Caption */}
      <div className="animated-demo__caption">{step.caption}</div>

      {/* Controls */}
      <div className="animated-demo__controls">
        <button
          className="animated-demo__btn"
          onClick={() => setCurrentStep((p) => Math.max(0, p - 1))}
          disabled={currentStep === 0}
        >
          ← Prev
        </button>
        <button
          className={`animated-demo__btn ${isPlaying ? '' : 'animated-demo__btn--primary'}`}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          className="animated-demo__btn"
          onClick={() => setCurrentStep((p) => Math.min(steps.length - 1, p + 1))}
          disabled={currentStep === steps.length - 1 && !loop}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default AnimatedDemo;
