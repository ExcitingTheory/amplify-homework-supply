'use strict';
import React from 'react';
import { useTranslation } from 'next-i18next';
import FilesContext from '../context/fileContext';
import DictionaryContext from '../context/dictionaryContext';
import StopIcon from '@mui/icons-material/Stop';
import PlayIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RecordIcon from '@mui/icons-material/KeyboardVoice';
import StaticWaveform from './Editor3/components/StaticWaveform';
import AudioWaveformPlayer from './Editor3/components/AudioWaveformPlayer';
import MicLevelIndicator from './Editor3/components/MicLevelIndicator';
import { calculateWaveformData } from '../utils/calculateWaveformData';
// import { SvgConverter } from './Editor2';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { hexToRgb } from "../utils/hexToRgb";

import getCachedUrl from '../utils/getCachedUrl';
import UnitContext from '../context/unitContext';
import { uploadStudentSubmission } from '../utils/userSubmissionStorage';

import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { getAmplifyClient } from '../utils/amplifyClient';

// Component to handle async audio URL loading
function AudioRecordingCard({ file, index, identityId }) {
  const { t } = useTranslation('components');
  const [audioUrl, setAudioUrl] = React.useState(null);
  
  React.useEffect(() => {
    if (file.path) {
      getCachedUrl(file.path, 'protected', identityId)
        .then(url => setAudioUrl(url))
        .catch(err => console.error('Error loading audio URL:', err));
    }
  }, [file.path, identityId]);

  return (
    <Card 
      sx={{ 
        boxShadow: 3,
        '&:hover': {
          boxShadow: 6
        }
      }}
    >
      <CardContent>
        {audioUrl ? (
          <AudioWaveformPlayer
            audioUrl={audioUrl}
            file={file}
            waveformData={file.waveformData ? JSON.parse(file.waveformData) : undefined}
            width={600}
            height={80}
            title={file.name || t('components:recordingStudio2.recordingNumber', { number: index + 1 })}
            showDuration={true}
          />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {file.name || t('components:recordingStudio2.recordingNumber', { number: index + 1 })}
            </Typography>
            <StaticWaveform 
              file={file} 
              width={600} 
              height={80}
              backgroundColor="transparent"
            />
            <Typography variant="caption" color="text.secondary">
              {new Date(file.createdAt).toLocaleString()}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export function RecordingStudio2({ word, item, qk, setFeedback, setFileOperations, requestDefinition, feedback, isCorrect}) {
  // TODO: add a way to delete the recording
  // TODO: add a way to list multiple recordings
  // TODO: add a way to update the word with the recording,
  // TODO: upload to s3
  // TODO: when you
  // TODO: load from s3 audio context
  // TODO: a hidden input that allows you to upload a file
  // TODO: a hidden input that allows you to update the word phrase and pronunciation
  // if during the recording, you change the word, then it should update the word

  const { t } = useTranslation('components');
  const [recording, setRecording] = React.useState(false);
  const [mediaRecorder, setMediaRecorder] = React.useState(null);
  const [audioBlob, setAudioBlob] = React.useState(null);
  const [waveformData, setWaveformData] = React.useState(null);
  const [error, setError] = React.useState(null);
  // const [objectUrl, setObjectUrl] = React.useState(null);
  const audioRef = React.useRef(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  // Active analyser for mic level monitoring
  const [recordingAnalyser, setRecordingAnalyser] = React.useState(null);
  // Track stream for cleanup
  const streamRef = React.useRef(null);


  const { audioFiles } = React.useContext(FilesContext);

  const theme = useTheme();
  const mainColor = theme.palette.primary.main;

  console.log('FileManager.mainColor', mainColor);

  const rgbColor = hexToRgb(mainColor); // Replace 'primary.main' with the color you want to convert
  console.log('rgbColor, rgbColor'); // Output: "rgb(33, 150, 243)"
  const _r = rgbColor.r;
  const _g = rgbColor.g;
  const _b = rgbColor.b;




  console.log('audioFiles', audioFiles);

  // lookup pronunciation from input item
  const phrase = item?.phrase;
  const definition = item?.definition;
  const pronunciation = item?.pronunciation;

  const canvasRef = React.useRef(null);
  const audioContextRef = React.useRef(null);
  const sourceRef = React.useRef(null);
  const analyserRef = React.useRef(null);

  console.log('_word, phrase, definition, pronunciation', phrase, definition, pronunciation);

  const {
    grade,
    createGrade,
    saveGrade,
  } = React.useContext(UnitContext);

  const {
    session: { identityId },
  } = React.useContext(FilesContext);



  const lookupWord = (phrase || '') + (pronunciation || '');
  const audioFile = audioFiles[lookupWord] ? audioFiles[lookupWord] : null;

  console.log('audioFile', audioFile);

  React.useEffect(() => {
    let cancelled = false;
    async function uploadSignAndVerifyAudio() {
      if (!audioBlob) return;
      setError(null);
      try {
        let gradeID = grade ? grade.id : null;
        if (!grade) {
          const _updatedGrade = await createGrade();
          gradeID = _updatedGrade.id;
        }
        const nodeKey = qk || 'unknown';
        const waveformData = await calculateWaveformData(audioBlob, 600);
        const uploadResult = await uploadStudentSubmission({
          file: audioBlob,
          gradeId: gradeID,
          nodeKey,
          fileType: 'mp3',
          metadata: {
            waveformData: JSON.stringify(waveformData),
            phrase: phrase || '',
            definition: definition || '',
          },
        });
        const client = getAmplifyClient();
        const { username: owner } = await getCurrentUser();
        const { data: newFile, errors: fileErrors } = await client.models.File.create({
          path: uploadResult.path,
          owner,
          identityId,
          name: uploadResult.filename,
          size: audioBlob.size,
          mimeType: 'audio/mp3',
          level: 'PRIVATE',
          waveformData: JSON.stringify(waveformData),
        });
        if ((fileErrors && fileErrors.length > 0) || !newFile) {
          setError(fileErrors?.[0]?.message || 'Failed to create File record');
          return;
        }
        if (grade && grade.id) {
          const existingFiles = grade.files || [];
          await client.models.Grade.update({
            id: grade.id,
            files: [...existingFiles, uploadResult.path],
            identityId: grade.identityId || identityId,
          });
        }
        const url = await getCachedUrl(uploadResult.path, 'private', identityId);
        const { data, errors } = await client.queries.verifyAudioUrl({
          expected: requestDefinition ? definition : phrase,
          audioUrl: url,
          model: 'whisper-1',
          chatModel: 'gpt-3.5-turbo',
        });
        if (errors && errors.length > 0) {
          setError(errors[0]?.message || 'Audio verification failed');
          return;
        }
        if (!cancelled) {
          const feedbackData = JSON.parse(data) || {};
          setFeedback(feedbackData);
        }
      } catch (err) {
        setError(err?.message || 'Audio upload/verification failed');
      }
    }
    uploadSignAndVerifyAudio();
    return () => { cancelled = true; };
  }, [audioBlob]);

  // let mediaRecorder = null;
  // if there are no audio files, then we need to create a new one
  const handlePlay = (e) => {
    // e.preventDefault();
    // e.stopPropagation();

    const audio = audioRef.current;

    if (!audio) {
        return;
    } else if (audio.srcObject) {
        const tracks = audio.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        audio.srcObject = null;
    }

    const audioContext = audioContextRef.current || new AudioContext();
    const source = sourceRef.current || audioContext.createMediaElementSource(audio);
    const analyser = analyserRef.current || audioContext.createAnalyser();

    sourceRef.current = source;
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;

    const canvas = canvasRef.current;
    // const timeline = timelineRef.current;
    const canvasCtx = canvas.getContext('2d');
    // const timelineCtx = timeline.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    // const timelineDataArray = new Uint8Array(bufferLength);

    // setDataArray(dataArray);
    const draw = () => {
        requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);
        // TODO make this white or black depending on if its light or dark mode
        canvasCtx.fillStyle = 'rgb(255, 255, 255)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        // Find the maximum value in the dataArray
        // Prevent division by zero when analyser returns silence (all zeros)
        const max = Math.max(...dataArray) || 1;

        // Reflect the canvas horizontally
        canvasCtx.scale(-1, 1);
        canvasCtx.translate(-canvas.width, 0);

        for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / max) * canvas.height / 2;

            canvasCtx.fillStyle = `rgb(${barHeight + 100},${_g},${_b})`;
            canvasCtx.fillRect(canvas.width - (x + barWidth / 2), canvas.height / 2 - (barHeight / 2), barWidth, barHeight);

            x += barWidth + 1;
        }

        // Reset the canvas transformation
        canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
    };

    draw();

    audioRef.current.load();
    audioRef.current.play();
    setIsPlaying(true);



  };

  const handlePause = (e) => {
    // e.preventDefault();
    // e.stopPropagation();
    audioRef.current.pause();
    setIsPlaying(false);
  };


  const handleEnded = () => {
    setIsPlaying(false);
  };

  const startRecording = async () => {
    if (recording || mediaRecorder) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorderInstance = new MediaRecorder(stream);
      setMediaRecorder(mediaRecorderInstance);
      setRecording(true);
      const audioChunks = [];
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      setRecordingAnalyser(analyser);
      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext('2d');
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let stopped = false;
      mediaRecorderInstance.addEventListener('dataavailable', (event) => {
        audioChunks.push(event.data);
      });
      mediaRecorderInstance.addEventListener('stop', async () => {
        if (stopped) return;
        stopped = true;
        try {
          const _audioBlob = new Blob(audioChunks);
          setAudioBlob(_audioBlob);
          const waveform = await calculateWaveformData(_audioBlob, 600);
          setWaveformData(waveform);
        } catch (error) {
          setError('Error calculating waveform: ' + (error?.message || error));
        }
        // Clean up audio context
        audioContext.close();
      });
      const draw = () => {
        if (!recording) return;
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        canvasCtx.fillStyle = 'rgb(255, 255, 255)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        const max = Math.max(...dataArray) || 1;
        canvasCtx.save();
        canvasCtx.scale(-1, 1);
        canvasCtx.translate(-canvas.width, 0);
        for (let i = 0; i < bufferLength; i++) {
          barHeight = (dataArray[i] / max) * canvas.height / 2;
          canvasCtx.fillStyle = `rgb(${barHeight + 100},${_g},${_b})`;
          canvasCtx.fillRect(canvas.width - (x + barWidth / 2), canvas.height / 2 - (barHeight / 2), barWidth, barHeight);
          x += barWidth + 1;
        }
        canvasCtx.restore();
      };
      draw();
      mediaRecorderInstance.start();
    } catch (err) {
      setError('Microphone access or recording failed: ' + (err?.message || err));
      setRecording(false);
      setMediaRecorder(null);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorder) return;
    try {
      mediaRecorder.stop();
    } catch (err) {
      setError('Failed to stop recording: ' + (err?.message || err));
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsPlaying(false);
    setRecording(false);
    setMediaRecorder(null);
    setRecordingAnalyser(null);
  };

  const doNothing = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  React.useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (mediaRecorder) {
        try { mediaRecorder.stop(); } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, []);

  return (
    <>
      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}
      <Box>
        {audioFile && (
          <>
            <audio
              controls={false}
              ref={audioRef}
              onEnded={handleEnded}
            >
              <source src={audioFile} />
            </audio>
            {!isPlaying && <PlayIcon
              color="primary"
              sx={{ position: 'relative', top: '0.2rem', cursor: 'pointer' }}
              onClick={handlePlay} />}
            {isPlaying && <PauseIcon
              color="primary"
              sx={{ position: 'relative', top: '0.2rem', cursor: 'pointer' }}
              onClick={handlePause} />}
          </>
        )}
        {!recording && (
          <RecordIcon
            color="primary"
            onClick={startRecording}
            sx={{ position: 'relative', top: '0.2rem', cursor: 'pointer' }}
          />
        )}
        {recording && (
          <StopIcon
            onClick={stopRecording}
            color="error"
            sx={{ position: 'relative', top: '0.2rem', cursor: 'pointer' }}
          />
        )}
        {audioBlob && (
          <>
            <audio
              controls={false}
              ref={audioRef}
              onEnded={handleEnded}
            >
              <source src={URL.createObjectURL(audioBlob)} />
            </audio>
            {!isPlaying && <PlayIcon
              color="primary"
              sx={{ position: 'relative', top: '0.2rem', cursor: 'pointer' }}
              onClick={handlePlay} />}
            {isPlaying && <PauseIcon
              color="primary"
              sx={{ position: 'relative', top: '0.2rem', cursor: 'pointer' }}
              onClick={handlePause} />}
          </>
        )}
      </Box>
      <canvas
        ref={canvasRef}
        id="waveform"
        style={{ backgroundColor: 'white' }}
      />
      {/* Mic level indicator during recording */}
      {recording && (
        <Box sx={{ mt: 1 }}>
          <MicLevelIndicator analyser={recordingAnalyser} />
        </Box>
      )}
      {/* Display all existing audio recordings */}
      {Object.keys(audioFiles).length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>{t('components:recordingStudio2.existingRecordings')}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {Object.values(audioFiles).map((file, index) => (
              <AudioRecordingCard
                key={file.id || index}
                file={file}
                index={index}
                identityId={identityId}
              />
            ))}
          </Box>
        </Box>
      )}
      {audioFile && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">{t('components:recordingStudio2.staticWaveformPreview')}</Typography>
          <StaticWaveform
            file={audioFile}
            width={600}
            height={80}
          />
        </Box>
      )}
      {waveformData && audioBlob && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">{t('components:recordingStudio2.recordedAudioWaveform')}</Typography>
          <StaticWaveform
            waveformData={waveformData}
            width={600}
            height={80}
          />
        </Box>
      )}
    </>
  );
}




