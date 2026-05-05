/**
 * FloatingToolbarPlugin — A floating toolbar that appears above the caret/selection.
 *
 * Shows formatting controls (bold, italic, underline, strikethrough, code, link)
 * and an insert menu when text is selected or the editor is focused.
 * Designed for inline editors (guild description, guild posts) that don't use
 * the full fixed-position ToolBarPlugin.
 */

import * as React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
  type RangeSelection,
} from 'lexical'
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { mergeRegister } from '@lexical/utils'
import { $isAtNodeEnd } from '@lexical/selection'

import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
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

import { INSERT_QUIZ_COMMAND } from './QuizPlugin'
import { INSERT_MEANING_ASSOCIATION_BLOCK_COMMAND } from './MeaningAssociationPlugin'
import { INSERT_ANSWER_BLOCK_COMMAND } from './AnswerPlugin'
import { INSERT_CUSTOM_ANSWER_BLOCK_COMMAND } from './CustomAnswerPlugin'
import { INSERT_WORD_BLOCK_COMMAND } from './WordBlockPlugin'
import { INSERT_PLAYLIST_COMMAND } from './PlaylistPlugin'
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode'
import { INSERT_LAYOUT_COMMAND } from './LayoutPlugin'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'

const LAYOUTS = [
  { label: '2 columns (equal)', value: '1fr 1fr' },
  { label: '2 columns (25% - 75%)', value: '1fr 3fr' },
  { label: '3 columns (equal)', value: '1fr 1fr 1fr' },
  { label: '3 columns (25% - 50% - 25%)', value: '1fr 2fr 1fr' },
  { label: '4 columns (equal)', value: '1fr 1fr 1fr 1fr' },
]

import { sanitizeUrl } from '../utils/url'

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

function FloatingToolbar({
  editor,
  anchorElem,
}: {
  editor: ReturnType<typeof useLexicalComposerContext>[0]
  anchorElem: HTMLElement
}) {
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isCode, setIsCode] = useState(false)
  const [isLink, setIsLink] = useState(false)
  const [insertAnchorEl, setInsertAnchorEl] = useState<null | HTMLElement>(null)
  const [layoutAnchorEl, setLayoutAnchorEl] = useState<null | HTMLElement>(null)

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) {
      return
    }

    setIsBold(selection.hasFormat('bold'))
    setIsItalic(selection.hasFormat('italic'))
    setIsUnderline(selection.hasFormat('underline'))
    setIsStrikethrough(selection.hasFormat('strikethrough'))
    setIsCode(selection.hasFormat('code'))

    const node = getSelectedNode(selection)
    const parent = node.getParent()
    setIsLink($isLinkNode(parent) || $isLinkNode(node))
  }, [])

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

  const insertLink = useCallback(() => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl('https://'))
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    }
  }, [editor, isLink])

  return (
    <Box
      ref={toolbarRef}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.25,
        px: 0.5,
        py: 0.25,
        borderBottom: 1,
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        '& .MuiIconButton-root': {
          padding: '4px',
          borderRadius: '4px',
        },
      }}
    >
      <IconButton
        size="small"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        color={isBold ? 'primary' : 'default'}
        aria-label="Bold"
      >
        <FormatBoldIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        color={isItalic ? 'primary' : 'default'}
        aria-label="Italic"
      >
        <FormatItalicIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        color={isUnderline ? 'primary' : 'default'}
        aria-label="Underline"
      >
        <FormatUnderlinedIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
        color={isStrikethrough ? 'primary' : 'default'}
        aria-label="Strikethrough"
      >
        <FormatStrikethroughIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
        color={isCode ? 'primary' : 'default'}
        aria-label="Code"
      >
        <CodeIcon fontSize="small" />
      </IconButton>
      <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />
      <IconButton
        size="small"
        onClick={insertLink}
        color={isLink ? 'primary' : 'default'}
        aria-label="Insert link"
      >
        <AddLinkIcon fontSize="small" />
      </IconButton>
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
      >
        <MenuItem onClick={() => { editor.dispatchCommand(INSERT_MEANING_ASSOCIATION_BLOCK_COMMAND, undefined); setInsertAnchorEl(null) }}>
          <WordBlockIcon fontSize="small" sx={{ mr: 1 }} /> Meaning Association
        </MenuItem>
        <MenuItem onClick={() => { editor.dispatchCommand(INSERT_WORD_BLOCK_COMMAND, 'placeholder-word-id'); setInsertAnchorEl(null) }}>
          <FontDownloadIcon fontSize="small" sx={{ mr: 1 }} /> Word Block
        </MenuItem>
        <MenuItem onClick={() => { editor.dispatchCommand(INSERT_ANSWER_BLOCK_COMMAND, []); setInsertAnchorEl(null) }}>
          <FormatSizeIcon fontSize="small" sx={{ mr: 1 }} /> Short Answer (Vocabulary)
        </MenuItem>
        <MenuItem onClick={() => { editor.dispatchCommand(INSERT_CUSTOM_ANSWER_BLOCK_COMMAND, []); setInsertAnchorEl(null) }}>
          <FormatSizeIcon fontSize="small" sx={{ mr: 1 }} /> Short Answer (Custom)
        </MenuItem>
        <MenuItem onClick={() => { editor.dispatchCommand(INSERT_QUIZ_COMMAND, undefined); setInsertAnchorEl(null) }}>
          <QuizIcon fontSize="small" sx={{ mr: 1 }} /> Multiple Choice Quiz
        </MenuItem>
        <MenuItem onClick={() => { editor.dispatchCommand(INSERT_PLAYLIST_COMMAND, undefined); setInsertAnchorEl(null) }}>
          <AudiotrackIcon fontSize="small" sx={{ mr: 1 }} /> Audio Playlist
        </MenuItem>
        <MenuItem onClick={() => { editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined); setInsertAnchorEl(null) }}>
          <HorizontalRuleIcon fontSize="small" sx={{ mr: 1 }} /> Horizontal Rule
        </MenuItem>
      </Menu>
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
      >
        {LAYOUTS.map(({ label, value }) => (
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
            <ListItemText>{label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}

export default function FloatingToolbarPlugin({
  anchorElem,
}: {
  anchorElem?: HTMLElement
}): React.ReactElement | null {
  const [editor] = useLexicalComposerContext()
  const [rootElem, setRootElem] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (anchorElem) {
      setRootElem(anchorElem)
    } else {
      const root = editor.getRootElement()
      if (root?.parentElement) {
        setRootElem(root.parentElement)
      }
    }
  }, [editor, anchorElem])

  return <FloatingToolbar editor={editor} anchorElem={rootElem || document.body} />
}
