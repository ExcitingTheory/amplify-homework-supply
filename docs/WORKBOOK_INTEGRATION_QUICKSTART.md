# Workbook Integration - Quick Start

This guide shows how to use the new collaborative workbook features in your components.

## Basic Usage

The collaborative workbook is now available in the `UnitContext`. You can access it like this:

```jsx
import React from 'react';
import UnitContext from '@/context/unitContext';
import { TutorPresenceBanner, ConnectionStatus, WorkbookProgress } from '@/components/Workbook';

function MyWorkbookComponent() {
  const { workbook, workbookStats, workbookEnabled } = React.useContext(UnitContext);

  // Check if workbook collaboration is enabled
  if (!workbookEnabled || !workbook?.provider) {
    return <div>Workbook not available</div>;
  }

  return (
    <div>
      {/* Show when tutors join */}
      <TutorPresenceBanner />
      
      {/* Show connection status */}
      <ConnectionStatus />
      
      {/* Show progress */}
      <WorkbookProgress variant="detailed" />
      
      {/* Your workbook content here */}
      <div>
        Completion: {workbookStats.completion}%
        Accuracy: {workbookStats.accuracy}%
      </div>
    </div>
  );
}
```

## Using Block-Level Hooks

For individual question blocks, use the `useWorkbookBlock` hook:

```jsx
import { useWorkbookBlock } from '@/yjs/workbookHooks';
import UnitContext from '@/context/unitContext';

function QuizBlock({ blockId }) {
  const { workbook } = React.useContext(UnitContext);
  const { blockData, updateData, isComplete } = useWorkbookBlock(
    workbook?.provider,
    blockId
  );

  const handleAnswer = (answer) => {
    updateData({
      userAnswer: answer,
      complete: true,
      accuracy: calculateAccuracy(answer),
    });
  };

  return (
    <div>
      <h3>Question</h3>
      <button
        onClick={() => handleAnswer('A')}
        disabled={isComplete}
      >
        Answer A
      </button>
      
      {blockData?.userAnswer && (
        <div>Your answer: {blockData.userAnswer}</div>
      )}
    </div>
  );
}
```

## Component Reference

### TutorPresenceBanner

Shows when tutors join the session.

```jsx
<TutorPresenceBanner />
```

No props needed - automatically reads from UnitContext.

### ConnectionStatus

Shows the connection state (online, offline, syncing).

```jsx
<ConnectionStatus
  size="small"      // 'small' | 'medium'
  showLabel={true}  // Show text label
/>
```

### WorkbookProgress

Shows completion and accuracy stats.

```jsx
<WorkbookProgress
  variant="default"   // 'default' | 'compact' | 'detailed'
  detailed={false}    // Show accuracy
/>
```

## Context Values

The `UnitContext` now provides these workbook-related values:

```typescript
{
  // Workbook collaboration provider and methods
  workbook: {
    provider: YjsDocProvider | null,
    updateBlock: (blockId: string, data: any) => void,
    setFeedback: (blockId: string, feedback: any) => void,
    getWorkbookData: () => Record<string, any>,
    getCompletionPercentage: () => number,
    getOverallAccuracy: () => number,
    isConnected: boolean,
    isSynced: boolean,
    hasTutorPresent: boolean,
    activeTutors: WorkbookUser[],
  },
  
  // Computed stats for easy access
  workbookStats: {
    completion: number,      // 0-100
    accuracy: number,        // 0-100
    totalBlocks: number,
    completeBlocks: number,
  },
  
  // Feature flag
  workbookEnabled: boolean,
}
```

## Checking if Feature is Available

Always check if the workbook feature is enabled and the provider is ready:

```jsx
const { workbook, workbookEnabled } = React.useContext(UnitContext);

if (!workbookEnabled || !workbook?.provider) {
  // Fallback to non-collaborative mode
  return <StaticWorkbook />;
}

// Use collaborative features
return <CollaborativeWorkbook />;
```

## Auto-Sync Behavior

The workbook automatically syncs to `Grade.data` every 3 seconds (configurable). You don't need to manually call `saveGrade` anymore when using the workbook hooks.

**Old approach (manual save):**
```jsx
// Don't do this anymore
const handleAnswer = async (answer) => {
  const gradeData = JSON.parse(grade.data || '{}');
  gradeData[blockId] = { answer, complete: true };
  await saveGrade(gradeData);
};
```

