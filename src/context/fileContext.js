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
  // once on load fetch the current user attributes
  const fetchCurrentUserAttributes = async (params) => {
      const {
        identityId,
        tokens: { idToken },
      } = await fetchAuthSession();
      isLoading.current = false;

      setSession({ identityId, idToken });

  }
  React.useEffect(() => {
    if (!isLoading.current) {
      isLoading.current = true;
      fetchCurrentUserAttributes()
    }
  }, [])

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
    console.log('useEffect.handleAuth', handleAuth)
    return unsubscribe;
  }, [handleAuth]);



  console.log('FilesProvider.audioFiles', audioFiles)
  // console.log('FilesProvider.files', files)

  // React.useEffect(() => {
  //   const updateFiles = async () => {

  //     const { results } = await list('audio/', {
  //       cacheControl: 'max-age=300, stale-while-revalidate=86400' // 5 minutes
  //     });
  //     console.log('updateFiles.results', results)
  //     if (results?.length > 0) {
  //       const fileMap = new Map()
  //       results.forEach((item) => {
  //         fileMap[item.key] = item
  //       })

  //       console.log('updatfileMapeFiles.', fileMap)

  //       setAudioFiles(JSON.parse(JSON.stringify(fileMap)));
  //     }
  //   };
  //   updateFiles();
  // }, []);


  React.useEffect(() => {
    fetchFiles()
    async function fetchFiles() {
      // const {
      //   username: myUserId,
      // } = await getCurrentUser();
      // console.log("myUserId::: ", myUserId)

      // if (!myUserId) {
      //   return;
      // }
      // Cache.clear()
      // refreshAudioFiles()
        const data = await DataStore.query(File)
        console.log("files::: ", data)

        const _playlistFiltered = {}
        const _playlistUrls = {}
        const urlsWork = []

        // TODO change how this is done

        data.map(async (item) => {
          if (ACCEPTABLE_PLAYLIST_TYPES.includes(item.mimeType)) {
            
            _playlistFiltered[item.id] = item

            console.log("item::: ", item)
            // urlsWork.push(getCachedUrl(item.path, 'protected', item?.owner))
            // const _url = getCachedUrl(item.path, 'protected', item?.identityId)
            // console.log("_url::: ", _url)
            // _playlistUrls[item.id] = item
            // _playlistUrls[item.id] = await getCachedUrl(item.path, 'protected', item?.identityId)
                        
          }
        })

        console.log("_playlistFiltered::: ", _playlistFiltered)
        setMyPlaylistFiles(_playlistFiltered);
        console.log("_playlistUrls::: ", _playlistUrls)
        setMyPlaylistUrls(_playlistUrls);
        setMyFiles(data);
    }
    const subscription = DataStore.observe(File).subscribe(() => fetchFiles())

    return function cleanup() {
        subscription.unsubscribe();
    }
}, [])


  React.useEffect(() => {

    async function fetchFiles() {

      const {
        username: myUserId,
      } = await getCurrentUser();
      console.log("myUserId::: ", myUserId)

      if (!myUserId) {
        return;
      }
      // Cache.clear()
      // refreshAudioFiles()

      DataStore.query(File).then((data) => {
        console.log("files::: ", data)
        setMyFiles(data);
      });

      // compare file model owner to the current user for finding the users files
      const subscription = DataStore.observeQuery(File, f => f.owner.eq(myUserId)).subscribe(async ({ data }) => {
        console.log("files::: ", data)

        const _playlistFiltered = {}
        const _playlistUrls = {}
        const urlsWork = []

        data.map((item) => {
          if (ACCEPTABLE_PLAYLIST_TYPES.includes(item.mimeType)) {
            
            _playlistFiltered[item.id] = item

            console.log("item::: ", item)
            // urlsWork.push(getCachedUrl(item.path, 'protected', item?.identityId))
          }
        })

        console.log("_playlistFiltered::: ", _playlistFiltered)
        console.log("urlsWork::: ", urlsWork)

        const _urlsOutput = await Promise.allSettled(urlsWork)

        console.log("_urlsOutput::: ", _urlsOutput)

        _urlsOutput.forEach((item) => {
          console.log("item::: ", item) 
          if (item.status === 'fulfilled') {
            _playlistUrls[item.value.id] = item.value
          }
        })

        console.log("_playlistFiltered::: ", _playlistFiltered)
        setMyPlaylistFiles(_playlistFiltered);
        console.log("_playlistUrls::: ", _playlistUrls)
        setMyPlaylistUrls(_playlistUrls);
        setMyFiles(data);
      });
      return subscription.unsubscribe()
    }

    fetchFiles()
  }, []);


  // React.useEffect(() => {

  //   async function fetchFiles() {
  //     const subscription = DataStore.observeQuery(File).subscribe(({ items }) => {
  //       console.log("files::: ", items)
  //       setFiles(items);
  //     });
  //     return () => {
  //       subscription.unsubscribe();
  //     };
  //   }

  //   fetchFiles()
  // }, []);


  const refreshAudioFiles = async () => {
    const results = await list('audio/', {
      cacheControl: 'no-cache'
    })
    console.log('refreshing.results', results)
    if (results.length > 0) {
      const fileMap = new Map()
      results.forEach((item) => {
        fileMap[item.key] = item
      })

      console.log('updatfileMapeFiles.', fileMap)

      setAudioFiles(JSON.parse(JSON.stringify(fileMap)));

    }
  }

  return (
    <FilesContext.Provider
      value={{
        audioFiles,
        refreshAudioFiles,
        files: myFiles,
        myFiles,
        myPlaylistFiles,
        myPlaylistUrls,
        session
      }}
    >
      {children}
    </FilesContext.Provider>
  );
}

export { FilesProvider };

// I make this default since it will probably be exported most often.
export default FilesContext;