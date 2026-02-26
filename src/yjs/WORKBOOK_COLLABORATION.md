# Workbook Collaboration Feature

Real-time collaborative editing for student workbooks with tutor support using YJS.

## Overview

The Workbook Collaboration feature enables:

- **Real-time collaboration** between students and tutors on workbook assignments
- **Per-student workbook rooms** using Grade ID as the unique identifier
- **Tutor presence indicators** showing when tutors are viewing/helping
- **Live feedback** from tutors appearing instantly in student workbooks
- **Automatic syncing** to Grade.data field with debouncing
- **Offline persistence** via IndexedDB
- **CRDT conflict resolution** for simultaneous edits

## Architecture

### Key Components

1. **WorkbookCollaborationProvider** - Specialized YJS provider for Grade-based collaboration
2. **Workbook Hooks** - React hooks for managing collaborative state
3. **SyncAdapter** - Syncs YJS state to/from Grade.data
4. **WebSocket Server** - Handles real-time updates (existing YJS infrastructure)

### Data Flow

```
Student edits workbook
    ↓
Y.Doc updated (local)
    ↓
IndexedDB persisted (instant, offline-first)
    ↓
Y.update sent via WebSocket → Server → Tutor's client
    ↓
Debounced sync to Grade.data (3 seconds)
    ↓
DataStore.save() updates Grade record
```

### Room Structure

Each Grade creates its own collaborative room:
- **Room name**: `workbook-{gradeId}`
- **Participants**: Student (owner) + Tutors/Instructors
- **Persistence**: IndexedDB (client) + DynamoDB (server)

## Usage

### Basic Setup

```typescript
import { useWorkbookCollaboration } from '@/yjs'

function StudentWorkbook({ grade, currentUser }) {
  const {
    workbookData,
    updateBlock,
    activeTutors,
    isSynced,
  } = useWorkbookCollaboration({
    gradeId: grade.id,
    user: {
      username: currentUser.username,
      role: 'student',
      displayName: currentUser.name,
      color: '#3b82f6'
    },
    initialData: grade.data, // Load existing Grade.data
    onTutorJoin: (tutor) => {
      toast.info(`${tutor.displayName} joined to help!`)
    },
    onSyncToGrade: async (data, feedback) => {
      // Sync to DataStore
      await DataStore.save(
        Grade.copyOf(grade, updated => {
          updated.data = data
          updated.feedback = JSON.stringify(feedback)
          updated.percentComplete = calculateCompletion(data)
          updated.accuracy = calculateAccuracy(data)
        })
      )
    }
  })

  return (
    <div>
      {activeTutors.length > 0 && (
        <Alert severity="info">
          {activeTutors.map(t => t.displayName).join(', ')} is helping you
        </Alert>
      )}
      
      <WorkbookEditor
        data={workbookData}
        onBlockChange={updateBlock}
      />
      
      <ConnectionIndicator synced={isSynced} />
    </div>
  )
}
```

### Tutor View

```typescript
function TutorWorkbookView({ gradeId, student, tutor }) {
  const {
    workbookData,
    setFeedback,
    connectedUsers,
  } = useWorkbookCollaboration({
    gradeId,
    user: {
      username: tutor.username,
      role: 'tutor',
      displayName: tutor.name,
      color: '#f59e0b'
    },
    onSyncToGrade: async (data, feedback) => {
      // Tutors also sync their feedback
      await DataStore.save(
        Grade.copyOf(grade, updated => {
          updated.feedback = JSON.stringify(feedback)
        })
      )
    }
  })

  const provideFeedback = (blockId: string, text: string) => {
    setFeedback(blockId, {
      text,
      type: 'tutor-comment',
      helpful: true
    })
  }

  return (
    <div>
      <TutorHeader student={student} />
      
      <WorkbookViewer
        data={workbookData}
        readOnly={false}
        onAddFeedback={provideFeedback}
      />
      
      <OnlineIndicator users={connectedUsers} />
    </div>
  )
}
```

### Block-Level Collaboration

