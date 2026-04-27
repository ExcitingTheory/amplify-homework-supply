/**
 * GlobalChatDrawer - Global drawer containing ChatSidebar
 * 
 * A persistent drawer that slides in from the right containing the AI assistant chat.
 * Accessible from all pages via GlobalChatButton or keyboard shortcut.
 * 
 * @see docs/GLOBAL_CHAT_INTEGRATION_PLAN.md
 */

import React, { useContext } from 'react';
import {
    Drawer,
    Box,
    useMediaQuery,
} from '@mui/material';
import { useTranslation } from 'next-i18next';
import ChatContext from '../context/chatContext';
import ChatSidebar from './ChatSidebar';

/**
 * GlobalChatDrawer component
 * 
 * Manages the drawer state and renders ChatSidebar inside it.
 * 
 * @param {object} props - Component props
 * @param {number} [props.width=450] - Drawer width in pixels
 * @returns {JSX.Element}
 */
export function GlobalChatDrawer({ width = 450 }) {
    const { t } = useTranslation('components');
    // noSsr: true ensures the initial client render matches SSR (both return false),
    // then re-renders with the actual value after mount — avoiding hydration mismatch.
    const isMobile = useMediaQuery('(max-width:599.95px)', { noSsr: true });
    const { isChatOpen, setIsChatOpen } = useContext(ChatContext);
    
    const handleClose = () => {
        console.log('[GlobalChatDrawer] Closing chat');
        setIsChatOpen(false);
    };
    
    // On mobile, drawer should be fullscreen
    const drawerWidth = isMobile ? '100%' : width;
    
    return (
        <Drawer
            anchor="right"
            open={isChatOpen}
            onClose={handleClose}
            variant={isMobile ? 'temporary' : 'persistent'}
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    // Match app bar height if present
                    ...(!isMobile && {
                        top: 64, // AppBar height
                        height: 'calc(100% - 64px)',
                    }),
                },
            }}
            ModalProps={{
                keepMounted: true, // Better mobile performance
            }}
            data-testid="global-chat-drawer"
            data-tour="chat-sidebar"
        >
            {/* Chat Content */}
            <Box
                sx={{
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <ChatSidebar onClose={handleClose} />
            </Box>
        </Drawer>
    );
}

export default GlobalChatDrawer;
