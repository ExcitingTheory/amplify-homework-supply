import * as React from 'react';

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
    const [gridSelection, setGridSelection] = React.useState([]);
    const [index, setIndex] = useState(0);
    const [sources, setSources] = useState([]);

    const playlist = React.useRef([]);

    const {
        unit,
        files,
        questionBank,
        playlistUrls,
    } = React.useContext(UnitContext);

    const rows = []
    const _sources = []
    
    if (fileIDs) {
        playlist.current = fileIDs
        fileIDs.forEach(async (id, key) => {
            if (!id) return;

            console.log('MediaPlayerComponent.id', id)
            console.log('MediaPlayerComponent.files[id]', files[id])

            const file = files[id];
            const url = file?.path;
            if (key === 0) {
                // sign url
                const src = await getCachedUrl(url, 'protected', unit.identityId);
                _sources.push({
                    src,
                    type: 'audio/mp3',
                });
            }
            if (file) {
                rows.push({
                    id: file.id,
                    title: file.name,
                    size: (file.size / 10000).toFixed(2) + ' MB',
                    url,
                });
            }
        });
    }
    if (questionIDs) {
        playlist.current = questionIDs
        questionIDs.forEach(async (questionID, key) => {
            if (!questionID) return;

            console.log('MediaPlayerComponent.questionID', questionID)
            const question = questionBank[questionID];
            console.log('MediaPlayerComponent.question', question)

            // get the audio url randomly select from list
            let url = question?.audio[0];
            let title = question?.prompt;


            const targetIdentityId = question?.targetIdentityId;
            if (key === 0) {
                // sign url
                const src = await getCachedUrl(url, 'protected', targetIdentityId);
                _sources.push({
                    src,
                    type: 'audio/mp3',
                });
            }
            if (question) {
                rows.push({
                    id: question.id,
                    title,
                    // size: (question.size / 10000).toFixed(2) + ' MB',
                    url,
                });
            }
        });
    }
    if (words) {
        words.forEach(async (word, key) => {
            if (!word) return;

            console.log('MediaPlayerComponent.word', word)

            // get the audio url randomly select from list
            let url = word?.audio[0];
            let title = word?.phrase;
            // if requestDefinition is true, then get the definition audio
            if(requestDefinition) {
                url = word?.definitionAudio[0];
                title = word?.definition;
            }


            const targetIdentityId = word?.targetIdentityId;
            if (key === 0) {
                // sign url
                const src = await getCachedUrl(url, 'protected', targetIdentityId);
                _sources.push({
                    src,
                    type: 'audio/mp3',
                });
            }
            if (word) {
                rows.push({
                    id: word.id,
                    title,
                    size: (word.size / 10000).toFixed(2) + ' MB',
                    url,
                });
            }
        });
    }

    console.log('MediaPlayerComponent._sources', _sources)

    

    const options = {
        // autoplay: true,
        // fluid: true, // make configurable
        // audioPosterMode: true, // make configurable
        controls: true,
        sources: sources.length > 0 ? sources : _sources,
        // poster: 'https://picsum.photos/300/200', // make configurable
        // sources: [{
        //     src: playlistUrls[nowPlayingId],
        //     type: 'audio/mp3',
        // }],
    }

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

        if(!options.sources) return
        // Make sure Video.js player is only initialized once
        if (!playerRef.current) {
            // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode. 
            const videoElement = document.createElement("video-js");

            videoElement.classList.add('vjs-small-play-centered');
            videoRef.current.appendChild(videoElement);

            const player = playerRef.current = videojs(videoElement, options, () => {
                videojs.log('player is ready');
                
                //   onReady && onReady(player);
            });

            // player.on('play', () => {
            //     console.log('MediaPlayerComponent.play');
            // });

            // You could update an existing player in the `else` block here
            // on prop change, for example:
        } else {
            // const player = playerRef.current;

            playerRef.current.autoplay(options.autoplay);
            console.log('MediaPlayerComponent.options.sources', options.sources)

            playerRef.current.options = options;
        }
    }, [options, videoRef, playlistUrls]);

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
        <Box style={{
            maxWidth: '72rem'
        }}>
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
                            const src = await getCachedUrl(playlistUrls[_id]);
                            setSources([{
                                src,
                                type: 'audio/mp3',
                            }]);
   
                        }
                        setGridSelection(e);

                    }}
                />
            )}

        </Box>
    );
}