import {
    AppBar,
    Box,
    Toolbar,
    Typography,
    TextField,
    Button,
    IconButton,
    Collapse,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    ListItemAvatar,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Modal,
    Card,
} from "@mui/material";
import React from "react";
import { isMimeType } from '@lexical/utils';

import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import UploadFile from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

import FilesContext from "../../../context/fileContext";

import { DataStore } from 'aws-amplify/datastore';
import { uploadData, remove } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';

import { FileProtectionLevels } from '../../../models';
import { File as FileModel } from '../../../models';
import {
    ACCEPTABLE_AUDIO_TYPES,
    ACCEPTABLE_FILE_TYPES,
    ACCEPTABLE_IMAGE_TYPES,
} from '../plugins/DragDropPastePlugin';
import { INSERT_PLAYLIST_COMMAND } from "../plugins/PlaylistPlugin";
import { INSERT_IMAGE_COMMAND } from "../plugins/ImagesPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { UnitFile } from '../../../models';
import UnitContext from '../../../context/unitContext';
import getCachedUrl from "../../../utils/getCachedUrl";
import MusicIcon from '@mui/icons-material/MusicNote';

import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import TextareaAutosize from '@mui/material/TextareaAutosize';
import { generateClient } from 'aws-amplify/api';

import { useTheme } from '@mui/material/styles';

import {
    generateAudioFile,
    generateImageFile,
} from '../../../graphql/mutations';
import { hexToRgb } from "../../../utils/hexToRgb";

const client = generateClient();

function NewImageFileForm({ open, toggleNewImageFileForm }) {

    const [newDescription, setNewDescription] = React.useState('');
    const [presignedUrl, setPresignedUrl] = React.useState('');
    const [isOpen, setIsOpen] = React.useState(false);

    const [working, setWorking] = React.useState(false);
    const [previewMessage, setPreviewMessage] = React.useState('');

    const imageRef = React.useRef(null);


    React.useEffect(() => {
        const fetchImage = async () => {
            try {
                console.log('presignedUrl!!!', presignedUrl)
                const response = await fetch(presignedUrl);
                console.log('response!!!', response)
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                console.log('url!!!', url)
                imageRef.current.src = url;

                setWorking(false);
                setNewDescription('');
                setPreviewMessage('Successfully generated image file');

            } catch (error) {
                console.error(error);
            }
        };

        if (!presignedUrl) {
            return;
        }

        fetchImage();

    }, [presignedUrl]);


    return (
        <>
            <Collapse in={open}>

                <Box
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                    }}
                >

                    <TextareaAutosize
                        minRows={3}
                        value={newDescription}
                        onChange={(e) => {
                            setNewDescription(e.target.value);

                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        placeholder='Text to transform into image file.'

                        ref={(input) => {
                            if (input != null) {
                                input.focus();
                            }
                        }}
                        // onBlur={async (event) => {
                        //     event.preventDefault();
                        //     setEditing(false);
                        // }}
                        style={{
                            width: '100%',
                            wordWrap: 'break-word',
                            minHeight: '3rem',
                        }} />
                    <Button
                        variant="outlined"
                        aria-label="Generate"
                        onClick={async () => {

                            setIsOpen(true);
                            setWorking(true);
                            setPreviewMessage('Generating image file...');

                            const {
                                identityId,
                                tokens: { idToken },
                            } = await fetchAuthSession()
                            // send graphql mutation to create new image file

                            const fileGenerator = await client.graphql({
                                query: generateImageFile,
                                variables: {
                                    phrase: newDescription,
                                    model: 'dall-e-3',
                                }
                            },
                                {
                                    'x-api-identity': idToken.toString(),
                                });

                            // set the presignedUrl from the response

                            console.log('fileGenerator', fileGenerator)

                            
                            const { path } = fileGenerator.data.generateImageFile;

                            if (path) {
                                console.log('s3Key', path, identityId)
                                const _presignedUrl = await getCachedUrl(path, 'protected', identityId)
                                console.log('_presignedUrl', _presignedUrl);
                                setPresignedUrl(_presignedUrl);

                            } else {
                                console.error('fileGenerator', fileGenerator);
                                // send error message to preview modal

                                setPreviewMessage('Error generating image file');
                                setWorking(false);
                            }






                            // open modal to preview audio
                            // close form
                            // toggleNewImageFileForm();
                        }}
                        style={{
                            width: '100%',
                            margin: '1rem',
                        }}
                    >
                        Create
                    </Button>





                </Box>
            </Collapse>
            {/**
                 * Create a modal to preview the audio file
                 */}

            <Modal
                open={isOpen}
                onClose={() => {
                    // close modal
                    setWorking(false);
                    setPreviewMessage('');
                    setIsOpen(false);
                }}
                aria-labelledby="modal-text-to-image-preview"
                aria-describedby="modal-text-to-image-preview-description"
            >
                <Card
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 400,
                        bgcolor: 'background.paper',
                        boxShadow: 24,
                        style: { 
                            minWidth: '20vw',
                            maxWidth: '80vw',
                            minHeight: '20vw',
                            maxHeight: '80vw',
                            padding: '1rem',

                         },
                    }}

                >
                    <Typography id="modal-text-to-image-preview" variant="h6" component="h2">
                        Text to Image Preview  {working && <CircularProgress />}
                    </Typography>

                    <Typography id="modal-text-to-image-preview-description" sx={{ mt: 2 }}>
                        {previewMessage}
                    </Typography>
                    <Box
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <img
                            // onClick={doNothing}
                            style={{
                                backgroundColor: '#ffffff !important',
                                width: '100%',
                                margin: '1rem auto'
                            }}
                            ref={imageRef} />
                    </Box>

                    <Button
                        onClick={() => {
                            // close modal
                            setIsOpen(false);
                        }}>
                        Close
                    </Button>


                    {/**
                     * Add a button to insert the image into the editor
                    */}

                    {/**
                     * Add a button to delete the image
                     */}

                    {/**
                     * Add a button to download the image?
                     */}

                     {/**
                      * Add a button to share the image?
                      */}

                </Card>

            </Modal>
        </>
    )

}

