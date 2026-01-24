**JSON Structure (Master File):**
```json
{
  "metadata": {
    "title": "Coffee Shop Conversation",
    "scene": "INT. COFFEE SHOP - MORNING",
    "date": "2026-01-03",
    "version": "1.0"
  },
  "speakers": {
    "alice": {
      "name": "Alice",
      "voice": "alloy",
      "description": "30s, energetic, professional"
    },
    "bob": {
      "name": "Bob",
      "voice": "echo",
      "description": "40s, laid-back, friendly"
    }
  },
  "dialogue": [
    {
      "id": 1,
      "speaker": "alice",
      "text": "Hello, how are you doing today?",
      "timing": {"start": 0.0, "end": 3.5},
      "direction": "entering, slightly out of breath",
      "emotion": "cheerful"
    },
    {
      "id": 2,
      "speaker": "bob",
      "text": "I'm doing well, thanks for asking.",
      "timing": {"start": 3.5, "end": 6.2},
      "direction": "looks up from newspaper",
      "emotion": "warm"
    },
    {
      "id": 3,
      "speaker": "bob",
      "text": "What brings you here?",
      "timing": {"start": 7.0, "end": 8.5},
      "direction": "pauses, sets down newspaper",
      "emotion": "curious"
    },
    {
      "id": 4,
      "speaker": "alice",
      "text": "Just needed a break from work.",
      "timing": {"start": 9.0, "end": 12.0},
      "direction": "sighs, pulls out chair",
      "emotion": "tired but relieved"
    }
  ]
}
```

**Generated Human Script:**
```
COFFEE SHOP CONVERSATION
Draft 1.0 | 2026-01-03

========================================

CHARACTERS:
  ALICE - 30s, energetic, professional
  BOB - 40s, laid-back, friendly

========================================

INT. COFFEE SHOP - MORNING

ALICE enters, slightly out of breath. She's 
cheerful despite being rushed.

                    ALICE
          Hello, how are you doing today?

BOB looks up from his newspaper, warm and welcoming.

                    BOB
          I'm doing well, thanks for asking.

He pauses, sets down his newspaper. There's genuine 
curiosity in his tone.

                    BOB (CONT'D)
          What brings you here?

ALICE sighs and pulls out a chair. She seems tired 
but relieved to be here.

                    ALICE
          Just needed a break from work.

========================================
```

**Key benefits:**
- JSON stores everything: timing for TTS, voice models, emotions for future AI training
- Script is clean and actor-friendly with standard formatting
- Director notes are prose in the script but structured data in JSON
- You can auto-generate the script from JSON with a simple converter
- Easy to version control both formats

Would you like me to create a Python script that converts between these formats, or help you set up a template for your specific use case?



Here's an ASCII art plan for a track editor that handles both actor recordings and generative TTS:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ DIALOGUE TRACK EDITOR                                    [Import JSON] [Export] │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ Scene: INT. COFFEE SHOP - MORNING                          Timeline: 0:00-1:30 │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│ SCRIPT PANEL                          │  PROPERTIES PANEL                       │
│ ┌───────────────────────────────────┐ │ ┌─────────────────────────────────────┐ │
│ │ 1. ALICE (entering, out of breath)│ │ │ Line #1 - ALICE                     │ │
│ │    "Hello, how are you doing      │ │ │                                     │ │
│ │     today?"                       │◄┼─┤ ○ Human Recording                   │ │
│ │    [0:00 - 0:03] ✓                │ │ │ ○ TTS Generated (alloy)             │ │
│ │                                   │ │ │                                     │ │
│ │ 2. BOB (looks up from newspaper)  │ │ │ Direction: entering, out of breath  │ │
│ │    "I'm doing well, thanks for    │ │ │ Emotion: cheerful                   │ │
│ │     asking."                      │ │ │                                     │ │
│ │    [0:03 - 0:06] ✓                │ │ │ [Record] [Generate] [Preview]       │ │
│ │                                   │ │ │                                     │ │
│ │ 3. BOB (pauses, sets down paper)  │ │ │ Takes:                              │ │
│ │    "What brings you here?"        │ │ │ ├─ Take 1 ⭐ (human) 0:03 [Play]    │ │
│ │    [0:07 - 0:08] ⚠                │ │ │ ├─ Take 2 (TTS) 0:03 [Play]         │ │
│ │                                   │ │ │ └─ Take 3 (human) 0:04 [Play]       │ │
│ └───────────────────────────────────┘ │ └─────────────────────────────────────┘ │
├───────────────────────────────────────┴─────────────────────────────────────────┤
│ TIMELINE / WAVEFORM VIEW                                                        │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Time:  0:00      0:03      0:06      0:09      0:12      0:15      0:18     │ │
│ │ ├────────┼────────┼────────┼────────┼────────┼────────┼────────┼──────────  │ │
│ │ ALICE  ▓▓▓▓▓░░                                 ▓▓▓▓▓▓▓░░                    │ │
│ │ [Track]███████                                 ███████████                   │ │
│ │        │ Take 1 (human) ⭐             │                                     │ │
│ │        └─[0:00────────0:03]────────────┘                                     │ │
│ │                                                                               │ │
│ │ BOB           ▓▓▓▓░░      ▓▓░░                                               │ │
│ │ [Track]       ████████    ████                                               │ │
│ │               │ Take 1│   │Take 2 (TTS)                                      │ │
│ │               └[0:03──0:06]─[0:07─0:08]                                      │ │
│ │                     ▲                                                         │ │
│ │                  Playhead (0:04.5)                                            │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│ [◄◄] [▶/❚❚] [■] [►►]     Volume: ▓▓▓▓▓▓▓▓░░░ 80%        [Solo] [Mute]        │
├─────────────────────────────────────────────────────────────────────────────────┤
│ RECORDING CONTROLS                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Input: [Microphone ▼]  Level: ▓▓▓▓▓▓░░░░  [●REC] [Pre-roll: 2s]           │ │
│ │ Mode:  ○ Punch-in  ●Overdub  ○Replace     [✓] Auto-advance to next line    │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────┤
│ TTS GENERATION                                                                  │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Voice Model: [alloy ▼]  Speed: [1.0x]  Pitch: [0]                          │ │
│ │ [Generate Selected] [Generate All Missing] [Batch Process]                  │ │
│ │ Queue: 3 lines pending | Cost estimate: $0.15                               │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘

