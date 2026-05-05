import * as React from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18nextConfig from '../next-i18next.config';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';

import {
  fetchUserAttributes,
  updateUserAttribute,
  updatePassword,
  fetchAuthSession
} from 'aws-amplify/auth';

import FormControl from '@mui/material/FormControl';
import MainToolbar from '../src/components/MainToolbar'
import StorageManagement from '../src/components/StorageManagement'
import { CosmeticSelector } from '../src/components/Gamification/CosmeticSelector';
import { BotCustomizer } from '../src/components/BotCustomizer';
import { useXP, useBadges } from '../src/context/gamificationContext';
import { GamificationProviderWrapper } from '../src/context/gamificationProviderWrapper';
import { getAmplifyClient } from '../src/utils/amplifyClient';

import MyAuth from '../src/components/AmplifyAuthenticator';
import Snackbar from '@mui/material/Snackbar';
import { useChatPageContext } from '../src/hooks/useChatPageContext';

import Button from '@mui/material/Button';
import { Skeleton, Modal, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, MenuItem, Select, InputLabel } from '@mui/material';
import SettingsContext from '../src/context/settingsContext';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

function Settings() {
  const { t, i18n } = useTranslation('pages');
  const router = useRouter();
  const [user, setUser] = React.useState({})
  const [oldPassword, setOldPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmNewPassword, setConfirmNewPassword] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [name, setName] = React.useState('')
  const [username, setUsername] = React.useState('')
  const [selectedLocale, setSelectedLocale] = React.useState(router.locale || 'en')
  const [isWorking, setIsWorking] = React.useState(false)
  const [needsConfirmation, setNeedsConfirmation] = React.useState(false)
  const [confirmationCode, setConfirmationCode] = React.useState('')
  const [identityId, setIdentityId] = React.useState('')

  const [successMessage, setSuccessMessage] = React.useState('')
  const [clearDataStoreDialogOpen, setClearDataStoreDialogOpen] = React.useState(false)
  const { settings, updateSettings } = React.useContext(SettingsContext) || {};

  useChatPageContext({});
  const { level } = useXP();

  // Compute Bot Whisperer tier from earned badges
  const { badges: earnedBadges } = useBadges();
  const botWhispererTier = React.useMemo(() => {
    const bwBadges = earnedBadges.filter(b => b.badgeType?.startsWith('BOT_WHISPERER'));
    let maxTier = 0;
    for (const b of bwBadges) {
      if (b.badgeType === 'BOT_WHISPERER_IV') maxTier = Math.max(maxTier, 4);
      else if (b.badgeType === 'BOT_WHISPERER_III') maxTier = Math.max(maxTier, 3);
      else if (b.badgeType === 'BOT_WHISPERER_II') maxTier = Math.max(maxTier, 2);
      else if (b.badgeType === 'BOT_WHISPERER_I') maxTier = Math.max(maxTier, 1);
    }
    return maxTier;
  }, [earnedBadges]);

  const availableLocales = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '中文' },
  ]

  const updateEmailConfirmation = async (event) => {
    setIsWorking(true)
    event.preventDefault()

    try {
      await confirmUserAttribute({
        userAttributeKey: 'email', confirmationCode });
      setIsWorking(false)
      setNeedsConfirmation(false)
      setSuccessMessage('Email updated successfully')
    } catch (error) {
      alert(error.message)
      setIsWorking(false)
    }
  }

  const updateEmail = async (event) => {
    setIsWorking(true)
    event.preventDefault()

    if (email !== user?.email) {
      try {
        await updateUserAttribute({
          userAttribute: {
            attributeKey: 'email',
            value: email
          }
        });
        setNeedsConfirmation(true)
      } catch (error) {
        alert(error.message)
      }
    }
  }

  const updateUser = async (event) => {
    setIsWorking(true)
    event.preventDefault()

    await updateEmail(event)

    setIsWorking(false)
    setSuccessMessage('User updated successfully')
  }

  const changePassword = async (event) => {
    setIsWorking(true)
    event.preventDefault()

    try {
      await updatePassword({oldPassword, newPassword})
      setIsWorking(false)
      setSuccessMessage('Password changed successfully')
    } catch (error) {
      alert(error.message)
    }

    setOldPassword('')
    setNewPassword('')
    setConfirmNewPassword('')
  }

  const handleClearDataStore = async () => {
    setIsWorking(true)
    setClearDataStoreDialogOpen(false)
    
    try {
      console.log('Reloading page to clear cache...')
      setSuccessMessage('Clearing cache and reloading...')
      
      sessionStorage.clear()
      
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      alert('Error clearing cache: ' + error.message)
      setIsWorking(false)
    }
  }

  const handleLocaleChange = async (event) => {
    const newLocale = event.target.value
    setSelectedLocale(newLocale)
    
    try {
      localStorage.setItem('preferredLocale', newLocale)
      
      await router.push(router.pathname, router.asPath, { locale: newLocale })
      
      setSuccessMessage(t('profile.languagePreference.changeSuccess'))
    } catch (error) {
      console.error('Error changing locale:', error)
      alert('Error changing language: ' + error.message)
    }
  }

  React.useEffect(() => {
    fetchUser()
    async function fetchUser() {
      const userAttributes = await fetchUserAttributes();
      const {
        identityId,
      } = await fetchAuthSession();
      setUser(userAttributes)
      setName(userAttributes?.name || '')
      setEmail(userAttributes?.email || '')
      setUsername(userAttributes?.sub || '')
      setIdentityId(identityId)
      
      const savedLocale = localStorage.getItem('preferredLocale')
      if (savedLocale && router.locale !== savedLocale) {
        setSelectedLocale(savedLocale)
      } else {
        setSelectedLocale(router.locale || 'en')
      }
    }
  }, [])

  React.useEffect(() => {
    if (successMessage) {
      setTimeout(() => {
        setSuccessMessage('')
      }, 10000)
    }
  }, [successMessage])

  return (
    <>
      <AppBar
        position="fixed"
        color="default"
        sx={{
            backgroundColor: 'custom.glassNavbar',
            backdropFilter: 'blur(8px)',
        }}
      >
        <MainToolbar>
          <Box sx={{ flexGrow: 1, margin: '1rem' }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {t('settings.title', 'Settings')}
            </Typography>
          </Box>
        </MainToolbar>
      </AppBar>
      <Box
        sx={{
          marginTop: '5rem',
          marginBottom: '3rem',
          padding: '1rem',
          height: 'calc(100vh - 5rem)',
          overflow: 'auto',
        }}
      >
        <Card sx={{
          padding: '2rem 1rem',
          margin: '1rem auto',
          height: 'fit-content',
          maxWidth: '60rem',
        }}>
          <h1>{t('profile.heading')}</h1>
          <p>{t('profile.description')}</p>

          <form onSubmit={updateUser}>

            <FormControl fullWidth>

              <input
                type="text"
                name="username"
                value={username || ''}
                autoComplete="username"
                style={{ display: 'none' }}
                readOnly
                aria-hidden="true"
              />

              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                }}
                required
                sx={{ mb: 2 }}
                autoComplete="email"
              />

              <label>{t('profile.userId')}</label>

              <TextField
                type="text"
                value={user?.sub || ''}
                disabled
                sx={{ mb: 2 }}
              />

              <label>{t('profile.identityId')}</label>

              <TextField
                type="text"
                value={identityId || ''}
                disabled
                sx={{ mb: 2 }}
              />

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between'
                }}>

                <Button
                  variant="contained"
                  color="error"
                  disabled={isWorking}
                  onClick={() => {
                    setName(user?.name || '')
                    setEmail(user?.email || '')
                  }}
                >{t('profile.cancel')}</Button>

                <Button
                  variant="contained"
                  color="primary"
                  disabled={isWorking}
                  type="submit">
                  {isWorking &&
                    <Skeleton variant="circular" width={24} height={24} />
                  }
                  &nbsp;{t('profile.updateProfile')}</Button>
              </div>

            </FormControl>
          </form>

          <Modal
            open={needsConfirmation}
            onClose={() => {
              setNeedsConfirmation(false)
            }}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Card
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400,
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4,
              }}
            >
              <Typography id="modal-modal-title" variant="h6" component="h2">
                {t('profile.confirmEmail.title')}
              </Typography>
              <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                {t('profile.confirmEmail.message')}
              </Typography>

              <br />

              <form onSubmit={updateEmailConfirmation}>
                <FormControl fullWidth>

                  <TextField
                    label="Confirmation Code"
                    type="text"
                    value={confirmationCode}
                    onChange={(event) => {
                      setConfirmationCode(event.target.value)
                    }}
                    required
                    sx={{ mb: 2 }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between'
                    }}>

                    <Button
                      variant="contained"
                      color="primary"
                      disabled={isWorking}
                      type="submit">
                      {isWorking &&
                        <Skeleton variant="circular" width={24} height={24} />
                      }
                      &nbsp;{t('profile.confirmEmail.button')}</Button>
                  </div>

                </FormControl>
              </form>

            </Card>
          </Modal>
        </Card>

        <Card sx={{
          padding: '2rem 1rem',
          margin: '1rem auto',
          height: 'fit-content',
          maxWidth: '60rem',
        }}>
          <h1>{t('profile.changePassword.heading')}</h1>
          <p>{t('profile.changePassword.description')}</p>
          <form onSubmit={changePassword}>

            <FormControl fullWidth>

              <input
                type="text"
                name="username"
                value={username || ''}
                autoComplete="username"
                style={{ display: 'none' }}
                readOnly
                aria-hidden="true"
              />

              <TextField
                label="Old Password"
                type="password"
                value={oldPassword}
                onChange={(event) => {
                  setOldPassword(event.target.value)
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
                  setNewPassword(event.target.value)
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
                  setConfirmNewPassword(event.target.value)
                }}
                required
                sx={{ mb: 2 }}
                autoComplete="new-password"
              />

              <Button
                variant="contained"
                color="primary"
                disabled={isWorking}
                type="submit">
                {isWorking &&
                  <Skeleton variant="circular" width={24} height={24} />
                }
                &nbsp;{t('profile.changePassword.button')}</Button>

            </FormControl>
          </form>

        </Card>

        <Card sx={{
          padding: '2rem 1rem',
          margin: '1rem auto',
          height: 'fit-content',
          maxWidth: '60rem',
        }}>
          <h1>{t('profile.languagePreference.heading')}</h1>
          <p>{t('profile.languagePreference.description')}</p>
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="locale-select-label">
              {t('profile.languagePreference.selectLanguage')}
            </InputLabel>
            <Select
              labelId="locale-select-label"
              id="locale-select"
              value={selectedLocale}
              label={t('profile.languagePreference.selectLanguage')}
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

        <Card sx={{
          padding: '2rem 1rem',
          margin: '1rem auto',
          height: 'fit-content',
          maxWidth: '60rem',
        }}>
          <h1>{t('profile.advanced.heading')}</h1>
          <p>{t('profile.advanced.description')}</p>
          
          <Button
            variant="outlined"
            color="warning"
            disabled={isWorking}
            onClick={() => setClearDataStoreDialogOpen(true)}
            sx={{ mt: 2 }}
          >
            {t('profile.advanced.clearCache')}
          </Button>
        </Card>

        {/* Offline Storage Management */}
        <StorageManagement />

        {/* Privacy Settings */}
        <Card sx={{
          padding: '2rem 1rem',
          margin: '1rem auto',
          height: 'fit-content',
          maxWidth: '60rem',
        }}>
          <Typography variant="h5" gutterBottom>{t('profile.privacy', 'Privacy')}</Typography>
          <FormControlLabel
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
            label={t('profile.privacy.leaderboardOptIn', 'Show my name on leaderboards')}
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
            {t('profile.privacy.leaderboardOptInHint', 'When off, your name appears as "Anonymous Student" on leaderboards.')}
          </Typography>
        </Card>

        {/* Cosmetic Customization */}
        <Card sx={{
          padding: '2rem 1rem',
          margin: '1rem auto',
          height: 'fit-content',
          maxWidth: '60rem',
        }}>
          <Typography variant="h5" gutterBottom>Customization</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Unlock new avatar styles and editor themes as you level up.
          </Typography>
          <CosmeticSelector level={level?.level || 1} />
        </Card>

        {/* Bot Avatar Customization */}
        <Card sx={{
          padding: '2rem 1rem',
          margin: '1rem auto',
          height: 'fit-content',
          maxWidth: '60rem',
        }}>
          <Typography variant="h5" gutterBottom>AI Assistant Avatar</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Customize your AI tutor&apos;s appearance. Unlock more options with Bot Whisperer badges.
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
            {t('profile.advanced.clearCacheDialog.title')}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="clear-datastore-dialog-description">
              {t('profile.advanced.clearCacheDialog.message')}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setClearDataStoreDialogOpen(false)}
              color="primary"
            >
              {t('profile.advanced.clearCacheDialog.cancel')}
            </Button>
            <Button 
              onClick={handleClearDataStore}
              color="warning"
              variant="contained"
              autoFocus
            >
              {t('profile.advanced.clearCacheDialog.confirm')}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={successMessage !== ''}
          autoHideDuration={6000}
          onClose={() => setSuccessMessage('')}
          message={successMessage}
        />

      </Box>
    </>
  );
}

export default function WrappedPage() {
  return (
    <MyAuth>
      <GamificationProviderWrapper>
        <Settings />
      </GamificationProviderWrapper>
    </MyAuth>
  )
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'pages', 'components'], nextI18nextConfig)),
    },
  }
}
