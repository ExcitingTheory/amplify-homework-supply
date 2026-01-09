# Offline Hybrid Architecture Plan

## Overview

**Online (Content Creation)**: Keep full AWS Amplify + OpenAI stack for teachers  
**Offline (Student Work)**: YJS-based P2P sync for classroom collaboration without internet

---

## Architecture Layers

### Layer 1: Content Authoring (Online, AWS)

**Who**: Teachers, content creators  
**Stack**: Current AWS Amplify + OpenAI (no changes)  
**Features**:
- AI-assisted content generation
- Unit creation with Lexical editor
- Vocabulary import with embeddings
- Audio/video generation
- Document analysis
- Grade tracking (when students sync)

**Flow**:
```
Teacher → Creates Unit → AI generates content → Publishes package
```

---

### Layer 2: Content Distribution (Hybrid)

**Content Packages**: Downloadable bundles containing:
- Unit structure (Lexical JSON)
- Words with audio files
- Questions with images
- Pre-computed embeddings
- Required media assets
- **Streaming media (HLS/DASH)** - Pre-processed through AWS pipelines

**Storage Format** (IndexedDB):
```javascript
{
  packageId: "unit-123-v2",
  version: 2,
  unit: { id, name, description, data: {...} },
  words: [...],
  questions: [...],
  files: [{ key, blob, type, size }],
  embeddings: [...],
  streamingMedia: [{
    key: "video-123",
    format: "hls", // or "dash"
    manifest: "master.m3u8", // blob ref
    segments: [...], // array of segment blobs
    bandwidth: [360, 540, 720], // available qualities
    torrent: { // NEW: WebTorrent metadata
      magnetUri: "magnet:?xt=urn:btih:...",
      infoHash: "abc123...",
      files: [...], // torrent file structure
      trackers: ['wss://tracker.local:8000'] // classroom tracker
    }
  }],
  packagedAt: "2026-01-06T...",
  downloadedAt: "2026-01-06T..."
}
```

**AWS Media Pipeline Integration**:

Pre-process video/audio through **AWS Elemental MediaConvert** to create adaptive streaming formats:
- **HLS** (HTTP Live Streaming) - Apple devices
- **DASH** (Dynamic Adaptive Streaming over HTTP) - Android/web

**Benefits for Offline**:
1. Download once, stream locally from IndexedDB
2. Adaptive bitrate (360p/540p/720p) based on device/storage
3. Segment-based = partial downloads supported
4. Can be re-streamed via WebRTC to peers in classroom

**APIs to Add**:
```graphql
type Query {
  getContentPackage(unitId: ID!): ContentPackage
  listAvailablePackages(sectionId: ID!): [ContentPackageMetadata]
}

type ContentPackage {
  packageId: ID!
  version: Int!
  unit: AWSJSON!
  words: AWSJSON!
  questions: AWSJSON!
  files: [FileDownload!]!
  streamingMedia: [StreamingMediaPackage!]! # NEW
  size: Int!
}

type StreamingMediaPackage {
  mediaId: ID!
  format: StreamingFormat! # HLS or DASH
  manifestUrl: String!     # Pre-signed URL for .m3u8 or .mpd
  segmentUrls: [String!]!  # Pre-signed URLs for all segments
  qualities: [Int!]!       # Available resolutions [360, 540, 720]
  duration: Float!         # Total duration in seconds
  size: Int!              # Total size in bytes
  torrentInfo: TorrentInfo # NEW: P2P distribution metadata
}

type TorrentInfo {
  magnetUri: String!       # Magnet link for WebTorrent
  infoHash: String!        # Torrent info hash
  trackers: [String!]!     # WebTorrent trackers (WebSocket)
  pieceLength: Int!        # Chunk size for P2P transfer
  fileList: [TorrentFile!]! # Files in torrent
}

type TorrentFile {
  path: String!
  length: Int!
  offset: Int!
}

enum StreamingFormat {
  HLS
  DASH
}

type FileDownload {
  key: String!
  url: String!  # Pre-signed S3 URL
  type: String!
  size: Int!
}
```

---

### Layer 3: Offline Student Experience (YJS + IndexedDB)

**Who**: Students  
**Stack**: YJS (WebRTC/WebSocket) + IndexedDB  
**Features**:
- Work without internet
- P2P collaboration with classmates (same LAN)
- Local progress tracking
- Sync to cloud when online

