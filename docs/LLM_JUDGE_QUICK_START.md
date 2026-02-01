# Quick Start: LLM-as-a-Judge Chat Tools Testing

This guide gets you testing chat tools in under 5 minutes.

## 1. Install Dependencies (1 minute)

```bash
# Install chalk for colored output
npm install chalk@5.3.0 --save-dev
```

## 2. Set API Key (30 seconds)

Get your Anthropic API key from: https://console.anthropic.com/

```bash
export ANTHROPIC_API_KEY="sk-ant-api03-..."
```

Or add to `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

## 3. Start Development Server (1 minute)

```bash
# Option A: Start Next.js dev server
npm run dev

# Option B: Start Storybook (if testing in isolation)
npm run storybook
```

Wait for the server to start (usually at http://localhost:3000 or http://localhost:6006).

## 4. Run Tests (2-3 minutes)

```bash
npx tsx scripts/test-chat-tools-llm-judge.ts
```

You'll see output like:

```
🤖 LLM-as-a-Judge: Chat Tools Testing

Using Claude 4.5 to evaluate tool execution quality

Running 14 tests...

📋 Testing: search_content
   Search for vocabulary words about colors
   ✓ PASSED (92/100)

📋 Testing: create_section
   Create a new class section
   ✓ PASSED (88/100)

...

📊 Test Summary

Total Tests: 14
Passed: 12
Failed: 2
Pass Rate: 85.7%
```

## That's It! ✅

Your test report is saved to `test-reports/chat-tools-test-{timestamp}.json`

## Next Steps

### Run Specific Tools

Test just one tool:
```bash
npx tsx scripts/test-chat-tools-llm-judge.ts --tool=create_section
```

### Verbose Output

See detailed execution logs:
```bash
npx tsx scripts/test-chat-tools-llm-judge.ts --verbose
```

### Add to package.json

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test:chat": "tsx scripts/test-chat-tools-llm-judge.ts",
    "test:chat:verbose": "tsx scripts/test-chat-tools-llm-judge.ts --verbose",
    "test:chat:tool": "tsx scripts/test-chat-tools-llm-judge.ts --tool"
  }
}
```

Then use:
```bash
npm run test:chat
npm run test:chat:verbose
npm run test:chat:tool=create_unit
```

### Review Test Reports

```bash
# View latest report
cat test-reports/chat-tools-test-*.json | tail -n 1 | jq

# Count by status
jq '.results | group_by(.passed) | map({passed: .[0].passed, count: length})' test-reports/chat-tools-test-*.json
```

## Common Issues

### ❌ "ANTHROPIC_API_KEY not set"

**Solution**: Export the environment variable:
```bash
export ANTHROPIC_API_KEY="your-key-here"
```

### ❌ "Error connecting to chat API"

**Solution**: Make sure dev server is running:
```bash
npm run dev
```

### ❌ "AWS credentials not configured"

**Solution**: Configure AWS CLI:
```bash
aws configure
# OR
aws sso login
```

### ❌ Tests timing out

**Solution**: Increase timeout or check server is responsive:
```bash
curl http://localhost:3000/api/health
```

## Understanding Results

### Passing Score

- **90-100**: Excellent - Tool works perfectly
- **70-89**: Good - Tool works with minor issues
- **50-69**: Fair - Tool has problems
- **0-49**: Poor - Tool failed

Passing threshold is **70** by default.

### Test Categories

- **SEARCH**: `search_content`, `search_content_files`
- **LIST**: `list_sections`, `list_units`, `get_unit_details`
- **CREATE**: `create_section`, `create_unit`, `create_vocabulary_word`, `create_question`, `create_assignment`
- **UPDATE**: `add_timer_to_unit`, `update_unit`
- **DELETE**: `delete_assignment`

## Example Test Report

```json
{
  "timestamp": "2026-02-01T15:30:00.000Z",
  "summary": {
    "total": 14,
    "passed": 12,
    "failed": 2,
    "passRate": "85.7%"
  },
  "results": [
    {
      "toolName": "create_section",
      "passed": true,
      "prompt": "Create a section called \"AI Test Section\" with description \"Created by automated testing\"",
      "duration": 1234,
      "details": "Score: 88/100 - Tool executed correctly with appropriate parameters. Section created successfully."
    }
  ]
}
```

## What Gets Tested

Each test verifies:

1. ✅ Correct tool is called
2. ✅ Parameters are valid and appropriate
3. ✅ Tool executes without errors
4. ✅ Response contains expected data
5. ✅ Response format is correct

## Cost Estimate

Running all 14 tests costs approximately **$0.04** (4 cents) using Claude 4.5.

Monthly continuous testing (10 runs/day) ≈ **$12/month**

## Need Help?

- 📖 Full documentation: [LLM_JUDGE_TESTING.md](../docs/LLM_JUDGE_TESTING.md)
- 🛠️ Tool documentation: [CHATBOT_TOOLS.md](../docs/CHATBOT_TOOLS.md)
- 💬 Technical details: [CLIENT_SIDE_TOOL_HANDLING.md](../docs/CLIENT_SIDE_TOOL_HANDLING.md)
