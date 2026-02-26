# Workbook Collaboration Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         WORKBOOK COLLABORATION SYSTEM                             │
│                       Real-time Student-Tutor Interaction                         │
└─────────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────┐
│ CLIENT LAYER                                                                    │
├─────────────────────────────────┬───────────────────────────────────────────────┤
│                                 │                                               │
│  STUDENT VIEW                   │  TUTOR VIEW                                   │
│  ┌─────────────────────────┐   │   ┌─────────────────────────┐                 │
│  │ CollaborativeWorkbook   │   │   │ TutorWorkbookView       │                 │
│  │ Component               │   │   │ Component               │                 │
│  │                         │   │   │                         │                 │
│  │ • Progress tracking     │   │   │ • Student monitoring    │                 │
│  │ • Answer blocks         │   │   │ • Feedback provision    │                 │
│  │ • Tutor notifications   │   │   │ • Live presence         │                 │
│  └────────┬────────────────┘   │   └────────┬────────────────┘                 │
│           │                     │            │                                  │
│           ▼                     │            ▼                                  │
│  ┌─────────────────────────┐   │   ┌─────────────────────────┐                 │
│  │ useWorkbookCollaboration│   │   │ useWorkbookCollaboration│                 │
│  │ React Hook              │   │   │ React Hook              │                 │
│  │                         │   │   │                         │                 │
│  │ ┌─────────────────────┐ │   │   │ ┌─────────────────────┐ │                 │
│  │ │ useWorkbookBlock    │ │   │   │ │ useTutorPresence    │ │                 │
│  │ │ useWorkbookStats    │ │   │   │ │ useWorkbookFeedback │ │                 │
│  │ └─────────────────────┘ │   │   │ └─────────────────────┘ │                 │
│  └────────┬────────────────┘   │   └────────┬────────────────┘                 │
│           │                     │            │                                  │
└───────────┼─────────────────────┴────────────┼──────────────────────────────────┘
            │                                  │
            └──────────────┬───────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PROVIDER LAYER                                                                   │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                    WorkbookCollaborationProvider                                 │