```typescript
function QuizBlock({ blockId, provider, question }) {
  const {
    blockData,
    updateData,
    isComplete
  } = useWorkbookBlock(provider, blockId)

  const handleAnswer = (answer: number) => {
    const isCorrect = answer === question.correctAnswer
    
    updateData({
      userAnswer: answer,
      complete: true,
      accuracy: isCorrect ? 100 : 0,
      attempts: (blockData?.attempts || 0) + 1,
      timestamp: new Date().toISOString()
    })
  }

  return (
    <Card>
      <QuizQuestion
        question={question}
        selectedAnswer={blockData?.userAnswer}
        onSelectAnswer={handleAnswer}
        disabled={isComplete}
      />
      
      {isComplete && (
        <ResultBadge 
          correct={blockData?.accuracy === 100}
          attempts={blockData?.attempts}
        />
      )}
    </Card>
  )
}
```

### Tutor Presence Indicators

```typescript
function BlockWithCursors({ blockId, provider, children }) {
  const tutorsOnBlock = useTutorPresence(provider, blockId)

  return (
    <div style={{ position: 'relative' }}>
      {children}
      
      {tutorsOnBlock.map(tutor => (
        <TutorCursor
          key={tutor.clientId}
          name={tutor.displayName || tutor.username}
          color={tutor.color || '#666'}
          position={tutor.cursor?.position}
        />
      ))}
    </div>
  )
}
```

### Real-Time Feedback

```typescript
function WorkbookWithFeedbackNotifications({ provider }) {
  useWorkbookFeedback(provider, (blockId, feedback) => {
    // Show notification when tutor adds feedback
    toast.success(
      `New feedback from ${feedback.author}: "${feedback.text}"`,
      {
        action: {
          label: 'View',
          onClick: () => scrollToBlock(blockId)
        }
      }
    )
  })

  return <Workbook />
}
```

### Workbook Statistics

```typescript
function ProgressBar({ provider }) {
  const {
    completion,
    accuracy,
    totalBlocks,
    completedBlocks
  } = useWorkbookStats(provider)

  return (
    <Card>
      <Typography variant="h6">Your Progress</Typography>
      
      <LinearProgress
        variant="determinate"
        value={completion}
      />
      <Typography>
        {completedBlocks} / {totalBlocks} complete ({completion}%)
      </Typography>
      
      <Chip
        label={`${accuracy}% accuracy`}
        color={accuracy >= 80 ? 'success' : 'warning'}
      />
    </Card>
  )
}
```

## Authorization

The system uses role-based permissions:

### Student (owner)
- Full edit access to their own workbook
- Can see tutor cursors and feedback
- Cannot edit other students' workbooks

### Tutor
- Read access to student workbooks
- Can provide feedback
- Can annotate blocks
- Cursor/presence tracked for student awareness

### Instructor
- Same as Tutor
- Plus: Can assign tutors
- Can view all section workbooks

### Admin
- Full access to all workbooks
- Can impersonate any role for testing

### Implementation

```typescript
// In WorkbookCollaborationProvider
canEdit(): boolean {
  // Students can edit their own workbook
  if (this.user.role === 'student') return true
  
  // Tutors/instructors can edit (for annotations)
  if (['tutor', 'instructor', 'admin'].includes(this.user.role)) {
    return true
  }
  
  return false
}

canProvideFeedback(): boolean {
  return ['tutor', 'instructor', 'admin'].includes(this.user.role)
}
```

## Data Structures

### WorkbookBlockData

```typescript
{
  "quiz-block-1": {
    complete: true,
    accuracy: 100,
    userAnswer: 2,
    timestamp: "2026-02-16T10:30:00Z",
    attempts: 1
  },
  "answer-block-2": {
    complete: true,
    accuracy: 85,
    userAnswer: "こんにちは",
    feedback: "Good answer! Watch your particle usage.",
    timestamp: "2026-02-16T10:32:00Z",
    attempts: 2
  },
  "custom-answer-block-3": {
    complete: false,
    userAnswer: null,
    timestamp: null,
    attempts: 0
  }
}
```

