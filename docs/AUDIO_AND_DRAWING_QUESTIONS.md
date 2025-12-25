# Audio and Drawing Question Types

This guide explains how to create custom questions that accept user drawings and audio recordings as answers.

## Overview

The CustomAnswer question type supports multiple input methods:
- **Text**: Traditional text input
- **Audio**: Voice recordings with automatic waveform generation
- **Writing**: Drawing/sketching interface using Excalidraw

## Storage Architecture

### File Storage

Student submissions are stored in a dedicated S3 structure with strict privacy controls:

**Storage Location:** `private/{identityId}/user-submissions/{gradeId}/{nodeKey}/{filename}`

**Example:** `private/us-east-1:abc-123/user-submissions/grade-abc/audio-q1/grade-abc_audio-q1_1734989234567.mp3`

**Key Benefits:**
- **Privacy:** Files are in student's private folder - other students cannot access
- **Cost Tracking:** Dedicated `user-submissions/` prefix enables cost analysis via AWS Cost Explorer
- **Organization:** Grouped by grade and question for easy retrieval
- **Access Control:** Teachers use special GraphQL endpoint to access with proper authorization

### Access Control

| Role | Access Method | Authorization |
|------|--------------|---------------|
| **Student** | Direct S3 (`accessLevel: 'private'`) | Owner only |
| **Teacher** | GraphQL `getStudentSubmissionUrl` | Must be assigned instructor on grade |
| **Admin** | GraphQL `getStudentSubmissionUrl` | Full access |

See [USER_SUBMISSION_STORAGE.md](./USER_SUBMISSION_STORAGE.md) for complete details.

## Audio Questions

Audio questions allow students to record their voice as an answer. The system automatically:
- Records audio using the browser's MediaRecorder API
- Generates waveform visualization data
- Stores the audio in S3 with proper waveform metadata
- Validates the response against expected answers using AI

### Creating an Audio Question

When creating a CustomAnswer question, set the `allowedInput` to include `'audio'`:

```javascript
const questionNode = $createCustomAnswerNode(
  [questionId],
  ['audio'], // allowedInput
  ['prompt-audio'] // promptMethod (optional)
);
```

### How Audio Recording Works

1. **Recording**: Student clicks the microphone icon to start recording
2. **Live Waveform**: A live frequency visualization displays while recording
3. **Stop Recording**: Student clicks stop icon to finish
4. **Waveform Generation**: System calculates waveform data (600 samples) from the audio blob
5. **Upload**: Audio file is uploaded to S3 with waveform metadata stored in the File model
6. **Verification**: Audio is transcribed and verified against the expected answer

### Components Used

- **RecordingStudio2**: Main recording interface component
  - Located at: `src/components/RecordingStudio2.js`
  - Features: Record, play, stop controls with live waveform visualization
  - Now includes: Static waveform display after recording completes

- **StaticWaveform**: Displays static waveform from audio data
  - Located at: `src/components/Editor3/components/StaticWaveform.js`
  - Can use pre-calculated waveform data or calculate from audio file
  - Customizable width, height, and colors

- **calculateWaveformData**: Utility function for waveform generation
  - Located at: `src/utils/calculateWaveformData.js`
  - Returns normalized amplitude data (0-1 range)
  - Default: 600 samples for smooth visualization

### Recent Fixes (Dec 2024)

The RecordingStudio2 component has been updated to properly calculate and display waveforms:
- Waveform data is now calculated immediately after recording stops
- Static waveform preview is displayed below the recording controls
- Waveform data is stored in the File model's `waveformData` field for future retrieval

## Drawing Questions

Drawing questions allow students to sketch or draw their answers using a full-featured drawing interface.

### Creating a Drawing Question

Set the `allowedInput` to include `'writing'`:

```javascript
const questionNode = $createCustomAnswerNode(
  [questionId],
  ['writing'], // allowedInput
  ['prompt-text'] // promptMethod
);
```

### How Drawing Works

1. **Hover to Draw**: Student hovers over the canvas area to activate Excalidraw
2. **Create Drawing**: Full drawing tools available (pen, shapes, text, etc.)
3. **Auto-Save**: Drawing is converted to PNG on mouse leave
4. **AI Verification**: Image is sent to GPT-4 Vision for verification against expected answer
5. **Feedback**: Student receives feedback on their drawing

