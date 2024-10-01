/**
 * @module MainToolbar
 * @category Components
 * @description MainToolbar component
 * 
 * MainToolbar component for the app.
 * 
 * @todo Add a dropdown for the user.
 * @todo Add a dropdown for the settings.
 * @todo Add a dropdown for the help.
 */

import * as React from 'react';
// import AppBar from '@mui/material/AppBar';
// import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
// import Typography from '@mui/material/Typography';
// import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ProfileIcon from '@mui/icons-material/AccountCircle';
import UserIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import MenuItem from '@mui/material/MenuItem';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import BatteryUnknownIcon from '@mui/icons-material/BatteryUnknown';
import HomeIcon from '@mui/icons-material/Home';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleIcon from '@mui/icons-material/People';
import { addSelfToSection } from '../../src/graphql/mutations';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { signOut } from 'aws-amplify/auth';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { DataStore } from '@aws-amplify/datastore';
import { Section } from '../../src/models';
import Switch from '@mui/material/Switch';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  TextField,
  DialogActions,
  Menu
} from '@mui/material';
import { useRouter } from 'next/router';
import { Help, Settings } from '@mui/icons-material';

import { generateClient } from 'aws-amplify/api';

const client = generateClient();

function ToggleMenuItem(props) {
  const [checked, setChecked] = React.useState(true);

  const handleChange = (event) => {
    setChecked(event.target.checked);
  }

  return (
    <MenuItem>
      <ListItemText primary={props.label} />
      <Switch
        edge="end"
        onChange={handleChange}
        checked={checked}
        inputProps={{ 'aria-labelledby': 'switch-list-label-wifi' }}
      />
    </MenuItem>
  )
}

export function SettingsMenu() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const router = useRouter()  

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  }

  const handleClose = () => {
    setAnchorEl(null);
  }

  const handleSettings = () => {
    // router.push('/settings')
    handleClose()
  }

  return (
    <div>
      <Button
        id="settings-button"
        color="inherit"
        aria-controls={open ? 'settings-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <Settings />
      </Button>
      <Menu

        id="settings-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        {
          /**
           * In the settings menu display the following as toggles:
           * 
           * - Disable notifications
           * - Dark mode
           * - Experimental features
           * - Student mode for teachers, this will allow them to see the app as a student would.
           * (So they can show students how to use it without divulging other students' grades)
           * - 
           */
        }
        <ToggleMenuItem label="Disable notifications" />
        <ToggleMenuItem label="Dark mode" /> 
        <ToggleMenuItem label="Experimental features" />
        <ToggleMenuItem label="Student mode" />

        {/* <MenuItem onClick={handleSettings}>Change password</MenuItem> */}
      </Menu>
    </div>
  )
}


export function HelpMenu() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const router = useRouter()

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  }

  const handleClose = () => {
    setAnchorEl(null);
  }

  const handleHelp = () => {
    // router.push('/help')
    handleClose()
  }


  return (
    <div>
      <Button

        id="help-button"
        color="inherit"
        aria-controls={open ? 'help-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <Help />
      </Button>
      <Menu

        id="help-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <MenuItem onClick={handleHelp}>Help</MenuItem>
      </Menu>
    </div>
  )
}


export function UserMenu() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  // const [username, setUsername] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const router = useRouter()

  // React.useEffect(() => {

  // async function fetchUserAttributes() {
  //   console.log('UserMenu.useEffect')
  //   const userAttributes = await fetchUserAttributes();
  //   console.log('userAttributes', userAttributes)
  //   setUsername(userAttributes?.name)
  // }
  // fetchUserAttributes()
  // }, [])

  
  

  return (
    <div>
      <Button
        id="user-button"
        color="inherit"
        aria-controls={open ? 'user-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        {/**
         * @todo Replace this with the user's name.
         */}
        {/* <ProfileIcon />&nbsp;{username} */}
        <ProfileIcon />
      </Button>
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <MenuItem onClick={() => {
          router.push('/profile')
        }}><UserIcon/>&nbsp;Profile</MenuItem>
        {/* <MenuItem onClick={handleClose}>My account</MenuItem> */}
        <MenuItem onClick={() => {
          signOut();
        }}>
          <LogoutIcon/>&nbsp;Logout</MenuItem>
      </Menu>
    </div>
  );
}


