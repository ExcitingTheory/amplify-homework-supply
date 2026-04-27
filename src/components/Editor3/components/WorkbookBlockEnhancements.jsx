/**
 * WorkbookBlockEnhancements — Adds comment gutter, NailedIt badge,
 * and block history to any graded workbook block.
 *
 * Wraps around the existing block content. Uses UnitContext to access
 * the workbook collaboration provider.
 */

import React, { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import UnitContext from '../../../context/unitContext'
import { CommentGutterIcon } from '../../Workbook/CommentGutterIcon'
import { CommentThreadDrawer } from '../../Workbook/CommentThreadDrawer'
import { BlockHistoryTimeline } from '../../Workbook/BlockHistoryTimeline'
import { NailedItBadge } from '../../Gamification/NailedItBadge'
import { useWorkbookComments, useBlockHistory } from '../../../yjs/workbookHooks'

export function WorkbookBlockEnhancements({ blockId, nailedIt, children }) {
  const { workbook, workbookEnabled, session } = React.useContext(UnitContext)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const provider = workbookEnabled ? workbook?.provider ?? null : null

  const { threads, addComment, replyToComment, resolveThread } = useWorkbookComments(provider, blockId)
  const { entries: historyEntries } = useBlockHistory(provider, blockId)

  const commentCount = threads?.length ?? 0
  const unresolvedCount = threads?.filter(t => !t.resolved)?.length ?? 0

  const handleOpenDrawer = useCallback(() => setDrawerOpen(true), [])
  const handleCloseDrawer = useCallback(() => setDrawerOpen(false), [])

  const handleAddComment = useCallback((text) => {
    addComment(text)
  }, [addComment])

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Comment gutter icon */}
      {provider && (
        <Box
          sx={{
            position: 'absolute',
            left: -32,
            top: 8,
            zIndex: 1,
          }}
        >
          <CommentGutterIcon
            commentCount={commentCount}
            unresolvedCount={unresolvedCount}
            onClick={handleOpenDrawer}
          />
        </Box>
      )}

      {/* Block content */}
      {children}

      {/* NailedIt badge */}
      {nailedIt && (
        <Box sx={{ mt: 0.5 }}>
          <NailedItBadge />
        </Box>
      )}

      {/* Block history timeline */}
      {historyEntries.length > 0 && (
        <BlockHistoryTimeline entries={historyEntries} maxVisible={5} />
      )}

      {/* Comment thread drawer */}
      {provider && (
        <CommentThreadDrawer
          open={drawerOpen}
          onClose={handleCloseDrawer}
          blockId={blockId}
          threads={threads}
          onAddComment={handleAddComment}
          onReply={replyToComment}
          onResolve={resolveThread}
          currentUsername={session?.username || ''}
        />
      )}
    </Box>
  )
}
