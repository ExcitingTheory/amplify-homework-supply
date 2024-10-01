import * as React from 'react';
import { useEffect, useContext, useState } from 'react';
import Head from 'next/head'
import {
    Box,
    IconButton,
    Toolbar,
    Typography,
    Chip,
    Stack,
} from '@mui/material';
// import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import MainToolbar from '../../MainToolbar';

import MuiAppBar from '@mui/material/AppBar';
import { styled } from '@mui/material/styles';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TimerIcon from '@mui/icons-material/Timer';

const drawerWidth = 400;

export const CAN_USE_DOM =
    typeof window !== 'undefined' &&
    typeof window.document !== 'undefined' &&
    typeof window.document.createElement !== 'undefined';
export const IS_APPLE = CAN_USE_DOM && /Mac|iPod|iPhone|iPad/.test(navigator.platform);


import { $isAtNodeEnd } from '@lexical/selection';
import UnitContext from '../../../context/unitContext';

/**
 * @param {number} countDown
 * @returns {number[]} [hours, minutes, seconds]
 * 
 * @example
 * formatTime(1000) // [0, 0, 1]
 * 
 * @example
 * formatTime(1000 * 60 * 60 * 24) // [24, 0, 0]
 * 
 * @description 
 * Convert milliseconds to hours, minutes, seconds
 * 
 */
const formatTime = (countDown) => {

    const hours = Math.floor(
      (countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((countDown % (1000 * 60)) / 1000);
  
    return [hours, minutes, seconds];
  };


/**
 * 
 * @param {number} timerStartedAt
 * @param {number} timeLimitSeconds
 * @returns {JSX.Element}
 * 
 * @example
 * <TimeLeft timerStartedAt={1634170800000} timeLimitSeconds={60} />
 * 
 * @description
 * Display a countdown timer. Input is a timestamp and a number of seconds.
 */
function TimeLeft() {
    const {
        grade,
        unit,
    } = useContext(UnitContext);

    const timeLimitSeconds = unit?.timeLimitSeconds || 0;
    const timerStartedAt = grade?.createdAt


    const [countDown, setCountDown] = useState(timeLimitSeconds * 1000);


    useEffect(() => {
        if (!timerStartedAt) {
            setCountDown(timeLimitSeconds * 1000)
        }
        else if (timeLimitSeconds > 0 && timerStartedAt) {

            const [hours, minutes, seconds] = formatTime(timeLimitSeconds * 1000) //Convert to milliseconds
            let targetDate = new Date(timerStartedAt);

            targetDate.setMinutes(targetDate.getMinutes() + minutes); // timestamp
            targetDate.setSeconds(targetDate.getSeconds() + seconds); // timestamp

            const countDownDate = new Date(targetDate).getTime();

            const interval = setInterval(() => {
                console.log('TimeLeft.interval')
                const timeRemaining = countDownDate - new Date().getTime()
                if (timeRemaining <= 0) {
                    setCountDown(0)
                    clearInterval(interval);
                } else {
                    setCountDown(timeRemaining)
                }
            }, 1000);

            return () => clearInterval(interval);
        }

    }, [timeLimitSeconds, timerStartedAt])


    const [hoursLeft, minutesLeft, secondsLeft] = formatTime(countDown)
    const timeString = [
        hoursLeft.toString().padStart(2, '0'),
        minutesLeft.toString().padStart(2, '0'),
        secondsLeft.toString().padStart(2, '0')
    ].join(':')


    const isOutOfTime = (0 >= hoursLeft && 0 >= minutesLeft && 0 >= secondsLeft)

    const chipColor = !isOutOfTime ? 'primary' : undefined


    return (<>
        {timeLimitSeconds > 0 &&
            <Chip icon={<TimerIcon />} label={timeString} color={chipColor} />
        }
    </>)


}



export function getSelectedNode(
    selection,
) {
    const anchor = selection.anchor;
    const focus = selection.focus;
    const anchorNode = selection.anchor.getNode();
    const focusNode = selection.focus.getNode();
    if (anchorNode === focusNode) {
        return anchorNode;
    }
    const isBackward = selection.isBackward();
    if (isBackward) {
        return $isAtNodeEnd(focus) ? anchorNode : focusNode;
    } else {
        return $isAtNodeEnd(anchor) ? anchorNode : focusNode;
    }
}


const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));



export default function ToolBarRoPlugin({
    open,
    setOpen,
    setTabValue,
}) {
    const {
        unit,
        finishedQuestions,
        rubric,
    } = React.useContext(UnitContext);

    const name = unit?.name;
    const description = unit?.description;


    return (
        <>
            <style global jsx>{`
            .editor-toolbar button {
                min-width: 1rem;
            }
            `}</style>
            <AppBar
                position="absolute"
                color="default"
                sx={{
                    overflowX: 'visible',
                    boxShadow: 'none',
                    zIndex: (theme) => theme.zIndex.drawer + 2,
                }}
            >
                <MainToolbar>
                    <Box sx={{ flexGrow: 1, margin: '1rem' }}>
                        <Head>
                            <title>{name}</title>
                        </Head>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            {name || 'Untitled Unit'}
                        </Typography>

                        <Typography variant="p" component="div" sx={{ flexGrow: 1 }}>
                            {description || 'No Description'}
                        </Typography>

                    </Box>
                </MainToolbar>
            </AppBar>
            <AppBar
                position="absolute"
                color="default"
                sx={{
                    overflowX: 'auto',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    top: '5.25rem',
                    paddingTop: '0.5rem',
                    boxShadow: 'none',
                    borderBottom: '1px solid #e0e0e0',
                    paddingBottom: '0.25rem',
                }}
            >
                <Toolbar
                    className='editor-toolbar'
                    variant="dense"
                    disableGutters={true}
                    sx={{
                        margin: 'auto'
                    }}
                >

                    <Stack direction="row" spacing={1}
                        sx={{
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >

                    <IconButton
                        color="inherit"
                        onClick={() => {
                            setOpen(!open);
                        }}
                        title="Toggle Sidebar"
                        aria-label="Toggle Sidebar"
                    > {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                    </IconButton>
                    
                    <TimeLeft />

                    <Chip label={`${finishedQuestions} of ${rubric.length} Questions Completed`} variant="outlined" />
                    </Stack>

                </Toolbar>
            </AppBar>
        </>
    );
}