**New approach (auto-sync):**
```jsx
// Just update the workbook data - it syncs automatically
const { updateData } = useWorkbookBlock(workbook?.provider, blockId);

const handleAnswer = (answer) => {
  updateData({ answer, complete: true });
  // Automatically synced to Grade.data within 3 seconds
};
```

## Environment Configuration

Make sure you have the environment variables set:

```env
# .env.local
NEXT_PUBLIC_YJS_WS_URL=ws://localhost:3001
NEXT_PUBLIC_ENABLE_WORKBOOK_COLLABORATION=true
```

For production, use `wss://` (secure WebSocket):

```env
# .env.production
NEXT_PUBLIC_YJS_WS_URL=wss://your-yjs-server.com
NEXT_PUBLIC_ENABLE_WORKBOOK_COLLABORATION=true
```

## Offline Support

The workbook automatically handles offline scenarios:

1. **Offline editing**: Changes are saved to IndexedDB
2. **Reconnection**: Data is automatically synced when back online
3. **Conflict resolution**: YJS CRDT handles concurrent edits

You don't need to do anything special - it just works!

## Tutor View

For instructors/tutors to join a student's workbook session:

```jsx
import { useWorkbookCollaboration } from '@/yjs/workbookHooks';

function TutorWorkbookView({ gradeId, student }) {
  const { user, session } = React.useContext(AuthContext);
  
  const workbook = useWorkbookCollaboration({
    gradeId,
    user: {
      username: user.attributes.sub,
      role: 'tutor',
      displayName: user.attributes.name,
      color: '#f59e0b', // Orange for tutors
    },
  });

  return (
    <div>
      <h2>Helping {student.name}</h2>
      
      {!workbook.isConnected && (
        <Alert severity="warning">
          Student may be offline
        </Alert>
      )}
      
      {/* Show workbook data with ability to add feedback */}
      {Object.entries(workbook.getWorkbookData()).map(([blockId, data]) => (
        <div key={blockId}>
          <p>Student answer: {data.userAnswer}</p>
          <button
            onClick={() => workbook.setFeedback(blockId, {
              text: 'Great work!',
              type: 'tutor-comment',
            })}
          >
            Add Feedback
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Migration from Static Grade.data

If you have existing components using `Grade.data` directly:

### Before:
```jsx
function QuizBlock({ grade, onUpdate }) {
  const gradeData = JSON.parse(grade.data || '{}');
  const blockData = gradeData[blockId];
  
  const handleSubmit = async (answer) => {
    gradeData[blockId] = { answer, complete: true };
    await onUpdate(gradeData);
  };
}
```

### After:
```jsx
function QuizBlock({ blockId }) {
  const { workbook } = React.useContext(UnitContext);
  const { blockData, updateData } = useWorkbookBlock(workbook?.provider, blockId);
  
  const handleSubmit = (answer) => {
    updateData({ answer, complete: true });
    // Auto-synced!
  };
}
```

## Troubleshooting

### Workbook not showing up
- Check `NEXT_PUBLIC_ENABLE_WORKBOOK_COLLABORATION=true` in your `.env.local`
- Verify WebSocket server is running: `ws://localhost:3001`
- Check browser console for connection errors

### Changes not syncing
- Check `workbook.isConnected` and `workbook.isSynced`
- Look for errors in browser console
- Verify Grade.data permissions in Amplify schema

### Multiple users seeing different data
- This shouldn't happen with YJS CRDT - file a bug report
- Check that both users are connecting to the same `gradeId`

## Advanced: Custom Sync Interval

To change the auto-sync interval, modify `UnitContext.jsx`:

```jsx
const workbookCollaboration = useWorkbookCollaboration({
  // ... other options
  syncInterval: 5000, // Sync every 5 seconds instead of 3
});
```

## Next Steps

- Read the [full documentation](../yjs/WORKBOOK_COLLABORATION.md)
- See [example implementation](../src/components/Examples/CollaborativeWorkbook.tsx)
- Check the [integration guide](../yjs/WORKBOOK_INTEGRATION_GUIDE.md)

## Need Help?

- Review the YJS logs: `localStorage.setItem('yjs:debug', 'true')`
- Check the [troubleshooting section](../yjs/WORKBOOK_COLLABORATION.md#troubleshooting)
- File an issue with your browser console logs
