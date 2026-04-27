/**
 * @module MainToolbar
 * @category Components
 * @description MainToolbar component
 * 
 * MainToolbar component for the app
 * @todo Add a dropdown for the user.
 * @todo Add a dropdown for the settings.
 * @todo Add a dropdown for the help.
 */

import * as React from 'react';
import { useTranslation } from 'next-i18next';
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
import Divider from '@mui/material/Divider';
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
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupsIcon from '@mui/icons-material/Groups';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import { signOut } from 'aws-amplify/auth';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import Switch from '@mui/material/Switch';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';

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
import { getAmplifyClient } from '../utils/amplifyClient';
import { useColorMode } from '../hooks/useColorMode';
import { LevelBadge } from './Gamification/LevelBadge';
import SyncStatusIndicator from './SyncStatusIndicator';
import { useXP } from '../context/xpContext';
import EditNoteIcon from '@mui/icons-material/EditNote';
import RateReviewIcon from '@mui/icons-material/RateReview';
import JoinPracticeDialog from './PracticeDrill/JoinPracticeDialog';
import { JoinWorkbookDialog } from './Workbook';
import { JoinPeerReviewDialog } from './PeerReview';

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
  const { t } = useTranslation(['components', 'common']);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const router = useRouter()  
  const { mode: colorMode, setColorMode } = useColorMode();

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
        aria-label={t('common.settings', { ns: 'common' })}
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
        <ToggleMenuItem label={t('mainToolbar.settings.disableNotifications', 'Disable notifications')} />
        <MenuItem>
          <ListItemText primary={t('mainToolbar.settings.colorMode', 'Color mode')} />
          <ToggleButtonGroup
            value={colorMode}
            exclusive
            onChange={(e, val) => val && setColorMode(val)}
            size="small"
            sx={{ ml: 1 }}
          >
            <ToggleButton value="light" aria-label="Light mode">
              <LightModeIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="auto" aria-label="System mode">
              <SettingsBrightnessIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="dark" aria-label="Dark mode">
              <DarkModeIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </MenuItem>
        <ToggleMenuItem label={t('mainToolbar.settings.experimentalFeatures', 'Experimental features')} />
        <ToggleMenuItem label={t('mainToolbar.settings.studentMode', 'Student mode')} />

        {/* <MenuItem onClick={handleSettings}>Change password</MenuItem> */}
      </Menu>
    </div>
  )
}


export function HelpMenu() {
  const { t } = useTranslation(['components', 'common']);
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
        aria-label={t('common.help', { ns: 'common' })}
        aria-controls={open ? 'help-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        data-tour="help-menu"
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
        <MenuItem onClick={handleHelp}>{t('mainToolbar.help', 'Help')}</MenuItem>
      </Menu>
    </div>
  )
}


export function UserMenu() {
  const { t } = useTranslation(['common', 'auth']);
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

  return (
    <div>
      <IconButton
        id="user-button"
        color="inherit"
        aria-label={t('navigation.profile', { ns: 'common' })}
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
      </IconButton>
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        {/* Lazy render menu items only when open - prevents translation calls during initial render */}
        {open && (
          <>
            <MenuItem onClick={() => {
              router.push('/profile')
            }}><UserIcon/>&nbsp;{t('common:navigation.profile')}</MenuItem>
            <MenuItem onClick={() => {
              router.push('/settings')
            }}><SettingsBrightnessIcon/>&nbsp;{t('common:navigation.settings', 'Settings')}</MenuItem>
            <MenuItem onClick={() => {
              signOut();
            }}>
              <LogoutIcon/>&nbsp;{t('auth:sign_out')}</MenuItem>
          </>
        )}
      </Menu>
    </div>
  );
}


