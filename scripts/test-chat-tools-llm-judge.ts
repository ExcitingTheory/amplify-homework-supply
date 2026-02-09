#!/usr/bin/env tsx
/**
 * LLM-as-a-Judge: Chat Tools Testing System
 * 
 * Uses Claude 4.5 to automatically test all chat tool implementations:
 * - Sends prompts that should trigger each tool
 * - Validates tool execution and responses
 * - Generates a comprehensive test report
 * 
 * Prerequisites:
 * - ANTHROPIC_API_KEY environment variable set
 * - Chat API running (dev server or Storybook)
 * - AWS credentials configured for Amplify
 * 
 * Usage:
 *   npx tsx scripts/test-chat-tools-llm-judge.ts
 *   npx tsx scripts/test-chat-tools-llm-judge.ts --verbose
 *   npx tsx scripts/test-chat-tools-llm-judge.ts --tool search_content
 */

import Anthropic from '@anthropic-ai/sdk';
import { post } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

// Initialize Amplify
Amplify.configure(outputs);

interface ToolTest {
  toolName: string;
  description: string;
  prompt: string;
  expectedToolCall: string;
  expectedFields?: string[];
  successCriteria: (result: any) => boolean;
  category: 'search' | 'create' | 'list' | 'update' | 'delete';
}

interface TestResult {
  toolName: string;
  passed: boolean;
  prompt: string;
  response?: any;
  toolCalls?: any[];
  error?: string;
  duration: number;
  details?: string;
}

interface JudgeEvaluation {
  score: number; // 0-100
  reasoning: string;
  toolExecuted: boolean;
  responseQuality: 'excellent' | 'good' | 'fair' | 'poor';
  issues: string[];
}

// Test definitions for all 12 client-side CRUD tools
const TOOL_TESTS: ToolTest[] = [
  // Search Tools
  {
    toolName: 'search_content',
    category: 'search',
    description: 'Search for vocabulary words about colors',
    prompt: 'Find all vocabulary words about colors',
    expectedToolCall: 'search_content',
    expectedFields: ['query', 'type', 'limit'],
    successCriteria: (result) => result?.success === true && Array.isArray(result?.results),
  },
  {
    toolName: 'search_content_files',
    category: 'search',
    description: 'Search for files about grammar',
    prompt: 'Search for files related to Japanese grammar',
    expectedToolCall: 'search_content',
    expectedFields: ['query', 'type'],
    successCriteria: (result) => result?.success === true,
  },

  // List Tools
  {
    toolName: 'list_sections',
    category: 'list',
    description: 'List all class sections',
    prompt: 'Show me all class sections',
    expectedToolCall: 'list_sections',
    successCriteria: (result) => result?.success === true && Array.isArray(result?.sections),
  },
  {
    toolName: 'list_units',
    category: 'list',
    description: 'List all learning units',
    prompt: 'List all available units',
    expectedToolCall: 'list_units',
    successCriteria: (result) => result?.success === true && Array.isArray(result?.units),
  },
  {
    toolName: 'get_unit_details',
    category: 'list',
    description: 'Get details about a specific unit (requires existing unit ID)',
    prompt: 'Can you tell me the details about unit {UNIT_ID}?',
    expectedToolCall: 'get_unit_details',
    expectedFields: ['unitId'],
    successCriteria: (result) => result?.success === true || result?.error?.includes('not found'),
  },

  // Create Tools
  {
    toolName: 'create_section',
    category: 'create',
    description: 'Create a new class section',
    prompt: 'Create a section called "AI Test Section" with description "Created by automated testing"',
    expectedToolCall: 'create_section',
    expectedFields: ['name', 'description'],
    successCriteria: (result) => result?.success === true && result?.section?.name === 'AI Test Section',
  },
  {
    toolName: 'create_unit',
    category: 'create',
    description: 'Create a new learning unit',
    prompt: 'Create a unit called "LLM Test Unit" with description "Testing automated tools"',
    expectedToolCall: 'create_unit',
    expectedFields: ['name', 'description'],
    successCriteria: (result) => result?.success === true && result?.unit?.name === 'LLM Test Unit',
  },
  {
    toolName: 'create_vocabulary_word',
    category: 'create',
    description: 'Add a vocabulary word',
    prompt: 'Add a vocabulary word: "テスト" (phonetic: tesuto) means "test"',
    expectedToolCall: 'create_vocabulary_word',
    expectedFields: ['phrase', 'definition'],
    successCriteria: (result) => result?.success === true && result?.word?.phrase === 'テスト',
  },
  {
    toolName: 'create_question',
    category: 'create',
    description: 'Create a practice question',
    prompt: 'Create a question: "What does ありがとう mean?" with answer "thank you"',
    expectedToolCall: 'create_question',
    expectedFields: ['prompt', 'answer'],
    successCriteria: (result) => result?.success === true && result?.question?.answer?.toLowerCase().includes('thank'),
  },

  // Update Tools
  {
    toolName: 'add_timer_to_unit',
    category: 'update',
    description: 'Add a timer to a unit (requires existing unit)',
    prompt: 'Add a 30 minute timer to unit {UNIT_ID}',
    expectedToolCall: 'add_timer_to_unit',
    expectedFields: ['unitId', 'seconds'],
    successCriteria: (result) => result?.success === true || result?.error?.includes('not found'),
  },
  {
    toolName: 'update_unit',
    category: 'update',
    description: 'Update unit properties (requires existing unit)',
    prompt: 'Update unit {UNIT_ID} with description "Updated by LLM test"',
    expectedToolCall: 'update_unit',
    expectedFields: ['unitId'],
    successCriteria: (result) => result?.success === true || result?.error?.includes('not found'),
  },

  // Assignment Tools
  {
    toolName: 'create_assignment',
    category: 'create',
    description: 'Create an assignment (requires unit and section)',
    prompt: 'Assign unit {UNIT_ID} to section {SECTION_ID} due on 2026-12-31',
    expectedToolCall: 'create_assignment',
    expectedFields: ['unitId', 'sectionId', 'dueDate'],
    successCriteria: (result) => result?.success === true || result?.error?.includes('not found'),
  },
  {
    toolName: 'delete_assignment',
    category: 'delete',
    description: 'Delete an assignment (requires assignment ID)',
    prompt: 'Delete assignment {ASSIGNMENT_ID}',
    expectedToolCall: 'delete_assignment',
    expectedFields: ['assignmentId'],
    successCriteria: (result) => result?.success === true || result?.error?.includes('not found'),
  },
];

