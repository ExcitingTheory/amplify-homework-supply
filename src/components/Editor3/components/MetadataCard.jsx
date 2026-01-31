/**
 * MetadataCard Component
 * 
 * Reusable card for displaying and editing metadata
 * Based on VocabularyReview2 expand/collapse pattern
 * 
 * Props:
 * - title: Card title
 * - items: Array of {label, value, editable, onSave} objects
 * - readOnlyInfo: Array of {label, value} for read-only display
 * - isExpanded: Whether card is expanded
 * - onToggleExpand: Callback for expand/collapse
 * - isEditing: Whether in edit mode
 * - onToggleEdit: Callback for edit mode toggle
 * - onSave: Callback for saving changes
 */

import React from 'react';
import {
    Box,
    Typography,
    Button,
    IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import MetadataField from './MetadataField';

function MetadataCard({
    title,
    items = [],
    readOnlyInfo = [],
    isExpanded = false,
    onToggleExpand,
    isEditing = false,
    onToggleEdit,
    onSave,
    onCancel,
}) {
    return (
        <Box
            sx={{
                backgroundColor: isEditing ? 'warning.50' : 'grey.50',
                borderRadius: 1,
                borderLeft: '4px solid',
                borderLeftColor: isEditing ? 'warning.main' : 'divider',
                mb: 2,
            }}
        >
            {/* Header */}
            <Box
                onClick={() => onToggleExpand?.()}
                sx={{
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'action.hover', borderRadius: '4px 4px 0 0' },
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <IconButton
                        size="small"
                        sx={{ p: 0 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand?.();
                        }}
                    >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {title}
                    </Typography>
                </Box>
                {!isEditing && (
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleEdit?.();
                        }}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>

            {/* Expanded Content */}
            {isExpanded && (
                <Box sx={{ p: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                    {/* Editable Fields */}
                    {items.map((item, index) => (
                        <MetadataField
                            key={index}
                            label={item.label}
                            value={item.value}
                            field={item.field || item.label}
                            onSave={item.onSave || onSave}
                            placeholder={item.placeholder}
                            multiline={item.multiline}
                            disabled={!isEditing || item.disabled}
                            required={item.required}
                        />
                    ))}

                    {/* Read-only Info */}
                    {readOnlyInfo.length > 0 && (
                        <Box
                            sx={{
                                mt: 2,
                                pt: 2,
                                borderTop: '1px solid',
                                borderColor: 'divider',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                gap: 1.5,
                            }}
                        >
                            {readOnlyInfo.map((info, index) => (
                                <Box key={index}>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        display="block"
                                        sx={{ fontWeight: 500, mb: 0.25 }}
                                    >
                                        {info.label}
                                    </Typography>
                                    <Typography variant="caption" sx={{ wordBreak: 'break-word' }}>
                                        {info.value}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    )}

                    {/* Action Buttons */}
                    {isEditing && (
                        <Box
                            sx={{
                                mt: 2,
                                pt: 1.5,
                                display: 'flex',
                                gap: 1,
                                justifyContent: 'flex-end',
                                borderTop: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                    onCancel?.();
                                    onToggleEdit?.();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="small"
                                variant="contained"
                                onClick={() => {
                                    onSave?.();
                                    onToggleEdit?.();
                                }}
                            >
                                Save
                            </Button>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
}

export default MetadataCard;
