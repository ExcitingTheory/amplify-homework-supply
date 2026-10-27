/**
 * SquadPostFeed — Displays a list of squad posts with a compose editor.
 *
 * Each post is rendered read-only via NarrativeReader (supporting all custom
 * blocks). Squad members see the SquadPostEditor at the top for creating new posts.
 *
 * @module SquadPostFeed
 */

import * as React from 'react'
import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
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
import { SquadPostEditor } from './SquadPostEditor'
import { AvatarDisplay } from './AvatarDisplay'
import { EmptyState } from '../EmptyState'

// ============================================================================
// Types
// ============================================================================

export interface SquadPostEntry {
  id: string
  title: string
  data?: string | null
  authorId: string
  createdAt?: string
  _version?: number
}

export interface SquadPostFeedProps {
  /** Posts to display (sorted newest first) */
  posts: SquadPostEntry[]
  /** Current user ID — used for delete permission */
  currentUserId: string
  /** Whether the user is a squad member (can post) */
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

export function SquadPostFeed({
  posts,
  currentUserId,
  isMember,
  onPublish,
  onDelete,
  isPublishing = false,
  authorDisplayNames = {},
}: SquadPostFeedProps) {
  const t = useTranslations('components')
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
              {t('squadPostFeed.newPost')}
            </Button>
          ) : (
            <Collapse in={composerOpen}>
              <SquadPostEditor
                onPublish={handlePublish}
                disabled={isPublishing}
              />
              <Button
                size="small"
                onClick={() => setComposerOpen(false)}
                sx={{ mb: 2 }}
              >
                {t('squadPostFeed.cancel')}
              </Button>
            </Collapse>
          )}
        </Box>
      )}

      {/* Post list */}
      <Stack spacing={2}>
        {posts.length === 0 && (
          <EmptyState
            dense
            title={t('squadPostFeed.empty')}
            {...(isMember &&
              !composerOpen && {
                ctaLabel: t('squadPostFeed.writeFirstPost'),
                onCtaClick: () => setComposerOpen(true),
              })}
          />
        )}

        {posts.map((post) => (
          <Card key={post.id} variant="outlined">
            <CardContent sx={{ pb: '16px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <AvatarDisplay
                    profileUsername={post.authorId}
                    label={authorDisplayNames[post.authorId]}
                    seed={post.authorId}
                    size={36}
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
                    aria-label={t('squadPostFeed.deletePost')}
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
                    ariaLabel={t('squadPostFeed.postAriaLabel', { title: post.title })}
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

export default SquadPostFeed