### Feedback Structure

```typescript
{
  "quiz-block-1": {
    text: "Great work! Consider reviewing this concept.",
    type: "tutor-comment",
    author: "tutor@example.com",
    authorRole: "tutor",
    timestamp: "2026-02-16T10:35:00Z",
    helpful: true
  }
}
```

### Metadata

```typescript
{
  sessionStarted: "2026-02-16T10:00:00Z",
  lastActivity: "2026-02-16T10:35:00Z",
  totalTimeSpent: 2100000, // milliseconds
  pauseCount: 3
}
```

## Syncing to Grade Model

The workbook automatically syncs to the Grade model:

```typescript
// Auto-sync after 3 seconds of inactivity
const { provider } = useWorkbookCollaboration({
  gradeId: grade.id,
  user: currentUser,
  autoSyncToGrade: true,
  syncInterval: 3000,
  onSyncToGrade: async (data, feedback) => {
    const workbookObject = JSON.parse(data)
    
    // Calculate metrics
    const blocks = Object.values(workbookObject)
    const complete = blocks.every(b => b.complete)
    const percentComplete = Math.round(
      (blocks.filter(b => b.complete).length / blocks.length) * 100
    )
    const accuracy = Math.round(
      blocks.reduce((sum, b) => sum + (b.accuracy || 0), 0) / blocks.length
    )
    
    // Save to DataStore
    await DataStore.save(
      Grade.copyOf(grade, updated => {
        updated.data = data
        updated.feedback = JSON.stringify(feedback)
        updated.complete = complete
        updated.percentComplete = percentComplete
        updated.accuracy = accuracy
      })
    )
  }
})
```

## Performance

### Bandwidth
- **Initial load**: ~2-5KB (compressed state)
- **Per edit**: ~100-500 bytes (delta updates)
- **Compared to DataStore**: 10-50x smaller payloads

### Latency
- **Local updates**: <10ms (optimistic UI)
- **Network updates**: 50-150ms (WebSocket)
- **Grade.data sync**: 3-5s debounced (configurable)

### Memory
- **Y.Doc overhead**: ~500KB for typical workbook
- **IndexedDB**: Auto-pruned, configurable retention
- **Awareness**: ~1KB per connected user

## Offline Support

The system works fully offline:

1. **Student goes offline**
   - Edits continue locally
   - IndexedDB persists all changes
   - UI shows "offline" indicator

2. **Student reconnects**
   - YJS automatically syncs missed updates
   - CRDT merges conflicting changes
   - Tutor sees updated state

3. **Conflict resolution**
   - Same block edited offline + online → YJS merges
   - Last-write-wins for scalar values
   - Text edits use operational transforms

## Integration with Existing Code

### UnitContext

```typescript
// Add to unitContext.js
import { useWorkbookCollaboration } from '@/yjs'

export function UnitProvider({ children }) {
  const [currentGrade, setCurrentGrade] = useState(null)
  
  // Initialize workbook collaboration when grade is loaded
  const workbook = useWorkbookCollaboration({
    gradeId: currentGrade?.id,
    user: session.user,
    initialData: currentGrade?.data,
    onSyncToGrade: async (data, feedback) => {
      if (!currentGrade) return
      
      await DataStore.save(
        Grade.copyOf(currentGrade, updated => {
          updated.data = data
          updated.feedback = JSON.stringify(feedback)
        })
      )
    }
  })
  
  return (
    <UnitContext.Provider value={{
      ...existingContext,
      workbook
    }}>
      {children}
    </UnitContext.Provider>
  )
}
```

### Workbook Component

```typescript
// Update src/components/Workbook/index.js
import { useContext } from 'react'
import { UnitContext } from '@/context/unitContext'

export function Workbook() {
  const { workbook, currentGrade } = useContext(UnitContext)
  
  if (!workbook.provider || !currentGrade) {
    return <LoadingSpinner />
  }
  
  return (
    <div>
      {workbook.hasTutorPresent && (
        <TutorPresenceBanner tutors={workbook.activeTutors} />
      )}
      
      <WorkbookEditor
        data={workbook.workbookData}
        onBlockUpdate={workbook.updateBlock}
        provider={workbook.provider}
      />
      
      <ProgressFooter
        completion={workbook.getCompletionPercentage()}
        accuracy={workbook.getOverallAccuracy()}
      />
    </div>
  )
}
```

