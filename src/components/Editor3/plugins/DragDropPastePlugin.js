import { uploadData } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';
import React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { DRAG_DROP_PASTE } from '@lexical/rich-text';
import { isMimeType, mediaFileReader } from '@lexical/utils';
import { COMMAND_PRIORITY_HIGH, COMMAND_PRIORITY_LOW } from 'lexical';
import { useEffect } from 'react';
import { INSERT_IMAGE_COMMAND } from './ImagesPlugin';
import { INSERT_PLAYLIST_COMMAND } from './PlaylistPlugin';
import { DataStore } from '@aws-amplify/datastore';
import { File } from '../../../models';

import { createPortal } from 'react-dom';
import FilesContext from '../../../context/fileContext';

export const ACCEPTABLE_IMAGE_TYPES = [
    'image/',
    'image/heic',
    'image/heif',
    'image/gif',
    'image/webp',
    'image/png',
    'image/jpeg',
];

export const ACCEPTABLE_AUDIO_TYPES = [
    // 'audio/',
    // 'audio/mpeg',
    // 'audio/mp4',
    'audio/mp3',
    // 'audio/wav',
    // 'audio/webm',
];

export const ACCEPTABLE_FILE_TYPES = [
    'application/pdf',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/x-bzip',
    'application/x-bzip2',
    'application/gzip',
    'application/x-xz',
    'application/x-msdownload',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation',
];

export const ANY_ACCEPTABLE_TYPES = [
    ...ACCEPTABLE_IMAGE_TYPES,
    ...ACCEPTABLE_AUDIO_TYPES,
    ...ACCEPTABLE_FILE_TYPES,
];

export default function DragDropPaste() {
    const [editor] = useLexicalComposerContext();

    const {
        session: { identityId },
    } = React.useContext(FilesContext);

    const [fileOperations, setFileOperations] = React.useState([]);
    // const [filesToUpload, setFilesToUpload] = React.useState([]);

    useEffect(() => {
        return editor.registerCommand(DRAG_DROP_PASTE, (files) => {
            (async () => {
                const _fileOperations = files.map((f) => ({ name: f.name, progress: '0%' }));

                setFileOperations(_fileOperations);

                const _inProgress = files.map(async (file, index) => {
                    let newFilename;
                    let thumbnailFilename;
                    if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
                        newFilename = `images/${file.name}`
                        thumbnailFilename = `thumbnails/${file.name}`

                        // What if a duplicate file is uploaded. How to handle?
                    } else if (isMimeType(file, ACCEPTABLE_AUDIO_TYPES)) {
                        newFilename = `audio/${file.name}`
                        // Way to determine length of audio file?
                    } else if (isMimeType(file, ACCEPTABLE_FILE_TYPES)) {
                        newFilename = `files/${file.name}`

                        // How to generate thumbnail for file?
                    }

                    await uploadData({
                        key: newFilename,
                        data: file,
                        options: {
                            contentType: file.type,
                            contentLength: file.size,
                            accessLevel: 'protected',
                            identityId,
                            progressCallback(progress) {
                                console.log(`Uploaded: ${progress.loaded}/${progress.total}`);

                                setFileOperations((prev) => {
                                    const newFileOperations = [...prev];
                                    newFileOperations[index].progress = Math.round(progress.loaded / progress.total * 100) + '%';
                                    return newFileOperations;
                                })
                            }
                        }
                    });

                    const newFile = await DataStore.save(new File({
                        path: newFilename,
                        name: file.name,
                        size: file.size,
                        mimeType: file.type,
                        level: 'protected',
                        identityId,
                    }));

                    console.log('DragDropPastePlugin result', newFile)

                    if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
                        // set timeout to allow for S3? to update
                        setTimeout(() => {
                                
                            editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                                altText: newFile.name,
                                path: newFilename,
                                identityId,
                            });

                        }, 3000);
                    } else if (file.type.includes('audio')) {
                        setTimeout(() => {
                            editor.dispatchCommand(INSERT_PLAYLIST_COMMAND, [newFile.id]);
                        }, 3000);

                    }
                    // else if (isMimeType(file, ACCEPTABLE_FILE_TYPES)) {
                    // Insert link to file
                    //     editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                    //         altText: file.name,
                    //         src: result.key,
                    //     });
                    // }


                })

                await Promise.allSettled(_inProgress);

            })();
            return true;
        }, COMMAND_PRIORITY_HIGH);
    }, [editor]);


    return null

    // open portal to show progress of file uploads
    // return(
    //     createPortal(
    //         <>
    //      {fileOperations.length > 0 &&
    //   fileOperations.map((op, i) => {
    //     return <div
    //       style={{
    //         margin: '0 1rem',
    //       }}
    //       onClick={(e) => {
    //         e.preventDefault();
    //         e.stopPropagation();
    //       }}
    //       key={i}
    //     //   className={operationsClassName}
    //     >
    //       <div
    //         onClick={(e) => {
    //           e.preventDefault();
    //           e.stopPropagation();
    //         }}
    //         primary={op?.name} secondary={op?.progress} />
    //     </div>
    //   })
    // }
    //     </>, document.body)

    // );
}