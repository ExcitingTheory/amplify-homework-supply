import React, { createContext } from "react";
import { DataStore } from "aws-amplify/datastore";
import { list } from "aws-amplify/storage";
import { getCurrentUser } from "aws-amplify/auth";

import { File, Unit, Document } from "../models";
import { Hub, Cache } from "aws-amplify/utils";

import { fetchAuthSession } from "aws-amplify/auth";

// Provider and Consumer are connected through their "parent" context
const FilesContext = createContext();

export const ACCEPTABLE_PLAYLIST_TYPES = [
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/m4a',
  'audio/aac',
  'audio/webm',
  'audio/flac',
];


// Provider will be exported wrapped in ConfigProvider component.
const FilesProvider = ({ children }) => {

  const [audioFiles, setAudioFiles] = React.useState({})
  // const [files, setFiles] = React.useState({})
  const [myFiles, setMyFiles] = React.useState([])
  const [myPlaylistFiles, setMyPlaylistFiles] = React.useState({})
  const [myPlaylistUrls, setMyPlaylistUrls] = React.useState({})
  const [myPdfs, setMyPdfs] = React.useState({})
  const [filesVersion, setFilesVersion] = React.useState(0);
  const filesFetchedRef = React.useRef(false);
  const subscriptionRef = React.useRef(null);

  const [session, setSession] = React.useState({
    error: undefined,
    identityId: undefined,
    idToken: undefined,
  });

  const isLoading = React.useRef(false);
  
  // Memoize to prevent recreating on every render
  const fetchCurrentUserAttributes = React.useCallback(async () => {
      try {
        const authSession = await fetchAuthSession({ forceRefresh: false });
        const identityId = authSession.identityId;
        const idToken = authSession.tokens?.idToken;
        
        isLoading.current = false;
        setSession(prev => {
          // Only update if values actually changed
          if (prev.identityId === identityId && prev.idToken === idToken && !prev.error) {
            return prev;
          }
          return { identityId, idToken };
        });
      } catch (error) {
        // Suppress benign Cognito 400 errors in development
        isLoading.current = false;
        setSession(prev => {
          if (prev.error === error && !prev.identityId && !prev.idToken) {
            return prev;
          }
          return { identityId: undefined, idToken: undefined, error };
        });
      }
  }, []);

  React.useEffect(() => {
    if (!isLoading.current) {
      isLoading.current = true;
      fetchCurrentUserAttributes()
    }
  }, [fetchCurrentUserAttributes])

  // reload the current user attributes when the auth event is triggered

  const handleAuth = React.useCallback(
    ({ payload }) => {
      switch (payload.event) {
        case "signedIn":
        case "signUp":
        case "tokenRefresh":
        case "autoSignIn": {
          if (!isLoading.current) {
            isLoading.current = true;
            fetchCurrentUserAttributes();
          }
          
          break;
        }
        case "signedOut": {
          isLoading.current = false;
          setSession({ identityId: undefined, idToken: undefined, error: undefined});
          break;
        }
        case "tokenRefresh_failure":
        case "signIn_failure": {
          isLoading.current = false
          setSession({ error: payload.data });
          break;
        }
        case "autoSignIn_failure": {
          isLoading.current = false
          setSession({ error: new Error(payload.message) });
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
    return unsubscribe;
  }, [handleAuth]);



  React.useEffect(() => {
    // Prevent duplicate subscriptions
    if (filesFetchedRef.current) {
      return;
    }

    async function fetchFiles() {
      try {
        // Check if user is authenticated first
        const { username: myUserId, userId, signInDetails } = await getCurrentUser();
        const { identityId } = await fetchAuthSession();

        if (!myUserId) {
          return;
        }

        // Mark as fetched before subscribing
        filesFetchedRef.current = true;

        // Query all files regardless of owner - we'll track by identityId for lookup
        subscriptionRef.current = DataStore.observeQuery(File).subscribe(({ items, isSynced }) => {
          const _playlistFiltered = {}
          const _pdfsFiltered = {}

          items.forEach((item) => {
            // Include all audio files in playlist, not just specific MIME types
            if (item.mimeType && item.mimeType.startsWith('audio/')) {
              _playlistFiltered[item.id] = item
            }
            if (item.mimeType === 'application/pdf') {
              _pdfsFiltered[item.id] = item
            }
          })

          // Only update if different to prevent rerenders
          setMyPlaylistFiles(prev => {
            if (Object.keys(prev).length !== Object.keys(_playlistFiltered).length) {
              return _playlistFiltered;
            }
            const hasChanges = Object.keys(_playlistFiltered).some(
              key => !prev[key] || prev[key].updatedAt !== _playlistFiltered[key].updatedAt
            );
            return hasChanges ? _playlistFiltered : prev;
          });
          
          setMyPdfs(prev => {
            if (Object.keys(prev).length !== Object.keys(_pdfsFiltered).length) {
              return _pdfsFiltered;
            }
            const hasChanges = Object.keys(_pdfsFiltered).some(
              key => !prev[key] || prev[key].updatedAt !== _pdfsFiltered[key].updatedAt
            );
            return hasChanges ? _pdfsFiltered : prev;
          });
          
          setMyFiles(prev => {
            if (prev.length !== items.length) {
              setFilesVersion(v => v + 1);
              return items;
            }
            const hasChanges = items.some((item, i) => 
              !prev[i] || prev[i].id !== item.id || prev[i].updatedAt !== item.updatedAt
            );
            if (hasChanges) {
              setFilesVersion(v => v + 1);
              return items;
            }
            return prev;
          });
        });
      } catch (error) {
        // Handle authentication errors gracefully
        if (error.name === 'UserUnAuthenticatedException' || error.message?.includes('authenticated')) {
          return;
        }
        console.error('Error fetching files:', error);
      }
    }

    fetchFiles()
    
    return () => {
      subscriptionRef.current?.unsubscribe();
      filesFetchedRef.current = false;
    };
  }, []);

  const refreshAudioFiles = async () => {
    const results = await list('audio/', {
      cacheControl: 'no-cache'
    })
    
    if (results?.results?.length > 0) {
      const fileMap = {}
      results.results.forEach((item) => {
        fileMap[item.key] = item
      })

      setAudioFiles(fileMap);
    }
  }

  const contextValue = React.useMemo(() => ({
    audioFiles,
    refreshAudioFiles,
    files: myFiles,
    myFiles,
    myPlaylistFiles,
    myPlaylistUrls,
    myPdfs,
    session,
    filesVersion
  }), [
    audioFiles,
    myFiles,
    myPlaylistFiles,
    myPlaylistUrls,
    myPdfs,
    session,
    filesVersion
  ]);

  return (
    <FilesContext.Provider value={contextValue}>
      {children}
    </FilesContext.Provider>
  );
}

export { FilesProvider };

// I make this default since it will probably be exported most often.
export default FilesContext;