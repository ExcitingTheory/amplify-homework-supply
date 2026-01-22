# FileManager2 Refinements - Quick Reference

## UI Changes at a Glance

### File Row Selection
**Before**: Checkbox on left side  
**After**: Color-based selection (primary.50 background + primary.main icon color)

```
Before:  ☑ 📄 filename.pdf    [Insert] [Download] [Delete]
After:   🎨 filename.pdf    [...]
         (primary color bg)   (menu icon only)
```

### File Row Actions
**Before**: Three separate icon buttons inline  
**After**: Context menu with all actions

**Menu Items**:
- Insert into editor (images/audio only)
- Download
- Re-analyze (documents only)
- Delete

### Filename Editing
**Before**: Separate rename modal  
**After**: Inline edit on click

```
Click:    "filename.pdf" → [TextField with auto-save]
Outside:  Saves automatically
Escape:   Cancels edit
```

### Protection Level Headers
**Before**: Static header, always visible  
**After**: Sticky header with expand/collapse

```
🔽 PRIVATE (25 files) ← Click to collapse
  🔼 PRIVATE (25 files) ← Collapsed state
```

## Code Examples

### Working with File Selection
```javascript
// FileRowComponent handles selection automatically
// Parent just passes selected state:
<FileRowComponent
    file={file}
    fileType={fileType}
    isSelected={selectedItems.has(file.id)}
    onSelect={(id) => handleToggleSelect(id)}
/>
```

### Inline Filename Editing
```javascript
// Automatic - no external code needed
// Just ensure useFileManager hook provides:
const { handleFileNameUpdate } = useFileManager();

// handleFileNameUpdate should accept (fileId, newName)
```

### Context Menu Actions
```javascript
// Actions handled in FileRowComponent
// All operations preserved:
- Insert: editor.dispatchCommand(INSERT_IMAGE_COMMAND, ...)
- Download: Creates download link via S3
- Delete: Shows confirmation dialog
- Re-analyze: Triggers document re-analysis
```

### Protection Level Collapse
```javascript
// Automatic state persistence
// Stored in localStorage: fileManager2_collapsedProtectionLevels

// Programmatically toggle:
handleToggleProtectionLevelCollapse('PRIVATE'); // toggles collapse state
```

## Component Props

### FileRowComponent
```typescript
interface FileRowComponent {
    file: FileModel;
    fileType: 'images' | 'audio' | 'documents' | 'video' | 'other';
    index: number;
    isSelected: boolean;
    onSelect: (fileId: string) => void;
}
```

### ProtectionLevelHeader (Updated)
```typescript
interface ProtectionLevelHeader {
    label: string;
    totalFiles: number;
    isExpanded?: boolean;           // NEW
    onToggleExpand?: () => void;    // NEW
}
```

## State Management

### New States in FileManager2
```javascript
// Tracks which protection levels are collapsed
const [collapsedProtectionLevels, setCollapsedProtectionLevels] = React.useState(new Set());

// Handler for toggle
const handleToggleProtectionLevelCollapse = (level) => {
    setCollapsedProtectionLevels(prev => {
        const newSet = new Set(prev);
        newSet.has(level) ? newSet.delete(level) : newSet.add(level);
        return newSet;
    });
};
```

### FileRowComponent Internal State
```javascript
const [menuAnchor, setMenuAnchor] = React.useState(null);
const [isEditing, setIsEditing] = React.useState(false);
const [editedName, setEditedName] = React.useState(file.name);
const [isSaving, setIsSaving] = React.useState(false);
```

## Styling Reference

### File Row States
```javascript
// Base state
backgroundColor: isSelected ? 'primary.50' : isEvenRow ? 'grey.50' : 'background.paper'

// Hover state
'&:hover': {
    backgroundColor: isSelected ? 'primary.50' : 'action.hover',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
}

// Icon color
sx={{ color: isSelected ? 'primary.main' : 'inherit' }}
```

### Header States
```javascript
// Normal state
bgcolor: 'primary.50'
color: 'primary.main'

// Hover state
bgcolor: 'primary.100'

// Sticky positioning
position: 'sticky'
top: 88 // Below search bar

// Expand icon rotation
transform: item.isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'
```

## Common Tasks

### Add New Context Menu Item
```javascript
// In FileRowComponent, add to Menu:
<MenuItem onClick={() => handleMenuAction('new-action')}>
    <NewIcon fontSize="small" sx={{ mr: 1 }} />
    New Action
</MenuItem>

// Add handler in handleMenuAction switch:
case 'new-action':
    // Your logic here
    break;
```

### Change Collapse Behavior
```javascript
// Default: all levels expanded
// To start with everything collapsed:
const [collapsedProtectionLevels] = useState(() => {
    return new Set(['PRIVATE', 'PUBLIC', 'PROTECTED', 'UNSET']);
});
```

### Customize Selection Color
```javascript
// Edit in FileRowComponent:
backgroundColor: isSelected ? 'success.50' : // or any color
// Update icon color to match:
color: isSelected ? 'success.main' : 'inherit'
```

### Add Keyboard Shortcuts
```javascript
// In FileRowComponent, add to handleKeyDown:
const handleKeyDown = (e) => {
    if (e.key === 'd' && e.ctrlKey) {
        handleMenuAction('download');
    }
    if (e.key === 'Delete') {
        handleMenuAction('delete');
    }
};
```

## Performance Tips

1. **Memoization**: FileRowComponent is memoized - be careful with inline functions in props
2. **Virtualization**: Still works with collapsed items - virtualizer recalculates on expand/collapse
3. **LocalStorage**: Collapse state auto-saved, consider size if many protection levels
4. **Search**: Works with collapsed items - collapsed state preserved during search

## Troubleshooting

### Filename edit not saving?
- Ensure `useFileManager` hook provides `handleFileNameUpdate`
- Check that function signature is `(fileId: string, newName: string) => Promise<void>`
- Watch browser console for errors

### Context menu not appearing?
- Ensure `Menu` and `MenuItem` are imported from MUI
- Check z-index conflicts with other components
- Verify `MoreVertIcon` import exists

### Collapse state not persisting?
- Check browser localStorage is enabled
- Verify key: `fileManager2_collapsedProtectionLevels`
- Check for localStorage quota issues

### Icons not changing color on select?
- Ensure color prop exists on icon component
- Verify `primary.main` color is defined in theme
- Check CSS specificity conflicts

## Browser DevTools Tips

### Check Collapse State
```javascript
// In console:
JSON.parse(localStorage.getItem('fileManager2_collapsedProtectionLevels'))
// Output: ["PRIVATE"] if PRIVATE is collapsed
```

### Monitor Selection Changes
```javascript
// Add to FileRowComponent for debugging:
console.log('Selection changed:', {
    fileId: file.id,
    isSelected,
    selectedCount: selectedItems.size
});
```

### Verify Styling Applied
```javascript
// Inspect file row element and check computed styles:
// - backgroundColor should be primary.50 when selected
// - Icon should have color: primary.main when selected
```

## Integration Notes

### With Lexical Editor
- Insert actions preserved: `editor.dispatchCommand(INSERT_IMAGE_COMMAND, ...)`
- Works seamlessly with editor focus/blur
- File insertion doesn't require special handling

### With VectorStore/Search
- Collapsed items still searchable when search filters applied
- Collapse state maintained after search
- No impact on semantic search results

### With DataStore
- File updates (rename) go through existing DataStore patterns
- Delete still removes from S3 and DataStore
- No schema changes required

## Version Notes
- **Backward Compatible**: Yes
- **Breaking Changes**: None
- **Migration Path**: None required - all existing code works as before
- **Database Changes**: None