**Data Structure**:
```javascript
// YJS Document Structure
{
  content: Y.Map({      // Read-only, from package
    unit: {...},
    words: [...],
    questions: [...]
  }),
  
  studentWork: Y.Map({  // Writable, syncs via YJS
    "block-abc-123": {
      answer: "...",
      complete: true,
      accuracy: 0.85,
      timestamp: 1704567890000,
      synced: false
    }
  }),
  
  awareness: Y.Awareness() // Live cursors, presence
}
```

**Providers**:
```javascript
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

const ydoc = new Y.Doc();

// 1. Local persistence (always on)
const persistence = new IndexeddbPersistence('work-unit-123', ydoc);

// 2. Classroom LAN sync (when available)
const classroom = new WebrtcProvider('classroom-unit-123', ydoc, {
  signaling: [
    'ws://192.168.1.100:4444', // Teacher's device as signaling
    'wss://signaling.yjs.dev'   // Fallback public
  ],
  password: 'class-secret',
  maxConns: 30
});

// 3. Cloud sync (when online)
const cloud = new WebsocketProvider(
  'wss://your-api.amazonaws.com/ws',
  'work-unit-123',
  ydoc,
  { connect: navigator.onLine }
);

// Auto-reconnect when online
window.addEventListener('online', () => cloud.connect());
window.addEventListener('offline', () => cloud.disconnect());
```

---

## Implementation Phases

### Phase 1: Package System (2 weeks)

**Backend** (Lambda + GraphQL):
1. Create `getContentPackage` query
2. Bundle unit + related data
3. Generate pre-signed URLs for files
4. Add package versioning

**Frontend**:
1. Add "Download for Offline" button in Unit view
2. Implement package download with progress bar
3. Store in IndexedDB via `idb` library
4. Show offline-available badge

**Files to Modify**:
- [amplify/backend/api/japanese5/schema.graphql](amplify/backend/api/japanese5/schema.graphql) - Add package queries
- New: `amplify/backend/function/packageContent/`
- [src/context/unitContext.js](src/context/unitContext.js) - Add package download methods
- New: `src/utils/packageManager.js`

### Phase 2: YJS Integration (2 weeks)

**Dependencies**:
```bash
npm install yjs y-webrtc y-websocket y-indexeddb idb
```

**New Files**:
- `src/sync/OfflineWorkspace.js` - YJS document manager
- `src/sync/providers.js` - Provider setup/configuration
- `src/sync/awareness.js` - User presence tracking
- `src/context/offlineContext.js` - React context for offline state

**Integration Points**:
- Wrap Editor3 with YJS binding
- Replace `grade.data` writes with YJS map updates
- Add presence indicators for collaborative work

**Files to Modify**:
- [src/components/Editor3/Editor.js](src/components/Editor3/Editor.js) - YJS text binding
- [pages/unit/[id].js](pages/unit/[id].js) - Offline mode detection
- [src/context/unitContext.js](src/context/unitContext.js) - Hybrid save logic

### Phase 3: Sync Layer (1 week)

**Bidirectional Sync**:
```javascript
class HybridSyncManager {
  constructor(unitId) {
    this.unitId = unitId;
    this.ydoc = new Y.Doc();
    this.studentWork = this.ydoc.getMap('work');
    this.syncQueue = [];
    this.isSyncing = false;
  }
  
  // Listen to YJS changes
  observeChanges() {
    this.studentWork.observe(event => {
      const changes = Array.from(event.changes.keys.entries());
      changes.forEach(([key, change]) => {
        if (change.action === 'add' || change.action === 'update') {
          this.queueSync(key, this.studentWork.get(key));
        }
      });
    });
  }
  
  // Queue for cloud sync
  queueSync(blockId, data) {
    this.syncQueue.push({ blockId, data, timestamp: Date.now() });
    this.debouncedSync();
  }
  
  // Sync to DataStore when online
  async syncToCloud() {
    if (!navigator.onLine || this.isSyncing) return;
    
    this.isSyncing = true;
    
    try {
      const gradeData = {};
      this.studentWork.forEach((value, key) => {
        gradeData[key] = value;
      });
      
      const existing = await DataStore.query(Grade, g => 
        g.unitID.eq(this.unitId).owner.eq(session.username)
      );
      
      if (existing.length > 0) {
        await DataStore.save(
          Grade.copyOf(existing[0], updated => {
            updated.data = JSON.stringify(gradeData);
            updated.complete = this.isComplete(gradeData);
          })
        );
      } else {
        await DataStore.save(new Grade({
          unitID: this.unitId,
          data: JSON.stringify(gradeData),
          complete: false
        }));
      }
      
      // Mark all as synced
      this.syncQueue = [];
      
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }
  
  debouncedSync = debounce(this.syncToCloud.bind(this), 5000);
}
```

