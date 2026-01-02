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
    Tabs,
    Tab,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Autocomplete,
} from "@mui/material";
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { useSimpleTreeViewApiRef } from '@mui/x-tree-view/hooks';
import React from "react";
import { isMimeType } from '@lexical/utils';

import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import UploadFile from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

import FilesContext from "../../../context/fileContext";
import SettingsContext from "../../../context/settingsContext";

import { DataStore } from 'aws-amplify/datastore';
import { uploadData, remove } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { calculateWaveformData } from '../../../utils/calculateWaveformData';
import { uploadFile, uploadAndAnalyzePDF, analyzePDF } from '../../../utils/fileUploadUtils';

import { FileProtectionLevels } from '../../../models';
import { File as FileModel, Document, Settings } from '../../../models';
import {
    ACCEPTABLE_AUDIO_TYPES,
    ACCEPTABLE_FILE_TYPES,
    ACCEPTABLE_IMAGE_TYPES,
} from '../plugins/DragDropPastePlugin';
import { INSERT_PLAYLIST_COMMAND } from "../plugins/PlaylistPlugin";
import { INSERT_IMAGE_COMMAND } from "../plugins/ImagesPlugin";
import { INSERT_PDF_COMMAND } from "../plugins/PdfViewerPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { UnitFile } from '../../../models';
import UnitContext from '../../../context/unitContext';
import getCachedUrl from "../../../utils/getCachedUrl";
import AudioWaveformPlayer from './AudioWaveformPlayer';

import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorIcon from '@mui/icons-material/Error';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CancelIcon from '@mui/icons-material/Cancel';
import Chip from '@mui/material/Chip';
import ImageIcon from '@mui/icons-material/Image';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import ArticleIcon from '@mui/icons-material/Article';
import TableChartIcon from '@mui/icons-material/TableChart';

import TextareaAutosize from '@mui/material/TextareaAutosize';

import { useTheme } from '@mui/material/styles';

import {
    generateAudioFile,
    generateImageFile,
} from '../../../graphql/mutations';
import { hexToRgb } from "../../../utils/hexToRgb";
import { ImageGeneratorButton, AudioGeneratorButton } from './EnhancedGenerators';
import { SuggestedVocabulary, SuggestedQuestions } from './SuggestedContent';

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

                            
                            const path = fileGenerator?.data?.generateImageFile?.path;

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

                            
                            const path = fileGenerator?.data?.generateAudioFile?.path;

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
                        {audioSrc && (
                            <AudioWaveformPlayer
                                audioUrl={audioSrc}
                                waveformData={previewFile?.waveformData ? JSON.parse(previewFile.waveformData) : undefined}
                                width={600}
                                height={120}
                                title={previewFile?.name || 'Audio Preview'}
                                showDuration={true}
                            />
                        )}
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
    }, [file.path, file.identityId]);

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
            {file.mimeType.includes('audio') && (
                url ? (
                    <Box sx={{ width: '100%' }}>
                        <AudioWaveformPlayer
                            audioUrl={url}
                            displayTitle={true}
                            title={file.name}
                            waveformData={file.waveformData ? JSON.parse(file.waveformData) : undefined}
                            width={200}
                            height={60}
                            showDuration={true}
                        />
                    </Box>
                ) : (
                    <Box sx={{ width: '100%', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CircularProgress size={24} />
                    </Box>
                )
            )}
        </>)



}

