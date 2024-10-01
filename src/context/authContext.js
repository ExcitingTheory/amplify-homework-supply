import React from "react";

const AuthContext = React.createContext();

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
          const attributes = await fetchUserAttributes();
          // console.log('fetchCurrentUserAttributes', attributes);
          const {
            identityId,
            tokens: { idToken },
          } = await fetchAuthSession();
          // console.log(JSON.stringify({ user: { attributes }, session: { identityId, idToken }, isLoading: false }));
          setResult({ user: { attributes }, session: { identityId, idToken }, isLoading: false });
        } catch (error) {
          setResult({ error, isLoading: false });
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
