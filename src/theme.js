import { createTheme } from "@mui/material/styles";
import {
  getThemeOptions,
  sharedComponentOverrides,
} from "./themes/editorThemes";

// Create the default theme instance using the shared palette definitions.
// ThemeRegistry uses this as the base; DynamicThemeProvider overrides it
// with the user's selected cosmetic theme at runtime.
const theme = createTheme({
  ...getThemeOptions("default"),
  components: sharedComponentOverrides,
});

export default theme;
