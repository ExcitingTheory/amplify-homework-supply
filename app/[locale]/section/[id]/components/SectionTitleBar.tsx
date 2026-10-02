"use client";
import React from "react";
import Box from "@mui/material/Box";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const HOVER_SCROLL_DELAY_MS = 400;
const HOVER_SCROLL_PX_PER_MS = 0.05;
const RESIZE_TRANSITION = "250ms cubic-bezier(0.4, 0, 0.2, 1)";
const TEXT_FADE_MS = 150;
/** Time for the title bar to fade out, switch layout, and finish resizing. */
export const TITLE_BAR_SETTLE_MS = TEXT_FADE_MS + 250;

type HoverScrollTextProps = Omit<TypographyProps, "children"> & {
  text: string;
};

/** Truncates with an ellipsis; on hover, scrolls horizontally to reveal the rest. */
function HoverScrollText({ text, sx, ...props }: HoverScrollTextProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const frameRef = React.useRef<number | null>(null);
  const [scrolling, setScrolling] = React.useState(false);
  const [truncated, setTruncated] = React.useState(false);
  const reducedMotion = useReducedMotion();

  const cancel = () => {
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  };

  React.useEffect(() => cancel, []);

  const handleMouseEnter = () => {
    const element = ref.current;
    if (!element) return;
    const distance = element.scrollWidth - element.clientWidth;
    setTruncated(distance > 0);
    if (distance <= 0 || reducedMotion) return;

    setScrolling(true);
    const startTime = performance.now() + HOVER_SCROLL_DELAY_MS;
    const step = (now: number) => {
      const maxOffset = element.scrollWidth - element.clientWidth;
      const offset = Math.min(
        maxOffset,
        Math.max(0, now - startTime) * HOVER_SCROLL_PX_PER_MS,
      );
      element.scrollLeft = offset;
      frameRef.current =
        offset < maxOffset ? requestAnimationFrame(step) : null;
    };
    cancel();
    frameRef.current = requestAnimationFrame(step);
  };

  const handleMouseLeave = () => {
    cancel();
    if (ref.current) ref.current.scrollLeft = 0;
    setScrolling(false);
  };

  return (
    <Typography
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={reducedMotion && truncated ? text : undefined}
      sx={[
        {
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: scrolling ? "clip" : "ellipsis",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {text}
    </Typography>
  );
}

export interface SectionTitleBarProps {
  name: string;
  description: string;
  /** Instructors get click-to-edit fields; students see read-only text. */
  editable: boolean;
  isScrolled?: boolean;
  untitledLabel: string;
  addDescriptionLabel: string;
  onNameChange: (value: string) => void;
  onNameBlur: () => void;
  onDescriptionChange: (value: string) => void;
  onDescriptionBlur: () => void;
}

/**
 * Section title/description, portaled into the main AppBar — mirrors
 * Editor3's UnitTitleDescriptionEditor: condenses into a single row on scroll.
 */
export function SectionTitleBar({
  name,
  description,
  editable,
  isScrolled: scrolledProp = false,
  untitledLabel,
  addDescriptionLabel,
  onNameChange,
  onNameBlur,
  onDescriptionChange,
  onDescriptionBlur,
}: SectionTitleBarProps) {
  const [editingName, setEditingName] = React.useState(false);
  const [editingDescription, setEditingDescription] = React.useState(false);
  const descriptionText = description || (editable ? addDescriptionLabel : "");
  const reducedMotion = useReducedMotion();
  // The rendered layout lags the prop so text can fade out before it switches.
  const [isScrolled, setLayoutScrolled] = React.useState(scrolledProp);
  const [textVisible, setTextVisible] = React.useState(true);

  React.useEffect(() => {
    if (scrolledProp === isScrolled) {
      setTextVisible(true);
      return;
    }
    if (reducedMotion) {
      setLayoutScrolled(scrolledProp);
      return;
    }
    setTextVisible(false);
    const timer = setTimeout(() => {
      setLayoutScrolled(scrolledProp);
      setTextVisible(true);
    }, TEXT_FADE_MS);
    return () => clearTimeout(timer);
  }, [scrolledProp, isScrolled, reducedMotion]);

  const contentRef = React.useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = React.useState<number | null>(null);

  // Height can't transition to/from `auto`, so mirror the measured content height.
  React.useEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setContentHeight(
        entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height,
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      sx={{
        height: contentHeight ?? "auto",
        overflow: "hidden",
        transition: reducedMotion ? "none" : `height ${RESIZE_TRANSITION}`,
      }}
    >
      <Box
        ref={contentRef}
        sx={{
          display: "flex",
          flexDirection: isScrolled ? "row" : "column",
          alignItems: isScrolled ? "center" : "stretch",
          width: "100%",
          opacity: textVisible ? 1 : 0,
          // Layout switches while the text is faded out, so only opacity and the
          // outer height animate; inner sizes snap to avoid stacked transitions.
          transition: reducedMotion ? "none" : `opacity ${TEXT_FADE_MS}ms ease`,
          gap: isScrolled ? 1 : 0,
          overflow: "hidden",
          pr: isScrolled ? 2 : 0,
        }}
      >
        <Box
          sx={{
            flex: editingName
              ? "1 1 100%"
              : isScrolled
                ? "0 1 auto"
                : "1 0 auto",
            maxWidth: isScrolled && !editingName ? "50%" : "100%",
            display: isScrolled && editingDescription ? "none" : "flex",
            px: 2,
            py: isScrolled ? 0.25 : 0.5,
            minHeight: isScrolled ? "2rem" : "2.5rem",
            alignItems: "center",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {!editingName && (
            <HoverScrollText
              data-tour="section-title"
              text={name || untitledLabel}
              variant={isScrolled ? "body1" : "h6"}
              component="div"
              sx={{
                flexGrow: 1,
                lineHeight: isScrolled ? "1.5rem" : "2rem",
                borderBottom: "1px solid transparent",
                pb: "2px",
                fontWeight: isScrolled ? 500 : 400,
                cursor: editable ? "text" : "default",
              }}
              onClick={() => editable && setEditingName(true)}
            />
          )}
          {editingName && (
            <TextField
              data-testid="section-name-input"
              size="small"
              variant="standard"
              fullWidth
              value={name || ""}
              placeholder={untitledLabel}
              onChange={(event) => onNameChange(event.target.value)}
              InputProps={{
                sx: {
                  fontSize: isScrolled ? "1rem" : "1.25rem",
                  fontWeight: isScrolled ? 500 : 400,
                },
              }}
              inputRef={(input) => {
                if (input != null) input.focus();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              onBlur={() => {
                onNameBlur();
                setEditingName(false);
              }}
            />
          )}
        </Box>

        <Box
          sx={{
            flex: isScrolled ? "1 1 auto" : "1 0 auto",
            display: isScrolled && editingName ? "none" : "flex",
            px: isScrolled && !editingDescription ? 0 : 2,
            py: isScrolled ? 0 : 0.5,
            minHeight: isScrolled ? "auto" : "2rem",
            alignItems: "center",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {!editingDescription && descriptionText && (
            <HoverScrollText
              text={descriptionText}
              variant={isScrolled ? "caption" : "body2"}
              component="div"
              sx={{
                flexGrow: 1,
                lineHeight: "1.5rem",
                borderBottom: "1px solid transparent",
                pb: isScrolled ? 0 : "2px",
                color: "text.secondary",
                cursor: editable ? "text" : "default",
              }}
              onClick={() => editable && setEditingDescription(true)}
            />
          )}
          {editingDescription && (
            <TextField
              size="small"
              variant="standard"
              fullWidth
              value={description || ""}
              placeholder={addDescriptionLabel}
              onChange={(event) => onDescriptionChange(event.target.value)}
              InputProps={{
                sx: { fontSize: isScrolled ? "0.75rem" : "0.875rem" },
              }}
              inputRef={(input) => {
                if (input != null) input.focus();
              }}
              onBlur={() => {
                onDescriptionBlur();
                setEditingDescription(false);
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default SectionTitleBar;