│     ┌───────────────────────────────────────────────────────────────┐           │
│     │                                                                 │           │
│     │  Room: workbook-grade-{gradeId}                                │           │
│     │                                                                 │           │
│     │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐          │           │
│     │  │ Y.Map       │  │ Y.Map       │  │ Y.Map        │          │           │
│     │  │ workbookData│  │ feedback    │  │ metadata     │          │           │
│     │  ├─────────────┤  ├─────────────┤  ├──────────────┤          │           │
│     │  │ block-1: {} │  │ block-1: {} │  │ startTime    │          │           │
│     │  │ block-2: {} │  │ block-3: {} │  │ pauseCount   │          │           │
│     │  │ block-3: {} │  │             │  │ totalTime    │          │           │
│     │  └─────────────┘  └─────────────┘  └──────────────┘          │           │
│     │                                                                 │           │
│     │  ┌─────────────────────────────────────────────────┐          │           │
│     │  │ Awareness (Presence Tracking)                    │          │           │
│     │  ├──────────────────────────────────────────────────┤          │           │
│     │  │ Student: { cursor: block-2, color: #3b82f6 }    │          │           │
│     │  │ Tutor:   { cursor: block-1, color: #f59e0b }    │          │           │
│     │  └─────────────────────────────────────────────────┘          │           │
│     │                                                                 │           │
│     │  Methods:                                                       │           │
│     │  • updateBlock(id, data)                                       │           │
│     │  • setFeedback(id, feedback)                                   │           │
│     │  • getActiveTutors()                                           │           │
│     │  • exportToGradeData()                                         │           │
│     └────────┬────────────────────────────┬─────────────────────────┘           │
│              │                            │                                      │
│              ▼                            ▼                                      │
│     ┌────────────────┐          ┌─────────────────┐                             │
│     │ IndexedDB      │          │ WebSocket       │                             │
│     │ Persistence    │          │ Provider        │                             │
│     │                │          │                 │                             │
│     │ • Offline data │          │ • Real-time sync│                             │
│     │ • Auto-cleanup │          │ • Delta updates │                             │
│     └────────────────┘          └────────┬────────┘                             │
│                                          │                                      │
└──────────────────────────────────────────┼──────────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ NETWORK LAYER (WebSocket)                                                       │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                        YJS WebSocket Server                                      │
│     ┌─────────────────────────────────────────────────────────┐                │
│     │                                                           │                │
│     │  Room Manager                                            │                │
│     │  ┌──────────────────────────────────────────────────┐   │                │
│     │  │ workbook-grade-123:                              │   │                │
│     │  │   - Student (client-abc)                         │   │                │
│     │  │   - Tutor 1 (client-def)                         │   │                │
│     │  │   - Tutor 2 (client-ghi)                         │   │                │
│     │  └──────────────────────────────────────────────────┘   │                │
│     │                                                           │                │
│     │  Update Broadcasting:                                    │                │
│     │  1. Receive Y.update from client                         │                │
│     │  2. Apply to room's Y.Doc                                │                │
│     │  3. Broadcast to other clients in room                   │                │
│     │  4. Debounced save to DynamoDB                           │                │
│     │                                                           │                │
│     └───────────────────────┬───────────────────────────────────┘                │
│                             │                                                    │
└─────────────────────────────┼──────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PERSISTENCE LAYER                                                                │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────┐         ┌─────────────────────────────┐        │
│  │ DynamoDB                   │         │ Amplify DataStore (Gen 2)   │        │
│  │                            │         │                             │        │
│  │ YjsDocuments Table         │         │ Grade Model                 │        │
│  ├────────────────────────────┤         ├─────────────────────────────┤        │
│  │ PK: workbook-grade-123     │◄────────┤ id: grade-123               │        │
│  │ state: <binary>            │  Syncs  │ data: <JSON>                │        │
│  │ version: 42                │◄────────┤ feedback: <JSON>            │        │
│  │ updatedAt: timestamp       │  Every  │ percentComplete: 67         │        │
│  │                            │  3 sec  │ accuracy: 85                │        │
│  └────────────────────────────┘         │ complete: false             │        │
│                                         └─────────────────────────────┘        │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│ DATA FLOW: STUDENT ANSWERS QUESTION                                             │
└─────────────────────────────────────────────────────────────────────────────────┘

Student clicks answer → updateBlock('block-1', { userAnswer: 2 })
                             │
                             ▼
                     Y.Map.set('block-1', data)
                             │
                   ┌─────────┴─────────┐
                   │                   │
                   ▼                   ▼
           IndexedDB saved    WebSocket sends delta
           (instant)          (~200 bytes)
                                       │
                                       ▼
                              Server broadcasts
                                       │
                        ┌──────────────┴──────────────┐
                        ▼                             ▼
                   Tutor 1 receives             Tutor 2 receives
                   (50-150ms)                   (50-150ms)
                        │                             │
                        └──────────────┬──────────────┘
                                       │
                                       ▼
                           After 3 seconds (debounced)
                                       │
                                       ▼
                           onSyncToGrade callback
                                       │
                                       ▼
                           DataStore.save(Grade.copyOf(...))
                                       │
                                       ▼
                              DynamoDB updated


┌─────────────────────────────────────────────────────────────────────────────────┐
│ OFFLINE SCENARIO                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

1. Student goes offline
   └─> WebSocket disconnects
   └─> UI shows "Offline" indicator
   └─> All edits continue locally

2. Student edits blocks
   └─> Y.Map updates normally
   └─> IndexedDB persists changes
   └─> Queue builds up Y.updates

3. Student reconnects
   └─> WebSocket reconnects
   └─> Queued updates sent as batch
   └─> CRDT merges with server state
   └─> UI shows "Syncing..." then "Connected"
   └─> onSyncToGrade called with merged state


┌─────────────────────────────────────────────────────────────────────────────────┐
│ CONFLICT RESOLUTION (CRDT)                                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

Scenario: Student and Tutor edit simultaneously

Student (offline):               Tutor (online):
block-1: { userAnswer: 2 }       block-2: { feedback: "Good!" }
block-3: { userAnswer: 4 }       block-3: { feedback: "Try again" }

Student reconnects:
  1. Student sends updates: [block-1 change, block-3 answer]
  2. Tutor sends updates:   [block-2 change, block-3 feedback]
  3. YJS CRDT merges:
     
     Result:
     - block-1: { userAnswer: 2 } ✓ Student only
     - block-2: { feedback: "Good!" } ✓ Tutor only
     - block-3: { 
         userAnswer: 4,           ✓ Student's answer
         feedback: "Try again"    ✓ Tutor's feedback
       } ✓ Automatically merged!

  4. Both clients converge to same state
  5. No conflicts, no data loss
```
