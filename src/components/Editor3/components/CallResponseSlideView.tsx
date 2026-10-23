"use client";

import * as React from "react";
import { Box, Typography } from "@mui/material";
import UnitContext from "../../../context/unitContext";
import type { CallResponseSlide } from "../../../utils/callResponse/buildCallResponseScript";
import {
  summarizeSlideBlocks,
  type SlideGrade,
} from "../../../utils/callResponse/gradeCues";

// Lazy: NarrativeReader imports editorConfig, which registers CallResponseNode
// from the plugin that renders this component; a static import would be circular.
const NarrativeReader = React.lazy(() => import("../NarrativeReader"));

function SlideFallback() {
  return <Box sx={{ minHeight: 48 }} aria-busy="true" />;
}

interface CallResponseSlideViewProps {
  slide: CallResponseSlide;
  cueId: string;
  /** Saved slide grade for this cue, used to restore graded block state. */
  slideGrade?: SlideGrade;
  onSlideGrade?: (cueId: string, grade: SlideGrade) => void;
  ariaLabel: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readBlocks(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : {};
  }
  return isRecord(value) ? value : {};
}

/**
 * Graded workbook blocks (Quiz, MeaningAssociation, ...) read and write grades
 * through UnitContext. Inside a graded slide that context is overridden so the
 * blocks save into the call-response cue instead of the unit grade directly.
 */
function GradedSlideContent({
  slide,
  cueId,
  slideGrade,
  onSlideGrade,
  ariaLabel,
}: CallResponseSlideViewProps & {
  slide: Extract<CallResponseSlide, { type: "lexical" }>;
}) {
  const parentContext = React.useContext(UnitContext);
  const [blocks, setBlocks] = React.useState<Record<string, unknown>>(
    () => slideGrade?.blocks ?? {},
  );
  const blocksRef = React.useRef(blocks);
  const onSlideGradeRef = React.useRef(onSlideGrade);
  onSlideGradeRef.current = onSlideGrade;

  const saveGrade = React.useCallback(
    async (next: unknown) => {
      const nextBlocks = readBlocks(next);
      blocksRef.current = nextBlocks;
      setBlocks(nextBlocks);
      onSlideGradeRef.current?.(cueId, {
        blocks: nextBlocks,
        ...summarizeSlideBlocks(nextBlocks),
      });
    },
    [cueId],
  );

  const overriddenContext = React.useMemo(
    () => ({ ...parentContext, grade: { data: blocks }, saveGrade }),
    [parentContext, blocks, saveGrade],
  );
  const contentJson = React.useMemo(
    () => JSON.stringify(slide.state),
    [slide.state],
  );

  return (
    <UnitContext.Provider value={overriddenContext}>
      <React.Suspense fallback={<SlideFallback />}>
        <NarrativeReader contentJson={contentJson} ariaLabel={ariaLabel} />
      </React.Suspense>
    </UnitContext.Provider>
  );
}

export default function CallResponseSlideView(
  props: CallResponseSlideViewProps,
) {
  const { slide, ariaLabel } = props;
  if (slide.type === "text") {
    return (
      <Box
        data-testid="call-response-slide"
        sx={{ textAlign: "center", py: 3 }}
      >
        <Typography variant="h3" component="p" aria-label={ariaLabel}>
          {slide.text}
        </Typography>
      </Box>
    );
  }
  return (
    <Box data-testid="call-response-slide" sx={{ py: 1 }}>
      {slide.graded ? (
        <GradedSlideContent {...props} slide={slide} />
      ) : (
        <React.Suspense fallback={<SlideFallback />}>
          <NarrativeReader
            contentJson={JSON.stringify(slide.state)}
            ariaLabel={ariaLabel}
          />
        </React.Suspense>
      )}
    </Box>
  );
}