**Files to Create**:
- `src/sync/HybridSyncManager.js`
- `src/hooks/useOfflineSync.js`

### Phase 4: Media Streaming Integration (1 week)

**AWS Elemental MediaConvert Setup**:

Create Lambda function to trigger transcoding when content is published:

```javascript
// amplify/backend/function/transcodeMedia/src/index.js
import { MediaConvertClient, CreateJobCommand } from '@aws-sdk/client-mediaconvert';

export const handler = async (event) => {
  const { videoKey, outputPrefix } = event.arguments;
  
  const jobSettings = {
    OutputGroups: [
      {
        Name: 'HLS',
        OutputGroupSettings: {
          Type: 'HLS_GROUP_SETTINGS',
          HlsGroupSettings: {
            SegmentLength: 6,
            MinSegmentLength: 0,
            Destination: `s3://bucket/${outputPrefix}/hls/`
          }
        },
        Outputs: [
          { // 360p
            VideoDescription: { Width: 640, Height: 360 },
            AudioDescriptions: [{ CodecSettings: { Codec: 'AAC', Bitrate: 128000 }}]
          },
          { // 540p
            VideoDescription: { Width: 960, Height: 540 },
            AudioDescriptions: [{ CodecSettings: { Codec: 'AAC', Bitrate: 128000 }}]
          },
          { // 720p
            VideoDescription: { Width: 1280, Height: 720 },
            AudioDescriptions: [{ CodecSettings: { Codec: 'AAC', Bitrate: 256000 }}]
          }
        ]
      }
    ],
    Inputs: [{
      FileInput: `s3://bucket/${videoKey}`
    }]
  };
  
  const client = new MediaConvertClient({ region: 'us-east-1' });
  const response = await client.send(new CreateJobCommand(jobSettings));
  
  return { jobId: response.Job.Id };
};
```

**Local HLS Player (Offline)**:

Use **hls.js** to play HLS from IndexedDB blobs:

```javascript
// src/components/OfflineVideoPlayer.js
import Hls from 'hls.js';
import { useEffect, useRef } from 'react';

