/**
 * ToolCallPreview - Displays tool call parameters with confirmation UI
 * 
 * Shows a preview of tool call parameters before execution, allowing users to:
 * - View all parameters that will be sent
 * - Edit parameters if needed
 * - Confirm or cancel tool execution
 * 
 * @module ChatSidebar/ToolCallPreview
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface ToolParameter {
  name: string;
  value: any;
  type: string;
  description?: string;
  required?: boolean;
  editable?: boolean;
}

interface ToolCallPreviewProps {
  toolName: string;
  toolCallId: string;
  parameters: Record<string, any>;
  toolDefinition?: {
    description?: string;
    parameters?: {
      properties?: Record<string, { type: string; description?: string; enum?: string[] }>;
      required?: string[];
    };
  };
  state?: 'pending' | 'confirmed' | 'executing' | 'executed' | 'error';
  onConfirm?: (params: Record<string, any>) => void;
  onCancel?: () => void;
  onEdit?: (params: Record<string, any>) => void;
  compact?: boolean;
}

/**
 * ToolCallPreview Component
 * 
 * Renders a preview card for a tool call showing:
 * - Tool name and description
 * - All parameters with types and values
 * - Edit capability for parameters
 * - Confirm/Cancel buttons
 */
export const ToolCallPreview: React.FC<ToolCallPreviewProps> = ({
  toolName,
  toolCallId,
  parameters,
  toolDefinition,
  state = 'pending',
  onConfirm,
  onCancel,
  onEdit,
  compact = false,
}) => {
  const { t } = useTranslation('components');
  const [isEditing, setIsEditing] = useState(false);
  const [editedParams, setEditedParams] = useState(parameters);
  const [expanded, setExpanded] = useState(!compact);

  const paramDefinitions = toolDefinition?.parameters?.properties || {};
  const requiredParams = toolDefinition?.parameters?.required || [];

  const handleParameterChange = (paramName: string, value: any) => {
    const updated = { ...editedParams, [paramName]: value };
    setEditedParams(updated);
    onEdit?.(updated);
  };

  const handleConfirm = () => {
    onConfirm?.(editedParams);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedParams(parameters);
    setIsEditing(false);
  };

  const getToolIcon = (name: string) => {
    const icons: Record<string, string> = {
      search_content: '🔍',
      create_section: '➕',
      create_unit: '📚',
      create_assignment: '📝',
      add_timer_to_unit: '⏱️',
      create_vocabulary_word: '📖',
      create_question: '❓',
      list_sections: '📋',
      list_units: '📚',
      get_unit_details: 'ℹ️',
      update_unit: '✏️',
      delete_assignment: '🗑️',
      generate_unit_content: '✨',
    };
    return icons[name] || '🔧';
  };

  const getStateColor = (currentState: string) => {
    switch (currentState) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'executing': return 'info';
      case 'executed': return 'success';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStateLabel = (currentState: string) => {
    switch (currentState) {
      case 'pending': return t('chatSidebar.toolCallPreview.stateLabels.pending');
      case 'confirmed': return t('chatSidebar.toolCallPreview.stateLabels.confirmed');
      case 'executing': return t('chatSidebar.toolCallPreview.stateLabels.executing');
      case 'executed': return t('chatSidebar.toolCallPreview.stateLabels.executed');
      case 'error': return t('chatSidebar.toolCallPreview.stateLabels.error');
      default: return currentState;
    }
  };

  const renderParameterValue = (paramName: string, value: any, def: any) => {
    const isRequired = requiredParams.includes(paramName);
    const paramType = def?.type || typeof value;
    
    if (isEditing && state === 'pending') {
      // Render editable input based on type
      if (def?.enum) {
        return (
          <TextField
            select
            fullWidth
            size="small"
            value={editedParams[paramName] || ''}
            onChange={(e) => handleParameterChange(paramName, e.target.value)}
            SelectProps={{ native: true }}
            required={isRequired}
          >
            <option value="">{t('chatSidebar.toolCallPreview.selectPlaceholder')}</option>
            {def.enum.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </TextField>
        );
      }
      
      if (paramType === 'number') {
        return (
          <TextField
            fullWidth
            size="small"
            type="number"
            value={editedParams[paramName] || ''}
            onChange={(e) => handleParameterChange(paramName, Number(e.target.value))}
            required={isRequired}
          />
        );
      }
      
      if (paramType === 'boolean') {
        return (
          <TextField
            select
            fullWidth
            size="small"
            value={String(editedParams[paramName])}
            onChange={(e) => handleParameterChange(paramName, e.target.value === 'true')}
            SelectProps={{ native: true }}
          >
            <option value="true">{t('chatSidebar.toolCallPreview.true')}</option>
            <option value="false">{t('chatSidebar.toolCallPreview.false')}</option>
          </TextField>
        );
      }
      
      // Default to text input
      return (
        <TextField
          fullWidth
          size="small"
          multiline={String(value).length > 50}
          rows={String(value).length > 50 ? 3 : 1}
          value={editedParams[paramName] || ''}
          onChange={(e) => handleParameterChange(paramName, e.target.value)}
          required={isRequired}
        />
      );
    }

    // Display-only mode
    if (typeof value === 'object') {
      return (
        <pre style={{ 
          margin: 0, 
          fontSize: '0.75rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }
    
    return (
      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
        {String(value)}
      </Typography>
    );
  };

  return (
    <Paper
      elevation={2}
      sx={{
        mb: 2,
        border: 2,
        borderColor: `${getStateColor(state)}.main`,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            bgcolor: `${getStateColor(state)}.light`,
            '&:hover': { bgcolor: `${getStateColor(state)}.light` },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
              {getToolIcon(toolName)} {toolName.replace(/_/g, ' ')}
            </Typography>
            <Chip
              label={getStateLabel(state)}
              size="small"
              color={getStateColor(state)}
              sx={{ ml: 'auto' }}
            />
          </Box>
        </AccordionSummary>
        
        <AccordionDetails>
          {toolDefinition?.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
              {toolDefinition.description}
            </Typography>
          )}

          <Stack spacing={2}>
            {Object.entries(editedParams).map(([paramName, value]) => {
              const paramDef = paramDefinitions[paramName];
              const isRequired = requiredParams.includes(paramName);

              return (
                <Box key={paramName}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      {paramName}
                    </Typography>
                    {isRequired && (
                      <Chip label="required" size="small" color="error" sx={{ height: 16, fontSize: '0.6rem' }} />
                    )}
                    <Typography variant="caption" sx={{ color: 'text.disabled', ml: 'auto' }}>
                      {paramDef?.type || typeof value}
                    </Typography>
                  </Box>
                  
                  {paramDef?.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      {paramDef.description}
                    </Typography>
                  )}
                  
                  {renderParameterValue(paramName, value, paramDef)}
                </Box>
              );
            })}
          </Stack>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: 'flex-end' }}>
            {state === 'pending' && !isEditing && (
              <>
                <Tooltip title={t('chatSidebar.editParameters')}>
                  <IconButton
                    size="small"
                    onClick={() => setIsEditing(true)}
                    color="primary"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CloseIcon />}
                  onClick={onCancel}
                >
                  {t('chatSidebar.cancel')}
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleConfirm}
                  color="primary"
                >
                  {t('chatSidebar.execute')}
                </Button>
              </>
            )}

            {state === 'pending' && isEditing && (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CloseIcon />}
                  onClick={handleCancelEdit}
                >
                  {t('chatSidebar.cancelEdit')}
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<CheckIcon />}
                  onClick={handleConfirm}
                  color="success"
                >
                  {t('chatSidebar.confirmAndExecute')}
                </Button>
              </>
            )}

            {state === 'executing' && (
              <Chip
                label={t('chatSidebar.toolCallPreview.stateLabels.executing')}
                color="info"
                size="small"
                sx={{ animation: 'pulse 1.5s ease-in-out infinite' }}
              />
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default ToolCallPreview;