export default function MainToolbar({ children }) {
  const { t } = useTranslation(['common', 'components', 'editor.authoring']);
  const { level } = useXP();
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
  const [openJoinStudyGroup, setOpenJoinStudyGroup] = React.useState(false);
  const [openJoinWorkbook, setOpenJoinWorkbook] = React.useState(false);
  const [openJoinPeerReview, setOpenJoinPeerReview] = React.useState(false);

  // Secret debug mode activation: Click menu icon 7 times within 3 seconds
  const clickTimestamps = React.useRef([]);
  const handleSecretDebugActivation = React.useCallback(() => {
    const now = Date.now();
    clickTimestamps.current.push(now);
    
    // Keep only clicks from the last 3 seconds
    clickTimestamps.current = clickTimestamps.current.filter(time => now - time < 3000);
    
    // If 7 clicks within 3 seconds, enable debug mode
    if (clickTimestamps.current.length >= 7) {
      localStorage.setItem('debug-mode-enabled', 'true');
      clickTimestamps.current = [];
      alert('🐛 Debug mode enabled! Refresh the page to activate the debug panel.\n\nUse Cmd/Ctrl + Shift + D to open the debug panel.');
    }
  }, []);

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
      const client = getAmplifyClient();

      response = await client.mutations.addSelfToSection(createInput);

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
  
    // Note: Gen2 doesn't use DataStore local cache, so clear is not needed
    // Gen2 client will automatically sync with backend
  
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
        sx={{ 
          minHeight: '48px',
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <IconButton
          edge="start"
          color="inherit"
          aria-label={t('mainToolbar.menuAttribute', { ns: 'editor.authoring' })}
          onClick={(e) => {
            handleSecretDebugActivation();
            toggleDrawer('left', true)(e);
          }}
        >
          <MenuIcon />
        </IconButton>
        {/* <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}> */}
        {children &&
          children
        }
        {/* </Typography> */}
        <Box sx={{ flexGrow: 1 }} />
        <SyncStatusIndicator />
        <LevelBadge level={level} showProgress size="small" />
        <IconButton
          color="inherit"
          aria-label={t('mainToolbar.joinStudyGroup', { ns: 'common', defaultValue: 'Join Study Group' })}
          data-tour="join-study-group-button"
          onClick={() => setOpenJoinStudyGroup(true)}
        >
          <GroupsIcon />
        </IconButton>
        <IconButton
          color="inherit"
          aria-label={t('mainToolbar.addToSection.title', { ns: 'common' })}
          data-tour="join-section-button"
          onClick={() => setOpenAddStudentToSection(true)}
        >
          <PersonAddIcon />
        </IconButton>
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
            sx={{
              marginTop: '4rem',
              zIndex: (theme) => theme.zIndex.drawer + 3
            }}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            slotProps={{
              backdrop: {
                sx: {
                  backgroundColor: 'action.disabledBackground',
                },
              },
            }}
            PaperProps={
              {
                sx: {
                  backdropFilter: 'blur(7px)',
                  backgroundColor: 'custom.glassNavbar',
                }
              }
            }
          >
            <Box
              sx={{
                marginTop: '4rem',
                width: anchor === 'top' || anchor === 'bottom' ? 'auto' : 250 }}
              role="presentation"
              onClick={toggleDrawer(anchor, false)}
              onKeyDown={toggleDrawer(anchor, false)}
              
            >
              <List
                sx={{
                  color: 'text.primary',
                }}
              >
                <ListItem disablePadding>
                  <ListItemButton component="a" href='/'>
                    <ListItemIcon
                    
                    sx={{
                      color: 'text.primary',
                    }}
                    >
                      <HomeIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('common:navigation.home')} />
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
                      color: 'text.primary',
                    }}
                    >
                      <PeopleIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('common:navigation.sections')} />
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
                      color: 'text.primary',
                    }}
                    >
                      <MenuBookIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('common:navigation.units')} />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component="a" href='/leaderboard'>
                  <ListItemIcon
                    sx={{
                      color: 'text.primary',
                    }}
                    >
                      <LeaderboardIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('common:navigation.leaderboard', 'Leaderboard')} />
                  </ListItemButton>
                </ListItem>
              </List>
              <Divider />
              <List
                sx={{
                  color: 'text.primary',
                }}
              >
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenJoinStudyGroup(true)
                    }}
                  >
                    <ListItemIcon sx={{ color: 'text.primary' }}>
                      <GroupsIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('common:navigation.joinStudyGroup', 'Join Study Group')}
                      secondary={t('common:navigation.joinStudyGroupDesc', 'Enter a room code')}
                    />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenJoinWorkbook(true)
                    }}
                  >
                    <ListItemIcon sx={{ color: 'text.primary' }}>
                      <EditNoteIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('common:navigation.joinWorkbook', 'Join Workbook Session')}
                      secondary={t('common:navigation.joinWorkbookDesc', 'Enter a workbook link or ID')}
                    />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenJoinPeerReview(true)
                    }}
                  >
                    <ListItemIcon sx={{ color: 'text.primary' }}>
                      <RateReviewIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('common:navigation.joinPeerReview', 'Join Peer Review')}
                      secondary={t('common:navigation.joinPeerReviewDesc', 'Enter a review room code')}
                    />
                  </ListItemButton>
                </ListItem>
              </List>
            </Box>
          </SwipeableDrawer>

          {/**
         * Add a modal for adding a user to a section by section code
         */}

<Dialog
  open={openAddStudentToSection}
  onClose={() => setOpenAddStudentToSection(false)}
  data-tour="join-section-dialog"
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

                        <DialogTitle id="form-dialog-title">{t('mainToolbar.addToSection.title', 'Add self to Section')}</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                {t('mainToolbar.addToSection.description', 'Add yourself as a student to a section by entering the section code.')}
                        </DialogContentText>
                        <br/>


                            <TextField
                                sx={{ width: '100%' }}
                                required
                                id="code"
                                name="code"
                                data-tour="join-code-input"
                                label={t('mainToolbar.addToSection.codeLabel', 'Code')}
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
                                {t('common:actions.cancel')}
                        </Button>
                            <Button disabled={work} type="submit" variant="contained">
                                {t('mainToolbar.addToSection.add', 'Add')}
                        </Button>
                        </DialogActions>
                    </form>
                </Dialog>

                {/* Join Study Group Dialog */}
                <JoinPracticeDialog
                  open={openJoinStudyGroup}
                  onClose={() => setOpenJoinStudyGroup(false)}
                  onJoin={(sessionInfo) => {
                    setOpenJoinStudyGroup(false)
                    // Navigate to units page with join params
                    router.push({
                      pathname: '/units',
                      query: {
                        joinSession: sessionInfo.sessionId,
                        joinRoom: sessionInfo.roomCode,
                        joinUnit: sessionInfo.unitID,
                      },
                    })
                  }}
                />

                {/* Join Workbook Session Dialog */}
                <JoinWorkbookDialog
                  open={openJoinWorkbook}
                  onClose={() => setOpenJoinWorkbook(false)}
                  onJoin={({ unitId }) => {
                    setOpenJoinWorkbook(false)
                    router.push(`/workbook/${unitId}`)
                  }}
                />

                {/* Join Peer Review Dialog */}
                <JoinPeerReviewDialog
                  open={openJoinPeerReview}
                  onClose={() => setOpenJoinPeerReview(false)}
                  onJoin={({ roomId }) => {
                    setOpenJoinPeerReview(false)
                    router.push(`/review/${roomId}`)
                  }}
                />


        </React.Fragment>
      ))}
    </>
  );
}