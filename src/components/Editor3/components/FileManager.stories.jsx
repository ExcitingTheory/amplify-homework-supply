/**
 * @fileoverview Storybook stories for FileManager component
 * Demonstrates file upload, organization, search, and AI generation features
 * 
 * Note: All AWS services and utilities are mocked via webpack aliases in .storybook/main.js
 * See .storybook/__mocks__/ for mock implementations
 */

import React, { useState, useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HeadingNode } from '@lexical/rich-text';

import FileManager from './FileManager';
import { FilesProvider } from '../../../context/fileContext';
import { UnitProvider } from '../../../context/unitContext';
import PlaylistPlugin, { PlaylistNode } from '../plugins/PlaylistPlugin';
import ImagesPlugin from '../plugins/ImagesPlugin';
import { ImageNode } from '../components/ImageNode';
import { seedMockFiles } from '../../../../.storybook/__mocks__/aws-amplify-datastore';

export default {
  title: 'Components/FileManager',
  component: FileManager,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'File management system with drag-and-drop upload, AI generation, search, and organization features. All AWS services are mocked for safe testing.',
      },
    },
  },
  decorators: [
    (Story) => {
      // Add info banner about mocked services
      return (
        <>
          <div style={{
            backgroundColor: '#e3f2fd',
            padding: '0.75rem 1rem',
            borderBottom: '2px solid #2196f3',
            fontSize: '0.875rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#0d47a1'
          }}>
            <strong>📘 Demo Mode:</strong> AWS services (S3, DataStore, Auth) and AI generation (OpenAI) are mocked. 
            Try the AI generation features - they simulate API calls with realistic delays!
          </div>
          <Story />
        </>
      );
    }
  ],
};

const editorConfig = {
  namespace: 'FileManagerDemo',
  theme: {
    paragraph: 'editor-paragraph',
    heading: {
      h1: 'editor-heading-h1',
      h2: 'editor-heading-h2',
      h3: 'editor-heading-h3',
    },
  },
  onError: (error) => console.error(error),
  nodes: [HeadingNode, ImageNode, PlaylistNode],
};

// Store for tracking uploaded files across component instances
let uploadedFilesStore = [];
const fileUploadListeners = [];

// Helper to notify listeners of file uploads
const notifyFileUpload = (file) => {
  fileUploadListeners.forEach(listener => listener(file));
};

// Helper to subscribe to file uploads
const subscribeToFileUploads = (callback) => {
  fileUploadListeners.push(callback);
  return () => {
    const index = fileUploadListeners.indexOf(callback);
    if (index > -1) fileUploadListeners.splice(index, 1);
  };
};

// Mock files data
// Generate realistic waveform data for audio files
const generateWaveformData = (length = 100, variation = 'medium') => {
  const waveform = [];
  for (let i = 0; i < length; i++) {
    const base = Math.sin(i / 10) * 0.3 + 0.5; // Sine wave base
    const noise = variation === 'high' ? Math.random() * 0.4 : Math.random() * 0.2;
    waveform.push(Math.max(0.1, Math.min(1, base + noise)));
  }
  return JSON.stringify(waveform);
};

const mockFiles = [
  {
    id: 'file-1',
    name: 'sample-audio.mp3',
    path: 'protected/audio/sample-audio.mp3',
    mimeType: 'audio/mpeg',
    size: 2458000,
    identityId: 'us-east-1:abc-123',
    level: 'PROTECTED',
    waveformData: generateWaveformData(150, 'medium'),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'file-2',
    name: 'vocabulary-image.png',
    path: 'protected/images/vocabulary-image.png',
    mimeType: 'image/png',
    size: 125000,
    identityId: 'us-east-1:abc-123',
    level: 'PROTECTED',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'file-3',
    name: 'lesson-recording.mp3',
    path: 'protected/audio/lesson-recording.mp3',
    mimeType: 'audio/mpeg',
    size: 4856000,
    identityId: 'us-east-1:abc-123',
    level: 'PROTECTED',
    waveformData: generateWaveformData(200, 'high'),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'file-4',
    name: 'diagram.png',
    path: 'protected/images/diagram.png',
    mimeType: 'image/png',
    size: 340000,
    identityId: 'us-east-1:abc-123',
    level: 'PROTECTED',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'file-5',
    name: 'pronunciation-guide.mp3',
    path: 'protected/audio/pronunciation-guide.mp3',
    mimeType: 'audio/mpeg',
    size: 1234000,
    identityId: 'us-east-1:abc-123',
    level: 'PROTECTED',
    waveformData: generateWaveformData(100, 'medium'),
    createdAt: new Date().toISOString(),
  },
];

