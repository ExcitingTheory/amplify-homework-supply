# Quick Start: Audio and Drawing Questions

This guide will help you quickly create questions that accept audio recordings and drawings as answers.

## TL;DR

Your system **already has** audio and drawing question types! They're fully functional and ready to use:

- ✅ Audio recording with waveform visualization
- ✅ Drawing interface using Excalidraw
- ✅ AI-powered verification for both types
- ✅ Multi-modal questions (text + audio + drawing)

**Recent fix (Dec 2024)**: RecordingStudio2 now properly generates and displays waveforms after recording.

## Creating Questions in the Editor

### Step 1: Insert a CustomAnswer Block

In the Editor3 interface:
1. Click the "+" button or use the insert menu
2. Select "Custom Answer" block
3. A new question block appears

### Step 2: Configure Input Methods

In the CustomAnswer editor:
1. Click "Edit" on the question block
2. Add your questions using the form
3. **Check the boxes** for allowed input methods:
   - ☐ Text (typing)
   - ☐ Audio (voice recording)  
   - ☐ Writing (drawing/sketching)

### Step 3: Set Prompt Method

Choose how to present the question:
- **Prompt Text**: Show question as text
- **Prompt Audio**: Play question as audio
- **Prompt Both**: Show text and play audio
- **Prompt Definition**: Show vocabulary definition

## Example Configurations

### Audio-Only Pronunciation Practice
```
Question: "Say 'Hello' in Japanese"
Answer: "こんにちは"
Allowed Input: ☑ Audio
Prompt Method: Prompt Text
```

Student will:
1. See the text prompt
2. Click record button
3. Speak into microphone
4. See live waveform while recording
5. Click stop when done
6. See static waveform preview
7. Click submit for AI verification

### Drawing-Only Visual Exercise
```
Question: "Draw a simple house"
Answer: "A house with a roof, walls, door, and windows"
Allowed Input: ☑ Writing
Prompt Method: Prompt Text
```

Student will:
1. See the text prompt
2. Hover over canvas to activate drawing
3. Use Excalidraw tools to draw
4. Move mouse away to save
5. See PNG preview
6. Submit for GPT-4 Vision verification

### Multi-Modal Flexible Question
```
Question: "Describe the water cycle"
Answer: "Water evaporates, forms clouds, precipitates as rain"
Allowed Input: ☑ Text ☑ Audio ☑ Writing
Prompt Method: Prompt Both
```

Student will:
1. See text and hear audio prompt
2. Choose input method (toggle buttons)
3. Answer using their preferred method
4. Submit for verification

## Student Interface

Students see:

1. **Question Prompt** - Text and/or audio
2. **Input Method Toggle** - Buttons to switch between text/audio/drawing
3. **Input Area** - Changes based on selected method:
   - Text: Textarea
   - Audio: Record button with waveform
   - Drawing: Hover-to-activate canvas
4. **Submit Button** - Sends answer for verification
5. **Feedback Section** - Shows AI validation results

## How It Works Behind the Scenes

### Audio Questions
- Browser MediaRecorder captures audio
- Live waveform via Web Audio API
- After recording: calculateWaveformData() generates 600 amplitude samples
- Audio uploads to S3 with waveform metadata
- Whisper API transcribes audio
- GPT validates transcription vs expected answer
- Student gets feedback

### Drawing Questions  
- Excalidraw provides drawing interface
- On mouse leave: export to Canvas → PNG
- Base64-encoded image sent to GPT-4 Vision
- AI analyzes drawing vs expected answer
- Student gets detailed feedback

## New Features Added (Dec 2024)

### 1. Fixed RecordingStudio2 Waveforms
**What changed**: RecordingStudio2 now properly calculates and displays waveforms after recording completes.

**Before**: Waveform data calculated but not displayed to user
**After**: Beautiful static waveform preview shows below recording controls

### 2. New AudioWaveformPlayer Component
**What it does**: Complete audio player with waveform visualization and playback controls

**Features**:
- Static waveform display
- Play/pause button
- Seekable progress bar
- Time display (current/total)
- Progress overlay on waveform

**Usage**:
```javascript
import AudioWaveformPlayer from './components/AudioWaveformPlayer';

<AudioWaveformPlayer
  waveformData={waveformArray}  // Pre-calculated waveform
  audioUrl={audioUrl}            // Audio file URL
  width={600}
  height={80}
  title="Student Recording"
/>
```

