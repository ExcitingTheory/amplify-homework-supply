# Troubleshooting Guide

This guide helps resolve common issues you might encounter while developing the Homework Supply application.

## 🔧 Development Environment Issues

### Node.js / npm Issues

#### Problem: `npm install` fails with permission errors
**Symptoms**: 
```
EACCES: permission denied
```

**Solutions**:
```bash
# Option 1: Use npm's built-in solution
npm config set prefix ~/.npm-global
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile

# Option 2: Use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node
nvm use node
```

#### Problem: Different Node.js versions causing issues
**Symptoms**:
- Dependency conflicts
- Build failures
- Runtime errors

**Solution**:
```bash
# Check current version
node --version

# Install and use correct version (v16+)
nvm install 16
nvm use 16

# Set as default
nvm alias default 16
```

### Next.js Issues

#### Problem: `npm run dev` fails to start
**Symptoms**:
```
Error: Cannot find module 'next/dist/...'
```

**Solutions**:
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Start development server
npm run dev
```

#### Problem: Port 3000 is already in use
**Symptoms**:
```
EADDRINUSE: address already in use :::3000
```

**Solutions**:
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or use a different port
npm run dev -- -p 3001
```

## ☁️ AWS Amplify Issues

### Authentication Problems

#### Problem: AWS SSO login failures
**Symptoms**:
- "Invalid credentials" errors
- SSO redirect loops
- Token expiration issues

**Solutions**:
1. **Check SSO URL**: Verify you're using the correct organization URL
2. **Clear browser cache**: SSO tokens can get cached incorrectly
3. **Re-configure AWS CLI**:
```bash
aws configure sso
# Follow prompts with correct information
```

#### Problem: `amplify configure` fails
**Symptoms**:
```
No credentials found
```

**Solutions**:
```bash
# Check AWS CLI configuration
aws configure list

# Reconfigure with correct profile
aws configure --profile default

# Or use SSO profile
aws configure sso --profile amplify-dev
export AWS_PROFILE=amplify-dev
```

### Amplify DataStore Issues

#### Problem: DataStore sync conflicts
**Symptoms**:
- Data not appearing in UI
- Sync errors in console
- Conflicting versions

**Solutions**:
```javascript
// Clear DataStore and re-sync
import { DataStore } from 'aws-amplify';

await DataStore.clear();
await DataStore.start();
```

#### Problem: GraphQL schema conflicts
**Symptoms**:
```
Schema validation failed
```

**Solutions**:
```bash
# Pull latest schema
amplify pull

# If conflicts persist, reset local environment
amplify env checkout dev --restore
```

### File Upload Issues

#### Problem: S3 upload permissions denied
**Symptoms**:
```
Access Denied (S3)
```

**Solutions**:
1. **Check authentication**: Ensure user is logged in
2. **Verify file size**: Check if file exceeds limits
3. **Check file type**: Ensure MIME type is allowed

```javascript
// Verify auth status before upload
import { Auth } from 'aws-amplify';

try {
  const user = await Auth.currentAuthenticatedUser();
  // Proceed with upload
} catch (error) {
  // Redirect to login
}
```

## 🧪 Testing Issues

### Cypress Problems

#### Problem: Cypress tests fail to run
**Symptoms**:
- Browser doesn't open
- Connection refused errors

**Solutions**:
```bash
# Ensure app is running first
npm run dev

# In another terminal, run Cypress
npm run cypress:open

# If still failing, try headless mode
npx cypress run
```

#### Problem: Test failures due to timing
**Symptoms**:
- Intermittent test failures
- "Element not found" errors

**Solutions**:
```javascript
// Use proper waits instead of fixed delays
cy.wait('@apiCall'); // Wait for API call
cy.get('[data-testid="element"]').should('be.visible');

// Instead of
cy.wait(5000); // Don't use fixed waits
```

## 🎨 UI/UX Issues

### Material-UI Problems

#### Problem: Styles not applying correctly
**Symptoms**:
- Components look unstyled
- Theme not working

**Solutions**:
1. **Check emotion cache**:
```javascript
// Verify _document.js has emotion setup
import createEmotionCache from '../src/createEmotionCache';
```

2. **Clear browser cache**: Force refresh (Cmd+Shift+R / Ctrl+Shift+R)

#### Problem: Mobile responsive issues
**Symptoms**:
- Layout breaks on mobile
- Components overflow

**Solutions**:
```javascript
// Use Material-UI breakpoints
const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

// Apply conditional styling
<Box sx={{ 
  width: isMobile ? '100%' : '50%',
  padding: isMobile ? 1 : 2 
}}>
```

### Performance Issues

#### Problem: Slow page loads
**Symptoms**:
- Long initial load times
- Laggy interactions

**Solutions**:
1. **Check bundle size**:
```bash
npm run build
npm run start
# Check build output for large chunks
```

