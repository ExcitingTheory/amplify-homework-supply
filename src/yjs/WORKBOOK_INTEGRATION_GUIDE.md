# Workbook Collaboration Integration Guide

Quick guide for integrating the new workbook collaboration feature into existing components.

## Integration Checklist

- [ ] Add YJS WebSocket URL to environment config
- [ ] Update UnitContext to include workbook provider
- [ ] Update Workbook component to use collaborative hooks
- [ ] Add tutor presence UI components
- [ ] Update Grade DataStore save logic for auto-sync
- [ ] Add connection status indicators
- [ ] Test offline functionality

## 1. Environment Configuration

Add WebSocket URL to your config:

```typescript
// next.config.js or .env
{
  websocketUrl: process.env.NEXT_PUBLIC_YJS_WS_URL || 'ws://localhost:3001'
}
```

## 2. Update UnitContext

Integrate workbook collaboration into the existing context:

```typescript
// src/context/unitContext.js
import { useWorkbookCollaboration } from '@/yjs'

export function UnitProvider({ children }) {
  const [currentGrade, setCurrentGrade] = useState(null)
  const { session } = useContext(AuthContext)
  
  // Initialize workbook collaboration when grade is loaded
  const workbook = useWorkbookCollaboration({
    gradeId: currentGrade?.id,
    user: {
      username: session.username || '',
      role: session.groups?.includes('Instructors') ? 'instructor' : 'student',
      displayName: session.user?.name || session.username || '',
      color: session.groups?.includes('Instructors') ? '#f59e0b' : '#3b82f6',
    },
    initialData: currentGrade?.data,
    wsUrl: process.env.NEXT_PUBLIC_YJS_WS_URL,
    onTutorJoin: (tutor) => {
      // Show notification
      console.log(`Tutor ${tutor.displayName} joined to help!`)
      // Optional: trigger toast/notification
    },
    onSyncToGrade: async (data, feedback) => {
      if (!currentGrade) return
      
      try {
        const parsed = JSON.parse(data)
        const blocks = Object.values(parsed)
        
        // Calculate metrics
        const complete = blocks.every((b: any) => b.complete)
        const percentComplete = Math.round(
          (blocks.filter((b: any) => b.complete).length / blocks.length) * 100
        )
        const accuracy = Math.round(
          blocks.reduce((sum: number, b: any) => sum + (b.accuracy || 0), 0) / blocks.length
        )
        
        // Save to DataStore
        await DataStore.save(
          Grade.copyOf(currentGrade, (updated) => {
            updated.data = data
            updated.feedback = JSON.stringify(feedback)
            updated.complete = complete
            updated.percentComplete = percentComplete
            updated.accuracy = accuracy
          })
        )
        
        console.log('[UnitContext] Synced workbook to Grade.data')
      } catch (error) {
        console.error('[UnitContext] Error syncing workbook:', error)
      }
    },
  })
  
  return (
    <UnitContext.Provider
      value={{
        ...existingContextValue,
        workbook, // Add workbook to context
        // Include helper methods
        updateWorkbookBlock: workbook.updateBlock,
        workbookStats: {
          completion: workbook.getCompletionPercentage(),
          accuracy: workbook.getOverallAccuracy(),
        },
      }}
    >
      {children}
    </UnitContext.Provider>
  )
}
```

## 3. Update Workbook Component

Replace static Grade.data handling with collaborative editing:

```typescript
// src/components/Workbook/index.js or WorkbookGrade.js
import { useContext } from 'react'
import { UnitContext } from '@/context/unitContext'
import { CollaborativeWorkbook } from '@/components/Examples/CollaborativeWorkbook'

export function Workbook({ gradeId, unitId }) {
  const { workbook, currentGrade } = useContext(UnitContext)
  
  if (!currentGrade || !workbook.provider) {
    return <LoadingSpinner />
  }
  
  return (
    <CollaborativeWorkbook
      gradeId={gradeId}
      unitId={unitId}
    />
  )
}
```

## 4. Update Block Components

Migrate existing block components to use collaborative hooks:

### Before (Static Grade.data):

