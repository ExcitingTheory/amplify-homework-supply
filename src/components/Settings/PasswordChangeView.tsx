"use client";
import React from "react";
import { useTranslations } from "next-intl";
import Card from "@mui/material/Card";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";

const CARD_SX = {
  padding: "2rem 1rem",
  margin: "1rem auto",
  height: "fit-content",
  maxWidth: "60rem",
} as const;

export interface PasswordChangeViewProps {
  /** Hidden autocomplete username (Cognito sub). */
  username?: string;
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  isWorking?: boolean;
  onOldPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmNewPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}

/**
 * PasswordChangeView — presentational change-password card. The Amplify
 * updatePassword call + validation live in the settings page.
 */
export function PasswordChangeView({
  username,
  oldPassword,
  newPassword,
  confirmNewPassword,
  isWorking = false,
  onOldPasswordChange,
  onNewPasswordChange,
  onConfirmNewPasswordChange,
  onSubmit,
}: PasswordChangeViewProps) {
  const t = useTranslations("pages");
  return (
    <Card sx={CARD_SX}>
      <h1>{t("profile.changePassword.heading")}</h1>
      <p>{t("profile.changePassword.description")}</p>
      <form onSubmit={onSubmit}>
        <FormControl fullWidth>
          <input
            type="text"
            name="username"
            value={username || ""}
            autoComplete="username"
            style={{ display: "none" }}
            readOnly
            aria-hidden="true"
          />

          <TextField
            label="Old Password"
            type="password"
            value={oldPassword}
            onChange={(event) => onOldPasswordChange(event.target.value)}
            required
            sx={{ mb: 2 }}
            autoComplete="current-password"
          />

          <TextField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(event) => onNewPasswordChange(event.target.value)}
            required
            sx={{ mb: 2 }}
            autoComplete="new-password"
          />

          <TextField
            label="Confirm New Password"
            type="password"
            value={confirmNewPassword}
            onChange={(event) => onConfirmNewPasswordChange(event.target.value)}
            required
            sx={{ mb: 2 }}
            autoComplete="new-password"
          />

          <Button
            variant="contained"
            color="primary"
            disabled={isWorking}
            type="submit"
          >
            {isWorking && (
              <Skeleton variant="circular" width={24} height={24} />
            )}
            &nbsp;{t("profile.changePassword.button")}
          </Button>
        </FormControl>
      </form>
    </Card>
  );
}

export default PasswordChangeView;
