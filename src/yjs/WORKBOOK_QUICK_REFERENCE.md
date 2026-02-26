# Workbook Collaboration - Quick Reference

## Installation

```bash
# Dependencies already included in yjs/
npm install yjs y-websocket y-indexeddb y-protocols
```

## Basic Usage

### Student View

```typescript
import { useWorkbookCollaboration } from '@/yjs'

const { workbookData, updateBlock, activeTutors } = useWorkbookCollaboration({
  gradeId: 'grade-123',
  user: { username: 'student@school.edu', role: 'student' },
  initialData: grade.data,
  onSyncToGrade: async (data, feedback) => {
    await DataStore.save(Grade.copyOf(grade, u => { u.data = data }))
  }
})
```

### Tutor View

```typescript
const { workbookData, setFeedback, connectedUsers } = useWorkbookCollaboration({
  gradeId: 'grade-123',
  user: { username: 'tutor@school.edu', role: 'tutor' },
  onTutorJoin: (tutor) => toast.info(`${tutor.displayName} joined`)
})
```

## Hook Reference

### `useWorkbookCollaboration(options)`

**Options:**
- `gradeId: string` - The Grade record ID (required)
- `user: WorkbookUser` - Current user info (required)
- `initialData?: string` - Grade.data JSON to load
- `onSyncToGrade?: (data, feedback) => void` - Callback to save to Grade
- `onTutorJoin?: (tutor) => void` - Callback when tutor joins
- `autoSyncToGrade?: boolean` - Auto-sync (default: true)
- `syncInterval?: number` - Debounce interval in ms (default: 3000)

**Returns:**
- `provider` - Provider instance
- `workbookData` - All block data
- `updateBlock(id, data)` - Update a block
- `activeTutors` - List of active tutors
- `connectedUsers` - All connected users
- `isSynced` - WebSocket sync status
- `isConnected` - Connection status
- `getCompletionPercentage()` - Calculate % complete
- `getOverallAccuracy()` - Calculate % accuracy

### `useWorkbookBlock(provider, blockId)`

**Returns:**
- `blockData` - Data for this block
- `updateData(data)` - Update this block
- `deleteData()` - Delete this block
- `isComplete` - Whether block is complete
- `accuracy` - Block accuracy score

### `useTutorPresence(provider, blockId?)`

**Returns:** Array of tutors on the specified block (or all tutors if no blockId)

### `useWorkbookFeedback(provider, onNewFeedback?)`

**Returns:** Object containing all feedback

### `useWorkbookStats(provider)`

**Returns:**
- `completion` - % complete
- `accuracy` - % accuracy
- `totalBlocks` - Total block count
- `completedBlocks` - Completed count
- `averageAttempts` - Avg attempts per block

## Data Structures

### WorkbookUser

```typescript
{
  username: string        // User ID
  role: 'student' | 'tutor' | 'instructor' | 'admin'
  displayName?: string    // Display name
  color?: string         // Hex color for UI
  cursor?: {
    blockId?: string
    position?: number
  }
}
```

### WorkbookBlockData

```typescript
{
  "block-id": {
    complete?: boolean
    accuracy?: number      // 0-100
    userAnswer?: any
    feedback?: string
    timestamp?: string     // ISO 8601
    attempts?: number
  }
}
```

## Provider Methods

```typescript
// Block operations
provider.getWorkbookData()                  // Get all blocks
provider.updateBlock(id, data)              // Update a block
provider.getBlock(id)                       // Get one block
provider.deleteBlock(id)                    // Delete a block

// Feedback
provider.setFeedback(id, feedback)          // Add feedback
provider.getFeedback()                      // Get all feedback

// Metadata
provider.updateMetadata(key, value)         // Update metadata
provider.getMetadata()                      // Get metadata

// Users
provider.getActiveTutors()                  // Get tutors
provider.getConnectedUsers()                // Get all users
provider.hasTutorPresent()                  // Boolean check

// Cursor
provider.updateCursor(blockId, position?)   // Update position

// Import/Export
provider.loadFromGradeData(json)            // Load from Grade
provider.exportToGradeData()                // Export to Grade

// Stats
provider.getCompletionPercentage()          // 0-100
provider.getOverallAccuracy()               // 0-100

// Permissions
provider.canEdit()                          // Can user edit?
provider.canProvideFeedback()               // Can give feedback?
```

