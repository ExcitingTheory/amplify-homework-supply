import { createElement } from "react";
import Box from "@mui/material/Box";

interface RoundedCheckboxIconProps {
  checked?: boolean;
  indeterminate?: boolean;
}

export function RoundedCheckboxIcon({
  checked = false,
  indeterminate = false,
}: RoundedCheckboxIconProps) {
  return (
    <Box
      component="span"
      aria-hidden="true"
      sx={{
        width: 20,
        height: 20,
        borderRadius: "6px",
        border: "2px solid currentColor",
        bgcolor: "background.paper",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        flex: "0 0 auto",
        boxSizing: "border-box",
      }}
    >
      {(checked || indeterminate) && (
        <Box
          component="span"
          sx={{
            width: indeterminate ? 12 : 13,
            height: indeterminate ? 3 : 13,
            borderRadius: indeterminate ? "2px" : "3px",
            bgcolor: "currentColor",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
    </Box>
  );
}

export default RoundedCheckboxIcon;

/**
 * Shared icon elements so any MUI Checkbox — including the DataGrid `baseCheckbox`
 * slot, which does not inherit theme `defaultProps` — matches the app's rounded
 * checkbox. Spread into `Checkbox` props or `slotProps.baseCheckbox`.
 */
export const roundedCheckboxIcons = {
  icon: createElement(RoundedCheckboxIcon),
  checkedIcon: createElement(RoundedCheckboxIcon, { checked: true }),
  indeterminateIcon: createElement(RoundedCheckboxIcon, {
    indeterminate: true,
  }),
};
