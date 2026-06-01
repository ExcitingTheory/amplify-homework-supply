/**
 * FloatingToolbarPlugin — A draggable floating toolbar that is always visible
 * when the editor is focused.
 *
 * Positioned above the editor by default. Users can drag it via the grip handle
 * to reposition. Has rounded corners and a shadow, styled like the link editor.
 *
 * Fully configurable: consumers choose which formatting buttons, insert blocks,
 * and advanced formatting options are available via props.
 *
 * @module FloatingToolbarPlugin
 */

import * as React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
  type RangeSelection,
  type LexicalEditor,
} from 'lexical'
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
  $isAtNodeEnd,
} from '@lexical/selection'
import { mergeRegister } from '@lexical/utils'

import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Popover from '@mui/material/Popover'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'
import FormatBoldIcon from '@mui/icons-material/FormatBold'
import FormatItalicIcon from '@mui/icons-material/FormatItalic'
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined'
import FormatStrikethroughIcon from '@mui/icons-material/FormatStrikethrough'
import CodeIcon from '@mui/icons-material/Code'
import AddLinkIcon from '@mui/icons-material/AddLink'
import AddIcon from '@mui/icons-material/Add'
import QuizIcon from '@mui/icons-material/Quiz'
import FormatSizeIcon from '@mui/icons-material/FormatSize'
import FontDownloadIcon from '@mui/icons-material/FontDownload'
import AudiotrackIcon from '@mui/icons-material/Audiotrack'
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule'
import WordBlockIcon from '@mui/icons-material/FlipToFront'
import ViewColumnIcon from '@mui/icons-material/ViewColumn'
import FormatColorTextIcon from '@mui/icons-material/FormatColorText'
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill'
import SubscriptIcon from '@mui/icons-material/Subscript'
import SuperscriptIcon from '@mui/icons-material/Superscript'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'

import { INSERT_QUIZ_COMMAND } from './QuizPlugin'
import { INSERT_MEANING_ASSOCIATION_BLOCK_COMMAND } from './MeaningAssociationPlugin'
import { INSERT_ANSWER_BLOCK_COMMAND } from './AnswerPlugin'
import { INSERT_CUSTOM_ANSWER_BLOCK_COMMAND } from './CustomAnswerPlugin'
import { INSERT_WORD_BLOCK_COMMAND } from './WordBlockPlugin'
import { INSERT_PLAYLIST_COMMAND } from './PlaylistPlugin'
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode'
import { INSERT_LAYOUT_COMMAND } from './LayoutPlugin'
import ColorPicker from './ColorPicker'

import { sanitizeUrl } from '../utils/url'

// ============================================================================
// Types
// ============================================================================

/** Which text formatting buttons to show */
export type TextFormatOption =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'code'
  | 'subscript'
  | 'superscript'

/** Which advanced formatting options (font color, bg color) to show */
export type AdvancedFormatOption = 'fontColor' | 'backgroundColor'

/** Which insert block items to show in the + menu */
export type InsertBlockOption =
  | 'meaningAssociation'
  | 'wordBlock'
  | 'answerVocabulary'
  | 'answerCustom'
  | 'quiz'
  | 'playlist'
  | 'horizontalRule'

/** Which layout columns to offer */
export type LayoutOption = '1fr 1fr' | '1fr 3fr' | '1fr 1fr 1fr' | '1fr 2fr 1fr' | '1fr 1fr 1fr 1fr'

export interface FloatingToolbarConfig {
  /** Text format buttons to display. Default: all */
  textFormats?: TextFormatOption[]
  /** Show the link toggle button. Default: true */
  showLink?: boolean
  /** Advanced format options (font color, bg color). Default: [] */
  advancedFormats?: AdvancedFormatOption[]
  /** Insert block options to show in the + menu. Default: all */
  insertBlocks?: InsertBlockOption[]
  /** Layout options to show. Default: all. Pass empty to hide layout button. */
  layouts?: LayoutOption[]
}

