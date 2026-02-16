# Discord Webhook Integration for Support Diagnostics

This guide explains how to set up Discord webhook integration to automatically receive diagnostic reports from users.

## Quick Start

### 1. Create Discord Webhook

1. Open your Discord server
2. Go to **Server Settings** → **Integrations** → **Webhooks**
3. Click **New Webhook** or **Create Webhook**
4. Configure the webhook:
   - **Name**: "Support Diagnostics Bot" (or your preference)
   - **Channel**: Select your support/diagnostics channel
   - **Avatar**: Optional custom bot avatar
5. Click **Copy Webhook URL**
6. Save the webhook

### 2. Configure Environment Variable

Add the webhook URL to your environment file:

**`.env.local`** (or `.env.production`):
```bash
NEXT_PUBLIC_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
```

⚠️ **Important**: The variable must start with `NEXT_PUBLIC_` to be accessible in the browser.

### 3. Test the Integration

**Option 1: Automated Test**
```javascript
// In browser console
import { testDiscordWebhook } from './src/utils/debug/discordWebhook';
testDiscordWebhook(); // Returns true if successful
```

**Option 2: Manual Test via Debug Panel**
1. Enable debug mode (click menu icon 7 times)
2. Refresh page
3. Press `Cmd+Shift+D` to open debug panel
4. Click "State" tab
5. Click the **Send** icon (📤)
6. Fill in description and contact
7. Click "Send to Support"
8. Check your Discord channel for the message

## How It Works

### User Experience

1. User encounters an issue
2. Support asks them to send diagnostics
3. User clicks menu icon 7 times → Debug mode enabled
4. User refreshes page
5. User presses `Cmd+Shift+D` → Debug panel opens
6. User clicks Send icon (📤) in State Inspector
7. User optionally adds description and contact info
8. Diagnostic snapshot sent to Discord

### What Gets Sent

Discord receives:
- **Embed Message** with summary:
  - Timestamp
  - Current route/page
  - Browser info
  - Number of components
  - Number of log entries
  - Error count (if any)
  - User-provided description
  - User contact info (if provided)

- **File Attachment** (if errors or many logs):
  - Full diagnostic JSON file
  - Sanitized to remove sensitive data

### Data Sanitization

Before sending, the system:
- ✅ Keeps: User ID, route, browser info, component tree, logs
- ❌ Removes: Auth tokens, session tokens, identityId
- 🔒 Redacts: Passwords, API keys, any field matching sensitive patterns

## Discord Message Format

```
🐛 Support Diagnostic Report

📊 System Information
Timestamp: 2/14/2026, 3:45:23 PM
Route: /unit/abc-123
Browser: Chrome 120.0.0.0
Components: 47
Log Entries: 234
Errors: 3 error(s) detected

👤 User Contact
user@example.com

❌ Recent Errors
1. Cannot read property 'data' of undefined...
2. Network request failed: 400 Bad Request...
3. [Context] User not authenticated, skip...
```

## Advanced Configuration

### Customize Bot Appearance

```typescript
import { sendToDiscord } from '@/utils/debug/discordWebhook';

sendToDiscord(
  { snapshot, description, userContact },
  {
    webhookUrl: process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL!,
    username: 'Custom Support Bot',
    avatarUrl: 'https://example.com/bot-avatar.png',
  }
);
```

### Override via localStorage (Testing)

For testing without rebuilding:

```javascript
// Browser console
localStorage.setItem('discord-webhook-url', 'https://discord.com/api/webhooks/...');
```

This overrides the environment variable for the current browser only.

### Check Configuration Status

```javascript
import { isDiscordWebhookConfigured } from '@/utils/debug/discordWebhook';

if (isDiscordWebhookConfigured()) {
  console.log('Discord integration enabled');
}
```

## Security Considerations

### ✅ Safe
- Webhook URL in `NEXT_PUBLIC_*` variables (client-accessible)
- Discord webhooks are rate-limited by Discord
- No authentication required (webhook URL is the auth)
- Data sanitization removes sensitive tokens

### ⚠️ Cautions
- **Do not** commit `.env.local` to git
- **Do not** share webhook URL publicly
- **Do** use Discord's IP whitelist if available
- **Do** monitor webhook usage for abuse

### 🔒 Best Practices
1. Use a dedicated Discord server/channel for diagnostics
2. Set up Discord notifications for new messages
3. Regularly review and clean up old diagnostic files
4. Rotate webhook URL if compromised
5. Add gitigure rule: `.env*.local`

## Troubleshooting

### Discord Not Receiving Messages

**Check 1: Environment Variable**
```javascript
// Browser console
console.log(process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL);
// Should output your webhook URL
```

**Check 2: Webhook Status**
```javascript
import { testDiscordWebhook } from '@/utils/debug/discordWebhook';
await testDiscordWebhook(); // Should return true
```

**Check 3: Discord Channel Permissions**
- Ensure webhook has permission to post in the channel
- Check Discord server status

**Check 4: Browser Console**
- Look for errors like CORS or network failures
- Discord webhooks should work from any origin

### Webhook URL Not Found

Error: `Discord webhook not configured`

**Solution**: Verify environment variable:
1. Check `.env.local` file exists
2. Variable starts with `NEXT_PUBLIC_`
3. Restart development server after adding
4. Clear Next.js cache: `rm -rf .next`

### Messages Sent But Not Visible

**Possible causes:**
1. Wrong channel selected in webhook config
2. Webhook deleted or disabled
3. Discord server issue
4. Rate limiting (max 30 requests per minute per webhook)

