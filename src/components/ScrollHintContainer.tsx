"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import type { SxProps, Theme } from "@mui/material/styles";

export interface ScrollHintContainerProps {
  children: React.ReactNode;
  /** Styles for the outer wrapper (defaults to filling the available flex space). */
  sx?: SxProps<Theme>;
  /** Height in px of each overlay arrow. */
  arrowHeight?: number;
}

// Sub-pixel scroll positions on high-DPI screens can leave a fraction of a pixel.
const EDGE_TOLERANCE_PX = 1;

const arrowSx = (
  edge: "top" | "bottom",
  visible: boolean,
  height: number,
): SxProps<Theme> => ({
  position: "absolute",
  left: 0,
  right: 0,
  [edge]: 0,
  height,
  zIndex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "text.secondary",
  backgroundColor: "background.paper",
  opacity: visible ? 0.92 : 0,
  pointerEvents: visible ? "auto" : "none",
  transition: "opacity 0.2s ease",
  [edge === "top" ? "borderBottom" : "borderTop"]: "1px solid",
  borderColor: "divider",
  "&:hover": { color: "text.primary" },
});

/**
 * Vertically scrollable region that shows an up/down arrow at the edge(s) with
 * more content out of view, mirroring MUI scrollable Tabs scroll buttons:
 * at the top only the bottom arrow, at the bottom only the top arrow, and in
 * between both. The arrows overlay the content so appearing/disappearing never
 * shifts layout.
 */
export default function ScrollHintContainer({
  children,
  sx,
  arrowHeight = 28,
}: ScrollHintContainerProps) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = React.useState(false);
  const [canScrollDown, setCanScrollDown] = React.useState(false);

  const update = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    setCanScrollUp(el.scrollTop > EDGE_TOLERANCE_PX);
    setCanScrollDown(maxScroll - el.scrollTop > EDGE_TOLERANCE_PX);
  }, []);

  React.useEffect(() => {
    const scroller = scrollerRef.current;
    const content = contentRef.current;
    if (!scroller) return undefined;

    update();
    scroller.addEventListener("scroll", update, { passive: true });

    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(update);
      observer.observe(scroller);
      if (content) observer.observe(content);
    }

    return () => {
      scroller.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, [update]);

  const scrollByPage = (direction: 1 | -1) => (event: React.SyntheticEvent) => {
    // The drawer wrapper closes itself on click/keydown; arrows must not trigger that.
    event.stopPropagation();
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ top: direction * el.clientHeight * 0.8, behavior: "smooth" });
  };

  return (
    <Box
      sx={[
        { position: "relative", flex: 1, minHeight: 0, display: "flex" },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <ButtonBase
        aria-hidden="true"
        tabIndex={-1}
        data-testid="scroll-hint-up"
        data-visible={canScrollUp}
        onClick={scrollByPage(-1)}
        onKeyDown={(event) => event.stopPropagation()}
        sx={arrowSx("top", canScrollUp, arrowHeight)}
      >
        <KeyboardArrowUpIcon fontSize="small" />
      </ButtonBase>
      <Box
        ref={scrollerRef}
        sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}
      >
        <div ref={contentRef}>{children}</div>
      </Box>
      <ButtonBase
        aria-hidden="true"
        tabIndex={-1}
        data-testid="scroll-hint-down"
        data-visible={canScrollDown}
        onClick={scrollByPage(1)}
        onKeyDown={(event) => event.stopPropagation()}
        sx={arrowSx("bottom", canScrollDown, arrowHeight)}
      >
        <KeyboardArrowDownIcon fontSize="small" />
      </ButtonBase>
    </Box>
  );
}