function OfflineVideoPlayer({ mediaId }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  
  useEffect(() => {
    async function loadMedia() {
      const db = await openDB('homework-supply');
      const media = await db.get('streamingMedia', mediaId);
      
      if (!media) return;
      
      // Create blob URLs for manifest and segments
      const manifestBlob = new Blob([media.manifest], { type: 'application/vnd.apple.mpegurl' });
      const manifestUrl = URL.createObjectURL(manifestBlob);
      
      // Intercept segment requests and serve from IndexedDB
      if (Hls.isSupported()) {
        const hls = new Hls({
          xhrSetup: async (xhr, url) => {
            // Find segment in IndexedDB
            const segmentName = url.split('/').pop();
            const segment = media.segments.find(s => s.name === segmentName);
            
            if (segment) {
              // Serve from blob instead of network
              const blobUrl = URL.createObjectURL(segment.blob);
              xhr.open('GET', blobUrl);
            }
          }
        });
        
        hls.loadSource(manifestUrl);
        hls.attachMedia(videoRef.current);
        hlsRef.current = hls;
      }
    }
    
    loadMedia();
    
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [mediaId]);
  
  return <video ref={videoRef} controls />;
}
```

**WebTorrent + WebRTC Media Distribution** (P2P in classroom):

Use **WebTorrent** for efficient BitTorrent-style P2P sharing over WebRTC:

```javascript
// src/sync/WebTorrentMediaStreaming.js
import WebTorrent from 'webtorrent';
import { openDB } from 'idb';

class WebTorrentMediaStreaming {
  constructor(trackerUrls = ['wss://tracker.local:8000']) {
    this.client = new WebTorrent({
      tracker: {
        rtcConfig: {
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        }
      }
    });
    this.trackers = trackerUrls;
    this.torrents = new Map();
  }
  
  // Seed content package as torrent
  async seedPackage(packageId, files) {
    return new Promise((resolve, reject) => {
      this.client.seed(files, {
        name: packageId,
        announce: this.trackers
      }, (torrent) => {
        this.torrents.set(packageId, torrent);
        
        console.log(`Seeding ${packageId}:`, {
          magnetURI: torrent.magnetURI,
          infoHash: torrent.infoHash,
          numPeers: torrent.numPeers
        });
        
        resolve({
          magnetUri: torrent.magnetURI,
          infoHash: torrent.infoHash,
          files: torrent.files.map(f => ({
            path: f.path,
            length: f.length
          }))
        });
      });
    });
  }
  
  // Download content package from peers
  async downloadPackage(magnetUri, onProgress) {
    return new Promise((resolve, reject) => {
      const torrent = this.client.add(magnetUri, {
        announce: this.trackers
      });
      
      torrent.on('metadata', () => {
        console.log('Torrent metadata received:', {
          name: torrent.name,
          files: torrent.files.length,
          size: torrent.length
        });
      });
      
      torrent.on('download', () => {
        if (onProgress) {
          onProgress({
            progress: torrent.progress,
            downloadSpeed: torrent.downloadSpeed,
            uploadSpeed: torrent.uploadSpeed,
            numPeers: torrent.numPeers,
            downloaded: torrent.downloaded,
            uploaded: torrent.uploaded
          });
        }
      });
      
      torrent.on('done', async () => {
        console.log('Download complete!');
        
        // Store files in IndexedDB
        const db = await openDB('homework-supply');
        
        for (const file of torrent.files) {
          const blob = await new Promise((res, rej) => {
            file.getBlob((err, blob) => {
              if (err) rej(err);
              else res(blob);
            });
          });
          
          await db.put('torrent-files', {
            path: file.path,
            blob,
            size: file.length
          }, file.path);
        }
        
        resolve(torrent);
      });
      
      torrent.on('error', reject);
    });
  }
  
  // Stream video directly from torrent (progressive download)
  getStreamingUrl(magnetUri, fileIndex = 0) {
    const torrent = this.client.add(magnetUri, {
      announce: this.trackers
    });
    
    return new Promise((resolve, reject) => {
      torrent.on('ready', () => {
        const file = torrent.files[fileIndex];
        
        // Create streaming blob URL
        file.getBlobURL((err, url) => {
          if (err) reject(err);
          else resolve(url);
        });
      });
      
      torrent.on('error', reject);
    });
  }
  
  // Get torrent statistics
  getStats(infoHash) {
    const torrent = this.client.get(infoHash);
    if (!torrent) return null;
    
    return {
      progress: torrent.progress,
      downloadSpeed: torrent.downloadSpeed,
      uploadSpeed: torrent.uploadSpeed,
      numPeers: torrent.numPeers,
      ratio: torrent.uploaded / torrent.downloaded,
      timeRemaining: torrent.timeRemaining
    };
  }
  
  // Clean up
  destroy() {
    this.client.destroy();
  }
}

export default WebTorrentMediaStreaming;
```

**WebTorrent Video Player Component**:

```javascript
// src/components/TorrentVideoPlayer.js
import { useEffect, useRef, useState } from 'react';
import WebTorrentMediaStreaming from '../sync/WebTorrentMediaStreaming';

function TorrentVideoPlayer({ magnetUri, trackerUrls }) {
  const videoRef = useRef(null);
  const [torrentClient] = useState(() => new WebTorrentMediaStreaming(trackerUrls));
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadVideo() {
      try {
        // Start streaming (progressive download)
        const streamUrl = await torrentClient.getStreamingUrl(magnetUri);
        videoRef.current.src = streamUrl;
        setLoading(false);
        
        // Update stats every second
        const interval = setInterval(() => {
          const torrent = torrentClient.client.get(magnetUri);
          if (torrent) {
            setStats({
              progress: Math.round(torrent.progress * 100),
              peers: torrent.numPeers,
              downloadSpeed: (torrent.downloadSpeed / 1024 / 1024).toFixed(2),
              uploadSpeed: (torrent.uploadSpeed / 1024 / 1024).toFixed(2)
            });
          }
        }, 1000);
        
        return () => clearInterval(interval);
      } catch (error) {
        console.error('Error loading torrent:', error);
      }
    }
    
    loadVideo();
    
    return () => torrentClient.destroy();
  }, [magnetUri, torrentClient, trackerUrls]);
  
  return (
    <div>
      {loading && <div>Connecting to peers...</div>}
      
      <video ref={videoRef} controls autoPlay />
      
      <div style={{ marginTop: 10, fontSize: 12 }}>
        <div>Progress: {stats.progress}%</div>
        <div>Peers: {stats.peers}</div>
        <div>↓ {stats.downloadSpeed} MB/s | ↑ {stats.uploadSpeed} MB/s</div>
      </div>
    </div>
  );
}

