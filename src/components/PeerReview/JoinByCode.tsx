/**
 * JoinByCode — Input for joining a peer review room via short code.
 *
 * @module JoinByCode
 */

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import InputIcon from '@mui/icons-material/Input'

export interface JoinByCodeProps {
  onJoin: (code: string) => Promise<{ roomId: string; message?: string }>
}

export function JoinByCode({ onJoin }: JoinByCodeProps) {
  const [code, setCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return

    setJoining(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await onJoin(trimmed)
      setSuccess(result.message || 'Joined review room')
      setCode('')
    } catch (err: any) {
      setError(err?.message || 'Failed to join review room')
    } finally {
      setJoining(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleJoin()
    }
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Join a Peer Review
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <TextField
          size="small"
          placeholder="Enter review code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setError(null)
            setSuccess(null)
          }}
          onKeyDown={handleKeyDown}
          disabled={joining}
          inputProps={{ maxLength: 8, style: { textTransform: 'uppercase' } }}
          sx={{ maxWidth: 180 }}
        />
        <Button
          variant="outlined"
          startIcon={joining ? <Skeleton variant="circular" width={16} height={16} /> : <InputIcon />}
          onClick={handleJoin}
          disabled={!code.trim() || joining}
        >
          {joining ? 'Joining...' : 'Join'}
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 1 }}>
          {success}
        </Alert>
      )}
    </Box>
  )
}

export default JoinByCode
