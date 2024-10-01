'use strict';
import React from 'react';
import FilesContext from '../context/fileContext';
import DictionaryContext from '../context/dictionaryContext';
import StopIcon from '@mui/icons-material/Stop';
import PlayIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RecordIcon from '@mui/icons-material/KeyboardVoice';
// import { SvgConverter } from './Editor2';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { hexToRgb } from "../utils/hexToRgb";

import { uploadData } from 'aws-amplify/storage';
import { verifyAudioUrl } from '../graphql/queries';
import getCachedUrl from '../utils/getCachedUrl';
import UnitContext from '../context/unitContext';

import { fetchAuthSession } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';

const client = generateClient();

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

  const [recording, setRecording] = React.useState(false);
  const [mediaRecorder, setMediaRecorder] = React.useState(null);
  const [audioBlob, setAudioBlob] = React.useState(null);
  // const [objectUrl, setObjectUrl] = React.useState(null);
  const audioRef = React.useRef(null);
  const [isPlaying, setIsPlaying] = React.useState(false);


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



  const lookupWord = phrase + pronunciation;
  const audioFile = audioFiles[lookupWord] ? audioFiles[phrase] : null;

  console.log('audioFile', audioFile);

  React.useEffect(() => {
    async function uploadSignAndVerifyAudio() {
      if (audioBlob) {
        console.log('audioBlob', audioBlob);

        console.log('grade', grade);

        let gradeID = null;

        if(!grade) {
          const _updatedGrade = await createGrade()
          console.log('updatedGrade', _updatedGrade);
          gradeID = _updatedGrade.id;
        } else {
          gradeID = grade.id;
        }

        const newFilename = `user-input-audio/${gradeID}-${Date.now()}.mp3`;

        // get identityId and idToken

        const result = await uploadData({
          key: newFilename,
          data: audioBlob,
          options:  {
            contentType: 'audio/mp3',
            // contentLength: file.size,
            identityId,
            accessLevel: 'protected',
            progressCallback(progress) {
              console.log(`Uploaded: ${progress.loaded}/${progress.total}`);
  
              setFileOperations((prev) => {
                const newFileOperations = [...prev];
                newFileOperations[fileInput.index].progress = Math.round(progress.loaded / progress.total * 100) + '%';
                return newFileOperations;
              })
            }
          }
          }).result;
          console.log('result!!___', result);
        
          // sign the audio file url

          const url = await getCachedUrl(newFilename, 'protected', identityId);
        // add url to grade files[] attribute?

        // verify the audio file

        const response = await client.graphql({
          query: verifyAudioUrl,
          variables: {
            expected: requestDefinition? definition : phrase,
            audioUrl: url,
            model: 'whisper-1',
            chatModel: 'gpt-3.5-turbo',
          },
        });

        console.log('response', response);

        // "{"transcription":{"text":"at this time."},"completion":{"id":"chatcmpl-9TM7qi7QZ8FnyeDLEml6v8NLJrnXt","object":"chat.completion","created":1716783590,"model":"gpt-3.5-turbo-0125","choices":[{"index":0,"message":{"role":"assistant","content":"{\"answer\": false, \"reason\": \"because the correct transcription is: \\\"at the present time or moment.\\\"\"}"},"logprobs":null,"finish_reason":"stop"}],"usage":{"prompt_tokens":91,"completion_tokens":24,"total_tokens":115},"system_fingerprint":null}}"

        const mainData = JSON.parse(response?.data?.verifyAudioUrl) || {}

        const data = JSON.parse(mainData?.completion?.choices[0]?.message?.content) || {}

          setFeedback({
              ...feedback,
              [qk]: data,
          });

      }

      return null;
    }

    uploadSignAndVerifyAudio();
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
        const max = Math.max(...dataArray);

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
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        setMediaRecorder(mediaRecorder);
        mediaRecorder.start();
        setRecording(true);
        const audioChunks = [];


        const audioContext = new AudioContext()
        const source = audioContext.createMediaStreamSource(stream)
        const analyser = audioContext.createAnalyser()
        source.connect(analyser)
        
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
    
        const canvas = canvasRef.current;
        // const timeline = timelineRef.current;
        const canvasCtx = canvas.getContext('2d');


        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)


        mediaRecorder.addEventListener("dataavailable", (event) => {
          audioChunks.push(event.data);
        });
        
        mediaRecorder.addEventListener("stop", () => {
          const _audioBlob = new Blob(audioChunks);
          setAudioBlob(_audioBlob);
          // make waveform of the full audio here?
        });

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
            const max = Math.max(...dataArray);

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

      });
  };

  const stopRecording = () => {
    // mediaRecorder.stop();
    // setRecording(false);
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    setIsPlaying(false);
    setRecording(false);
    // setAudioBlob(null);
    // setChunks([]);
    setMediaRecorder(null);


  };

  const doNothing = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <>
    <Box>
      {audioFile &&
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

            sx={{
              position: 'relative',
              top: '0.2rem',
              cursor: 'pointer',
            }}
            onClick={handlePlay} />}
          {isPlaying && <PauseIcon
            color="primary"
            sx={{
              position: 'relative',
              top: '0.2rem',
              cursor: 'pointer',
            }}
            onClick={handlePause} />}

        </>}
      {!recording &&
        <RecordIcon
          color="primary"
          onClick={startRecording} sx={{
            position: 'relative',
            top: '0.2rem',
            cursor: 'pointer',
          }} />}
      {recording &&
        <StopIcon onClick={stopRecording}
          color="error"
          sx={{
            position: 'relative',
            top: '0.2rem',
            cursor: 'pointer',
          }} />}
      {/**
       * Add a waveform for the audio as it is being recorded
       * 
      */}
        
      {audioBlob &&
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
            sx={{
              position: 'relative',
              top: '0.2rem',
              cursor: 'pointer',
            }}
            onClick={handlePlay} />}
          {isPlaying && <PauseIcon
            color="primary"
            sx={{
              position: 'relative',
              top: '0.2rem',
              cursor: 'pointer',
            }}
            onClick={handlePause} />}
        </>}
    </Box>
    <canvas
    ref={canvasRef}
    id="waveform"
    style={{
      // width: '80%',
      // height: '5rem',
      backgroundColor: 'white',
    }}/>
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
