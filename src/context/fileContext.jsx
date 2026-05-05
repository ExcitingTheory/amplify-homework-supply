import React, { createContext, useReducer } from "react";
import { list } from "aws-amplify/storage";
import { getAmplifyClient } from '../utils/amplifyClient';
import AuthContext from './authContext';
import { fileReducer, initialState, actionTypes } from './reducers/fileReducer';

import { Hub, Cache } from "aws-amplify/utils";

// Import vector store for early initialization
// In Storybook: Vite aliases automatically resolve these to mocks in .storybook/__mocks__/
// In Next.js: Tree-shaking and conditional usage prevent SSR issues
import { CourseVectorStore } from "../components/Editor3/components/FileManager2";
import { loadEmbeddingsByDocument, loadEmbeddingsFromS3 } from "../utils/vectorStoreDB";

// Provider and Consumer are connected through their "parent" context
const FilesContext = createContext({
  audioFiles: {},
  refreshAudioFiles: () => {},
  files: [],
  myFiles: [],
  myPlaylistFiles: [],
  myPlaylistUrls: [],
  myPdfs: [],
  documents: [],
  session: { identityId: undefined, idToken: undefined, error: undefined },
  filesVersion: 0,
  vectorStore: null, // Will be null during SSR, initialized in browser
  vectorStoreReady: false,
});

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
  // Get auth state from centralized context
  const authContext = React.useContext(AuthContext);
  const { user, session, isLoading: authLoading } = authContext || { user: undefined, session: undefined, isLoading: true };

  const [state, dispatch] = useReducer(fileReducer, initialState);
  const filesFetchedRef = React.useRef(false);
  const subscriptionRef = React.useRef(null);
  const documentSubscriptionRef = React.useRef(null);
  
  // Create vector store instance - shared across entire app (browser-only)
  const vectorStore = React.useRef(
    typeof window !== 'undefined' && CourseVectorStore 
      ? new CourseVectorStore() 
      : null
  ).current;
  const loadedVersions = React.useRef(new Map()); // Track loaded document versions

  
  // Early vector store initialization - load from IndexedDB on mount
  React.useEffect(() => {
    if (!vectorStore) {
      // SSR or vector store not available
      dispatch({ type: actionTypes.SET_VECTOR_STORE_READY, payload: false });
      return;
    }
    
    console.log('[FilesContext] Initializing vector store from IndexedDB');
    
    if (!vectorStore.loaded) {
      vectorStore.loadFromIndexedDB().then(count => {
        if (count > 0) {
          console.log(`[FilesContext] Loaded ${count} cached embeddings from IndexedDB`);
          dispatch({ type: actionTypes.SET_VECTOR_STORE_READY, payload: true });
        } else {
          console.log('[FilesContext] No cached embeddings found in IndexedDB');
          dispatch({ type: actionTypes.SET_VECTOR_STORE_READY, payload: true });
        }
      }).catch(error => {
        console.error('[FilesContext] Failed to load from IndexedDB:', error);
        dispatch({ type: actionTypes.SET_VECTOR_STORE_READY, payload: true });
      });
    }
  }, [vectorStore]);
  
  // Populate vector store from files and documents
  React.useEffect(() => {
    if (!vectorStore) return; // Guard for SSR
    if (state.myFiles.length === 0) return;
    
    const isInitialLoad = loadedVersions.current.size === 0;
    const processingDocuments = new Set();
    
    console.log(`[FilesContext] Vector store population triggered`, {
      isInitialLoad,
      filesCount: state.myFiles.length,
      currentVectorStoreSize: vectorStore.items.length,
      documentsCount: Object.keys(state.documents).length
    });
    
    state.myFiles.forEach(async (file) => {
      const docStatus = state.documents[file.documentID];
      const pageEmbeddings = docStatus?.pageEmbeddings;
      const embeddingsS3Key = docStatus?.embeddingsS3Key;
      const currentVersion = docStatus?._version || file._version;
      const loadedVersion = loadedVersions.current.get(file.id);
      
      // Skip if already loaded and version unchanged
      if (!isInitialLoad && loadedVersion === currentVersion) {
        return;
      }
      
      // Skip if already processing this document
      if (file.documentID && processingDocuments.has(file.documentID)) {
        return;
      }
      
      if (file.documentID) {
        processingDocuments.add(file.documentID);
      }
      
      // Remove old entries for this file if updating
      if (!isInitialLoad) {
        vectorStore.items = vectorStore.items.filter(
          item => item.metadata?.fileId !== file.id
        );
      }
      
      // Load from S3 if needed
      if (!pageEmbeddings && embeddingsS3Key && file.documentID) {
        const existingInMemory = vectorStore.items.filter(
          item => item.documentId === file.documentID || item.metadata?.documentId === file.documentID
        );
        
        if (existingInMemory.length > 0) {
          console.log(`[FilesContext] Skipping S3 - ${existingInMemory.length} embeddings in memory for ${file.documentID}`);
          loadedVersions.current.set(file.id, currentVersion);
          return;
        }
        
        try {
          const cachedInIndexedDB = await loadEmbeddingsByDocument(file.documentID);
          
          if (cachedInIndexedDB && cachedInIndexedDB.length > 0) {
            console.log(`[FilesContext] Loading ${cachedInIndexedDB.length} embeddings from IndexedDB for ${file.name}`);
            cachedInIndexedDB.forEach(emb => vectorStore.add(emb));
            loadedVersions.current.set(file.id, currentVersion);
            return;
          }
        } catch (error) {
          console.warn(`[FilesContext] IndexedDB check failed for ${file.documentID}:`, error);
        }
        
        try {
          console.log(`[FilesContext] Downloading embeddings from S3 for ${file.name}`);
          await loadEmbeddingsFromS3(embeddingsS3Key, file.documentID, {
            fileId: file.id,
            fileName: file.name,
            mimeType: file.mimeType,
          });
          
          const cachedEmbeddings = await loadEmbeddingsByDocument(file.documentID);
          cachedEmbeddings.forEach(emb => vectorStore.add(emb));
          console.log(`[FilesContext] Loaded ${cachedEmbeddings.length} embeddings from S3 for ${file.name}`);
          loadedVersions.current.set(file.id, currentVersion);
          return;
        } catch (error) {
          console.error(`[FilesContext] S3 load failed for ${file.documentID}:`, error);
        }
      }
      
      // Add page embeddings from DynamoDB
      if (pageEmbeddings && Array.isArray(pageEmbeddings) && file.documentID) {
        console.log(`[FilesContext] Adding ${pageEmbeddings.length} page embeddings for ${file.name}`);
        
        pageEmbeddings.forEach(pageData => {
          if (pageData.embedding) {
            vectorStore.add({
              id: `${file.id}-page-${pageData.page}`,
              documentId: file.documentID,
              page: pageData.page,
              text: pageData.text || '',
              vector: pageData.embedding,
              metadata: {
                fileId: file.id,
                documentId: file.documentID,
                page: pageData.page,
                fileName: file.name,
                mimeType: file.mimeType,
              },
            });
          }
        });
        
        // Save to IndexedDB
        if (!isInitialLoad || !vectorStore.loaded) {
          vectorStore.saveToIndexedDB(file.documentID, pageEmbeddings, {
            fileId: file.id,
            fileName: file.name,
            mimeType: file.mimeType,
          }).catch(error => {
            console.error('[FilesContext] IndexedDB save failed:', error);
          });
        }
      }
      
      // Add file-level embedding
      if (file.embedding && !pageEmbeddings) {
        vectorStore.add({
          id: file.id,
          documentId: file.documentID || file.id,
          page: null,
          text: file.description || file.name,
          vector: file.embedding,
          metadata: {
            fileId: file.id,
            documentId: file.documentID,
            page: null,
            fileName: file.name,
            mimeType: file.mimeType,
          },
        });
      }
      
      if (currentVersion) {
        loadedVersions.current.set(file.id, currentVersion);
      }
    });
    
    console.log(`[FilesContext] Vector store population complete - ${vectorStore.items.length} total embeddings`);
  }, [state.myFiles, state.documents, vectorStore]);

  // reload the current user attributes when the auth event is triggered
  // NOTE: This is now handled by the centralized AuthContext

  React.useEffect(() => {
    // Wait for auth to be ready
    if (authLoading || !user || !session) {
      return;
    }

    // Prevent duplicate subscriptions
    if (filesFetchedRef.current) {
      console.log('[FilesContext] fetchFiles already called, skipping');
      return;
    }

    // ── Offline fallback: load files from IndexedDB cache ─────────────
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      filesFetchedRef.current = true;
      (async () => {
        try {
          const { getAllRecords } = await import('../offline/OfflineDataStore');
          const cachedFiles = await getAllRecords('files');
          if (cachedFiles.length > 0) {
            const _playlistFiltered = {};
            const _pdfsFiltered = {};
            cachedFiles.forEach(f => {
              if (f.contentType && ACCEPTABLE_PLAYLIST_TYPES.includes(f.contentType)) {
                _playlistFiltered[f.id] = f;
              }
              if (f.contentType === 'application/pdf') {
                _pdfsFiltered[f.id] = f;
              }
            });
            dispatch({ type: actionTypes.FILES_SUBSCRIPTION_UPDATE, payload: {
              myFiles: cachedFiles,
              myPlaylistFiles: _playlistFiltered,
              myPdfs: _pdfsFiltered,
            }});
            console.log('[FilesContext] Loaded', cachedFiles.length, 'files from offline cache');
          }
        } catch (err) {
          console.warn('[FilesContext] Offline file cache load failed:', err);
        }
      })();
      return;
    }
    // ── End offline fallback ──────────────────────────────────────────

    async function fetchFiles() {
      console.log('[FilesContext] fetchFiles called');
      try {
        console.log('[FilesContext] User authenticated:', user.attributes.sub);
        console.log('[FilesContext] Identity ID:', session.identityId);
        const myUserId = user.attributes.sub;

        if (!myUserId) {
          console.log('[FilesContext] No myUserId, returning');
          return;
        }

        // Mark as fetched before subscribing
        filesFetchedRef.current = true;
        console.log('[FilesContext] About to set up File observeQuery');

        const client = getAmplifyClient();

        function processFiles(validItems) {
          const _playlistFiltered = {}
          const _pdfsFiltered = {}

          validItems.forEach((item) => {
            if (item.mimeType && item.mimeType.startsWith('audio/')) {
              _playlistFiltered[item.id] = item
            }
            if (item.mimeType === 'application/pdf') {
              _pdfsFiltered[item.id] = item
            }
          })

          dispatch({ type: actionTypes.SET_PLAYLIST_FILES, payload: _playlistFiltered });
          dispatch({ type: actionTypes.SET_PDFS, payload: _pdfsFiltered });
          dispatch({ type: actionTypes.SET_MY_FILES, payload: validItems });
          dispatch({ type: actionTypes.INCREMENT_FILES_VERSION });
        }

        function handleError(label, error) {
          const msg = error?.message || error?.errors?.[0]?.message || error?.error?.errors?.[0]?.message || JSON.stringify(error);
          if (msg.includes('DuplicatedOperationError')) {
            console.warn(`[FilesContext] ${label}: transient DuplicatedOperationError (safe to ignore)`);
            return;
          }
          console.error(`[FilesContext] ${label} error:`, error);
        }

        const { data: items, errors } = await client.models.File.list();
        if (errors?.length) console.error('[FilesContext] File list errors:', errors);

        const validItems = (items || []).filter(item => item != null && item.id != null);
        console.log('[FilesContext] Initial files:', validItems.length);
        processFiles(validItems);

        const createSub = client.models.File.onCreate().subscribe({
          next: (response) => {
            const file = response?.data;
            if (!file || !file.id) return;
            dispatch({ type: actionTypes.SET_MY_FILES, payload: [file], meta: 'create' });
            dispatch({ type: actionTypes.INCREMENT_FILES_VERSION });
          },
          error: (error) => handleError('File onCreate', error)
        });

        const updateSub = client.models.File.onUpdate().subscribe({
          next: (response) => {
            const file = response?.data;
            if (!file || !file.id) return;
            dispatch({ type: actionTypes.SET_MY_FILES, payload: [file], meta: 'update' });
            dispatch({ type: actionTypes.INCREMENT_FILES_VERSION });
          },
          error: (error) => handleError('File onUpdate', error)
        });

        const deleteSub = client.models.File.onDelete().subscribe({
          next: (response) => {
            const file = response?.data;
            if (!file || !file.id) return;
            dispatch({ type: actionTypes.SET_MY_FILES, payload: [file], meta: 'delete' });
            dispatch({ type: actionTypes.INCREMENT_FILES_VERSION });
          },
          error: (error) => handleError('File onDelete', error)
        });

        subscriptionRef.current = { createSub, updateSub, deleteSub };
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
      if (subscriptionRef.current) {
        subscriptionRef.current.createSub?.unsubscribe();
        subscriptionRef.current.updateSub?.unsubscribe();
        subscriptionRef.current.deleteSub?.unsubscribe();
      }
      filesFetchedRef.current = false;
    };
  }, [user, authLoading, session]);

  // Subscribe to Document status changes
  React.useEffect(() => {
    const client = getAmplifyClient();
    const subscriptions = [];
    let cancelled = false;

    function parseDoc(doc) {
      const pageEmbeddings = typeof doc.pageEmbeddings === 'string' 
        ? JSON.parse(doc.pageEmbeddings)
        : doc.pageEmbeddings;

      return {
        id: doc.id,
        s3Key: doc.s3Key,
        status: doc.status,
        pageCount: doc.pageCount,
        extractedText: doc.extractedText,
        pageEmbeddings: pageEmbeddings,
        embeddingsS3Key: doc.embeddingsS3Key,
        metadata: doc.metadata,
        updatedAt: doc.updatedAt,
      };
    }

    function handleError(label, error) {
      const msg = error?.message || error?.errors?.[0]?.message || error?.error?.errors?.[0]?.message || JSON.stringify(error);
      if (msg.includes('DuplicatedOperationError')) {
        console.warn(`[FilesContext] ${label}: transient DuplicatedOperationError (safe to ignore)`);
        return;
      }
      console.error(`[FilesContext] ${label} error:`, error);
    }

    async function fetchDocuments() {
      try {
        const { data: items, errors } = await client.models.Document.list();
        if (cancelled) return;
        if (errors?.length) console.error('[FilesContext] Document list errors:', errors);

        const validItems = (items || []).filter(item => item != null && item.id != null);
        const docsMap = {};
        validItems.forEach(doc => { docsMap[doc.id] = parseDoc(doc); });
        dispatch({ type: actionTypes.SET_DOCUMENTS, payload: docsMap });

        if (cancelled) return;

        const createSub = client.models.Document.onCreate().subscribe({
          next: (response) => {
            const doc = response?.data;
            if (!doc || !doc.id) return;
            dispatch({ type: actionTypes.SET_DOCUMENTS, payload: { [doc.id]: parseDoc(doc) }, meta: 'create' });
          },
          error: (error) => handleError('Document onCreate', error)
        });
        subscriptions.push(createSub);

        const updateSub = client.models.Document.onUpdate().subscribe({
          next: (response) => {
            const doc = response?.data;
            if (!doc || !doc.id) return;
            dispatch({ type: actionTypes.SET_DOCUMENTS, payload: { [doc.id]: parseDoc(doc) }, meta: 'update' });
          },
          error: (error) => handleError('Document onUpdate', error)
        });
        subscriptions.push(updateSub);

        const deleteSub = client.models.Document.onDelete().subscribe({
          next: (response) => {
            const doc = response?.data;
            if (!doc || !doc.id) return;
            dispatch({ type: actionTypes.SET_DOCUMENTS, payload: { deleteId: doc.id }, meta: 'delete' });
          },
          error: (error) => handleError('Document onDelete', error)
        });
        subscriptions.push(deleteSub);
      } catch (error) {
        console.error('[FilesContext] fetchDocuments error:', error);
      }
    }

    fetchDocuments();

    return () => {
      cancelled = true;
      subscriptions.forEach(sub => sub.unsubscribe());
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

      dispatch({ type: actionTypes.SET_AUDIO_FILES, payload: fileMap });
    }
  }

  const contextValue = React.useMemo(() => ({
    audioFiles: state.audioFiles,
    refreshAudioFiles,
    files: state.myFiles,
    myFiles: state.myFiles,
    myPlaylistFiles: state.myPlaylistFiles,
    myPlaylistUrls: state.myPlaylistUrls,
    myPdfs: state.myPdfs,
    documents: state.documents,
    session: session || { identityId: undefined, idToken: undefined }, // Provide safe default
    filesVersion: state.filesVersion,
    vectorStore, // Stable ref, doesn't cause re-renders
    vectorStoreReady: state.vectorStoreReady
  }), [
    state.audioFiles,
    state.myFiles,
    state.myPlaylistFiles,
    state.myPlaylistUrls,
    state.myPdfs,
    state.documents,
    session,
    state.filesVersion,
    // vectorStore is intentionally excluded - it's a ref and never changes
    state.vectorStoreReady
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