/**
 * @fileoverview ArmorEditorBlock - React component rendered by ArmorEditorNode.decorate().
 * In editable mode: shows a shield preview with an "Edit" button that opens ArmorEditor dialog.
 * In read-only mode: shows just the static shield SVG.
 */

import React, { useState, useCallback, useMemo } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'
import { $getNodeByKey } from 'lexical'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import EditIcon from '@mui/icons-material/Edit'

import ArmorEditor, { renderShieldSvg } from '../../Gamification/ArmorEditor'
import type { ArmorEditorConfig } from '../../Gamification/ArmorEditor'
import { $isArmorEditorNode } from './ArmorEditorPlugin'
import { sanitizeSvg } from '../../../utils/sanitizeHtml'

interface ArmorEditorBlockProps {
  nodeKey: string
  data: ArmorEditorConfig
  isEditable: boolean
  className: { base: string; focus: string }
}

export default function ArmorEditorBlock({
  nodeKey,
  data,
  isEditable,
  className,
}: ArmorEditorBlockProps) {
  const [editor] = useLexicalComposerContext()
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)
  const [dialogOpen, setDialogOpen] = useState(false)

  const svgString = useMemo(() => renderShieldSvg(data), [data])

  const handleOpen = useCallback(() => {
    if (isEditable) setDialogOpen(true)
  }, [isEditable])

  const handleClose = useCallback(() => {
    setDialogOpen(false)
  }, [])

  const handleSave = useCallback(
    (config: ArmorEditorConfig, _svg: string, name: string, description: string) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if ($isArmorEditorNode(node)) {
          node.saveData(config)
        }
      })
      setDialogOpen(false)
    },
    [editor, nodeKey],
  )

  const containerClass = [className.base, isSelected ? className.focus : '']
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <Box
        className={containerClass}
        onClick={() => {
          clearSelection()
          setSelected(true)
        }}
        sx={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          my: 1,
          p: 1,
          border: isSelected ? '2px solid' : '2px solid transparent',
          borderColor: isSelected ? 'primary.main' : 'transparent',
          borderRadius: 2,
          cursor: isEditable ? 'pointer' : 'default',
          transition: 'border-color 0.15s',
          '&:hover': isEditable
            ? { borderColor: 'action.hover' }
            : undefined,
        }}
      >
        <Box
          dangerouslySetInnerHTML={{ __html: sanitizeSvg(svgString) }}
          sx={{ '& svg': { width: 120, height: 120 } }}
        />
        {isEditable && (
          <Tooltip title="Edit coat of arms">
            <IconButton
              onClick={(e) => {
                e.stopPropagation()
                handleOpen()
              }}
              size="small"
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                bgcolor: 'background.paper',
                boxShadow: 1,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {isEditable && (
        <ArmorEditor
          open={dialogOpen}
          squadName={''} 
          initialConfig={data}
          onSave={handleSave}
          onClose={handleClose}
          autoSaveDelay={0}
        />
      )}
    </>
  )
}
