/**
 * @fileoverview ConversationPlaylistEditor — Editable view of a ConversationPlaylistNode.
 *
 * Shown in authoring mode. Allows inspecting track list, editing subtitle lines,
 * assigning still images, and removing individual tracks.
 */

'use client';

import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey } from 'lexical';
import { useTranslations } from 'next-intl';
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Chip,
  Divider,
  TextField,
  Paper,
  Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import SubtitlesIcon from '@mui/icons-material/Subtitles';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import UnitContext from '../../../context/unitContext';

/**
 * @param {Object} props
 * @param {string}   props.nodeKey
 * @param {string[]} props.fileIDs
 * @param {Array}    props.dialogue
 * @param {string}   props.scriptTitle
 * @param {string|null} props.movieFileID
 */
export default function ConversationPlaylistEditor({
  nodeKey,
  fileIDs = [],
  dialogue = [],
  scriptTitle = '',
  movieFileID = null,
}) {
  const t = useTranslations('components');
  const [editor] = useLexicalComposerContext();
  const { files } = React.useContext(UnitContext);

  const [editingLineId, setEditingLineId] = React.useState(null);
  const [editText, setEditText] = React.useState('');

  const handleRemoveTrack = (fileId) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (!node) return;
      const newIds = node.getFileIDs().filter((id) => id !== fileId);
      node.setFileIDs(newIds);
    });
  };

  const handleSaveLineEdit = (lineId) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (!node) return;
      const writable = node.getWritable();
      writable.__dialogue = writable.__dialogue.map((l) =>
        l.id === lineId ? { ...l, text: editText } : l,
      );
    });
    setEditingLineId(null);
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: 'secondary.main',
          color: 'secondary.contrastText',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <SubtitlesIcon fontSize="small" />
        <Typography variant="subtitle2" sx={{ flexGrow: 1, fontWeight: 600 }}>
          {scriptTitle || t('conversationPlaylistEditor.defaultTitle', 'Conversation')}
        </Typography>
        <Chip
          label={`${fileIDs.length} ${t('conversationPlaylistEditor.tracks', 'tracks')}`}
          size="small"
          sx={{ bgcolor: 'secondary.dark', color: 'secondary.contrastText', height: 20 }}
        />
      </Box>

      {/* Audio tracks */}
      <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {t('conversationPlaylistEditor.audioTracks', 'Audio Tracks')}
        </Typography>
        {fileIDs.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
            {t('conversationPlaylistEditor.noTracks', 'No audio tracks.')}
          </Typography>
        ) : (
          <List dense disablePadding>
            {fileIDs.map((id, idx) => {
              const file = files?.[id];
              return (
                <ListItem key={id} disableGutters sx={{ py: 0.25 }}>
                  <AudiotrackIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <ListItemText
                    primary={file?.name || id}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title={t('conversationPlaylistEditor.removeTrack', 'Remove track')}>
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={() => handleRemoveTrack(id)}
                        aria-label={t('conversationPlaylistEditor.removeTrack', 'Remove track')}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>

      <Divider />

      {/* Subtitle lines */}
      {dialogue.length > 0 && (
        <Box sx={{ px: 2, pt: 1.5, pb: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {t('conversationPlaylistEditor.subtitleLines', 'Subtitles')}
          </Typography>
          <List dense disablePadding>
            {dialogue.map((line) => (
              <ListItem key={line.id} disableGutters sx={{ py: 0.5, alignItems: 'flex-start' }}>
                <ListItemText
                  primary={
                    editingLineId === line.id ? (
                      <TextField
                        size="small"
                        fullWidth
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveLineEdit(line.id);
                          if (e.key === 'Escape') setEditingLineId(null);
                        }}
                        autoFocus
                        variant="standard"
                      />
                    ) : (
                      <Typography variant="body2">
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          sx={{ mr: 0.5 }}
                        >
                          {line.speaker}:
                        </Typography>
                        {line.text}
                      </Typography>
                    )
                  }
                />
                <ListItemSecondaryAction>
                  {editingLineId === line.id ? (
                    <IconButton
                      size="small"
                      onClick={() => handleSaveLineEdit(line.id)}
                      aria-label={t('conversationPlaylistEditor.saveLine', 'Save')}
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                  ) : (
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingLineId(line.id);
                        setEditText(line.text);
                      }}
                      aria-label={t('conversationPlaylistEditor.editLine', 'Edit subtitle')}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Paper>
  );
}
