/**
 * Tutor Presence Banner
 * 
 * Displays a notification when tutors join to help with the workbook
 */

import React from 'react';
import { Alert, Box, Avatar, AvatarGroup, Typography } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import UnitContext from '../../context/unitContext';
import { ProfileAvatarLink } from '../ProfileAvatarLink';

export function TutorPresenceBanner() {
  const t = useTranslations('components');
  const { workbook, workbookEnabled } = React.useContext(UnitContext);

  // Don't show if feature disabled or no workbook provider
  if (!workbookEnabled || !workbook?.provider) {
    return null;
  }

  // Don't show if no tutors present
  if (!workbook.hasTutorPresent) {
    return null;
  }

  const tutors = workbook.activeTutors || [];

  return (
    <Alert
      severity="info"
      icon={<InfoIcon />}
      sx={{
        mb: 2,
        '& .MuiAlert-message': {
          width: '100%',
        },
      }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 32, height: 32 } }}>
          {tutors.map((tutor: any, i: number) => (
            <Avatar
              component={ProfileAvatarLink}
              username={tutor.username}
              displayName={tutor.displayName}
              key={i}
              sx={{ bgcolor: tutor.color || '#f59e0b' }}
              title={tutor.displayName}
            >
              {(tutor.displayName?.[0] || 'T').toUpperCase()}
            </Avatar>
          ))}
        </AvatarGroup>
        
        <Typography variant="body2">
          {t.rich('tutorPresenceBanner.message', {
            names: tutors.map((tutor: any) => tutor.displayName).join(', '),
            count: tutors.length,
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </Typography>
      </Box>
    </Alert>
  );
}

export default TutorPresenceBanner;