function NewVideoFileForm({ open, toggleNewVideoFileForm }) {
    const [newDescription, setNewDescription] = React.useState('');

    return (
        <Collapse in={open}>

            <Box
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                }}
            >

                <TextareaAutosize
                    minRows={3}
                    value={newDescription}
                    onChange={(e) => {
                        setNewDescription(e.target.value);

                    }}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    placeholder='No Description'

                    // ref={(input) => {
                    //     if (input != null) {
                    //     input.focus();
                    //     }
                    // }}
                    // onBlur={async (event) => {
                    //     event.preventDefault();
                    //     setEditing(false);
                    // }}
                    style={{
                        width: '100%',
                        wordWrap: 'break-word',
                        minHeight: '3rem',
                    }} />
                <Button
                    variant="outlined"
                    aria-label="Generate"
                    onClick={() => {
                        // send graphql mutation to create new image file
                        // close form
                        // toggleNewImageFileForm();
                    }}
                    style={{
                        width: '100%',
                        margin: '1rem',
                    }}
                >
                    Create
                </Button>

            </Box>
        </Collapse>
    )
}

function NewAudioFileForm({ open, toggleNewAudioFileForm }) {
    const [newDescription, setNewDescription] = React.useState('');
    const [audioSrc, setAudioSrc] = React.useState('');
    const [presignedUrl, setPresignedUrl] = React.useState('');
    const [isOpen, setIsOpen] = React.useState(false);

    const [working, setWorking] = React.useState(false);
    const [previewMessage, setPreviewMessage] = React.useState('');


    const audioRef = React.useRef(null);
    const canvasRef = React.useRef(null);
    const audioContextRef = React.useRef(null);
    const sourceRef = React.useRef(null);
    const analyserRef = React.useRef(null);
    const fileInput = React.createRef(null);

    const theme = useTheme();
    const mainColor = theme.palette.primary.main;

    console.log('FileManager.mainColor', mainColor);

    const rgbColor = hexToRgb(mainColor); // Replace 'primary.main' with the color you want to convert
    console.log('rgbColor, rgbColor'); // Output: "rgb(33, 150, 243)"
    const _r = rgbColor.r;
    const _g = rgbColor.g;
    const _b = rgbColor.b;


    const doNothing = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

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
            setWorking(false);
            setNewDescription('');
            setPreviewMessage('Successfully generated audio file');
        });
    }, [audioSrc]);

    React.useEffect(() => {
        const fetchAudio = async () => {
            try {
                console.log('presignedUrl!!!', presignedUrl)
                const response = await fetch(presignedUrl);
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
    }, [presignedUrl]);


    return (
        <>
            <Collapse in={open}>

                <Box
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                    }}
                >

                    <TextareaAutosize
                        minRows={3}
                        value={newDescription}
                        onChange={(e) => {
                            setNewDescription(e.target.value);

                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        placeholder='Text to transform into audio file.'

                        ref={(input) => {
                            if (input != null) {
                                input.focus();
                            }
                        }}
                        // onBlur={async (event) => {
                        //     event.preventDefault();
                        //     setEditing(false);
                        // }}
                        style={{
                            width: '100%',
                            wordWrap: 'break-word',
                            minHeight: '3rem',
                        }} />
                    <Button
                        variant="outlined"
                        aria-label="Generate"
                        onClick={async () => {

                            setIsOpen(true);
                            setWorking(true);
                            setPreviewMessage('Generating audio file...');

                            const {
                                identityId,
                                tokens: { idToken },
                            } = await fetchAuthSession()
                            // send graphql mutation to create new audio file

                            const fileGenerator = await client.graphql({
                                query: generateAudioFile,
                                variables: {
                                    phrase: newDescription,
                                    voice: 'shimmer',
                                    model: 'tts-1-hd',
                                }
                            },
                                {
                                    'x-api-identity': idToken.toString(),
                                });

                            // set the presignedUrl from the response

                            console.log('fileGenerator', fileGenerator)

                            
                            const { path } = fileGenerator.data.generateAudioFile;

                            if (path) {
                                console.log('s3Key', path, identityId)
                                const _presignedUrl = await getCachedUrl(path, 'protected', identityId)
                                console.log('_presignedUrl', _presignedUrl);
                                setPresignedUrl(_presignedUrl);

                            } else {
                                console.error('fileGenerator', fileGenerator);
                                // send error message to preview modal

                                setPreviewMessage('Error generating audio file');
                                setWorking(false);
                            }






                            // open modal to preview audio
                            // close form
                            // toggleNewImageFileForm();
                        }}
                        style={{
                            width: '100%',
                            margin: '1rem',
                        }}
                    >
                        Create
                    </Button>




                </Box>
            </Collapse>
            {/**
                 * Create a modal to preview the audio file
                 */}

            <Modal
                open={isOpen}
                onClose={() => {
                    // close modal
                    setWorking(false);
                    setPreviewMessage('');
                    setIsOpen(false);
                }}
                aria-labelledby="modal-text-to-speech-preview"
                aria-describedby="modal-text-to-speech-preview-description"
            >
                <Card
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 400,
                        bgcolor: 'background.paper',
                        boxShadow: 24,
                        p: 4,
                        style: { 
                            minWidth: '20vw',
                            maxWidth: '80vw',
                            minHeight: '20vw',
                            maxHeight: '80vw',
                            padding: '1rem',

                         },
                    }}

                >
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        Text to Speech Preview  {working && <CircularProgress />}
                    </Typography>

                    <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                        {previewMessage}
                    </Typography>
                    <Box
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
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
                    </Box>

                    <Button
                        onClick={() => {
                            // close modal
                            setIsOpen(false);
                        }}>
                        Close
                    </Button>

                </Card>

            </Modal>
        </>
    )

}

