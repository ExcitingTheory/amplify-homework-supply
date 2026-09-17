"use client";
import React from "react";
import { useTranslations } from "next-intl";
import Card from "@mui/material/Card";
import Alert from "@mui/material/Alert";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import Skeleton from "@mui/material/Skeleton";

const CARD_SX = {
  padding: "2rem 1rem",
  margin: "1rem auto",
  height: "fit-content",
  maxWidth: "60rem",
} as const;

export interface ProfileInfoViewProps {
  email: string;
  name: string;
  /** Hidden autocomplete username (Cognito sub). */
  username?: string;
  /** Displayed, read-only user id. */
  userSub?: string;
  identityId?: string;
  isWorking?: boolean;
  errorMessage?: string;
  onEmailChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
  // Email-change confirmation modal
  needsConfirmation?: boolean;
  confirmationCode?: string;
  onConfirmationCodeChange?: (value: string) => void;
  onConfirmationSubmit?: (event: React.FormEvent) => void;
  onConfirmationClose?: () => void;
}

/**
 * ProfileInfoView — presentational profile info card (email / name / ids) plus
 * the email-change confirmation modal. Auth logic lives in the settings page.
 */
export function ProfileInfoView({
  email,
  name,
  username,
  userSub,
  identityId,
  isWorking = false,
  errorMessage,
  onEmailChange,
  onNameChange,
  onSubmit,
  onCancel,
  needsConfirmation = false,
  confirmationCode = "",
  onConfirmationCodeChange,
  onConfirmationSubmit,
  onConfirmationClose,
}: ProfileInfoViewProps) {
  const t = useTranslations("pages");
  return (
    <Card sx={CARD_SX}>
      <h1>{t("settings.profileInfo.heading")}</h1>
      <p>{t("settings.profileInfo.description")}</p>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

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
            id="settings-email"
            label="Email"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            required
            sx={{ mb: 2 }}
            autoComplete="email"
          />

          <TextField
            id="settings-name"
            label={t("profile.name")}
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            sx={{ mb: 2 }}
            autoComplete="name"
          />

          <Typography
            component="label"
            htmlFor="settings-user-id"
            sx={{ mb: 1, display: "block" }}
          >
            {t("profile.userId")}
          </Typography>

          <TextField
            id="settings-user-id"
            type="text"
            value={userSub || ""}
            disabled
            sx={{ mb: 2 }}
          />

          <Typography
            component="label"
            htmlFor="settings-identity-id"
            sx={{ mb: 1, display: "block" }}
          >
            {t("profile.identityId")}
          </Typography>

          <TextField
            id="settings-identity-id"
            type="text"
            value={identityId || ""}
            disabled
            sx={{ mb: 2 }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Button
              variant="outlined"
              color="inherit"
              disabled={isWorking}
              onClick={onCancel}
            >
              {t("profile.cancel")}
            </Button>

            <Button
              variant="contained"
              color="primary"
              disabled={isWorking}
              type="submit"
            >
              {isWorking && (
                <Skeleton variant="circular" width={24} height={24} />
              )}
              &nbsp;{t("profile.updateProfile")}
            </Button>
          </div>
        </FormControl>
      </form>

      <Modal
        open={needsConfirmation}
        onClose={onConfirmationClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Card
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography id="modal-modal-title" variant="h6" component="h2">
            {t("profile.confirmEmail.title")}
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            {t("profile.confirmEmail.message")}
          </Typography>

          <br />

          <form onSubmit={onConfirmationSubmit}>
            <FormControl fullWidth>
              <TextField
                id="settings-confirmation-code"
                label="Confirmation Code"
                type="text"
                value={confirmationCode}
                onChange={(event) =>
                  onConfirmationCodeChange?.(event.target.value)
                }
                required
                sx={{ mb: 2 }}
              />

              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  disabled={isWorking}
                  type="submit"
                >
                  {isWorking && (
                    <Skeleton variant="circular" width={24} height={24} />
                  )}
                  &nbsp;{t("profile.confirmEmail.button")}
                </Button>
              </div>
            </FormControl>
          </form>
        </Card>
      </Modal>
    </Card>
  );
}

export default ProfileInfoView;
