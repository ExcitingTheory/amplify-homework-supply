/**
 * @fileoverview CollaboratorsList - Shows active collaborators in real-time
 * @module CollaboratorsList
 * 
 * Displays a list of users currently editing the document with awareness indicators
 * 
 * @example
 * ```tsx
 * const { provider } = useYjsUnit({ unitId: 'unit-1' });
 * 
 * <CollaboratorsList provider={provider} />
 * ```
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Paper,
} from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import type { YjsDocProvider } from '@/yjs/YjsProvider';

export interface CollaboratorsListProps {
  /** Yjs provider instance (null when offline) */
  provider: YjsDocProvider | null;
  /** Optional title for the list */
  title?: string;
  /** Show compact view (just avatars) */
  compact?: boolean;
}

interface CollaboratorState {
  clientId: number;
  user: {
    name: string;
    color: string;
  };
}

/**
 * Component that displays active collaborators with their presence status
 * 
 * Features:
 * - Real-time updates via awareness API
 * - Shows username and color indicator
 * - Excludes current user
 * - Handles offline mode gracefully
 */
export default function CollaboratorsList({
  provider,
  title = 'Active Collaborators',
  compact = false,
}: CollaboratorsListProps) {
  const [collaborators, setCollaborators] = useState<CollaboratorState[]>([]);
  const [localClientId, setLocalClientId] = useState<number | null>(null);

  useEffect(() => {
    if (!provider) {
      setCollaborators([]);
      return;
    }

    const awareness = provider.getAwareness();
    setLocalClientId(awareness.clientID);

    const updateCollaborators = () => {
      const states = awareness.getStates();
      const remoteUsers: CollaboratorState[] = [];

      states.forEach((state: any, clientId: number) => {
        // Skip local user
        if (clientId === awareness.clientID) {
          return;
        }

        // Only include users with awareness data
        if (state?.user?.name) {
          remoteUsers.push({
            clientId,
            user: {
              name: state.user.name,
              color: state.user.color || '#3b82f6',
            },
          });
        }
      });

      setCollaborators(remoteUsers);
    };

    // Initial update
    updateCollaborators();

    // Subscribe to awareness changes
    awareness.on('change', updateCollaborators);

    return () => {
      awareness.off('change', updateCollaborators);
    };
  }, [provider]);

  // Offline mode
  if (!provider) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Offline - No collaborators
        </Typography>
      </Box>
    );
  }

  // No collaborators
  if (collaborators.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No other users online
        </Typography>
      </Box>
    );
  }

  // Compact view - just avatars
  if (compact) {
    return (
      <Box sx={{ display: 'flex', gap: 0.5, p: 1, flexWrap: 'wrap' }}>
        {collaborators.map((collab) => (
          <Avatar
            key={collab.clientId}
            sx={{
              width: 32,
              height: 32,
              bgcolor: collab.user.color,
              fontSize: '0.875rem',
              border: '2px solid white',
            }}
            title={collab.user.name}
          >
            {collab.user.name.charAt(0).toUpperCase()}
          </Avatar>
        ))}
      </Box>
    );
  }

  // Full list view
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        {title}
      </Typography>
      <List dense disablePadding>
        {collaborators.map((collab) => (
          <ListItem key={collab.clientId} disableGutters>
            <ListItemAvatar>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: collab.user.color,
                  fontSize: '0.875rem',
                }}
              >
                {collab.user.name.charAt(0).toUpperCase()}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={collab.user.name}
              primaryTypographyProps={{ variant: 'body2' }}
              secondary={
                <Chip
                  label="Online"
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: '0.625rem',
                    bgcolor: 'success.light',
                    color: 'success.dark',
                    mt: 0.5,
                  }}
                />
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