STATUS: Ready | Lines: 4 | Completed: 2/4 | Draft: Take 1 (ALICE-1, BOB-2)
```

**COMPONENT ARCHITECTURE:**

```
┌─────────────────────────────────────────┐
│     APPLICATION CONTROLLER              │
│  - JSON Data Manager                    │
│  - State Management                     │
│  - Export/Import Handler                │
└──────────┬──────────────────────────────┘
           │
    ┏━━━━━━┻━━━━━━━┓
    ┃              ┃
┌───▼────┐    ┌────▼────┐
│ SCRIPT │    │ AUDIO   │
│ ENGINE │    │ ENGINE  │
└───┬────┘    └────┬────┘
    │              │
    │         ┌────▼────────────────┐
    │         │ AUDIO SOURCES       │
    │         ├─────────────────────┤
    │         │ - Microphone Input  │
    │         │ - TTS Generator     │
    │         │ - File Importer     │
    │         │ - Audio Processor   │
    │         └─────────────────────┘
    │
┌───▼──────────────────────────────┐
│ UI COMPONENTS                    │
├──────────────────────────────────┤
│ 1. Script Panel                  │
│    - Line selector               │
│    - Direction display           │
│    - Timing indicators           │
│    - Completion status           │
│                                  │
│ 2. Properties Panel              │
│    - Speaker metadata            │
│    - Recording/TTS toggle        │
│    - Take manager                │
│    - Direction/emotion editor    │
│                                  │
│ 3. Timeline/Waveform             │
│    - Multi-track display         │
│    - Waveform visualization      │
│    - Playhead/scrubber           │
│    - Time ruler                  │
│    - Clip manipulation           │
│                                  │
│ 4. Transport Controls            │
│    - Play/Pause/Stop             │
│    - Record trigger              │
│    - Loop/pre-roll               │
│                                  │
│ 5. Recording Panel               │
│    - Input selection             │
│    - Level meters                │
│    - Recording modes             │
│                                  │
│ 6. TTS Panel                     │
│    - Voice selection             │
│    - Generation queue            │
│    - Batch processing            │
└──────────────────────────────────┘
```

**DATA FLOW:**

```
JSON Script
    │
    ├──> SCRIPT ENGINE ──────> Script Panel (display lines)
    │                          │
    │                          └──> User selects line
    │                                       │
    │                          ┌────────────┴────────────┐
    │                          │                         │
    │                    RECORD MODE              GENERATE MODE
    │                          │                         │
    │                    Mic Input ──┐            TTS API Call
    │                          │     │                   │
    │                    Audio Buffer│            Audio Buffer
    │                          │     │                   │
    │                          └─────┴───────────────────┘
    │                                       │
    └──> AUDIO ENGINE <────────────────────┘
            │
            ├──> Waveform Renderer ──> Timeline Display
            │
            ├──> Playback System ──> Speaker Output
            │
            └──> Take Manager ──> JSON Update (new takes)
                                        │
                                        └──> Save to file
```

**KEY FEATURES:**

1. **Multiple Takes**: Each line can have multiple recordings (human or TTS)
2. **Visual Feedback**: Waveforms show actual audio, completion indicators
3. **Flexible Workflow**: Can record actors first, fill gaps with TTS, or vice versa
4. **Non-destructive**: All takes preserved, starred take is active
5. **Batch Operations**: Generate TTS for all incomplete lines at once
6. **Real-time Preview**: Play any take instantly
7. **Timeline Sync**: Visual representation matches JSON timing data

Would you like me to create a working prototype of this editor as an interactive web application?AW