### Components Used

- **SketchPad**: Interactive drawing interface
  - Located at: `src/components/Editor3/components/SketchPad.js`
  - Powered by Excalidraw
  - Converts drawings to PNG for submission
  - Supports versioning and persistence

### Drawing Verification

The system uses GPT-4 Vision to analyze submitted drawings:
- Compares drawing content against expected answer
- Provides detailed feedback on accuracy
- Returns JSON with `answer` (boolean) and `reason` fields

## Combined Question Types

You can create questions that accept multiple input types:

```javascript
const questionNode = $createCustomAnswerNode(
  [questionId],
  ['text', 'audio', 'writing'], // All input types allowed
  ['prompt-audio'] // How to present the prompt
);
```

Students can then toggle between input methods using the toggle buttons in the interface.

## Question Model Fields

The Question model in the database includes:
- `answer`: Expected text answer
- `answerAudio`: Array of audio file paths for expected audio answer
- `prompt`: Question text
- `audio`: Array of audio file paths for question prompt
- `hint`: Optional hint text

## File Storage

### Audio Files
- Stored in S3 under: `user-input-audio/{gradeId}_{nodeKey}_{timestamp}.mp3`
- Filename includes gradeId and nodeKey for easy association with specific questions
- File path stored in `grade.files[]` array for tracking
- File model includes:
  - `path`: S3 path to the audio file
  - `identityId`: User's identity ID (required for accessing protected files)
  - `waveformData`: JSON stringified array of normalized amplitude values
  - `mimeType`: 'audio/mp3'
  - `level`: 'PROTECTED'
  - `size`: File size in bytes

### Drawing Files
- Converted to base64-encoded PNG
- Stored with Excalidraw JSON data for editing
- Submitted to AI for verification

## Example Usage in Editor

When editing a unit in the Editor3 component:

1. Insert a CustomAnswer block
2. Click to edit and add questions
3. For each question, configure:
   - Prompt text
   - Expected answer
   - Allowed input methods (checkboxes for text/audio/writing)
   - Prompt method (how to present the question)

## Prompt Methods

Available prompt methods:
- `prompt-text`: Display prompt as text
- `prompt-audio`: Play prompt as audio
- `prompt-both`: Show text and play audio
- `prompt-definition`: Show definition (for vocabulary)

## Student Experience

1. **View Question**: Student sees the question prompt
2. **Select Input Method**: Toggle between available methods (text/audio/drawing)
3. **Provide Answer**: 
   - Text: Type in textarea
   - Audio: Click record, speak, click stop
   - Drawing: Hover to draw, leave to save
4. **Submit**: Click submit button
5. **Receive Feedback**: AI validates and provides detailed feedback

## Technical Details

### Audio Processing Pipeline
```
User clicks record
  → MediaRecorder starts
  → Live waveform displayed via Web Audio API
  → User clicks stop
  → Audio chunks combined into Blob
  → calculateWaveformData() generates amplitude array
  → Filename created: gradeId_nodeKey_timestamp.mp3
  → Upload to S3 with waveform metadata
  → File saved to DataStore with identityId
  → File path added to grade.files[] array
  → Audio transcribed via Whisper API
  → Response validated via GPT-3.5/4
  → Feedback returned to student
```

### Drawing Processing Pipeline
```
User hovers on canvas
  → Excalidraw activates
  → User creates drawing
  → User moves mouse away
  → Drawing exported to Canvas
  → Canvas converted to PNG/base64
  → Image sent to GPT-4 Vision
  → AI analyzes drawing vs expected answer
  → Feedback returned to student
```

## Troubleshooting

### Waveform Not Displaying
- Ensure browser supports Web Audio API
- Check that calculateWaveformData is imported
- Verify waveformData state is being set after recording

### Audio Not Recording
- Check browser permissions for microphone access
- Ensure HTTPS (required for getUserMedia)
- Verify MediaRecorder API support

### Drawing Not Saving
- Ensure Excalidraw is loaded (check for lazy loading errors)
- Verify canvas export is working
- Check console for image conversion errors

## Future Enhancements

Potential improvements:
- Support for multiple audio attempts
- Playback speed control for audio review
- Drawing collaboration features
- More detailed AI feedback with scoring
- Support for video responses
- Waveform editing capabilities
