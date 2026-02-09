/**
 * ComponentTreeView - Hierarchical component tree visualization
 * 
 * Displays registered React components with expandable details
 */

import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  Divider,
  Stack,
  Collapse,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { ComponentTreeViewProps } from './types';
import { ComponentMetadata } from '../../utils/debug/ComponentTreeStore';

/**
 * Individual component item with expand/collapse
 */
interface ComponentItemProps {
  component: ComponentMetadata;
  isSelected: boolean;
  onSelect: (component: ComponentMetadata) => void;
}

function ComponentItem({ component, isSelected, onSelect }: ComponentItemProps) {
  const [expanded, setExpanded] = useState(false);

  const hasChildren = component.children && component.children.length > 0;

  return (
    <>
      <ListItemButton
        selected={isSelected}
        onClick={() => {
          onSelect(component);
          setExpanded(!expanded);
        }}
        sx={{ pl: 2 }}
      >
        {hasChildren && (
          <Box sx={{ mr: 1 }}>
            {expanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
          </Box>
        )}
        <ListItemText
          primary={
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" fontWeight="medium">
                {component.name}
              </Typography>
              <Chip label={`×${component.renderCount}`} size="small" />
            </Stack>
          }
          secondary={
            <Typography variant="caption" color="text.secondary">
              {new Date(component.mountTime).toLocaleTimeString()}
            </Typography>
          }
        />
      </ListItemButton>

      {isSelected && (
        <Collapse in={isSelected}>
          <Box sx={{ pl: 4, pr: 2, py: 1, bgcolor: 'action.hover' }}>
            <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
              Props
            </Typography>
            <pre style={{ fontSize: 10, margin: 0, overflow: 'auto', maxHeight: 150 }}>
              {JSON.stringify(component.props, null, 2)}
            </pre>

            {component.state && (
              <>
                <Typography variant="caption" fontWeight="bold" display="block" sx={{ mt: 1 }} gutterBottom>
                  State
                </Typography>
                <pre style={{ fontSize: 10, margin: 0, overflow: 'auto', maxHeight: 150 }}>
                  {JSON.stringify(component.state, null, 2)}
                </pre>
              </>
            )}

            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Last render: {new Date(component.lastRenderTime).toLocaleTimeString()}
            </Typography>
          </Box>
        </Collapse>
      )}
    </>
  );
}

/**
 * ComponentTreeView component
 */
export function ComponentTreeView({ tree, onSelectComponent, selectedId }: ComponentTreeViewProps) {
  const [selected, setSelected] = useState<string | null>(selectedId || null);

  const handleSelect = (component: ComponentMetadata) => {
    setSelected(component.id);
    onSelectComponent?.(component);
  };

  if (tree.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No components registered
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          Use useComponentInspector() hook to register components
        </Typography>
      </Box>
    );
  }

  // Group components by name for better visualization
  const groupedComponents = tree.reduce((acc, component) => {
    if (!acc[component.name]) {
      acc[component.name] = [];
    }
    acc[component.name].push(component);
    return acc;
  }, {} as Record<string, ComponentMetadata[]>);

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Chip label={`${tree.length} components`} size="small" color="primary" />
        <Chip label={`${Object.keys(groupedComponents).length} types`} size="small" variant="outlined" />
      </Stack>

      <List dense>
        {Object.entries(groupedComponents).map(([componentName, components], groupIndex) => (
          <Box key={componentName}>
            {groupIndex > 0 && <Divider />}
            <ListItem>
              <ListItemText
                primary={
                  <Typography variant="subtitle2">
                    {componentName}
                    {components.length > 1 && ` (${components.length} instances)`}
                  </Typography>
                }
              />
            </ListItem>
            {components.map((component) => (
              <ComponentItem
                key={component.id}
                component={component}
                isSelected={selected === component.id}
                onSelect={handleSelect}
              />
            ))}
          </Box>
        ))}
      </List>
    </Box>
  );
}

export default ComponentTreeView;
