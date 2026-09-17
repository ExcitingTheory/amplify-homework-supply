"use client";

/**
 * OverflowRevealText — app-bar title/description text that becomes interactive
 * only when clipped: hovering marquee-reveals the hidden tail (leftward slide),
 * and clicking opens a popover with the full text. Extracted so the workbook,
 * editor, and Design System Showcase all share identical behavior.
 *
 * @module components/Workbook/OverflowRevealText
 */

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Popover from "@mui/material/Popover";
import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";

export interface OverflowRevealTextProps {
  text: string;
  variant?: TypographyProps["variant"];
  component?: React.ElementType;
  sx?: SxProps<Theme>;
}

export function OverflowRevealText({
  text,
  variant,
  component = "div",
  sx,
}: OverflowRevealTextProps) {
  const containerRef = React.useRef<HTMLElement | null>(null);
  const textRef = React.useRef<HTMLElement | null>(null);
  const [isClipped, setIsClipped] = React.useState(false);
  const [marqueeDistance, setMarqueeDistance] = React.useState(0);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const textElement = textRef.current;
      if (!container || !textElement) return;

      const overflow = textElement.scrollWidth - container.clientWidth;
      setIsClipped(overflow > 1);
      setMarqueeDistance(Math.max(0, overflow + 12));
    };

    measure();
    const resizeObserver = new ResizeObserver(measure);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    if (textRef.current) resizeObserver.observe(textRef.current);
    return () => resizeObserver.disconnect();
  }, [text]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (isClipped) setAnchorEl(event.currentTarget);
  };

  return (
    <>
      <Typography
        ref={containerRef as never}
        variant={variant}
        component={component}
        onClick={handleClick}
        aria-haspopup={isClipped ? "dialog" : undefined}
        sx={{
          ...sx,
          cursor: isClipped ? "pointer" : "default",
          "&:hover .overflow-reveal-text": isClipped
            ? { transform: `translateX(-${marqueeDistance}px)` }
            : undefined,
        }}
      >
        <Box
          className="overflow-reveal-text"
          component="span"
          ref={textRef as never}
          sx={{
            display: "inline-block",
            maxWidth: "none",
            transition: isClipped
              ? `transform ${Math.min(6, Math.max(1.6, marqueeDistance / 42))}s linear`
              : undefined,
            willChange: isClipped ? "transform" : undefined,
          }}
        >
          {text}
        </Box>
      </Typography>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Typography sx={{ p: 1.5, maxWidth: 360 }}>{text}</Typography>
      </Popover>
    </>
  );
}

export default OverflowRevealText;
