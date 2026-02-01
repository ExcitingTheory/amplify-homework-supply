# LLM-as-a-Judge: Chat Tools Testing

**Status**: ✅ Ready for Use  
**Date**: February 1, 2026

## Overview

Automated testing system that uses **Claude 4.5** as an LLM judge to evaluate all 12 client-side CRUD chat tools. The system:

1. Sends prompts designed to trigger each tool
2. Captures the tool execution and responses
3. Uses Claude 4.5 to evaluate response quality
4. Generates comprehensive test reports

## Features

- ✅ **Automated Testing**: Tests all 12 CRUD tools automatically
- ✅ **LLM Evaluation**: Claude 4.5 judges response quality (0-100 score)
- ✅ **Resource Management**: Automatically creates and tracks test resources
- ✅ **Detailed Reports**: JSON reports with execution details
- ✅ **Categorized Results**: Groups by search, list, create, update, delete
- ✅ **Flexible Filtering**: Test individual tools or categories

## Prerequisites

### 1. Install Dependencies

```bash
npm install chalk@5.3.0 --save-dev
```

### 2. Set Environment Variables

```bash
export ANTHROPIC_API_KEY="your-anthropic-api-key"
```

Get your API key from: https://console.anthropic.com/

### 3. Start Development Server

The chat API must be running:

```bash
# Terminal 1: Start dev server
npm run dev

# OR Terminal 1: Start Storybook
npm run storybook
```

### 4. Configure AWS Credentials

Ensure AWS credentials are configured for Amplify:

```bash
aws configure
# OR use AWS SSO
aws sso login
```

## Usage

### Run All Tests

```bash
npx tsx scripts/test-chat-tools-llm-judge.ts
```

### Run with Verbose Output

```bash
npx tsx scripts/test-chat-tools-llm-judge.ts --verbose
```

### Test a Specific Tool

```bash
npx tsx scripts/test-chat-tools-llm-judge.ts --tool=search_content
npx tsx scripts/test-chat-tools-llm-judge.ts --tool=create_section
npx tsx scripts/test-chat-tools-llm-judge.ts --tool=list_units
```

### Add to package.json (Optional)

```json
{
  "scripts": {
    "test:chat-tools": "tsx scripts/test-chat-tools-llm-judge.ts",
    "test:chat-tools:verbose": "tsx scripts/test-chat-tools-llm-judge.ts --verbose",
    "test:chat-tools:tool": "tsx scripts/test-chat-tools-llm-judge.ts --tool"
  }
}
```

Then run:

```bash
npm run test:chat-tools
npm run test:chat-tools:verbose
npm run test:chat-tools:tool=create_unit
```

## Test Coverage

### 12 Client-Side CRUD Tools

**Search Tools** (2):
- `search_content` - Search vocabulary, files, questions
- `search_content_files` - Search files specifically

**List Tools** (3):
- `list_sections` - List all class sections
- `list_units` - List all learning units
- `get_unit_details` - Get details about a specific unit

**Create Tools** (5):
- `create_section` - Create new class section
- `create_unit` - Create new learning unit
- `create_vocabulary_word` - Add vocabulary word
- `create_question` - Add practice question
- `create_assignment` - Assign unit to section

**Update Tools** (2):
- `add_timer_to_unit` - Add time limit to unit
- `update_unit` - Update unit properties

**Delete Tools** (1):
- `delete_assignment` - Remove assignment

## How It Works

### 1. Test Definition

Each test includes:
```typescript
{
  toolName: 'create_section',
  category: 'create',
  description: 'Create a new class section',
  prompt: 'Create a section called "AI Test Section"',
  expectedToolCall: 'create_section',
  expectedFields: ['name', 'description'],
  successCriteria: (result) => result?.success === true
}
```

### 2. Execution Flow

```
User Prompt → Chat API → Tool Execution → Response
                ↓            ↓              ↓
         Claude 4.5 ← Evaluation ← Tool Results
                ↓
            Judgment (0-100 score)
                ↓
           Test Report
```

### 3. Claude 4.5 Evaluation

The judge evaluates:
- ✅ Was the correct tool called?
- ✅ Were parameters appropriate?
- ✅ Did execution succeed?
- ✅ Was response quality good?
- ✅ Any errors or issues?

Returns:
```json
{
  "score": 85,
  "reasoning": "Tool executed correctly with appropriate parameters",
  "toolExecuted": true,
  "responseQuality": "excellent",
  "issues": []
}
```

### 4. Resource Management

