/**
 * CommentThreadDrawer — Side drawer for viewing and adding comment threads on a block.
 *
 * Uses useWorkbookComments hook for live data.
 *
 * @module CommentThreadDrawer
 */

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Collapse from '@mui/material/Collapse'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ReplyIcon from '@mui/icons-material/Reply'
import SendIcon from '@mui/icons-material/Send'
import type { CommentThread, CommentReply } from '../../yjs/WorkbookCollaborationProvider'

// ============================================================================
// Types
// ============================================================================

export interface CommentThreadDrawerProps {
  open: boolean
  onClose: () => void
  blockId: string
  threads: CommentThread[]
  onAddComment: (text: string) => void
  onReply: (threadKey: string, text: string) => void
  onResolve: (threadKey: string, resolved: boolean) => void
  currentUsername?: string
}

// ============================================================================
// Sub-components
// ============================================================================

function ReplyItem({ reply }: { reply: CommentReply }) {
  const time = new Date(reply.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Box sx={{ display: 'flex', gap: 1, pl: 4, py: 0.5 }}>
      <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
        {(reply.displayName || reply.author)?.[0]?.toUpperCase() || '?'}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" fontWeight="bold">
          {reply.displayName || reply.author}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          {time}
        </Typography>
        <Typography variant="body2">{reply.text}</Typography>
      </Box>
    </Box>
  )
}

function ThreadItem({
  thread,
  threadKey,
  onReply,
  onResolve,
}: {
  thread: CommentThread
  threadKey: string
  onReply: (threadKey: string, text: string) => void
  onResolve: (threadKey: string, resolved: boolean) => void
}) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')

  const handleSendReply = () => {
    if (!replyText.trim()) return
    onReply(threadKey, replyText.trim())
    setReplyText('')
    setReplyOpen(false)
  }

  const time = new Date(thread.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Box
      sx={{
        p: 1.5,
        mb: 1,
        borderRadius: 1,
        bgcolor: thread.resolved ? 'action.disabledBackground' : 'background.paper',
        border: 1,
        borderColor: thread.resolved ? 'divider' : 'primary.light',
        opacity: thread.resolved ? 0.7 : 1,
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Avatar sx={{ width: 28, height: 28, fontSize: 13 }}>
          {(thread.displayName || thread.author)?.[0]?.toUpperCase() || '?'}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight="bold">
            {thread.displayName || thread.author}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {time}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={() => onResolve(threadKey, !thread.resolved)}
          title={thread.resolved ? 'Unresolve' : 'Resolve'}
        >
          {thread.resolved ? (
            <CheckCircleIcon color="success" fontSize="small" />
          ) : (
            <CheckCircleOutlineIcon fontSize="small" />
          )}
        </IconButton>
      </Box>

      {/* Comment text */}
      <Typography variant="body2" sx={{ pl: 4.5, mb: 0.5 }}>
        {thread.text}
      </Typography>

      {thread.resolved && (
        <Chip label="Resolved" size="small" color="success" variant="outlined" sx={{ ml: 4.5, mb: 0.5 }} />
      )}

      {/* Replies */}
      {thread.replies.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Divider sx={{ mb: 0.5 }} />
          {thread.replies.map((reply, i) => (
            <ReplyItem key={i} reply={reply} />
          ))}
        </Box>
      )}

      {/* Reply input */}
      <Box sx={{ mt: 0.5, pl: 4 }}>
        {!replyOpen ? (
          <Button
            size="small"
            startIcon={<ReplyIcon />}
            onClick={() => setReplyOpen(true)}
          >
            Reply
          </Button>
        ) : (
          <Collapse in={replyOpen}>
            <Stack direction="row" spacing={1} alignItems="flex-end">
              <TextField
                size="small"
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendReply()
                  }
                }}
                multiline
                maxRows={3}
                fullWidth
                autoFocus
              />
              <IconButton
                color="primary"
                onClick={handleSendReply}
                disabled={!replyText.trim()}
                size="small"
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Collapse>
        )}
      </Box>
    </Box>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function CommentThreadDrawer({
  open,
  onClose,
  blockId,
  threads,
  onAddComment,
  onReply,
  onResolve,
}: CommentThreadDrawerProps) {
  const [newCommentText, setNewCommentText] = useState('')

  const handleAddComment = () => {
    if (!newCommentText.trim()) return
    onAddComment(newCommentText.trim())
    setNewCommentText('')
  }

  const unresolvedCount = threads.filter((t) => !t.resolved).length

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 380, p: 2 } }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Comments
        </Typography>
        {unresolvedCount > 0 && (
          <Chip label={`${unresolvedCount} open`} size="small" color="primary" sx={{ mr: 1 }} />
        )}
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Thread list */}
      <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
        {threads.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No comments on this block yet
          </Typography>
        ) : (
          threads.map((thread) => (
            <ThreadItem
              key={thread.id}
              thread={thread}
              threadKey={`${blockId}:${thread.id}`}
              onReply={onReply}
              onResolve={onResolve}
            />
          ))
        )}
      </Box>

      {/* New comment input */}
      <Divider sx={{ mb: 1 }} />
      <Stack direction="row" spacing={1} alignItems="flex-end">
        <TextField
          size="small"
          placeholder="Add a comment..."
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleAddComment()
            }
          }}
          multiline
          maxRows={3}
          fullWidth
        />
        <IconButton
          color="primary"
          onClick={handleAddComment}
          disabled={!newCommentText.trim()}
        >
          <SendIcon />
        </IconButton>
      </Stack>
    </Drawer>
  )
}

export default CommentThreadDrawer
