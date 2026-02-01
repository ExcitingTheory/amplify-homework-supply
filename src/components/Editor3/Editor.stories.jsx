import React from 'react';
import { within, waitFor, screen, waitForElementToBeRemoved } from 'storybook/test';
import Editor, { Workbook } from './index';
import CodeActionMenuPlugin from './plugins/CodeActionMenuPlugin';
import { clearMockData, initializeMockData, seedMockUnit, seedMockFiles, seedMockWords, seedMockQuestions, seedMockQuestionUnits } from '../../../.storybook/__mocks__/aws-amplify-data';
const { MOCK_AUDIO_BASE64, mockWaveformData, MOCK_IMAGE_URL_1, MOCK_IMAGE_URL_2 } = await import('../../../.storybook/__mocks__/media');
const { 
  MOCK_JAPANESE_GRAMMAR_PDF, 
  MOCK_VOCABULARY_LIST_PDF, 
  MOCK_LESSON_PLAN_PDF 
} = await import('../../../.storybook/__mocks__/mockDocuments');

// Verify models are loading - this will show in console
import { Unit, Grade } from '../../models';
console.log('[Editor.stories] Model verification:');
console.log('[Editor.stories] Unit constructor:', typeof Unit);
console.log('[Editor.stories] Unit.name:', Unit?.name);
console.log('[Editor.stories] Unit.copyOf:', typeof Unit?.copyOf);
console.log('[Editor.stories] Grade constructor:', typeof Grade);
console.log('[Editor.stories] Grade.name:', Grade?.name);

// Mock unit ID for stories
const MOCK_UNIT_ID = 'story-unit-id';
const KITCHEN_SINK_ID = 'kitchen-sink-id';