// private renderLineWaveform(
//   channelData: Array<Float32Array | number[]>,
//   _options: WaveSurferOptions,
//   ctx: CanvasRenderingContext2D,
//   vScale: number,
// ) {
//   const drawChannel = (index: number) => {
//     const channel = channelData[index] || channelData[0]
//     const length = channel.length
//     const { height } = ctx.canvas
//     const halfHeight = height / 2
//     const hScale = ctx.canvas.width / length

//     ctx.moveTo(0, halfHeight)

//     let prevX = 0
//     let max = 0
//     for (let i = 0; i <= length; i++) {
//       const x = Math.round(i * hScale)

//       if (x > prevX) {
//         const h = Math.round(max * halfHeight * vScale) || 1
//         const y = halfHeight + h * (index === 0 ? -1 : 1)
//         ctx.lineTo(prevX, y)
//         prevX = x
//         max = 0
//       }

//       const value = Math.abs(channel[i] || 0)
//       if (value > max) max = value
//     }

//     ctx.lineTo(prevX, halfHeight)
//   }

//   ctx.beginPath()

//   drawChannel(0)
//   drawChannel(1)

//   ctx.fill()
//   ctx.closePath()
// }

// private renderWaveform(
//   channelData: Array<Float32Array | number[]>,
//   options: WaveSurferOptions,
//   ctx: CanvasRenderingContext2D,
// ) {
//   ctx.fillStyle = this.convertColorValues(options.waveColor)

