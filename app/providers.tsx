'use client';

import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import theme from '../src/theme';
import createEmotionCache from '../src/createEmotionCache';

import '../src/components/Editor3/theme.css';
import '../src/components/Editor3/components/LanguageEditorTheme.css';

import { Amplify } from 'aws-amplify';
import { parseAmplifyConfig } from 'aws-amplify/utils';
import { DebugPanelProvider } from '../src/components/DebugPanel';
import AuthContext, { AuthProvider } from '../src/context/authContext';
import { SettingsProvider } from '../src/context/settingsContext';
import { TourProvider } from '../src/context/tourContext';
import { ChatContextProvider } from '../src/context/chatContext';
import { EasterEggLayer } from '../src/components/Gamification/EasterEggLayer';
import GlobalChatButton from '../src/components/GlobalChatButton';
import GlobalChatDrawer from '../src/components/GlobalChatDrawer';
import OfflineBanner from '../src/components/OfflineBanner';
import { useGlobalChatShortcut } from '../src/hooks/useGlobalChatShortcut';
import AppSkeleton from '../src/components/AppSkeleton';
import outputs from '../amplify_outputs.json';
import { usePathname } from 'next/navigation';

// Configure Amplify Gen 2 with existing REST API resources
const amplifyConfig = parseAmplifyConfig(outputs);

Amplify.configure({
  ...amplifyConfig,
  API: {
    ...amplifyConfig.API,
    REST: {
      ...amplifyConfig.API?.REST,
      homeworkSupplyStreamApi: {
        endpoint: outputs.custom.homeworkSupplyStreamApi.endpoint,
        region: outputs.custom.homeworkSupplyStreamApi.region,
      },
    },
  },
});

const clientSideEmotionCache = createEmotionCache();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = React.useContext(AuthContext);
  if (isLoading) return <AppSkeleton />;
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useGlobalChatShortcut();

  const hideChatButton =
    pathname.startsWith('/workbook/') || pathname.startsWith('/unit/');

  return (
    <CacheProvider value={clientSideEmotionCache}>
      <InitColorSchemeScript defaultMode="system" attribute="data-mui-color-scheme" />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <DebugPanelProvider>
          <AuthProvider>
            <AuthGate>
              <SettingsProvider>
                <ChatContextProvider>
                  <TourProvider>
                    {children}
                    <GlobalChatButton show={!hideChatButton} />
                    <GlobalChatDrawer />
                    <OfflineBanner />
                    <EasterEggLayer />
                  </TourProvider>
                </ChatContextProvider>
              </SettingsProvider>
            </AuthGate>
          </AuthProvider>
        </DebugPanelProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}