The system automatically:
- Creates prerequisite resources (units, sections) when needed
- Tracks created resource IDs
- Reuses resources for dependent tests
- Replaces placeholders like `{UNIT_ID}` in prompts

## Output Format

### Console Output

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

📁 Results by Category

SEARCH: 2/2 passed
LIST: 3/3 passed
CREATE: 4/5 passed
UPDATE: 2/2 passed
DELETE: 1/2 passed

✓ Report saved to: test-reports/chat-tools-test-2026-02-01T15-30-00.json
```

### JSON Report

Saved to `test-reports/chat-tools-test-{timestamp}.json`:

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
      "prompt": "Create a section called \"AI Test Section\"",
      "toolCalls": [...],
      "duration": 1234,
      "details": "Score: 88/100 - Tool executed correctly..."
    }
  ],
  "createdResources": {
    "units": ["unit-id-1", "unit-id-2"],
    "sections": ["section-id-1"],
    "words": [],
    "questions": [],
    "assignments": []
  }
}
```

## Customization

### Add New Tests

Edit `scripts/test-chat-tools-llm-judge.ts`:

```typescript
const TOOL_TESTS: ToolTest[] = [
  // ... existing tests
  {
    toolName: 'my_new_tool',
    category: 'create',
    description: 'Test my new tool',
    prompt: 'Do something with my new tool',
    expectedToolCall: 'my_new_tool',
    expectedFields: ['param1', 'param2'],
    successCriteria: (result) => result?.success === true,
  },
];
```

### Customize Judgment Criteria

Modify the `judgeResponse()` method:

```typescript
async judgeResponse(test: ToolTest, response: any): Promise<JudgeEvaluation> {
  const judgmentPrompt = `
    Evaluate this tool execution...
    
    Custom criteria:
    - Must complete in under 2 seconds
    - Must return specific data structure
    - Must handle edge cases
  `;
  // ...
}
```

### Adjust Pass Threshold

Change the passing score (default: 70):

```typescript
const passed = expectedToolCalled && judgment.score >= 80; // Stricter
```

## Troubleshooting

### Error: ANTHROPIC_API_KEY not set

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### Error: Chat API not responding

Ensure dev server or Storybook is running:
```bash
npm run dev
# OR
npm run storybook
```

### Error: AWS credentials not configured

```bash
aws configure
# OR
aws sso login
```

### Tests failing unexpectedly

1. Check backend is deployed:
   ```bash
   amplify status
   ```

2. Verify tools are registered in ChatSidebar:
   ```bash
   grep "clientSideToolNames" src/components/ChatSidebar.js
   ```

3. Run with verbose flag:
   ```bash
   npx tsx scripts/test-chat-tools-llm-judge.ts --verbose
   ```

### Rate limiting from Anthropic

The script includes 500ms delays between tests. Increase if needed:
```typescript
await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second
```

## Cost Estimation

### Anthropic API Costs

Claude 4.5 pricing (as of Feb 2026):
- Input: ~$3 per million tokens
- Output: ~$15 per million tokens

**Per test run (14 tests)**:
- Input tokens: ~200 per test = 2,800 total
- Output tokens: ~150 per test = 2,100 total
- **Cost per run**: ~$0.04

**Monthly continuous testing (10 runs/day)**:
- Cost: ~$12/month

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Test Chat Tools

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-chat-tools:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run chat tools tests
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: npm run test:chat-tools
      
      - name: Upload test reports
        uses: actions/upload-artifact@v3
        with:
          name: chat-tools-report
          path: test-reports/
```

## Best Practices

1. **Run regularly**: Test after CRUD tool changes
2. **Review failures**: Check LLM reasoning in reports
3. **Update prompts**: Keep test prompts realistic
4. **Monitor costs**: Track Anthropic API usage
5. **Version reports**: Keep historical test data
6. **Clean up resources**: Manually clean test data periodically

## Related Documentation

- [CHATBOT_TOOLS.md](./CHATBOT_TOOLS.md) - Tool implementation details
- [CLIENT_SIDE_TOOL_HANDLING.md](./CLIENT_SIDE_TOOL_HANDLING.md) - Technical implementation
- [API.md](./API.md) - Data models and GraphQL API

## Future Enhancements

- [ ] Parallel test execution
- [ ] Custom test suites
- [ ] Historical trend analysis
- [ ] Automatic cleanup of test resources
- [ ] Integration with Storybook tests
- [ ] Performance benchmarking
- [ ] Mock data generation
- [ ] Visual diff reports
- [ ] Slack/Discord notifications
- [ ] Multiple LLM judges (GPT-4, Gemini)
