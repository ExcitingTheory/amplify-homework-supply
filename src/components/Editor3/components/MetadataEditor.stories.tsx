/**
 * @fileoverview Storybook stories for MetadataEditor component
 * 
 * Demonstrates file metadata editing with:
 * - Lexical-powered inline editing
 * - Character count validation
 * - Auto-save with debouncing
 * - Read-only AI generation metadata display
 * - Different file types and states
 * - Unsaved changes indicators
 * 
 * @module Editor3/components/MetadataEditor.stories
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import MetadataEditor from './MetadataEditor';
import { Box, Typography, Paper } from '@mui/material';

const meta: Meta<typeof MetadataEditor> = {
    title: '📚 Creating Lessons/Metadata Editor',
    component: MetadataEditor,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: `
# MetadataEditor Component

A polished file metadata editor with advanced features:

## Features
- ✅ **Lexical-Powered Editing** - Rich text editing with unified undo/redo via Lexical (name & description only)
- ✅ **Always-On Editing** - No edit/view mode toggle - just start typing
- ✅ **Character Counters** - Real-time character counts with visual warnings
- ✅ **Auto-save** - Automatic saving after 2 seconds of inactivity
- ✅ **Loading States** - Clear visual feedback during save operations
- ✅ **Validation** - Character limits enforced in real-time
- ✅ **Responsive Layout** - Adapts to different container sizes
- ✅ **Unsaved Changes Indicator** - Clear visual feedback for pending changes
- ✅ **Read-Only AI Metadata** - Prompt, model, and variant are displayed as read-only for reference

## Use Cases
- Edit file names and descriptions inline
- View AI generation metadata (prompt, model, variant) for reproducibility
- Quick metadata updates with auto-save

## Editable Fields
- **File Name** - Required, max 255 characters
- **Description** - Optional, max 1000 characters

## Read-Only Fields (AI Generation Info)
- **Prompt** - The AI prompt used to generate this file
- **Model** - The AI model used (e.g., gpt-4, dall-e-3)
- **Variant** - The model variant (e.g., turbo, hd)

## UX Improvements
- **No Mode Switching** - Direct editing without clicking "edit" button
- **Unified Undo/Redo** - Lexical provides consistent undo across all fields
- **No Duplicate Display** - Values shown once in editable fields only
- **Minimal UI** - Clean interface focused on content
                `,
            },
        },
    },
    argTypes: {
        autoSaveDelay: {
            control: { type: 'number', min: 1000, max: 10000, step: 500 },
            description: 'Delay in milliseconds before auto-save triggers',
        },
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MetadataEditor>;

// Mock file data
const createMockFile = (overrides = {}) => ({
    id: 'mock-file-id-1',
    name: 'japanese-lesson-photosynthesis.pdf',
    description: 'Comprehensive lesson on photosynthesis in Japanese with diagrams and exercises',
    prompt: 'Create a detailed educational lesson about photosynthesis for Japanese language learners at intermediate level',
    model: 'gpt-4',
    variant: 'turbo',
    mimeType: 'application/pdf',
    size: 1234567,
    path: 'protected/documents/japanese-lesson-photosynthesis.pdf',
    level: 'PROTECTED',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    documentID: 'doc-123',
    owner: 'user-123',
    identityId: 'us-east-1:identity-123',
    _version: 1,
    ...overrides,
});

// Story wrapper component for better presentation
const StoryWrapper = ({ children, title, description }: { children: React.ReactNode; title?: string; description?: string }) => (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
        {title && (
            <Typography variant="h5" gutterBottom sx={{ mb: 1 }}>
                {title}
            </Typography>
        )}
        {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {description}
            </Typography>
        )}
        {children}
    </Box>
);

/**
 * Default view showing always-on editing mode with auto-save.
 * Start typing in any field - changes save automatically after 2 seconds.
 */
export const Default: Story = {
    args: {
        file: createMockFile(),
        autoSaveDelay: 2000,
    },
    render: (args: any) => (
        <StoryWrapper
            title="Default Metadata Editor"
            description="Always-on editing with auto-save for name and description. Type in any editable field and changes save automatically after 2 seconds. AI generation metadata (prompt, model, variant) is displayed as read-only. Use Cmd+Z/Cmd+Shift+Z for unified undo/redo."
        >
            <MetadataEditor {...args} />
        </StoryWrapper>
    ),
};

/**
 * Fast auto-save for quick iterations.
 */
export const QuickAutoSave: Story = {
    args: {
        file: createMockFile(),
        autoSaveDelay: 1000,
    },
    render: (args: any) => (
        <StoryWrapper
            title="Quick Auto-Save (1s)"
            description="Faster auto-save with 1-second delay. Type and watch changes save quickly."
        >
            <MetadataEditor {...args} />
        </StoryWrapper>
    ),
};

/**
 * Minimal file with only required fields populated.
 * Shows how the editor handles sparse data.
 */
export const MinimalFile: Story = {
    args: {
        file: createMockFile({
            name: 'quick-note.txt',
            description: '',
            prompt: '',
            model: '',
            variant: '',
            mimeType: 'text/plain',
            size: 1024,
            level: 'PUBLIC',
        }),
    },
    render: (args: any) => (
        <StoryWrapper
            title="Minimal File Data"
            description="A file without AI generation metadata. Only name and description are editable."
        >
            <MetadataEditor {...args} />
        </StoryWrapper>
    ),
};

/**
 * Large file with extensive metadata to test character counters.
 */