## Components You Can Use

### For Audio
- `RecordingStudio2` - Recording interface with waveforms
- `StaticWaveform` - Display waveform visualization
- `AudioWaveformPlayer` - NEW! Complete player with controls
- `calculateWaveformData` - Utility to generate waveform data

### For Drawing
- `SketchPad` - Excalidraw-based drawing interface

### For Questions
- `CustomAnswerNode` - Editor node type
- `CustomAnswerComponent` - Student-facing question renderer
- `CustomAnswerEditor` - Teacher-facing question creator
- `CustomAnswerPlugin` - Lexical plugin

## Testing Your Questions

### In Storybook
```bash
npm run storybook
```

Navigate to:
- "Components/CustomAnswer/Audio and Drawing" - See examples
- "Components/AudioWaveformPlayer" - See player examples

### In the App
1. Create a test unit
2. Add CustomAnswer questions with different input types
3. Preview as student
4. Test recording audio (check waveform appears)
5. Test drawing (check canvas activates on hover)
6. Submit and verify feedback appears

## Troubleshooting

### "Microphone permission denied"
- Browser blocked access
- Click lock icon in address bar → Allow microphone

### "Waveform not showing"
- Check browser console for errors
- Ensure HTTPS (required for getUserMedia)
- Verify browser supports Web Audio API

### "Drawing not saving"
- Ensure mouse fully leaves canvas area
- Check browser console for Excalidraw errors
- Verify Excalidraw loaded (no lazy load errors)

## API Verification

### Audio Verification Endpoint
```graphql
query verifyAudioUrl($audioUrl: String!, $expected: String!, $model: String!) {
  verifyAudioUrl(audioUrl: $audioUrl, expected: $expected, model: $model)
}
```

Returns:
```json
{
  "answer": true/false,
  "reason": "Explanation of why answer is correct/incorrect"
}
```

### Drawing Verification Endpoint
```graphql
query verifyImage($image: String!, $expected: String!, $model: String!) {
  verifyImage(image: $image, expected: $expected, model: $model)
}
```

Returns:
```json
{
  "answer": true/false,
  "reason": "Detailed analysis of the drawing"
}
```

## Database Schema

### Question Model
```javascript
{
  id: ID
  prompt: String           // Question text
  answer: String          // Expected answer
  audio: [String]         // Audio prompt files
  answerAudio: [String]   // Expected audio answers
  hint: String            // Optional hint
  // ... other fields
}
```

### File Model (for recordings)
```javascript
{
  id: ID
  path: String            // S3 path: "user-input-audio/gradeId_nodeKey_timestamp.mp3"
  mimeType: String        // "audio/mp3"
  size: Int               // File size in bytes
  waveformData: String    // JSON array of amplitude values
  level: PROTECTED        // Access level
  identityId: String      // User identity (required for accessing protected files)
  // ... other fields
}
```

### Grade Model (with file tracking)
```javascript
{
  id: ID
  owner: String           // Student username
  identityId: String      // User identity (required for accessing files in grade.files[])
  data: AWSJSON           // Question answers and state
  feedback: AWSJSON       // AI verification results
  files: [String]         // Array of S3 file paths (e.g., "user-input-audio/gradeId_nodeKey_timestamp.mp3")
  // ... other fields
}
```

## Further Reading

- [AUDIO_AND_DRAWING_QUESTIONS.md](./docs/AUDIO_AND_DRAWING_QUESTIONS.md) - Comprehensive guide
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Technical details
- [CustomAnswerPlugin.audio-drawing.stories.jsx](./src/components/Editor3/plugins/CustomAnswerPlugin.audio-drawing.stories.jsx) - Code examples

## Support

Questions? Check:
1. Browser console for error messages
2. Network tab for failed API calls
3. Storybook examples for working code
4. Documentation files for detailed explanations

## Summary

🎉 **You're all set!** 

Your system has fully functional audio and drawing question types. Just:
1. Create CustomAnswer questions in the editor
2. Check the boxes for audio/drawing input
3. Students can record or draw their answers
4. AI automatically verifies and provides feedback

The RecordingStudio2 waveform fix ensures beautiful visualization of all audio recordings!