export default TorrentVideoPlayer;
```

**Benefits**:
- Download once, share with entire classroom automatically
- BitTorrent efficiency: faster downloads with more peers
- Progressive streaming: watch while downloading
- Automatic peer discovery and load balancing
- Works completely offline after first peer downloads
- Can seed from teacher's device or school server
- Students contribute upload bandwidth (reduces server load)

**Files to Create**:
- `amplify/backend/function/transcodeMedia/` - MediaConvert Lambda
- `amplify/backend/function/createTorrent/` - Generate torrent metadata
- `src/components/OfflineVideoPlayer.js` - HLS player from IndexedDB
- `src/components/TorrentVideoPlayer.js` - WebTorrent streaming player
- `src/sync/WebTorrentMediaStreaming.js` - P2P torrent distribution
- `src/utils/hlsDownloader.js` - Download HLS to IndexedDB
- `src/utils/torrentSeeder.js` - Seed content packages

**WebTorrent Tracker Setup** (Teacher's device or school server):
```bash
# Install tracker server
npm install -g bittorrent-tracker

# Run WebSocket tracker on LAN
bittorrent-tracker --ws --port 8000
```

**Dependencies**:
```bash
npm install hls.js @aws-sdk/client-mediaconvert webtorrent idb
```

---

### Phase 5: UI/UX Enhancements (1 week)

**Offline Indicators**:
- Connection status badge (online/classroom/offline)
- Sync progress indicator
- Peer count in classroom mode
- Download progress for packages

**Components to Create**:
- `src/components/OfflineStatus.js`
- `src/components/PackageDownloader.js`
- `src/components/PeerPresence.js`
- `src/components/SyncIndicator.js`

**Features**:
```javascript
// Connection status component
function ConnectionStatus() {
  const { isOnline, peers, cloudSynced } = useOfflineSync();
  
  return (
    <Chip 
      icon={isOnline ? <CloudDone /> : <CloudOff />}
      label={
        isOnline ? 'Online' : 
        peers > 0 ? `Classroom (${peers} peers)` : 
        'Offline'
      }
      color={isOnline ? 'success' : peers > 0 ? 'warning' : 'default'}
    />
  );
}
```

---

## WebRTC Signaling Options

### Option 1: Teacher's Device as Signaling Server

**Simplest for classroom**: Teacher runs a local signaling server on their laptop

```bash
# Teacher runs this before class
npx y-webrtc-signaling --port 4444
```

Students connect to `ws://192.168.1.100:4444` (teacher's local IP)

**Pros**: No internet needed, fast, private  
**Cons**: Requires teacher setup, IP discovery

### Option 2: AWS Lambda WebSocket (Hybrid)

Keep a lightweight WebSocket server on AWS for signaling only

```javascript
// Minimal Lambda WebSocket handler
export const handler = async (event) => {
  const { routeKey, connectionId, body } = event;
  
  if (routeKey === 'message') {
    // Just relay signaling messages, not full data
    const message = JSON.parse(body);
    if (message.type === 'signal') {
      await broadcastToRoom(message.room, message.signal, connectionId);
    }
  }
  
  return { statusCode: 200 };
};
```

**Pros**: Reliable, auto-scaling, works anywhere  
**Cons**: Small AWS cost (~$0.01/hour)

### Option 3: Public Signaling (y-webrtc default)

Use public servers: `wss://signaling.yjs.dev`

**Pros**: Free, zero setup  
**Cons**: Privacy concerns, may be slow

---

## Package Download Flow

