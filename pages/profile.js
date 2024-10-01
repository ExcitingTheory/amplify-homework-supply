import * as React from 'react';
// import Paper from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
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
import { CircularProgress, Modal } from '@mui/material';
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

  const [user, setUser] = React.useState({})
  const [oldPassword, setOldPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmNewPassword, setConfirmNewPassword] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [name, setName] = React.useState(user)
  const [username, setUsername] = React.useState('')
  const [language, setLanguage] = React.useState('')
  const [isWorking, setIsWorking] = React.useState(false)
  const [needsConfirmation, setNeedsConfirmation] = React.useState(false)
  const [confirmationCode, setConfirmationCode] = React.useState('')
  const [identityId, setIdentityId] = React.useState('')

  const [successMessage, setSuccessMessage] = React.useState('')


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

  React.useEffect(() => {
    fetchUser()
    async function fetchUser() {
      // const userData = await DataStore.query(User)


      const userAttributes = await fetchUserAttributes();
      const {
        identityId,
      } = await fetchAuthSession();
        


      console.log('userAttributes', userAttributes)

      // const userData = await getUser(currentUser)
      // console.log('userData', userData)

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
              My Profile
            </Typography>
          </Box>
        </MainToolbar>
      </AppBar>
      <Container

        style={{
          padding: '2rem 1rem',
          margin: '3rem auto',

        }}>
        <Card sx={{
          padding: '2rem 1rem',
          margin: '3rem auto',
          height: 'fit-content'
        }}>
          <h1>My Profile</h1>
          <p>Here is your profile information.</p>

          <form onSubmit={updateUser}>

            <FormControl fullWidth>


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
              />

              <label>User Id</label>

              <TextField
                // label="User Id"
                type="text"
                value={user?.sub}
                disabled
                sx={{ mb: 2 }}
              />

              <label>Identity Id</label>

              <TextField
                // label="User Id"
                type="text"
                value={identityId}
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
                >Cancel</Button>

                <Button
                  variant="contained"
                  color="primary"
                  disabled={isWorking}
                  type="submit">
                  {isWorking &&
                    <CircularProgress />
                  }
                  &nbsp;Update Profile</Button>
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
                Confirm your email
              </Typography>
              <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                We have sent you a confirmation code to your email address. Please enter it below.
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
                      &nbsp;Confirm Email</Button>
                  </div>

                </FormControl>
              </form>

            </Card>
          </Modal>




        </Card>

        <Card sx={{
          padding: '2rem 1rem',
          margin: '3rem auto',
          height: 'fit-content'
        }}>
          <h1>Change Password</h1>
          <p>Here you can change your password.</p>
          <form onSubmit={changePassword}>
            {/**
           * Password change form
           */}

            <FormControl fullWidth>

              <TextField
                label="Old Password"
                type="password"
                value={oldPassword}
                onChange={(event) => {
                  setOldPassword(event.target.value)
                }}
                required
                sx={{ mb: 2 }}
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
              />

              <Button
                variant="contained"
                color="primary"
                disabled={isWorking}
                type="submit">
                {isWorking &&
                  <CircularProgress />
                }
                &nbsp;Change Password</Button>

            </FormControl>
          </form>

        </Card>


        <Snackbar
          open={successMessage !== ''}
          autoHideDuration={6000}
          onClose={() => setSuccessMessage('')}
          message={successMessage}
        // action={action}
        />

      </Container>
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
