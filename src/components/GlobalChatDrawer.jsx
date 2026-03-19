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
    IconButton,
    Box,
    Typography,
    Toolbar,
    Divider,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
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
    const { t, ready } = useTranslation('components');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { isChatOpen, setIsChatOpen } = useContext(ChatContext);
    
    // Don't render until translations are ready to prevent hydration errors
    if (!ready) return null;
    
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
        >
            {/* Header */}
            <Toolbar
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    minHeight: 56,
                }}
            >
                <Typography variant="h6" component="div">
                    {t('chat.aiAssistant')}
                </Typography>
                <IconButton
                    edge="end"
                    color="inherit"
                    onClick={handleClose}
                    aria-label={t('chat.close')}
                    data-testid="chat-close-button"
                >
                    <CloseIcon />
                </IconButton>
            </Toolbar>
            
            <Divider />
            
            {/* Chat Content */}
            <Box
                sx={{
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <ChatSidebar />
            </Box>
        </Drawer>
    );
}

export default GlobalChatDrawer;
