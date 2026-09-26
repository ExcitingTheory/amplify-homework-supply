import * as React from "react";
import { Box } from "@mui/material";

import { hexToRgb } from "../../../utils/hexToRgb";
import {
  WAVEFORM_COLOR_FALLBACKS,
  WAVEFORM_CSS_VARIABLES,
  WAVEFORM_DATA_DEFAULTS,
  WAVEFORM_LINE_STYLE,
  resolveWaveformCssColor,
  waveformAmplitudeColor,
} from "../../../utils/waveformDefaults";

const FFT_SIZE = 2048;
const HORIZONTAL_PADDING = 12;
const VERTICAL_PADDING = 8;
const MEDIA_ANALYSER_GRAPHS = new WeakMap();

export default function PlaybackWaveformVisualizer({
  mediaElement: mediaElementProp,
  muted = false,
  onLevelChange,
  player,
  visible = true,
}) {
  const canvasRef = React.useRef(null);
  const frameRef = React.useRef(null);
  const mutedRef = React.useRef(muted);
  const onLevelChangeRef = React.useRef(onLevelChange);

  React.useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  React.useEffect(() => {
    onLevelChangeRef.current = onLevelChange;
  }, [onLevelChange]);

  React.useEffect(() => {
    if (!mediaElementProp && (!player || player.isDisposed())) return undefined;

    const mediaElement = mediaElementProp || player.tech(true)?.el();
    const canvas = canvasRef.current;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!mediaElement || !canvas || !AudioContextClass) return undefined;

    let graph = MEDIA_ANALYSER_GRAPHS.get(mediaElement);
    if (!graph) {
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      const outputGain = audioContext.createGain();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.82;

      try {
        const source = audioContext.createMediaElementSource(mediaElement);
        source.connect(analyser);
        analyser.connect(outputGain);
        outputGain.connect(audioContext.destination);
        graph = { analyser, audioContext, outputGain };
        MEDIA_ANALYSER_GRAPHS.set(mediaElement, graph);
      } catch (error) {
        console.warn("Unable to connect playback waveform:", error);
        void audioContext.close();
        return undefined;
      }
    }
    const { analyser, audioContext, outputGain } = graph;

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    const timeDomainData = new Uint8Array(analyser.fftSize);
    const context = canvas.getContext("2d");
    const container = canvas.parentElement;

    const resizeCanvas = () => {
      // Use offsetWidth/offsetHeight rather than getBoundingClientRect: the
      // container's ancestor is animated with a CSS scaleY() transform for
      // show/hide, and getBoundingClientRect reflects that transform. Reading
      // the untransformed layout box keeps the canvas correctly sized even
      // while the wrapper is collapsed (scaleY(0)) before playback starts.
      const width = container.offsetWidth;
      const height = container.offsetHeight;
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);
    resizeCanvas();

    const resumeAudioContext = () => {
      if (audioContext.state === "suspended") void audioContext.resume();
    };
    if (player) player.on("play", resumeAudioContext);
    else mediaElement.addEventListener("play", resumeAudioContext);

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const primaryColor = resolveWaveformCssColor(
        WAVEFORM_CSS_VARIABLES.color,
        WAVEFORM_COLOR_FALLBACKS.color,
      );
      const rgbColor = hexToRgb(primaryColor);

      analyser.getByteFrequencyData(frequencyData);
      analyser.getByteTimeDomainData(timeDomainData);
      outputGain.gain.value = mutedRef.current ? 0 : 1;
      context.clearRect(0, 0, width, height);

      const isActive = player ? !player.paused() : !mediaElement.paused;
      if (isActive && audioContext.state === "suspended") {
        void audioContext.resume();
      }
      const rms = Math.sqrt(
        timeDomainData.reduce((sum, sample) => {
          const normalizedSample = (sample - 128) / 128;
          return sum + normalizedSample * normalizedSample;
        }, 0) / timeDomainData.length,
      );
      const outputDb = rms > 0 ? 20 * Math.log10(rms) : -60;
      const outputLevel = Math.max(0, Math.min(1, (outputDb + 60) / 60));
      onLevelChangeRef.current?.(
        isActive && !mutedRef.current ? outputLevel : 0,
      );

      const middle = height / 2;
      const maximumBarHeight = Math.max(0, middle - VERTICAL_PADDING);
      const drawableWidth = Math.max(1, width - HORIZONTAL_PADDING * 2);
      const sampleCount = Math.min(
        Math.max(1, Math.round(drawableWidth)),
        WAVEFORM_DATA_DEFAULTS.sampleCount,
      );
      const binSize = Math.max(
        1,
        Math.floor(frequencyData.length / sampleCount),
      );
      const barWidth = drawableWidth / sampleCount;
      const peakAmplitude = Math.max(...frequencyData) / 255;
      const hasAnalyserSignal = peakAmplitude >= 0.01;
      if (!isActive || !hasAnalyserSignal) {
        context.fillStyle = waveformAmplitudeColor(0, rgbColor.g, rgbColor.b);
        context.globalAlpha = 0.55;
        context.fillRect(
          HORIZONTAL_PADDING,
          middle,
          drawableWidth,
          WAVEFORM_LINE_STYLE.idleLineThickness / 2,
        );
        context.globalAlpha = 1;
        frameRef.current = window.requestAnimationFrame(draw);
        return;
      }

      for (let index = 0; index < sampleCount; index += 1) {
        let total = 0;
        const start = index * binSize;
        for (
          let dataIndex = start;
          dataIndex < start + binSize && dataIndex < frequencyData.length;
          dataIndex += 1
        ) {
          total += frequencyData[dataIndex];
        }
        const amplitude = total / binSize / 255;
        const barHeight = amplitude * maximumBarHeight;
        context.fillStyle = waveformAmplitudeColor(
          amplitude,
          rgbColor.g,
          rgbColor.b,
        );
        context.fillRect(
          HORIZONTAL_PADDING + index * barWidth,
          middle - barHeight,
          Math.max(1, barWidth - WAVEFORM_LINE_STYLE.barGap),
          barHeight * 2,
        );
      }

      frameRef.current = window.requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.cancelAnimationFrame(frameRef.current);
      resizeObserver.disconnect();
      if (player) player.off("play", resumeAudioContext);
      else mediaElement.removeEventListener("play", resumeAudioContext);
    };
  }, [mediaElementProp, player]);

  return (
    <Box
      aria-hidden={true}
      sx={{
        display: visible ? "block" : "none",
        position: "absolute",
        inset: 0,
        overflow: "hidden",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </Box>
  );
}
