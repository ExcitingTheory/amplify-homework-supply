'use client'

/**
 * BlockInserterPlugin — Notion-style hover "+" button for block insertion.
 *
 * Appears on the left margin when the cursor is on an empty paragraph.
 * Clicking it opens a categorized block menu popup.
 *
 * @module MiniEditor/BlockInserterPlugin
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Box,
  IconButton,
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Popper,
  Fade,
  TextField,
  InputAdornment,
  Chip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import TextFieldsIcon from '@mui/icons-material/TextFields'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote'
import CodeIcon from '@mui/icons-material/Code'
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule'
import ImageIcon from '@mui/icons-material/Image'
import YouTubeIcon from '@mui/icons-material/YouTube'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import QuizIcon from '@mui/icons-material/Quiz'
import SpellcheckIcon from '@mui/icons-material/Spellcheck'
import EditNoteIcon from '@mui/icons-material/EditNote'
import PsychologyIcon from '@mui/icons-material/Psychology'
import ShieldIcon from '@mui/icons-material/Shield'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import ViewColumnIcon from '@mui/icons-material/ViewColumn'
import TitleIcon from '@mui/icons-material/Title'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getNodeByKey,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
  KEY_DOWN_COMMAND,
} from 'lexical'
import { $createHeadingNode } from '@lexical/rich-text'
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
} from '@lexical/list'
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import { mergeRegister } from '@lexical/utils'

import type { BlockDefinition, BlockCategory } from './types'

// ─── Block Definitions ────────────────────────────────────────────────────────

const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // Text blocks
  { type: 'heading1', label: 'Heading 1', description: 'Large section heading', icon: 'title', category: 'text', shortcut: '# ' },
  { type: 'heading2', label: 'Heading 2', description: 'Medium section heading', icon: 'title', category: 'text', shortcut: '## ' },
  { type: 'heading3', label: 'Heading 3', description: 'Small section heading', icon: 'title', category: 'text', shortcut: '### ' },
  { type: 'bulletList', label: 'Bullet List', description: 'Simple unordered list', icon: 'list', category: 'text', shortcut: '- ' },
  { type: 'numberedList', label: 'Numbered List', description: 'Ordered list with numbers', icon: 'numbered', category: 'text', shortcut: '1. ' },
  { type: 'checkList', label: 'Checklist', description: 'To-do list with checkboxes', icon: 'check', category: 'text' },
  { type: 'quote', label: 'Quote', description: 'Block quote for citations', icon: 'quote', category: 'text', shortcut: '> ' },
  { type: 'code', label: 'Code Block', description: 'Syntax-highlighted code', icon: 'code', category: 'text', shortcut: '```' },
  { type: 'divider', label: 'Divider', description: 'Horizontal rule separator', icon: 'divider', category: 'text', shortcut: '---' },

  // Media blocks
  { type: 'image', label: 'Image', description: 'Upload or paste an image', icon: 'image', category: 'media', needsConfig: true },
  { type: 'youtube', label: 'YouTube', description: 'Embed a YouTube video', icon: 'youtube', category: 'media', needsConfig: true },
  { type: 'playlist', label: 'Audio Playlist', description: 'Embed audio playlist', icon: 'music', category: 'media', needsConfig: true },
  { type: 'pdf', label: 'PDF Viewer', description: 'Embed a PDF document', icon: 'pdf', category: 'media', needsConfig: true },

  // Educational blocks
  { type: 'quiz', label: 'Quiz', description: 'Multiple choice or free response quiz', icon: 'quiz', category: 'educational', needsConfig: true },
  { type: 'answer', label: 'Vocabulary Answer', description: 'Fill-in vocabulary exercise', icon: 'spellcheck', category: 'educational', needsConfig: true },
  { type: 'customAnswer', label: 'Custom Answer', description: 'Custom prompt & validation', icon: 'editnote', category: 'educational', needsConfig: true },
  { type: 'meaningAssociation', label: 'Matching Exercise', description: 'Drag-and-drop matching', icon: 'psychology', category: 'educational', needsConfig: true },
  { type: 'armorEditor', label: 'Armor Editor', description: 'Interactive item builder', icon: 'shield', category: 'educational', needsConfig: true },

  // Layout & AI
  { type: 'layout', label: 'Columns', description: '2-column layout', icon: 'columns', category: 'layout' },
  { type: 'customAI', label: 'AI Block', description: 'Custom AI-powered content', icon: 'ai', category: 'layout', needsConfig: true },
]

const ICON_MAP: Record<string, React.ReactNode> = {
  title: <TitleIcon fontSize="small" />,
  list: <FormatListBulletedIcon fontSize="small" />,
  numbered: <FormatListNumberedIcon fontSize="small" />,
  check: <CheckBoxIcon fontSize="small" />,
  quote: <FormatQuoteIcon fontSize="small" />,
  code: <CodeIcon fontSize="small" />,
  divider: <HorizontalRuleIcon fontSize="small" />,
  image: <ImageIcon fontSize="small" />,
  youtube: <YouTubeIcon fontSize="small" />,
  music: <MusicNoteIcon fontSize="small" />,
  pdf: <PictureAsPdfIcon fontSize="small" />,
  quiz: <QuizIcon fontSize="small" />,
  spellcheck: <SpellcheckIcon fontSize="small" />,
  editnote: <EditNoteIcon fontSize="small" />,
  psychology: <PsychologyIcon fontSize="small" />,
  shield: <ShieldIcon fontSize="small" />,
  ai: <SmartToyIcon fontSize="small" />,
  columns: <ViewColumnIcon fontSize="small" />,
}

const CATEGORY_LABELS: Record<BlockCategory, string> = {
  text: 'Text',
  media: 'Media',
  educational: 'Educational',
  layout: 'Layout & AI',
  embed: 'Embeds',
}

// ─── Block Inserter Plugin ────────────────────────────────────────────────────

export interface BlockInserterPluginProps {
  /** DOM element the editor is rendered into (for positioning) */
  anchorElem?: HTMLElement
}