const mockSession = {
  identityId: 'us-east-1:abc-123',
  userId: 'user-123',
};

const mockUnit = {
  id: 'unit-1',
  title: 'Japanese Vocabulary Lesson 1',
  description: 'Introduction to basic Japanese greetings',
};

// Template with editor integration
const EditorTemplate = ({ files: initialFiles = mockFiles }) => {
  // Seed the mock DataStore with files on mount
  useEffect(() => {
    console.log('[FileManager.stories] Seeding mock files:', initialFiles.length);
    seedMockFiles(initialFiles);
  }, [initialFiles]);

  return (
    <FilesProvider>
      <UnitProvider value={{ unit: mockUnit }}>
        <LexicalComposer initialConfig={editorConfig}>
          <div style={{ 
            display: 'flex',
            height: '100vh',
            backgroundColor: '#f5f5f5'
          }}>
            {/* Editor Section */}
            <div style={{ 
              flex: 1,
              padding: '2rem',
              overflowY: 'auto'
            }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '2rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                minHeight: '600px'
              }}>
                <h2 style={{ marginTop: 0 }}>Content Editor</h2>
                <p style={{ color: '#666', marginBottom: '2rem' }}>
                  Click files in the File Manager to insert them into your content.
                </p>
                <RichTextPlugin
                  contentEditable={
                    <ContentEditable 
                      style={{
                        minHeight: '400px',
                        outline: 'none',
                        padding: '1rem',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px'
                      }}
                    />
                  }
                  placeholder={
                    <div style={{ 
                      position: 'absolute', 
                      top: '1rem', 
                      left: '1rem',
                      color: '#999',
                      pointerEvents: 'none'
                    }}>
                      Start typing or insert files from the File Manager...
                    </div>
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
                <PlaylistPlugin />
                <ImagesPlugin captionsEnabled={true} />
              </div>
            </div>

            {/* File Manager Section */}
            <div style={{ 
              width: '400px',
              borderLeft: '1px solid #e0e0e0',
              backgroundColor: 'white',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                padding: '1rem',
                borderBottom: '1px solid #e0e0e0',
                backgroundColor: '#fafafa'
              }}>
                <h3 style={{ margin: 0 }}>File Manager</h3>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#666' }}>
                  Upload, search, and manage your media files
                </p>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <FileManager />
              </div>
            </div>
          </div>
        </LexicalComposer>
      </UnitProvider>
    </FilesProvider>
  );
};

// Standalone template without editor
const StandaloneTemplate = ({ files: initialFiles = mockFiles }) => {
  // Seed the mock DataStore with files on mount
  useEffect(() => {
    console.log('[FileManager.stories] Seeding mock files:', initialFiles.length);
    seedMockFiles(initialFiles);
  }, [initialFiles]);

  return (
    <FilesProvider>
      <UnitProvider value={{ unit: mockUnit }}>
        <div style={{ 
          padding: '2rem',
          backgroundColor: '#f5f5f5',
          minHeight: '100vh'
        }}>
          <div style={{
            maxWidth: '500px',
            margin: '0 auto',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            height: 'calc(100vh - 4rem)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e0e0e0'
            }}>
              <h2 style={{ margin: 0 }}>File Manager</h2>
              <p style={{ margin: '0.5rem 0 0', color: '#666' }}>
                Standalone file management interface
              </p>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              <LexicalComposer initialConfig={editorConfig}>
                <FileManager />
              </LexicalComposer>
            </div>
          </div>
        </div>
      </UnitProvider>
    </FilesProvider>
  );
};

