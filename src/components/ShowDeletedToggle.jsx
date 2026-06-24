import React from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { useTranslations } from "next-intl";

/**
 * Inline toggle for showing/hiding soft-deleted items in list views.
 * Drop into any list view that provides showDeleted state from its context.
 */
export default function ShowDeletedToggle({ showDeleted, setShowDeleted }) {
  const t = useTranslations("components");

  return (
    <FormControlLabel
      control={
        <Switch
          size="small"
          checked={showDeleted}
          onChange={(e) => setShowDeleted(e.target.checked)}
        />
      }
      label={t("showDeletedItems", "Show deleted items")}
      sx={{ ml: 1 }}
    />
  );
}
