/**
 * @fileoverview DragDropPastePlugin - Handles drag-drop and paste for media files.
 * @module DragDropPastePlugin
 * 
 * Manages file uploads via drag-drop and paste operations. Supports images,
 * audio files, and documents with AWS S3 storage integration.
 */

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
import { getAmplifyClient } from '../../../utils/amplifyClient';
// Type import removed - not needed in runtime JS

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
    'audio/mp3',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/m4a',
    'audio/aac',
    'audio/webm',
    'audio/flac',
];

export const ACCEPTABLE_FILE_TYPES = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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
        session,
    } = React.useContext(FilesContext);
    
    const identityId = session?.identityId;

    const [fileOperations, setFileOperations] = React.useState([]);
    // const [filesToUpload, setFilesToUpload] = React.useState([]);

    useEffect(() => {
        // Don't register command if not authenticated
        if (!identityId) {
            console.log('[DragDropPaste] Skipping command registration - no identityId');
            return;
        }

        return editor.registerCommand(DRAG_DROP_PASTE, (files) => {
            (async () => {
                const _fileOperations = files.map((f) => ({ name: f.name, progress: '0%' }));

                setFileOperations(_fileOperations);

                const _inProgress = files.map(async (file, index) => {
                    let subfolder;
                    if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
                        subfolder = 'images';
                        // What if a duplicate file is uploaded. How to handle?
                    } else if (isMimeType(file, ACCEPTABLE_AUDIO_TYPES)) {
                        subfolder = 'audio';
                        // Way to determine length of audio file?
                    } else if (isMimeType(file, ACCEPTABLE_FILE_TYPES)) {
                        subfolder = 'files';
                        // How to generate thumbnail for file?
                    }

                    // Gen 2 API requires full path with protection level prefix
                    const s3Path = `protected/${identityId}/${subfolder}/${file.name}`;

                    const uploadOperation = uploadData({
                        path: s3Path,
                        data: file,
                        options: {
                            contentType: file.type,
                            onProgress(progress) {
                                console.log(`Uploaded: ${progress.transferredBytes}/${progress.totalBytes}`);

                                setFileOperations((prev) => {
                                    const newFileOperations = [...prev];
                                    newFileOperations[index].progress = Math.round(progress.transferredBytes / progress.totalBytes * 100) + '%';
                                    return newFileOperations;
                                })
                            }
                        }
                    });

                    // Wait for upload to complete
                    const uploadResult = await uploadOperation.result;

                    const client = getAmplifyClient();
                    const { data: newFile } = await client.models.File.create({
                        path: uploadResult.path,  // Use the full S3 path from upload
                        name: file.name,
                        size: file.size,
                        mimeType: file.type,
                        level: 'PROTECTED',
                        identityId,
                    });

                    console.log('DragDropPastePlugin result', newFile)

                    if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
                        // set timeout to allow for S3? to update
                        setTimeout(() => {
                                
                            editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                                altText: newFile.name,
                                path: newFile.path,  // Use the path from File record
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