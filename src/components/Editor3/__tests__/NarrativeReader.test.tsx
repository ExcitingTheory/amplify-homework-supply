/**
 * NarrativeReader Tests
 *
 * Verifies the standalone read-only Lexical renderer mounts, loads
 * serialized content, and renders in read-only mode.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// --------------------------------------------------------------------------
// Mock Lexical and heavy dependencies so tests don't need a full browser DOM
// --------------------------------------------------------------------------

const mockSetEditorState = vi.fn()
const mockParseEditorState = vi.fn().mockReturnValue({ _nodeMap: new Map() })

vi.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: () => [
    {
      setEditorState: mockSetEditorState,
      parseEditorState: mockParseEditorState,
      registerUpdateListener: vi.fn(() => vi.fn()),
    },
  ],
}))

vi.mock('@lexical/react/LexicalComposer', () => ({
  LexicalComposer: ({ children }: any) => <div data-testid="lexical-composer">{children}</div>,
}))

vi.mock('@lexical/react/LexicalRichTextPlugin', () => ({
  RichTextPlugin: ({ contentEditable }: any) => (
    <div data-testid="rich-text-plugin">{contentEditable}</div>
  ),
}))

vi.mock('@lexical/react/LexicalContentEditable', () => ({
  ContentEditable: (props: any) => (
    <div data-testid="content-editable" aria-label={props['aria-label']} />
  ),
}))

vi.mock('@lexical/react/LexicalErrorBoundary', () => ({
  LexicalErrorBoundary: ({ children }: any) => <>{children}</>,
}))

// Stub out all plugins — they render nothing in test
// NOTE: vi.mock factories are hoisted, so we cannot reference variables declared outside
vi.mock('@lexical/react/LexicalCheckListPlugin', () => ({ CheckListPlugin: () => null }))
vi.mock('@lexical/react/LexicalClickableLinkPlugin', () => ({ ClickableLinkPlugin: () => null }))
vi.mock('@lexical/react/LexicalHashtagPlugin', () => ({ HashtagPlugin: () => null }))
vi.mock('@lexical/react/LexicalHorizontalRulePlugin', () => ({ HorizontalRulePlugin: () => null }))
vi.mock('@lexical/react/LexicalListPlugin', () => ({ ListPlugin: () => null }))
vi.mock('@lexical/react/LexicalTabIndentationPlugin', () => ({ TabIndentationPlugin: () => null }))
vi.mock('@lexical/react/LexicalTablePlugin', () => ({ TablePlugin: () => null }))
vi.mock('@lexical/react/LexicalMarkdownShortcutPlugin', () => ({ MarkdownShortcutPlugin: () => null }))

vi.mock('../plugins/YouTubePlugin', () => ({ default: () => null }))
vi.mock('../plugins/WordBlockPlugin', () => ({ default: () => null }))
vi.mock('../plugins/QuizPlugin', () => ({ default: () => null }))
vi.mock('../plugins/MeaningAssociationPlugin', () => ({ default: () => null }))
vi.mock('../plugins/PlaylistPlugin', () => ({ default: () => null }))
vi.mock('../plugins/PdfViewerPlugin', () => ({ default: () => null }))
vi.mock('../plugins/ImagesPlugin', () => ({ default: () => null }))
vi.mock('../plugins/AnswerPlugin', () => ({ default: () => null }))
vi.mock('../plugins/CustomAnswerPlugin', () => ({ default: () => null }))

vi.mock('../context/AudioPlayerContext', () => ({
  AudioPlayerProvider: ({ children }: any) => <>{children}</>,
}))
vi.mock('../context/SharedAutocompleteContext', () => ({
  AutocompleteProvider: ({ children }: any) => <>{children}</>,
}))
vi.mock('../../MeaningAssociationExercise/DndWrapper', () => ({
  DndWrapper: ({ children }: any) => <>{children}</>,
}))

vi.mock('../editorConfig', () => ({
  EditorNodes: [],
  ALL_TRANSFORMERS: [],
  onError: vi.fn(),
}))
vi.mock('../components/LanguageEditorTheme', () => ({ default: {} }))

// --------------------------------------------------------------------------
// Import after mocks
// --------------------------------------------------------------------------

import { NarrativeReader } from '../NarrativeReader'

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('NarrativeReader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mounts with the Lexical composer', () => {
    render(<NarrativeReader contentJson='{"root":{}}' />)
    expect(screen.getByTestId('lexical-composer')).toBeDefined()
  })

  it('renders the content editable with default aria-label', () => {
    render(<NarrativeReader contentJson='{"root":{}}' />)
    expect(screen.getByTestId('content-editable')).toBeDefined()
    expect(
      screen.getByTestId('content-editable').getAttribute('aria-label'),
    ).toBe('Narrative content')
  })

  it('passes custom aria-label', () => {
    render(
      <NarrativeReader
        contentJson='{"root":{}}'
        ariaLabel="Chapter 3 content"
      />,
    )
    expect(
      screen.getByTestId('content-editable').getAttribute('aria-label'),
    ).toBe('Chapter 3 content')
  })

  it('parses and sets editor state from contentJson', async () => {
    const json = JSON.stringify({ root: { children: [] } })
    render(<NarrativeReader contentJson={json} />)

    // NarrativeStatePlugin should call parseEditorState then setEditorState
    // queueMicrotask is async — wait a tick
    await new Promise((r) => setTimeout(r, 10))
    expect(mockParseEditorState).toHaveBeenCalledWith({ root: { children: [] } })
    expect(mockSetEditorState).toHaveBeenCalled()
  })

  it('handles invalid JSON gracefully', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<NarrativeReader contentJson="not valid json {" />)
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[NarrativeStatePlugin]'),
      expect.any(SyntaxError),
    )
    errorSpy.mockRestore()
  })

  it('renders rich text plugin', () => {
    render(<NarrativeReader contentJson='{"root":{}}' />)
    expect(screen.getByTestId('rich-text-plugin')).toBeDefined()
  })
})
