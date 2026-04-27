import { useRouter } from 'next/router'
import React, { useState, useEffect, useContext, useMemo } from 'react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import nextI18nextConfig from '../../next-i18next.config'

import MyAuth from '../../src/components/authenticator'
import UnitContext, { UnitProvider } from '../../src/context/unitContext'
import { FilesProvider } from '../../src/context/fileContext'
import { DictionaryProvider } from '../../src/context/dictionaryContext'

import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import MainToolbar from '../../src/components/MainToolbar'
import { Workbook } from '../../src/components/Editor3'
import { PeerReviewChat } from '../../src/components/PeerReview'
import { PeerReviewFeedbackPrompt } from '../../src/components/PeerReview/PeerReviewFeedbackPrompt'
import { usePeerReviewRoom } from '../../src/yjs/peerReviewHooks'
import { getAmplifyClient } from '../../src/utils/amplifyClient'
import { awardXPAndCheck } from '../../src/utils/gamificationActions'

/**
 * PeerReviewContent — Inner content that consumes UnitContext
 * and renders a split-pane: read-only workbook + chat.
 */
function PeerReviewContent() {
  const router = useRouter()
  const { id: roomId } = router.query
  const { t } = useTranslation('pages')
  const { session, unit, grade } = useContext(UnitContext)

  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch HomeworkRoom record
  useEffect(() => {
    if (!roomId || !session?.username) return

    const client = getAmplifyClient()
    client.models.HomeworkRoom.get({ id: roomId })
      .then(({ data }) => {
        if (!data) {
          setError('Review room not found')
        } else {
          setRoom(data)
        }
      })
      .catch((err) => {
        console.error('Failed to load review room:', err)
        setError('Failed to load review room')
      })
      .finally(() => setLoading(false))
  }, [roomId, session?.username])

  // Connect to the peer review Yjs room
  const peerReview = usePeerReviewRoom(
    room
      ? {
          roomId: room.id,
          gradeId: room.gradeId,
          user: {
            username: session?.username || '',
            role: session?.groups?.[0] || 'Learners',
            displayName: session?.username,
          },
          connect: true,
          persistence: false,
        }
      : null,
  )

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 10 }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    )
  }

  const isOwner = room?.ownerId === session?.username
  const isClosed = room?.status === 'REVIEW_COMPLETE'
  const [closing, setClosing] = useState(false)
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false)

  const handleCloseReview = async () => {
    if (!roomId || closing) return
    setClosing(true)
    try {
      const client = getAmplifyClient()

      // Build chat log from messages
      const chatLog = peerReview.messages
        .map(m => `[${m.displayName || m.author}]: ${m.content}`)
        .join('\n')

      // Generate AI summary and close the room
      await client.mutations.generateReviewSummary({
        roomId,
        chatLog,
      })

      // Close via Yjs provider
      peerReview.closeRoom()

      // Award XP to participants
      const username = session?.username
      if (username) {
        // Award host XP
        awardXPAndCheck(username, 'PEER_REVIEW_HOSTED', roomId)
        // Award reviewer XP to peers
        for (const peer of peerReview.peers) {
          if (peer.username !== username) {
            awardXPAndCheck(peer.username, 'PEER_REVIEW_GIVEN', roomId)
          }
        }
      }

      // Show feedback prompt to owner
      if (isOwner) {
        setShowFeedbackPrompt(true)
      }
    } catch (err) {
      console.error('[PeerReview] Error closing review:', err)
    } finally {
      setClosing(false)
    }
  }

  const handleReviewFeedback = (helpful) => {
    console.log(`[PeerReview] Owner feedback: ${helpful ? 'helpful' : 'not helpful'}`)
    // Could persist this to HomeworkRoom or analytics in the future
  }

  const handleAIMention = async (message, chatHistory) => {
    if (!roomId) return
    try {
      const client = getAmplifyClient()
      const result = await client.mutations.handleAIMention({
        roomId,
        message,
        chatHistory,
      })
      // Insert AI response as an AI_SUGGESTION message
      if (result?.data?.response) {
        peerReview.sendMessage(result.data.response, 'AI_SUGGESTION')
      }
    } catch (err) {
      console.error('[PeerReview] AI mention error:', err)
    }
  }

  return (
    <>
      <AppBar
        position="fixed"
        color="default"
        sx={{
          backgroundColor: 'custom.glassNavbar',
          backdropFilter: 'blur(8px)',
        }}
      >
        <MainToolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <Typography variant="h6" noWrap>
              {t('Peer Review')}
            </Typography>
            <Chip
              label={isClosed ? 'Completed' : 'In Progress'}
              size="small"
              color={isClosed ? 'default' : 'success'}
              variant="outlined"
            />
            {peerReview.peers.length > 0 && (
              <Chip
                label={`${peerReview.peers.length + 1} online`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {isOwner && !isClosed && (
              <Button
                variant="contained"
                color="warning"
                size="small"
                disabled={closing}
                onClick={handleCloseReview}
              >
                {closing ? 'Closing...' : 'End Review'}
              </Button>
            )}
          </Box>
        </MainToolbar>
      </AppBar>

      {/* Split pane: workbook (left) + chat (right) */}
      <Box
        sx={{
          display: 'flex',
          mt: '64px', // AppBar height
          height: 'calc(100vh - 64px)',
        }}
      >
        {/* Workbook — read-only for peers, editable for owner */}
        <Box
          sx={{
            flex: '1 1 60%',
            overflow: 'auto',
            borderRight: 1,
            borderColor: 'divider',
            p: 2,
          }}
        >
          {unit && grade ? (
            <Workbook readOnly={!isOwner} />
          ) : (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Loading workbook...
              </Typography>
            </Box>
          )}
        </Box>

        {/* Chat panel */}
        <Box
          sx={{
            flex: '0 0 40%',
            maxWidth: 480,
            minWidth: 320,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <PeerReviewChat
            messages={peerReview.messages}
            typingPeers={peerReview.typingPeers}
            isClosed={isClosed}
            onSendMessage={(content) => peerReview.sendMessage(content)}
            onTyping={peerReview.setTyping}
            currentUsername={session?.username || ''}
            onAIMention={handleAIMention}
          />
        </Box>
      </Box>

      <PeerReviewFeedbackPrompt
        open={showFeedbackPrompt}
        onSubmit={handleReviewFeedback}
        onClose={() => setShowFeedbackPrompt(false)}
      />
    </>
  )
}

/**
 * Peer Review page — split-pane workbook + chat.
 *
 * Route: /review/[id] where [id] is the HomeworkRoom ID.
 */
export default function PeerReviewPage() {
  return (
    <MyAuth>
      <UnitProvider>
        <FilesProvider>
          <DictionaryProvider>
            <PeerReviewContent />
          </DictionaryProvider>
        </FilesProvider>
      </UnitProvider>
    </MyAuth>
  )
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  }
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'pages'], nextI18nextConfig)),
    },
  }
}