## Testing

### Unit Tests

```typescript
describe('WorkbookCollaborationProvider', () => {
  it('creates unique room per grade', () => {
    const provider = new WorkbookCollaborationProvider({
      gradeId: 'grade-123',
      user: { username: 'student', role: 'student' }
    })
    
    expect(provider.docName).toBe('workbook-grade-123')
  })
  
  it('tracks tutor presence', async () => {
    const student = createProvider('grade-123', { role: 'student' })
    const tutor = createProvider('grade-123', { role: 'tutor' })
    
    await waitForSync(student, tutor)
    
    expect(student.getActiveTutors()).toHaveLength(1)
    expect(student.hasTutorPresent()).toBe(true)
  })
  
  it('syncs block updates', async () => {
    const provider = createProvider('grade-123')
    
    provider.updateBlock('block-1', {
      userAnswer: 42,
      complete: true
    })
    
    const block = provider.getBlock('block-1')
    expect(block.userAnswer).toBe(42)
    expect(block.complete).toBe(true)
  })
})
```

### Integration Tests

```typescript
describe('Workbook Collaboration Flow', () => {
  it('allows student-tutor collaboration', async () => {
    // Student starts workbook
    const student = renderWithProvider(
      <Workbook gradeId="grade-123" />,
      { role: 'student' }
    )
    
    // Student answers question
    await student.answerQuestion('block-1', 2)
    
    // Tutor joins
    const tutor = renderWithProvider(
      <TutorView gradeId="grade-123" />,
      { role: 'tutor' }
    )
    
    // Wait for sync
    await waitForSync(student, tutor)
    
    // Tutor sees student's answer
    expect(tutor.getBlock('block-1').userAnswer).toBe(2)
    
    // Tutor provides feedback
    await tutor.addFeedback('block-1', 'Great job!')
    
    // Student receives feedback notification
    expect(student.getNotification()).toContain('Great job!')
  })
})
```

## Troubleshooting

### Connection Issues

**Problem**: Workbook not syncing  
**Solution**: Check WebSocket connection
```typescript
console.log('Synced:', workbook.isSynced)
console.log('Connected:', workbook.isConnected)
```

**Problem**: Tutor can't join room  
**Solution**: Verify authorization
```typescript
console.log('Can edit:', provider.canEdit())
console.log('User role:', provider.user.role)
```

### Data Issues

**Problem**: Grade.data not updating  
**Solution**: Check sync handler
```typescript
// Ensure onSyncToGrade is called
window.addEventListener('workbook-sync', (e) => {
  console.log('Sync event:', e.detail)
})
```

**Problem**: Lost edits after reload  
**Solution**: Check IndexedDB persistence
```typescript
// Browser DevTools → Application → IndexedDB
// Look for: workbook-{gradeId}
```

### Performance Issues

**Problem**: Slow updates with large workbooks  
**Solution**: Increase sync interval
```typescript
useWorkbookCollaboration({
  syncInterval: 5000, // 5 seconds instead of 3
  // ...
})
```

## Future Enhancements

- [ ] Video call integration for tutor sessions
- [ ] Screen sharing for complex explanations
- [ ] Workbook templates for common patterns
- [ ] Analytics dashboard for tutor effectiveness
- [ ] Student help queue (raise hand feature)
- [ ] Workbook version history/rollback
- [ ] Export workbook as PDF with annotations
- [ ] Group tutoring sessions (multiple students)

## Resources

- [YJS Documentation](https://docs.yjs.dev/)
- [CRDT Primer](https://crdt.tech/)
- [WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455)
- [Collaborative Editing Best Practices](https://www.inkandswitch.com/local-first/)
