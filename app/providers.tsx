"use client";

import * as React from "react";
import ThemeRegistry from "./ThemeRegistry";

import "../src/components/Editor3/theme.css";
import "../src/components/Editor3/components/LanguageEditorTheme.css";

import { Amplify } from "aws-amplify";
import { parseAmplifyConfig } from "aws-amplify/utils";
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import { DebugPanelProvider } from "../src/components/DebugPanel";
import AuthContext, { AuthProvider } from "../src/context/authContext";
import AppShell from "../src/components/AppShell";
import { SettingsProvider } from "../src/context/settingsContext";
import DynamicThemeProvider from "../src/components/DynamicThemeProvider";
import { NotificationProvider } from "../src/context/notificationContext";
import { TourProvider } from "../src/context/tourContext";
import { ChatContextProvider } from "../src/context/chatContext";
import { SearchProvider } from "../src/context/searchContext";
import { EasterEggLayer } from "../src/components/Gamification/EasterEggLayer";
import GlobalChatButton from "../src/components/GlobalChatButton";
import GlobalChatDrawer from "../src/components/GlobalChatDrawer";
import OfflineBanner from "../src/components/OfflineBanner";
import { useGlobalChatShortcut } from "../src/hooks/useGlobalChatShortcut";
import { usePageViewTracking } from "../src/hooks/usePageViewTracking";
import AppSkeleton from "../src/components/AppSkeleton";
import MyAuth from "../src/components/AmplifyAuthenticator";
import outputs from "../amplify_outputs.json";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChunkedCookieStorage } from "../src/utils/chunkedCookieStorage";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";

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
  new ChunkedCookieStorage({ sameSite: "lax" }),
);

/** Routes that don't require authentication (defense-in-depth, proxy.ts is primary gate) */
const PUBLIC_PATHS = ["/", "/privacy", "/offline"];

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = React.useContext(AuthContext);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  // Capture returnUrl query param into sessionStorage so MyAuth can redirect after login,
  // or navigate directly if the user is already authenticated (e.g., after a server-side
  // auth check race condition redirected back to the dashboard).
  React.useEffect(() => {
    const returnUrl = searchParams?.get("returnUrl");
    if (!returnUrl) return;
    if (!user) {
      sessionStorage.setItem("returnUrl", returnUrl);
    } else {
      router.replace(returnUrl);
    }
  }, [searchParams, user, router]);

  // Phase 6: When the user logs in, fetch CloudFront signed cookie values from
  // the getUnitsCdnCookie AppSync query and set them via document.cookie.
  // This gives the browser a 4-hour pass to fetch published unit content
  // (JSON, audio, images) directly from CloudFront at protected/units/*.
  React.useEffect(() => {
    if (!user) return;

    const client = generateClient<Schema>();
    // Guard: query may not exist until schema is deployed with getUnitsCdnCookie
    if (typeof client.queries.getUnitsCdnCookie !== "function") return;
    client.queries
      .getUnitsCdnCookie()
      .then(({ data, errors }) => {
        if (errors?.length || !data) {
          console.warn("[AuthGate] getUnitsCdnCookie errors:", errors);
          return;
        }
        const { policy, signature, keyPairId } = data;
        // Set as session cookies so they're sent on every CloudFront request.
        // The CDN domain must share a parent domain with the app for cookies to work
        // (handled at infra level — same Route 53 zone).
        const cookieBase = "; Path=/; Secure; SameSite=None";
        document.cookie = `CloudFront-Policy=${policy}${cookieBase}`;
        document.cookie = `CloudFront-Signature=${signature}${cookieBase}`;
        document.cookie = `CloudFront-Key-Pair-Id=${keyPairId}${cookieBase}`;
      })
      .catch((err) => {
        console.warn("[AuthGate] getUnitsCdnCookie failed:", err);
      });
  }, [user]);

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

  if (isLoading) return hydrated ? <AppSkeleton /> : null;

  // Logged-out users see the Authenticator login form
  if (!user) {
    return <MyAuth>{children}</MyAuth>;
  }

  return <>{children}</>;
}

export default function Providers({
  children,
  nonce,
}: {
  children: React.ReactNode;
  nonce?: string;
}) {
  const pathname = usePathname();

  useGlobalChatShortcut();
  usePageViewTracking();

  const hideChatButton =
    pathname?.includes("/workbook/") || pathname?.includes("/unit/");

  return (
    <ThemeRegistry nonce={nonce}>
      <DebugPanelProvider>
        <AuthProvider>
          <AuthGate>
            <SettingsProvider>
              <DynamicThemeProvider>
                <NotificationProvider>
                  <ChatContextProvider>
                    <SearchProvider>
                      <TourProvider>
                        <AuthenticatedShell hideChatButton={hideChatButton}>
                          {children}
                        </AuthenticatedShell>
                      </TourProvider>
                    </SearchProvider>
                  </ChatContextProvider>
                </NotificationProvider>
              </DynamicThemeProvider>
            </SettingsProvider>
          </AuthGate>
        </AuthProvider>
      </DebugPanelProvider>
    </ThemeRegistry>
  );
}

/**
 * Conditionally wraps children in AppShell (with nav) only when authenticated.
 * Logged-out users see content without the AppBar/drawer navigation.
 */
function AuthenticatedShell({
  children,
  hideChatButton,
}: {
  children: React.ReactNode;
  hideChatButton: boolean;
}) {
  const { user } = React.useContext(AuthContext);

  if (!user) {
    return <>{children}</>;
  }

  return (
    <>
      <AppShell toolbarChildren={null}>{children}</AppShell>
      <GlobalChatButton show={!hideChatButton} />
      <GlobalChatDrawer />
      <OfflineBanner />
      <EasterEggLayer />
    </>
  );
}
