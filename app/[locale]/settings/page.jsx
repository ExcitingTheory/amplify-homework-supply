"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";

import {
  fetchUserAttributes,
  updateUserAttribute,
  updatePassword,
  fetchAuthSession,
  confirmUserAttribute,
} from "aws-amplify/auth";

import StorageManagement from "@/components/StorageManagement";
import { AccountPreferencesView } from "@/components/AccountPreferencesView";
import { ProfileInfoView } from "@/components/Settings/ProfileInfoView";
import { PasswordChangeView } from "@/components/Settings/PasswordChangeView";
import { LanguagePreferenceView } from "@/components/Settings/LanguagePreferenceView";
import { AdvancedSettingsView } from "@/components/Settings/AdvancedSettingsView";
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

import SettingsContext from "@/context/settingsContext";
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

  // Robot (bottts) avatar styles unlock only after all four Bot Whisperer badges
  const robotStylesUnlocked = React.useMemo(() => {
    const earned = new Set(earnedBadges.map((b) => b.badgeType));
    return (
      earned.has("BOT_WHISPERER_I") &&
      earned.has("BOT_WHISPERER_II") &&
      earned.has("BOT_WHISPERER_III") &&
      earned.has("BOT_WHISPERER_IV")
    );
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
        <ProfileInfoView
          email={email}
          name={name}
          username={username}
          userSub={user?.sub}
          identityId={identityId}
          isWorking={isWorking}
          errorMessage={errorMessage}
          onEmailChange={setEmail}
          onNameChange={setName}
          onSubmit={updateUser}
          onCancel={() => {
            setName(user?.name || "");
            setEmail(user?.email || "");
          }}
          needsConfirmation={needsConfirmation}
          confirmationCode={confirmationCode}
          onConfirmationCodeChange={setConfirmationCode}
          onConfirmationSubmit={updateEmailConfirmation}
          onConfirmationClose={() => setNeedsConfirmation(false)}
        />

        <PasswordChangeView
          username={username}
          oldPassword={oldPassword}
          newPassword={newPassword}
          confirmNewPassword={confirmNewPassword}
          isWorking={isWorking}
          onOldPasswordChange={setOldPassword}
          onNewPasswordChange={setNewPassword}
          onConfirmNewPasswordChange={setConfirmNewPassword}
          onSubmit={changePassword}
        />

        <LanguagePreferenceView
          selectedLocale={selectedLocale}
          availableLocales={availableLocales}
          onChange={handleLocaleChange}
        />

        <AdvancedSettingsView
          isWorking={isWorking}
          dialogOpen={clearDataStoreDialogOpen}
          onClearCacheClick={() => setClearDataStoreDialogOpen(true)}
          onDialogClose={() => setClearDataStoreDialogOpen(false)}
          onConfirmClear={handleClearDataStore}
        />

        {/* Offline Storage Management */}
        <StorageManagement />

        {/* Privacy, Accessibility & Profile Visibility preferences */}
        <AccountPreferencesView
          preferences={settings}
          onToggle={(key, value) =>
            updateSettings && updateSettings({ [key]: value })
          }
          t={t}
        />

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
            robotStylesUnlocked={robotStylesUnlocked}
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
