import * as React from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18nextConfig from '../next-i18next.config';
// import Paper from '@mui/material/Container';
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

import MyAuth from '../src/components/authenticator';
import Snackbar from '@mui/material/Snackbar';

import Button from '@mui/material/Button';
import { CircularProgress, Modal, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { Label } from '@mui/icons-material';

function Profile() {
  /**
   * Profile is a page that displays information about the user.
   * 
   * For all users, it displays the information we have about them.
   * For all users, they can edit their information.
   * For all users, they can change their password.
   * For all users, they can change their email.
   * For all users, they can change their name.
   * For all users, they can change their username.
   * For all users, they can change their language.
   * So they can delete their account.
   */

  const { t } = useTranslation('pages');
  const [user, setUser] = React.useState({})
  const [oldPassword, setOldPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmNewPassword, setConfirmNewPassword] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [name, setName] = React.useState('')
  const [username, setUsername] = React.useState('')
  const [language, setLanguage] = React.useState('')
  const [isWorking, setIsWorking] = React.useState(false)
  const [needsConfirmation, setNeedsConfirmation] = React.useState(false)
  const [confirmationCode, setConfirmationCode] = React.useState('')
  const [identityId, setIdentityId] = React.useState('')

  const [successMessage, setSuccessMessage] = React.useState('')
  const [clearDataStoreDialogOpen, setClearDataStoreDialogOpen] = React.useState(false)


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
        // open a modal to collect confirmation code
        setNeedsConfirmation(true)
        // setIsWorking(false)
        // setSuccessMessage('User updated successfully')
      } catch (error) {
        alert(error.message)
      }
    }
  }

  const updateName = async (event) => {
    setIsWorking(true)
    event.preventDefault()


    if (name !== user?.name) {
      try {
        await updateUserAttribute({
          userAttribute: {
            attributeKey: 'user',
            value: name
          }
        });
      } catch (error) {
        alert(error.message)
      }
    }

  }

  const updateUser = async (event) => {
    setIsWorking(true)
    event.preventDefault()

    await updateEmail(event)
    // await updateName(event)

    setIsWorking(false)

    setSuccessMessage('User updated successfully')

  }


  const changePassword = async (event) => {
    setIsWorking(true)
    event.preventDefault()

    //if passwords don't match, return with error message

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
      // Gen2 client doesn't have DataStore.clear() - instead reload the page to clear cache
      console.log('Reloading page to clear cache...')
      setSuccessMessage('Clearing cache and reloading...')
      
      // Clear sessionStorage and localStorage if needed
      sessionStorage.clear()
      
      // Reload the page after a brief delay to show the message
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      alert('Error clearing cache: ' + error.message)
      setIsWorking(false)
    }
  }

  React.useEffect(() => {
    fetchUser()
    async function fetchUser() {
      // const userData = await DataStore.query(User)


      const userAttributes = await fetchUserAttributes();
      const {
        identityId,
      } = await fetchAuthSession();
      setUser(userAttributes)
      setName(userAttributes?.name || '')
      setEmail(userAttributes?.email || '')
      setUsername(userAttributes?.sub || '')
      // setLanguage(userAttributes?.language || '')
      setIdentityId(identityId)
    }
  }, [])

  React.useEffect(() => {
    if (successMessage) {
      setTimeout(() => {
        // set successMessage to empty string
        setSuccessMessage('')
      }, 10000) // 10 seconds
    }
  }, [successMessage])

  return (
    <>
      <AppBar
        position="fixed"
        color="default"
        sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(8px)',
        }}
      >
        <MainToolbar>
          <Box sx={{ flexGrow: 1, margin: '1rem' }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {t('profile.title')}
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

              {/* Hidden username field for password managers */}
              <input
                type="text"
                name="username"
                value={username || ''}
                autoComplete="username"
                style={{ display: 'none' }}
                readOnly
                aria-hidden="true"
              />

              {/* <TextField
                label="Name"
                type="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                }}
                required
                sx={{ mb: 2 }}
              /> */}

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
                // label="User Id"
                type="text"
                value={user?.sub || ''}
                disabled
                sx={{ mb: 2 }}
              />

              <label>{t('profile.identityId')}</label>

              <TextField
                // label="User Id"
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
                    <CircularProgress />
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

                    {/* <Button
                        variant="contained"
                        color="error"
                        disabled={isWorking}
                        onClick={() => {
                          setNeedsConfirmation(false)
                        }}
                      >Cancel</Button> */}

                    <Button
                      variant="contained"
                      color="primary"
                      disabled={isWorking}
                      type="submit">
                      {isWorking &&
                        <CircularProgress />
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
            {/**
           * Password change form
           */}

            <FormControl fullWidth>

              {/* Hidden username field for password managers */}
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
                  <CircularProgress />
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
        // action={action}
        />

      </Box>
    </>
  );
}

export default function WrappedPage() {
  return (
    <MyAuth>
      <Profile />
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
