# Enhanced Generation and Recording Features

## Overview

This document describes the new enhanced features for content generation and audio recording in the application.

## New Components

### 1. UnifiedGenerateModal

A unified modal component that handles the entire generation workflow in one place:

**Location**: `src/components/Editor3/components/UnifiedGenerateModal.js`

**Features**:
- Single modal for generate form, preview, and cancel confirmation
- Seamless transition between input, generating, and preview modes
- Integrated cancel confirmation dialog
- Support for both image and audio generation
- Edit and regenerate capabilities from preview
- Clean, intuitive UX flow

**Usage**:
```javascript
import UnifiedGenerateModal from './components/Editor3/components/UnifiedGenerateModal';

<UnifiedGenerateModal
    open={modalOpen}
    onClose={handleClose}
    onGenerate={handleGenerate}
    onRegenerate={handleRegenerate}
    title="Generate Image"
    inputPlaceholder="Describe what you want to create..."
    type="image"
/>
```

**Props**:
- `open` (boolean): Whether modal is open
- `onClose` (function): Called when modal should close
- `onGenerate` (async function): Called to generate content, should return `{ preview: ReactNode, ...otherData }`
- `onRegenerate` (async function): Optional, called to regenerate with changes
- `title` (string): Modal title
- `inputPlaceholder` (string): Placeholder for input field
- `type` (string): 'image', 'audio', or 'video'
- `children` (ReactNode): Optional custom form inputs

**Workflow**:
1. **Input Mode**: User enters description/prompt
2. **Generating Mode**: Shows loading indicator while content generates
3. **Preview Mode**: Displays generated content with prompt shown and options to edit or regenerate
4. **Cancel Confirmation**: If user tries to close during preview, confirms before discarding

---

### 2. ImageMaskEditor

A powerful image editing component for selecting specific areas to regenerate.

**Location**: `src/components/Editor3/components/ImageMaskEditor.js`

**Features**:
- Paint mask over areas to regenerate
- Brush and eraser tools
- Adjustable brush size
- Undo/redo history
- Zoom in/out for precise editing
- Pan (hold Shift + drag)
- Returns mask data for API calls

**Usage**:
```javascript
import ImageMaskEditor from './components/Editor3/components/ImageMaskEditor';

<ImageMaskEditor
    imageUrl={generatedImageUrl}
    onMaskComplete={(maskData) => {
        // maskData contains { mask: dataURL, image: dataURL }
        regenerateWithMask(maskData);
    }}
    onCancel={() => setShowEditor(false)}
    width={800}
    height={600}
/>
```

**How It Works**:
1. User paints red semi-transparent mask over areas they want to change
2. Can use eraser to remove parts of mask
3. Zoom and pan to get precise selections
4. When complete, returns mask as PNG data URL
5. Mask can be sent to image generation API for targeted regeneration

**Controls**:
- Click and drag to paint mask
- Use eraser tool to remove mask
- Undo/Redo for mistakes
- Zoom buttons for detail work
- Hold Shift + drag to pan around image
- Clear button to start over

---

### 3. RecordingStudioEnhanced

A professional-grade recording studio with multi-track support and audio filtering.

**Location**: `src/components/RecordingStudioEnhanced.js`

**Features**:
- **Audio Filters Toolbar**:
  - Noise reduction (none/light/medium/heavy)
  - Speech enhancement (clarity/presence/broadcast)
  - Pop and click removal
  - High-pass filter (removes low frequencies)
  - Low-pass filter (removes high frequencies)
  - Audio normalization
  
- **Multi-Track Support**:
  - Create multiple audio tracks
  - Each track has its own voice selection (Whisper TTS)
  - Editable prompt per track for text-to-speech generation
  - Horizontal scrolling track viewer
  - Visual waveforms for each clip
  
- **Advanced Editing**:
  - Cut function for removing portions of audio
  - Selection tool for precise editing
  - Drag-and-drop timeline interface (planned)
  
