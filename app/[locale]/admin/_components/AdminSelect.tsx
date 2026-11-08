"use client";

import * as React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

export interface AdminSelectOption<T extends string | number> {
  value: T;
  label: string;
}

export interface AdminSelectProps<T extends string | number> {
  label: string;
  value: T;
  options: ReadonlyArray<AdminSelectOption<T>>;
  onChange: (value: T) => void;
  minWidth?: number;
  disabled?: boolean;
}

/**
 * Searchable replacement for a MUI `<Select>` over a fixed option list.
 * The value is never cleared (filters always have a default option), but
 * typing narrows the list and the full text is selected on focus so a new
 * search replaces the current label immediately.
 */
export default function AdminSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
  minWidth = 180,
  disabled = false,
}: AdminSelectProps<T>) {
  const selected = React.useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );

  return (
    <Autocomplete<AdminSelectOption<T>, false, true>
      size="small"
      disableClearable
      autoHighlight
      selectOnFocus
      openOnFocus
      disabled={disabled}
      options={options as AdminSelectOption<T>[]}
      value={selected as AdminSelectOption<T>}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(a, b) => a.value === b.value}
      onChange={(_, option) => onChange(option.value)}
      sx={{ minWidth }}
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
}