export const LargeMetadata: Story = {
    args: {
        file: createMockFile({
            name: 'comprehensive-japanese-grammar-and-vocabulary-reference-guide.pdf',
            description: 'This is a comprehensive educational resource covering all aspects of Japanese grammar, vocabulary, and usage patterns. It includes detailed explanations, numerous examples, practice exercises, and cultural notes. The document is designed for intermediate to advanced learners and serves as both a learning tool and a reference guide for daily use. It covers particles, verb conjugations, honorifics, keigo, and much more in extensive detail with hundreds of example sentences.',
            prompt: 'Create a comprehensive Japanese language reference guide that covers grammar rules, vocabulary lists, usage patterns, and cultural context. Include detailed explanations with examples for each grammatical concept. Cover all JLPT levels from N5 to N1. Add practice exercises and answer keys. Include cultural notes and usage tips throughout. Format with clear headings and organized sections for easy reference.',
            model: 'gpt-4-turbo-preview',
            variant: 'ultra-high-quality',
        }),
        autoSaveDelay: 2000,
    },
    render: (args: any) => (
        <StoryWrapper
            title="Large Metadata Values"
            description="File with extensive metadata. Only name and description are editable; prompt, model, and variant are shown as read-only reference."
        >
            <MetadataEditor {...args} />
        </StoryWrapper>
    ),
};

/**
 * Image file with generation metadata.
 * Shows how AI-generated images store their prompts.
 */
export const AIGeneratedImage: Story = {
    args: {
        file: createMockFile({
            name: 'japanese-garden-illustration.png',
            description: 'Artistic illustration of a traditional Japanese garden with koi pond',
            prompt: 'A serene traditional Japanese garden with a koi pond, stone lanterns, cherry blossom trees, and a red wooden bridge. Watercolor style, soft colors, peaceful atmosphere.',
            model: 'dall-e-3',
            variant: 'hd',
            mimeType: 'image/png',
            size: 2458624,
            level: 'PUBLIC',
        }),
        autoSaveDelay: 2000,
    },
    render: (args: any) => (
        <StoryWrapper
            title="AI-Generated Image"
            description="Metadata for an AI-generated image file. The generation prompt, model, and variant are shown as read-only reference information."
        >
            <MetadataEditor {...args} />
        </StoryWrapper>
    ),
};

/**
 * Audio file with TTS metadata.
 * Shows how text-to-speech generated files store their source.
 */
export const TTSAudioFile: Story = {
    args: {
        file: createMockFile({
            name: 'vocabulary-pronunciation.mp3',
            description: 'Audio pronunciation guide for Japanese vocabulary words',
            prompt: 'Generate clear pronunciation audio for the following Japanese words: こんにちは、ありがとう、さようなら、おはよう、こんばんは',
            model: 'tts-1',
            variant: 'hd',
            mimeType: 'audio/mpeg',
            size: 345678,
            duration: 45,
            level: 'PROTECTED',
        }),
        autoSaveDelay: 2000,
    },
    render: (args: any) => (
        <StoryWrapper
            title="TTS Audio File"
            description="Metadata for a text-to-speech generated audio file."
        >
            <MetadataEditor {...args} />
        </StoryWrapper>
    ),
};

/**
 * Shows different file types in a single view.
 * Useful for visual regression testing.
 */
export const AllFileTypes: Story = {
    render: () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, p: 2 }}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>PDF Document</Typography>
                <MetadataEditor file={createMockFile()} autoSaveDelay={2000} />
            </Paper>

            <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>AI-Generated Image</Typography>
                <MetadataEditor 
                    file={createMockFile({
                        name: 'garden.png',
                        mimeType: 'image/png',
                        model: 'dall-e-3',
                        variant: 'hd',
                    })}
                    autoSaveDelay={2000}
                />
            </Paper>

            <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>Minimal Data</Typography>
                <MetadataEditor 
                    file={createMockFile({
                        name: 'simple.txt',
                        description: '',
                        prompt: '',
                        model: '',
                        variant: '',
                    })}
                    autoSaveDelay={2000}
                />
            </Paper>
        </Box>
    ),
};

/**
 * Interactive playground to test all features.
 */
export const Playground: Story = {
    args: {
        file: createMockFile(),
        autoSaveDelay: 2000,
    },
    render: (args: any) => (
        <StoryWrapper
            title="Interactive Playground"
            description="Try editing the name and description fields, using Cmd+Z/Cmd+Shift+Z for undo/redo, and testing auto-save. Use the controls below to adjust auto-save delay."
        >
            <MetadataEditor {...args} />
        </StoryWrapper>
    ),
};

/**
 * Character limit testing - shows behavior near limits.
 */
export const NearCharacterLimits: Story = {
    args: {
        file: createMockFile({
            name: 'a'.repeat(240) + '.pdf', // 244 chars (near 255 limit)
            description: 'a'.repeat(950), // Near 1000 char limit
            prompt: 'a'.repeat(1900), // Shown as read-only
            model: 'gpt-4-turbo-preview-with-long-name', // Shown as read-only
            variant: 'ultra-hd-premium-quality-v2', // Shown as read-only
        }),
    },
    render: (args: any) => (
        <StoryWrapper
            title="Near Character Limits"
            description="Name and description fields are near their character limits. Character counters show warning colors. AI metadata is read-only."
        >
            <MetadataEditor {...args} />
        </StoryWrapper>
    ),
};
