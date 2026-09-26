import React, { useRef, useEffect, useState } from "react";
import { Box, Skeleton } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import { hexToRgb } from "../../../utils/hexToRgb";
import getCachedUrl from "../../../utils/getCachedUrl";
import { calculateWaveformData } from "../../../utils/calculateWaveformData";
import {
  STATIC_WAVEFORM_DEFAULTS,
  WAVEFORM_COLOR_FALLBACKS,
  WAVEFORM_CSS_VARIABLES,
  WAVEFORM_LINE_STYLE,
  resolveWaveformCssColor,
  waveformAmplitudeColor,
  waveformCssColor,
} from "../../../utils/waveformDefaults";

/**
 * StaticWaveform - Displays a static amplitude waveform for an audio file
 * Shows the audio amplitude over time without needing playback
 *
 * DO NOT MODIFY the rendering logic, canvas sizing, or wrapper Box structure
 * without thorough testing. Key invariants:
 *
 * 1. WRAPPER BOX: Returns `<Box sx={{ position: 'relative', width, height }}>` —
 *    this provides the positioning context for progress overlays rendered as
 *    siblings in AudioWaveformPlayer. Do NOT remove `position: 'relative'` or
 *    the explicit width/height.
 *
 * 2. CANVAS DIMENSIONS: Set programmatically via `canvas.width = width` /
 *    `canvas.height = height` in drawWaveform(). The canvas element itself has
 *    no inline width/height style — only display and border styles.
 *
 * 3. WAVEFORM DRAWING: Bars are drawn symmetrically from the vertical center
 *    using RMS amplitude data. Color intensity varies by amplitude. Bar width
 *    is `(canvas.width / data.length) - 0.5` for subtle spacing.
 *
 * @param {Object} props
 * @param {Object} [props.file] - File object with path, identityId, and optional waveformData
 * @param {number[]} [props.waveformData] - Pre-calculated waveform data (overrides file calculation)
 * @param {number} [props.width] - Canvas width (default: 600)
 * @param {number} [props.height] - Canvas height (default: 100)
 * @param {string} [props.backgroundColor] - Background color (default: semantic background.paper)
 * @param {boolean} [props.transparentBackground] - Leave the canvas background transparent
 * @param {boolean} [props.showLoading] - Show loading indicator (default: true)
 */
