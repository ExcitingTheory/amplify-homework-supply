/**
 * @fileoverview Storybook stories for FileManager component
 * Demonstrates file upload, organization, search, and AI generation features
 * 
 * Note: All AWS services and utilities are mocked via webpack aliases in .storybook/main.js
 * See .storybook/__mocks__/ for mock implementations
 */

import React, { useState, useEffect } from 'react';
import { userEvent, within, waitFor, expect } from 'storybook/test';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HeadingNode } from '@lexical/rich-text';

import FileManager from './FileManager';
import { FilesProvider } from '../../../context/fileContext';
import { SettingsProvider } from '../../../context/settingsContext';
import { UnitProvider } from '../../../context/unitContext';
import PlaylistPlugin, { PlaylistNode } from '../plugins/PlaylistPlugin';
import PdfViewerPlugin from '../plugins/PdfViewerPlugin';
import { PdfViewerNode } from './PdfViewerNode';
import ImagesPlugin from '../plugins/ImagesPlugin';
import { ImageNode } from '../components/ImageNode';
import { seedMockFiles, seedMockSettings } from '../../../../.storybook/__mocks__/aws-amplify-datastore';

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
  nodes: [HeadingNode, ImageNode, PlaylistNode, PdfViewerNode],
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
  {
    id: 'file-6',
    name: 'japanese-grammar-guide.pdf',
    path: 'protected/documents/japanese-grammar-guide.pdf',
    mimeType: 'application/pdf',
    size: 2458000,
    identityId: 'us-east-1:abc-123',
    level: 'PROTECTED',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  {
    id: 'file-7',
    name: 'vocabulary-list-chapter-1.pdf',
    path: 'protected/documents/vocabulary-list-chapter-1.pdf',
    mimeType: 'application/pdf',
    size: 458000,
    identityId: 'us-east-1:abc-123',
    level: 'PROTECTED',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: 'file-8',
    name: 'lesson-plan.pdf',
    path: 'protected/documents/lesson-plan.pdf',
    mimeType: 'application/pdf',
    size: 1234000,
    identityId: 'us-east-1:abc-123',
    level: 'PROTECTED',
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
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

const mockSettings = {
  id: 'settings-1',
  autoAnalyzeDocuments: true,
  documentAnalysisModel: 'gpt-4',
  editorTheme: 'auto',
  editorFontSize: 14,
  defaultAIModel: 'gpt-4',
  assistantVoice: 'shimmer',
  emailNotifications: true,
  webhookNotifications: false,
  language: 'en',
  timezone: 'America/New_York',
};

// Template with editor integration
const EditorTemplate = ({ files: initialFiles = mockFiles, settings = mockSettings, autoAnalyze = true }) => {
  // Seed the mock DataStore with files and settings on mount
  useEffect(() => {
    console.log('[FileManager.stories] Seeding mock files:', initialFiles.length);
    seedMockFiles(initialFiles);
    seedMockSettings({ ...settings, autoAnalyzeDocuments: autoAnalyze });
  }, [initialFiles, settings, autoAnalyze]);

  return (
    <SettingsProvider>
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
                  <PdfViewerPlugin />
                  <ImagesPlugin captionsEnabled={true} />
                </div>
              </div>

              {/* File Manager Section */}
              <div style={{ 
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
    </SettingsProvider>
  );
};

// Standalone template without editor
const StandaloneTemplate = ({ files: initialFiles = mockFiles, settings = mockSettings, autoAnalyze = true }) => {
  // Seed the mock DataStore with files and settings on mount
  useEffect(() => {
    console.log('[FileManager.stories] Seeding mock files:', initialFiles.length);
    seedMockFiles(initialFiles);
    seedMockSettings({ ...settings, autoAnalyzeDocuments: autoAnalyze });
  }, [initialFiles, settings, autoAnalyze]);

  return (
    <SettingsProvider>
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
    </SettingsProvider>
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for FileManager to load
    await waitFor(() => {
      return canvasElement.querySelector('[aria-label=\"Search\"]') !== null;
    }, { timeout: 3000 });

    // Test search functionality
    const searchInput = canvasElement.querySelector('input[type=\"text\"]');
    if (searchInput) {
      await userEvent.click(searchInput);
      await userEvent.keyboard('audio');
      
      // Click search button
      const searchButton = canvasElement.querySelector('[aria-label=\"Search\"]');
      if (searchButton) {
        await userEvent.click(searchButton);
        await waitFor(() => true, { timeout: 500 });
      }
      
      // Clear search
      await userEvent.clear(searchInput);
    }

    // Expand audio files category
    await waitFor(async () => {
      const audioCategory = Array.from(canvasElement.querySelectorAll('[role=\"treeitem\"]'))
        .find(el => el.textContent.includes('Audio'));
      
      if (audioCategory) {
        // Check if it's collapsed
        const isExpanded = audioCategory.getAttribute('aria-expanded') === 'true';
        if (!isExpanded) {
          await userEvent.click(audioCategory);
        }
        return true;
      }
      return false;
    }, { timeout: 2000, onTimeout: () => console.log('Audio category not found') });

    // Wait for files to appear
    await waitFor(() => true, { timeout: 500 });

    // Click on an audio file to insert it into editor
    await waitFor(async () => {
      const addButtons = canvasElement.querySelectorAll('[aria-label=\"Add\"], button[title*=\"insert\" i]');
      if (addButtons.length > 0) {
        // Click first add button
        await userEvent.click(addButtons[0]);
        
        // Verify it was added to editor
        await waitFor(() => {
          const editorContent = canvasElement.querySelector('[contenteditable=\"true\"]');
          return editorContent && editorContent.children.length > 0;
        }, { timeout: 1000 });
        
        return true;
      }
      return false;
    }, { timeout: 2000, onTimeout: () => console.log('Add buttons not found') });

    // Expand images category
    await waitFor(async () => {
      const imageCategory = Array.from(canvasElement.querySelectorAll('[role=\"treeitem\"]'))
        .find(el => el.textContent.includes('Image'));
      
      if (imageCategory) {
        const isExpanded = imageCategory.getAttribute('aria-expanded') === 'true';
        if (!isExpanded) {
          await userEvent.click(imageCategory);
        }
        return true;
      }
      return false;
    }, { timeout: 2000, onTimeout: () => console.log('Image category not found') });

    await waitFor(() => true, { timeout: 500 });

    // Click on an image file to insert it
    await waitFor(async () => {
      // Look for image add buttons
      const imageTreeItems = Array.from(canvasElement.querySelectorAll('[role=\"treeitem\"]'))
        .filter(el => el.querySelector('img'));
      
      if (imageTreeItems.length > 0) {
        const addButton = imageTreeItems[0].querySelector('button[aria-label=\"Add\"]');
        if (addButton) {
          await userEvent.click(addButton);
          return true;
        }
      }
      return false;
    }, { timeout: 2000, onTimeout: () => console.log('Image add button not found') });

    // Test AI generation buttons if present
    await waitFor(async () => {
      const generateButtons = Array.from(canvasElement.querySelectorAll('button'))
        .filter(btn => btn.textContent.includes('Generate') || btn.querySelector('[data-testid*=\"AutoAwesome\"]'));
      
      if (generateButtons.length > 0) {
        // Click first generate button
        await userEvent.click(generateButtons[0]);
        
        // Wait for modal/form to appear
        await waitFor(() => {
          const modal = canvasElement.querySelector('[role=\"dialog\"], [role=\"presentation\"]');
          return modal !== null;
        }, { timeout: 1000, onTimeout: () => console.log('Generate modal not found') });
        
        // Close modal by pressing Escape
        await userEvent.keyboard('{Escape}');
        
        return true;
      }
      return false;
    }, { timeout: 2000, onTimeout: () => console.log('Generate buttons not found') });

    // Scroll through the file list
    const fileList = canvasElement.querySelector('[role=\"tree\"]')?.parentElement;
    if (fileList) {
      fileList.scrollTop = 100;
      await waitFor(() => true, { timeout: 300 });
      fileList.scrollTop = 0;
    }
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

export const PDFsOnly = {
  render: () => <EditorTemplate files={mockFiles.filter(f => f.mimeType === 'application/pdf')} />,
  parameters: {
    docs: {
      description: {
        story: 'FileManager showing only PDF files. Try clicking the Analyze button to see PDF analysis in action (mocked).',
      },
    },
  },
};

export const WithAutoAnalyzeEnabled = {
  render: () => <EditorTemplate autoAnalyze={true} />,
  parameters: {
    docs: {
      description: {
        story: 'FileManager with auto-analyze PDFs enabled. When PDFs are uploaded, they are automatically analyzed.',
      },
    },
  },
};

export const WithAutoAnalyzeDisabled = {
  render: () => <EditorTemplate autoAnalyze={false} />,
  parameters: {
    docs: {
      description: {
        story: 'FileManager with auto-analyze PDFs disabled. PDFs can be manually analyzed using the Analyze button.',
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