export const WithEditor = {
  render: () => <EditorTemplate />,
  parameters: {
    docs: {
      description: {
        story: 'FileManager integrated with the Lexical editor. Click on files to insert them into the editor content. Demonstrates drag-and-drop upload, file organization by type, and AI generation capabilities.',
      },
    },
  },
};

export const Standalone = {
  render: () => <StandaloneTemplate />,
  parameters: {
    docs: {
      description: {
        story: 'FileManager as a standalone component without editor integration. Shows file browsing, search, upload, and organization features. Try uploading files - they will appear in the list immediately.',
      },
    },
  },
};

export const EmptyState = {
  render: () => <StandaloneTemplate files={[]} />,
  parameters: {
    docs: {
      description: {
        story: 'FileManager with no files uploaded yet. Shows the empty state and upload options. Try dragging and dropping files or using the AI generation buttons to see them appear in the manager.',
      },
    },
  },
};

export const AudioOnly = {
  render: () => <EditorTemplate files={mockFiles.filter(f => f.mimeType.includes('audio'))} />,
  parameters: {
    docs: {
      description: {
        story: 'FileManager showing only audio files. Useful for audio-focused lessons or podcasts.',
      },
    },
  },
};

export const ImagesOnly = {
  render: () => <EditorTemplate files={mockFiles.filter(f => f.mimeType.includes('image'))} />,
  parameters: {
    docs: {
      description: {
        story: 'FileManager showing only image files. Perfect for visual content organization.',
      },
    },
  },
};