2. **Optimize imports**:
```javascript
// Instead of
import * as MUI from '@mui/material';

// Use specific imports
import { Button, TextField } from '@mui/material';
```

## 🔍 Debugging Techniques

### Browser Developer Tools

#### React Developer Tools
1. Install React DevTools browser extension
2. Use Components tab to inspect state/props
3. Use Profiler to identify performance issues

#### Network Tab Debugging
- Check for failed API calls
- Verify request/response data
- Monitor file upload progress

### Console Logging

```javascript
// Structured logging for debugging
console.group('Component Mount');
console.log('Props:', props);
console.log('State:', state);
console.groupEnd();

// Use different log levels
console.error('Critical error:', error);
console.warn('Warning message');
console.info('Info message');
console.debug('Debug details');
```

### AWS CloudWatch Logs

```bash
# View Lambda function logs
amplify console api
# Navigate to Lambda functions in AWS Console
# Check CloudWatch logs for errors
```

## 📱 Mobile Development Issues

### iOS Safari Problems

#### Problem: Touch events not working
**Symptoms**:
- Buttons don't respond to touch
- Scroll issues

**Solutions**:
```css
/* Add to CSS */
button {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
```

#### Problem: File upload issues on mobile
**Symptoms**:
- File picker doesn't open
- Upload fails silently

**Solutions**:
```javascript
// Use proper input attributes
<input
  type="file"
  accept="image/*,audio/*"
  capture="environment" // For camera on mobile
  onChange={handleFileUpload}
/>
```

### Android Chrome Issues

#### Problem: Audio playback problems
**Symptoms**:
- Audio files won't play
- Playback controls don't work

**Solutions**:
```javascript
// Require user interaction for audio
const playAudio = async () => {
  try {
    await audioElement.play();
  } catch (error) {
    // Handle autoplay policy restrictions
    console.warn('Autoplay prevented:', error);
  }
};
```

## 🔄 Data Issues

### Common Data Problems

#### Problem: Stale data in UI
**Symptoms**:
- UI shows old information
- Changes not reflecting

**Solutions**:
```javascript
// Force refresh from server
import { DataStore } from 'aws-amplify';

const refreshData = async () => {
  await DataStore.clear();
  // Re-fetch data
  const freshData = await DataStore.query(Model);
  setState(freshData);
};
```

#### Problem: Duplicate records
**Symptoms**:
- Multiple identical records
- Sync conflicts

**Solutions**:
1. **Check for duplicate saves**:
```javascript
// Use upsert pattern
const saveRecord = async (data) => {
  const existing = await DataStore.query(Model, data.id);
  if (existing) {
    await DataStore.save(Model.copyOf(existing, updated => {
      // Update fields
    }));
  } else {
    await DataStore.save(new Model(data));
  }
};
```

## 🚨 Emergency Procedures

### Development Environment Reset

If your development environment is completely broken:

```bash
# 1. Clean everything
rm -rf node_modules package-lock.json .next

# 2. Reset Amplify
amplify env checkout dev --restore

# 3. Fresh install
npm install

# 4. Pull backend
amplify pull

# 5. Start fresh
npm run dev
```

### Production Issues

If production is down:

1. **Check AWS Console**: Look for service outages
2. **Review CloudWatch**: Check error logs
3. **Rollback if necessary**: 
```bash
amplify env checkout previous-env
amplify push
```

### Data Recovery

If data is lost or corrupted:

1. **Check DynamoDB backups** in AWS Console
2. **Review CloudTrail logs** for data changes
3. **Contact AWS support** if needed

## 📞 Getting Help

### Internal Resources
1. **Team Slack/Chat**: For quick questions
2. **Code Reviews**: Get help through PRs
3. **Documentation**: Check existing docs first
4. **Team Lead**: Escalate complex issues

### External Resources
1. **AWS Amplify Docs**: https://docs.amplify.aws/
2. **Next.js Docs**: https://nextjs.org/docs
3. **Material-UI Docs**: https://mui.com/
4. **Stack Overflow**: Search for specific errors

### When to Escalate
- Security-related issues
- Production outages
- Data corruption
- AWS billing concerns
- Authentication problems affecting multiple users

## 🔍 Error Message Decoder

### Common Error Patterns

#### `Module not found: Can't resolve`
**Cause**: Missing dependency or incorrect import path
**Fix**: Check import paths, install missing packages

#### `Cannot read property 'X' of undefined`
**Cause**: Trying to access property on null/undefined object
**Fix**: Add null checks or optional chaining

#### `Network Error` in API calls
**Cause**: AWS service issues, authentication problems, or network connectivity
**Fix**: Check AWS status, verify credentials, test network connection

#### `DataStore sync error`
**Cause**: Schema conflicts or network issues
**Fix**: Clear DataStore, check internet connection, verify schema

---

**Remember**: When in doubt, don't hesitate to ask for help! The team is here to support you. 🚀

*Last Updated: November 30, 2024*