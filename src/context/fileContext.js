import React, { createContext } from "react";
import { DataStore } from "aws-amplify/datastore";
import { list } from "aws-amplify/storage";
import { getCurrentUser } from "aws-amplify/auth";

import { File, Unit } from "../models";
import { Hub, Cache } from "aws-amplify/utils";

import { fetchAuthSession } from "aws-amplify/auth";

// Provider and Consumer are connected through their "parent" context
const FilesContext = createContext();

export const ACCEPTABLE_PLAYLIST_TYPES = [
  'audio/mp3',
];


// Provider will be exported wrapped in ConfigProvider component.
const FilesProvider = ({ children }) => {

  const [audioFiles, setAudioFiles] = React.useState({})
  // const [files, setFiles] = React.useState({})
  const [myFiles, setMyFiles] = React.useState([])
  const [myPlaylistFiles, setMyPlaylistFiles] = React.useState({})
  const [myPlaylistUrls, setMyPlaylistUrls] = React.useState({})

  const [session, setSession] = React.useState({
    error: undefined,
    identityId: undefined,
    idToken: undefined,
  });

  const isLoading = React.useRef(false);
  
  // Memoize to prevent recreating on every render
  const fetchCurrentUserAttributes = React.useCallback(async () => {
      const {
        identityId,
        tokens: { idToken },
      } = await fetchAuthSession();
      isLoading.current = false;

      setSession({ identityId, idToken });
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
        const { username: myUserId } = await getCurrentUser();

        if (!myUserId) {
          return;
        }

        // Use observeQuery instead of separate query + observe for efficiency
        subscription = DataStore.observeQuery(File, f => f.owner.eq(myUserId)).subscribe(({ items }) => {
          const _playlistFiltered = {}

          items.forEach((item) => {
            if (ACCEPTABLE_PLAYLIST_TYPES.includes(item.mimeType)) {
              _playlistFiltered[item.id] = item
            }
          })

          setMyPlaylistFiles(prev => {
            const prevStr = JSON.stringify(prev);
            const newStr = JSON.stringify(_playlistFiltered);
            return prevStr === newStr ? prev : _playlistFiltered;
          });
          
          setMyFiles(prev => {
            const prevStr = JSON.stringify(prev);
            const newStr = JSON.stringify(items);
            return prevStr === newStr ? prev : items;
          });
        });
      } catch (error) {
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
    session
  }), [
    audioFiles,
    myFiles,
    myPlaylistFiles,
    myPlaylistUrls,
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