```typescript
// Old approach
function QuizBlock({ blockId, grade, onUpdate }) {
  const [answer, setAnswer] = useState(null)
  
  const handleSubmit = async (selectedAnswer) => {
    const gradeData = JSON.parse(grade.data || '{}')
    gradeData[blockId] = {
      userAnswer: selectedAnswer,
      complete: true,
      accuracy: calculateAccuracy(selectedAnswer)
    }
    
    await DataStore.save(
      Grade.copyOf(grade, updated => {
        updated.data = JSON.stringify(gradeData)
      })
    )
  }
  
  return <QuizQuestion onAnswer={handleSubmit} />
}
```

### After (Collaborative):

```typescript
// New approach with YJS
import { useWorkbookBlock } from '@/yjs'

function QuizBlock({ blockId, provider }) {
  const { blockData, updateData, isComplete } = useWorkbookBlock(provider, blockId)
  
  const handleSubmit = (selectedAnswer) => {
    // No need for manual DataStore.save - auto-synced
    updateData({
      userAnswer: selectedAnswer,
      complete: true,
      accuracy: calculateAccuracy(selectedAnswer),
      attempts: (blockData?.attempts || 0) + 1,
    })
  }
  
  return (
    <QuizQuestion
      answer={blockData?.userAnswer}
      onAnswer={handleSubmit}
      disabled={isComplete}
    />
  )
}
```

## 5. Add Tutor Presence Indicators

Show when tutors are viewing/helping:

```typescript
// src/components/Workbook/TutorPresenceBanner.tsx
import { useContext } from 'react'
import { UnitContext } from '@/context/unitContext'
import { Alert, Avatar, AvatarGroup } from '@mui/material'

export function TutorPresenceBanner() {
  const { workbook } = useContext(UnitContext)
  
  if (!workbook.hasTutorPresent) return null
  
  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      <Box display="flex" alignItems="center" gap={1}>
        <AvatarGroup max={3}>
          {workbook.activeTutors.map((tutor, i) => (
            <Avatar
              key={i}
              sx={{ bgcolor: tutor.color, width: 32, height: 32 }}
            >
              {tutor.displayName?.[0] || 'T'}
            </Avatar>
          ))}
        </AvatarGroup>
        <Typography>
          {workbook.activeTutors.map(t => t.displayName).join(', ')}{' '}
          {workbook.activeTutors.length === 1 ? 'is' : 'are'} helping you
        </Typography>
      </Box>
    </Alert>
  )
}
```

## 6. Add Connection Status Indicator

Show sync/connection status to users:

```typescript
// src/components/Workbook/ConnectionStatus.tsx
import { Chip } from '@mui/material'
import { Wifi, WifiOff, Sync } from '@mui/icons-material'

export function ConnectionStatus({ workbook }) {
  if (!workbook.isConnected) {
    return (
      <Chip
        icon={<WifiOff />}
        label="Offline - Changes saved locally"
        color="warning"
        size="small"
      />
    )
  }
  
  if (!workbook.isSynced) {
    return (
      <Chip
        icon={<Sync className="animate-spin" />}
        label="Syncing..."
        color="info"
        size="small"
      />
    )
  }
  
  return (
    <Chip
      icon={<Wifi />}
      label="Connected"
      color="success"
      size="small"
    />
  )
}
```

## 7. Update Grade List Page (Instructor View)

Add ability for instructors to join student workbooks:

```typescript
// pages/sections/[sectionId]/grades.js
import { useRouter } from 'next/router'
import { WorkbookCollaborationProvider } from '@/yjs'

export function GradesList({ grades, instructor }) {
  const handleJoinWorkbook = (grade) => {
    // Navigate to workbook with tutor role
    router.push(`/workbook/${grade.id}?role=tutor`)
  }
  
  return (
    <Table>
      {grades.map(grade => (
        <TableRow key={grade.id}>
          <TableCell>{grade.owner}</TableCell>
          <TableCell>{grade.percentComplete}%</TableCell>
          <TableCell>
            <Button onClick={() => handleJoinWorkbook(grade)}>
              Join Session
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </Table>
  )
}
```

## 8. Tutor View Component