```javascript
// In UnitContext or new PackageContext

async function downloadUnitPackage(unitId) {
  setDownloadProgress({ status: 'fetching', percent: 0 });
  
  // 1. Get package metadata
  const pkg = await API.graphql({
    query: getContentPackage,
    variables: { unitId }
  });
  
  const { unit, words, questions, files } = pkg.data.getContentPackage;
  
  // 2. Download all files with progress
  const fileBlobs = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    setDownloadProgress({ 
      status: 'downloading', 
      percent: (i / files.length) * 100,
      current: file.key
    });
    
    const response = await fetch(file.url);
    const blob = await response.blob();
    
    fileBlobs.push({ key: file.key, blob, type: file.type });
  }
  
  // 3. Store in IndexedDB
  const db = await openDB('homework-supply');
  
  await db.put('packages', {
    packageId: `${unitId}-v${pkg.version}`,
    unit,
    words,
    questions,
    files: fileBlobs,
    downloadedAt: new Date().toISOString()
  }, unitId);
  
  setDownloadProgress({ status: 'complete', percent: 100 });
  
  return pkg;
}
```

---

## Directory Structure Changes

```
src/
├── sync/                    # NEW: Offline sync layer
│   ├── OfflineWorkspace.js
│   ├── HybridSyncManager.js
│   ├── providers.js
│   └── awareness.js
├── offline/                 # NEW: Offline utilities
│   ├── packageManager.js
│   ├── indexedDB.js
│   └── fileCache.js
├── hooks/                   # EXPAND
│   ├── useOfflineSync.js    # NEW
│   ├── usePackageDownload.js # NEW
│   └── useYjsProvider.js    # NEW
├── components/              # ADD
│   ├── OfflineStatus.js
│   ├── PackageDownloader.js
│   └── PeerPresence.js
└── context/                 # MODIFY
    └── offlineContext.js    # NEW

amplify/backend/function/
├── packageContent/          # NEW Lambda
└── websocketSignaling/      # NEW Lambda (optional)
```

---

## Example: Student Workflow

```javascript
// 1. Student opens app at home (online)
// Downloads unit package
const pkg = await downloadUnitPackage('unit-123');

// 2. Goes to class (offline, LAN only)
const workspace = new OfflineWorkspace('unit-123', pkg);
workspace.enableClassroomSync('classroom-secret');

// 3. Student works on assignment
workspace.updateProgress('block-1', { answer: 'Photosynthesis is...' });

// YJS syncs with nearby peers in real-time over LAN

// 4. Returns home (online)
await workspace.syncToCloud(); // Push grade to DataStore
```

---

## Cost & Complexity Analysis

| Component | Complexity | Cost |
|-----------|-----------|------|
| Package API | Low | $0 (uses existing Lambda) |
| IndexedDB storage | Low | Free (client-side) |
| YJS integration | Medium | Free (client library) |
| WebRTC signaling | Low-Medium | Free (public) or $5/mo (self-hosted) |
| AWS WebSocket | Medium | ~$0.01/hour ($7/mo) |
| **AWS MediaConvert** | **Medium** | **~$0.015/min transcoded** |
| **HLS.js integration** | **Low** | **Free (client library)** |
| **WebTorrent P2P** | **Medium** | **Free (P2P protocol)** |
| **BitTorrent tracker** | **Low** | **Free (self-hosted on LAN)** |
| UI components | Low | Free |
| **Total** | **Medium** | **$0-15/month + transcoding** |

**Media Transcoding Costs** (AWS Elemental MediaConvert):
- Basic tier: $0.015/minute for 720p output
- 10-minute video = $0.15
- 100 videos/month = $15
- **One-time cost per video** (amortized across all students)

**Development Time**: ~8 weeks (vs 6 weeks without media streaming)

**Storage Impact**:
- Raw video: ~500MB for 10 min @ 1080p
- HLS package (360p+540p+720p): ~300MB total
- Students can choose quality tier to download
- P2P sharing reduces individual storage needs

---

## Trade-offs vs Full Offline

### Hybrid Approach ✅
- Keep high-quality AI content generation
- Offline student work with P2P collaboration
- **AWS MediaConvert for professional streaming quality**
- **Adaptive bitrate streaming (works on any device)**
- **WebRTC media sharing reduces bandwidth in classrooms**
- Seamless sync when online
- Much smaller bundle size (students choose quality tier)
- Existing AWS infrastructure

### Full Offline ❌
- Local LLM (worse quality)
- No cloud backup without extra work
- Larger app size (~500MB+ with local models)
- More complex setup
- **No professional media transcoding** (would need local FFmpeg)
- **Limited streaming capabilities**

---

## Next Steps

1. **Proof of Concept** (1 week):
   - Add YJS to one Unit page
   - Test WebRTC P2P with 2 browsers
   - Implement basic package download
   - **Test HLS playback from IndexedDB**

