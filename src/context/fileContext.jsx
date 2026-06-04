import React, { createContext, useReducer } from "react";
import { list } from "aws-amplify/storage";
import { getAmplifyClient } from "../utils/amplifyClient";
import AuthContext from "./authContext";
import { fileReducer, initialState, actionTypes } from "./reducers/fileReducer";

import { Hub, Cache } from "aws-amplify/utils";

// Import vector store for early initialization
// In Storybook: Vite aliases automatically resolve these to mocks in .storybook/__mocks__/
// In Next.js: Tree-shaking and conditional usage prevent SSR issues
import { CourseVectorStore } from "../components/Editor3/components/FileManager2";
import {
  loadEmbeddingsByDocument,
  loadEmbeddingsFromS3,
} from "../utils/vectorStoreDB";
import { loadUnitBundle, loadInstructorBundle } from "../utils/searchBundles";

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
  "audio/mp3",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/m4a",
  "audio/aac",
  "audio/webm",
  "audio/flac",
];

// Provider will be exported wrapped in ConfigProvider component.
const FilesProvider = ({ children }) => {
  // Get auth state from centralized context
  const authContext = React.useContext(AuthContext);
  const {
    user,
    session,
    isLoading: authLoading,
  } = authContext || { user: undefined, session: undefined, isLoading: true };

  const [state, dispatch] = useReducer(fileReducer, initialState);
  const filesFetchedRef = React.useRef(false);
  const subscriptionRef = React.useRef(null);
  const documentSubscriptionRef = React.useRef(null);
  const fileVersionMapRef = React.useRef({});
  const documentVersionMapRef = React.useRef({});

  // Create vector store instance - shared across entire app (browser-only)
  const vectorStore = React.useRef(
    typeof window !== "undefined" && CourseVectorStore
      ? new CourseVectorStore()
      : null,
  ).current;
  const loadedVersions = React.useRef(new Map()); // Track loaded document versions

  // Early vector store initialization - load from IndexedDB on mount
  React.useEffect(() => {
    if (!vectorStore) {
      // SSR or vector store not available
      dispatch({ type: actionTypes.SET_VECTOR_STORE_READY, payload: false });
      return;
    }

    console.log("[FilesContext] Initializing vector store from IndexedDB");

    if (!vectorStore.loaded) {
      vectorStore
        .loadFromIndexedDB()
        .then((count) => {
          if (count > 0) {
            console.log(
              `[FilesContext] Loaded ${count} cached embeddings from IndexedDB`,
            );
            dispatch({
              type: actionTypes.SET_VECTOR_STORE_READY,
              payload: true,
            });
          } else {
            console.log(
              "[FilesContext] No cached embeddings found in IndexedDB",
            );
            dispatch({
              type: actionTypes.SET_VECTOR_STORE_READY,
              payload: true,
            });
          }
        })
        .catch((error) => {
          console.error("[FilesContext] Failed to load from IndexedDB:", error);
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
      documentsCount: Object.keys(state.documents).length,
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
          (item) => item.metadata?.fileId !== file.id,
        );
      }

      // Load from S3 if needed
      if (!pageEmbeddings && embeddingsS3Key && file.documentID) {
        const existingInMemory = vectorStore.items.filter(
          (item) =>
            item.documentId === file.documentID ||
            item.metadata?.documentId === file.documentID,
        );

        if (existingInMemory.length > 0) {
          console.log(
            `[FilesContext] Skipping S3 - ${existingInMemory.length} embeddings in memory for ${file.documentID}`,
          );
          loadedVersions.current.set(file.id, currentVersion);
          return;
        }

        try {
          const cachedInIndexedDB = await loadEmbeddingsByDocument(
            file.documentID,
          );

          if (cachedInIndexedDB && cachedInIndexedDB.length > 0) {
            console.log(
              `[FilesContext] Loading ${cachedInIndexedDB.length} embeddings from IndexedDB for ${file.name}`,
            );
            cachedInIndexedDB.forEach((emb) => vectorStore.add(emb));
            loadedVersions.current.set(file.id, currentVersion);
            return;
          }
        } catch (error) {
          console.warn(
            `[FilesContext] IndexedDB check failed for ${file.documentID}:`,
            error,
          );
        }

        try {
          console.log(
            `[FilesContext] Downloading embeddings from S3 for ${file.name}`,
          );
          await loadEmbeddingsFromS3(embeddingsS3Key, file.documentID, {
            fileId: file.id,
            fileName: file.name,
            mimeType: file.mimeType,
          });

          const cachedEmbeddings = await loadEmbeddingsByDocument(
            file.documentID,
          );
          cachedEmbeddings.forEach((emb) => vectorStore.add(emb));
          console.log(
            `[FilesContext] Loaded ${cachedEmbeddings.length} embeddings from S3 for ${file.name}`,
          );
          loadedVersions.current.set(file.id, currentVersion);
          return;
        } catch (error) {
          console.error(
            `[FilesContext] S3 load failed for ${file.documentID}:`,
            error,
          );
        }
      }

      // Add page embeddings from DynamoDB
      if (pageEmbeddings && Array.isArray(pageEmbeddings) && file.documentID) {
        console.log(
          `[FilesContext] Adding ${pageEmbeddings.length} page embeddings for ${file.name}`,
        );

        pageEmbeddings.forEach((pageData) => {
          if (pageData.embedding) {
            vectorStore.add({
              id: `${file.id}-page-${pageData.page}`,
              documentId: file.documentID,
              page: pageData.page,
              text: pageData.text || "",
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
          vectorStore
            .saveToIndexedDB(file.documentID, pageEmbeddings, {
              fileId: file.id,
              fileName: file.name,
              mimeType: file.mimeType,
            })
            .catch((error) => {
              console.error("[FilesContext] IndexedDB save failed:", error);
            });
        }
      }

      // Add file-level embedding from S3 (metadata-only in DynamoDB now)
      if (file.embedding?.version && !pageEmbeddings) {
        try {
          const { loadEmbedding } = await import("../utils/embeddingStorage");
          const embeddingFile = await loadEmbedding(
            file.identityId || file.owner,
            "file",
            file.id,
          );
          if (embeddingFile?.pages?.length > 0) {
            embeddingFile.pages.forEach((pageData) => {
              vectorStore.add({
                id: `${file.id}-page-${pageData.page}`,
                documentId: file.documentID || file.id,
                page: pageData.page,
                text: pageData.text || file.description || file.name,
                vector: pageData.embedding,
                metadata: {
                  fileId: file.id,
                  documentId: file.documentID,
                  page: pageData.page,
                  fileName: file.name,
                  mimeType: file.mimeType,
                },
              });
            });
          }
        } catch (error) {
          console.warn(
            `[FilesContext] Failed to load embedding from S3 for ${file.name}:`,
            error,
          );
        }
      }

      if (currentVersion) {
        loadedVersions.current.set(file.id, currentVersion);
      }
    });

    console.log(
      `[FilesContext] Vector store population complete - ${vectorStore.items.length} total embeddings`,
    );
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
      console.log("[FilesContext] fetchFiles already called, skipping");
      return;
    }

    // ── Offline fallback: load files from IndexedDB cache ─────────────
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      filesFetchedRef.current = true;
      (async () => {
        try {
          const { getAllRecords } = await import("../offline/OfflineDataStore");
          const cachedFiles = await getAllRecords("files");
          if (cachedFiles.length > 0) {
            const _playlistFiltered = {};
            const _pdfsFiltered = {};
            cachedFiles.forEach((f) => {
              if (
                f.contentType &&
                ACCEPTABLE_PLAYLIST_TYPES.includes(f.contentType)
              ) {
                _playlistFiltered[f.id] = f;
              }
              if (f.contentType === "application/pdf") {
                _pdfsFiltered[f.id] = f;
              }
            });
            dispatch({
              type: actionTypes.FILES_SUBSCRIPTION_UPDATE,
              payload: {
                myFiles: cachedFiles,
                myPlaylistFiles: _playlistFiltered,
                myPdfs: _pdfsFiltered,
              },
            });
            console.log(
              "[FilesContext] Loaded",
              cachedFiles.length,
              "files from offline cache",
            );
          }
        } catch (err) {
          console.warn("[FilesContext] Offline file cache load failed:", err);
        }
      })();
      return;
    }
    // ── End offline fallback ──────────────────────────────────────────

    async function fetchFiles() {
      console.log("[FilesContext] fetchFiles called");
      try {
        console.log("[FilesContext] User authenticated:", user.attributes.sub);
        console.log("[FilesContext] Identity ID:", session.identityId);
        const myUserId = user.attributes.sub;

        if (!myUserId) {
          console.log("[FilesContext] No myUserId, returning");
          return;
        }

        // Mark as fetched before subscribing
        filesFetchedRef.current = true;
        console.log("[FilesContext] About to set up File observeQuery");

        const client = getAmplifyClient();

        function processFiles(validItems) {
          const _playlistFiltered = {};
          const _pdfsFiltered = {};

          validItems.forEach((item) => {
            if (item.mimeType && item.mimeType.startsWith("audio/")) {
              _playlistFiltered[item.id] = item;
            }
            if (item.mimeType === "application/pdf") {
              _pdfsFiltered[item.id] = item;
            }
          });

          dispatch({
            type: actionTypes.SET_PLAYLIST_FILES,
            payload: _playlistFiltered,
          });
          dispatch({ type: actionTypes.SET_PDFS, payload: _pdfsFiltered });
          dispatch({ type: actionTypes.SET_MY_FILES, payload: validItems });
          dispatch({ type: actionTypes.INCREMENT_FILES_VERSION });
        }

        function handleError(label, error) {
          const msg =
            error?.message ||
            error?.errors?.[0]?.message ||
            error?.error?.errors?.[0]?.message ||
            JSON.stringify(error);
          if (msg.includes("DuplicatedOperationError")) {
            console.warn(
              `[FilesContext] ${label}: transient DuplicatedOperationError (safe to ignore)`,
            );
            return;
          }
          console.error(`[FilesContext] ${label} error:`, error);
        }

        // Single observeQuery replaces list() + 3 manual subscriptions
        // Exclude heavy fields: yjsSnapshot
        const subscription = client.models.File.observeQuery({
          selectionSet: [
            "id",
            "owner",
            "identityId",
            "name",
            "description",
            "prompt",
            "model",
            "variant",
            "mimeType",
            "level",
            "path",
            "size",
            "duration",
            "generated",
            "hex",
            "byHex",
            "thumbnail",
            "documentID",
            "embedding.*",
            "hlsUrl",
            "transcodeStatus",
            "mediaConvertJobId",
            "_version",
            "_lastChangedAt",
            "_deleted",
            "createdAt",
            "updatedAt",
          ],
        }).subscribe({
          next: ({ items }) => {
            const validItems = (items || []).filter(
              (item) => item != null && item.id != null,
            );

            // Version map guard: skip if no item has a newer _version
            const hasChanges = validItems.some((item) => {
              const tracked = fileVersionMapRef.current[item.id];
              return tracked == null || item._version > tracked;
            });

            if (
              !hasChanges &&
              Object.keys(fileVersionMapRef.current).length > 0
            ) {
              return; // All items same or older version — skip dispatch
            }

            // Update version map
            fileVersionMapRef.current = {};
            validItems.forEach((item) => {
              fileVersionMapRef.current[item.id] = item._version;
            });

            console.log(
              "[FilesContext] File observeQuery update:",
              validItems.length,
              "files",
            );
            processFiles(validItems);
          },
          error: (error) => handleError("File observeQuery", error),
        });

        subscriptionRef.current = subscription;
      } catch (error) {
        // Handle authentication errors gracefully
        if (
          error.name === "UserUnAuthenticatedException" ||
          error.message?.includes("authenticated")
        ) {
          return;
        }
        console.error("Error fetching files:", error);
      }
    }

    fetchFiles();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      filesFetchedRef.current = false;
    };
  }, [user, authLoading, session?.identityId]);

  // Subscribe to Document status changes
  React.useEffect(() => {
    const client = getAmplifyClient();
    let cancelled = false;

    function parseDoc(doc) {
      const pageEmbeddings =
        typeof doc.pageEmbeddings === "string"
          ? JSON.parse(doc.pageEmbeddings)
          : doc.pageEmbeddings;

      return {
        id: doc.id,
        s3Key: doc.s3Key,
        status: doc.status,
        pageCount: doc.pageCount,
        pageEmbeddings: pageEmbeddings,
        embeddingsS3Key: doc.embeddingsS3Key,
        updatedAt: doc.updatedAt,
        _version: doc._version,
      };
    }

    function handleError(label, error) {
      const msg =
        error?.message ||
        error?.errors?.[0]?.message ||
        error?.error?.errors?.[0]?.message ||
        JSON.stringify(error);
      if (msg.includes("DuplicatedOperationError")) {
        console.warn(
          `[FilesContext] ${label}: transient DuplicatedOperationError (safe to ignore)`,
        );
        return;
      }
      console.error(`[FilesContext] ${label} error:`, error);
    }

    // Single observeQuery replaces list() + 3 manual subscriptions
    // Exclude heavy fields: metadata, yjsSnapshot (extractedText moved to S3)
    const subscription = client.models.Document.observeQuery({
      selectionSet: [
        "id",
        "owner",
        "identityId",
        "learner",
        "sectionID",
        "readableGroups.*",
        "writableGroups.*",
        "filename",
        "s3Key",
        "status",
        "textExtractedAt",
        "pageCount",
        "fileSize",
        "mimeType",
        "sourceFormat",
        "uploadedAt",
        "resumeState.*",
        "_version",
        "_lastChangedAt",
        "_deleted",
        "createdAt",
        "updatedAt",
      ],
    }).subscribe({
      next: ({ items }) => {
        if (cancelled) return;
        const validItems = (items || []).filter(
          (item) => item != null && item.id != null,
        );

        // Version map guard: skip if no item has a newer _version
        const hasChanges = validItems.some((item) => {
          const tracked = documentVersionMapRef.current[item.id];
          return tracked == null || item._version > tracked;
        });

        if (
          !hasChanges &&
          Object.keys(documentVersionMapRef.current).length > 0
        ) {
          return; // All items same or older version — skip dispatch
        }

        // Update version map
        documentVersionMapRef.current = {};
        validItems.forEach((item) => {
          documentVersionMapRef.current[item.id] = item._version;
        });

        const docsMap = {};
        validItems.forEach((doc) => {
          docsMap[doc.id] = parseDoc(doc);
        });
        dispatch({ type: actionTypes.SET_DOCUMENTS, payload: docsMap });
      },
      error: (error) => handleError("Document observeQuery", error),
    });

    documentSubscriptionRef.current = subscription;

    return () => {
      cancelled = true;
      if (documentSubscriptionRef.current) {
        documentSubscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  const refreshAudioFiles = async () => {
    const results = await list("audio/", {
      cacheControl: "no-cache",
    });

    if (results?.results?.length > 0) {
      const fileMap = {};
      results.results.forEach((item) => {
        fileMap[item.key] = item;
      });

      dispatch({ type: actionTypes.SET_AUDIO_FILES, payload: fileMap });
    }
  };

  // Optimistic version bump helpers — call before save to block subscription echo
  const bumpFileVersion = React.useCallback((id, currentVersion) => {
    const previousVersion = fileVersionMapRef.current[id] || currentVersion;
    fileVersionMapRef.current[id] = currentVersion + 1;
    return {
      confirm: (actualVersion) => {
        fileVersionMapRef.current[id] = actualVersion;
      },
      rollback: () => {
        fileVersionMapRef.current[id] = previousVersion;
      },
    };
  }, []);

  const bumpDocumentVersion = React.useCallback((id, currentVersion) => {
    const previousVersion = documentVersionMapRef.current[id] || currentVersion;
    documentVersionMapRef.current[id] = currentVersion + 1;
    return {
      confirm: (actualVersion) => {
        documentVersionMapRef.current[id] = actualVersion;
      },
      rollback: () => {
        documentVersionMapRef.current[id] = previousVersion;
      },
    };
  }, []);

  const contextValue = React.useMemo(
    () => ({
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
      vectorStoreReady: state.vectorStoreReady,
      bumpFileVersion,
      bumpDocumentVersion,
    }),
    [
      state.audioFiles,
      state.myFiles,
      state.myPlaylistFiles,
      state.myPlaylistUrls,
      state.myPdfs,
      state.documents,
      session,
      state.filesVersion,
      // vectorStore is intentionally excluded - it's a ref and never changes
      state.vectorStoreReady,
      bumpFileVersion,
      bumpDocumentVersion,
    ],
  );

  return (
    <FilesContext.Provider value={contextValue}>
      {children}
    </FilesContext.Provider>
  );
};

export { FilesProvider };

// I make this default since it will probably be exported most often.
export default FilesContext;
