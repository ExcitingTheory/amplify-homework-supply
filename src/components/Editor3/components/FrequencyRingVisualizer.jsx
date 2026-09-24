import * as React from "react";
import { Box } from "@mui/material";

import { hexToRgb } from "../../../utils/hexToRgb";

const FFT_SIZE = 256;
const SPIKE_COUNT = 128;

export function buildSpikePoints({
  cx,
  cy,
  innerRadius,
  outerRadius,
  angle,
  spread,
}) {
  const halfSpread = spread / 2;
  const startAngle = angle - halfSpread;
  const endAngle = angle + halfSpread;

  return [
    [
      cx + Math.cos(startAngle) * innerRadius,
      cy + Math.sin(startAngle) * innerRadius,
    ],
    [
      cx + Math.cos(startAngle) * outerRadius,
      cy + Math.sin(startAngle) * outerRadius,
    ],
    [cx + Math.cos(angle) * outerRadius, cy + Math.sin(angle) * outerRadius],
    [
      cx + Math.cos(endAngle) * outerRadius,
      cy + Math.sin(endAngle) * outerRadius,
    ],
    [
      cx + Math.cos(endAngle) * innerRadius,
      cy + Math.sin(endAngle) * innerRadius,
    ],
  ];
}

export default function FrequencyRingVisualizer({
  player,
  visible = true,
  designMode: designModeProp = "rings",
  onLevelChange,
}) {
  const canvasRef = React.useRef(null);
  const frameRef = React.useRef(null);
  const onLevelChangeRef = React.useRef(onLevelChange);
  const spikeHeights = React.useRef(new Float32Array(SPIKE_COUNT));

  const ringHeights = React.useRef(new Float32Array(8));
  const designMode = React.useRef(designModeProp);

  React.useEffect(() => {
    designMode.current = designModeProp;
  }, [designModeProp]);

  React.useEffect(() => {
    onLevelChangeRef.current = onLevelChange;
  }, [onLevelChange]);

  React.useEffect(() => {
    if (!player || player.isDisposed()) return undefined;

    const mediaElement = player.tech(true)?.el();
    const canvas = canvasRef.current;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!mediaElement || !canvas || !AudioContextClass) return undefined;

    const audioContext = new AudioContextClass();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.85;

    let source;
    try {
      source = audioContext.createMediaElementSource(mediaElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
    } catch (error) {
      console.warn("Unable to connect media visualization:", error);
      void audioContext.close();
      return undefined;
    }

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    const timeDomainData = new Uint8Array(analyser.fftSize);
    const context = canvas.getContext("2d");
    const container = canvas.parentElement;

    const resizeCanvas = () => {
      const bounds = container.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
      canvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));
      canvas.style.width = `${bounds.width}px`;
      canvas.style.height = `${bounds.height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);
    resizeCanvas();

    const resumeAudioContext = () => {
      if (audioContext.state === "suspended") {
        void audioContext.resume();
      }
    };
    const resetSpikes = () => {
      spikeHeights.current.fill(0);
      ringHeights.current.fill(0);
      onLevelChangeRef.current?.(0);
    };
    player.on("play", resumeAudioContext);
    player.on("loadstart", resetSpikes);

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const styles = getComputedStyle(document.documentElement);
      const backgroundColor =
        styles.getPropertyValue("--mui-palette-background-paper").trim() ||
        "#ffffff";
      const primaryColor =
        styles.getPropertyValue("--mui-palette-primary-main").trim() ||
        "#556cd6";
      const rgbColor = hexToRgb(primaryColor);

      analyser.getByteFrequencyData(frequencyData);
      analyser.getByteTimeDomainData(timeDomainData);
      context.clearRect(0, 0, width, height);
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, width, height);

      const isActive = !player.paused() && !player.muted();
      const peakLevel = frequencyData.reduce(
        (maxValue, value) => Math.max(maxValue, value / 255),
        0,
      );
      const rms = Math.sqrt(
        timeDomainData.reduce((sum, sample) => {
          const normalizedSample = (sample - 128) / 128;
          return sum + normalizedSample * normalizedSample;
        }, 0) / timeDomainData.length,
      );
      const outputDb = rms > 0 ? 20 * Math.log10(rms) : -60;
      const rmsLevel = Math.max(0, Math.min(1, (outputDb + 60) / 60));
      const frequencyDb = -90 + peakLevel * 80;
      const frequencyLevel = Math.max(0, Math.min(1, (frequencyDb + 60) / 60));
      const outputLevel = Math.max(rmsLevel, frequencyLevel);
      onLevelChangeRef.current?.(isActive ? outputLevel : 0);

      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(width, height) * 0.35;
      const minRadius = Math.min(width, height) * 0.17;
      const ringBaseRadius = maxRadius * 0.72;
      const time = performance.now() * 0.001;

      // Concentric rings (top middle design) - faster decay
      if (designMode.current === "rings") {
        const RING_COUNT = 8;
        for (let ring = 0; ring < RING_COUNT; ring += 1) {
          const freqBand = Math.floor(
            (ring / RING_COUNT) * frequencyData.length,
          );
          const targetHeight = frequencyData[freqBand] / 255;
          const currentHeight = ringHeights.current[ring];

          // Faster decay: 0.15 easing for snappier response
          ringHeights.current[ring] += (targetHeight - currentHeight) * 0.15;

          const radius =
            minRadius + ringHeights.current[ring] * (maxRadius - minRadius);
          const intensity = Math.floor(100 + ringHeights.current[ring] * 155);
          const alpha = 0.2 + ringHeights.current[ring] * 0.8;

          context.strokeStyle = `rgba(${intensity}, ${rgbColor.g}, ${rgbColor.b}, ${alpha})`;
          context.lineWidth = 2;
          context.lineCap = "round";

          context.beginPath();
          context.arc(centerX, centerY, radius, 0, Math.PI * 2);
          context.stroke();
        }
      }

      // Center-top reference: a dense circular ring of radial bars with a soft
      // purple-pink glow and a clean hole in the center.
      if (designMode.current === "center-top") {
        const innerRadius = maxRadius * 0.27;
        const ringThickness = maxRadius * 0.7;
        const outerRadius = innerRadius + ringThickness;

        for (let i = 0; i < SPIKE_COUNT; i += 1) {
          const frequencyIndex = Math.floor(
            (i / SPIKE_COUNT) * frequencyData.length,
          );
          const bandLevel = frequencyData[frequencyIndex] / 255;
          const currentHeight = spikeHeights.current[i];
          const targetHeight = Math.max(0.16, bandLevel * 1.1);
          const smoothed = currentHeight + (targetHeight - currentHeight) * 0.2;
          spikeHeights.current[i] = smoothed;

          const angle = (i / SPIKE_COUNT) * Math.PI * 2;
          const startRadius = innerRadius + 1;
          const barLength = 10 + smoothed * (outerRadius - startRadius - 12);
          const startX = centerX + Math.cos(angle) * startRadius;
          const startY = centerY + Math.sin(angle) * startRadius;
          const endX = centerX + Math.cos(angle) * (startRadius + barLength);
          const endY = centerY + Math.sin(angle) * (startRadius + barLength);

          const hue = 300 - (i / SPIKE_COUNT) * 40;
          const alpha = 0.45 + smoothed * 0.55;

          context.beginPath();
          context.moveTo(startX, startY);
          context.lineTo(endX, endY);
          context.strokeStyle = `hsla(${hue}, 86%, 68%, ${alpha})`;
          context.lineWidth = 1.4 + smoothed * 2.2;
          context.lineCap = "round";
          context.shadowBlur = 8 + smoothed * 14;
          context.shadowColor = `hsla(${hue}, 90%, 70%, 0.9)`;
          context.stroke();
        }

        context.beginPath();
        context.arc(centerX, centerY, innerRadius * 0.8, 0, Math.PI * 2);
        context.fillStyle = backgroundColor;
        context.fill();
        context.shadowBlur = 0;
      }

      // Radial spikes: keep a rounded circular base and extend each petal outward
      // from a donut ring rather than from the center so it reads like a proper
      // waveform-style indicator.
      if (designMode.current === "spikes") {
        context.beginPath();
        context.arc(centerX, centerY, ringBaseRadius, 0, Math.PI * 2);
        context.lineWidth = 1.2;
        context.strokeStyle = `rgba(${Math.floor(120 + 0.35 * 255)}, ${rgbColor.g}, ${rgbColor.b}, 0.28)`;
        context.stroke();

        for (let i = 0; i < SPIKE_COUNT; i += 1) {
          const frequencyIndex = Math.floor(
            (i / SPIKE_COUNT) * frequencyData.length,
          );
          const bandLevel = frequencyData[frequencyIndex] / 255;
          const currentHeight = spikeHeights.current[i];

          const targetHeight = Math.max(
            bandLevel * 0.75,
            peakLevel *
              (0.48 + (Math.sin((i / SPIKE_COUNT) * Math.PI * 2) + 1) * 0.18),
          );

          spikeHeights.current[i] += (targetHeight - currentHeight) * 0.32;

          const angle = (i / SPIKE_COUNT) * Math.PI * 2;
          const height = spikeHeights.current[i];
          const spikeLength =
            ringBaseRadius + height * (maxRadius - ringBaseRadius) * 0.9;
          const spikeWidth = ((Math.PI * 2) / SPIKE_COUNT) * 0.38;
          const intensity = Math.floor(110 + height * 145);
          const alpha = 0.28 + height * 0.72;
          const points = buildSpikePoints({
            cx: centerX,
            cy: centerY,
            innerRadius: ringBaseRadius,
            outerRadius: spikeLength,
            angle,
            spread: spikeWidth,
          });

          context.beginPath();
          points.forEach(([x, y], pointIndex) => {
            if (pointIndex === 0) {
              context.moveTo(x, y);
            } else {
              context.lineTo(x, y);
            }
          });
          context.closePath();
          context.shadowBlur = 10 + height * 18;
          context.shadowColor = `rgba(${intensity}, ${rgbColor.g}, ${rgbColor.b}, 0.8)`;
          context.fillStyle = `rgba(${intensity}, ${rgbColor.g}, ${rgbColor.b}, ${alpha})`;
          context.fill();
          context.strokeStyle = `rgba(${intensity}, ${rgbColor.g}, ${rgbColor.b}, ${Math.min(1, alpha + 0.15)})`;
          context.lineWidth = Math.max(1.1, 1.5 + height * 2.2);
          context.lineJoin = "round";
          context.stroke();
        }
        context.shadowBlur = 0;
      }
      frameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(frameRef.current);
      resizeObserver.disconnect();
      player.off("play", resumeAudioContext);
      player.off("loadstart", resetSpikes);
      source.disconnect();
      analyser.disconnect();
      void audioContext.close();
    };
  }, [player]);

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
