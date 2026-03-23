import React, { createContext } from "react";
import { list } from "aws-amplify/storage";
import { getAmplifyClient } from '../utils/amplifyClient';
import AuthContext from './authContext';

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

  const [audioFiles, setAudioFiles] = React.useState({})
  // const [files, setFiles] = React.useState({})
  const [myFiles, setMyFiles] = React.useState([])
  const [myPlaylistFiles, setMyPlaylistFiles] = React.useState({})
  const [myPlaylistUrls, setMyPlaylistUrls] = React.useState({})
  const [myPdfs, setMyPdfs] = React.useState({})
  const [documents, setDocuments] = React.useState({});
  const [filesVersion, setFilesVersion] = React.useState(0);
  const filesFetchedRef = React.useRef(false);
  const subscriptionRef = React.useRef(null);
  const documentSubscriptionRef = React.useRef(null);
  
  // Create vector store instance - shared across entire app (browser-only)
  const vectorStore = React.useRef(
    typeof window !== 'undefined' && CourseVectorStore 
      ? new CourseVectorStore() 
      : null
  ).current;
  const [vectorStoreReady, setVectorStoreReady] = React.useState(false);
  const loadedVersions = React.useRef(new Map()); // Track loaded document versions

  
  // Early vector store initialization - load from IndexedDB on mount
  React.useEffect(() => {
    if (!vectorStore) {
      // SSR or vector store not available
      setVectorStoreReady(false);
      return;
    }
    
    console.log('[FilesContext] Initializing vector store from IndexedDB');
    
    if (!vectorStore.loaded) {
      vectorStore.loadFromIndexedDB().then(count => {
        if (count > 0) {
          console.log(`[FilesContext] Loaded ${count} cached embeddings from IndexedDB`);
          setVectorStoreReady(true);
        } else {
          console.log('[FilesContext] No cached embeddings found in IndexedDB');
          setVectorStoreReady(true);
        }
      }).catch(error => {
        console.error('[FilesContext] Failed to load from IndexedDB:', error);
        setVectorStoreReady(true);
      });
    }
  }, [vectorStore]);
  
  // Populate vector store from files and documents
  React.useEffect(() => {
    if (!vectorStore) return; // Guard for SSR
    if (myFiles.length === 0) return;
    
    const isInitialLoad = loadedVersions.current.size === 0;
    const processingDocuments = new Set();
    
    console.log(`[FilesContext] Vector store population triggered`, {
      isInitialLoad,
      filesCount: myFiles.length,
      currentVectorStoreSize: vectorStore.items.length,
      documentsCount: Object.keys(documents).length
    });
    
    myFiles.forEach(async (file) => {
      const docStatus = documents[file.documentID];
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
  }, [myFiles, documents, vectorStore]);

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

    async function fetchFiles() {
      console.log('[FilesContext] fetchFiles called');
      try {
        console.log('[FilesContext] User authenticated:', user.attributes.sub);
        console.log('[FilesContext] Identity ID:', session.identityId);
        const myUserId = user.attributes.sub;
        const { identityId } = session;

        if (!myUserId) {
          console.log('[FilesContext] No myUserId, returning');
          return;
        }

        // Mark as fetched before subscribing
        filesFetchedRef.current = true;
        console.log('[FilesContext] About to subscribe to File model');

        const client = getAmplifyClient();

        // Query all files regardless of owner - we'll track by identityId for lookup
        // Include parsedContent relationship for PDFs
        subscriptionRef.current = client.models.File.observeQuery().subscribe({
          next: ({ items, isSynced }) => {
            console.log('[FilesContext] File observeQuery subscription triggered:');
            console.log('  - items.length:', items?.length);
            console.log('  - isSynced:', isSynced);
            console.log('  - items:', items);
            
            // Filter out null items that can appear during subscription updates
            const validItems = items.filter(item => item != null && item.id != null);
            
            const _playlistFiltered = {}
            const _pdfsFiltered = {}

            validItems.forEach((item) => {
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
                key => !prev[key] || prev[key]._version !== _playlistFiltered[key]._version
              );
              return hasChanges ? _playlistFiltered : prev;
            });
            
            setMyPdfs(prev => {
              if (Object.keys(prev).length !== Object.keys(_pdfsFiltered).length) {
                return _pdfsFiltered;
              }
              const hasChanges = Object.keys(_pdfsFiltered).some(
                key => !prev[key] || prev[key]._version !== _pdfsFiltered[key]._version
              );
              return hasChanges ? _pdfsFiltered : prev;
            });
            
            setMyFiles(prev => {
              if (prev.length !== validItems.length) {
                console.log('[FilesContext] Files count changed:', prev.length, '→', validItems.length);
                setFilesVersion(v => v + 1);
                return validItems;
              }
              const hasChanges = validItems.some((item, i) => 
                !prev[i] || prev[i].id !== item.id || prev[i]._version !== item._version
              );
              if (hasChanges) {
                console.log('[FilesContext] Files have changes, updating state');
                setFilesVersion(v => v + 1);
                return validItems;
              }
              return prev;
            });
          },
          error: (error) => {
            console.error('[FilesContext] File subscription error:', error);
          }
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
  }, [user, authLoading, session]);

  // Subscribe to Document status changes
  React.useEffect(() => {
    const client = getAmplifyClient();
    documentSubscriptionRef.current = client.models.Document.observeQuery().subscribe({
      next: ({ items }) => {
        // Filter out null items that can appear during subscription updates
        const validItems = items.filter(item => item != null && item.id != null);
        
        const statusMap = {};
        validItems.forEach(doc => {
          // Parse pageEmbeddings if it's a string
          const pageEmbeddings = typeof doc.pageEmbeddings === 'string' 
            ? JSON.parse(doc.pageEmbeddings)
            : doc.pageEmbeddings;

          statusMap[doc.id] = {
            id: doc.id,
            s3Key: doc.s3Key,
            status: doc.status,
            pageCount: doc.pageCount,
            extractedText: doc.extractedText,
            pageEmbeddings: pageEmbeddings,
            embeddingsS3Key: doc.embeddingsS3Key,
            metadata: doc.metadata,
            updatedAt: doc.updatedAt, // Track updatedAt for cache invalidation
          };
        });
      
      // Only update if there are actual changes
      setDocuments(prev => {
        const prevKeys = Object.keys(prev);
        const newKeys = Object.keys(statusMap);
        
        // Check if keys changed
        if (prevKeys.length !== newKeys.length) {
          console.log('[FilesContext] Document count changed:', prevKeys.length, '→', newKeys.length);
          return statusMap;
        }
        
        // Check if any values changed
        const hasChanges = newKeys.some(key => {
          const prevDoc = prev[key];
          const newDoc = statusMap[key];
          return !prevDoc || 
                 prevDoc.status !== newDoc.status ||
                 prevDoc._version !== newDoc._version ||
                 prevDoc.pageCount !== newDoc.pageCount;
        });
        
        if (hasChanges) {
          console.log('[FilesContext] Document values changed');
        }
        
        return hasChanges ? statusMap : prev;
      });
    },
      error: (error) => {
        console.error('[FilesContext] Document subscription error:', error);
      }
    });

    return () => {
      documentSubscriptionRef.current?.unsubscribe();
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
    documents,
    session: session || { identityId: undefined, idToken: undefined }, // Provide safe default
    filesVersion,
    vectorStore, // Stable ref, doesn't cause re-renders
    vectorStoreReady
  }), [
    audioFiles,
    myFiles,
    myPlaylistFiles,
    myPlaylistUrls,
    myPdfs,
    documents,
    session,
    filesVersion,
    // vectorStore is intentionally excluded - it's a ref and never changes
    vectorStoreReady
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