export default function StaticWaveform({
  file,
  waveformData: propWaveformData,
  width = STATIC_WAVEFORM_DEFAULTS.width,
  height = STATIC_WAVEFORM_DEFAULTS.height,
  backgroundColor,
  showLoading = true,
  transparentBackground = false,
}) {
  const t = useTranslations("editor.shared");
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const { mode } = useColorScheme();

  useEffect(() => {
    if (!file && !propWaveformData) return;

    let cancelled = false;
    setRevealed(false);

    // Read CSS variables for canvas (which can't use var())
    const resolvedBg =
      backgroundColor ||
      resolveWaveformCssColor(
        WAVEFORM_CSS_VARIABLES.background,
        WAVEFORM_COLOR_FALLBACKS.background,
      );
    const mainColor = resolveWaveformCssColor(
      WAVEFORM_CSS_VARIABLES.color,
      WAVEFORM_COLOR_FALLBACKS.color,
    );
    const rgbColor = hexToRgb(mainColor);

    const drawWaveform = async () => {
      try {
        setLoading(true);
        setError(null);

        let normalizedData;

        // Use pre-calculated data if available
        if (propWaveformData) {
          normalizedData = propWaveformData;
        } else if (file) {
          // Calculate from audio file
          const audioUrl = await getCachedUrl(file.path || file.key);
          if (!audioUrl) {
            throw new Error("Could not resolve audio URL from file");
          }
          const response = await fetch(audioUrl);
          const arrayBuffer = await response.arrayBuffer();
          normalizedData = await calculateWaveformData(arrayBuffer, width);
        } else {
          throw new Error("No waveform data or file provided");
        }

        // Draw the waveform
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";

        // Clear canvas
        if (transparentBackground) {
          ctx.clearRect(0, 0, width, height);
        } else {
          ctx.fillStyle = resolvedBg;
          ctx.fillRect(0, 0, width, height);
        }

        // Draw waveform
        const middle = height / 2;
        const samples = normalizedData.length;
        const barWidth = width / samples;

        // Check data quality
        const minVal = Math.min(...normalizedData);
        const maxVal = Math.max(...normalizedData);
        const range = maxVal - minVal;

        console.warn("🔊 WAVEFORM DEBUG:", {
          dataLength: normalizedData.length,
          barWidth,
          firstValues: normalizedData.slice(0, 5),
          minValue: minVal,
          maxValue: maxVal,
          range,
          width,
          height,
          note:
            range < 0.2
              ? "⚠️ LOW VARIANCE (AGC/compression) - stretching for visibility"
              : "✅ Good variance",
        });

        // Re-normalize if variance is too low (typical of browser microphone recordings with AGC)
        // This stretches the visible waveform without changing the actual audio
        let displayData = normalizedData;
        if (range > 0 && range < 0.2) {
          displayData = normalizedData.map((val) => (val - minVal) / range);
        } else if (range === 0 && maxVal > 0) {
          // All values identical (e.g. all 1.0) — show flat at half height
          displayData = normalizedData.map(() => 0.5);
        }

        for (let i = 0; i < displayData.length; i++) {
          const barHeight = displayData[i] * middle;
          const x = i * barWidth;

          ctx.fillStyle = waveformAmplitudeColor(
            displayData[i],
            rgbColor.g,
            rgbColor.b,
          );

          // Draw from middle outward (symmetric)
          ctx.fillRect(
            x,
            middle - barHeight,
            Math.max(1, barWidth - WAVEFORM_LINE_STYLE.barGap),
            barHeight * 2,
          );
        }

        setLoading(false);
        // Wait a frame so the browser paints the collapsed (scaleY(0)) state
        // before animating in, growing the waveform from the center line.
        requestAnimationFrame(() => {
          if (!cancelled) requestAnimationFrame(() => setRevealed(true));
        });
      } catch (err) {
        console.error("Error drawing waveform:", err);
        // Don't show error for encoding issues in development/storybook
        if (err.name === "EncodingError") {
          // Draw a placeholder waveform
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = "source-over";
            if (transparentBackground) {
              ctx.clearRect(0, 0, width, height);
            } else {
              ctx.fillStyle = resolvedBg;
              ctx.fillRect(0, 0, width, height);
            }

            // Draw simple placeholder bars
            const middle = height / 2;
            const bars = WAVEFORM_LINE_STYLE.placeholderBarCount;
            const barWidth = width / bars;

            for (let i = 0; i < bars; i++) {
              const barHeight =
                Math.random() *
                middle *
                WAVEFORM_LINE_STYLE.placeholderMaxAmplitude;
              const x = i * barWidth;
              ctx.fillStyle = `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`;
              ctx.fillRect(
                x,
                middle - barHeight,
                barWidth - WAVEFORM_LINE_STYLE.placeholderBarGap,
                barHeight * 2,
              );
            }
          }
        } else {
          setError(err.message);
        }
        setLoading(false);
        requestAnimationFrame(() => {
          if (!cancelled) requestAnimationFrame(() => setRevealed(true));
        });
      }
    };

    drawWaveform();

    return () => {
      cancelled = true;
    };
  }, [
    file,
    propWaveformData,
    width,
    height,
    backgroundColor,
    mode,
    transparentBackground,
  ]);

  if (error) {
    return (
      <Box
        sx={{
          width,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #ccc",
          borderRadius: 1,
          color: "error.main",
        }}
      >
        {t("staticWaveform.errorLoading")}
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative", width, height }}>
      {loading && showLoading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: waveformCssColor(
              WAVEFORM_CSS_VARIABLES.background,
              WAVEFORM_COLOR_FALLBACKS.background,
            ),
            opacity: 0.8,
            zIndex: 1,
          }}
        >
          <Skeleton
            variant="rectangular"
            width="100%"
            height={30}
            sx={{ borderRadius: 1 }}
          />
        </Box>
      )}
      <Box
        sx={{
          width: "100%",
          height: "100%",
          transform: revealed ? "scaleY(1)" : "scaleY(0)",
          transformOrigin: "center",
          transition: "transform 320ms cubic-bezier(0.77, 0, 0.175, 1)",
          willChange: "transform",
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            border: `${WAVEFORM_LINE_STYLE.borderWidth}px solid ${waveformCssColor(
              WAVEFORM_CSS_VARIABLES.border,
              WAVEFORM_COLOR_FALLBACKS.border,
            )}`,
            borderRadius: `${WAVEFORM_LINE_STYLE.borderRadius}px`,
          }}
        />
      </Box>
    </Box>
  );
}
