# AudioWaveformPlayer - Recording Features

## Overview

The `AudioWaveformPlayer` component now includes all the recording features from `RecordingStudio2`, making it a complete audio recording and playback solution.

## New Features Added

### 1. Audio Recording
- Start/stop recording with microphone icon
- Real-time waveform visualization during recording
- Visual feedback with recording indicator

### 2. Automatic Waveform Generation
- Calculates waveform data (600 samples) after recording stops
- Uses `calculateWaveformData` utility
- Normalized amplitude values (0-1 range)

### 3. Automatic Upload & Storage
- Uploads to S3 with private access level
- Uses `uploadStudentSubmission` utility
- Saves file metadata to DataStore
- Includes waveform data in metadata

### 4. Playback of Recorded Audio
- Immediately playback recorded audio
- Shows waveform of recorded content
- All standard playback controls available

## Usage

### Basic Recording (No Upload)

```jsx
<AudioWaveformPlayer
  enableRecording={true}
  width={600}
  height={80}
  title="Record Your Audio"
/>
```

### Recording with Upload

```jsx
<AudioWaveformPlayer
  enableRecording={true}
  width={600}
  height={80}
  title="Record Your Answer"
  gradeId={gradeId}
  nodeKey={questionKey}
  metadata={{
    phrase: 'こんにちは',
    definition: 'Hello'
  }}
  onRecordingComplete={(file, uploadResult) => {
    console.log('Recording saved:', file);
    // Handle post-recording logic
  }}
/>
```

### Combined Playback and Recording

```jsx
// Can play existing audio OR record new audio
<AudioWaveformPlayer
  audioUrl={existingAudioUrl}
  waveformData={existingWaveformData}
  enableRecording={true}
  width={600}
  height={80}
  title="Pronunciation Practice"
  gradeId={gradeId}
  nodeKey="question-1"
/>
```

## Props

### New Recording Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableRecording` | boolean | `false` | Enable recording controls |
| `gradeId` | string | - | Grade ID for upload (required for upload) |
| `nodeKey` | string | - | Node key for upload (required for upload) |
| `metadata` | object | `{}` | Additional metadata for recording upload |
| `onRecordingComplete` | function | - | Callback when recording is complete |

### Existing Props (unchanged)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `audioUrl` | string | - | URL of audio file to play |
| `file` | object | - | File object with waveformData |
| `waveformData` | number[] | - | Pre-calculated waveform data |
| `width` | number | `600` | Waveform width |
| `height` | number | `80` | Waveform height |
| `title` | string | - | Optional title |
| `showDuration` | boolean | `true` | Show duration time |

## Recording Flow

1. **User clicks Record button** (microphone icon)
2. **Browser requests microphone permission**
3. **Recording starts** with real-time waveform visualization
4. **User clicks Stop button** (stop icon)
5. **Waveform data is calculated** (600 samples)
6. **If gradeId/nodeKey provided:**
   - Audio uploaded to S3 (private access)
   - File metadata saved to DataStore
   - `onRecordingComplete` callback fired
7. **Recorded audio can be played back** immediately

## Technical Details

### Real-time Waveform Visualization

During recording, the component uses Web Audio API to:
- Create an audio context from the media stream
- Analyze frequency data in real-time
- Render bars on a canvas element
- Update at 60fps using `requestAnimationFrame`

### Waveform Data Calculation

After recording stops:
```javascript
const waveform = await calculateWaveformData(blob, width);
// Returns: number[] of normalized amplitude values (0-1)
```

### Upload Process

```javascript
const uploadResult = await uploadStudentSubmission({
  file: blob,
  gradeId: gradeId,
  nodeKey: nodeKey,
  fileType: 'mp3',
  metadata: {
    waveformData: JSON.stringify(waveform),
    ...customMetadata
  }
});
```

### DataStore Save

```javascript
const newFile = await DataStore.save(new FileModel({
  path: uploadResult.path,
  identityId,
  name: uploadResult.filename,
  size: blob.size,
  mimeType: 'audio/mp3',
  level: 'PRIVATE',
  waveformData: JSON.stringify(waveform),
}));
```

## Migration from RecordingStudio2

If you're currently using `RecordingStudio2`, you can replace it with `AudioWaveformPlayer`:

### Before (RecordingStudio2)
```jsx
<RecordingStudio2
  word={word}
  item={item}
  qk={qk}
  setFeedback={setFeedback}
/>
```

### After (AudioWaveformPlayer)
```jsx
<AudioWaveformPlayer
  enableRecording={true}
  width={600}
  height={80}
  gradeId={gradeId}
  nodeKey={qk}
  metadata={{
    phrase: item?.phrase,
    definition: item?.definition,
  }}
  onRecordingComplete={(file) => {
    // Update feedback or UI as needed
  }}
/>
```

## Browser Compatibility

- Requires `navigator.mediaDevices.getUserMedia` for recording
- Requires Web Audio API for waveform visualization
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Microphone permission required from user

## Examples in Storybook

See the Storybook stories for live examples:
- `WithRecording` - Basic recording example
- `RecordingWithCallback` - Recording with callback handling
- `RecordingOnly` - Recording without upload

Run Storybook:
```bash
npm run storybook
```

Navigate to: **Components → AudioWaveformPlayer**

## Dependencies

The recording features use:
- `calculateWaveformData` from `src/utils/calculateWaveformData.js`
- `uploadStudentSubmission` from `src/utils/userSubmissionStorage.js`
- `hexToRgb` from `src/utils/hexToRgb.js`
- `FilesContext` for identity management
- Material-UI for icons and theming
