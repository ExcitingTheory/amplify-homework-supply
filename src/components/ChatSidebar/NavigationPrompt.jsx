/**
 * NavigationPrompt - Prompt user to navigate when context is unavailable
 * 
 * Displayed in chat when AI tries to use a tool that requires context
 * not available on the current page (e.g., inserting blocks without editorRef).
 * 
 * @see docs/GLOBAL_CHAT_INTEGRATION_PLAN.md
 */

import React from 'react';
import {
    Alert,
    AlertTitle,
    Button,
    Box,
    Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import EditIcon from '@mui/icons-material/Edit';
import SchoolIcon from '@mui/icons-material/School';
import GroupIcon from '@mui/icons-material/Group';

/**
 * Map of required context to target pages
 */
const CONTEXT_TO_PAGE = {
    editorRef: {
        icon: EditIcon,
        pathTemplate: '/unit/:unitId',
        translateKey: 'editor',
        defaultLabel: 'Unit Editor',
    },
    unit: {
        icon: SchoolIcon,
        pathTemplate: '/units',
        translateKey: 'units',
        defaultLabel: 'Units',
    },
    sections: {
        icon: GroupIcon,
        pathTemplate: '/sections',
        translateKey: 'sections',
        defaultLabel: 'Sections',
    },
};

/**
 * NavigationPrompt component
 * 
 * @param {object} props - Component props
 * @param {string} props.requiredContext - The context type that's missing (e.g., 'editorRef', 'unit')
 * @param {string} [props.unitId] - Unit ID if navigating to editor
 * @param {string} [props.message] - Custom message to display
 * @param {Function} [props.onNavigate] - Callback when navigation occurs
 * @returns {JSX.Element}
 */
export function NavigationPrompt({
    requiredContext,
    unitId,
    message,
    onNavigate,
}) {
    const { t } = useTranslation('components');
    const router = useRouter();
    
    const contextInfo = CONTEXT_TO_PAGE[requiredContext];
    
    if (!contextInfo) {
        console.warn('[NavigationPrompt] Unknown required context:', requiredContext);
        return null;
    }
    
    const Icon = contextInfo.icon;
    
    // Build navigation path
    let targetPath = contextInfo.pathTemplate;
    if (requiredContext === 'editorRef' && unitId) {
        targetPath = `/unit/${unitId}`;
    }
    
    const handleNavigate = () => {
        console.log('[NavigationPrompt] Navigating to:', targetPath);
        if (onNavigate) {
            onNavigate(targetPath);
        }
        router.push(targetPath);
    };
    
    const defaultMessage = t(
        `chat.navigationPrompts.${requiredContext}`,
        `This feature requires being on the ${contextInfo.defaultLabel} page.`
    );
    
    return (
        <Alert
            severity="info"
            icon={<Icon />}
            sx={{
                my: 1,
                '& .MuiAlert-message': {
                    width: '100%',
                },
            }}
            data-testid="navigation-prompt"
        >
            <AlertTitle>
                {t('chat.navigationRequired', 'Navigation Required')}
            </AlertTitle>
            <Typography variant="body2" sx={{ mb: 1.5 }}>
                {message || defaultMessage}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                    size="small"
                    variant="contained"
                    endIcon={<NavigateNextIcon />}
                    onClick={handleNavigate}
                    sx={{ mt: 0.5 }}
                >
                    {t(
                        `chat.goTo.${contextInfo.translateKey}`,
                        `Go to ${contextInfo.defaultLabel}`
                    )}
                </Button>
            </Box>
        </Alert>
    );
}

export default NavigationPrompt;