export default function BlockInserterPlugin({ anchorElem }: BlockInserterPluginProps) {
  const [editor] = useLexicalComposerContext()
  const [visible, setVisible] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const [filter, setFilter] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [buttonEl, setButtonEl] = useState<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const currentNodeKeyRef = useRef<string | null>(null)

  // Position the + button next to the current empty paragraph
  const updatePosition = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) {
        setVisible(false)
        return
      }

      const anchor = selection.anchor
      const node = anchor.getNode()

      // Root/shadow-root nodes cannot call getTopLevelElementOrThrow
      if ($isRootOrShadowRoot(node)) {
        setVisible(false)
        return
      }

      const topElement = node.getTopLevelElementOrThrow()
      const textContent = topElement.getTextContent()

      // Only show on empty paragraphs
      if (textContent.trim() !== '' || topElement.getType() !== 'paragraph') {
        setVisible(false)
        return
      }

      currentNodeKeyRef.current = topElement.getKey()

      // Get DOM element position
      const dom = editor.getElementByKey(topElement.getKey())
      if (!dom || !anchorElem) {
        setVisible(false)
        return
      }

      const editorRect = anchorElem.getBoundingClientRect()
      const domRect = dom.getBoundingClientRect()

      setPosition({
        top: domRect.top - editorRect.top,
        left: -36, // Position to the left of the editor content
      })
      setVisible(true)
    })
  }, [editor, anchorElem])

  // Listen for selection changes to show/hide the button
  useEffect(() => {
    if (!anchorElem) return

    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updatePosition()
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updatePosition()
        })
      }),
    )
  }, [editor, updatePosition, anchorElem])

  // Handle slash command (/) to open menu
  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        if (event.key === '/' && !menuOpen) {
          editor.getEditorState().read(() => {
            const selection = $getSelection()
            if (!$isRangeSelection(selection)) return
            const node = selection.anchor.getNode()
            const topElement = node.getTopLevelElementOrThrow()
            if (topElement.getTextContent().trim() === '' && topElement.getType() === 'paragraph') {
              event.preventDefault()
              setMenuOpen(true)
              setFilter('')
              setSelectedIndex(0)
            }
          })
        }
        return false
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor, menuOpen])

  // Filter blocks based on search
  const filteredBlocks = BLOCK_DEFINITIONS.filter(
    (b) =>
      b.label.toLowerCase().includes(filter.toLowerCase()) ||
      b.description.toLowerCase().includes(filter.toLowerCase()) ||
      b.category.toLowerCase().includes(filter.toLowerCase()),
  )

  // Group by category
  const groupedBlocks = filteredBlocks.reduce(
    (acc, block) => {
      if (!acc[block.category]) acc[block.category] = []
      acc[block.category].push(block)
      return acc
    },
    {} as Record<BlockCategory, BlockDefinition[]>,
  )

  // Insert a block
  const insertBlock = useCallback(
    (block: BlockDefinition) => {
      setMenuOpen(false)
      setFilter('')

      editor.update(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) return

        switch (block.type) {
          case 'heading1':
            const h1 = $createHeadingNode('h1')
            selection.insertNodes([h1])
            h1.selectEnd()
            break
          case 'heading2':
            const h2 = $createHeadingNode('h2')
            selection.insertNodes([h2])
            h2.selectEnd()
            break
          case 'heading3':
            const h3 = $createHeadingNode('h3')
            selection.insertNodes([h3])
            h3.selectEnd()
            break
          case 'bulletList':
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
            break
          case 'numberedList':
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
            break
          case 'checkList':
            editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
            break
          case 'divider':
            editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
            break
          default:
            // For blocks needing config (quiz, answer, etc.), dispatch their custom commands
            // These are handled by the respective plugins already loaded
            dispatchBlockCommand(editor, block.type)
            break
        }
      })
    },
    [editor],
  )

  // Handle keyboard navigation in menu
  const handleMenuKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        editor.focus()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, filteredBlocks.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredBlocks[selectedIndex]) {
          insertBlock(filteredBlocks[selectedIndex])
        }
        return
      }
    },
    [filteredBlocks, selectedIndex, insertBlock, editor],
  )

  if (!anchorElem) return null

  return createPortal(
    <>
      {/* Hover-reveal + button */}
      <Fade in={visible && !menuOpen}>
        <IconButton
          ref={setButtonEl}
          size="small"
          onClick={() => {
            setMenuOpen(true)
            setFilter('')
            setSelectedIndex(0)
          }}
          aria-label="Insert block"
          sx={{
            position: 'absolute',
            top: position.top,
            left: position.left,
            width: 28,
            height: 28,
            opacity: 0.4,
            transition: 'opacity 0.2s',
            '&:hover': { opacity: 1 },
            zIndex: 10,
          }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Fade>

      {/* Block menu popup */}
      <Popper
        open={menuOpen}
        anchorEl={buttonEl}
        placement="bottom-start"
        transition
        sx={{ zIndex: 1300 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={150}>
            <Paper
              ref={menuRef}
              elevation={8}
              sx={{
                width: 320,
                maxHeight: 400,
                overflow: 'auto',
                mt: 0.5,
              }}
              onKeyDown={handleMenuKeyDown}
            >
              {/* Search filter */}
              <Box sx={{ p: 1, pb: 0 }}>
                <TextField
                  size="small"
                  fullWidth
                  autoFocus
                  placeholder="Filter blocks..."
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value)
                    setSelectedIndex(0)
                  }}
                  onKeyDown={handleMenuKeyDown}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>

              {/* Categorized block list */}
              {Object.entries(groupedBlocks).map(([category, blocks]) => (
                <Box key={category}>
                  <Typography
                    variant="overline"
                    sx={{ px: 2, pt: 1, display: 'block', color: 'text.secondary' }}
                  >
                    {CATEGORY_LABELS[category as BlockCategory]}
                  </Typography>
                  <List dense disablePadding>
                    {blocks.map((block) => {
                      const globalIdx = filteredBlocks.indexOf(block)
                      return (
                        <ListItemButton
                          key={block.type}
                          selected={globalIdx === selectedIndex}
                          onClick={() => insertBlock(block)}
                          sx={{ py: 0.5 }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {ICON_MAP[block.icon] || <TextFieldsIcon fontSize="small" />}
                          </ListItemIcon>
                          <ListItemText
                            primary={block.label}
                            secondary={block.description}
                            primaryTypographyProps={{ variant: 'body2' }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                          {block.shortcut && (
                            <Chip
                              label={block.shortcut}
                              size="small"
                              variant="outlined"
                              sx={{ ml: 1, fontSize: '0.65rem', height: 20 }}
                            />
                          )}
                        </ListItemButton>
                      )
                    })}
                  </List>
                </Box>
              ))}

              {filteredBlocks.length === 0 && (
                <Typography variant="body2" sx={{ p: 2, color: 'text.secondary', textAlign: 'center' }}>
                  No blocks match &ldquo;{filter}&rdquo;
                </Typography>
              )}
            </Paper>
          </Fade>
        )}
      </Popper>
    </>,
    anchorElem,
  )
}

// ─── Dispatch block-specific insert commands ──────────────────────────────────

function dispatchBlockCommand(editor: any, blockType: string) {
  // These commands are registered by the respective plugins
  // The editor will handle them if the plugin is loaded
  switch (blockType) {
    case 'quote': {
      const { $createQuoteNode } = require('@lexical/rich-text')
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          const quote = $createQuoteNode()
          selection.insertNodes([quote])
          quote.selectEnd()
        }
      })
      break
    }
    case 'code': {
      const { $createCodeNode } = require('@lexical/code')
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          const code = $createCodeNode()
          selection.insertNodes([code])
          code.selectEnd()
        }
      })
      break
    }
    case 'image':
    case 'youtube':
    case 'playlist':
    case 'pdf':
    case 'quiz':
    case 'answer':
    case 'customAnswer':
    case 'meaningAssociation':
    case 'armorEditor':
    case 'customAI':
    case 'layout':
      // These blocks use commands registered by their respective plugins.
      // Dispatch a generic INSERT command that the plugin listens for.
      // If the plugin supports a configuration dialog, it will open one.
      editor.dispatchCommand(
        { type: `INSERT_${blockType.toUpperCase()}_COMMAND` },
        undefined,
      )
      break
  }
}