2. **Alpha Build** (4 weeks):
   - Full package system
   - IndexedDB persistence
   - Cloud sync layer
   - **AWS MediaConvert integration**
   - **Offline HLS player component**

3. **Beta Testing** (2 weeks):
   - Test in real classroom
   - Tune sync delays
   - Polish UI
   - **Test P2P media sharing with 10+ students**

**Start with**:
```bash
npm install yjs y-webrtc y-indexeddb idb hls.js @aws-sdk/client-mediaconvert webtorrent
```

**Classroom Setup**:
1. Teacher starts BitTorrent tracker on laptop: `bittorrent-tracker --ws --port 8000`
2. Students configure app to use teacher's tracker: `ws://192.168.1.100:8000`
3. Teacher (or first student) downloads content package from AWS
4. Teacher/student seeds package via WebTorrent
5. Other students download from peers (torrent swarm)
6. Everyone contributes upload bandwidth automatically

**Why WebTorrent + HLS?**
- **HLS**: Professional quality, adaptive streaming, AWS transcoding
- **WebTorrent**: Efficient P2P distribution, browser-native, no plugins
- **Combination**: Best of both worlds - quality + efficiency

---

## Classroom Workflow Example

### Day 1: Teacher Prepares Content (Online)
1. Teacher creates Unit using Editor3 with AI assistance
2. Uploads dialogue audio/video to S3
3. AWS MediaConvert transcodes to HLS (360p/540p/720p)
4. Lambda generates torrent metadata (magnet URI)
5. Content package includes:
   - Unit JSON (10KB)
   - Vocabulary with audio (5MB)
   - Video HLS segments (100MB @ 720p, 50MB @ 360p)
   - Torrent metadata

### Day 2: First Class Period (Hybrid)
**Teacher's laptop** (connected to school WiFi):
- Starts BitTorrent tracker: `bittorrent-tracker --ws --port 8000`
- Downloads content package from AWS
- Seeds package via WebTorrent (shares LAN IP: `192.168.1.100`)

**Student 1** (Alice, strong WiFi):
- Opens app, sees "Unit 5: Dialogue Practice"
- Clicks "Download for Offline"
- App connects to teacher's tracker
- Downloads from both AWS (50%) and teacher's laptop (50%)
- Automatically starts seeding to classmates

**Students 2-30**:
- Connect to teacher's tracker
- Download progressively from:
  - Teacher's laptop (initial seed)
  - Alice (now seeding)
  - Each other (swarm effect)
- Download speed increases as more students complete download
- **Result**: 30 students download 100MB video using ~100MB AWS bandwidth (vs 3GB without P2P)

### Day 3: Remote Learning (Offline Only)
**Student at home (no internet)**:
- Opens app, works on Unit 5 offline
- All content in IndexedDB
- YJS tracks answers locally
- Peers at home on same WiFi can collaborate via WebRTC

**Student returns to school**:
- App auto-syncs Grade to DataStore
- Progress saved to AWS

### Week 2: Another Class Uses Same Content
**Bandwidth savings**:
- AWS serves initial manifest only (~10KB)
- Students download from previous class's devices
- Previous students' laptops/tablets act as persistent seeds
- **Zero additional AWS bandwidth**

---

## Performance Characteristics

### Download Speeds (30-student classroom)

| Method | Time for 1st Student | Time for Last Student | AWS Bandwidth |
|--------|---------------------|----------------------|---------------|
| **Direct S3 Download** | 2 min | 60 min (congestion) | 3,000 MB |
| **CloudFront CDN** | 1 min | 30 min | 3,000 MB |
| **WebTorrent P2P** | 2 min (seed) | 5 min (swarm) | **100 MB** |

### Bandwidth Contribution Per Student

With WebTorrent, each student contributes upload bandwidth:
- Student 1: Downloads 100MB, uploads 50MB to others
- Student 2: Downloads 50MB from S1 + 50MB AWS, uploads 50MB
- Student 30: Downloads 100MB from peers, uploads 0MB (last)
- **Total AWS**: ~100MB vs 3GB (97% savings)

### Storage Requirements

Students can choose quality tier:
- 360p: 30MB (mobile devices)
- 540p: 50MB (laptops)  
- 720p: 100MB (tablets/desktops)

IndexedDB automatically manages storage limits.

Want me to build the proof of concept?
