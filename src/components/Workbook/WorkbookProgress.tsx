/**
 * Workbook Progress Indicator
 * 
 * Shows completion and accuracy stats from collaborative workbook
 */

import React from 'react';
import { Box, LinearProgress, Typography, Paper } from '@mui/material';
import { CheckCircle, TrendingUp } from '@mui/icons-material';
import UnitContext from '../../context/unitContext';

export interface WorkbookProgressProps {
  /**
   * Show detailed stats or just progress bar
   * @default false
   */
  detailed?: boolean;
  
  /**
   * Component variant
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'detailed';
}

export function WorkbookProgress({ 
  detailed = false,
  variant = 'default',
}: WorkbookProgressProps) {
  const { workbookStats, workbookEnabled, workbook } = React.useContext(UnitContext);

  // Don't show if feature disabled or no workbook
  if (!workbookEnabled || !workbook?.provider) {
    return null;
  }

  const { completion, accuracy, totalBlocks, completeBlocks } = workbookStats || {
    completion: 0,
    accuracy: 0,
    totalBlocks: 0,
    completeBlocks: 0,
  };

  if (variant === 'compact') {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CheckCircle 
          sx={{ 
            fontSize: 16, 
            color: completion === 100 ? 'success.main' : 'text.secondary' 
          }} 
        />
        <Typography variant="caption" color="text.secondary">
          {completeBlocks}/{totalBlocks} complete
        </Typography>
      </Box>
    );
  }

  if (variant === 'detailed') {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Progress
        </Typography>
        
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" color="text.secondary">
              Completion
            </Typography>
            <Typography variant="caption" fontWeight="medium">
              {Math.round(completion)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={completion}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Box>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" color="text.secondary">
              Accuracy
            </Typography>
            <Typography variant="caption" fontWeight="medium">
              {Math.round(accuracy)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={accuracy}
            color={accuracy >= 80 ? 'success' : accuracy >= 60 ? 'warning' : 'error'}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {completeBlocks} of {totalBlocks} questions
          </Typography>
          
          {completion === 100 && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="caption" color="success.main" fontWeight="medium">
                Complete!
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    );
  }

  // Default variant
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={1}>
        <Typography variant="body2" fontWeight="medium">
          Progress: {completeBlocks}/{totalBlocks}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {Math.round(completion)}%
        </Typography>
      </Box>
      
      <LinearProgress
        variant="determinate"
        value={completion}
        sx={{ height: 6, borderRadius: 3 }}
      />

      {detailed && accuracy > 0 && (
        <Box display="flex" alignItems="center" gap={0.5} mt={1}>
          <TrendingUp sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            Accuracy: {Math.round(accuracy)}%
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default WorkbookProgress;
