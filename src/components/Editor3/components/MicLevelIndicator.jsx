import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import { Box, Typography, Tooltip } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { createAudioLevelMonitor, rmsToPercent } from '../../../utils/audioLevelMonitor';

/**
 * MicLevelIndicator — thin horizontal meter that shows live mic input level.
 *
 * Attach an AnalyserNode via the `analyser` prop and it handles the rest:
 * green when levels are good, yellow when too low, red when silent.
 * Shows a warning tooltip when the input has been too low for a sustained period.
 *
 * @param {Object} props
 * @param {AnalyserNode|null} props.analyser - Web Audio AnalyserNode to monitor
 * @param {number} [props.lowThresholdDb=-50] - dB below which "too low" fires
 * @param {number} [props.silenceThresholdDb=-70] - dB below which "silent" fires
 * @param {number} [props.warningDelaySec=3] - Seconds of sustained low level before warning
 * @param {number} [props.width] - Optional fixed width (defaults to 100%)
 */
export default function MicLevelIndicator({
  analyser,
  lowThresholdDb = -50,
  silenceThresholdDb = -70,
  warningDelaySec = 3,
  width,
}) {
  const { t } = useTranslation('editor.shared');
  const [level, setLevel] = useState(0); // 0-100
  const [status, setStatus] = useState('ok'); // 'ok' | 'low' | 'silent'
  const [showWarning, setShowWarning] = useState(false);

  const lowSinceRef = useRef(null); // timestamp when level first went low

  const handleLevel = useCallback(
    (data) => {
      setLevel(rmsToPercent(data.rms));

      if (data.silent) {
        setStatus('silent');
      } else if (data.tooLow) {
        setStatus('low');
      } else {
        setStatus('ok');
        lowSinceRef.current = null;
        setShowWarning(false);
      }

      // Track sustained low input
      if (data.tooLow || data.silent) {
        if (!lowSinceRef.current) {
          lowSinceRef.current = Date.now();
        } else if (Date.now() - lowSinceRef.current > warningDelaySec * 1000) {
          setShowWarning(true);
        }
      }
    },
    [warningDelaySec],
  );

  useEffect(() => {
    if (!analyser) {
      setLevel(0);
      setStatus('ok');
      setShowWarning(false);
      lowSinceRef.current = null;
      return;
    }

    const monitor = createAudioLevelMonitor(analyser, {
      lowThresholdDb,
      silenceThresholdDb,
      intervalMs: 80,
      onLevel: handleLevel,
    });

    monitor.start();
    return () => monitor.stop();
  }, [analyser, lowThresholdDb, silenceThresholdDb, handleLevel]);

  // Color by status
  const barColor =
    status === 'silent'
      ? 'error.main'
      : status === 'low'
        ? 'warning.main'
        : 'success.main';

  const iconColor =
    status === 'silent' ? 'error' : status === 'low' ? 'warning' : 'success';

  if (!analyser) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        width: width || '100%',
      }}
    >
      {/* Mic icon */}
      {status === 'silent' ? (
        <MicOffIcon color={iconColor} sx={{ fontSize: 18 }} />
      ) : (
        <MicIcon color={iconColor} sx={{ fontSize: 18 }} />
      )}

      {/* Level meter */}
      <Box
        sx={{
          flexGrow: 1,
          height: 6,
          borderRadius: 3,
          bgcolor: 'action.hover',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            height: '100%',
            width: `${level}%`,
            bgcolor: barColor,
            borderRadius: 3,
            transition: 'width 80ms linear, background-color 200ms ease',
          }}
        />
      </Box>

      {/* Warning */}
      {showWarning && (
        <Tooltip
          title={
            status === 'silent'
              ? t('micLevelIndicator.noSignal')
              : t('micLevelIndicator.tooLow')
          }
          open
          arrow
          placement="top"
        >
          <WarningAmberIcon color="warning" sx={{ fontSize: 18 }} />
        </Tooltip>
      )}

      {/* Brief text label when warning */}
      {showWarning && (
        <Typography
          variant="caption"
          color={status === 'silent' ? 'error' : 'warning.main'}
          sx={{ whiteSpace: 'nowrap', fontWeight: 500 }}
        >
          {status === 'silent'
            ? t('micLevelIndicator.noSignalShort')
            : t('micLevelIndicator.tooLowShort')}
        </Typography>
      )}
    </Box>
  );
}