Create a tutor interface for helping students:

```typescript
// src/components/Tutor/TutorWorkbookView.tsx
import { useWorkbookCollaboration } from '@/yjs'

export function TutorWorkbookView({ gradeId, student, tutor }) {
  const {
    workbookData,
    setFeedback,
    isConnected,
  } = useWorkbookCollaboration({
    gradeId,
    user: {
      username: tutor.username,
      role: 'tutor',
      displayName: tutor.name,
      color: '#f59e0b', // Orange for tutors
    },
  })
  
  const provideFeedback = (blockId: string, text: string) => {
    setFeedback(blockId, {
      text,
      type: 'tutor-comment',
      helpful: true,
    })
  }
  
  return (
    <Box>
      <Typography variant="h5">
        Helping {student.name}
      </Typography>
      
      {!isConnected && (
        <Alert severity="warning">
          Not connected. Student may be offline.
        </Alert>
      )}
      
      <WorkbookViewer
        data={workbookData}
        readOnly={false}
        onAddFeedback={provideFeedback}
      />
    </Box>
  )
}
```

## 9. Testing

### Test Offline Functionality

```typescript
// Simulate offline mode
describe('Workbook Offline', () => {
  it('saves changes locally when offline', async () => {
    // Disconnect network
    await page.setOfflineMode(true)
    
    // Make edit
    await page.click('[data-testid="answer-option-2"]')
    
    // Verify saved to IndexedDB
    const idbData = await getIndexedDBData('workbook-grade-123')
    expect(idbData).toBeDefined()
    
    // Reconnect
    await page.setOfflineMode(false)
    
    // Verify synced to server
    await waitFor(() => {
      expect(serverReceivedUpdate).toBe(true)
    })
  })
})
```

### Test Student-Tutor Collaboration

```typescript
describe('Student-Tutor Collaboration', () => {
  it('allows tutor to see student progress', async () => {
    // Student opens workbook
    const studentPage = await openWorkbook('student')
    
    // Student answers question
    await studentPage.answerQuestion('block-1', 2)
    
    // Tutor opens same workbook
    const tutorPage = await openWorkbook('tutor')
    
    // Tutor sees answer
    const answer = await tutorPage.getBlockAnswer('block-1')
    expect(answer).toBe(2)
    
    // Tutor provides feedback
    await tutorPage.addFeedback('block-1', 'Great job!')
    
    // Student receives notification
    await expect(studentPage).toHaveNotification('Great job!')
  })
})
```

## 10. Migration Strategy

For existing workbooks with data in Grade.data:

1. **Data is automatically loaded**: The `initialData` prop loads existing Grade.data into YJS
2. **No migration needed**: Existing JSON structure is compatible
3. **Gradual rollout**: Old components continue working alongside new ones
4. **Fallback**: If YJS unavailable, falls back to direct DataStore edits

## Common Issues

### Issue: Workbook not syncing

**Solution**: Check WebSocket connection
```typescript
console.log('Connected:', workbook.isConnected)
console.log('Synced:', workbook.isSynced)
```

### Issue: Multiple users editing same block

**Solution**: Add optimistic locking
```typescript
const handleUpdate = (data) => {
  const version = blockData?._version || 0
  updateData({
    ...data,
    _version: version + 1,
  })
}
```

### Issue: Grade.data not persisting

**Solution**: Ensure `onSyncToGrade` callback is provided and handles errors

## Performance Tips

1. **Debounce sync**: Use `syncInterval: 3000` or higher to reduce saves
2. **Lazy load**: Only initialize workbook when needed
3. **Cleanup**: Destroy provider when unmounting
4. **Index queries**: Add DynamoDB indexes for workbook queries

## Next Steps

- [ ] Add workbook templates for common question types
- [ ] Implement workbook analytics dashboard
- [ ] Add screen sharing for tutors
- [ ] Create student help queue system
- [ ] Add workbook export/PDF generation

## Resources

- [Full Documentation](./WORKBOOK_COLLABORATION.md)
- [Example Component](../src/components/Examples/CollaborativeWorkbook.tsx)
- [YJS Documentation](https://docs.yjs.dev/)