// Feature documentation
const FeatureShowcase = () => (
  <div style={{
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }}>
    <h1>FileManager Component</h1>
    
    <section style={{ marginBottom: '3rem' }}>
      <h2>📁 Core Features</h2>
      <ul>
        <li><strong>Drag & Drop Upload:</strong> Simply drag files into the manager to upload</li>
        <li><strong>File Organization:</strong> Automatically categorizes by type (Images, Audio, Other)</li>
        <li><strong>Search Functionality:</strong> Quickly find files by name</li>
        <li><strong>Tree View:</strong> Collapsible categories for better organization</li>
        <li><strong>File Preview:</strong> Thumbnails for images, icons for audio files</li>
        <li><strong>Editor Integration:</strong> Click to insert files directly into content</li>
      </ul>
    </section>

    <section style={{ marginBottom: '3rem' }}>
      <h2>🤖 AI Generation</h2>
      <p>Create content on-demand using AI:</p>
      <ul>
        <li><strong>Text-to-Image:</strong> Generate images from text descriptions using DALL-E 3</li>
        <li><strong>Text-to-Speech:</strong> Convert text to natural-sounding audio using OpenAI TTS</li>
        <li><strong>Live Preview:</strong> Preview generated content before saving</li>
        <li><strong>Automatic Storage:</strong> Generated files saved to S3 with proper organization</li>
      </ul>
    </section>

    <section style={{ marginBottom: '3rem' }}>
      <h2>📂 File Types Supported</h2>
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '1.5rem',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px'
      }}>
        <strong>Images:</strong> PNG, JPG, JPEG, GIF, SVG, WebP<br/>
        <strong>Audio:</strong> MP3, WAV, OGG, M4A<br/>
        <strong>Other:</strong> PDF, TXT, and more
      </div>
    </section>

    <section style={{ marginBottom: '3rem' }}>
      <h2>🧪 Storybook Mocks</h2>
      <div style={{
        backgroundColor: '#fff3cd',
        padding: '1rem',
        borderRadius: '8px',
        borderLeft: '4px solid #ffc107'
      }}>
        <strong>Interactive Demo Features:</strong>
        <ul style={{ marginTop: '0.5rem', marginBottom: 0 }}>
          <li>All AWS services are mocked for safe, offline testing</li>
          <li>AI generation simulates OpenAI API calls with ~1.5s delay</li>
          <li>Generated images return placeholder image data URLs</li>
          <li>Generated audio returns placeholder audio data URLs</li>
          <li>Try clicking "Generate" buttons to see the preview modal in action!</li>
        </ul>
      </div>
    </section>

    <section style={{ marginBottom: '3rem' }}>
      <h2>🎨 Try AI Generation</h2>
      <div style={{
        backgroundColor: '#e8f5e9',
        padding: '1rem',
        borderRadius: '8px',
        borderLeft: '4px solid #4caf50'
      }}>
        <strong>Test the AI Features:</strong>
        <ul style={{ marginTop: '0.5rem', marginBottom: 0 }}>
          <li><strong>Text-to-Image:</strong> Click the sparkle icon under "Images", enter a description like "a sunset over mountains", and click Generate</li>
          <li><strong>Text-to-Speech:</strong> Click the sparkle icon under "Audio", enter text like "Hello, how are you?", and click Generate</li>
          <li>Watch the preview modal show loading states and generated content</li>
          <li>The mocks simulate realistic API response times</li>
        </ul>
      </div>
    </section>

    <section style={{ marginBottom: '3rem' }}>
      <h2>📝 Demo Notes</h2>
      <div style={{
        backgroundColor: '#fff3cd',
        padding: '1rem',
        borderRadius: '8px',
        borderLeft: '4px solid #ffc107'
      }}>
        <strong>What's Mocked:</strong>
        <ul style={{ marginTop: '0.5rem', marginBottom: 0 }}>
          <li><code>aws-amplify/api</code> - GraphQL mutations return mock file paths</li>
          <li><code>aws-amplify/auth</code> - Returns mock identity and tokens</li>
          <li><code>getCachedUrl</code> - Returns data URLs for generated content</li>
          <li>File uploads would need DataStore mocking (not yet implemented)</li>
          <li>This demo focuses on the AI generation and UI features</li>
        </ul>
      </div>
    </section>

    <section style={{ marginBottom: '3rem' }}>
      <h2>Technical Implementation</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Feature</th>
            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Storage</td>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>AWS S3 with protected access level</td>
          </tr>
          <tr style={{ backgroundColor: '#fafafa' }}>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Database</td>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>AWS DataStore (File model)</td>
          </tr>
          <tr>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Audio Processing</td>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Waveform data calculated and stored</td>
          </tr>
          <tr style={{ backgroundColor: '#fafafa' }}>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Upload Progress</td>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Real-time progress callbacks</td>
          </tr>
          <tr>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Context</td>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Integrates with FilesContext and UnitContext</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section style={{ marginBottom: '3rem' }}>
      <h2>💡 Usage Tips</h2>
      <div style={{
        backgroundColor: '#e3f2fd',
        padding: '1rem',
        borderRadius: '8px',
        borderLeft: '4px solid #2196f3'
      }}>
        <strong>For Educators:</strong>
        <ul style={{ marginTop: '0.5rem', marginBottom: 0 }}>
          <li>Upload vocabulary audio files for pronunciation practice</li>
          <li>Generate custom images for visual learning aids</li>
          <li>Create text-to-speech files for accessibility</li>
          <li>Organize media by lesson or topic using file names</li>
          <li>Use search to quickly find specific resources</li>
        </ul>
      </div>
    </section>

    <section>
      <h2>🎯 Integration with Editor</h2>
      <p>When integrated with the Lexical editor:</p>
      <ul>
        <li>Images can be inserted with the <code>INSERT_IMAGE_COMMAND</code></li>
        <li>Audio files can be inserted with the <code>INSERT_PLAYLIST_COMMAND</code></li>
        <li>Files are automatically formatted based on type</li>
        <li>Supports captions for images</li>
        <li>Waveform visualization for audio files</li>
      </ul>
    </section>
  </div>
);

export const FeatureDocumentation = {
  render: () => <FeatureShowcase />,
  parameters: {
    docs: {
      description: {
        story: 'Complete feature documentation and usage guide for the FileManager component.',
      },
    },
  },
};
