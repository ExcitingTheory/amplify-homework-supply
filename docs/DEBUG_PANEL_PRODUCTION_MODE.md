# Debug Panel Production Mode

The Debug Panel can be enabled in production to help diagnose issues and collect diagnostics from users.

## Features

- **State Inspector**: View React context and component state
- **Component Tree**: Visualize component hierarchy
- **Log Viewer**: View console logs and errors
- **Performance Metrics**: Monitor render times and performance
- **Export Diagnostics**: Download logs and state for support tickets
- **🆕 Discord Integration**: Automatically send diagnostics to support team via Discord webhook

## Discord Webhook Integration

The debug panel can automatically send diagnostic reports to your support team via Discord. See [DISCORD_WEBHOOK_SETUP.md](./DISCORD_WEBHOOK_SETUP.md) for complete setup instructions.

**Quick Setup:**
1. Create Discord webhook in your support channel
2. Add `NEXT_PUBLIC_DISCORD_WEBHOOK_URL` to `.env.local`
3. Restart development server
4. Users can now click the 📤 Send icon in the debug panel

**Benefits:**
- Instant notification when users report issues
- Automatic data sanitization (removes auth tokens)
- Full diagnostic snapshot attached
- User can provide description and contact info
- Organized in Discord channels for team collaboration

## Enabling Debug Mode in Production

### Method 1: Secret UI Trigger (Recommended for Users)

1. **Click the menu icon** (☰) in the top-left corner **7 times within 3 seconds**
2. You'll see an alert: "🐛 Debug mode enabled! Refresh the page..."
3. **Refresh the page** (Cmd+R / Ctrl+R)
4. Press **Cmd+Shift+D** (Mac) or **Ctrl+Shift+D** (Windows/Linux) to open the debug panel

### Method 2: Browser Console (For Technical Users)

```javascript
// Enable debug mode
localStorage.setItem('debug-mode-enabled', 'true')

// Refresh the page, then use keyboard shortcut to open panel
```

### Method 3: URL Parameter (Future Enhancement)

```
https://your-app.com?debug=true
```

## Using the Debug Panel

### Keyboard Shortcut
- **Open/Close**: `Cmd+Shift+D` (Mac) or `Ctrl+Shift+D` (Windows/Linux)

### Tabs

1. **State Inspector**
   - View AuthContext (user, session, isLoading)
   - View FilesContext (files, documents, vector store)
   - View UnitContext (current unit, grade, rubric)
   - View SettingsContext (user preferences)

2. **Component Tree**
   - See all mounted React components
   - View component props and state
   - Track re-renders

3. **Logs**
   - Console output (log, warn, error)
   - Network requests (GraphQL, REST)
   - Authentication events
   - File uploads/downloads

4. **Performance**
   - Component render times
   - Re-render counts
   - Memory usage
   - Network timing

### Exporting Diagnostics

1. Open the debug panel (Cmd+Shift+D)
2. Click **"Export Diagnostics"** button
3. A JSON file will download with:
   - Current state snapshot
   - Recent logs (last 1000 entries)
   - Component tree
   - Performance metrics
   - Browser info
   - User agent
   - Current route
   - Timestamp

Share this file with support for faster issue resolution.

## Disabling Debug Mode

### Method 1: Browser Console
```javascript
localStorage.removeItem('debug-mode-enabled')
// Refresh the page
```

### Method 2: Debug Panel UI
1. Open debug panel (Cmd+Shift+D)
2. Click "Disable Debug Mode" in settings tab
3. Page will refresh

## Security Considerations

- Debug mode is **stored in localStorage** - persists across sessions
- Only affects the **current browser** - doesn't share with other users
- **No server-side changes** - purely client-side tool
- **Does not expose** authentication tokens or sensitive data in exports
- Sanitizes sensitive data before export (redacts tokens, passwords, etc.)

## For Support Teams

When asking users to enable debug mode:

1. Instruct them to click the menu icon 7 times quickly
2. Ask them to refresh the page
3. Have them press Cmd+Shift+D to open the panel
4. Guide them to click "Export Diagnostics"
5. Request they attach the downloaded JSON file to their support ticket

## Development vs Production

| Feature | Development | Production (Debug Mode Enabled) |
|---------|-------------|--------------------------------|
| Auto-enabled | ✅ Yes | ❌ No (manual activation) |
| Keyboard shortcut | ✅ Cmd+Shift+D | ✅ Cmd+Shift+D |
| State inspection | ✅ Full access | ✅ Full access |
| Export diagnostics | ✅ Yes | ✅ Yes |
| Performance impact | Minimal | Minimal |

## Implementation Details

### Files Modified

- `src/components/DebugPanel/useDebugPanel.ts` - Added localStorage persistence
- `src/components/DebugPanel/DebugPanelProvider.tsx` - Check localStorage flag
- `src/components/MainToolbar.jsx` - Secret click counter on menu icon

### LocalStorage Key

```javascript
'debug-mode-enabled' // Value: 'true' or absent
```

### Click Detection Algorithm

```javascript
// Tracks last 7 clicks within 3-second window
// Activates debug mode when threshold met
const CLICK_THRESHOLD = 7;
const TIME_WINDOW = 3000; // milliseconds
```

## Troubleshooting

### Debug panel won't open
- Ensure you refreshed after enabling debug mode
- Check browser console for errors
- Verify localStorage: `localStorage.getItem('debug-mode-enabled')`

### Secret trigger not working
- Click faster - all 7 clicks must be within 3 seconds
- Click directly on the menu icon (☰)
- Try using the console method instead

### Can't export diagnostics
- Check browser console for errors
- Ensure pop-up blocker isn't blocking download
- Try using "Save As" from debug panel menu

## Future Enhancements

- [ ] Remote log streaming to support dashboard
- [ ] Session replay functionality
- [ ] Network request recording/replay
- [ ] Screenshot capture with annotations
- [ ] Automatic error reporting
- [ ] Performance profiling with flame graphs
- [ ] GraphQL query inspector
- [ ] Real-time collaboration for support sessions