export default function MainToolbar({ children }) {
  const [state, setState] = React.useState({
    // top: false,
    left: false,
    // bottom: false,
    // right: false,
  });

  const router = useRouter();

  const [work, setIsWorking] = React.useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false)

  const [openAddStudentToSection, setOpenAddStudentToSection] = React.useState(false);

  const toggleDrawer = (anchor, open) =>
    (event) => {
      if (
        event &&
        event.type === 'keydown' &&
        ((event).key === 'Tab' ||
          (event).key === 'Shift')
      ) {
        return;
      }

      setState({ ...state, [anchor]: open });
    };

  // create a mui popup modal for adding a user to a section by section code

  async function addStudentToSection(event) {
    setIsWorking(true)
    event.preventDefault()
    console.log('addStudentToSection')

    console.log('event', event)

    const form = new FormData(event.target)
    let response

    console.log('form', form)

    try {
      const createInput = {
        code: form.get('code').toString(),
      }

      console.log('addSelfToSection.createInput', createInput);

      response = await client.graphql({
        query: addSelfToSection,
        variables: createInput,
      })

      console.log('addSelfToSection.response', response)

    } catch (errors) {
      console.error(errors)
      //   throw new Error(errors[0].message)
    }


    // CognitoIdentityProviderClientConfig.setRefreshThreshold(100000);
    // AWSMobileClient.getInstance().getTokens();
  
    const {
      username,
      signInDetails
    } = await getCurrentUser({bypassCache: true});
  
    const {
      tokens: session
    } = await fetchAuthSession({forceRefresh: true});

    console.log('username', username)
    console.log('signInDetails', signInDetails)
    console.log('session', session)
  
    await DataStore.clear(Section);
    await DataStore.start();
  
    setOpenAddStudentToSection(false)
    setIsWorking(false)

    // If the path is sections then reload the page
    if (router.pathname === '/sections' || router.pathname.includes('/section/') || router.pathname === '/') {
      router.reload();
    }
  }


  


  return (
    <>
      <Toolbar
        variant="dense"
      >
        <Button
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
          onClick={toggleDrawer('left', true)}
        >
          <MenuIcon />
        </Button>
        {/* <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}> */}
        {children &&
          children
        }
        {/* </Typography> */}
        <Button
          size="large"
          // edge="start"
          color="inherit"
          aria-label="Add User to Section"
          sx={{ mr: 2 }}
          onClick={() => setOpenAddStudentToSection(true)}
        // onClick={toggleDrawer('left', true)}
        >
          <PersonAddIcon />
        </Button>
        {/**
         * @todo Add a button for the settings menu.
         * 
         * @todo Add a button for the page's help menu?
         * A component for the help dialog. And a walkthrough for the page. Video, text, and images?
         */}
         {/* <HelpMenu />
         <SettingsMenu /> */}
         <UserMenu />
         
         

         {/**
          * Dropdown for the user.
        */}

      </Toolbar>
      {(['left']).map((anchor) => (
        <React.Fragment key={anchor}>
          {/* <Button onClick={toggleDrawer(anchor, true)}>{anchor}</Button> */}
          <SwipeableDrawer
            anchor={anchor}
            open={state[anchor]}
            onClose={toggleDrawer(anchor, false)}
            onOpen={toggleDrawer(anchor, true)}
            style={{ zIndex: 2000 }}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            slotProps={{
              backdrop: {
                sx: {
                  backgroundColor: 'rgba(0,0,0,0.25)',
                },
              },
            }}
            PaperProps={
              {
                sx: {
                  backdropFilter: 'blur(7px)',
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                }
              }
            }
          >
            <Box
              sx={{ width: anchor === 'top' || anchor === 'bottom' ? 'auto' : 250 }}
              role="presentation"
              onClick={toggleDrawer(anchor, false)}
              onKeyDown={toggleDrawer(anchor, false)}
              
            >
              <List
                sx={{
                  color: 'black',
                }}
              >
                <ListItem disablePadding>
                  <ListItemButton component="a" href='/'>
                    <ListItemIcon
                    
                    sx={{
                      color: 'black',
                    }}
                    >
                      <HomeIcon />
                    </ListItemIcon>
                    <ListItemText primary='Home' />
                  </ListItemButton>
                </ListItem>
                {/* <ListItem disablePadding>
                  <ListItemButton component="a" href='/about'>
                    <ListItemIcon>
                      <BatteryUnknownIcon />
                    </ListItemIcon>
                    <ListItemText primary='About Us' />
                  </ListItemButton>
                </ListItem> */}
                <ListItem disablePadding>
                  <ListItemButton component="a" href='/sections'>
                  <ListItemIcon
                    
                    sx={{
                      color: 'black',
                    }}
                    >
                      <PeopleIcon />
                    </ListItemIcon>
                    <ListItemText primary='Sections' />
                  </ListItemButton>
                </ListItem>
                {/* <ListItem disablePadding>
                  <ListItemButton component="a" href='/assignments'>
                    <ListItemIcon>
                      <GradingIcon />
                    </ListItemIcon>
                    <ListItemText primary='Assignments' />
                  </ListItemButton>
                </ListItem> */}
                <ListItem disablePadding>
                  <ListItemButton component="a" href='/units'>
                  <ListItemIcon
                    
                    sx={{
                      color: 'black',
                    }}
                    >
                      <MenuBookIcon />
                    </ListItemIcon>
                    <ListItemText primary='Units' />
                  </ListItemButton>
                </ListItem>
              </List>
            </Box>
          </SwipeableDrawer>

          {/**
         * Add a modal for adding a user to a section by section code
         */}

<Dialog open={openAddStudentToSection}
  onClose={() => setOpenAddStudentToSection(false)}
 aria-labelledby="form-dialog-title"
                
                slotProps={{
                    backdrop: {
                      sx: {
                        //Your style here....
                        backdropFilter: 'blur(1px)'
                      },
                    },}}
                >
                        <form onSubmit={addStudentToSection}>

                        <DialogTitle id="form-dialog-title">Add self to Section</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                Add yourself as a student to a section by entering the section code.
                        </DialogContentText>
                        <br/>


                            <TextField
                                sx={{ width: '100%' }}
                                required
                                id="code"
                                name="code"
                                label="Code"
                                variant="outlined"
                            /><br /><br />

                            <br /><br />

                        </DialogContent>
                        <DialogActions
                            sx={{
                                padding: '2rem',                                
                            }}
                        >
                            <Button disabled={work}
                                onClick={() => setOpenAddStudentToSection(false)}
                            color="primary" variant="outlined">
                                Cancel
                        </Button>
                            <Button disabled={work} type="submit" variant="contained">
                                Add
                        </Button>
                        </DialogActions>
                    </form>
                </Dialog>


        </React.Fragment>
      ))}
    </>
  );
}