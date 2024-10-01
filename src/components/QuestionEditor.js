'use strict';
import React from 'react';
import { AuthModeStrategyType, DataStore } from 'aws-amplify/datastore';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import { FileDownload, Refresh, Search, UploadFile } from '@mui/icons-material';
import FilesContext from '../context/fileContext';
import QuestionContext from '../context/dictionaryContext';
import DeleteIcon from '@mui/icons-material/Delete';
import NewFileIcon from '@mui/icons-material/NoteAdd';

import SearchIcon from '@mui/icons-material/Search';
import { Collapse } from '@mui/material';
import { DisplayOrEditAnswer } from './DisplayOrEditAnswer';
import { DisplayOrEditPrompt } from './DisplayOrEditPrompt';
import { DisplayOrEditHint } from './DisplayOrEditHint';

import { createHash } from 'crypto';
import { Question } from '../models';

import CircularProgress from '@mui/material/CircularProgress';

import { uploadData, remove as _remove } from 'aws-amplify/storage';
import getCachedUrl from '../utils/getCachedUrl';
import UnitContext from '../context/unitContext';

import { generateAudioFile } from '../graphql/mutations';

import { generateClient } from 'aws-amplify/api';
import { hexToRgb } from '../utils/hexToRgb';
import DictionaryContext from '../context/dictionaryContext';

const client = generateClient();



