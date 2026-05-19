/**
 * Shared styled components for Editor3
 */

import { styled } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar from '@mui/material/AppBar';
import type { Theme } from '@mui/material/styles';
import { DRAWER_WIDTH } from './editorConfig';

/**
 * Mixin for opened drawer state
 */
export const openedMixin = (theme: Theme, width: number = DRAWER_WIDTH) => ({
  width: width,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden' as const,
});

/**
 * Mixin for closed drawer state
 */
export const closedMixin = (theme: Theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden' as const,
  width: '2.5rem', // Match vertical tabs width exactly
});

/**
 * Styled drawer header component
 */
export const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

/**
 * Styled app bar component
 */
export const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean }>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: DRAWER_WIDTH,
    width: `calc(100% - ${DRAWER_WIDTH}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

/**
 * Styled drawer component with dynamic width support
 */
export const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'drawerwidth',
})<{ open?: boolean; drawerwidth?: number }>(({ theme, open, drawerwidth = DRAWER_WIDTH }) => ({
  width: open ? drawerwidth : '2.5rem',
  flexShrink: 0,
  boxSizing: 'border-box',
  ...(open && {
    ...openedMixin(theme, drawerwidth),
    '& .MuiDrawer-paper': {
      ...openedMixin(theme, drawerwidth),
      position: 'relative',
      border: 'none',
    },
  }),
  ...(!open && {
    whiteSpace: 'nowrap',
    ...closedMixin(theme),
    '& .MuiDrawer-paper': {
      ...closedMixin(theme),
      position: 'relative',
      border: 'none',
    },
  }),
}));