export default function FileManager() {
    const [editor] = useLexicalComposerContext();
    const [search, setSearch] = React.useState('');
    const [searching, setSearching] = React.useState(false);
    const apiRef = useSimpleTreeViewApiRef();

    const handleSearch = (e) => {
        setSearch(e.target.value);
    }

    const handleSearchSubmit = () => {
        if (!search.trim()) return;
        
        const searchLower = search.toLowerCase();
        
        // Filter files based on active tab
        let filteredFiles = files;
        if (generator === 'image') {
            filteredFiles = files.filter(f => f.mimeType.includes('image'));
        } else if (generator === 'audio') {
            filteredFiles = files.filter(f => f.mimeType.includes('audio'));
        } else if (generator === 'document') {
            filteredFiles = files.filter(f => 
                f.mimeType === 'application/pdf' || 
                f.mimeType === 'text/plain' ||
                f.mimeType === 'text/markdown' ||
                f.mimeType === 'text/csv' ||
                f.mimeType === 'application/msword' ||
                f.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            );
        }
        
        const matchingFile = filteredFiles.find(file => 
            file.name.toLowerCase().includes(searchLower)
        );
        
        if (matchingFile) {
            // Expand the appropriate category
            if (matchingFile.mimeType.includes('image')) {
                apiRef.current?.setItemExpansion('images', true);
            } else if (matchingFile.mimeType.includes('audio')) {
                apiRef.current?.setItemExpansion('audio', true);
            } else if (
                matchingFile.mimeType === 'application/pdf' || 
                matchingFile.mimeType === 'text/plain' ||
                matchingFile.mimeType === 'text/markdown' ||
                matchingFile.mimeType === 'text/csv' ||
                matchingFile.mimeType === 'application/msword' ||
                matchingFile.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ) { 
                apiRef.current?.setItemExpansion('documents', true);
            }
            
            // Focus and scroll to the item
            setTimeout(() => {
                apiRef.current?.focusItem(matchingFile.id);
                apiRef.current?.getItemDOMElement(matchingFile.id)?.scrollIntoView({ 
                    block: 'nearest',
                    behavior: 'smooth'
                });
            }, 100);
        }
    }

    const [isDragging, setIsDragging] = React.useState(false);
    const [fileOperations, setFileOperations] = React.useState([]);
    const [filesToUpload, setFilesToUpload] = React.useState([]);

    const [newImageFileFormOpen, setNewImageFileFormOpen] = React.useState(true);
    const [newAudioFileFormOpen, setNewAudioFileFormOpen] = React.useState(false);
    const [newVideoFileFormOpen, setNewVideoFileFormOpen] = React.useState(false);

    const [newFileFormOpen, setNewFileFormOpen] = React.useState(false);

    const [generator, setGenerator] = React.useState('all');
    const [selectedDocument, setSelectedDocument] = React.useState(null);
    const [suggestionTab, setSuggestionTab] = React.useState(0);
    
    const [settings, setSettings] = React.useState(null);
    const [documentStatuses, setDocumentStatuses] = React.useState({});

    const { files, session } = React.useContext(FilesContext);
    const { identityId } = session;
    const { unit } = React.useContext(UnitContext);

    console.log('FilesContext.files', files);

    // Subscribe to user settings with initial load
    React.useEffect(() => {
        const subscription = DataStore.observeQuery(Settings).subscribe(async ({ items }) => {
            if (items.length > 0) {
                setSettings(items[0]);
            } else {
                // Create default settings if none exist
                try {
                    const newSettings = await DataStore.save(new Settings({
                        autoAnalyzeDocuments: true,
                        documentAnalysisModel: 'gpt-4',
                    }));
                    setSettings(newSettings);
                } catch (error) {
                    console.error('Error creating settings:', error);
                }
            }
        });
        
        return () => subscription.unsubscribe();
    }, []);
    
    // Subscribe to Document status changes
    React.useEffect(() => {
        const subscription = DataStore.observeQuery(Document).subscribe(({ items }) => {
            const statusMap = {};
            items.forEach(doc => {
                statusMap[doc.s3Key] = {
                    id: doc.id,
                    status: doc.status,
                    pageCount: doc.pageCount,
                    extractedText: doc.extractedText,
                };
            });
            setDocumentStatuses(statusMap);
            console.log('[FileManager] Document statuses updated:', statusMap);
        });
        
        return () => subscription.unsubscribe();
    }, []);
    
    // Helper function to get status display info
    const getDocumentStatusInfo = (status) => {
        const statusConfig = {
            'uploaded': {
                icon: <CloudUploadIcon fontSize="small" />,
                color: 'default',
                label: 'Ready',
                chipColor: 'default',
            },
            'extracting': {
                icon: <HourglassEmptyIcon fontSize="small" />,
                color: 'info',
                label: 'Extracting...',
                chipColor: 'info',
            },
            'extracted': {
                icon: <HourglassEmptyIcon fontSize="small" />,
                color: 'primary',
                label: 'Extracted',
                chipColor: 'primary',
            },
            'analyzing': {
                icon: <HourglassEmptyIcon fontSize="small" />,
                color: 'warning',
                label: 'Analyzing...',
                chipColor: 'warning',
            },
            'completed': {
                icon: <CheckCircleIcon fontSize="small" />,
                color: 'success',
                label: 'Analyzed',
                chipColor: 'success',
            },
            'failed': {
                icon: <ErrorIcon fontSize="small" />,
                color: 'error',
                label: 'Failed',
                chipColor: 'error',
            },
        };
        return statusConfig[status] || statusConfig['uploaded'];
    };

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
        const newState = !newFileFormOpen;
        setNewFileFormOpen(newState);
        
        // When opening, also open the form for the current tab
        if (newState) {
            if (generator === 'image') {
                setNewImageFileFormOpen(true);
            } else if (generator === 'audio') {
                setNewAudioFileFormOpen(true);
            } else if (generator === 'video') {
                setNewVideoFileFormOpen(true);
            }
        } else {
            // When closing, close all forms
            setNewImageFileFormOpen(false);
            setNewAudioFileFormOpen(false);
            setNewVideoFileFormOpen(false);
        }
    }




    React.useEffect(() => {

        const asyncFunc = async () => {
            // when files change, upload them to S3
            // and update the entry in the database

            if (filesToUpload.length === 0) {
                return;
            }

            const fileKeys = await Promise.allSettled(filesToUpload.map(async (fileInput) => {
                const { file } = fileInput;

                console.log('uploading file', fileInput);
                console.log('fileOperations', fileOperations);

                try {
                    // Use shared utility for file upload
                    const result = await uploadFile(
                        file,
                        identityId,
                        unit?.id,
                        (loaded, total) => {
                            setFileOperations((prev) => {
                                const newFileOperations = [...prev];
                                newFileOperations[fileInput.index].progress = Math.round(loaded / total * 100) + '%';
                                return newFileOperations;
                            });
                        }
                    );

                    console.log('Upload result:', result);

                    // If PDF and auto-analyze is enabled, trigger analysis
                    if (file.type === 'application/pdf' && settings?.autoAnalyzeDocuments && result.documentModel) {
                        console.log('Auto-analyzing document:', result.documentModel.id);
                        try {
                            await analyzePDF(result.documentModel.id);
                        } catch (error) {
                            console.error('Auto-analysis failed:', error);
                        }
                    }
                } catch (error) {
                    console.error('Error uploading file:', error);
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
        <>
            <Toolbar
                color="default"
                sx={{
                    flexGrow: 1,
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    margin: 0,
                    padding: '0 !important',
                    position: 'sticky',
                    top: 0,
                    bgcolor: 'background.paper',
                    zIndex: 1,
                    minHeight: '0 !important',
                }}
            >
                {/* Tabs for filtering files and generating content */}
                <Tabs
                    value={generator}
                    onChange={(e, newValue) => {
                        setGenerator(newValue);
                        // Close all forms first
                        setNewImageFileFormOpen(false);
                        setNewAudioFileFormOpen(false);
                        setNewVideoFileFormOpen(false);
                        
                        // Expand the appropriate tree section
                        if (newValue === 'image' && apiRef.current) {
                            apiRef.current.setItemExpansion('images', true);
                        } else if (newValue === 'audio' && apiRef.current) {
                            apiRef.current.setItemExpansion('audio', true);
                        } else if (newValue === 'document' && apiRef.current) {
                            apiRef.current.setItemExpansion('documents', true);
                        }
                        
                        // Open the selected form if generation is active
                        if (newFileFormOpen) {
                            if (newValue === 'image') {
                                setNewImageFileFormOpen(true);
                            } else if (newValue === 'audio') {
                                setNewAudioFileFormOpen(true);
                            }
                        }
                    }}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ 
                        borderBottom: 1, 
                        borderColor: 'divider', 
                        width: '100%',
                        padding: 0,
                        minHeight: 0,
                        '& .MuiTab-root': {
                            padding: '4px 8px',
                            minWidth: 0,
                            minHeight: 0,
                            fontSize: '0.75rem',
                        },
                        '& .MuiTabs-flexContainer': {
                            gap: 0,
                        },
                    }}
                >
                    <Tab 
                        label={
                            <Tooltip title="All Files">
                                <FolderIcon fontSize="small" />
                            </Tooltip>
                        }
                        value="all" 
                    />
                    <Tab 
                        label={
                            <Tooltip title="Images">
                                <ImageIcon fontSize="small" />
                            </Tooltip>
                        }
                        value="image" 
                    />
                    <Tab 
                        label={
                            <Tooltip title="Audio">
                                <AudioFileIcon fontSize="small" />
                            </Tooltip>
                        }
                        value="audio" 
                    />
                    <Tab 
                        label={
                            <Tooltip title="Documents">
                                <PictureAsPdfIcon fontSize="small" />
                            </Tooltip>
                        }
                        value="document" 
                    />
                    <Tab 
                        label={
                            <Tooltip title="Suggestions">
                                <AutoAwesomeIcon fontSize="small" />
                            </Tooltip>
                        }
                        value="suggestions" 
                    />
                    <Tab 
                        label={
                            <Tooltip title="Upload Files">
                                <UploadFile fontSize="small" />
                            </Tooltip>
                        }
                        value="upload" 
                    />
                </Tabs>

                {/* Tab Content */}
                <Box sx={{ width: '100%', mt: 1, borderBottom: '1px solid #e0e0e0' }}>
                    {/* Suggestions Tab Content */}
                    {generator === 'suggestions' && (
                        <Box sx={{ width: '100%' }}>
                            {/* Document selector */}
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={files.filter(file => 
                                    file.mimeType === 'application/pdf' || 
                                    file.mimeType === 'text/plain' ||
                                    file.mimeType === 'text/markdown' ||
                                    file.mimeType === 'text/csv'
                                )}
                                getOptionLabel={(file) => {
                                    const docStatus = documentStatuses[file.path];
                                    return `${file.name}${docStatus?.status === 'completed' ? ' ✓' : ''}`;
                                }}
                                value={files.find(f => {
                                    const docStatus = documentStatuses[f.path];
                                    return docStatus?.id === selectedDocument;
                                }) || null}
                                onChange={(event, newValue) => {
                                    if (newValue) {
                                        const docStatus = documentStatuses[newValue.path];
                                        setSelectedDocument(docStatus?.id);
                                    } else {
                                        setSelectedDocument(null);
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select Document"
                                        placeholder="Search documents..."
                                    />
                                )}
                                sx={{ mb: 2, px: 1 }}
                            />
                            
                            {/* Show suggestions if document is selected */}
                            {selectedDocument ? (
                                <>
                                    <Tabs
                                        value={suggestionTab}
                                        onChange={(e, newValue) => setSuggestionTab(newValue)}
                                        variant="fullWidth"
                                        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, px: 1 }}
                                    >
                                        <Tab label="Vocabulary" />
                                        <Tab label="Questions" />
                                    </Tabs>
                                    
                                    {/* Vocabulary Tab */}
                                    {suggestionTab === 0 && (
                                        <SuggestedVocabulary 
                                            documentId={selectedDocument}
                                            unitId={unit?.id}
                                            onImport={(count) => {
                                                console.log(`Imported ${count} vocabulary items`);
                                            }}
                                        />
                                    )}
                                    
                                    {/* Questions Tab */}
                                    {suggestionTab === 1 && (
                                        <SuggestedQuestions 
                                            documentId={selectedDocument}
                                            unitId={unit?.id}
                                            onImport={(count) => {
                                                console.log(`Imported ${count} questions`);
                                            }}
                                        />
                                    )}
                                </>
                            ) : (
                                <Box sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Select a document to review AI-generated vocabulary and question suggestions
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                    
                    {/* Upload Tab Content */}
                    {generator === 'upload' && (
                        <Box 
                            sx={{ p: 2, textAlign: 'center', position: 'relative' }}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onDragLeave={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsDragging(false);
                            }}
                        >
                            {isDragging && (
                                <div
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    onDragLeave={(e) => {
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
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    Upload file(s)
                                </div>
                            )}
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Drag and drop files here to upload
                            </Typography>
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<UploadFile />}
                                onClick={() => {
                                    document.getElementById('file-upload-input')?.click();
                                }}
                                sx={{ mt: 1 }}
                            >
                                Choose Files
                            </Button>
                            <input
                                id="file-upload-input"
                                type="file"
                                multiple
                                hidden
                                onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    setFilesToUpload(files.map((f, index) => ({ file: f, index })));
                                }}
                            />
                        </Box>
                    )}
                    
                    {/* Search for other tabs */}
                    {generator !== 'upload' || generator !== "suggestions" && (
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1,
                                alignItems: 'center',
                                px: 1,
                            }}
                        >
                            <TextField
                                value={search}
                                onInput={handleSearch}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearchSubmit();
                                    }
                                }}
                                size="small"
                                fullWidth
                                placeholder={`Search ${generator === 'all' ? 'all files' : generator === 'image' ? 'images' : generator === 'audio' ? 'audio' : generator === 'document' ? 'documents' : 'files'}...`}
                                InputProps={{
                                    endAdornment: (
                                        <IconButton
                                            size="small"
                                            onClick={handleSearchSubmit}
                                            disabled={searching}
                                        >
                                            {searching ? <CircularProgress size={20} /> : <SearchIcon />}
                                        </IconButton>
                                    ),
                                }}
                            />
                        </Box>
                    )}
                    
                    {/* Generate button for image/audio tabs */}
                    {(generator === 'image' || generator === 'audio') && (
                        <Button
                            variant="contained"
                            aria-label="Generate new File"
                            onClick={() => {
                                toggleNewFileForm();
                            }}
                            sx={{ 
                                mx: 1, 
                                mb: 1,
                            }}
                        >
                            <AutoAwesomeIcon sx={{ mr: 1 }} />
                            Generate {generator === 'image' ? 'Image' : 'Audio'}
                        </Button>
                    )}
                </Box>

                {/* Generation Modals - UnifiedGenerateModal replaces old Dialog approach */}
                {generator === 'image' && (
                    <ImageGeneratorButton
                        open={newFileFormOpen}
                        onSuccess={() => {
                            setNewFileFormOpen(false);
                            setNewImageFileFormOpen(false);
                        }}
                    />
                )}
                {generator === 'audio' && (
                    <AudioGeneratorButton
                        open={newFileFormOpen}
                        onSuccess={() => {
                            setNewFileFormOpen(false);
                            setNewAudioFileFormOpen(false);
                        }}
                    />
                )}

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


            {/* Only show TreeView when not in suggestions or upload tabs */}
            {generator !== 'suggestions' && generator !== 'upload' && (
                <Box sx={{ minHeight: 200, minWidth: 250 }}>
                    <SimpleTreeView apiRef={apiRef}>
                    {files.filter(file => file.mimeType.includes('image')).length > 0 && (
                        <TreeItem 
                            itemId="images"
                            onClick={(e) => {
                                if (generator !== 'all' && generator !== 'image') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setGenerator('image');
                                }
                            }}
                            label={
                                <Box 
                                    sx={{ 
                                        opacity: generator !== 'all' && generator !== 'image' ? 0.5 : 1,
                                    }}
                                >
                                    {`Images (${files.filter(f => f.mimeType.includes('image')).length})`}
                                </Box>
                            }
                        >
                            {files
                                .filter(file => file.mimeType.includes('image'))
                                .map((file) => (
                                    <TreeItem
                                        itemId={file.id}
                                        key={file.id}
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                                                <ListItemImage file={file} />
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography noWrap>{file.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {(file.size / 1000).toFixed(2)} KB
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    {editor && (
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                                                                    altText: file.name,
                                                                    path: file.path,
                                                                    identityId: file.identityId,
                                                                });
                                                            }}
                                                        >
                                                            <AddIcon />
                                                        </IconButton>
                                                    )}
                                                    <IconButton
                                                        size="small"
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            const confirmed = window.confirm(`Are you sure you want to delete ${file.path}?`);
                                                            if (!confirmed) return;
                                                            await DataStore.delete(file);
                                                            await remove(file);
                                                        }}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        }
                                    />
                                ))}
                        </TreeItem>
                    )}
                    
                    {files.filter(file => file.mimeType.includes('audio')).length > 0 && (
                        <TreeItem
                            itemId="audio"
                            onClick={(e) => {
                                if (generator !== 'all' && generator !== 'audio') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setGenerator('audio');
                                }
                            }}
                            label={
                                <Box 
                                    sx={{ 
                                        opacity: generator !== 'all' && generator !== 'audio' ? 0.5 : 1,
                                    }}
                                >
                                    {`Audio (${files.filter(f => f.mimeType.includes('audio')).length})`}
                                </Box>
                            }
                        >
                            {files
                                .filter(file => file.mimeType.includes('audio'))
                                .map((file) => (
                                    <TreeItem
                                        itemId={file.id}
                                        key={file.id}
                                        label={
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, py: 1, width: '100%' }}>
                                                <ListItemImage file={file} />
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        {editor && (
                                                            <IconButton
                                                                size="small"
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                editor.dispatchCommand(INSERT_PLAYLIST_COMMAND, [file.id]);
                                                            }}
                                                        >
                                                            <AddIcon />
                                                        </IconButton>
                                                    )}
                                                    <IconButton
                                                        size="small"
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            const confirmed = window.confirm(`Are you sure you want to delete ${file.path}?`);
                                                            if (!confirmed) return;
                                                            await DataStore.delete(file);
                                                            await remove(file);
                                                        }}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        </Box>
                                        }
                                    />
                                ))}
                        </TreeItem>
                    )}
                    
                    {files.filter(file => 
                        file.mimeType === 'application/pdf' || 
                        file.mimeType === 'text/plain' ||
                        file.mimeType === 'text/markdown' ||
                        file.mimeType === 'text/csv' ||
                        file.mimeType === 'application/msword' ||
                        file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    ).length > 0 && (
                        <TreeItem 
                            itemId="documents"
                            onClick={(e) => {
                                if (generator !== 'all' && generator !== 'document') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setGenerator('document');
                                }
                            }}
                            label={
                                <Box 
                                    sx={{ 
                                        opacity: generator !== 'all' && generator !== 'document' ? 0.5 : 1,
                                    }}
                                >
                                    {`Documents (${files.filter(f => 
                                        f.mimeType === 'application/pdf' || 
                                        f.mimeType === 'text/plain' ||
                                        f.mimeType === 'text/markdown' ||
                                        f.mimeType === 'text/csv' ||
                                        f.mimeType === 'application/msword' ||
                                        f.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                                    ).length})`}
                                </Box>
                            }
                        >
                            {files
                                .filter(file => 
                                    file.mimeType === 'application/pdf' || 
                                    file.mimeType === 'text/plain' ||
                                    file.mimeType === 'text/markdown' ||
                                    file.mimeType === 'text/csv' ||
                                    file.mimeType === 'application/msword' ||
                                    file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                                )
                                .map((file) => {
                                    const docStatus = documentStatuses[file.path];
                                    const statusInfo = getDocumentStatusInfo(docStatus?.status || 'uploaded');
                                    const isProcessing = ['extracting', 'analyzing'].includes(docStatus?.status);
                                    
                                    // Helper function to get appropriate icon
                                    const getDocumentIcon = (mimeType) => {
                                        if (mimeType === 'application/pdf') return PictureAsPdfIcon;
                                        if (mimeType === 'text/plain') return DescriptionIcon;
                                        if (mimeType === 'text/markdown') return ArticleIcon;
                                        if (mimeType === 'text/csv') return TableChartIcon;
                                        if (mimeType === 'application/msword' || 
                                            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                                            return ArticleIcon;
                                        }
                                        return DescriptionIcon;
                                    };
                                    
                                    const DocumentIcon = getDocumentIcon(file.mimeType);
                                    
                                    return (
                                    <TreeItem
                                        itemId={file.id}
                                        key={file.id}
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                                                <DocumentIcon 
                                                    color={statusInfo.color} 
                                                    sx={{ 
                                                        animation: isProcessing ? 'pulse 2s infinite' : 'none',
                                                        '@keyframes pulse': {
                                                            '0%, 100%': { opacity: 1 },
                                                            '50%': { opacity: 0.5 },
                                                        },
                                                    }}
                                                />
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography noWrap>{file.name}</Typography>
                                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {(file.size / 1000).toFixed(2)} KB
                                                        </Typography>
                                                        {docStatus?.pageCount && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                • {docStatus.pageCount} pages
                                                            </Typography>
                                                        )}
                                                        <Chip 
                                                            size="small" 
                                                            label={statusInfo.label}
                                                            color={statusInfo.chipColor}
                                                            icon={statusInfo.icon}
                                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                                        />
                                                    </Box>
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    {/* Insert PDF into editor - always available */}
                                                    {editor && file.mimeType === 'application/pdf' && (
                                                        <IconButton
                                                            size="small"
                                                            title="Insert Document"
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                editor.dispatchCommand(INSERT_PDF_COMMAND, {
                                                                    path: file.path,
                                                                    identityId: file.identityId,
                                                                    filename: file.name,
                                                                });
                                                            }}
                                                        >
                                                            <AddIcon />
                                                        </IconButton>
                                                    )}
                                                    
                                                    {/* Cancel button - only during processing */}
                                                    {isProcessing && (
                                                        <IconButton
                                                            size="small"
                                                            title="Cancel Analysis"
                                                            color="warning"
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                try {
                                                                    const documents = await DataStore.query(Document, (d) => d.s3Key.eq(file.path));
                                                                    if (documents.length === 0) return;
                                                                    
                                                                    const client = generateClient();
                                                                    const result = await client.graphql({
                                                                        query: cancelPDFAnalysisMutation,
                                                                        variables: { documentID: documents[0].id }
                                                                    });
                                                                    
                                                                    if (result.data.cancelPDFAnalysis.success) {
                                                                        alert(`Analysis cancelled for: ${file.name}`);
                                                                    }
                                                                } catch (error) {
                                                                    console.error('Error cancelling analysis:', error);
                                                                    alert('Failed to cancel: ' + error.message);
                                                                }
                                                            }}
                                                        >
                                                            <CancelIcon />
                                                        </IconButton>
                                                    )}
                                                    
                                                    {/* Analyze button - only when not processing/completed */}
                                                    {!['completed', 'analyzing', 'extracting'].includes(docStatus?.status) && (
                                                        <IconButton
                                                            size="small"
                                                            title="Analyze PDF"
                                                            disabled={isProcessing}
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                try {
                                                                    // Find the Document record for this file
                                                                    const documents = await DataStore.query(Document, (d) => d.s3Key.eq(file.path));
                                                                    if (documents.length === 0) {
                                                                        alert('Document record not found. Please upload the PDF again.');
                                                                        return;
                                                                    }
                                                                    
                                                                    const result = await analyzePDF(documents[0].id);
                                                                    alert(`PDF analysis started! Document ID: ${result.documentID}`);
                                                                } catch (error) {
                                                                    console.error('Error analyzing PDF:', error);
                                                                    alert('Failed to analyze PDF: ' + error.message);
                                                                }
                                                            }}
                                                        >
                                                            <AnalyticsIcon />
                                                        </IconButton>
                                                    )}
                                                    
                                                    <IconButton
                                                        size="small"
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            const confirmed = window.confirm(`Are you sure you want to delete ${file.path}?`);
                                                            if (!confirmed) return;
                                                            await DataStore.delete(file);
                                                            await remove(file);
                                                        }}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        }
                                    />
                                    );
                                })}
                        </TreeItem>
                    )}
                    
                    {generator === 'all' && files
                        .filter(file => 
                            !file.mimeType.includes('image') && 
                            !file.mimeType.includes('audio') && 
                            file.mimeType !== 'application/pdf' &&
                            file.mimeType !== 'text/plain' &&
                            file.mimeType !== 'text/markdown' &&
                            file.mimeType !== 'text/csv' &&
                            file.mimeType !== 'application/msword' &&
                            file.mimeType !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                        )
                        .length > 0 && (
                        <TreeItem itemId="other" label={`Other Files (${files.filter(f => 
                            !f.mimeType.includes('image') && 
                            !f.mimeType.includes('audio') && 
                            f.mimeType !== 'application/pdf' &&
                            f.mimeType !== 'text/plain' &&
                            f.mimeType !== 'text/markdown' &&
                            f.mimeType !== 'text/csv' &&
                            f.mimeType !== 'application/msword' &&
                            f.mimeType !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                        ).length})`}>
                            {files
                                .filter(file => 
                                    !file.mimeType.includes('image') && 
                                    !file.mimeType.includes('audio') && 
                                    file.mimeType !== 'application/pdf' &&
                                    file.mimeType !== 'text/plain' &&
                                    file.mimeType !== 'text/markdown' &&
                                    file.mimeType !== 'text/csv' &&
                                    file.mimeType !== 'application/msword' &&
                                    file.mimeType !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                                )
                                .map((file) => (
                                    <TreeItem
                                        itemId={file.id}
                                        key={file.id}
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography noWrap>{file.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {(file.size / 1000).toFixed(2)} KB
                                                    </Typography>
                                                </Box>
                                                <IconButton
                                                    size="small"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        const confirmed = window.confirm(`Are you sure you want to delete ${file.path}?`);
                                                        if (!confirmed) return;
                                                        await DataStore.delete(file);
                                                        await remove(file);
                                                    }}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        }
                                    />
                                ))}
                        </TreeItem>
                    )}
                </SimpleTreeView>
                </Box>
            )}
        </>

    )
}




