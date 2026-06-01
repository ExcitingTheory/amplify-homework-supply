import React from 'react';
import { Box, Button, Typography, TextField, Alert } from '@mui/material';
import { TranslationOverlay } from './TranslationOverlay';
import { useContext } from 'react';
import { useGlobals } from 'storybook/preview-api';
import { useTranslations } from 'next-intl';

export interface TranslationDemoProps {
  namespace?: string;
  storyName?: string;
}

/**
 * Demo component showing how to wrap text with TranslationOverlay
 * This demo uses actual translation keys from the auth namespace to showcase rich metadata
 */
export const TranslationDemo: React.FC<TranslationDemoProps> = ({ namespace = 'auth', storyName }) => {
  const t = useTranslations('auth');
  
  return (
    <Box sx={{ p: 3, maxWidth: 600 }} data-tour="translation-demo">
      <Typography variant="h4" gutterBottom data-tour="translation-demo-title">
        <TranslationOverlay tKey="demo.title" namespace="stories" value="Translation Mode Demo" storyName={storyName}>
          Translation Mode Demo
        </TranslationOverlay>
      </Typography>

      <Typography variant="body1" paragraph data-tour="translation-demo-description">
        <TranslationOverlay 
          tKey="demo.description" 
          namespace="stories" 
          value="Click on any text to see its full metadata including context, component location, usage, impact, tone, and alternative terms."
          storyName={storyName}
        >
          Click on any text to see its full metadata including context, component location, usage, impact, tone, and alternative terms.
        </TranslationOverlay>
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }} data-tour="translation-demo-instructions">
        <TranslationOverlay 
          tKey="demo.instructions" 
          namespace="stories" 
          value="Enable Translation Mode from the toolbar above, then click on any highlighted text to see the rich English metadata from translation files"
          storyName={storyName}
        >
          Enable Translation Mode from the toolbar above, then click on any highlighted text to see the rich English metadata from translation files
        </TranslationOverlay>
      </Alert>

      {/* Auth form demo with actual keys from auth.json */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }} data-tour="translation-auth-form">
        <Typography variant="h6" gutterBottom>
          <TranslationOverlay tKey="demo.auth_form_heading" namespace="stories" value="Authentication Form" storyName={storyName}>
            Authentication Form
          </TranslationOverlay>
        </Typography>
        
        <TextField
          fullWidth
          label={
            <TranslationOverlay tKey="username" namespace="auth" value="Username" storyName={storyName}>
              Username
            </TranslationOverlay>
          }
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          type="password"
          label={
            <TranslationOverlay tKey="password" namespace="auth" value="Password" storyName={storyName}>
              Password
            </TranslationOverlay>
          }
          sx={{ mb: 2 }}
        />
 
        <TextField
          fullWidth
          label={
            <TranslationOverlay tKey="email" namespace="auth" value="Email" storyName={storyName}>
              Email
            </TranslationOverlay>
          }
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }} data-tour="translation-auth-buttons">
          <Button variant="contained" fullWidth>
            <TranslationOverlay tKey="sign_in" namespace="auth" value="Sign In" storyName={storyName}>
              Sign In
            </TranslationOverlay>
          </Button>
          <Button variant="outlined" fullWidth>
            <TranslationOverlay tKey="sign_up" namespace="auth" value="Sign Up" storyName={storyName}>
              Sign Up
            </TranslationOverlay>
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Button variant="text" size="small">
            <TranslationOverlay tKey="forgot_password" namespace="auth" value="Forgot Password?" storyName={storyName}>
              Forgot Password?
            </TranslationOverlay>
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button variant="contained">
          <TranslationOverlay tKey="reset_password" namespace="auth" value="Reset Password" storyName={storyName}>
            Reset Password
          </TranslationOverlay>
        </Button>
        <Button variant="outlined">
          <TranslationOverlay tKey="sign_out" namespace="auth" value="Sign Out" storyName={storyName}>
            Sign Out
          </TranslationOverlay>
        </Button>
      </Box>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }} data-tour="translation-password-reset">
        <Typography variant="h6" gutterBottom>
          <TranslationOverlay tKey="demo.password_reset_heading" namespace="stories" value="Password Reset Flow" storyName={storyName}>
            Password Reset Flow
          </TranslationOverlay>
        </Typography>
        <TextField
          fullWidth
          type="password"
          label={
            <TranslationOverlay tKey="confirm_password" namespace="auth" value="Confirm Password" storyName={storyName}>
              Confirm Password
            </TranslationOverlay>
          }
          placeholder="Re-enter your password"
          helperText={
            <TranslationOverlay tKey="confirm_password_placeholder" namespace="auth" value="Re-enter your password" storyName={storyName}>
              {t('confirm_password_placeholder', 'Re-enter your password')}
            </TranslationOverlay>
          }
          sx={{ mb: 2 }}
        />
      </Box>
    </Box>
  );
};
