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
        setSession({ identityId, idToken });
      } catch (error) {
        // Suppress benign Cognito 400 errors in development
        if (error?.name !== 'NotAuthorizedException' && error?.statusCode !== 400) {
          console.log('[FileContext] Error fetching auth session:', error);
        }
        isLoading.current = false;
        setSession({ identityId: undefined, idToken: undefined, error });
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
    let subscription;

    async function fetchFiles() {
      try {
        // Check if user is authenticated first
        const { username: myUserId, userId, signInDetails } = await getCurrentUser();
        const { identityId } = await fetchAuthSession();

        console.log('[FileContext] User identity check:', {
          username: myUserId,
          userId,
          identityId,
          signInDetails
        });

        if (!myUserId) {
          return;
        }

        // Start DataStore to begin syncing
        console.log('[FileContext] Starting DataStore...');
        await DataStore.start();
        console.log('[FileContext] DataStore started');

        // Query all files regardless of owner - we'll track by identityId for lookup
        subscription = DataStore.observeQuery(File).subscribe(({ items, isSynced }) => {
          console.log('[FileContext] observeQuery update:', {
            totalFiles: items.length,
            isSynced,
            owners: [...new Set(items.map(f => f.owner))],
            identityIds: [...new Set(items.map(f => f.identityId))]
          });

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

          setMyPlaylistFiles(prev => {
            const prevStr = JSON.stringify(prev);
            const newStr = JSON.stringify(_playlistFiltered);
            return prevStr === newStr ? prev : _playlistFiltered;
          });
          
          setMyPdfs(prev => {
            const prevStr = JSON.stringify(prev);
            const newStr = JSON.stringify(_pdfsFiltered);
            return prevStr === newStr ? prev : _pdfsFiltered;
          });
          
          setMyFiles(prev => {
            const prevStr = JSON.stringify(prev);
            const newStr = JSON.stringify(items);
            return prevStr === newStr ? prev : items;
          });
        });
      } catch (error) {
        // Handle authentication errors gracefully
        if (error.name === 'UserUnAuthenticatedException' || error.message?.includes('authenticated')) {
          console.log('[FileContext] User not authenticated, skipping file fetch');
          return;
        }
        console.error('Error fetching files:', error);
      }
    }

    fetchFiles()
    
    return () => {
      subscription?.unsubscribe();
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
    session
  }), [
    audioFiles,
    myFiles,
    myPlaylistFiles,
    myPlaylistUrls,
    myPdfs,
    session,
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