function ListItemImage({ file }) {
    const [url, setUrl] = React.useState(null);

    React.useEffect(() => {

        const asyncFunc = async () => {

            const _url = await getCachedUrl(file.path, 'protected', file.identityId)

            setUrl(_url);
        }

        asyncFunc();

    }, [file.path]);

    return (
        <>
            {file.mimeType.includes('image') &&
                <img
                    src={url}
                    style={{
                        width: '3rem',
                        height: '3rem',
                        objectFit: 'contain',
                    }}
                />
            }
            {file.mimeType.includes('audio') &&
                <MusicIcon

                    style={{
                        width: '3rem',
                        height: '3rem',
                        objectFit: 'contain',
                    }} />


            }
        </>)



}

export default function FileManager() {
    const [editor] = useLexicalComposerContext();
    const [search, setSearch] = React.useState('');
    const [searching, setSearching] = React.useState(false);

    const handleSearch = (e) => {
        setSearch(e.target.value);
    }

    const [isDragging, setIsDragging] = React.useState(false);
    const [fileOperations, setFileOperations] = React.useState([]);
    const [filesToUpload, setFilesToUpload] = React.useState([]);

    const [newImageFileFormOpen, setNewImageFileFormOpen] = React.useState(true);
    const [newAudioFileFormOpen, setNewAudioFileFormOpen] = React.useState(false);
    const [newVideoFileFormOpen, setNewVideoFileFormOpen] = React.useState(false);

    const [newFileFormOpen, setNewFileFormOpen] = React.useState(false);

    const [generator, setGenerator] = React.useState('image');

    const { files, session } = React.useContext(FilesContext);
    const { identityId } = session;
    const { unit } = React.useContext(UnitContext);

    console.log('FilesContext.files', files);

    const toggleNewAudioFileForm = () => {
        setNewAudioFileFormOpen(!newAudioFileFormOpen);
    }

    const toggleNewImageFileForm = () => {
        setNewImageFileFormOpen(!newImageFileFormOpen);
    }

    const toggleNewVideoFileForm = () => {
        setNewVideoFileFormOpen(!newVideoFileFormOpen);
    }

    const toggleNewFileForm = () => {
        setNewFileFormOpen(!newFileFormOpen);
    }




    React.useEffect(() => {

        const asyncFunc = async () => {
            // when audio files change, upload them to S3
            // and update the entry in the database

            if (filesToUpload.length === 0) {
                return;
            }

            
            const accessLevel = 'protected';

            const fileKeys = await Promise.allSettled(filesToUpload.map(async (fileInput) => {
                const { file } = fileInput;
                let newFilename;
                let thumbnailFilename;

                if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
                    newFilename = `images/${file.name}`
                    thumbnailFilename = `thumbnails/${file.name}`
                    // What if a duplicate file is uploaded. make sure to check for that by hashing the file and checking if it exists in the database
                } else if (isMimeType(file, ACCEPTABLE_AUDIO_TYPES)) {
                    newFilename = `audio/${file.name}`
                    // Way to determine length of audio file?
                } else if (isMimeType(file, ACCEPTABLE_FILE_TYPES)) {
                    newFilename = `files/${file.name}`
                }

                console.log('uploading newFilename', newFilename);
                console.log('uploading file', fileInput);
                console.log('fileOperations', fileOperations);

                const result = await uploadData({
                    key: newFilename,
                    data: file,
                    options: {
                        contentType: file.type,
                        contentLength: file.size,
                        accessLevel,
                        identityId,
                        progressCallback(progress) {
                            console.log(`Uploaded: ${progress.loaded}/${progress.total}`);

                            setFileOperations((prev) => {
                                const newFileOperations = [...prev];
                                newFileOperations[fileInput.index].progress = Math.round(progress.loaded / progress.total * 100) + '%';
                                return newFileOperations;
                            })
                        }
                    }
                });
                console.log('result!!___', result);

                // Create a new entry in the database using the File model

                try {
                    const newFile = await DataStore.save(new FileModel({
                        path: newFilename,
                        identityId,
                        name: file.name,
                        size: file.size,
                        mimeType: file.type,
                        level: 'PROTECTED',
                    }));

                    console.log('newFile', newFile);
                } catch (error) {
                    console.error(error);
                }

            }));

            // timeout to allow for the UI to update
            setTimeout(() => {
                setFilesToUpload([]);
                setFileOperations([]);
            }, 1000);
        };

        asyncFunc();

    }, [filesToUpload]);

    // const audioUrls = entry?.audioUrls || [];

    const handleDragOver = (event) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDrop = async (event) => {
        console.log('dropped');
        event.preventDefault();
        //   event.stopPropagation();

        console.log(event.dataTransfer.files);

        const _files = Array.from(event.dataTransfer.files);

        console.log('files>>>>', _files);

        const _toupload = _files.map((f, index) => {
            return {
                file: f,
                index,
            }
        });

        const _fileOperations = _files.map((f) => ({ name: f.name, progress: '0%' }));


        console.log('_toupload', _toupload);
        console.log('_fileOperations', _fileOperations);

        setFilesToUpload(_toupload);
        setFileOperations(_fileOperations);

        setIsDragging(false);
    };

    const handleChange = (event) => {
        console.log('handleChange', event.target.value);

    }

    return (
        <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={(e) => {
                console.log('drag leave');
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
            }}
            style={{
                position: 'relative',
                width: '100%',
                overflowY: 'auto',
                overflowX: 'hidden',
            }}
        >

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
                        height: '100%',
                        zIndex: 100,
                        backgroundColor: 'rgb(255, 255, 255, 0.5)',
                        backdropFilter: 'blur(3px)',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                > {'Upload file(s)'}
                </div>
            )}
            <Toolbar
                position="fixed"
                color="default"
                sx={{
                    flexGrow: 1,
                    flexDirection: 'column',
                    // justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    margin: '0rem',
                    padding: '0.5rem',
                }}
            >
                {/* <Box
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        margin: '0rem',
                        padding: '0rem',
                        width: '100%',
                    }}
                >
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        File Manager
                    </Typography>
                </Box> */}

                <Box
                    style={{
                        display: 'flex',
                        flexGrow: 1,
                        alignItems: 'flex-start',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        width: '100%',
                    }}
                >
                    <Button
                        color="inherit"
                        aria-label="Upload new File"
                        onClick={() => {
                            // toggleNewWordFormOpen();
                        }}
                    >
                        <UploadFile />
                    </Button>

                    <Button
                        aria-label="Generate new File"
                        onClick={() => {
                            toggleNewFileForm();
                        }}
                    >
                        <AutoAwesomeIcon />
                        Generate File
                    </Button>

                </Box>
                {/**
                 * dropdown to generate new file, options are image, audio and video 
                */}

                <Collapse
                    in={newFileFormOpen}
                    style={{
                        width: '100%',
                    }}
                >

                    <FormControl fullWidth
                        style={{
                            marginBottom: '1rem',
                        }}
                    >
                        {/* <InputLabel id="select-generator-label">Age</InputLabel> */}
                        <Select
                            labelId="select-generator-label"
                            id="select-generator"
                            value={generator}
                            onChange={(e) => {
                                setGenerator(e.target.value);
                            }}
                        >
                            <MenuItem
                                value={'image'}
                                onClick={() => {
                                    // close all other forms
                                    setNewAudioFileFormOpen(false);
                                    setNewVideoFileFormOpen(false);
                                    toggleNewImageFileForm();
                                }}
                            >Image</MenuItem>
                            <MenuItem
                                value={'audio'}
                                onClick={() => {
                                    // close all other forms
                                    setNewImageFileFormOpen(false);
                                    setNewVideoFileFormOpen(false);
                                    toggleNewAudioFileForm();
                                }
                                }
                            >Audio</MenuItem>
                            {/* <MenuItem
                        value={'video'}
                        onClick={() => {
                            // close all other forms
                            setNewImageFileFormOpen(false);
                            setNewAudioFileFormOpen(false);
                            toggleNewVideoFileForm();
                        }
                        }
                    >Video</MenuItem> */}

                        </Select>
                    </FormControl>



                    <NewImageFileForm
                        open={newImageFileFormOpen}
                        toggleNewImageFileForm={toggleNewImageFileForm}
                    />

                    <NewAudioFileForm
                        open={newAudioFileFormOpen}
                        toggleNewAudioFileForm={toggleNewAudioFileForm}
                    />

                    <NewVideoFileForm
                        open={newVideoFileFormOpen}
                        toggleNewVideoFileForm={toggleNewVideoFileForm}
                    />

                </Collapse>


                {/* <NewFileForm
                        open={newFileFormOpen}
                        toggleNewWordFormOpen={toggleNewFileForm}
                    /> */}

                <Box
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0em',
                        margin: '0rem',
                        width: '100%',
                    }}
                >
                    <TextField
                        value={search}
                        onInput={handleSearch}
                        type='text'
                        style={{
                            width: '100%',
                            margin: '0rem'
                        }}
                        // id="outlined-basic"
                        label="Search"
                    // variant="standard"
                    />

                    {searching &&

                        <Button aria-label="cancel searching dictionary" disabled>
                            <CircularProgress />
                        </Button>

                    }
                    {!searching &&
                        <Button aria-label="search dictionary" disabled>
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
                        alignItems: 'center',
                    }}
                >
                    {/* <Button disabled><UploadFile />&nbsp;Import</Button>
                <Button disabled><FileDownload />&nbsp;Export</Button>
                <Button
                    onClick={toggleNewWordFormOpen}
                ><NewFileIcon />&nbsp;New</Button> */}

                </Box>

            </Toolbar>



            {fileOperations.map((fileOperation) => (
                <Box

                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0rem',
                        margin: '0rem',
                        width: '100%',
                    }}
                >
                    <Typography
                        style={{
                            margin: '0rem',
                            padding: '0rem',
                        }}
                    >{fileOperation.name}</Typography>
                    <Typography
                        style={{
                            margin: '0rem',
                            padding: '0rem',
                        }}
                    >{fileOperation.progress}</Typography>
                </Box>
            ))}


            <List
                style={{
                    width: '100%',
                    height: 'calc(100vh - 17rem)',
                    overflowY: 'auto',
                    overflowX: 'hidden',

                }}
            >
                {files.map((file) => (
                    <ListItem
                        key={file.id}
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1rem',
                            margin: '0rem',
                            width: '100%',

                        }}
                    >
                        <ListItemAvatar
                            style={{
                                marginRight: '1rem',
                            }}

                        >
                            <ListItemImage
                                file={file}
                            />

                        </ListItemAvatar>

                        <ListItemText
                            sx={{
                                textWrap: 'wrap',
                                paddingRight: '5rem'
                            }}
                            primary={file.name}
                            secondary={(file.size / 1000).toFixed(2) + ' KB'}
                        />
                        <ListItemSecondaryAction>
                            {editor &&
                                <IconButton
                                    onClick={async () => {
                                        // Insert the file into the editor
                                        // if is image insert image
                                        if (file.mimeType.includes('image')) {
                                            editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                                                altText: file.name,
                                                path: file.path,
                                                identityId: file.identityId,
                                            });
                                        }

                                        // if is audio insert audio
                                        if (file.mimeType.includes('audio')) {
                                            await DataStore.save(
                                                new UnitFile({
                                                    unit,
                                                    file,
                                                })
                                            );
                                            editor.dispatchCommand(INSERT_PLAYLIST_COMMAND, [file.id]);
                                        }
                                    }}
                                ><AddIcon /></IconButton>
                            }
                            <IconButton
                                onClick={async () => {
                                    // confirm delete
                                    const confirmed = window.confirm(`Are you sure you want to delete ${file.path}?`);

                                    if (!confirmed) return;
                                    // delete from S3
                                    await DataStore.delete(file);
                                    await remove(file);

                                }}
                            ><DeleteIcon /></IconButton>

                        </ListItemSecondaryAction>

                    </ListItem>
                ))}
            </List>
        </div>

    )
}