## Common Patterns

### Initialize Workbook with Existing Data

```typescript
const workbook = useWorkbookCollaboration({
  gradeId: grade.id,
  user: currentUser,
  initialData: grade.data, // Load existing Grade.data
})
```

### Update Block on Answer

```typescript
const handleAnswer = (answer: number) => {
  updateBlock('quiz-block-1', {
    userAnswer: answer,
    complete: true,
    accuracy: calculateAccuracy(answer),
    attempts: (blockData?.attempts || 0) + 1,
  })
}
```

### Show Tutor Presence

```typescript
{activeTutors.map(tutor => (
  <Chip
    key={tutor.username}
    avatar={<Avatar sx={{ bgcolor: tutor.color }} />}
    label={tutor.displayName}
  />
))}
```

### Add Feedback (Tutor)

```typescript
const provideFeedback = (blockId: string) => {
  setFeedback(blockId, {
    text: 'Great work! Consider reviewing verb conjugation.',
    type: 'tutor-comment',
    helpful: true,
  })
}
```

### Track Block Progress

```typescript
const { blockData, updateData, isComplete } = useWorkbookBlock(provider, 'block-1')

if (isComplete) {
  return <CheckCircle color="success" />
}
```

### Show Connection Status

```typescript
{!isConnected && (
  <Alert severity="warning">
    Offline - Changes saved locally
  </Alert>
)}

{isConnected && !isSynced && (
  <Chip label="Syncing..." color="info" />
)}
```

### Display Statistics

```typescript
const { completion, accuracy } = useWorkbookStats(provider)

<LinearProgress variant="determinate" value={completion} />
<Typography>Accuracy: {accuracy}%</Typography>
```

## Room Naming

Rooms are automatically created per Grade ID:
- **Format**: `workbook-{gradeId}`
- **Example**: `workbook-abc123-def456-ghi789`

Each Grade has its own collaborative space:
- Student can only join their own Grade's room
- Tutors can join any Grade room they have permission for
- Multiple tutors can help the same student simultaneously

## Authorization

| Role | Can Edit | Can View | Can Feedback |
|------|----------|----------|--------------|
| Student (owner) | ✅ Own workbook | ✅ Own workbook | ❌ |
| Tutor | ✅ All workbooks | ✅ All workbooks | ✅ |
| Instructor | ✅ Section workbooks | ✅ Section workbooks | ✅ |
| Admin | ✅ All workbooks | ✅ All workbooks | ✅ |

## Performance

- **Latency**: 50-150ms (WebSocket)
- **Bandwidth**: ~100-500 bytes per edit
- **Memory**: ~500KB per workbook
- **Offline**: Full functionality with IndexedDB

## Testing

```typescript
import { WorkbookCollaborationProvider } from '@/yjs'

const provider = new WorkbookCollaborationProvider({
  gradeId: 'test-123',
  user: { username: 'test', role: 'student' },
  connect: false,      // Disable WebSocket
  persistence: false,  // Disable IndexedDB
})

provider.updateBlock('block-1', { userAnswer: 42 })
expect(provider.getBlock('block-1')?.userAnswer).toBe(42)

provider.destroy()
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_YJS_WS_URL=ws://localhost:3001

# Production
NEXT_PUBLIC_YJS_WS_URL=wss://your-app.com
```

## Troubleshooting

**Not syncing?**
```typescript
console.log('Connected:', workbook.isConnected)
console.log('Synced:', workbook.isSynced)
```

**Missing user?**
```typescript
console.log('User:', provider.user)
console.log('Can edit:', provider.canEdit())
```

**Data not persisting?**
```typescript
// Ensure onSyncToGrade callback is provided
onSyncToGrade: async (data, feedback) => {
  console.log('Syncing:', data.length, 'bytes')
  await saveToDatabase(data)
}
```

## Resources

- [Full Documentation](./WORKBOOK_COLLABORATION.md)
- [Integration Guide](./WORKBOOK_INTEGRATION_GUIDE.md)
- [Example Component](../src/components/Examples/CollaborativeWorkbook.tsx)
- [Tests](../__tests__/WorkbookCollaboration.test.ts)
