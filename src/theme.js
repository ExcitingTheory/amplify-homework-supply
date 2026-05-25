import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

// Create a theme instance with CSS variables and light/dark color schemes.
const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data-mui-color-scheme' },
  components: {
    MuiAccordionSummary: {
      defaultProps: {
        slotProps: {
          content: { component: 'div' },
        },
      },
    },
  },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#556cd6' },
        secondary: { main: '#19857b' },
        error: { main: red.A400 },
        background: {
          default: '#fafafa',
          paper: '#ffffff',
        },
        custom: {
          chatBubbleUser: '#e3f2fd',
          chatBubbleAssistant: '#f3f4f6',
          glassNavbar: 'rgba(255,255,255,0.72)',
          editorBackground: '#ffffff',
          codeBlock: '#f6f8fa',
          searchHighlight: '#ffeb3b',
          subtleBorder: '#e0e0e0',
        },
      },
    },
    dark: {
      palette: {
        primary: { main: '#7986cb' },
        secondary: { main: '#4db6ac' },
        error: { main: red.A200 },
        background: {
          default: '#121212',
          paper: '#1e1e1e',
        },
        text: {
          primary: '#e0e0e0',
          secondary: '#a0a0a0',
        },
        custom: {
          chatBubbleUser: '#1a2634',
          chatBubbleAssistant: '#2d2d2d',
          glassNavbar: 'rgba(30,30,30,0.85)',
          editorBackground: '#1e1e1e',
          codeBlock: '#161b22',
          searchHighlight: '#b8860b',
          subtleBorder: '#333333',
        },
      },
    },
  },
});

export default theme;
