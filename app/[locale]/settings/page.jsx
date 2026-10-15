"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Stack from "@mui/material/Stack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import TranslateIcon from "@mui/icons-material/Translate";
import ShieldIcon from "@mui/icons-material/Shield";
import TuneIcon from "@mui/icons-material/Tune";
import PaletteIcon from "@mui/icons-material/Palette";
import FaceIcon from "@mui/icons-material/Face";

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
import { useAvatarConfig } from "@/hooks/useAvatarConfig";
import { useBotAvatarConfig } from "@/hooks/useBotAvatarConfig";
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

  // Parse settings.metadata once per render; used to merge avatar/bot updates
  // without clobbering unrelated metadata keys (e.g. glowRing).
  const metadataRef = React.useRef({});
  metadataRef.current = React.useMemo(() => {
    const raw = settings?.metadata;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }
    return raw || {};
  }, [settings?.metadata]);

  useChatPageContext({});
  const { level, avatarUnlockConfig } = useXP();

  const {
    style: selectedAvatarTier,
    overrides: avatarOverrides,
    seed: avatarSeed,
  } = useAvatarConfig();
  const botAvatarConfig = useBotAvatarConfig();

  const handleAvatarTierSelect = (tier) => {
    if (!updateSettings) return;
    updateSettings({
      metadata: { ...metadataRef.current, avatarStyle: tier },
    });
  };

  const handleAvatarOverridesSave = (overrides, style) => {
    if (!updateSettings) return;
    updateSettings({
      metadata: {
        ...metadataRef.current,
        avatarStyle: style,
        avatarOverrides: overrides,
      },
    });
  };

  const handleBotAvatarChange = (config) => {
    if (!updateSettings) return;
    updateSettings({
      metadata: {
        ...metadataRef.current,
        botAvatarStyle: config.style,
        botAvatarBackgroundColor: config.backgroundColor,
      },
    });
  };

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
        <Box sx={{ mb: 2 }}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PersonIcon color="primary" />
                <Typography variant="h6">
                  {t("settings.profileInfo.heading")}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <ProfileInfoView
                variant="bare"
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
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <LockIcon color="primary" />
                <Typography variant="h6">
                  {t("profile.changePassword.heading")}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <PasswordChangeView
                variant="bare"
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
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TranslateIcon color="primary" />
                <Typography variant="h6">
                  {t("profile.languagePreference.heading")}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <LanguagePreferenceView
                variant="bare"
                selectedLocale={selectedLocale}
                availableLocales={availableLocales}
                onChange={handleLocaleChange}
              />
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <ShieldIcon color="primary" />
                <Typography variant="h6">
                  Privacy, Accessibility &amp; Visibility
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <AccountPreferencesView
                variant="bare"
                preferences={settings}
                onToggle={(key, value) =>
                  updateSettings && updateSettings({ [key]: value })
                }
                t={t}
              />
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TuneIcon color="primary" />
                <Typography variant="h6">
                  {t("profile.advanced.heading")}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <AdvancedSettingsView
                variant="bare"
                isWorking={isWorking}
                dialogOpen={clearDataStoreDialogOpen}
                onClearCacheClick={() => setClearDataStoreDialogOpen(true)}
                onDialogClose={() => setClearDataStoreDialogOpen(false)}
                onConfirmClear={handleClearDataStore}
              />
            </AccordionDetails>
          </Accordion>

          {/* Offline Storage Management */}
          <StorageManagement />

          {/* Cosmetic Customization */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PaletteIcon color="primary" />
                <Typography variant="h6">
                  {t("settings.customization.heading")}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
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
                avatarSeed={avatarSeed || username}
                selectedAvatarTier={selectedAvatarTier}
                onAvatarTierSelect={handleAvatarTierSelect}
                avatarOverrides={avatarOverrides}
                onAvatarOverridesSave={handleAvatarOverridesSave}
                avatarUnlockConfig={avatarUnlockConfig}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Your selected theme will also be applied to your public profile
                page.
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* Bot Avatar Customization */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <FaceIcon color="primary" />
                <Typography variant="h6">
                  {t("settings.botCustomizer.heading")}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t("settings.botCustomizer.description")}
              </Typography>
              <BotCustomizer
                botWhispererTier={botWhispererTier}
                initialConfig={botAvatarConfig}
                onChange={handleBotAvatarChange}
              />
            </AccordionDetails>
          </Accordion>
        </Box>

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
