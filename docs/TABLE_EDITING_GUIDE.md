# Table Editing Guide - Editor3

Complete reference for table editing features in the Lexical Editor.

## Overview

The table plugin provides spreadsheet-like editing with full keyboard navigation, inline editing, and flexible header management.

## Keyboard Navigation

### Basic Navigation

| Key | Action |
|-----|--------|
| **Arrow Keys** | Navigate between cells (spreadsheet-style) |
| **Tab** | Move to next cell (wraps to next row) |
| **Shift+Tab** | Move to previous cell (wraps to previous row) |
| **Enter** | Edit current cell / Move down when editing |
| **Double-Click** | Enter edit mode for cell |
| **Escape** | Exit edit mode |

### Edge Behavior

When navigating to table edges:
- **Up Arrow** at top row → Exit table upward
- **Down Arrow** at bottom row → Exit table downward
- **Tab** at last cell → Exit table / Create new paragraph after
- **Shift+Tab** at first cell → Exit table / Select previous element

### NEW: Quick Add Rows/Columns

| Key | Action |
|-----|--------|
| **Ctrl+Right Arrow** | Add column to the right (when at rightmost cell) |
| **Ctrl+Down Arrow** | Add row below and move to it (when at bottom row) |

## Cell Editing

### Enter Edit Mode
- **Double-click** on a cell
- Press **Enter** while cell is selected
- Start typing when cell is selected

### Exit Edit Mode
- Press **Escape**
- Navigate away with **Tab** or **Shift+Tab**

### While Editing
- **Enter** → Move to cell below (stays in edit mode)
- **Tab** → Move to next cell (stays in edit mode)  
- **Shift+Tab** → Move to previous cell (stays in edit mode)
- Arrow keys navigate cursor within cell content

## Right-Click Context Menu

Click the **⋮** button on any selected cell to access:

### Header Management
- **📌 Make Header** / **📄 Remove Header** - Toggle individual cell
- **📌 Make Row Header** / **📄 Remove Row Header** - Toggle entire row
- **📌 Make Column Header** / **📄 Remove Column Header** - Toggle entire column

### Content Management
- **Clear Cell** - Remove all content from cell
- **Delete Table** - Remove entire table

### Row Operations  
- **Insert Row Above**
- **Insert Row Below**
- **Delete Row** (if more than 1 row exists)

### Column Operations
- **Insert Column Left**
- **Insert Column Right**
- **Delete Column** (if more than 1 column exists)

### Sorting (Header Cells Only)
- **Sort Ascending** - A→Z, 0→9
- **Sort Descending** - Z→A, 9→0
- **Remove Sorting** - Restore original order

## Visual Cues

### Add Buttons
- **Add Columns** button appears when hovering near right edge
- **Add Rows** button appears when hovering near bottom edge

### Cell States
- **Blue border** - Selected cell
- **Green background** - Cell in edit mode
- **Gray background** - Header cells
- **Sorted indicator** - Small triangle in sorted header cells

## Copy/Paste

### Single Cell
- **Ctrl+C** / **Cmd+C** - Copy selected cell
- **Ctrl+V** / **Cmd+V** - Paste into selected cell
- **Ctrl+X** / **Cmd+X** - Cut cell content

### Multiple Cells
- **Shift+Arrow Keys** - Extend selection
- **Copy/Paste** works with cell ranges
- Pasting HTML tables merges content

## Accessibility

### Screen Reader Support
- Header cells properly marked with `<th>` tags
- Cell actions button labeled "Cell actions"
- All menu items have descriptive labels

### Keyboard-Only Use
- Full navigation without mouse
- Context menu accessible via button
- Focus indicators on all interactive elements

## Best Practices

1. **Use headers for first row/column** - Improves table semantics and accessibility
2. **Toggle entire rows/columns** - Faster than cell-by-cell for structured data
3. **Keyboard shortcuts for speed** - Ctrl+Arrow to quickly expand tables
4. **Keep tables focused** - Split large tables into multiple smaller ones
5. **Test with screen readers** - Ensure header structure makes sense

## Common Workflows

### Creating a Vocabulary Table
1. Insert table via toolbar (e.g., 3 columns, 5 rows)
2. Right-click first row → "Make Row Header"
3. Enter column headers: "Japanese", "Reading", "English"
4. Navigate with Tab and fill in data
5. Use Ctrl+Down at last row to add more entries

### Converting Existing Table Headers
1. Right-click any cell in the header row
2. Select "Make Row Header" to convert entire row
3. Or "Make Column Header" for vertical headers
4. Toggle individual cells with "Make Header"

### Quickly Expanding Tables
1. Navigate to last cell in bottom-right
2. Press **Ctrl+Down Arrow** to add row
3. Press **Ctrl+Right Arrow** to add column
4. Continue editing in new cells

## Known Limitations

- Cell merging/spanning not supported
- Fixed table width (adjusts to content)
- Column width resizing available via drag handles
- Minimum table size: 1 row × 1 column

## Troubleshooting

**Can't edit cell content?**
- Double-click or press Enter to enter edit mode
- Ensure you're not in read-only mode

**Arrow keys not working?**
- Make sure cell is selected (not editing)
- Press Escape to exit edit mode first

**Header toggle not showing?**
- Right-click on cell or use **⋮** button
- Options appear in dropdown menu

---

**Last Updated**: January 31, 2026  
**Component**: `src/components/Editor3/components/TableComponent.js`