export interface FloatingToolbarPluginProps {
  /** Optional anchor element to portal into. Defaults to editor root's parent. */
  anchorElem?: HTMLElement
  /** Configuration for which toolbar features to show */
  config?: FloatingToolbarConfig
}

// ============================================================================
// Constants
// ============================================================================

const ALL_TEXT_FORMATS: TextFormatOption[] = [
  'bold', 'italic', 'underline', 'strikethrough', 'code',
]

const ALL_INSERT_BLOCKS: InsertBlockOption[] = [
  'meaningAssociation', 'wordBlock', 'answerVocabulary', 'answerCustom',
  'quiz', 'playlist', 'horizontalRule',
]

const ALL_LAYOUTS: LayoutOption[] = [
  '1fr 1fr', '1fr 3fr', '1fr 1fr 1fr', '1fr 2fr 1fr', '1fr 1fr 1fr 1fr',
]

const LAYOUT_LABELS: Record<LayoutOption, string> = {
  '1fr 1fr': '2 columns (equal)',
  '1fr 3fr': '2 columns (25% - 75%)',
  '1fr 1fr 1fr': '3 columns (equal)',
  '1fr 2fr 1fr': '3 columns (25% - 50% - 25%)',
  '1fr 1fr 1fr 1fr': '4 columns (equal)',
}

// ============================================================================
// Helpers
// ============================================================================

function getSelectedNode(selection: RangeSelection) {
  const anchor = selection.anchor
  const focus = selection.focus
  const anchorNode = selection.anchor.getNode()
  const focusNode = selection.focus.getNode()
  if (anchorNode === focusNode) {
    return anchorNode
  }
  const isBackward = selection.isBackward()
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode
  } else {
    return $isAtNodeEnd(anchor) ? anchorNode : focusNode
  }
}

// ============================================================================
// FloatingToolbar Component
// ============================================================================

