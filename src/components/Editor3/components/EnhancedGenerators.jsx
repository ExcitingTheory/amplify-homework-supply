import React, { useState } from 'react';
import { Box, Button, Typography, Collapse } from '@mui/material';
import { fetchAuthSession } from 'aws-amplify/auth';
import { getAmplifyClient } from '../../../utils/amplifyClient';
import getCachedUrl from '../../../utils/getCachedUrl';
import UnifiedGenerateModal from './UnifiedGenerateModal';
import ImageMaskEditor from './ImageMaskEditor';
import { useTranslation } from 'next-i18next';

/**
 * Enhanced Image Generation with mask support for targeted regeneration
 */
export function EnhancedImageGenerator({ open, onClose }) {
    const { t } = useTranslation('editor.ai');
    const [showMaskEditor, setShowMaskEditor] = useState(false);
    const [currentImage, setCurrentImage] = useState(null);

    const handleGenerate = async (prompt) => {
        const {
            identityId,
            tokens: { idToken },
        } = await fetchAuthSession();

        const client = getAmplifyClient();
        const { data, errors } = await client.mutations.generateImageFile({
            phrase: prompt,
            model: 'dall-e-3',
        });

        if (errors || !data?.path) {
            throw new Error('Failed to generate image');
        }

        const path = data.path;

        const presignedUrl = await getCachedUrl(path);

        const imageData = {
            path,
            url: presignedUrl,
            preview: (
                <Box>
                    <img
                        src={presignedUrl}
                        alt="Generated"
                        style={{
                            width: '100%',
                            maxHeight: '600px',
                            objectFit: 'contain',
                        }}
                    />
                    <Button
                        variant="outlined"
                        fullWidth
                        sx={{ mt: 2 }}
                        onClick={() => {
                            setCurrentImage({ url: presignedUrl, path });
                            setShowMaskEditor(true);
                        }}
                    >
                        {t('enhancedGenerators.editWithMask')}
                    </Button>
                </Box>
            ),
        };

        setCurrentImage(imageData);
        return imageData;
    };

    const handleRegenerate = async (prompt, previousImage, maskData) => {
        const {
            identityId,
            tokens: { idToken },
        } = await fetchAuthSession();

        // If maskData is provided, we're doing targeted regeneration
        // Otherwise, full regeneration
        const variables = {
            phrase: prompt,
            model: 'dall-e-3',
        };

        if (maskData) {
            // TODO: Extend GraphQL mutation to support mask parameter
            // For now, this would require API enhancement
            variables.mask = maskData.mask;
            variables.originalImage = previousImage.path;
        }

        const client = getAmplifyClient();
        const { data, errors } = await client.mutations.generateImageFile(variables);

        if (errors || !data?.path) {
            throw new Error('Failed to regenerate image');
        }

        const path = data.path;

        const presignedUrl = await getCachedUrl(path);

        return {
            path,
            url: presignedUrl,
            preview: (
                <Box>
                    <img
                        src={presignedUrl}
                        alt="Regenerated"
                        style={{
                            width: '100%',
                            maxHeight: '600px',
                            objectFit: 'contain',
                        }}
                    />
                    <Button
                        variant="outlined"
                        fullWidth
                        sx={{ mt: 2 }}
                        onClick={() => {
                            setCurrentImage({ url: presignedUrl, path });
                            setShowMaskEditor(true);
                        }}
                    >
                        {t('enhancedGenerators.editWithMask')}
                    </Button>
                </Box>
            ),
        };
    };

    const handleMaskComplete = async (maskData) => {
        setShowMaskEditor(false);
        // Trigger regeneration with mask
        await handleRegenerate(
            'Regenerate masked area',
            currentImage,
            maskData
        );
    };

    if (showMaskEditor && currentImage) {
        return (
            <ImageMaskEditor
                imageUrl={currentImage.url}
                onMaskComplete={handleMaskComplete}
                onCancel={() => setShowMaskEditor(false)}
            />
        );
    }

    return (
        <UnifiedGenerateModal
            open={open}
            onClose={onClose}
            onGenerate={handleGenerate}
            onRegenerate={handleRegenerate}
            title={t('enhancedGenerators.generateImage')}
            inputPlaceholder={t('enhancedGenerators.imagePromptPlaceholder')}
            type="image"
        />
    );
}

