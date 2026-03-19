/**
 * GlobalChatButton - Floating Action Button to open global chat
 * 
 * A fixed-position FAB that appears on all pages (except editor which has its own chat).
 * Clicking it opens the GlobalChatDrawer.
 * 
 * @see docs/GLOBAL_CHAT_INTEGRATION_PLAN.md
 */

import React, { useContext } from 'react';
import { Fab, Badge, Tooltip, Zoom } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import { useTranslation } from 'next-i18next';
import ChatContext from '../context/chatContext';

/**
 * GlobalChatButton component
 * 
 * @param {object} props - Component props
 * @param {boolean} [props.show=true] - Whether to show the button
 * @param {number} [props.unreadCount=0] - Number of unread messages (for badge)
 * @returns {JSX.Element}
 */
export function GlobalChatButton({ show = true, unreadCount = 0 }) {
    const { t, ready } = useTranslation('common');
    const { isChatOpen, setIsChatOpen } = useContext(ChatContext);
    
    const handleClick = () => {
        console.log('[GlobalChatButton] Opening chat');
        setIsChatOpen(true);
    };
    
    // Don't show if explicitly hidden, chat is already open, or translations not ready
    if (!show || isChatOpen || !ready) {
        return null;
    }
    
    return (
        <Zoom in={show}>
            <Tooltip
                title={t('chat.openAssistant')}
                placement="left"
                arrow
            >
                <Fab
                    color="primary"
                    aria-label={t('chat.openAssistant')}
                    onClick={handleClick}
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        zIndex: (theme) => theme.zIndex.speedDial,
                        // Ensure it stays above most content
                        boxShadow: (theme) => theme.shadows[8],
                        '&:hover': {
                            boxShadow: (theme) => theme.shadows[12],
                        },
                    }}
                    data-testid="global-chat-button"
                >
                    <Badge
                        badgeContent={unreadCount}
                        color="error"
                        max={99}
                        invisible={unreadCount === 0}
                    >
                        <ChatIcon />
                    </Badge>
                </Fab>
            </Tooltip>
        </Zoom>
    );
}

export default GlobalChatButton;
