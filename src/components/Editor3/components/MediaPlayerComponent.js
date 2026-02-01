import * as React from 'react';
import { useTranslation } from 'next-i18next';

import { useEffect, useState, useRef } from 'react';

import { DataGrid } from '@mui/x-data-grid';

import {
    Box,
    LinearProgress,
    Typography
} from '@mui/material';

import UnitContext from '../../../context/unitContext';

import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import getCachedUrl from '../../../utils/getCachedUrl';
import DictionaryContext from '../../../context/dictionaryContext';

function LinearProgressWithLabel({ value }) {
    return (
        <>
            <Box display="flex" alignItems="center" margin={1}>
                <Box width="95%">
                    <LinearProgress variant="determinate" value={value} />
                </Box>
                <Box width='fit-content' marginLeft={1}>
                    <Typography variant="body2" color="textSecondary">{`${Math.round(
                        props.value,
                    )}%`}</Typography>
                </Box>
            </Box>
        </>
    );
}

export default function MediaPlayerComponent({
    className,
    format,
    nodeKey,
    // setFileIDs,
    fileIDs,
    questionIDs,
    words,
    requestDefinition = false,
}) {
    const { t } = useTranslation('editor.shared');
    const [gridSelection, setGridSelection] = React.useState([]);
    const [index, setIndex] = useState(0);
    const [sources, setSources] = useState([]);
    const [rows, setRows] = useState([]);

    const playlist = React.useRef([]);

    const {
        unit,
        files,
        questionBank,
        playlistUrls,
    } = React.useContext(UnitContext);

    React.useEffect(() => {
        const loadFiles = async () => {
            const newRows = [];
            const newSources = [];
            
            if (fileIDs) {
                playlist.current = fileIDs;
                
                for (let key = 0; key < fileIDs.length; key++) {
                    const id = fileIDs[key];
                    if (!id) continue;

                    console.log('MediaPlayerComponent.id', id);
                    console.log('MediaPlayerComponent.files[id]', files[id]);

                    const file = files[id];
                    const url = file?.path;
                    
                    if (key === 0 && url) {
                        // sign url
                        const src = await getCachedUrl(url, 'protected', unit.identityId);
                        if (src) {
                            // Detect MIME type from file extension
                            const ext = url.split('.').pop().toLowerCase();
                            const mimeType = ext === 'mp4' ? 'video/mp4' : 
                                           ext === 'webm' ? 'video/webm' :
                                           ext === 'ogg' ? 'audio/ogg' :
                                           ext === 'wav' ? 'audio/wav' :
                                           ext === 'm4a' ? 'audio/mp4' :
                                           'audio/mpeg'; // default for mp3
                            newSources.push({
                                src,
                                type: mimeType,
                            });
                        }
                    }
                    
                    if (file) {
                        newRows.push({
                            id: file.id,
                            title: file.name,
                            size: (file.size / 10000).toFixed(2) + ' MB',
                            url,
                        });
                    }
                }
            }
            
            if (questionIDs) {
                playlist.current = questionIDs;
                
                for (let key = 0; key < questionIDs.length; key++) {
                    const questionID = questionIDs[key];
                    if (!questionID) continue;

                    console.log('MediaPlayerComponent.questionID', questionID);
                    const question = questionBank[questionID];
                    console.log('MediaPlayerComponent.question', question);

                    // get the audio url randomly select from list
                    let url = question?.audio[0];
                    let title = question?.prompt;

                    const targetIdentityId = question?.targetIdentityId;
                    
                    if (key === 0 && url) {
                        // sign url
                        const src = await getCachedUrl(url, 'protected', targetIdentityId);
                        if (src) {
                            const ext = url.split('.').pop().toLowerCase();
                            const mimeType = ext === 'mp4' ? 'video/mp4' : 
                                           ext === 'webm' ? 'video/webm' :
                                           ext === 'ogg' ? 'audio/ogg' :
                                           ext === 'wav' ? 'audio/wav' :
                                           ext === 'm4a' ? 'audio/mp4' :
                                           'audio/mpeg';
                            newSources.push({
                                src,
                                type: mimeType,
                            });
                        }
                    }
                    
                    if (question) {
                        newRows.push({
                            id: question.id,
                            title,
                            url,
                        });
                    }
                }
            }
            
            if (words) {
                for (let key = 0; key < words.length; key++) {
                    const word = words[key];
                    if (!word) continue;

                    console.log('MediaPlayerComponent.word', word);

                    // get the audio url randomly select from list
                    let url = word?.audio[0];
                    let title = word?.phrase;
                    // if requestDefinition is true, then get the definition audio
                    if (requestDefinition) {
                        url = word?.definitionAudio[0];
                        title = word?.definition;
                    }

                    const targetIdentityId = word?.targetIdentityId;
                    
                    if (key === 0 && url) {
                        // sign url
                        const src = await getCachedUrl(url, 'protected', targetIdentityId);
                        if (src) {
                            const ext = url.split('.').pop().toLowerCase();
                            const mimeType = ext === 'mp4' ? 'video/mp4' : 
                                           ext === 'webm' ? 'video/webm' :
                                           ext === 'ogg' ? 'audio/ogg' :
                                           ext === 'wav' ? 'audio/wav' :
                                           ext === 'm4a' ? 'audio/mp4' :
                                           'audio/mpeg';
                            newSources.push({
                                src,
                                type: mimeType,
                            });
                        }
                    }
                    
                    if (word) {
                        newRows.push({
                            id: word.id,
                            title,
                            size: (word.size / 10000).toFixed(2) + ' MB',
                            url,
                        });
                    }
                }
            }

            console.log('MediaPlayerComponent._sources', newSources);
            
            setRows(newRows);
            if (newSources.length > 0) {
                setSources(newSources);
            }
        };

        loadFiles();
    }, [fileIDs, questionIDs, words, files, questionBank, unit, requestDefinition]);

    const options = {
        controls: true,
        sources: sources,
    };

    console.log('MediaPlayerComponent.options', options)

    console.log('MediaPlayerComponent.playlistUrls', playlistUrls)

    const columns = [
        { field: 'title', headerName: 'Title', flex: 1, minWidth: 100 },
        // { field: 'size', headerName: 'Size', flex: 1, minWidth: 100 },
        // {
        //     field: 'duration',
        //     headerName: 'Duration',
        //     // description: '',
        //     // sortable: false,
        //     width: 160,
        //     valueGetter: (params) => {
        //         console.log('valueGetter', params);
        //         const sound = howlerRefs.current[params.id];
        //         if (sound) {
        //             return sound.duration().toFixed(2);
        //         }
        //     }
        // },
    ];

    const videoRef = useRef(null);
    const playerRef = useRef(null);
    // const {options, onReady} = props;

    useEffect(() => {
        // Only initialize player if we have sources
        if (sources.length === 0) {
            return;
        }

        // Make sure Video.js player is only initialized once
        if (!playerRef.current) {
            // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode. 
            const videoElement = document.createElement("video-js");

            videoElement.classList.add('vjs-small-play-centered');
            videoRef.current.appendChild(videoElement);

            const player = playerRef.current = videojs(videoElement, options, () => {
                console.log('VIDEOJS: player is ready');
            });
        } else {
            const player = playerRef.current;

            player.autoplay(options.autoplay);
            console.log('MediaPlayerComponent.options.sources', options.sources);

            // Update the player sources
            if (options.sources && options.sources.length > 0) {
                player.src(options.sources);
                player.load();
            }
        }
    }, [options, videoRef, sources]);

    // Dispose the Video.js player when the functional component unmounts
    useEffect(() => {
        const player = playerRef.current;

        return () => {
            if (player && !player.isDisposed()) {
                player.dispose();
                playerRef.current = null;
            }
        };
    }, [playerRef]);

    const nowPlayingId = playlist.current?.[index];
    console.log('nowPlayingId', nowPlayingId)

    return (
        <Box 
            className={className}
            style={{
                maxWidth: '72rem'
            }}
        >
            <div data-vjs-player>
                <div ref={videoRef} />
            </div>

            {rows.length > 0 && (
                <DataGrid
                    sx={{
                        marginTop: '0.5rem',
                    }}
                    rows={rows}

                    columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: { page: 0, pageSize: 10 },
                        },
                    }}
                    pageSizeOptions={[5, 10, 100]}
                    checkboxSelection={false}
                    onRowSelectionModelChange={async (e) => {
                        console.log('onRowSelectionModelChange', e);
                        if (e.length > 0) {
                            playlist.current = e;
                            const _id = e[index]
                            if (!_id) return
                            const player = playerRef.current;

                            player.autoplay(true);
                            
                            // sign url
                            const url = playlistUrls[_id];
                            const src = await getCachedUrl(url);
                            if (src) {
                                const ext = url?.split('.').pop().toLowerCase() || 'mp3';
                                const mimeType = ext === 'mp4' ? 'video/mp4' : 
                                               ext === 'webm' ? 'video/webm' :
                                               ext === 'ogg' ? 'audio/ogg' :
                                               ext === 'wav' ? 'audio/wav' :
                                               ext === 'm4a' ? 'audio/mp4' :
                                               'audio/mpeg';
                                setSources([{
                                    src,
                                    type: mimeType,
                                }]);
                            }
   
                        }
                        setGridSelection(e);

                    }}
                />
            )}

        </Box>
    );
}