- **Voice Options** (Whisper TTS):
  - Alloy
  - Echo
  - Fable
  - Onyx
  - Nova
  - Shimmer

**Usage**:
```javascript
import RecordingStudioEnhanced from './components/RecordingStudioEnhanced';

<RecordingStudioEnhanced
    gradeId="grade-123"
    nodeKey="audio-question-1"
    onRecordingComplete={(track) => {
        console.log('Recording complete:', track);
    }}
    metadata={{
        phrase: 'Example phrase',
        context: 'Language learning',
    }}
/>
```

**Track Structure**:
```javascript
{
    id: 1,
    name: 'Track 1',
    voice: 'alloy',
    prompt: 'Text to generate as speech',
    clips: [
        {
            id: 123,
            audioBlob: Blob,
            waveformData: [...],
            startTime: 0,
            duration: 5.2
        }
    ]
}
```

**Workflow**:
1. Select or create a track
2. Enter prompt and select voice for TTS generation, or
3. Click record to capture audio from microphone
4. Audio appears as clip in track viewer
5. Apply filters from toolbar
6. Use cut function to trim unwanted sections
7. Add more tracks for complex compositions
8. Export or save final result

---

### 4. EnhancedGenerators

Wrapper components that integrate UnifiedGenerateModal with specialized features.

**Location**: `src/components/Editor3/components/EnhancedGenerators.js`

**Components**:

#### EnhancedImageGenerator
- Uses UnifiedGenerateModal for image generation
- Adds "Edit with Mask" button in preview
- Launches ImageMaskEditor for targeted regeneration
- Supports full regeneration and masked regeneration

#### EnhancedAudioGenerator
- Uses UnifiedGenerateModal for audio generation
- Adds "Open in Recording Studio" button
- Switches to RecordingStudioEnhanced for advanced editing
- Displays audio player in preview

**Usage**:
```javascript
import { EnhancedImageGenerator, EnhancedAudioGenerator } from './components/Editor3/components/EnhancedGenerators';

// For images
<EnhancedImageGenerator
    open={imageModalOpen}
    onClose={() => setImageModalOpen(false)}
/>

// For audio
<EnhancedAudioGenerator
    open={audioModalOpen}
    onClose={() => setAudioModalOpen(false)}
    gradeId="grade-123"
    nodeKey="audio-exercise"
/>
```

---

## Integration with Existing Components

### FileManager Integration

Update FileManager to use the new enhanced generators:

```javascript
// In FileManager.js
import { EnhancedImageGenerator, EnhancedAudioGenerator } from './EnhancedGenerators';

// Replace old generation modals with:
{generator === 'image' && (
    <EnhancedImageGenerator
        open={newImageFileFormOpen}
        onClose={() => setNewImageFileFormOpen(false)}
    />
)}

{generator === 'audio' && (
    <EnhancedAudioGenerator
        open={newAudioFileFormOpen}
        onClose={() => setNewAudioFileFormOpen(false)}
        gradeId={gradeId}
        nodeKey={nodeKey}
    />
)}
```

### Tab/Modal Integration

For the tabs system mentioned in requirements:

```javascript
const [activeTab, setActiveTab] = useState('generate'); // 'generate', 'preview'
const [generatedContent, setGeneratedContent] = useState(null);

// The UnifiedGenerateModal handles this internally,
// but if you need custom tab behavior:

<Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
    <Tab label="Generate" value="generate" />
    <Tab label="Preview" value="preview" disabled={!generatedContent} />
</Tabs>

{activeTab === 'generate' && <GenerateForm />}
{activeTab === 'preview' && <PreviewPanel content={generatedContent} />}
```

---

## Audio Filtering Implementation

The RecordingStudioEnhanced includes placeholders for audio filtering. To implement actual filtering, use Web Audio API:

```javascript
// Example: Apply high-pass filter
const applyHighPassFilter = async (audioBlob, cutoffFrequency = 200) => {
    const audioContext = new AudioContext();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
    );
    
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    
    const filter = offlineContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = cutoffFrequency;
    
    source.connect(filter);
    filter.connect(offlineContext.destination);
    source.start();
    
    const renderedBuffer = await offlineContext.startRendering();
    
    // Convert back to blob
    return bufferToBlob(renderedBuffer);
};
```