function getTextWidth(text) {
  const element = document.createElement('span');
  element.style.position = 'absolute';
  element.style.visibility = 'hidden';
  element.style.whiteSpace = 'nowrap';
  element.textContent = text;
  document.body.appendChild(element);
  const style = getComputedStyle(element);
  const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}/${style.lineHeight} ${style.fontFamily}`;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = font;
  const metrics = context.measureText(text);
  document.body.removeChild(element);
  return metrics.width;
}

const deduplicateUrls = (urls) => {
  const set = new Set(urls);
  const newArr = Array.from(set);

  return newArr;
}

function QuestionListItem({ entry, i, audioFiles, setPresignedUrl, identityId }) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [fileOperations, setFileOperations] = React.useState([]);
  const [audioFilesToUpload, setAudioFilesToUpload] = React.useState([]);

  const { unit } = React.useContext(UnitContext);


  const questionAudio = entry[1]?.audio || [];

  console.log('questionAudio', questionAudio);

  React.useEffect(() => {

    const asyncFunc = async () => {
      // when audio files change, upload them to S3
      // and update the entry in the database
      console.log('audioFilesToUpload', audioFilesToUpload);

      if (audioFilesToUpload.length === 0) {
        return;
      }

      const audioFileKeys = await Promise.allSettled(audioFilesToUpload.map(async (fileInput) => {
        const newFilename = `audio/${fileInput.file.name}`
        console.log('uploading newFilename', newFilename);
        console.log('uploading file', fileInput);
        console.log('fileOperations', fileOperations);

        const { file } = fileInput;

        // Upload a file with access level `guest` as  the equivalent of `public` in v5
        const result = await uploadData({
          key: newFilename,
          data: file,
          options:  {
            contentType: file.type,
            contentLength: file.size,
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
          return result.key;
      }));

      let _urls = []

      audioFileKeys.forEach((promise) => {
        if (promise.status === 'fulfilled') {
          _urls.push(promise.value);
        }
      });


      console.log('audioFileKeys', audioFileKeys);

      const _eistingAudioUrls = entry[1].audio || [];

      const newAudioUrls = [..._eistingAudioUrls, ..._urls]

      console.log('newAudioUrls', newAudioUrls);

      if (_urls.length === 0) {
        return;
      }
      await DataStore.save(Question.copyOf(entry[1], (updated) => {
        updated.audio = newAudioUrls;
      }
      ));

      // await refreshAudioFiles();

      // timeout to allow for the UI to update, find a better way to do this
      setTimeout(() => {
        setAudioFilesToUpload([]);
        setFileOperations([]);
      }, 1000);
    };

    asyncFunc();

  }, [audioFilesToUpload]);

  // const audioUrls = entry?.audioUrls || [];

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = async (event) => {
    console.log('dropped');
    event.preventDefault();
    event.stopPropagation();

    console.log(event.dataTransfer.files);

    const files = Array.from(event.dataTransfer.files);

    console.log('files>>>>', files);

    const _toupload = files.map((f, index) => {
      return {
        file: f,
        index,
      }
    });

    const _fileOperations = files.map((f) => ({ name: f.name, progress: '0%' }));


    console.log('_toupload', _toupload);
    console.log('_fileOperations', _fileOperations);

    setAudioFilesToUpload(_toupload);
    setFileOperations(_fileOperations);

    setIsDragging(false);
  };

  if (!entry[1]) return null;
  console.log('            Object.entries(dictionary).map', entry);
  console.log('i', i);
  const answer = entry[1].answer;
  const prompt = entry[1].prompt;
  const hint = entry[1].hint;
  // const hasAudio = entry[1].audio?.length > 0;
  const audioUrls = entry[1].audio || [];
  // const audioFiles = entry[1].audioFiles

  console.log('audioUrls', audioUrls);

  let lookupMp3 = ''
  if (audioUrls.length > 0) {
    lookupMp3 = audioUrls[0];
    console.log('lookupMp3', lookupMp3);
    // TODO: handle multiple audio files, or just say you can have one and this is the history?

  }
  const mp3File = audioFiles[lookupMp3]?.key;

  // console.log('mp3File', mp3File)
  console.log('mp3File', mp3File);

  console.log('entry', entry);
  console.log('i', i);

  console.log('audioFiles', audioFiles);
  console.log('hint', hint);
  const displayOrEditPrompt = <DisplayOrEditPrompt
    prompt={prompt}
    question={entry[1]}
    hint={hint} />;
  const displayOrEditHint = <DisplayOrEditHint
    prompt={prompt}
    question={entry[1]}
    hint={hint} />;
  const displayOrEditAnswer = <DisplayOrEditAnswer
    question={entry[1]}
    answer={answer} />;


  const hasAudio = audioUrls.length > 0;
  const hasFileOperations = fileOperations.length > 0;

  console.log('hasAudio', hasAudio);
  console.log('hasFileOperations', hasFileOperations);

  const liClassName = (hasAudio || hasFileOperations) ? 'noborder' : '';
  const operationsClassName = hasAudio ? 'noborder' : '';
  console.log('liClassName', liClassName);
  console.log('operationsClassName', operationsClassName, entry[1].prompt);

  const confirmDeleteQuestion = async (question) => {
    console.log('question', question);
    // possibly nicer modal with a cancel button?
    const confirmed = window.confirm(`Are you sure you want to delete ${question.prompt}?`);

    if (!confirmed) return;
      // for each audio file, delete it. 
      // what if the user has multiple audio files?
      // what if another user has audio files for this question?
      // then delete the question
      try {
        await DataStore.delete(question);
      } catch (error) {
        console.error(error);
      }
  };


  // List prompt, answer, and hint
  return <>
    <ListItem
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={(e) => {
        console.log('onDragLeaveListItem');
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
      }}
      ContainerProps={{
        className: liClassName,
      }}
      key={i}>

      {isDragging && (

        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={(e) => {
            console.log('onDragLeavediv');
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
          }}


          style={{
            color: '#000',
            fontSize: '2rem',
            fontWeight: 'bold',
            textAlign: 'center',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            // height: '100%',
            zIndex: 100,
            backgroundColor: 'rgb(255, 255, 255, 0.5)',
            backdropFilter: 'blur(3px)',
            textAlign: 'center',
            verticalAlign: 'middle',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            wrap: 'wrap',

          }}
        >

          {
            `Upload Ogg Audio for ${prompt} (${hint})`
          }

        </div>
      )}
      <ListItemText
        style={{
          margin: '0 1rem',
        }}

        primary={displayOrEditPrompt} secondary={displayOrEditAnswer} />
      <ListItemSecondaryAction>
        <IconButton
          color='error'
          // On click, open modal to confirm delete

          onClick={(e) => {
            // open modal
            e.preventDefault();
            e.stopPropagation();

            confirmDeleteQuestion(entry[1])
          }}
          edge="end" aria-label="delete">
          <DeleteIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
    

    {fileOperations.length > 0 &&
      fileOperations.map((op, i) => {
        return <li
          style={{
            margin: '0 1rem',
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          key={i}
          className={operationsClassName}
        >
          <ListItemText
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            primary={op?.name} secondary={op?.progress} />
        </li>
      })
    }

    {audioUrls.length > 0 &&
      <ListItem
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '1rem',
        }}
      >
        {
          audioUrls.map((u, i) => {
            console.log('audioUrls.u', u);
            return <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <ListItemText
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                key={i} primary={`audio-file-${i+1}.mp3`} />
                {/**
                 * TODO: add a way to save the original file name 
                 */}

              <div
                // onClick={}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                <IconButton
                  onClick={async (e) => {
                    e.preventDefault()
                    e.stopPropagation()

                    console.log('IconButton.u', u);

                    const _url = await getCachedUrl(u, 'protected', unit?.identityId)

                    setPresignedUrl(_url);
                  }}
                  edge="end" aria-label="play">
                  <PlayCircleIcon
                    color='primary' />
                </IconButton>

                <IconButton
                  onClick={async (e) => {
                    e.preventDefault()
                    e.stopPropagation()

                    const confirmed = window.confirm('Are you sure you want to delete this audio file?');

                    if (!confirmed) return;

                    // delete from s3
                    const remove = await _remove(u, {
                      // level: 'protected',
                    });

                    console.log('remove', remove);

                    // remove from audioUrls
                    const _audioUrls = audioUrls.filter(_u => _u !== u);
                    
                    try {
                      await DataStore.save(
                        Question.copyOf(entry[1], (question) => {
                          question.audio = _audioUrls;
                        })
                      )
                    } catch (error) {
                      console.log('error', error);
                    }

                  }} >
                  <DeleteIcon />
                  </IconButton>

              </div>
            </div>
          })
        }

      </ListItem>
    }


  </>;

}


export function QuestionEditor() {

  const [open, setOpen] = React.useState(false);
  const [isHelpOpen, setHelpOpen] = React.useState(false);

  const theme = useTheme();
  const mainColor = theme.palette.primary.main;

  console.log('QuestionEditor.mainColor', mainColor);

  const rgbColor = hexToRgb(mainColor); // Replace 'primary.main' with the color you want to convert
  console.log('rgbColor, rgbColor'); // Output: "rgb(33, 150, 243)"
  const _r = rgbColor.r;
  const _g = rgbColor.g;
  const _b = rgbColor.b;

  const [search, setSearch] = React.useState('');

  const [newPrompt, setNewPrompt] = React.useState('');
  const [newAnswer, setNewAnswer] = React.useState('');
  const [newHint, setNewHint] = React.useState('');
  const [editFile, setEditFile] = React.useState(null);
  const [isWorking, setIsWorking] = React.useState(false);

  const [audioSrc, setAudioSrc] = React.useState(null);
  const [newQuestionFormOpen, setNewQuestionFormOpen] = React.useState(false);

  const [fileOperations, setFileOperations] = React.useState([]);

  const {
    setFilter,
    searching,
    setSearching,
    questionBank
  } = React.useContext(DictionaryContext);

  const { audioFiles, refreshAudioFiles, session } = React.useContext(FilesContext);
  const {
    identityId,
    idToken
  } = session

  console.log('FilesContext. session', session);

  console.log('FilesContext. identityId', identityId);
  console.log('FilesContext. idToken', idToken);
  console.log('FilesContext. idToken', idToken.toString());

  const doNothing = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const audioRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  // const timelineRef = React.useRef(null);
  const audioContextRef = React.useRef(null);
  const sourceRef = React.useRef(null);
  const analyserRef = React.useRef(null);
  const fileInput = React.createRef(null);


  React.useEffect(() => {

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

    audio.addEventListener('canplaythrough', () => {
      console.log('canplaythrough');
      audio.play();
    });
  }, [audioSrc]);

  const handlePlay = () => {
    const audioContext = audioContextRef.current;
    const source = sourceRef.current;

    source.connect(audioContext.destination);
    audioContext.resume();
  };

  const handlePause = () => {
    const audioContext = audioContextRef.current;
    const source = sourceRef.current;

    source.disconnect(audioContext.destination);
    audioContext.suspend();
  };

  const handleCreateQuestion = async (event) => {
    setIsWorking(true)
    event.preventDefault()
    // event.stopPropagation()

    console.log('event', event)

    const prompt = newPrompt
    const hint = newHint
    const answer = newAnswer   

    // create an audio file for the prompt and answer.
    // use the generateAudioFile mutation

    // generateAudioFile(prompt: String!, voice: String!, model: String!): String @function(name: "openai-${env}")

    console.log('identityId', identityId);


    const voice = 'shimmer';
    const model = 'tts-1-hd';

    try {
      const fileGenerator = client.graphql({
        query: generateAudioFile,
        variables: {
          phrase: prompt,
          voice,
          model,
        }},
        {
          'x-api-identity': idToken.toString(),
        });

      const fileGeneratorAnswer = client.graphql({
        query: generateAudioFile,
        variables: {
          phrase: answer,
          voice,
          model,
        }},
        {
          'x-api-identity': idToken.toString(),
        });

        const hash = createHash('sha256')
        hash.update(model + voice + prompt);
        const promptHex = hash.digest('hex');

        const hashAnswer = createHash('sha256')
        hashAnswer.update(model + voice + answer);
        const answerHex = hashAnswer.digest('hex');

        const dataSave = DataStore.save(
          new Question({
            prompt,
            hint,
            answer,
            identityId,
            audio: [
              `audio/${promptHex}.mp3`
            ],
            answerAudio: [
              `audio/${answerHex}.mp3`
            ]
          })
        );



      const [question, file, answerFile] = await Promise.allSettled([ dataSave, fileGenerator, fileGeneratorAnswer]);

      console.log('file', file);
      console.log('answerFile', answerFile);
      console.log('promptHex', promptHex);
      console.log('answerHex', answerHex);
      console.log('question', question);
      console.log('file', file);
      console.log('dataSave', dataSave);

      // If any errors are returned delete the question and files from S3?

      // if (file.errors) {
      //   console.error(file.errors);
      //   throw new Error(file.errors[0].message);
      // }

      // if (data.errors) {
      //   console.error(data.errors);
      //   throw new Error(data.errors[0].message);
      // }

      setIsWorking(false)
    } catch (errors) {
      console.error(errors)
      //   throw new Error(errors[0].message)
    }

    setOpen(false);
    setNewPrompt('');
    setNewAnswer('');
    setNewHint('');

  }

  const debounce = (func, wait) => {
    let timeout;

    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const debouncedSearch = React.useCallback(
    debounce((search) => {
      setFilter(search);
    }, 500),
    []
  );

  const handleSearch = (e) => {
    setSearch(e.target.value.trim());
    debouncedSearch(e.target.value.trim());
    setSearching(true);
  };


  function handleSubmit(event) {
    event.preventDefault();
    // Do something with the form data
  }

  const [_presignedUrl, _setPresignedUrl] = React.useState(null);

  React.useEffect(() => {
    const fetchAudio = async () => {
      try {
        const response = await fetch(_presignedUrl);
        console.log('response!!!', response)
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        console.log('url!!!', url)
        setAudioSrc(url);
      } catch (error) {
        console.error(error);
      }
    };

    fetchAudio();
  }, [_presignedUrl]);

  const toggleNewQuestionFormOpen = () => {
    setNewQuestionFormOpen(!newQuestionFormOpen);
  };

  const handleFileClick = () => {
    console.log('clicked');
    fileInput.current.click();
  };

  const onFileInputChange = async (e) => {
    const files = e.target.files;
    console.log('files', files);

    // set in state for preview, then upload after question is created
    // setFiles(files);

    // for each file create an uploaded file tracking map in state

    const _fileOperations = []

    Object.values(files).forEach((file) => {
      _fileOperations.push({
        name: file.name,
        progress: 0,
      })

    })

    console.log('_fileOperations', _fileOperations);

    setFileOperations(_fileOperations)
  };




  return (
    <div 
      style={{
        height: 'calc(100vh - 10rem)',
      }}
    >
        <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >

          {_presignedUrl &&

            <>
              {/* <canvas
                ref={timelineRef}
              /> */}
              <canvas
                style={{
                  // width: '100%',
                  // height: '10vw',
                  margin: 'auto'
                }}
                ref={canvasRef} />
              <audio
                onClick={doNothing}
                style={{
                  backgroundColor: '#ffffff !important',
                  // width: '100%',
                  // margin: '1rem auto'
                }}
                ref={audioRef} src={audioSrc} controls />

            </>}
        </Box>

        <Box
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
          }}
        >
          <TextField
            value={search}
            onInput={handleSearch}
            onClick={doNothing}
            type='text'
            style={{
              width: '100%',
              margin: '0.2rem'
            }}
            // id="outlined-basic"
            label="Search"
            // variant="standard"
            />

          {searching &&

            <Button aria-label="cancel searching dictionary" onClick={doNothing} disabled>
              <CircularProgress />
            </Button>

          }
          {!searching &&
            <Button aria-label="search dictionary" onClick={doNothing} disabled>
              <SearchIcon />
            </Button>
          }
          {/* <Button variant='contained'>Filter</Button> */}

        </Box>
        <Box
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >

        </Box>
        <Box
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Button disabled><UploadFile />&nbsp;Import</Button>
          <Button disabled><FileDownload />&nbsp;Export</Button>
          <Button
           onClick={toggleNewQuestionFormOpen}
          ><NewFileIcon/>&nbsp;New</Button>
          {/* <Button><FiberManualRecordIcon />&nbsp;Batch</Button>
            <Button><FileUpload />&nbsp;Batch</Button> */}


        </Box>
        <Collapse in={newQuestionFormOpen}>
          <Box

            // onClick={(e) => {
            //   e.preventDefault();
            //   // e.stopPropagation();
            // }}
            style={{
              borderBottom: '1px solid #c7c7c7',
              margin: '1rem 0'
            }}
          >
            <form onSubmit={handleCreateQuestion}>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >



                <TextField
                  value={newPrompt}
                  required
                  onClick={doNothing}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  style={{
                    width: '100%',
                    margin: '0.2rem'
                  }}
                  label="Prompt"
                  variant="outlined" />
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                >
                <TextField
                  value={newHint}
                  required
                  onClick={doNothing}
                  onChange={(e) => setNewHint(e.target.value)}
                  style={{
                    width: '100%',
                    margin: '0.2rem'
                  }}
                  label="Hint"
                  variant="outlined" />

                  </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >

                <TextField
                  value={newAnswer}
                  required
                  onClick={doNothing}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  style={{
                    width: '100%',
                    margin: '0.2rem'
                  }}
                  label="Answer"
                  variant="outlined" />


              </div>

              {/**
               * file upload
               */}

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >

                <input
                  type="file"
                  disabled
                  // disabled={fileOperations.length > 0}
                  accept="audio/mp3"
                  // required={fileOperations.length === 0}
                  onChange={onFileInputChange}
                  ref={fileInput} style={{ display: 'none' }} />
                <Button
                  disabled
                  onClick={handleFileClick}
                  variant='contained'
                  style={{
                    margin: '1rem 0'
                  }}

                >
                  Upload Audio
                </Button>

                <Button
                  
                  variant='contained'
                  type='submit'
                  // onClick={handleCreateQuestion}
                  style={{
                    margin: '1rem 0'
                  }}

                >
                  Create Question
                </Button>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'columns',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >

                {fileOperations.length > 0 &&
                  <List
                    style={{
                      width: '100%',
                      // overflow: 'auto',
                    }}
                  >
                    {fileOperations.map((op, i) => {
                      return <ListItem key={i}>
                        <ListItemText primary={op?.name} secondary={op?.progress} />
                      </ListItem>
                    })
                    }
                  </List>

                }
              </div>

            </form>
          </Box>
        </Collapse>

        <List
          className='dictionary-list'
          style={{
            // width: '100%',
            // margin: '1rem',
            // maxHeight: '70%',
            // display: 'flex',
            // minHeight: '71vh',
            // minHeight: "70%",
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >

          <style global jsx>{`
          .dictionary-list li {
            border-bottom: 1px solid #c7c7c7;
          }

          .dictionary-list li:last-child {
            border-bottom: none;
          }

          .dictionary-list li.noborder {
            border-bottom: none;
          }
          `}</style>

          {questionBank && Object.keys(questionBank).length > 0 &&
            Object.entries(questionBank).map((entry, i) => <QuestionListItem
              audioFiles={audioFiles}
              entry={entry} i={i}
              setPresignedUrl={_setPresignedUrl}
              refreshAudioFiles={refreshAudioFiles}
              identityId={identityId}
            />)}

        </List>
    </div>
  );
}
