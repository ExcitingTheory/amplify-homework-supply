import React from 'react';
import { within, waitFor, screen } from 'storybook/test';
import Editor, { Workbook } from './index';
import CodeActionMenuPlugin from './plugins/CodeActionMenuPlugin';
import { seedMockUnit } from '../../../.storybook/__mocks__/aws-amplify-datastore';

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
  title: 'Editor/Editor',
  component: Editor,
  parameters: {
    layout: 'fullscreen',
  },
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

export const EmptyEditor = {
  loaders: [
    async () => {
      seedMockUnit({
        id: 'empty-editor-id',
        name: 'Empty Editor',
        description: 'A blank editor to start creating content',
        data: null,
        _version: 1,
        owner: 'mock-user-sub',
      });
    },
  ],
  render: () => <Editor />,
  parameters: {
    unitId: 'empty-editor-id',
  },
  play: async ({ canvas, userEvent }) => {
    // Wait for editor to load
    const editorContent = await canvas.findByRole('textbox');
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
    const alignMenu = canvas.getByRole('button', { name: /Align/i });
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
    const boldButton = await canvas.getByRole('button', { name: /Bold/i });
    await userEvent.click(boldButton);
    await userEvent.keyboard('This text is bold.');
    await userEvent.click(boldButton);

    // Italic text
    await userEvent.keyboard('{Enter}');
    const italicButton = await canvas.getByRole('button', { name: /Italic/i });
    await userEvent.click(italicButton);
    await userEvent.keyboard('This text is italic.');
    await userEvent.click(italicButton);

    // Underlined text
    await userEvent.keyboard('{Enter}');
    const underlineButton = await canvas.getByRole('button', { name: /Underline/i });
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
    const textFormatSelect = canvas.getByRole('button', { name: /Formatting options for text styles/i });
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

    // Make a link by typing out the URL
    // make a link with selected text
    // make a youtube embed link
    // Insert Due Date
    // Insert Timer
    // Insert Meaning Association
    // Insert Short Answer: Vocabulary
    // Insert Short Answer: Custom
    // Insert Audio Playlist
    // Insert Multiple Choice
    // Insert Layout
    // Insert Horizontal Rule
    // Insert Table

    // Use Filemanager to insert an image
    // Use Filemanager to insert audio file
    // Use Filemanager to generate image with AI
    // Use Filemanager to generate audio with AI
    // Use Sidebar to set Featured Image

    // Open the content in preview
    // Complete the unit exercise

  },
};

export const EditorWithContent = {
  loaders: [
    async () => {
      seedMockUnit({
        id: 'editor-with-content-id',
        name: 'Sample Unit with Content',
        description: 'This unit has some sample content',
        data: sampleEditorState,
        _version: 1,
        owner: 'mock-user-sub',
      });
    },
  ],
  render: () => <Editor />,
  parameters: {
    unitId: 'editor-with-content-id',
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
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'function hello() {\n  console.log("Hello, World!");\n}',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'code',
        version: 1,
        language: 'javascript',
      },
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
        wordID: 'sample-word-id',
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
          wordIDs: [],
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
            id: 'q1',
            type: 'multiple-choice',
            question: 'Select the correct translation',
            wordID: 'word-7',
          },
          {
            id: 'q2',
            type: 'true-false',
            question: 'Is this correct?',
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
        src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        altText: 'Sample image placeholder',
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

export const KitchenSink = {
  loaders: [
    async () => {
      // Seed the mock DataStore with kitchen sink data
      seedMockUnit({
        id: KITCHEN_SINK_ID,
        name: 'Kitchen Sink - All Editor Blocks',
        description: 'Comprehensive example showing all available editor block types',
        data: kitchenSinkEditorState,
        _version: 1,
        owner: 'mock-user-sub',
      });
    },
  ],
  render: () => <Editor />,
  parameters: {
    unitId: KITCHEN_SINK_ID,
  },
};

const dataPluginDemoState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'DataPlugin Demo',
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
            text: 'This editor content is loaded by the DataPlugin from the unit.data property in UnitContext.',
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
            text: 'How DataPlugin Works:',
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
                    text: 'Monitors unit.data from UnitContext',
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
                    text: 'Parses JSON editor state from unit.data',
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
                    text: 'Tracks unit._version to prevent unnecessary updates',
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
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Loads editor state when data changes',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'listitem',
                version: 1,
                value: 4,
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Preserves selection state via editorSelectionRef',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'listitem',
                version: 1,
                value: 5,
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
            text: 'Note:',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ' In production, this syncs with AWS DataStore. In Storybook, it loads from the MockUnitProvider.',
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

export const DataPluginDemo = {
  loaders: [
    async () => {
      seedMockUnit({
        id: 'data-plugin-demo-id',
        name: 'DataPlugin Synchronization Demo',
        description: 'Demonstrates how DataPlugin loads editor state from unit.data',
        data: dataPluginDemoState,
        _version: 1,
        owner: 'mock-user-sub',
      });
    },
  ],
  render: () => <Editor />,
  parameters: {
    unitId: 'data-plugin-demo-id',
  },
};
