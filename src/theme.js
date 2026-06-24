import { createTheme } from '@mui/material/styles';
import { getThemeOptions } from './themes/editorThemes';

// Create the default theme instance using the shared palette definitions.
// ThemeRegistry uses this as the base; DynamicThemeProvider overrides it
// with the user's selected cosmetic theme at runtime.
const theme = createTheme({
  ...getThemeOptions('default'),
  components: {
    MuiAccordionSummary: {
      defaultProps: {
        slotProps: {
          content: { component: 'div' },
        },
      },
    },
  },
});

export default theme;
