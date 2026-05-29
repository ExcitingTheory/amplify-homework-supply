'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { getAmplifyClient } from '@/utils/amplifyClient';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Snackbar,
  Skeleton,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { GradedWorkbookViewer } from '@/components/GradedWorkbookViewer';

interface GradeRecord {
  id: string;
  owner: string;
  unitID: string;
  accuracy: number;
  percentComplete: number;
  complete: boolean;
}

interface GradeReviewDrawerProps {
  open: boolean;
  onClose: () => void;
  gradeId: string | null;
  unitId: string | null;
  studentName: string;
  /** Ordered list of grade IDs for next/prev navigation */
  gradeIds: string[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

function parseJson(value: any) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function GradeReviewDrawer({
  open,
  onClose,
  gradeId,
  unitId,
  studentName,
  gradeIds,
  currentIndex,
  onNavigate,
}: GradeReviewDrawerProps) {
  const t = useTranslations('pages');
  const client = getAmplifyClient();

  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState<{ id: string; name: string; data: string } | null>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [moderation, setModeration] = useState<any>(null);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideScore, setOverrideScore] = useState('');
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const hasPrev = gradeIds.length > 0 && currentIndex > 0;
  const hasNext = gradeIds.length > 0 && currentIndex < gradeIds.length - 1;

  // Load grade data when gradeId changes
  useEffect(() => {
    if (!open || !gradeId || !unitId) return;

    let cancelled = false;
    setLoading(true);

    async function loadGradeData() {
      try {
        const [gradeResult, unitResult] = await Promise.all([
          client.models.Grade.get({ id: gradeId! }),
          client.models.Unit.get({ id: unitId! }),
        ]);

        if (cancelled) return;

        const grade = gradeResult.data;
        const unitData = unitResult.data as any;

        if (!grade || !unitData) {
          setLoading(false);
          return;
        }

        setUnit({ id: unitData.id, name: unitData.name || '', data: unitData.data || '' });

        // Fetch all grades for this student + unit
        const listFilter: any = { unitID: { eq: unitId! } };
        if (grade.owner) {
          listFilter.owner = { eq: grade.owner };
        }
        const { data: allGrades } = await client.models.Grade.list({
          filter: listFilter,
        });

        if (cancelled) return;

        const sortedGrades = (allGrades || [])
          .filter((g: any) => g != null && g.id != null)
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((g: any, index: number, arr: any[]) => ({
            id: g.id,
            attempt: arr.length - index,
            accuracy: g.accuracy || 0,
            percentComplete: g.percentComplete || 0,
            complete: g.complete || false,
            data: parseJson(g.data),
            feedback: parseJson(g.feedback),
            moderationStatus: g.moderationStatus || null,
            moderationFlags: parseJson(g.moderationFlags) || null,
            moderationCheckedAt: g.moderationCheckedAt || null,
            createdAt: g.createdAt,
            updatedAt: g.updatedAt,
          }));

        setGrades(sortedGrades);

        const latest = sortedGrades[0];
        setModeration(latest ? { status: latest.moderationStatus, flags: latest.moderationFlags, checkedAt: latest.moderationCheckedAt } : null);
      } catch (err) {
        console.error('[GradeReviewDrawer] Load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadGradeData();
    return () => { cancelled = true; };
  }, [gradeId, unitId, open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (overrideOpen) return;
      if (e.key === 'ArrowLeft' && hasPrev) { e.preventDefault(); onNavigate(currentIndex - 1); }
      else if (e.key === 'ArrowRight' && hasNext) { e.preventDefault(); onNavigate(currentIndex + 1); }
      else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, hasPrev, hasNext, currentIndex, onNavigate, onClose, overrideOpen]);

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
      setGrades(prev => prev.map((g, i) => i === 0 ? { ...g, accuracy: score, complete: true, percentComplete: 100 } : g));
      setSnackbar({ open: true, message: `Grade updated to ${score}%`, severity: 'success' });
      setOverrideOpen(false);
    } catch (err: any) {
      setSnackbar({ open: true, message: 'Failed to save grade override', severity: 'error' });
    } finally {
      setOverrideSaving(false);
    }
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', md: '650px' }, maxWidth: '100vw' } }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <IconButton onClick={onClose} size="small" sx={{ mr: 1 }}>
            <CloseIcon />
          </IconButton>
          {gradeIds.length > 1 && (
            <Tooltip title="Previous (←)">
              <span>
                <IconButton onClick={() => onNavigate(currentIndex - 1)} disabled={!hasPrev} size="small">
                  <NavigateBeforeIcon />
                </IconButton>
              </span>
            </Tooltip>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1, mx: 1 }} noWrap>
            {studentName}
            {gradeIds.length > 1 && (
              <Typography component="span" variant="body2" sx={{ ml: 1, opacity: 0.7 }}>
                ({currentIndex + 1}/{gradeIds.length})
              </Typography>
            )}
          </Typography>
          {gradeIds.length > 1 && (
            <Tooltip title="Next (→)">
              <span>
                <IconButton onClick={() => onNavigate(currentIndex + 1)} disabled={!hasNext} size="small">
                  <NavigateNextIcon />
                </IconButton>
              </span>
            </Tooltip>
          )}
          <Button variant="outlined" size="small" onClick={() => { setOverrideScore(grades[0]?.accuracy?.toString() || ''); setOverrideOpen(true); }} disabled={grades.length === 0}>
            Override
          </Button>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {loading ? (
            <Box>
              <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 1 }} />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </Box>
          ) : grades.length > 0 && unit ? (
            <GradedWorkbookViewer
              contentJson={typeof unit.data === 'string' ? unit.data : JSON.stringify(unit.data)}
              studentName={studentName}
              grades={grades}
              moderation={moderation}
              onModerationAction={() => {}}
              maxHeight="calc(100vh - 120px)"
            />
          ) : (
            <Alert severity="info">No grade data found.</Alert>
          )}
        </Box>
      </Drawer>

      {/* Override Dialog */}
      <Dialog open={overrideOpen} onClose={() => setOverrideOpen(false)}>
        <DialogTitle>Override Grade</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Student: <strong>{studentName}</strong><br />
            Current: <strong>{grades[0]?.accuracy != null ? `${Math.round(grades[0].accuracy)}%` : '—'}</strong>
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
          <Button onClick={() => setOverrideOpen(false)} disabled={overrideSaving}>Cancel</Button>
          <Button onClick={handleOverrideSave} variant="contained" disabled={overrideSaving}>
            {overrideSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
}