class LLMJudge {
  private anthropic: Anthropic;
  private verbose: boolean;
  private results: TestResult[] = [];
  private createdResources: { units: string[], sections: string[], words: string[], questions: string[], assignments: string[] } = {
    units: [],
    sections: [],
    words: [],
    questions: [],
    assignments: [],
  };

  constructor(verbose = false) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable not set');
    }
    this.anthropic = new Anthropic({ apiKey });
    this.verbose = verbose;
  }

  /**
   * Send a chat message and get streaming response with tool calls
   */
  async sendChatMessage(prompt: string, context?: any): Promise<any> {
    const startTime = Date.now();

    try {
      const restOperation = post({
        apiName: 'completions',
        path: '/chat',
        options: {
          body: {
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            context: context || {},
          },
        },
      });

      const response = await restOperation.response;
      const duration = Date.now() - startTime;

      // Parse SSE stream
      const reader = (response.body as unknown as ReadableStream).getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const chunks: any[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const chunk = JSON.parse(data);
              chunks.push(chunk);
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      return { chunks, duration };
    } catch (error) {
      console.error(chalk.red('Error sending chat message:'), error);
      throw error;
    }
  }

  /**
   * Use Claude 4.5 to judge the quality of a tool execution
   */
  async judgeResponse(test: ToolTest, response: any): Promise<JudgeEvaluation> {
    const judgmentPrompt = `You are an expert AI quality evaluator. Analyze this chat tool execution and provide a detailed evaluation.

Tool Test Details:
- Tool Name: ${test.toolName}
- Description: ${test.description}
- User Prompt: "${test.prompt}"
- Expected Tool: ${test.expectedToolCall}
${test.expectedFields ? `- Expected Fields: ${test.expectedFields.join(', ')}` : ''}

Response Data:
${JSON.stringify(response, null, 2)}

Evaluate the following:
1. Was the correct tool called?
2. Were the tool parameters appropriate?
3. Did the tool execute successfully?
4. Was the response quality good?
5. Any issues or errors?

Provide your evaluation in JSON format:
{
  "score": <0-100>,
  "reasoning": "<detailed explanation>",
  "toolExecuted": <true/false>,
  "responseQuality": "<excellent|good|fair|poor>",
  "issues": ["<issue 1>", "<issue 2>"]
}`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: judgmentPrompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        return {
          score: 0,
          reasoning: 'Failed to parse judgment',
          toolExecuted: false,
          responseQuality: 'poor',
          issues: ['Could not parse LLM response'],
        };
      }
    } catch (error) {
      console.error(chalk.red('Error getting judgment:'), error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        score: 0,
        reasoning: `Error: ${errorMessage}`,
        toolExecuted: false,
        responseQuality: 'poor',
        issues: [errorMessage],
      };
    }
  }

  /**
   * Extract tool calls from response chunks
   */
  extractToolCalls(chunks: any[]): any[] {
    const toolCalls: any[] = [];
    
    for (const chunk of chunks) {
      if (chunk.type === 'tool-call-delta' || chunk.type?.startsWith('tool-')) {
        toolCalls.push(chunk);
      }
    }

    return toolCalls;
  }

  /**
   * Replace placeholders in prompt with actual IDs
   */
  async preparePrompt(prompt: string): Promise<string> {
    let preparedPrompt = prompt;

    // Replace {UNIT_ID} with a created unit or create one
    if (prompt.includes('{UNIT_ID}')) {
      if (this.createdResources.units.length === 0) {
        const createResult = await this.sendChatMessage('Create a unit called "Test Reference Unit"');
        const unitId = this.extractResourceId(createResult.chunks, 'unit');
        if (unitId) this.createdResources.units.push(unitId);
      }
      preparedPrompt = preparedPrompt.replace('{UNIT_ID}', this.createdResources.units[0] || 'test-unit-id');
    }

    // Replace {SECTION_ID}
    if (prompt.includes('{SECTION_ID}')) {
      if (this.createdResources.sections.length === 0) {
        const createResult = await this.sendChatMessage('Create a section called "Test Reference Section"');
        const sectionId = this.extractResourceId(createResult.chunks, 'section');
        if (sectionId) this.createdResources.sections.push(sectionId);
      }
      preparedPrompt = preparedPrompt.replace('{SECTION_ID}', this.createdResources.sections[0] || 'test-section-id');
    }

    // Replace {ASSIGNMENT_ID}
    if (prompt.includes('{ASSIGNMENT_ID}')) {
      preparedPrompt = preparedPrompt.replace('{ASSIGNMENT_ID}', this.createdResources.assignments[0] || 'test-assignment-id');
    }

    return preparedPrompt;
  }

  /**
   * Extract resource ID from response chunks
   */
  extractResourceId(chunks: any[], resourceType: string): string | null {
    for (const chunk of chunks) {
      if (chunk.type === 'tool-result' && chunk.result) {
        const result = typeof chunk.result === 'string' ? JSON.parse(chunk.result) : chunk.result;
        if (result?.[resourceType]?.id) {
          return result[resourceType].id;
        }
      }
    }
    return null;
  }

  /**
   * Run a single tool test
   */
  async runTest(test: ToolTest): Promise<TestResult> {
    console.log(chalk.blue(`\n📋 Testing: ${test.toolName}`));
    console.log(chalk.gray(`   ${test.description}`));

    const preparedPrompt = await this.preparePrompt(test.prompt);
    
    if (this.verbose) {
      console.log(chalk.gray(`   Prompt: "${preparedPrompt}"`));
    }

    try {
      const { chunks, duration } = await this.sendChatMessage(preparedPrompt);
      const toolCalls = this.extractToolCalls(chunks);

      if (this.verbose) {
        console.log(chalk.gray(`   Tool calls found: ${toolCalls.length}`));
        console.log(chalk.gray(`   Duration: ${duration}ms`));
      }

      // Check if expected tool was called
      const expectedToolCalled = toolCalls.some(
        (call) => call.toolName === test.expectedToolCall || call.type?.includes(test.expectedToolCall)
      );

      // Get judgment from Claude
      const judgment = await this.judgeResponse(test, { chunks, toolCalls });

      const passed = expectedToolCalled && judgment.score >= 70;

      const result: TestResult = {
        toolName: test.toolName,
        passed,
        prompt: preparedPrompt,
        response: chunks,
        toolCalls,
        duration,
        details: `Score: ${judgment.score}/100 - ${judgment.reasoning}`,
      };

      if (passed) {
        console.log(chalk.green(`   ✓ PASSED (${judgment.score}/100)`));
      } else {
        console.log(chalk.red(`   ✗ FAILED (${judgment.score}/100)`));
        if (judgment.issues.length > 0) {
          judgment.issues.forEach((issue) => {
            console.log(chalk.yellow(`     - ${issue}`));
          });
        }
      }

      // Store created resource IDs
      if (passed && test.category === 'create') {
        const resourceId = this.extractResourceId(chunks, test.toolName.replace('create_', ''));
        if (resourceId) {
          const resourceType = test.toolName.replace('create_', '') + 's' as keyof typeof this.createdResources;
          if (this.createdResources[resourceType]) {
            this.createdResources[resourceType].push(resourceId);
          }
        }
      }

      this.results.push(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(chalk.red(`   ✗ ERROR: ${errorMessage}`));
      
      const result: TestResult = {
        toolName: test.toolName,
        passed: false,
        prompt: preparedPrompt,
        error: errorMessage,
        duration: 0,
      };

      this.results.push(result);
      return result;
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(filterTool?: string): Promise<void> {
    console.log(chalk.bold.cyan('\n🤖 LLM-as-a-Judge: Chat Tools Testing\n'));
    console.log(chalk.gray('Using Claude 4.5 to evaluate tool execution quality\n'));

    const testsToRun = filterTool
      ? TOOL_TESTS.filter((t) => t.toolName === filterTool)
      : TOOL_TESTS;

    console.log(chalk.white(`Running ${testsToRun.length} tests...\n`));

    for (const test of testsToRun) {
      await this.runTest(test);
      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    this.printSummary();
    this.saveReport();
  }

  /**
   * Print test summary
   */
  printSummary(): void {
    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const total = this.results.length;
    const passRate = ((passed / total) * 100).toFixed(1);

    console.log(chalk.bold.cyan('\n\n📊 Test Summary\n'));
    console.log(chalk.white(`Total Tests: ${total}`));
    console.log(chalk.green(`Passed: ${passed}`));
    console.log(chalk.red(`Failed: ${failed}`));
    console.log(chalk.yellow(`Pass Rate: ${passRate}%`));

    // Group by category
    console.log(chalk.bold.cyan('\n\n📁 Results by Category\n'));
    const categories = ['search', 'list', 'create', 'update', 'delete'];
    
    categories.forEach((category) => {
      const categoryTests = TOOL_TESTS.filter((t) => t.category === category);
      const categoryResults = this.results.filter((r) =>
        categoryTests.some((t) => t.toolName === r.toolName)
      );
      const categoryPassed = categoryResults.filter((r) => r.passed).length;
      
      console.log(
        chalk.white(
          `${category.toUpperCase()}: ${categoryPassed}/${categoryResults.length} passed`
        )
      );
    });
  }

  /**
   * Save detailed report to file
   */
  saveReport(): void {
    const reportDir = path.join(process.cwd(), 'test-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const reportPath = path.join(reportDir, `chat-tools-test-${timestamp}.json`);

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed: this.results.filter((r) => r.passed).length,
        failed: this.results.filter((r) => !r.passed).length,
        passRate: ((this.results.filter((r) => r.passed).length / this.results.length) * 100).toFixed(1) + '%',
      },
      results: this.results,
      createdResources: this.createdResources,
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(chalk.green(`\n\n✓ Report saved to: ${reportPath}`));
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const toolFilter = args.find((arg) => arg.startsWith('--tool='))?.split('=')[1];

  const judge = new LLMJudge(verbose);
  await judge.runAllTests(toolFilter);
}

main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