---

## API Requirements

### Image Regeneration with Mask

To support masked regeneration, the GraphQL mutation needs to be extended:

```graphql
type Mutation {
    generateImageFile(
        phrase: String!
        model: String
        mask: String          # Base64 encoded PNG mask
        originalImage: String # Path to original image
    ): File @function(name: "openai-${env}")
}
```

Backend implementation would send mask to DALL-E 3 API's edit endpoint.

### Text-to-Speech with Voice Selection

Already supported in existing schema:

```graphql
type Mutation {
    generateAudioFile(
        phrase: String!
        voice: String!   # Whisper voice: alloy, echo, fable, onyx, nova, shimmer
        model: String!   # tts-1 or tts-1-hd
    ): File @function(name: "openai-${env}")
}
```

---

## File Structure

```
src/
├── components/
│   ├── RecordingStudioEnhanced.js          # Multi-track recording studio
│   └── Editor3/
│       └── components/
│           ├── UnifiedGenerateModal.js      # Unified generation workflow
│           ├── ImageMaskEditor.js           # Image mask painting tool
│           ├── EnhancedGenerators.js        # Wrapper components
│           ├── AudioWaveformPlayer.js       # Existing waveform player
│           └── StaticWaveform.js            # Existing static waveform
├── utils/
│   └── calculateWaveformData.js             # Existing waveform calculation
└── graphql/
    └── mutations.ts                         # GraphQL mutations
```

---

## Testing

### Manual Testing Checklist

**UnifiedGenerateModal**:
- [ ] Modal opens and closes properly
- [ ] Generate button disabled when input empty
- [ ] Loading state shows during generation
- [ ] Preview displays generated content
- [ ] Edit prompt button returns to input mode
- [ ] Regenerate button works
- [ ] Cancel confirmation appears when closing from preview
- [ ] Discard button actually discards
- [ ] Keep Editing returns to preview

**ImageMaskEditor**:
- [ ] Image loads correctly
- [ ] Brush paints red semi-transparent mask
- [ ] Eraser removes mask
- [ ] Brush size slider works
- [ ] Undo/redo functions correctly
- [ ] Zoom in/out works
- [ ] Pan with Shift+drag works
- [ ] Clear mask button works
- [ ] Apply returns correct mask data

**RecordingStudioEnhanced**:
- [ ] Can add new track
- [ ] Can delete track (except last one)
- [ ] Track name editable
- [ ] Voice selector works
- [ ] Prompt field works
- [ ] Record button starts recording
- [ ] Stop button stops and adds clip to track
- [ ] Waveforms display for clips
- [ ] Horizontal scrolling works
- [ ] Filter dropdowns update state
- [ ] Multiple tracks can coexist
- [ ] Selected track highlighted

---

## Future Enhancements

1. **Audio Filters**: Implement actual Web Audio API filtering
2. **Track Mixing**: Add volume controls and pan per track
3. **Export Options**: Export as WAV, MP3, dialogue format
4. **Drag-and-Drop**: Reorder clips within tracks
5. **Splice**: Join clips together
6. **Fade In/Out**: Add fade effects to clips
7. **Effects**: Reverb, echo, compression
8. **Collaboration**: Real-time multi-user editing
9. **Auto-save**: Periodic saving of work in progress
10. **Keyboard Shortcuts**: Power user features

---

## Support and Troubleshooting

### Common Issues

**Image mask not applying**:
- Ensure API supports mask parameter
- Check mask is valid PNG base64
- Verify image path is accessible

**Audio filters not working**:
- Filters are currently placeholders
- Need Web Audio API implementation
- See "Audio Filtering Implementation" section

**RecordingStudio performance**:
- Large waveform arrays can be slow
- Consider using Web Workers for processing
- Implement virtual scrolling for many clips

---

## License

All components follow the existing project license.
