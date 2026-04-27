import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import ThumbUpIcon from '@mui/icons-material/ThumbUp'
import ThumbDownIcon from '@mui/icons-material/ThumbDown'

interface PeerReviewFeedbackPromptProps {
  /** Whether the prompt is visible */
  open: boolean
  /** Callback when the user submits feedback */
  onSubmit: (helpful: boolean) => void
  /** Callback when the prompt is dismissed */
  onClose: () => void
}

/**
 * Post-review feedback prompt shown to the room owner after closing a peer review.
 * Asks "Did peer review help?" with thumbs up/down.
 */
export function PeerReviewFeedbackPrompt({
  open,
  onSubmit,
  onClose,
}: PeerReviewFeedbackPromptProps) {
  const [submitted, setSubmitted] = useState(false)

  const handleFeedback = (helpful: boolean) => {
    setSubmitted(true)
    onSubmit(helpful)
    // Auto-close after brief delay
    setTimeout(() => {
      onClose()
    }, 2000)
  }

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      onClose={onClose}
    >
      <Alert
        severity="info"
        variant="filled"
        onClose={onClose}
        sx={{ alignItems: 'center' }}
      >
        {submitted ? (
          <Typography variant="body2" fontWeight={600}>
            Thanks for your feedback!
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              Did peer review help?
            </Typography>
            <IconButton
              size="small"
              onClick={() => handleFeedback(true)}
              sx={{ color: 'inherit' }}
              aria-label="Peer review was helpful"
            >
              <ThumbUpIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleFeedback(false)}
              sx={{ color: 'inherit' }}
              aria-label="Peer review was not helpful"
            >
              <ThumbDownIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Alert>
    </Snackbar>
  )
}

export default PeerReviewFeedbackPrompt