/**
 * Enhanced Audio Generation — TTS generation only.
 * For multi-speaker dialogue recording, use RecordingStudio3 via FileManager2's
 * "Record Conversation" button.
 */
export function EnhancedAudioGenerator({ open, onClose }) {
    const { t } = useTranslation('editor.ai');

    const handleGenerate = async (prompt) => {
        const {
            identityId,
            tokens: { idToken },
        } = await fetchAuthSession();

        const client = getAmplifyClient();
        const { data, errors } = await client.mutations.generateAudioFile({
            phrase: prompt,
            voice: 'alloy',
            model: 'tts-1',
        });

        if (errors || !data?.path) {
            throw new Error('Failed to generate audio');
        }

        const path = data.path;
        const presignedUrl = await getCachedUrl(path);

        return {
            path,
            url: presignedUrl,
            preview: (
                <Box>
                    <audio
                        controls
                        src={presignedUrl}
                        style={{
                            width: '100%',
                        }}
                    />
                </Box>
            ),
        };
    };

    const handleRegenerate = async (prompt) => {
        return handleGenerate(prompt);
    };

    return (
        <UnifiedGenerateModal
            open={open}
            onClose={onClose}
            onGenerate={handleGenerate}
            onRegenerate={handleRegenerate}
            title={t('enhancedGenerators.generateAudio')}
            inputPlaceholder={t('enhancedGenerators.audioPromptPlaceholder')}
            type="audio"
        />
    );
}

/**
 * Button component for image generation that can be embedded in FileManager
 */
export function ImageGeneratorButton({ open, onSuccess }) {
    const { t } = useTranslation('editor.ai');
    const [modalOpen, setModalOpen] = useState(false);

    // Auto-open when parent says open=true
    React.useEffect(() => {
        if (open) {
            setModalOpen(true);
        }
    }, [open]);

    const handleGenerate = async (prompt) => {
        const {
            identityId,
            tokens: { idToken },
        } = await fetchAuthSession();

        const client = getAmplifyClient();
        const { data, errors } = await client.mutations.generateImageFile({
            phrase: prompt,
            model: 'dall-e-3',
        });

        if (errors || !data?.path) {
            throw new Error('Failed to generate image');
        }

        const path = data.path;

        const presignedUrl = await getCachedUrl(path);

        const imageData = {
            path,
            url: presignedUrl,
            preview: (
                <Box>
                    <img
                        src={presignedUrl}
                        alt="Generated"
                        style={{
                            width: '100%',
                            maxHeight: '600px',
                            objectFit: 'contain',
                        }}
                    />
                </Box>
            ),
        };

        return imageData;
    };

    const handleClose = () => {
        setModalOpen(false);
        if (onSuccess) {
            onSuccess();
        }
    };

    return (
        <UnifiedGenerateModal
            open={modalOpen}
            onClose={handleClose}
            onGenerate={handleGenerate}
            onRegenerate={handleGenerate}
            title="Generate Image"
            inputPlaceholder="Describe the image you want to generate..."
            type="image"
        />
    );
}

/**
 * Button component for audio generation that can be embedded in FileManager
 */
export function AudioGeneratorButton({ open, onSuccess }) {
    const [modalOpen, setModalOpen] = useState(false);

    React.useEffect(() => {
        if (open) {
            setModalOpen(true);
        }
    }, [open]);

    const handleGenerate = async (prompt) => {
        const {
            identityId,
            tokens: { idToken },
        } = await fetchAuthSession();

        const client = getAmplifyClient();
        const { data, errors } = await client.mutations.generateAudioFile({
            phrase: prompt,
            voice: 'alloy',
            model: 'tts-1',
        });

        if (errors || !data?.path) {
            throw new Error('Failed to generate audio');
        }

        const path = data.path;

        const presignedUrl = await getCachedUrl(path);

        return {
            path,
            url: presignedUrl,
            preview: (
                <Box>
                    <audio
                        controls
                        src={presignedUrl}
                        style={{
                            width: '100%',
                        }}
                    />
                </Box>
            ),
        };
    };

    const handleClose = () => {
        setModalOpen(false);
        if (onSuccess) {
            onSuccess();
        }
    };

    return (
        <UnifiedGenerateModal
            open={modalOpen}
            onClose={handleClose}
            onGenerate={handleGenerate}
            onRegenerate={handleGenerate}
            title="Generate Audio"
            inputPlaceholder="Enter text to convert to speech..."
            type="audio"
        />
    );
}
