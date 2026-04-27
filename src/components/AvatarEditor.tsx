/**
 * AvatarEditor — Lets users upload a photo or generate an avatar with AI.
 *
 * Uploaded images are resized client-side to 256×256 and stored as base64
 * data URLs in Settings.metadata.avatarUrl.
 *
 * AI-generated images use the existing generateImageFile Lambda (DALL-E 3)
 * and store the resulting S3 path in the same field.
 *
 * @module AvatarEditor
 */

import React, { useRef, useState, useCallback } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import SettingsContext from '../context/settingsContext'
import getCachedUrl from '../utils/getCachedUrl'
import { getAmplifyClient } from '../utils/amplifyClient'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const AVATAR_SIZE = 256
const JPEG_QUALITY = 0.85

/** Resize an image File/Blob to AVATAR_SIZE×AVATAR_SIZE and return a base64 data URL. */
function resizeImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = AVATAR_SIZE
        canvas.height = AVATAR_SIZE
        const ctx = canvas.getContext('2d')!
        // Center-crop: use the largest centered square
        const side = Math.min(img.width, img.height)
        const sx = (img.width - side) / 2
        const sy = (img.height - side) / 2
        ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface AvatarEditorProps {
  /** Current avatar URL (resolved), for controlled display. */
  avatarUrl?: string | null
  /** Called after a successful save with the new raw URL. */
  onSave?: (newUrl: string | null) => void
}

export function AvatarEditor({ avatarUrl: avatarUrlProp, onSave }: AvatarEditorProps) {
  const { settings, updateSettings } = React.useContext(SettingsContext) || {}

  // Resolved display URL
  const rawUrl: string | null =
    avatarUrlProp ?? (settings?.metadata as Record<string, unknown>)?.avatarUrl as string ?? null
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null)

  React.useEffect(() => {
    if (!rawUrl) { setResolvedUrl(null); return }
    let cancelled = false
    getCachedUrl(rawUrl).then((url: string) => {
      if (!cancelled) setResolvedUrl(url)
    }).catch(() => {
      if (!cancelled) setResolvedUrl(null)
    })
    return () => { cancelled = true }
  }, [rawUrl])

  // Preview state (before saving)
  const [preview, setPreview] = useState<string | null>(null)
  const [previewRaw, setPreviewRaw] = useState<string | null>(null) // what gets persisted

  // Upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  // AI generation
  const [showPrompt, setShowPrompt] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)

  // Saving
  const [saving, setSaving] = useState(false)

  // ------ Upload handler ------
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Validate image type
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    try {
      const base64 = await resizeImageToBase64(file)
      setPreview(base64)
      setPreviewRaw(base64) // store base64 directly
    } catch (err) {
      console.error('[AvatarEditor] resize error:', err)
    } finally {
      setUploading(false)
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [])

  // ------ AI generate handler ------
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    setGenError(null)
    try {
      const client = getAmplifyClient()
      const { data, errors } = await (client as any).mutations.generateImageFile({
        phrase: `A friendly cartoon avatar portrait: ${prompt.trim()}. Square aspect ratio, centered face, colorful, suitable as a profile picture.`,
        model: 'dall-e-3',
      })
      if (errors || !data?.path) {
        throw new Error(errors?.[0]?.message || 'Failed to generate avatar')
      }
      const s3Path = data.path as string
      const presigned = await getCachedUrl(s3Path)
      setPreview(presigned)
      setPreviewRaw(s3Path) // persist S3 path
    } catch (err: any) {
      console.error('[AvatarEditor] generate error:', err)
      setGenError(err?.message || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }, [prompt])

  // ------ Save / discard preview ------
  const handleSave = useCallback(async () => {
    if (!updateSettings || previewRaw == null) return
    setSaving(true)
    try {
      const existingMetadata = (settings?.metadata as Record<string, unknown>) || {}
      await updateSettings({ metadata: { ...existingMetadata, avatarUrl: previewRaw } })
      setPreview(null)
      setPreviewRaw(null)
      onSave?.(previewRaw)
    } catch (err) {
      console.error('[AvatarEditor] save error:', err)
    } finally {
      setSaving(false)
    }
  }, [updateSettings, previewRaw, settings, onSave])

  const handleDiscard = useCallback(() => {
    setPreview(null)
    setPreviewRaw(null)
  }, [])

  // ------ Remove avatar ------
  const handleRemove = useCallback(async () => {
    if (!updateSettings) return
    setSaving(true)
    try {
      const existingMetadata = (settings?.metadata as Record<string, unknown>) || {}
      const { avatarUrl: _, ...rest } = existingMetadata as Record<string, unknown> & { avatarUrl?: string }
      await updateSettings({ metadata: rest })
      setResolvedUrl(null)
      onSave?.(null)
    } catch (err) {
      console.error('[AvatarEditor] remove error:', err)
    } finally {
      setSaving(false)
    }
  }, [updateSettings, settings, onSave])

  const displayUrl = preview || resolvedUrl
  const hasPreview = preview != null
  const busy = uploading || generating || saving

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
      {/* Avatar display */}
      <Avatar
        src={displayUrl || undefined}
        sx={{ width: 128, height: 128, fontSize: 48 }}
      />

      {/* Preview confirm/discard */}
      {hasPreview && (
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            size="small"
            startIcon={saving ? <CircularProgress size={16} /> : <CheckIcon />}
            disabled={busy}
            onClick={handleSave}
          >
            Save
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CloseIcon />}
            disabled={busy}
            onClick={handleDiscard}
          >
            Discard
          </Button>
        </Stack>
      )}

      {/* Action buttons */}
      {!hasPreview && (
        <Stack direction="row" spacing={1} alignItems="center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />
          <Tooltip title="Upload photo">
            <span>
              <IconButton
                color="primary"
                disabled={busy}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? <CircularProgress size={24} /> : <PhotoCameraIcon />}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Generate with AI">
            <span>
              <IconButton
                color="secondary"
                disabled={busy}
                onClick={() => setShowPrompt((v) => !v)}
              >
                <AutoFixHighIcon />
              </IconButton>
            </span>
          </Tooltip>
          {resolvedUrl && (
            <Tooltip title="Remove avatar">
              <span>
                <IconButton
                  color="error"
                  disabled={busy}
                  onClick={handleRemove}
                >
                  {saving ? <CircularProgress size={24} /> : <DeleteIcon />}
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      )}

      {/* AI prompt */}
      {showPrompt && !hasPreview && (
        <Box sx={{ display: 'flex', gap: 1, width: '100%', maxWidth: 400, alignItems: 'flex-start' }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Describe your avatar (e.g. a cat wearing glasses)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={generating}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleGenerate()
              }
            }}
          />
          <Button
            variant="contained"
            size="small"
            disabled={generating || !prompt.trim()}
            onClick={handleGenerate}
            sx={{ minWidth: 'fit-content', whiteSpace: 'nowrap' }}
          >
            {generating ? <CircularProgress size={20} /> : 'Generate'}
          </Button>
        </Box>
      )}

      {genError && (
        <Typography color="error" variant="caption">
          {genError}
        </Typography>
      )}
    </Box>
  )
}

export default AvatarEditor
