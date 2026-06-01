'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { getAmplifyClient } from '@/utils/amplifyClient';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  Box,
  AppBar,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import MainToolbar from '@/components/MainToolbar';
import { GradedWorkbookViewer } from '@/components/GradedWorkbookViewer';

interface GradeData {
  id: string;
  attempt: number;
  accuracy: number;
  percentComplete: number;
  complete: boolean;
  data: any;
  feedback: any;
  moderationStatus: string | null;
  moderationFlags: any;
  moderationCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface GradeActionsProps {
  unit: { id: string; name: string; data: string };
  grades: GradeData[];
  studentName: string;
  moderation: { status: string | null; flags: any; checkedAt: string | null } | null;
}

export function GradeActions({ unit, grades: initialGrades, studentName, moderation: initialModeration }: GradeActionsProps) {
  const t = useTranslations('pages');
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionId = searchParams.get('sectionId');
  const gradeIds = searchParams.get('gradeIds')?.split(',') || [];
  const currentIndex = parseInt(searchParams.get('currentIndex') || '0', 10);
  const client = getAmplifyClient();

  const hasPrev = gradeIds.length > 0 && currentIndex > 0;
  const hasNext = gradeIds.length > 0 && currentIndex < gradeIds.length - 1;

  const navigateToGrade = useCallback((index: number) => {
    if (index < 0 || index >= gradeIds.length) return;
    const targetGradeId = gradeIds[index];
    const params = new URLSearchParams(searchParams.toString());
    params.set('currentIndex', String(index));
    router.replace(`/instructor/grade/${targetGradeId}?${params.toString()}`);
  }, [gradeIds, searchParams, router]);

  const handlePrev = useCallback(() => navigateToGrade(currentIndex - 1), [navigateToGrade, currentIndex]);
  const handleNext = useCallback(() => navigateToGrade(currentIndex + 1), [navigateToGrade, currentIndex]);

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (overrideOpen) return;
      if (e.key === 'ArrowLeft' && hasPrev) {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight' && hasNext) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasPrev, hasNext, handlePrev, handleNext]);


  const [grades, setGrades] = useState(initialGrades);
  const [moderation, setModeration] = useState(initialModeration);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideScore, setOverrideScore] = useState('');
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });

  const handleOverrideOpen = () => {
    const currentGrade = grades[0];
    setOverrideScore(currentGrade?.accuracy?.toString() || '');
    setOverrideOpen(true);
  };

  const handleOverrideClose = () => {
    setOverrideOpen(false);
    setOverrideScore('');
  };

  const handleOverrideSave = async () => {
    const score = parseFloat(overrideScore);
    if (isNaN(score) || score < 0 || score > 100) {
      setSnackbar({ open: true, message: 'Score must be between 0 and 100', severity: 'error' });
      return;
    }

    setOverrideSaving(true);
    try {
      const targetGrade = grades[0];
      if (!targetGrade) throw new Error('No grade to override');

      const { errors } = await client.models.Grade.update({
        id: targetGrade.id,
        accuracy: score,
        percentComplete: 100,
        complete: true,
      });

      if (errors?.length) throw new Error(errors[0].message);

      setGrades(prev => prev.map((g, i) =>
        i === 0 ? { ...g, accuracy: score, complete: true, percentComplete: 100 } : g
      ));

      setSnackbar({ open: true, message: `Grade updated to ${score}%`, severity: 'success' });
      handleOverrideClose();
    } catch (err: any) {
      console.error('[GradeActions] Override save error:', err);
      setSnackbar({ open: true, message: 'Failed to save grade override', severity: 'error' });
    } finally {
      setOverrideSaving(false);
    }
  };

  const handleModerationAction = useCallback(async (action: string, targetGradeId: string) => {
    try {
      if (action === 'approve') {
        await client.models.Grade.update({
          id: targetGradeId,
          moderationStatus: 'approved',
          moderationCheckedAt: new Date().toISOString(),
        });
        setModeration(prev => ({ ...prev, status: 'approved', checkedAt: new Date().toISOString(), flags: prev?.flags }));
        setSnackbar({ open: true, message: 'Content approved', severity: 'success' });
      } else if (action === 'flag') {
        await client.models.Grade.update({
          id: targetGradeId,
          moderationStatus: 'flagged',
          moderationCheckedAt: new Date().toISOString(),
        });
        setModeration(prev => ({ ...prev, status: 'flagged', checkedAt: new Date().toISOString(), flags: prev?.flags }));
        setSnackbar({ open: true, message: 'Content flagged', severity: 'warning' });
      }
    } catch (err: any) {
      console.error('[GradeActions] Moderation action error:', err);
      setSnackbar({ open: true, message: 'Moderation action failed', severity: 'error' });
    }
  }, [client]);

  const handleBack = () => {
    if (sectionId) {
      router.push(`/section/${sectionId}`);
    } else {
      router.back();
    }
  };

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
          <IconButton edge="start" onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          {gradeIds.length > 1 && (
            <Tooltip title="Previous student (←)">
              <span>
                <IconButton onClick={handlePrev} disabled={!hasPrev} size="small">
                  <NavigateBeforeIcon />
                </IconButton>
              </span>
            </Tooltip>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Grade Review — {studentName}
            {gradeIds.length > 1 && (
              <Typography component="span" variant="body2" sx={{ ml: 1, opacity: 0.7 }}>
                ({currentIndex + 1} of {gradeIds.length})
              </Typography>
            )}
          </Typography>
          {gradeIds.length > 1 && (
            <Tooltip title="Next student (→)">
              <span>
                <IconButton onClick={handleNext} disabled={!hasNext} size="small" sx={{ mr: 1 }}>
                  <NavigateNextIcon />
                </IconButton>
              </span>
            </Tooltip>
          )}
          <Button
            variant="outlined"
            color="primary"
            onClick={handleOverrideOpen}
            disabled={grades.length === 0}
          >
            Override Grade
          </Button>
        </MainToolbar>
      </AppBar>

      <Box sx={{ mt: '5rem', p: 2, maxWidth: '1400px', mx: 'auto' }}>
        {grades.length > 0 ? (
          <GradedWorkbookViewer
            contentJson={typeof unit.data === 'string' ? unit.data : JSON.stringify(unit.data)}
            studentName={studentName}
            grades={grades}
            moderation={moderation}
            onModerationAction={handleModerationAction}
            maxHeight="75vh"
          />
        ) : (
          <Alert severity="info">No grade data found for this submission.</Alert>
        )}
      </Box>

      {/* Grade Override Dialog */}
      <Dialog open={overrideOpen} onClose={handleOverrideClose}>
        <DialogTitle>Override Grade</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Student: <strong>{studentName}</strong><br />
            Unit: <strong>{unit?.name || '—'}</strong><br />
            Current Grade: <strong>{grades[0]?.accuracy != null ? `${Math.round(grades[0].accuracy)}%` : 'No grade'}</strong>
            <br /><br />
            Enter the new grade percentage (0–100):
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Grade (%)"
            type="number"
            fullWidth
            variant="outlined"
            value={overrideScore}
            onChange={(e) => setOverrideScore(e.target.value)}
            inputProps={{ min: 0, max: 100, step: 0.01 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleOverrideClose} disabled={overrideSaving}>Cancel</Button>
          <Button
            onClick={handleOverrideSave}
            variant="contained"
            color="primary"
            disabled={overrideSaving}
          >
            {overrideSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
