'use client';

import * as React from 'react';
import ThemeRegistry from './ThemeRegistry';

import '../src/components/Editor3/theme.css';
import '../src/components/Editor3/components/LanguageEditorTheme.css';

import { Amplify } from 'aws-amplify';
import { parseAmplifyConfig } from 'aws-amplify/utils';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { DebugPanelProvider } from '../src/components/DebugPanel';
import AuthContext, { AuthProvider } from '../src/context/authContext';
import AppShell from '../src/components/AppShell';
import { SettingsProvider } from '../src/context/settingsContext';
import { NotificationProvider } from '../src/context/notificationContext';
import { TourProvider } from '../src/context/tourContext';
import { ChatContextProvider } from '../src/context/chatContext';
import { EasterEggLayer } from '../src/components/Gamification/EasterEggLayer';
import GlobalChatButton from '../src/components/GlobalChatButton';
import GlobalChatDrawer from '../src/components/GlobalChatDrawer';
import OfflineBanner from '../src/components/OfflineBanner';
import { useGlobalChatShortcut } from '../src/hooks/useGlobalChatShortcut';
import AppSkeleton from '../src/components/AppSkeleton';
import outputs from '../amplify_outputs.json';
import { usePathname, useRouter } from 'next/navigation';
import { ChunkedCookieStorage } from '../src/utils/chunkedCookieStorage';

// Configure Amplify Gen 2 with existing REST API resources
const amplifyConfig = parseAmplifyConfig(outputs);

Amplify.configure(
  {
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
  },
  { ssr: true },
);

// Override default CookieStorage with chunked implementation to handle
// large Cognito idTokens (>4KB due to many cognito:groups)
cognitoUserPoolsTokenProvider.setKeyValueStorage(
  new ChunkedCookieStorage({ sameSite: 'lax' }),
);

/** Routes that don't require authentication (defense-in-depth, proxy.ts is primary gate) */
const PUBLIC_PATHS = ['/', '/privacy', '/offline'];

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = React.useContext(AuthContext);
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) return;
    if (user) return;
    if (!pathname) return;

    // Allow public paths through without redirect
    const isPublic = PUBLIC_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
    if (isPublic) return;

    // Redirect unauthenticated users to root (shows login modal)
    router.replace(`/?returnUrl=${encodeURIComponent(pathname)}`);
  }, [isLoading, user, pathname, router]);

  if (isLoading) return <AppSkeleton />;
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useGlobalChatShortcut();

  const hideChatButton =
    pathname?.startsWith('/workbook/') || pathname?.startsWith('/unit/');

  return (
    <ThemeRegistry>
      <DebugPanelProvider>
        <AuthProvider>
          <AuthGate>
            <SettingsProvider>
              <NotificationProvider>
              <ChatContextProvider>
                <TourProvider>
                  <AppShell>{children}</AppShell>
                  <GlobalChatButton show={!hideChatButton} />
                  <GlobalChatDrawer />
                  <OfflineBanner />
                  <EasterEggLayer />
                </TourProvider>
              </ChatContextProvider>
              </NotificationProvider>
            </SettingsProvider>
          </AuthGate>
        </AuthProvider>
      </DebugPanelProvider>
    </ThemeRegistry>
  );
}