//   // Custom rendering function
//   if (options.renderFunction) {
//     options.renderFunction(channelData, ctx)
//     return
//   }

//   // Vertical scaling
//   let vScale = options.barHeight || 1
//   if (options.normalize) {
//     const max = Array.from(channelData[0]).reduce((max, value) => Math.max(max, Math.abs(value)), 0)
//     vScale = max ? 1 / max : 1
//   }

//   // Render waveform as bars
//   if (options.barWidth || options.barGap || options.barAlign) {
//     this.renderBarWaveform(channelData, options, ctx, vScale)
//     return
//   }

//   // Render waveform as a polyline
//   this.renderLineWaveform(channelData, options, ctx, vScale)
// }

// private renderSingleCanvas(
//   data: Array<Float32Array | number[]>,
//   options: WaveSurferOptions,
//   width: number,
//   height: number,
//   offset: number,
//   canvasContainer: HTMLElement,
//   progressContainer: HTMLElement,
// ) {
//   const pixelRatio = window.devicePixelRatio || 1
//   const canvas = document.createElement('canvas')
//   canvas.width = Math.round(width * pixelRatio)
//   canvas.height = Math.round(height * pixelRatio)
//   canvas.style.width = `${width}px`
//   canvas.style.height = `${height}px`
//   canvas.style.left = `${Math.round(offset)}px`
//   canvasContainer.appendChild(canvas)

//   const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

//   this.renderWaveform(data, options, ctx)

//   // Draw a progress canvas
//   if (canvas.width > 0 && canvas.height > 0) {
//     const progressCanvas = canvas.cloneNode() as HTMLCanvasElement
//     const progressCtx = progressCanvas.getContext('2d') as CanvasRenderingContext2D
//     progressCtx.drawImage(canvas, 0, 0)
//     // Set the composition method to draw only where the waveform is drawn
//     progressCtx.globalCompositeOperation = 'source-in'
//     progressCtx.fillStyle = this.convertColorValues(options.progressColor)
//     // This rectangle acts as a mask thanks to the composition method
//     progressCtx.fillRect(0, 0, canvas.width, canvas.height)
//     progressContainer.appendChild(progressCanvas)
//   }
// }
