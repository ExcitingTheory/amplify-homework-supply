# Legacy Chat Cleanup Guide

## The Problem

You're seeing `RetryMutation` errors and warnings about legacy chats because you have **existing ChatHistory records in your database that were created before the `assistantID` field was added to the schema**.

### Why This Happens

1. The `assistantID` field is **not required** in the schema (it's optional)
2. When the field was added, existing chat records in the database didn't automatically get this field
3. When you try to save these old records (archive, save draft), DataStore fails because it can't properly handle records without `assistantID`

### The Fix Applied

I've implemented several safeguards to prevent errors:

**In [ChatSidebar.js](../src/components/ChatSidebar.js)**:
- ✅ Archive button now checks for `assistantID` before trying to save
- ✅ Draft saving skips legacy chats with warning
- ✅ Send button is disabled for legacy chats
- ✅ Input field is disabled for legacy chats with helpful placeholder
- ✅ Visual warning banner when viewing legacy chats
- ✅ "Legacy (read-only)" label in chat history list
- ✅ **Cleanup button in history drawer to delete all legacy chats**

**In [tabContext.js](../src/context/tabContext.js)**:
- ✅ New chats are created WITH `assistantID` (already correct)

## Solution: Clean Up Legacy Data

You have two options:

### Option 1: Use the UI Button (Recommended)

1. Open the AI Assistant sidebar
2. Click the History icon to view chat history
3. If you see legacy chats, a yellow warning box will appear
4. Click **"Delete All Legacy Chats"** button
5. Confirm the deletion
6. All legacy chats will be removed

### Option 2: Use the Migration Utility Programmatically

If you prefer to run the cleanup from code (e.g., in a migration script):

```javascript
import { migrateLegacyChats, countLegacyChats } from './utils/migrateLegacyChats';

// First, count legacy chats to see what you have
const count = await countLegacyChats();
console.log('Legacy chats:', count);

// Option A: Delete all legacy chats (clean start)
const result = await migrateLegacyChats({ deleteAllLegacy: true });
console.log('Deleted:', result.deleted);

// Option B: Migrate legacy chats to current assistant (preserve history)
const result = await migrateLegacyChats({ migrateToCurrentAssistant: true });
console.log('Migrated:', result.migrated);
```

### Option 3: Manual Cleanup via AWS Console

1. Go to AWS AppSync Console
2. Navigate to your API → Queries
3. Run this mutation to delete legacy chats:

```graphql
query ListLegacyChats {
  listChatHistories(filter: { assistantID: { attributeExists: false } }) {
    items {
      id
      createdAt
      archived
    }
  }
}
```

Then delete them one by one or use the utility script.

## Prevention

Going forward, this won't happen again because:

1. **New chats are always created with `assistantID`** (see `tabContext.js` line ~294)
2. **UI prevents any operations on legacy chats** (disabled inputs, warnings)
3. **Easy cleanup button** in the history drawer for any stragglers

## Why Not Make `assistantID` Required?

Making the field required in the schema would break existing records in production. Instead:

- The field is **optional in the schema** to maintain backward compatibility
- The **application logic treats it as required** for all new chats
- Legacy records are **gracefully handled** with read-only mode and cleanup tools

## After Cleanup

Once you've deleted all legacy chats:
- All new chats will have `assistantID`
- No more `RetryMutation` errors
- Draft saving will work properly
- Archive functionality will work
- Clean chat history without warnings

## Need Help?

If you encounter issues:
1. Check the browser console for `[TabContext]` and `[ChatSidebar]` logs
2. Verify your schema has `assistantID` field on `ChatHistory`
3. Run `countLegacyChats()` to see if any remain
4. Check that new chats are being created with `assistantID`
