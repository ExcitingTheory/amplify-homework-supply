"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";

import {
  fetchUserAttributes,
  updateUserAttribute,
  updatePassword,
  fetchAuthSession,
  confirmUserAttribute,
} from "aws-amplify/auth";

import FormControl from "@mui/material/FormControl";
import StorageManagement from "@/components/StorageManagement";
import { CosmeticSelector } from "@/components/Gamification/CosmeticSelector";
import { BotCustomizer } from "@/components/BotCustomizer";
import { useXP, useBadges } from "@/context/gamificationContext";
import { GamificationProviderWrapper } from "@/context/gamificationProviderWrapper";
import { getAmplifyClient } from "@/utils/amplifyClient";

import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { useChatPageContext } from "@/hooks/useChatPageContext";
import {
  getSettingsErrorMessage,
  validatePasswordChange,
} from "@/utils/settingsValidation";

import Button from "@mui/material/Button";
import {
  Skeleton,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  MenuItem,
  Select,
  InputLabel,
} from "@mui/material";
import SettingsContext from "@/context/settingsContext";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";

function Settings() {
  const t = useTranslations("pages");
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const [user, setUser] = React.useState({});
  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmNewPassword, setConfirmNewPassword] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [selectedLocale, setSelectedLocale] = React.useState(locale || "en");
  const [isWorking, setIsWorking] = React.useState(false);
  const [needsConfirmation, setNeedsConfirmation] = React.useState(false);
  const [confirmationCode, setConfirmationCode] = React.useState("");
  const [identityId, setIdentityId] = React.useState("");

  const [successMessage, setSuccessMessage] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [clearDataStoreDialogOpen, setClearDataStoreDialogOpen] =
    React.useState(false);
  const { settings, updateSettings } = React.useContext(SettingsContext) || {};

  useChatPageContext({});
  const { level } = useXP();

  // Compute Bot Whisperer tier from earned badges
  const { badges: earnedBadges } = useBadges();
  const botWhispererTier = React.useMemo(() => {
    const bwBadges = earnedBadges.filter((b) =>
      b.badgeType?.startsWith("BOT_WHISPERER"),
    );
    let maxTier = 0;
    for (const b of bwBadges) {
      if (b.badgeType === "BOT_WHISPERER_IV") maxTier = Math.max(maxTier, 4);
      else if (b.badgeType === "BOT_WHISPERER_III")
        maxTier = Math.max(maxTier, 3);
      else if (b.badgeType === "BOT_WHISPERER_II")
        maxTier = Math.max(maxTier, 2);
      else if (b.badgeType === "BOT_WHISPERER_I")
        maxTier = Math.max(maxTier, 1);
    }
    return maxTier;
  }, [earnedBadges]);

  const availableLocales = [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "ja", name: "日本語" },
    { code: "zh", name: "中文" },
  ];

  const updateEmailConfirmation = async (event) => {
    setIsWorking(true);
    event.preventDefault();
    setErrorMessage("");

    try {
      await confirmUserAttribute({
        userAttributeKey: "email",
        confirmationCode,
      });
      setNeedsConfirmation(false);
      setSuccessMessage("Email updated successfully");
    } catch (error) {
      setErrorMessage(getSettingsErrorMessage(error));
    } finally {
      setIsWorking(false);
    }
  };

  const updateEmail = async (event) => {
    setIsWorking(true);
    event.preventDefault();
    setErrorMessage("");

    if (email !== user?.email) {
      try {
        await updateUserAttribute({
          userAttribute: {
            attributeKey: "email",
            value: email,
          },
        });
        setNeedsConfirmation(true);
      } catch (error) {
        setErrorMessage(getSettingsErrorMessage(error));
      } finally {
        setIsWorking(false);
      }
    } else {
      setIsWorking(false);
    }
  };

  const updateUser = async (event) => {
    setIsWorking(true);
    event.preventDefault();
    setErrorMessage("");

    const didUpdateEmail = email !== user?.email;
    const didUpdateName = name !== user?.name;
    if (didUpdateEmail || didUpdateName) {
      try {
        if (didUpdateEmail) {
          await updateUserAttribute({
            userAttribute: {
              attributeKey: "email",
              value: email,
            },
          });
          setNeedsConfirmation(true);
        }
        if (didUpdateName) {
          await updateUserAttribute({
            userAttribute: {
              attributeKey: "name",
              value: name,
            },
          });
        }
        setUser((currentUser) => ({ ...currentUser, email, name }));
        setSuccessMessage(
          didUpdateEmail
            ? "Verification email sent."
            : "User updated successfully",
        );
      } catch (error) {
        setErrorMessage(getSettingsErrorMessage(error));
        setIsWorking(false);
        return;
      }
    }

    setSuccessMessage("User updated successfully");
    setIsWorking(false);
  };

  const changePassword = async (event) => {
    setIsWorking(true);
    event.preventDefault();
    setErrorMessage("");

    const passwordValidation = validatePasswordChange({
      oldPassword,
      newPassword,
      confirmNewPassword,
    });

    if (!passwordValidation.isValid) {
      setErrorMessage(passwordValidation.message);
      setIsWorking(false);
      return;
    }

    try {
      await updatePassword({ oldPassword, newPassword });
      setSuccessMessage("Password changed successfully");
    } catch (error) {
      setErrorMessage(getSettingsErrorMessage(error));
    } finally {
      setIsWorking(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    }
  };

  const handleClearDataStore = async () => {
    setIsWorking(true);
    setClearDataStoreDialogOpen(false);
    setErrorMessage("");

    try {
      console.log("Reloading page to clear cache...");
      setSuccessMessage("Clearing cache and reloading...");

      sessionStorage.clear();

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      setErrorMessage(
        "Error clearing cache: " + getSettingsErrorMessage(error),
      );
      setIsWorking(false);
    }
  };

  const handleLocaleChange = async (event) => {
    const newLocale = event.target.value;
    setSelectedLocale(newLocale);
    setErrorMessage("");

    try {
      localStorage.setItem("preferredLocale", newLocale);

      await router.push(`/${newLocale}${pathname}`);

      setSuccessMessage(t("profile.languagePreference.changeSuccess"));
    } catch (error) {
      console.error("Error changing locale:", error);
      setErrorMessage(
        "Error changing language: " + getSettingsErrorMessage(error),
      );
    }
  };

  React.useEffect(() => {
    fetchUser();
    async function fetchUser() {
      const userAttributes = await fetchUserAttributes();
      const { identityId } = await fetchAuthSession();
      setUser(userAttributes);
      setName(userAttributes?.name || "");
      setEmail(userAttributes?.email || "");
      setUsername(userAttributes?.sub || "");
      setIdentityId(identityId);

      const savedLocale = localStorage.getItem("preferredLocale");
      if (savedLocale && locale !== savedLocale) {
        setSelectedLocale(savedLocale);
      } else {
        setSelectedLocale(locale || "en");
      }
    }
  }, []);

  React.useEffect(() => {
    if (successMessage) {
      const timeout = setTimeout(() => {
        setSuccessMessage("");
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [successMessage]);

  React.useEffect(() => {
    if (errorMessage) {
      const timeout = setTimeout(() => {
        setErrorMessage("");
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [errorMessage]);

  return (
    <>
      <Box
        data-tour="settings-page"
        sx={{
          marginTop: "1rem",
          marginBottom: "3rem",
          padding: "1rem",
          maxWidth: "60rem",
          marginLeft: "auto",
          marginRight: "auto",
          overflow: "auto",
        }}
      >
        <Snackbar
          open={Boolean(successMessage)}
          autoHideDuration={10000}
          onClose={() => setSuccessMessage("")}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity="success" onClose={() => setSuccessMessage("")}>
            {successMessage}
          </Alert>
        </Snackbar>
        <Snackbar
          open={Boolean(errorMessage)}
          autoHideDuration={10000}
          onClose={() => setErrorMessage("")}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity="error" onClose={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        </Snackbar>
        <Card
          sx={{
            padding: "2rem 1rem",
            margin: "1rem auto",
            height: "fit-content",
            maxWidth: "60rem",
          }}
        >
          <h1>{t("settings.profileInfo.heading")}</h1>
          <p>{t("settings.profileInfo.description")}</p>

          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <form onSubmit={updateUser}>
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
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
                required
                sx={{ mb: 2 }}
                autoComplete="email"
              />

              <TextField
                id="settings-name"
                label={t("profile.name", { defaultMessage: "Name" })}
                value={name}
                onChange={(event) => setName(event.target.value)}
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
                value={user?.sub || ""}
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
                  variant="contained"
                  color="error"
                  disabled={isWorking}
                  onClick={() => {
                    setName(user?.name || "");
                    setEmail(user?.email || "");
                  }}
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
            onClose={() => {
              setNeedsConfirmation(false);
            }}
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

              <form onSubmit={updateEmailConfirmation}>
                <FormControl fullWidth>
                  <TextField
                    id="settings-confirmation-code"
                    label="Confirmation Code"
                    type="text"
                    value={confirmationCode}
                    onChange={(event) => {
                      setConfirmationCode(event.target.value);
                    }}
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

        <Card
          sx={{
            padding: "2rem 1rem",
            margin: "1rem auto",
            height: "fit-content",
            maxWidth: "60rem",
          }}
        >
          <h1>{t("profile.changePassword.heading")}</h1>
          <p>{t("profile.changePassword.description")}</p>
          <form onSubmit={changePassword}>
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
                onChange={(event) => {
                  setOldPassword(event.target.value);
                }}
                required
                sx={{ mb: 2 }}
                autoComplete="current-password"
              />

              <TextField
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                }}
                required
                sx={{ mb: 2 }}
                autoComplete="new-password"
              />

              <TextField
                label="Confirm New Password"
                type="password"
                value={confirmNewPassword}
                onChange={(event) => {
                  setConfirmNewPassword(event.target.value);
                }}
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

        <Card
          sx={{
            padding: "2rem 1rem",
            margin: "1rem auto",
            height: "fit-content",
            maxWidth: "60rem",
          }}
        >
          <h1>{t("profile.languagePreference.heading")}</h1>
          <p>{t("profile.languagePreference.description")}</p>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="locale-select-label">
              {t("profile.languagePreference.selectLanguage")}
            </InputLabel>
            <Select
              labelId="locale-select-label"
              id="locale-select"
              value={selectedLocale}
              label={t("profile.languagePreference.selectLanguage")}
              onChange={handleLocaleChange}
            >
              {availableLocales.map((locale) => (
                <MenuItem key={locale.code} value={locale.code}>
                  {locale.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Card>

        <Card
          sx={{
            padding: "2rem 1rem",
            margin: "1rem auto",
            height: "fit-content",
            maxWidth: "60rem",
          }}
        >
          <h1>{t("profile.advanced.heading")}</h1>
          <p>{t("profile.advanced.description")}</p>

          <Button
            variant="outlined"
            color="warning"
            disabled={isWorking}
            onClick={() => setClearDataStoreDialogOpen(true)}
            sx={{ mt: 2 }}
          >
            {t("profile.advanced.clearCache")}
          </Button>
        </Card>

        {/* Offline Storage Management */}
        <StorageManagement />

        {/* Privacy Settings */}
        <Card
          sx={{
            padding: "2rem 1rem",
            margin: "1rem auto",
            height: "fit-content",
            maxWidth: "60rem",
          }}
        >
          <Typography variant="h5" gutterBottom>
            {t("settings.privacy.heading")}
          </Typography>
          <FormControlLabel
            data-testid="setting-leaderboard-opt-in"
            control={
              <Switch
                checked={settings?.leaderboardOptIn !== false}
                onChange={(e) => {
                  if (updateSettings) {
                    updateSettings({ leaderboardOptIn: e.target.checked });
                  }
                }}
              />
            }
            label={t("settings.privacy.leaderboardOptIn")}
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
            {t("settings.privacy.leaderboardOptInHint")}
          </Typography>
        </Card>

        {/* Accessibility */}
        <Card
          sx={{
            padding: "2rem 1rem",
            margin: "1rem auto",
            height: "fit-content",
            maxWidth: "60rem",
          }}
        >
          <Typography variant="h5" gutterBottom>
            Accessibility
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            These settings apply across the entire app. The system-level
            &ldquo;reduce motion&rdquo; preference from your device is always
            respected automatically.
          </Typography>
          <FormControlLabel
            data-testid="setting-reduced-motion"
            control={
              <Switch
                checked={settings?.reducedMotion === true}
                onChange={(e) => {
                  if (updateSettings) {
                    updateSettings({ reducedMotion: e.target.checked });
                  }
                }}
              />
            }
            label="Reduced Motion"
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ ml: 4, mb: 1 }}
          >
            Disable animations, transitions, and auto-playing effects throughout
            the app. Useful for reducing distractions or if motion causes
            discomfort.
          </Typography>
          <FormControlLabel
            data-testid="setting-high-contrast"
            control={
              <Switch
                checked={settings?.highContrastMode === true}
                onChange={(e) => {
                  if (updateSettings) {
                    updateSettings({ highContrastMode: e.target.checked });
                  }
                }}
              />
            }
            label="High Contrast Mode"
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
            Increase contrast for text and UI elements to improve readability.
          </Typography>
        </Card>

        {/* Profile Visibility */}
        <Card
          sx={{
            padding: "2rem 1rem",
            margin: "1rem auto",
            height: "fit-content",
            maxWidth: "60rem",
          }}
        >
          <Typography variant="h5" gutterBottom>
            Profile Visibility
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose what others can see on your profile page.
          </Typography>
          <FormControlLabel
            data-testid="setting-show-badges"
            control={
              <Switch
                checked={settings?.showBadgesOnProfile !== false}
                onChange={(e) => {
                  if (updateSettings) {
                    updateSettings({ showBadgesOnProfile: e.target.checked });
                  }
                }}
              />
            }
            label="Show badges on profile"
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ ml: 4, mb: 1 }}
          >
            Display your earned achievement badges on your public profile.
          </Typography>
          <FormControlLabel
            data-testid="setting-show-anti-badges"
            control={
              <Switch
                checked={settings?.showAntiBadgesOnProfile === true}
                onChange={(e) => {
                  if (updateSettings) {
                    updateSettings({
                      showAntiBadgesOnProfile: e.target.checked,
                    });
                  }
                }}
              />
            }
            label="Show anti-badges on profile"
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
            Display anti-badges on your profile. These are humorous, not
            punitive — show them off if you want!
          </Typography>
        </Card>

        {/* Cosmetic Customization */}
        <Card
          sx={{
            padding: "2rem 1rem",
            margin: "1rem auto",
            height: "fit-content",
            maxWidth: "60rem",
          }}
        >
          <Typography variant="h5" gutterBottom>
            {t("settings.customization.heading")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("settings.customization.description")}
          </Typography>
          <CosmeticSelector
            level={level?.level || 1}
            selectedThemeId={
              settings?.profileThemeId || settings?.editorTheme || "default"
            }
            onThemeSelect={(themeId) => {
              if (updateSettings) {
                updateSettings({ profileThemeId: themeId });
              }
            }}
            customThemePalette={
              settings?.customThemePalette
                ? typeof settings.customThemePalette === "string"
                  ? JSON.parse(settings.customThemePalette)
                  : settings.customThemePalette
                : null
            }
            onCustomPaletteSave={(palette) => {
              if (updateSettings) {
                updateSettings({
                  profileThemeId: "custom",
                  customThemePalette: JSON.stringify(palette),
                });
              }
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Your selected theme will also be applied to your public profile
            page.
          </Typography>
        </Card>

        {/* Bot Avatar Customization */}
        <Card
          sx={{
            padding: "2rem 1rem",
            margin: "1rem auto",
            height: "fit-content",
            maxWidth: "60rem",
          }}
        >
          <Typography variant="h5" gutterBottom>
            {t("settings.botCustomizer.heading")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("settings.botCustomizer.description")}
          </Typography>
          <BotCustomizer botWhispererTier={botWhispererTier} />
        </Card>

        <Dialog
          open={clearDataStoreDialogOpen}
          onClose={() => setClearDataStoreDialogOpen(false)}
          aria-labelledby="clear-datastore-dialog-title"
          aria-describedby="clear-datastore-dialog-description"
        >
          <DialogTitle id="clear-datastore-dialog-title">
            {t("profile.advanced.clearCacheDialog.title")}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="clear-datastore-dialog-description">
              {t("profile.advanced.clearCacheDialog.message")}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setClearDataStoreDialogOpen(false)}
              color="primary"
            >
              {t("profile.advanced.clearCacheDialog.cancel")}
            </Button>
            <Button
              onClick={handleClearDataStore}
              color="warning"
              variant="contained"
              autoFocus
            >
              {t("profile.advanced.clearCacheDialog.confirm")}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={successMessage !== ""}
          autoHideDuration={6000}
          onClose={() => setSuccessMessage("")}
          message={successMessage}
        />
      </Box>
    </>
  );
}

export default function WrappedPage() {
  return (
    <GamificationProviderWrapper>
      <Settings />
    </GamificationProviderWrapper>
  );
}