export default {
  title: '📚 Creating Lessons/Editor',
  component: Editor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Lexical-based rich text editor with custom educational content nodes.

## Features
- **Rich Text Formatting**: Headings, lists, alignment, text styles
- **Educational Nodes**: Vocabulary, quizzes, custom questions, meaning association
- **Media Support**: Images, audio playlists, videos, YouTube embeds
- **Layout**: Multi-column layouts, tables
- **AI Integration**: File manager with text-to-image and text-to-speech generation

## Custom Nodes
- Word Block - Single vocabulary display
- Meaning Association - Interactive matching exercise
- Short Answer (Vocabulary) - Vocabulary practice with audio/text input
- Short Answer (Custom) - Custom prompts with flexible answer types
- Multiple Choice Quiz - Assessment with 2-4 options
- Audio Playlist - Multiple audio files with controls
- YouTube Embed - Embedded YouTube videos
- Layout Container - Multi-column responsive layouts

## Grading
The editor tracks graded blocks (quiz, answer, custom-answer, meaning-association) for automatic scoring. Student responses are stored in the Grade model with accuracy percentages.
        `.trim(),
      },
    },
  },
  tags: ['autodocs'],
};

const sampleEditorState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Welcome to the Language Editor',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h1',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'This is a sample paragraph. You can edit, format, and add various types of content here.',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
};

export const EmptyEditorTextFormatting = {
  loaders: [
    async () => {
      clearMockData();
      
      seedMockUnit({
        id: 'empty-editor-text-formatting-id',
        name: 'Empty Editor: Text Formatting',
        description: 'A blank editor to start creating content',
        data: null,
        _version: 1,
        owner: 'mock-user-sub',
      });
    },
  ],
  render: () => <Editor />,
  parameters: {
    unitId: 'empty-editor-text-formatting-id',
    initializeMockData: false,
  },
  play: async ({ canvas, userEvent }) => {
    // Wait for editor to load - get all textboxes and find the contenteditable editor
    const textboxes = await canvas.findAllByRole('textbox');
    const editorContent = textboxes.find(el => el.getAttribute('contenteditable') === 'true') || textboxes[0];
    await userEvent.click(editorContent);
    
    // Type heading 1 text
    await userEvent.keyboard('Heading 1');
    
    // Open Block Format dropdown and select H1
    const blockFormatSelect = canvas.getByRole('combobox', { name: /block format/i });
    await userEvent.click(blockFormatSelect);
    
    // Options render in portal, use screen to find them
    const h1Option = await screen.findByRole('option', { name: /Heading 1/i });
    await userEvent.click(h1Option);
    await userEvent.keyboard('{Enter}');
    
    // Type heading 2 text
    await userEvent.keyboard('Heading 2');
    
    // Open Block Format dropdown and select H2
    await userEvent.click(blockFormatSelect);
    const h2Option = await screen.findByRole('option', { name: /Heading 2/i });
    await userEvent.click(h2Option);
    await userEvent.keyboard('{Enter}');
    
    // Type heading 3 text
    await userEvent.keyboard('Heading 3');
    
    // Open Block Format dropdown and select H3
    await userEvent.click(blockFormatSelect);
    const h3Option = await screen.findByRole('option', { name: /Heading 3/i });
    await userEvent.click(h3Option);
    await userEvent.keyboard('{Enter}');

    // Add a bulleted list
    await userEvent.keyboard('{Enter}');
    await userEvent.click(blockFormatSelect);
    const bulletBtn = await screen.findByRole('option', { name: /Bulleted/i });
    await userEvent.click(bulletBtn);
    await userEvent.keyboard('First list item{Enter}Second list item{Enter}');
    // Multiple Align buttons may be rendered, so we select the first one
    const alignMenus = canvas.getAllByRole('button', { name: /Align/i });
    const alignMenu = alignMenus[0];
    await userEvent.click(alignMenu);
    const indentBtn = await screen.findByRole('menuitem', { name: /Indent/i });
    await userEvent.click(indentBtn);
    await userEvent.keyboard('Third list item{Enter}');
    await userEvent.click(alignMenu);
    const outdentBtn = await screen.findByRole('menuitem', { name: /Outdent/i });
    await userEvent.click(outdentBtn);
    await userEvent.keyboard('Another Item{Enter}{Enter}{Enter}');

    // Add a numbered list
    await userEvent.click(blockFormatSelect);
    const numberBtn = await screen.findByRole('option', { name: /Numbered/i });
    await userEvent.click(numberBtn);
    await userEvent.keyboard('First numbered item{Enter}');
    await userEvent.click(alignMenu);
    const indentBtn2 = await screen.findByRole('menuitem', { name: /Indent/i });
    await userEvent.click(indentBtn2);
    await userEvent.keyboard('Second numbered item{Enter}');
    await userEvent.click(alignMenu);
    const indentBtn3 = await screen.findByRole('menuitem', { name: /Indent/i });
    await userEvent.click(indentBtn3);
    await userEvent.keyboard('Third numbered item{Enter}{Enter}{Enter}');

    // Add a quote
    await userEvent.keyboard('{Enter}');
    await userEvent.click(blockFormatSelect);
    const quoteBtn = await screen.findByRole('option', { name: /Quote/i });
    await userEvent.click(quoteBtn);
    await userEvent.keyboard('This is an inspiring quote.{Enter}{Enter}');

    // Add code block
    await userEvent.click(blockFormatSelect);
    const codeBtn = await screen.findByRole('option', { name: /Code Block/i });
    await userEvent.click(codeBtn);
    await userEvent.keyboard('function example() {{{Enter}  console.log("Hello");{Enter}}{Enter}');
    // delete the two spaces at start of second line
    await userEvent.keyboard('{Backspace}{Backspace}');
    await userEvent.keyboard('{Enter}{Enter}{Enter}');
    // Add a paragraph
    await userEvent.keyboard('This is a sample paragraph added at the end.');
    
    // hit enter, click bold button, type bold text, click bold button again to toggle off
    await userEvent.keyboard('{Enter}');
    // Multiple Bold buttons may be rendered, so we select the first one
    const boldButtons = canvas.getAllByRole('button', { name: /Bold/i });
    const boldButton = boldButtons[0];
    await userEvent.click(boldButton);
    await userEvent.keyboard('This text is bold.');
    await userEvent.click(boldButton);

    // Italic text
    await userEvent.keyboard('{Enter}');
    // Multiple Italic buttons may be rendered, so we select the first one
    const italicButtons = canvas.getAllByRole('button', { name: /Italic/i });
    const italicButton = italicButtons[0];
    await userEvent.click(italicButton);
    await userEvent.keyboard('This text is italic.');
    await userEvent.click(italicButton);

    // Underlined text
    await userEvent.keyboard('{Enter}');
    // Multiple Underline buttons may be rendered, so we select the first one
    const underlineButtons = canvas.getAllByRole('button', { name: /Underline/i });
    const underlineButton = underlineButtons[0];
    await userEvent.click(underlineButton);
    await userEvent.keyboard('This text is underlined.');
    await userEvent.click(underlineButton);

    // this is bold and italic text and underline
    await userEvent.keyboard('{Enter}');
    await userEvent.click(boldButton);
    await userEvent.click(italicButton);
    await userEvent.click(underlineButton);
    await userEvent.keyboard('This text is bold, italic, and underlined.');
    await userEvent.click(boldButton);
    await userEvent.click(italicButton);
    await userEvent.click(underlineButton);

    // Strikethrough text
    await userEvent.keyboard('{Enter}');
    // open Text Format dropdown
    // Multiple text format buttons may be rendered, so we select the first one
    const textFormatSelects = canvas.getAllByRole('button', { name: /Formatting options for text styles/i });
    const textFormatSelect = textFormatSelects[0];
    await userEvent.click(textFormatSelect);
    let strikethroughOption = await screen.findByRole('menuitem', { name: /Strikethrough/i });
    await userEvent.click(strikethroughOption);
    await userEvent.keyboard('This text is strikethrough.');
    await userEvent.click(textFormatSelect);
    strikethroughOption = await screen.findByRole('menuitem', { name: /Strikethrough/i });
    await userEvent.click(strikethroughOption);

    // subscript text
    await userEvent.keyboard('{Space}');
    await userEvent.click(textFormatSelect);
    let subscriptOption = await screen.findByRole('menuitem', { name: /Subscript/i });
    await userEvent.click(subscriptOption);
    await userEvent.keyboard('This text is subscript. ');
    await userEvent.click(textFormatSelect);
    subscriptOption = await screen.findByRole('menuitem', { name: /Subscript/i });
    await userEvent.click(subscriptOption);
    
    // superscript text
    await userEvent.keyboard('{Space}');
    await userEvent.click(textFormatSelect);
    let superscriptOption = await screen.findByRole('menuitem', { name: /Superscript/i });
    await userEvent.click(superscriptOption);
    await userEvent.keyboard(' This text is superscript.');
    await userEvent.click(textFormatSelect);
    superscriptOption = await screen.findByRole('menuitem', { name: /Superscript/i });
    await userEvent.click(superscriptOption);

    // left align
    await userEvent.keyboard('{Enter}');
    await userEvent.click(alignMenu);
    const leftAlignBtn = await screen.findByRole('menuitem', { name: /Left Align/i });
    await userEvent.click(leftAlignBtn);
    await userEvent.keyboard('This text is left-aligned.{Enter}{Enter}');
    // center align
    await userEvent.click(alignMenu);
    const centerAlignBtn = await screen.findByRole('menuitem', { name: /Center Align/i });
    await userEvent.click(centerAlignBtn);
    await userEvent.keyboard('This text is center-aligned.{Enter}{Enter}');
    // right align
    await userEvent.click(alignMenu);
    const rightAlignBtn = await screen.findByRole('menuitem', { name: /Right Align/i });
    await userEvent.click(rightAlignBtn);
    await userEvent.keyboard('This text is right-aligned.{Enter}{Enter}');
    // justify align
    await userEvent.click(alignMenu);
    const justifyAlignBtn = await screen.findByRole('menuitem', { name: /Justify Align/i });
    await userEvent.click(justifyAlignBtn);
    await userEvent.keyboard('This text is justified. It will stretch across the full width of the container, creating even edges on both sides. This is particularly useful for formal documents or publications.{Enter}{Enter}');
  },
};

export const EmptyEditorCustomBlocks = {
  loaders: [
    async () => {
      clearMockData();
      
      seedMockUnit({
        id: 'empty-editor-custom-blocksid',
        name: 'Empty Editor: Custom Blocks',
        description: 'A blank editor to start creating content',
        data: JSON.stringify(sampleEditorState),
        _version: 1,
        owner: 'mock-user-sub',
      });
    },
  ],
  render: () => <Editor />,
  parameters: {
    unitId: 'empty-editor-custom-blocksid',
    initializeMockData: false,
  },
  play: async ({ canvas, userEvent }) => {
    // Wait for editor to load - get all textboxes and find the contenteditable editor
    const textboxes = await canvas.findAllByRole('textbox');
    const editorContent = textboxes.find(el => el.getAttribute('contenteditable') === 'true') || textboxes[0];
    await userEvent.click(editorContent);

    // Make a link by typing out the URL
    await userEvent.keyboard('{Enter}Check out https://example.com for more info.{Enter}{Enter}');

    // Make a link with selected text
    await userEvent.keyboard('Visit our website');
    // Select the text "website"
    await userEvent.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');
    // Multiple Insert link buttons may be rendered, so we select the first one
    const linkButtons = canvas.getAllByRole('button', { name: /Insert link/i });
    const linkButton = linkButtons[0];
    await userEvent.click(linkButton);
    // The floating link editor appears outside the canvas with title "Edit link"
    const editLinkBtn = await screen.findByRole('button', { name: 'Edit link' });
    await userEvent.click(editLinkBtn);
    // Find the URL input by title "Link URL" and type the new URL
    const linkUrlInput = await screen.findByTitle('Link URL');
    await userEvent.clear(linkUrlInput);
    await userEvent.type(linkUrlInput, 'https://example.com');
    // Confirm the link with title "Confirm link"
    const confirmLinkBtn = await screen.findByRole('button', { name: 'Confirm link' });
    await userEvent.click(confirmLinkBtn);

    // Close the link editor
    const closePreviewBtn = await screen.getByRole('button', { name: /Close link editor/i });
    await userEvent.click(closePreviewBtn);
    await userEvent.click(editorContent);
    await userEvent.keyboard('{ArrowDown} {Enter}');
    // Make a youtube embed link
    await userEvent.keyboard('Watch this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    // Select the URL to open the floating link editor
    await userEvent.keyboard('{Shift>}');
    for (let i = 0; i < 43; i++) {
      await userEvent.keyboard('{ArrowLeft}');
    }
    await userEvent.keyboard('{/Shift}');
    // Wait for floating link editor to appear and click YouTube Embed button
    const youtubeBtn = await screen.findByRole('button', { name: /YouTube Embed/i });
    await userEvent.click(youtubeBtn);
    // confirm youtube embed


    // Insert Due Date
    // Multiple Insert Item Menu buttons may be rendered, so we select the first one
    const insertMenus = canvas.getAllByRole('button', { name: /Insert Item Menu/i });
    const insertMenu = insertMenus[0];
    await userEvent.click(insertMenu);
    const dueDateOption = await screen.getByRole('menuitem', { name: /Due Date/i });
    await userEvent.click(dueDateOption);
    // Interact with due date dialog if needed
    const dueDateInput = await screen.getByRole('textbox', { name: /Set Unit Due Date/i });
    await userEvent.type(dueDateInput, '2026/01/01 10:00AM');
    // MUI Select renders multiple elements with role="combobox", so we select the first one
    const selectSections = canvas.getAllByRole('combobox', { name: /Select Section/i });
    const selectSection = selectSections[0];
    await userEvent.click(selectSection);
    // Select first option
    const firstSectionOption = await screen.getByRole('option', { name: /Section 1/i });
    await userEvent.click(firstSectionOption);
    // Confirm due date
    const confirmDueDateBtn = await screen.getByRole('button', { name: /^Add due date to Unit$/i });
    await userEvent.click(confirmDueDateBtn);
    
    // Insert Timer
    await userEvent.click(insertMenu);
    const timerOption = await screen.getByRole('menuitem', { name: /Timer/i });
    await userEvent.click(timerOption);
    // Set timer duration if dialog appears
    await userEvent.keyboard('{Enter}');

    // Insert Meaning Association
    await userEvent.click(insertMenu);
    const meaningAssocOption = await screen.getByRole('menuitem', { name: /Meaning Association/i });
    await userEvent.click(meaningAssocOption);
    await userEvent.keyboard('{Enter}');

    // Insert Short Answer: Vocabulary
    await userEvent.click(insertMenu);
    const vocabAnswerOption = await screen.getByRole('menuitem', { name: /Short Answer.*Vocabulary/i });
    await userEvent.click(vocabAnswerOption);
    await userEvent.keyboard('{Enter}');

    // Insert Short Answer: Custom
    await userEvent.click(insertMenu);
    const customAnswerOption = await screen.getByRole('menuitem', { name: /Short Answer.*Custom/i });
    await userEvent.click(customAnswerOption);
    await userEvent.keyboard('{Enter}');

    // Insert Audio Playlist
    await userEvent.click(insertMenu);
    const audioPlaylistOption = await screen.getByRole('menuitem', { name: /Audio Playlist/i });
    await userEvent.click(audioPlaylistOption);
    await userEvent.keyboard('{Enter}');

    // Insert Multiple Choice
    await userEvent.click(insertMenu);
    const multipleChoiceOption = await screen.getByRole('menuitem', { name: /Multiple Choice/i });
    await userEvent.click(multipleChoiceOption);
    await userEvent.keyboard('{Enter}');

    // Insert Layout
    await userEvent.click(insertMenu);
    const layoutOption = await screen.getByRole('menuitem', { name: /Layout/i });
    await userEvent.click(layoutOption);
    await userEvent.keyboard('{Enter}');

    // Insert Horizontal Rule
    await userEvent.click(insertMenu);
    const horizontalRuleOption = await screen.getByRole('menuitem', { name: /Horizontal Rule/i });
    await userEvent.click(horizontalRuleOption);
    await userEvent.keyboard('{Enter}');

    // Insert Table
    await userEvent.click(insertMenu);
    const tableOption = await screen.getByRole('menuitem', { name: /Table/i });
    await userEvent.click(tableOption);
    // Select table dimensions if dialog appears
    await userEvent.keyboard('{Enter}');

    // Use Filemanager to insert an image
    // Multiple File Manager buttons may be rendered, so we select the first one
    const fileManagerBtns = canvas.getAllByRole('button', { name: /File Manager/i });
    const fileManagerBtn = fileManagerBtns[0];
    await userEvent.click(fileManagerBtn);
    // Navigate file manager and select image
    const imageTab = await screen.getByRole('tab', { name: /Images/i });
    await userEvent.click(imageTab);
    const insertImageBtn = await screen.getByRole('button', { name: /Insert Image/i });
    await userEvent.click(insertImageBtn);
    await userEvent.keyboard('{Enter}');

    // Use Filemanager to insert audio file
    await userEvent.click(fileManagerBtn);
    const audioTab = await screen.getByRole('tab', { name: /Audio/i });
    await userEvent.click(audioTab);
    const insertAudioBtn = await screen.getByRole('button', { name: /Insert Audio/i });
    await userEvent.click(insertAudioBtn);
    await userEvent.keyboard('{Enter}');

    // Use Filemanager to generate image with AI
    await userEvent.click(fileManagerBtn);
    const generateImageTab = await screen.getByRole('tab', { name: /Generate.*Image/i });
    await userEvent.click(generateImageTab);
    const promptInput = await screen.findByPlaceholderText(/Describe the image/i);
    await userEvent.type(promptInput, 'A beautiful sunset over mountains');
    const generateBtn = await screen.getByRole('button', { name: /Generate/i });
    await userEvent.click(generateBtn);
    // Wait for generation and insert
    await userEvent.keyboard('{Enter}');

    // Use Filemanager to generate audio with AI
    await userEvent.click(fileManagerBtn);
    const generateAudioTab = await screen.getByRole('tab', { name: /Generate.*Audio/i });
    await userEvent.click(generateAudioTab);
    const audioPromptInput = await screen.findByPlaceholderText(/Enter text to speak/i);
    await userEvent.type(audioPromptInput, 'Welcome to this lesson');
    const generateAudioBtn = await screen.getByRole('button', { name: /Generate/i });
    await userEvent.click(generateAudioBtn);
    await userEvent.keyboard('{Enter}');

    // Use Sidebar to set Featured Image
    // Multiple Sidebar buttons may be rendered, so we select the first one
    const sidebarBtns = canvas.getAllByRole('button', { name: /Sidebar/i });
    const sidebarBtn = sidebarBtns[0];
    await userEvent.click(sidebarBtn);
    const featuredImageSection = await screen.findByText(/Featured Image/i);
    await userEvent.click(featuredImageSection);
    const setFeaturedBtn = await screen.getByRole('button', { name: /Set Featured Image/i });
    await userEvent.click(setFeaturedBtn);
    await userEvent.keyboard('{Enter}');

    // Open the content in preview
    // Multiple Preview buttons may be rendered, so we select the first one
    const previewBtns = canvas.getAllByRole('button', { name: /Preview/i });
    const previewBtn = previewBtns[0];
    await userEvent.click(previewBtn);
    // Wait for preview to load
    await screen.findByText(/Preview Mode/i);
    // Complete the unit exercise

  },
};

export const EditorWithContent = {
  loaders: [
    async () => {
      clearMockData();
      
      seedMockUnit({
        id: 'editor-with-content-id',
        name: 'Sample Unit with Content',
        description: 'This unit has some sample content',
        data: JSON.stringify(sampleEditorState),
        _version: 1,
        owner: 'mock-user-sub',
      });
    },
  ],
  render: () => <Editor />,
  parameters: {
    unitId: 'editor-with-content-id',
    initializeMockData: false,
  },
};

const kitchenSinkEditorState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 1,
            mode: 'normal',
            style: '',
            text: 'Kitchen Sink: All Editor Block Types',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h1',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'This editor demonstrates all available block types. Below you will find examples of every supported element.',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 1,
            mode: 'normal',
            style: '',
            text: 'Headings',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Heading Level 3',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h3',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Heading Level 4',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h4',
      },
      {
        children: [
          {
            detail: 0,
            format: 1,
            mode: 'normal',
            style: '',
            text: 'Text Formatting',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'This is ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 1,
            mode: 'normal',
            style: '',
            text: 'bold',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ', ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 2,
            mode: 'normal',
            style: '',
            text: 'italic',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ', ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 8,
            mode: 'normal',
            style: '',
            text: 'underline',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ', and ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 4,
            mode: 'normal',
            style: '',
            text: 'strikethrough',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ' text.',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'This paragraph contains a ',
            type: 'text',
            version: 1,
          },
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'link to example.com',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'link',
            version: 1,
            rel: null,
            target: null,
            title: null,
            url: 'https://example.com',
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ' and a ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 16,
            mode: 'normal',
            style: '',
            text: 'code snippet',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '.',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Text can have ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: 'color: rgb(224, 49, 49);',
            text: 'custom colors',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ', ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: 'background-color: rgb(255, 212, 0);',
            text: 'background colors',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ', ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: 'font-size: 24px;',
            text: 'different sizes',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ', and ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: 'font-family: Georgia;',
            text: 'custom fonts',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '.',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Advanced formatting includes ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 32,
            mode: 'normal',
            style: '',
            text: 'subscript',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ' and ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 64,
            mode: 'normal',
            style: '',
            text: 'superscript',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ' text.',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 1,
            mode: 'normal',
            style: '',
            text: 'Text Alignment',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'This text is left-aligned (default).',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: 'left',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'This text is center-aligned.',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: 'center',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'This text is right-aligned.',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: 'right',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'This text is justified. It will stretch across the full width of the container, creating even edges on both sides. This is particularly useful for formal documents or publications.',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: 'justify',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 1,
            mode: 'normal',
            style: '',
            text: 'Lists',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Numbered list item 1',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'listitem',
                version: 1,
                value: 1,
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Numbered list item 2',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'listitem',
                version: 1,
                value: 2,
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Numbered list item 3',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'listitem',
                version: 1,
                value: 3,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'list',
            version: 1,
            listType: 'number',
            start: 1,
            tag: 'ol',
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Bullet list item A',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'listitem',
                version: 1,
                value: 1,
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Bullet list item B',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'listitem',
                version: 1,
                value: 2,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'list',
            version: 1,
            listType: 'bullet',
            start: 1,
            tag: 'ul',
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 1,
            mode: 'normal',
            style: '',
            text: 'Quote Block',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'This is a quote block. It can contain multiple lines of quoted text or important callouts.',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'quote',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 1,
            mode: 'normal',
            style: '',
            text: 'Code Block',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      // {
      //   children: [
      //     {
      //       detail: 0,
      //       format: 0,
      //       mode: 'normal',
      //       style: '',
      //       text: 'function hello() {\n  console.log("Hello, World!");\n}',
      //       type: 'text',
      //       version: 1,
      //     },
      //   ],
      //   direction: 'ltr',
      //   format: '',
      //   indent: 0,
      //   type: 'code',
      //   version: 1,
      //   language: 'javascript',
      // },
      {
        type: 'horizontalrule',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 1,
            mode: 'normal',
            style: '',
            text: 'Custom Language Learning Blocks',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'YouTube Video Embed',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h3',
      },
      {
        type: 'youtube',
        version: 1,
        videoID: 'dQw4w9WgXcQ',
        format: '',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Word Block',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h3',
      },
      {
        type: 'word-block',
        version: 1,
        wordID: 'word-1',
        format: '',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Meaning Association Exercise',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h3',
      },
      {
        type: 'meaning-association',
        version: 1,
        wordIDs: ['word-1', 'word-2', 'word-3', 'word-4'],
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Short Answer: Vocabulary',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h3',
      },
      {
        type: 'answer',
        version: 1,
        wordIDs: ['word-5', 'word-6'],
        requestDefinition: 'translation',
        allowedInput: {
          text: true,
          audio: true,
        },
        promptMethod: ['phrase'],
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Short Answer: Custom',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h3',
      },
      {
        type: 'custom-answer',
        version: 1,
        data: {
          prompt: 'Describe your learning experience',
          wordIDs: ['word-1', 'word-2'],
          questionIDs: ['question-custom-1'],
        },
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Multiple Choice Quiz',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h3',
      },
      {
        type: 'quiz',
        version: 1,
        data: [
          {
            id: 'quiz-question-1',
            answer: 'Paris',
            correct: true,
          },
          {
            id: 'quiz-question-2', 
            answer: 'London',
            correct: false,
          },
          {
            id: 'quiz-question-3',
            answer: 'Berlin', 
            correct: false,
          },
          {
            id: 'quiz-question-4',
            answer: 'Madrid',
            correct: false,
          },
        ],
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Audio Playlist',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h3',
      },
      {
        type: 'playlist',
        version: 1,
        fileIDs: ['audio-1', 'audio-2', 'audio-3'],
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Image Node',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h3',
      },
      {
        type: 'image',
        version: 1,
        src: MOCK_IMAGE_URL_1,
        altText: 'Sample image - piano',
        width: 400,
        height: 300,
        maxWidth: 500,
        showCaption: false,
        caption: {
          editorState: {
            root: {
              children: [],
              direction: null,
              format: '',
              indent: 0,
              type: 'root',
              version: 1,
            },
          },
        },
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Layout Container',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h3',
      },
      {
        type: 'layout-container',
        version: 1,
        templateColumns: '1fr 1fr',
        children: [
          {
            type: 'layout-item',
            version: 1,
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Left column content',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
            ],
          },
          {
            type: 'layout-item',
            version: 1,
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Right column content',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
            ],
          },
        ],
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Table',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h3',
      },
      {
        type: 'table',
        version: 1,
        children: [
          {
            type: 'tablerow',
            version: 1,
            children: [
              {
                type: 'tablecell',
                version: 1,
                headerState: 1,
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 1,
                        mode: 'normal',
                        style: '',
                        text: 'Header 1',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                  },
                ],
              },
              {
                type: 'tablecell',
                version: 1,
                headerState: 1,
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 1,
                        mode: 'normal',
                        style: '',
                        text: 'Header 2',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                  },
                ],
              },
            ],
          },
          {
            type: 'tablerow',
            version: 1,
            children: [
              {
                type: 'tablecell',
                version: 1,
                headerState: 0,
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'Cell 1',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                  },
                ],
              },
              {
                type: 'tablecell',
                version: 1,
                headerState: 0,
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'Cell 2',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
};


const mockFiles = [
  {
    id: 'file-1',
    name: 'sample-audio.mp3',
    path: MOCK_AUDIO_BASE64,
    mimeType: 'audio/mpeg',
    size: 2458000,
    identityId: 'us-east-1:abc-123',
    level: 'PROTECTED',
    waveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'file-2',
    name: 'vocabulary-image.jpeg',
    path: MOCK_IMAGE_URL_2,
    mimeType: 'image/jpeg',
    size: 125000,
    identityId: 'us-east-1:abc-123',
    level: 'PROTECTED',
  },
  {
    id: 'file-3',
    name: 'lesson-recording.mp3',
    path: MOCK_AUDIO_BASE64,
    mimeType: 'audio/mpeg',
    size: 4856000,
    identityId: 'us-east-1:abc-123',
    level: 'PROTECTED',
    waveformData: JSON.stringify(mockWaveformData.slice(50, 250)),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'file-4',
    name: 'diagram.jpeg',
    path: MOCK_IMAGE_URL_1,
    mimeType: 'image/jpeg',
    size: 340000,
    identityId: 'us-east-1:abc-123',
    level: 'PROTECTED',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'file-5',
    name: 'pronunciation-guide.mp3',
    path:MOCK_AUDIO_BASE64,
    mimeType: 'audio/mpeg',
    size: 1234000,
    identityId: 'us-east-1:abc-123',
    level: 'PROTECTED',
    waveformData: JSON.stringify(mockWaveformData.slice(300, 400)),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'file-6',
    name: 'japanese-grammar-guide.pdf',
    path: MOCK_JAPANESE_GRAMMAR_PDF,
    mimeType: 'application/pdf',
    size: 2458000,
    identityId: 'us-east-1:abc-123',
    level: 'PROTECTED',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  {
    id: 'file-7',
    name: 'vocabulary-list-chapter-1.pdf',
    path: MOCK_VOCABULARY_LIST_PDF,
    mimeType: 'application/pdf',
    size: 458000,
    identityId: 'us-east-1:abc-123',
    level: 'PROTECTED',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: 'file-8',
    name: 'lesson-plan.pdf',
    path: MOCK_LESSON_PLAN_PDF,
    mimeType: 'application/pdf',
    size: 1234000,
    identityId: 'us-east-1:abc-123',
    level: 'PROTECTED',
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  },
];

export const KitchenSink = {
  loaders: [
    async () => {

      clearMockData();
      
      // Seed the kitchen sink lesson unit

      seedMockFiles(mockFiles);
      
      // Create mock words for the word blocks
      seedMockWords([
        {
          id: 'word-1',
          phrase: '勉強',
          definition: 'to study; studying',
          pronunciation: 'べんきょう',
          partOfSpeech: 'noun/verb',
          context: 'education',
          level: 'beginner',
          audio: [MOCK_AUDIO_BASE64],
          waveformData: JSON.stringify(mockWaveformData.slice(0, 150)),
          owner: 'mock-user-sub',
          identityId: 'us-east-1:abc-123',
        },
        {
          id: 'word-2',
          phrase: '学校',
          definition: 'school',
          pronunciation: 'がっこう',
          partOfSpeech: 'noun',
          context: 'education',
          level: 'beginner',
          audio: [MOCK_AUDIO_BASE64],
          waveformData: JSON.stringify(mockWaveformData.slice(50, 200)),
          owner: 'mock-user-sub',
          identityId: 'us-east-1:abc-123',
        },
        {
          id: 'word-3',
          phrase: '先生',
          definition: 'teacher',
          pronunciation: 'せんせい',
          partOfSpeech: 'noun',
          context: 'education',
          level: 'beginner',
          owner: 'mock-user-sub',
          identityId: 'us-east-1:abc-123',
        },
        {
          id: 'word-4',
          phrase: '図書館',
          definition: 'library',
          pronunciation: 'としょかん',
          partOfSpeech: 'noun',
          context: 'education',
          level: 'intermediate',
          owner: 'mock-user-sub',
          identityId: 'us-east-1:abc-123',
        },
        {
          id: 'word-5',
          phrase: 'bonjour',
          definition: 'hello, good morning',
          pronunciation: 'bon-ZHOOR',
          partOfSpeech: 'interjection',
          context: 'greetings',
          level: 'beginner',
          audio: [MOCK_AUDIO_BASE64],
          waveformData: JSON.stringify(mockWaveformData.slice(300, 400)),
          owner: 'mock-user-sub',
          identityId: 'us-east-1:abc-123',
        },
        {
          id: 'word-6',
          phrase: 'au revoir',
          definition: 'goodbye',
          pronunciation: 'oh ruh-VWAR',
          partOfSpeech: 'interjection',
          context: 'greetings',
          level: 'beginner',
          owner: 'mock-user-sub',
          identityId: 'us-east-1:abc-123',
        },
      ]);
      
      // Seed mock questions for quiz and custom answer blocks
      seedMockQuestions([
        {
          id: 'quiz-question-1',
          prompt: 'What is the capital of France?',
          answer: 'Paris',
          hint: 'Known as the City of Light',
          audio: [MOCK_AUDIO_BASE64],
          audioWaveformData: JSON.stringify(mockWaveformData.slice(0, 100)),
          answerAudio: [MOCK_AUDIO_BASE64],
          answerAudioWaveformData: JSON.stringify(mockWaveformData.slice(100, 200)),
          owner: 'mock-user-sub',
        },
        {
          id: 'quiz-question-2',
          prompt: 'What is the capital of France?', 
          answer: 'London',
          hint: 'This is incorrect - not the capital of France',
          audio: [MOCK_AUDIO_BASE64],
          audioWaveformData: JSON.stringify(mockWaveformData.slice(50, 150)),
          owner: 'mock-user-sub',
        },
        {
          id: 'quiz-question-3',
          prompt: 'What is the capital of France?',
          answer: 'Berlin', 
          hint: 'This is incorrect - this is Germany\'s capital',
          audio: [MOCK_AUDIO_BASE64],
          audioWaveformData: JSON.stringify(mockWaveformData.slice(75, 175)),
          owner: 'mock-user-sub',
        },
        {
          id: 'quiz-question-4',
          prompt: 'What is the capital of France?',
          answer: 'Madrid',
          hint: 'This is incorrect - this is Spain\'s capital', 
          audio: [MOCK_AUDIO_BASE64],
          audioWaveformData: JSON.stringify(mockWaveformData.slice(125, 225)),
          owner: 'mock-user-sub',
        },
        {
          id: 'question-custom-1',
          prompt: 'Describe your learning experience with Japanese vocabulary',
          answer: 'Sample answer about learning Japanese words and their meanings',
          hint: 'Think about how studying vocabulary has helped you',
          audio: [MOCK_AUDIO_BASE64],
          audioWaveformData: JSON.stringify(mockWaveformData.slice(200, 300)),
          answerAudio: [MOCK_AUDIO_BASE64],
          answerAudioWaveformData: JSON.stringify(mockWaveformData.slice(300, 400)),
          owner: 'mock-user-sub',
        },
      ]);
      
      // Create QuestionUnit relationships
      seedMockQuestionUnits([
        { questionId: 'quiz-question-1', unitId: KITCHEN_SINK_ID },
        { questionId: 'quiz-question-2', unitId: KITCHEN_SINK_ID },
        { questionId: 'quiz-question-3', unitId: KITCHEN_SINK_ID },
        { questionId: 'quiz-question-4', unitId: KITCHEN_SINK_ID },
        { questionId: 'question-custom-1', unitId: KITCHEN_SINK_ID },
      ]);
      
      // Seed the mock DataStore with kitchen sink data
      seedMockUnit({
        id: KITCHEN_SINK_ID,
        name: 'Kitchen Sink - All Editor Blocks',
        description: 'Comprehensive example showing all available editor block types',
        data: JSON.stringify(kitchenSinkEditorState),
        _version: 1,
        wordIDs: ['word-1', 'word-2', 'word-3', 'word-4', 'word-5', 'word-6'],
        fileIDs: ['audio-1', 'audio-2', 'audio-3'],
        questionIDs: ['quiz-question-1', 'quiz-question-2', 'quiz-question-3', 'quiz-question-4', 'question-custom-1'],
        owner: 'mock-user-sub',
      });
    },
  ],
  render: () => <Editor />,
  parameters: {
    unitId: KITCHEN_SINK_ID,
    initializeMockData: false, // Story provides its own complete mock data
  },
};

/**
 * Test all keyboard shortcuts (17 total)
 * 
 * Tests the following shortcuts:
 * - Text Formatting (5): Bold, Italic, Underline, Strikethrough, Clear
 * - Block Types (6): H1, H2, H3, Paragraph, Quote, Code Block
 * - Lists (2): Bullet, Numbered
 * - Alignment (4): Left, Center, Right, Justify
 */
export const KeyboardShortcutsTest = {
  loaders: [
    async () => {
      clearMockData();
      
      seedMockUnit({
        id: 'keyboard-shortcuts-test-id',
        name: 'Keyboard Shortcuts Test',
        description: 'Testing all keyboard shortcuts',
        data: null,
        _version: 1,
        owner: 'mock-user-sub',
      });
    },
  ],
  render: () => <Editor />,
  parameters: {
    unitId: 'keyboard-shortcuts-test-id',
    initializeMockData: false,
  },
  play: async ({ canvas, canvasElement }) => {
    // Note: Interactive tests disabled - @storybook/test not installed
    // TODO: Install @storybook/test and re-enable keyboard shortcut tests
    return;
    
    // Wait for editor to load - get all textboxes and find the contenteditable editor
    const textboxes = await canvas.findAllByRole('textbox');
    const editorContent = textboxes.find(el => el.getAttribute('contenteditable') === 'true') || textboxes[0];
    await userEvent.click(editorContent);
    
    // ========== TEXT FORMATTING SHORTCUTS ==========
    
    // Test Bold (Cmd+B / Ctrl+B)
    await userEvent.keyboard('Bold text');
    await userEvent.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');
    await userEvent.keyboard('{Meta>}b{/Meta}');
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{Enter}');
    
    // Test Italic (Cmd+I / Ctrl+I)
    await userEvent.keyboard('Italic text');
    await userEvent.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');
    await userEvent.keyboard('{Meta>}i{/Meta}');
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{Enter}');
    
    // Test Underline (Cmd+U / Ctrl+U)
    await userEvent.keyboard('Underline text');
    await userEvent.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');
    await userEvent.keyboard('{Meta>}u{/Meta}');
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{Enter}');
    
    // Test Strikethrough (Cmd+Shift+S / Ctrl+Shift+S)
    await userEvent.keyboard('Strikethrough text');
    await userEvent.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');
    await userEvent.keyboard('{Meta>}{Shift>}s{/Shift}{/Meta}');
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{Enter}');
    
    // Test Clear Formatting (Cmd+Shift+0 / Ctrl+Shift+0)
    await userEvent.keyboard('Text to clear');
    await userEvent.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');
    await userEvent.keyboard('{Meta>}b{/Meta}'); // Make it bold first
    await userEvent.keyboard('{Meta>}{Shift>}0{/Shift}{/Meta}'); // Clear formatting
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{Enter}');
    
    // ========== BLOCK TYPE SHORTCUTS ==========
    
    // Test Heading 1 (Cmd+Shift+1 / Ctrl+Shift+1)
    await userEvent.keyboard('{Enter}Heading 1');
    await userEvent.keyboard('{Meta>}{Shift>}1{/Shift}{/Meta}');
    await userEvent.keyboard('{Enter}');
    
    // Test Heading 2 (Cmd+Shift+2 / Ctrl+Shift+2)
    await userEvent.keyboard('Heading 2');
    await userEvent.keyboard('{Meta>}{Shift>}2{/Shift}{/Meta}');
    await userEvent.keyboard('{Enter}');
    
    // Test Heading 3 (Cmd+Shift+3 / Ctrl+Shift+3)
    await userEvent.keyboard('Heading 3');
    await userEvent.keyboard('{Meta>}{Shift>}3{/Shift}{/Meta}');
    await userEvent.keyboard('{Enter}');
    
    // Test Quote (Cmd+' / Ctrl+')
    await userEvent.keyboard('This is a quote');
    await userEvent.keyboard("{Meta>}'{/Meta}");
    await userEvent.keyboard('{Enter}');
    
    // Test Code Block (Cmd+Shift+C / Ctrl+Shift+C)
    await userEvent.keyboard('const code = true;');
    await userEvent.keyboard('{Meta>}{Shift>}c{/Shift}{/Meta}');
    await userEvent.keyboard('{Enter}{Enter}');
    
    // ========== LIST SHORTCUTS ==========
    
    // Test Bullet List (Cmd+Shift+8 / Ctrl+Shift+8)
    await userEvent.keyboard('Bullet item');
    await userEvent.keyboard('{Meta>}{Shift>}8{/Shift}{/Meta}');
    await userEvent.keyboard('{Enter}Second bullet{Enter}{Enter}');
    
    // Test Numbered List (Cmd+Shift+7 / Ctrl+Shift+7)
    await userEvent.keyboard('Numbered item');
    await userEvent.keyboard('{Meta>}{Shift>}7{/Shift}{/Meta}');
    await userEvent.keyboard('{Enter}Second number{Enter}{Enter}');
    
    // ========== ALIGNMENT SHORTCUTS ==========
    
    // Test Left Align (Cmd+Shift+L / Ctrl+Shift+L)
    await userEvent.keyboard('Left aligned text');
    await userEvent.keyboard('{Meta>}{Shift>}l{/Shift}{/Meta}');
    await userEvent.keyboard('{Enter}');
    
    // Test Center Align (Cmd+Shift+E / Ctrl+Shift+E)
    await userEvent.keyboard('Center aligned text');
    await userEvent.keyboard('{Meta>}{Shift>}e{/Shift}{/Meta}');
    await userEvent.keyboard('{Enter}');
    
    // Test Right Align (Cmd+Shift+R / Ctrl+Shift+R)
    await userEvent.keyboard('Right aligned text');
    await userEvent.keyboard('{Meta>}{Shift>}r{/Shift}{/Meta}');
    await userEvent.keyboard('{Enter}');
    
    // Test Justify Align (Cmd+Shift+J / Ctrl+Shift+J)
    await userEvent.keyboard('Justified text that should stretch across the full width of the editor');
    await userEvent.keyboard('{Meta>}{Shift>}j{/Shift}{/Meta}');
    
    // Final verification: scroll to top to see all results
    editorContent.scrollTop = 0;
  },
};

/**
 * Keyboard Shortcuts Demo - Automated Playthrough
 * 
 * Comprehensive demonstration of all available keyboard shortcuts.
 * This story uses the keyboard-shortcuts-script to automatically showcase:
 * - Text formatting (Bold, Italic, Underline, Strikethrough)
 * - Block types (Headings, Lists, Quotes, Code)
 * - Alignment (Left, Center, Right, Justify)
 * - Links (Insert/Edit)
 * - Undo/Redo
 * - Indentation (Tab/Shift+Tab)
 * - Markdown shortcuts (#, -, >, etc.)
 * - Selection shortcuts
 * - Clear formatting
 * 
 * See docs/KEYBOARD_SHORTCUTS.md for complete reference.
 */
export const KeyboardShortcutsDemo = {
  args: {},
  render: () => <Editor />,
  parameters: {
    unitId: 'keyboard-shortcuts-demo-id',
    initializeMockData: false,
    docs: {
      description: {
        story: `
**Automated Keyboard Shortcuts Demonstration**

This story runs through all available keyboard shortcuts automatically. Watch as the editor:

1. **Text Formatting** - Bold, Italic, Underline, Strikethrough
2. **Block Types** - Headings (H1-H3), Lists (Bullet/Numbered), Quotes, Code Blocks
3. **Alignment** - Left, Center, Right, Justify
4. **Links** - Insert and edit links
5. **Undo/Redo** - Revert and restore changes
6. **Indentation** - Tab and Shift+Tab for nesting
7. **Markdown** - Auto-conversion shortcuts
8. **Selection** - Select all and extend selection
9. **Clear Formatting** - Remove all formatting

**Try it yourself:**
- Click "Play" on this story to see the automation
- Then try the shortcuts in the Editor manually
- Reference **[Help → Keyboard Shortcuts](?path=/docs/help-keyboard-shortcuts--docs)** for the complete list
- View the original doc: [KEYBOARD_SHORTCUTS.md](../../../docs/KEYBOARD_SHORTCUTS.md)

**Platform Note:** Shortcuts shown use Mac notation (⌘ = Cmd). On Windows/Linux, use Ctrl instead.
        `.trim(),
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Import the keyboard shortcuts script
    const { createKeyboardShortcutsPlay } = await import('../../../.storybook/code/keyboard-shortcuts-script.ts');
    
    // Create and execute the play function
    const playFn = createKeyboardShortcutsPlay(['all']);
    await playFn({ canvasElement });
  },
};

/**
 * Keyboard Shortcuts - Text Formatting Only
 * 
 * Focused demo of text formatting shortcuts only.
 */
export const KeyboardShortcutsTextFormatting = {
  args: {},
  render: () => <Editor />,
  parameters: {
    unitId: 'keyboard-shortcuts-text-formatting-id',
    initializeMockData: false,
  },
  play: async ({ canvasElement }) => {
    const { createKeyboardShortcutsPlay } = await import('../../../.storybook/code/keyboard-shortcuts-script.ts');
    const playFn = createKeyboardShortcutsPlay(['textFormatting', 'clearFormatting']);
    await playFn({ canvasElement });
  },
};

/**
 * Keyboard Shortcuts - Block Types Only
 * 
 * Focused demo of block type shortcuts (headings, lists, quotes, code).
 */
export const KeyboardShortcutsBlockTypes = {
  args: {},
  render: () => <Editor />,
  parameters: {
    unitId: 'keyboard-shortcuts-block-types-id',
    initializeMockData: false,
  },
  play: async ({ canvasElement }) => {
    const { createKeyboardShortcutsPlay } = await import('../../../.storybook/code/keyboard-shortcuts-script.ts');
    const playFn = createKeyboardShortcutsPlay(['blockTypes', 'markdown']);
    await playFn({ canvasElement });
  },
};

/**
 * Keyboard Shortcuts - Alignment Only
 * 
 * Focused demo of text alignment shortcuts.
 */
export const KeyboardShortcutsAlignment = {
  args: {},
  render: () => <Editor />,
  parameters: {
    unitId: 'keyboard-shortcuts-alignment-id',
    initializeMockData: false,
  },
  play: async ({ canvasElement }) => {
    const { createKeyboardShortcutsPlay } = await import('../../../.storybook/code/keyboard-shortcuts-script.ts');
    const playFn = createKeyboardShortcutsPlay(['alignment']);
    await playFn({ canvasElement });
  },
};