function FloatingToolbar({
  editor,
  anchorElem,
  config,
}: {
  editor: LexicalEditor
  anchorElem: HTMLElement
  config: Required<FloatingToolbarConfig>
}) {
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isCode, setIsCode] = useState(false)
  const [isSubscript, setIsSubscript] = useState(false)
  const [isSuperscript, setIsSuperscript] = useState(false)
  const [isLink, setIsLink] = useState(false)
  const [fontColor, setFontColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [insertAnchorEl, setInsertAnchorEl] = useState<null | HTMLElement>(null)
  const [layoutAnchorEl, setLayoutAnchorEl] = useState<null | HTMLElement>(null)
  const [colorAnchorEl, setColorAnchorEl] = useState<null | HTMLElement>(null)
  const [bgColorAnchorEl, setBgColorAnchorEl] = useState<null | HTMLElement>(null)
  const [isColorMode, setIsColorMode] = useState<'font' | 'bg' | null>(null)

  // Drag state
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const dragStart = useRef({ mouseX: 0, mouseY: 0, elemX: 0, elemY: 0 })

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    setIsBold(selection.hasFormat('bold'))
    setIsItalic(selection.hasFormat('italic'))
    setIsUnderline(selection.hasFormat('underline'))
    setIsStrikethrough(selection.hasFormat('strikethrough'))
    setIsCode(selection.hasFormat('code'))
    setIsSubscript(selection.hasFormat('subscript'))
    setIsSuperscript(selection.hasFormat('superscript'))

    const node = getSelectedNode(selection)
    const parent = node.getParent()
    setIsLink($isLinkNode(parent) || $isLinkNode(node))

    setFontColor($getSelectionStyleValueForProperty(selection, 'color', '#000000'))
    setBgColor($getSelectionStyleValueForProperty(selection, 'background-color', '#ffffff'))
  }, [])

  // Track editor focus state
  useEffect(() => {
    const rootElement = editor.getRootElement()
    if (!rootElement) return

    const onFocus = () => setIsFocused(true)
    const onBlur = (e: FocusEvent) => {
      // Don't hide if focus moves to the toolbar itself or a popover
      const related = e.relatedTarget as HTMLElement | null
      if (
        related &&
        (toolbarRef.current?.contains(related) ||
          related.closest?.('.MuiPopover-root') ||
          related.closest?.('.MuiMenu-root'))
      ) {
        return
      }
      setIsFocused(false)
    }

    rootElement.addEventListener('focus', onFocus)
    rootElement.addEventListener('blur', onBlur)
    // Check initial state
    if (rootElement === document.activeElement || rootElement.contains(document.activeElement)) {
      setIsFocused(true)
    }

    return () => {
      rootElement.removeEventListener('focus', onFocus)
      rootElement.removeEventListener('blur', onBlur)
    }
  }, [editor])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar()
        })
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar()
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, updateToolbar])

  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: dragOffset.x,
      elemY: dragOffset.y,
    }

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return
      const dx = ev.clientX - dragStart.current.mouseX
      const dy = ev.clientY - dragStart.current.mouseY
      setDragOffset({
        x: dragStart.current.elemX + dx,
        y: dragStart.current.elemY + dy,
      })
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [dragOffset])

  const insertLink = useCallback(() => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl('https://'))
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    }
  }, [editor, isLink])

  const applyStyleText = useCallback(
    (styles: Record<string, string>) => {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, styles)
        }
      })
    },
    [editor],
  )

  const onFontColorSelect = useCallback(
    (value: string) => {
      applyStyleText({ color: value })
    },
    [applyStyleText],
  )

  const onBgColorSelect = useCallback(
    (value: string) => {
      applyStyleText({ 'background-color': value })
    },
    [applyStyleText],
  )

  const hasTextFormats = config.textFormats.length > 0
  const hasAdvancedFormats = config.advancedFormats.length > 0
  const hasInsertBlocks = config.insertBlocks.length > 0
  const hasLayouts = config.layouts.length > 0

  if (!isFocused) return null

  return createPortal(
    <Box
      ref={toolbarRef}
      sx={{
        position: 'absolute',
        top: -44 + dragOffset.y,
        left: dragOffset.x,
        right: dragOffset.x === 0 ? 0 : undefined,
        mx: dragOffset.x === 0 ? 'auto' : undefined,
        width: 'fit-content',
        display: 'flex',
        alignItems: 'center',
        gap: 0.25,
        px: 0.5,
        py: 0.25,
        borderRadius: '12px',
        backgroundColor: 'background.paper',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
        border: '1px solid',
        borderColor: 'divider',
        zIndex: 2000,
        transition: isDragging.current ? 'none' : 'top 0.15s ease, left 0.15s ease',
        '& .MuiIconButton-root': {
          padding: '4px',
          borderRadius: '6px',
        },
      }}
      onMouseDown={(e) => {
        // Prevent toolbar clicks from stealing focus / collapsing selection
        e.preventDefault()
      }}
    >
      {/* Drag handle */}
      <Box
        onMouseDown={handleDragStart}
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'grab',
          color: 'text.disabled',
          mr: 0.25,
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <DragIndicatorIcon sx={{ fontSize: 16 }} />
      </Box>

      {/* Text format buttons */}
      {hasTextFormats && (
        <>
          {config.textFormats.includes('bold') && (
            <IconButton
              size="small"
              onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
              color={isBold ? 'primary' : 'default'}
              aria-label="Bold"
            >
              <FormatBoldIcon fontSize="small" />
            </IconButton>
          )}
          {config.textFormats.includes('italic') && (
            <IconButton
              size="small"
              onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
              color={isItalic ? 'primary' : 'default'}
              aria-label="Italic"
            >
              <FormatItalicIcon fontSize="small" />
            </IconButton>
          )}
          {config.textFormats.includes('underline') && (
            <IconButton
              size="small"
              onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
              color={isUnderline ? 'primary' : 'default'}
              aria-label="Underline"
            >
              <FormatUnderlinedIcon fontSize="small" />
            </IconButton>
          )}
          {config.textFormats.includes('strikethrough') && (
            <IconButton
              size="small"
              onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
              color={isStrikethrough ? 'primary' : 'default'}
              aria-label="Strikethrough"
            >
              <FormatStrikethroughIcon fontSize="small" />
            </IconButton>
          )}
          {config.textFormats.includes('code') && (
            <IconButton
              size="small"
              onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
              color={isCode ? 'primary' : 'default'}
              aria-label="Code"
            >
              <CodeIcon fontSize="small" />
            </IconButton>
          )}
          {config.textFormats.includes('subscript') && (
            <IconButton
              size="small"
              onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')}
              color={isSubscript ? 'primary' : 'default'}
              aria-label="Subscript"
            >
              <SubscriptIcon fontSize="small" />
            </IconButton>
          )}
          {config.textFormats.includes('superscript') && (
            <IconButton
              size="small"
              onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript')}
              color={isSuperscript ? 'primary' : 'default'}
              aria-label="Superscript"
            >
              <SuperscriptIcon fontSize="small" />
            </IconButton>
          )}
        </>
      )}

      {/* Link */}
      {config.showLink && (
        <>
          {hasTextFormats && <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />}
          <IconButton
            size="small"
            onClick={insertLink}
            color={isLink ? 'primary' : 'default'}
            aria-label="Insert link"
          >
            <AddLinkIcon fontSize="small" />
          </IconButton>
        </>
      )}

      {/* Advanced formatting: font color, bg color */}
      {hasAdvancedFormats && (
        <>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />
          {config.advancedFormats.includes('fontColor') && (
            <IconButton
              size="small"
              onClick={(e) => {
                setColorAnchorEl(e.currentTarget)
                setIsColorMode('font')
              }}
              aria-label="Font color"
              sx={{
                '& svg': { color: fontColor !== '#000000' ? fontColor : undefined },
              }}
            >
              <FormatColorTextIcon fontSize="small" />
            </IconButton>
          )}
          {config.advancedFormats.includes('backgroundColor') && (
            <IconButton
              size="small"
              onClick={(e) => {
                setBgColorAnchorEl(e.currentTarget)
                setIsColorMode('bg')
              }}
              aria-label="Background color"
              sx={{
                '& svg': { color: bgColor !== '#ffffff' ? bgColor : undefined },
              }}
            >
              <FormatColorFillIcon fontSize="small" />
            </IconButton>
          )}
          <Popover
            open={Boolean(colorAnchorEl) && isColorMode === 'font'}
            anchorEl={colorAnchorEl}
            onClose={() => { setColorAnchorEl(null); setIsColorMode(null) }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            slotProps={{ paper: { sx: { borderRadius: '12px', p: 1 } } }}
          >
            <ColorPicker
              editor={editor}
              color={fontColor}
              onChange={onFontColorSelect}
            />
          </Popover>
          <Popover
            open={Boolean(bgColorAnchorEl) && isColorMode === 'bg'}
            anchorEl={bgColorAnchorEl}
            onClose={() => { setBgColorAnchorEl(null); setIsColorMode(null) }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            slotProps={{ paper: { sx: { borderRadius: '12px', p: 1 } } }}
          >
            <ColorPicker
              editor={editor}
              color={bgColor}
              onChange={onBgColorSelect}
            />
          </Popover>
        </>
      )}

      {/* Insert blocks */}
      {hasInsertBlocks && (
        <>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />
          <IconButton
            size="small"
            onClick={(e) => setInsertAnchorEl(e.currentTarget)}
            aria-label="Insert block"
            aria-haspopup="true"
          >
            <AddIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={insertAnchorEl}
            open={Boolean(insertAnchorEl)}
            onClose={() => setInsertAnchorEl(null)}
            slotProps={{ paper: { sx: { borderRadius: '10px' } } }}
          >
            {config.insertBlocks.includes('meaningAssociation') && (
              <MenuItem onClick={() => { editor.dispatchCommand(INSERT_MEANING_ASSOCIATION_BLOCK_COMMAND, undefined); setInsertAnchorEl(null) }}>
                <ListItemIcon><WordBlockIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Meaning Association</ListItemText>
              </MenuItem>
            )}
            {config.insertBlocks.includes('wordBlock') && (
              <MenuItem onClick={() => { editor.dispatchCommand(INSERT_WORD_BLOCK_COMMAND, 'placeholder-word-id'); setInsertAnchorEl(null) }}>
                <ListItemIcon><FontDownloadIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Word Block</ListItemText>
              </MenuItem>
            )}
            {config.insertBlocks.includes('answerVocabulary') && (
              <MenuItem onClick={() => { editor.dispatchCommand(INSERT_ANSWER_BLOCK_COMMAND, []); setInsertAnchorEl(null) }}>
                <ListItemIcon><FormatSizeIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Short Answer (Vocabulary)</ListItemText>
              </MenuItem>
            )}
            {config.insertBlocks.includes('answerCustom') && (
              <MenuItem onClick={() => { editor.dispatchCommand(INSERT_CUSTOM_ANSWER_BLOCK_COMMAND, []); setInsertAnchorEl(null) }}>
                <ListItemIcon><FormatSizeIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Short Answer (Custom)</ListItemText>
              </MenuItem>
            )}
            {config.insertBlocks.includes('quiz') && (
              <MenuItem onClick={() => { editor.dispatchCommand(INSERT_QUIZ_COMMAND, undefined); setInsertAnchorEl(null) }}>
                <ListItemIcon><QuizIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Multiple Choice Quiz</ListItemText>
              </MenuItem>
            )}
            {config.insertBlocks.includes('playlist') && (
              <MenuItem onClick={() => { editor.dispatchCommand(INSERT_PLAYLIST_COMMAND, undefined); setInsertAnchorEl(null) }}>
                <ListItemIcon><AudiotrackIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Audio Playlist</ListItemText>
              </MenuItem>
            )}
            {config.insertBlocks.includes('horizontalRule') && (
              <MenuItem onClick={() => { editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined); setInsertAnchorEl(null) }}>
                <ListItemIcon><HorizontalRuleIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Horizontal Rule</ListItemText>
              </MenuItem>
            )}
          </Menu>
        </>
      )}

      {/* Layout columns */}
      {hasLayouts && (
        <>
          <IconButton
            size="small"
            onClick={(e) => setLayoutAnchorEl(e.currentTarget)}
            aria-label="Insert columns layout"
            aria-haspopup="true"
          >
            <ViewColumnIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={layoutAnchorEl}
            open={Boolean(layoutAnchorEl)}
            onClose={() => setLayoutAnchorEl(null)}
            slotProps={{ paper: { sx: { borderRadius: '10px' } } }}
          >
            {config.layouts.map((value) => (
              <MenuItem
                key={value}
                onClick={() => {
                  editor.dispatchCommand(INSERT_LAYOUT_COMMAND, value)
                  setLayoutAnchorEl(null)
                }}
              >
                <ListItemIcon>
                  <ViewColumnIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{LAYOUT_LABELS[value]}</ListItemText>
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </Box>,
    anchorElem,
  )
}

// ============================================================================
// Plugin Export
// ============================================================================

export default function FloatingToolbarPlugin({
  anchorElem,
  config,
}: FloatingToolbarPluginProps = {}): React.ReactElement | null {
  const [editor] = useLexicalComposerContext()
  const [rootElem, setRootElem] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (anchorElem) {
      setRootElem(anchorElem)
      return
    }
    return editor.registerRootListener((rootElement) => {
      setRootElem(rootElement?.parentElement ?? null)
    })
  }, [editor, anchorElem])

  const resolvedConfig: Required<FloatingToolbarConfig> = {
    textFormats: config?.textFormats ?? ALL_TEXT_FORMATS,
    showLink: config?.showLink ?? true,
    advancedFormats: config?.advancedFormats ?? [],
    insertBlocks: config?.insertBlocks ?? ALL_INSERT_BLOCKS,
    layouts: config?.layouts ?? ALL_LAYOUTS,
  }

  if (!rootElem) return null

  return (
    <FloatingToolbar
      editor={editor}
      anchorElem={rootElem}
      config={resolvedConfig}
    />
  )
}
