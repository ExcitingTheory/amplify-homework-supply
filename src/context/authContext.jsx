import React from "react";
import { fetchUserAttributes, fetchAuthSession, signOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

// NOTE: The AuthGate component in _app.jsx gates data-dependent providers
// behind auth resolution, so by the time other contexts mount and call
// list()/subscribe(), the SDK's internal credential cache is already warm.

const AuthContext = React.createContext({
  error: undefined,
  isLoading: true,
  user: undefined,
  session: undefined,
});

const AuthProvider = ({ children }) => {
    const [result, setResult] = React.useState({
        error: undefined,
        isLoading: true,
        user: undefined,
        session: undefined,
      });
      
      const fetchCurrentUserAttributes = React.useCallback(async () => {
        setResult((prevResult) => ({ ...prevResult, isLoading: true }));
        try {
          // Add timeout to prevent hanging indefinitely
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Authentication timeout')), 15000)
          );
          
          // Call fetchAuthSession FIRST to warm the credential provider cache.
          // fetchUserAttributes() internally calls fetchAuthSession() again, but
          // at that point the cache is populated so no additional IAM HTTP calls.
          // AuthGate in _app.jsx ensures this completes before data contexts mount.
          const sessionPromise = fetchAuthSession();
          const session = await Promise.race([sessionPromise, timeoutPromise]);
          const { identityId, tokens } = session || {};

          if (!tokens) {
            // No tokens = user not authenticated (expected on login page)
            console.log('[AuthContext] User not authenticated - no tokens available');
            setResult({ user: undefined, session: undefined, isLoading: false, error: undefined });
            return;
          }

          const { idToken, accessToken } = tokens;
          
          const attributesPromise = fetchUserAttributes();
          const attributes = await Promise.race([attributesPromise, timeoutPromise]);
          
          // Extract user groups from token payload
          const groups = accessToken?.payload['cognito:groups'] || [];
          
          setResult({ 
            user: { attributes }, 
            session: { identityId, idToken, groups }, 
            isLoading: false 
          });
        } catch (error) {
          // Handle timeout errors - treat as if user is not authenticated
          if (error.message === 'Authentication timeout') {
            console.warn('[AuthContext] Authentication request timed out - treating as not authenticated');
            setResult({ user: undefined, session: undefined, isLoading: false, error: undefined });
            return;
          }
          
          // Handle expired/invalid token - sign out and redirect to login
          if (error.name === 'NotAuthorizedException' || 
              error.message?.includes('Invalid login token') ||
              error.message?.includes('expired')) {
            console.log('[AuthContext] Token expired or invalid - signing out and redirecting to login');
            try {
              await signOut();
            } catch (signOutError) {
              console.warn('[AuthContext] Error during signOut:', signOutError);
            }
            setResult({ user: undefined, session: undefined, isLoading: false, error: undefined });
            
            // Store current URL for redirect after login
            if (typeof window !== 'undefined' && window.location.pathname !== '/') {
              const returnUrl = window.location.pathname + window.location.search;
              sessionStorage.setItem('returnUrl', returnUrl);
              console.log('[AuthContext] Token expired - stored return URL:', returnUrl);
            }
            
            // Redirect to home page (which has Authenticator component)
            if (typeof window !== 'undefined' && window.location.pathname !== '/') {
              window.location.href = '/';
            }
            return;
          }
          
          // Handle unauthenticated state gracefully - this is expected when user is not signed in
          if (error.name === 'UserUnAuthenticatedException' || 
              error.message?.includes('not authenticated') ||
              error.message?.includes('No current user') ||
              error.message?.includes('NoSignedUser')) {
            console.log('[AuthContext] User not authenticated');
            
            // Store current URL for redirect after login (but not for the home page)
            if (typeof window !== 'undefined' && window.location.pathname !== '/') {
              const returnUrl = window.location.pathname + window.location.search;
              sessionStorage.setItem('returnUrl', returnUrl);
              console.log('[AuthContext] Stored return URL:', returnUrl);
            }
            
            setResult({ user: undefined, session: undefined, isLoading: false, error: undefined });
          } else {
            console.error('[AuthContext] Authentication error:', error);
            setResult({ error, isLoading: false, user: undefined, session: undefined });
          }
        }
      }, []);
      const handleAuth = React.useCallback(
        ({ payload }) => {
          switch (payload.event) {
            case "signedIn":
            case "signUp":
            case "tokenRefresh":
            case "autoSignIn": {
              fetchCurrentUserAttributes();
              break;
            }
            case "signedOut": {
              setResult({ user: undefined, isLoading: false });
              break;
            }
            case "tokenRefresh_failure":
            case "signIn_failure": {
              setResult({ error: payload.data, isLoading: false });
              break;
            }
            case "autoSignIn_failure": {
              setResult({ error: new Error(payload.message), isLoading: false });
              break;
            }
            default: {
              break;
            }
          }
        },
        [fetchCurrentUserAttributes]
      );
      React.useEffect(() => {
        const unsubscribe = Hub.listen("auth", handleAuth, "useAuth");
        fetchCurrentUserAttributes();
        return unsubscribe;
      }, [handleAuth, fetchCurrentUserAttributes]);

    return (
        <AuthContext.Provider
            value={{
                ...result,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export { AuthProvider };

export default AuthContext;