**Solution**: Recreate webhook or check Discord server settings

## Rate Limits

Discord webhook limits:
- **30 requests per minute** per webhook
- **2000 characters** per field
- **6000 characters** total embed description
- **10 MB** file attachment size

The integration automatically:
- Truncates long error messages
- Splits large diagnostics into separate messages
- Respects Discord's limits

## Production Deployment

### Environment Variables

**Vercel/Netlify:**
```bash
NEXT_PUBLIC_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

Add via dashboard:
- Vercel: Project Settings → Environment Variables
- Netlify: Site Configuration → Environment Variables

**AWS Amplify:**
```bash
amplify env add
# Add NEXT_PUBLIC_DISCORD_WEBHOOK_URL when prompted
```

**Docker:**
```dockerfile
ENV NEXT_PUBLIC_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Multiple Environments

Different webhooks for dev/staging/prod:

**`.env.development`**:
```bash
NEXT_PUBLIC_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/DEV_WEBHOOK
```

**`.env.production`**:
```bash
NEXT_PUBLIC_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/PROD_WEBHOOK
```

## Monitoring & Analytics

### Discord Setup

1. **Create channels**:
   - `#diagnostics-dev`
   - `#diagnostics-staging`
   - `#diagnostics-prod`

2. **Set up notifications**:
   - @mention support team on errors
   - Pin important diagnostics
   - Use Discord threads for follow-up

3. **Organize with webhooks**:
   - Different webhook per environment
   - Custom bot names (e.g., "Dev Bot", "Prod Bot")
   - Different avatar colors

### Support Workflow

1. User reports issue
2. Support asks for diagnostics
3. User sends via debug panel
4. Support receives in Discord
5. Support downloads JSON attachment
6. Support analyzes and responds
7. Issue tracked in Discord thread

## API Reference

### `sendToDiscord()`

```typescript
function sendToDiscord(
  report: DiagnosticReport,
  config: DiscordWebhookConfig
): Promise<{ success: boolean; error?: string }>

// Example
const result = await sendToDiscord(
  {
    snapshot: stateSnapshot,
    description: 'App crashed when clicking save',
    userContact: 'user@example.com',
  },
  {
    webhookUrl: process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL!,
  }
);
```

### `isDiscordWebhookConfigured()`

```typescript
function isDiscordWebhookConfigured(): boolean

// Example
if (isDiscordWebhookConfigured()) {
  // Show "Send to Support" button
}
```

### `testDiscordWebhook()`

```typescript
function testDiscordWebhook(webhookUrl?: string): Promise<boolean>

// Example
const isWorking = await testDiscordWebhook();
console.log(`Webhook status: ${isWorking ? 'OK' : 'Failed'}`);
```

## Example Discord Messages

### Success (No Errors)

```
🐛 Support Diagnostic Report
✅ System Status: OK

📊 System Information
Timestamp: 2/14/2026, 3:45:23 PM
Route: /workbook/unit-123
Browser: Chrome 120.0.0.0
Components: 47
Log Entries: 156

User submitted diagnostic report

👤 User Contact: jane@example.com
```

### With Errors

```
🐛 Support Diagnostic Report
⚠️ System Status: 3 Errors Detected

📊 System Information
Timestamp: 2/14/2026, 3:45:23 PM
Route: /workbook/unit-123
Browser: Chrome 120.0.0.0
Components: 47
Log Entries: 234
Errors: 3 error(s) detected

Save not working, grade lost

👤 User Contact: john@example.com

❌ Recent Errors
1. Cannot read property 'data' of undefined
2. Network request failed: 400 Bad Request
3. Authentication token expired

📎 Full diagnostic snapshot attached
[diagnostic-1708020323000.json]
```

## Support Team Guide

### When You Receive a Diagnostic

1. **Acknowledge receipt** (reply in Discord thread)
2. **Download JSON file** (if attached)
3. **Review error messages** (in embed)
4. **Check state snapshot** (in JSON file)
5. **Contact user** (use provided contact info)
6. **Reproduce issue** (use route + browser info)
7. **Create GitHub issue** (if bug found)
8. **Follow up** (via Discord thread)

### Analyzing JSON File

```javascript
// Load in browser
const diagnostic = await fetch('/path/to/diagnostic.json').then(r => r.json());

// Inspect state
console.log(diagnostic.state.auth);      // Auth context
console.log(diagnostic.state.files);     // Files context
console.log(diagnostic.state.unit);      // Unit context
console.log(diagnostic.errors);          // All errors
console.log(diagnostic.logEntries);      // All logs
console.log(diagnostic.componentTree);   // Component hierarchy
```

### Common Issues

| Symptom | Likely Cause | Check |
|---------|-------------|-------|
| Auth errors | Token expired | `diagnostic.state.auth.session` |
| File upload fails | S3 config | `diagnostic.state.files` |
| Grade not saving | Network/auth | `diagnostic.errors` + `diagnostic.logEntries` |
| UI not loading | Component crash | `diagnostic.componentTree` |
| Slow performance | Too many re-renders | `diagnostic.componentCount` |

## Future Enhancements

- [ ] Automatic error detection and alerts
- [ ] Integration with GitHub Issues
- [ ] Slack webhook support
- [ ] Real-time streaming logs
- [ ] Video/screenshot capture
- [ ] Session replay integration
- [ ] Sentiment analysis on user descriptions
- [ ] Auto-categorization of issues
