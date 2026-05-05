/**
 * GuildPostFeed — Displays a list of guild posts with a compose editor.
 *
 * Each post is rendered read-only via NarrativeReader (supporting all custom
 * blocks). Guild members see the GuildPostEditor at the top for creating new posts.
 *
 * @module GuildPostFeed
 */

import * as React from 'react'
import { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import DeleteIcon from '@mui/icons-material/Delete'
import Collapse from '@mui/material/Collapse'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'

import { NarrativeReader } from '../Editor3/NarrativeReader'
import { GuildPostEditor } from './GuildPostEditor'
import { DiceBearAvatar } from './DiceBearAvatar'

// ============================================================================
// Types
// ============================================================================

export interface GuildPostEntry {
  id: string
  title: string
  data?: string | null
  authorId: string
  createdAt?: string
  _version?: number
}

export interface GuildPostFeedProps {
  /** Posts to display (sorted newest first) */
  posts: GuildPostEntry[]
  /** Current user ID — used for delete permission */
  currentUserId: string
  /** Whether the user is a guild member (can post) */
  isMember: boolean
  /** Called when a new post is published */
  onPublish: (post: { title: string; data: string }) => void
  /** Called when a post is deleted */
  onDelete?: (postId: string, version?: number) => void
  /** Loading state for optimistic UI */
  isPublishing?: boolean
  /** Map of authorId → display name for resolving UUIDs */
  authorDisplayNames?: Record<string, string>
}

// ============================================================================
// Component
// ============================================================================

export function GuildPostFeed({
  posts,
  currentUserId,
  isMember,
  onPublish,
  onDelete,
  isPublishing = false,
  authorDisplayNames = {},
}: GuildPostFeedProps) {
  const [composerOpen, setComposerOpen] = useState(false)

  const handlePublish = useCallback(
    (post: { title: string; data: string }) => {
      onPublish(post)
      setComposerOpen(false)
    },
    [onPublish],
  )

  return (
    <Box>
      {/* Composer toggle */}
      {isMember && (
        <Box sx={{ mb: 2 }}>
          {!composerOpen ? (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setComposerOpen(true)}
            >
              New Post
            </Button>
          ) : (
            <Collapse in={composerOpen}>
              <GuildPostEditor
                onPublish={handlePublish}
                disabled={isPublishing}
              />
              <Button
                size="small"
                onClick={() => setComposerOpen(false)}
                sx={{ mb: 2 }}
              >
                Cancel
              </Button>
            </Collapse>
          )}
        </Box>
      )}

      {/* Post list */}
      <Stack spacing={2}>
        {posts.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No posts yet. Be the first to share something!
          </Typography>
        )}

        {posts.map((post) => (
          <Card key={post.id} variant="outlined">
            <CardContent sx={{ pb: '16px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <DiceBearAvatar
                    seed={post.authorId}
                    size={36}
                    label={authorDisplayNames[post.authorId] || post.authorId}
                  />
                  <Box>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {post.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {authorDisplayNames[post.authorId] || post.authorId.slice(0, 8)}
                      {post.createdAt && (
                        <> &middot; {new Date(post.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}</>
                      )}
                    </Typography>
                  </Box>
                </Box>

                {onDelete && post.authorId === currentUserId && (
                  <IconButton
                    size="small"
                    aria-label="Delete post"
                    onClick={() => onDelete(post.id, post._version)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              {post.data && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <NarrativeReader
                    contentJson={post.data}
                    ariaLabel={`Post: ${post.title}`}
                    padding="0.5rem 0"
                  />
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}

export default GuildPostFeed
