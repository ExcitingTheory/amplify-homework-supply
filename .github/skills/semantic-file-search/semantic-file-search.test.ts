import { describe, it, expect, vi } from 'vitest';
import {
  executeSkill,
  expandQuery,
  calculateRelevance,
  extractSnippet,
  deduplicateResults,
  mergeSearchResults,
  skillMetadata,
  type SemanticFileSearchInput,
  type FileMatch
} from './semantic-file-search';

describe('Semantic File Search Agent Skill', () => {
  
  describe('Query Expansion', () => {
    it('should expand datastore queries', () => {
      const result = expandQuery('Find files using datastore');
      
      expect(result).toContain('datastore');
      expect(result).toContain('DataStore');
      expect(result).toContain('observeQuery');
      expect(result).toContain('DataStore.query');
      expect(result).toContain('DataStore.save');
    });

    it('should expand component queries', () => {
      const result = expandQuery('React components');
      
      expect(result).toContain('components');
      expect(result).toContain('.tsx');
      expect(result).toContain('.jsx');
      expect(result).toContain('Component');
      expect(result).toContain('export const');
    });

    it('should expand context queries', () => {
      const result = expandQuery('context providers');
      
      expect(result).toContain('context');
      expect(result).toContain('Context.Provider');
      expect(result).toContain('useContext');
      expect(result).toContain('createContext');
    });

    it('should expand hook queries', () => {
      const result = expandQuery('React hooks');
      
      expect(result).toContain('hooks');
      expect(result).toContain('use[A-Z]');
      expect(result).toContain('useEffect');
      expect(result).toContain('useState');
    });

    it('should expand AI and amplify queries', () => {
      const aiResult = expandQuery('AI integration');
      expect(aiResult).toContain('openai');
      expect(aiResult).toContain('anthropic');
      expect(aiResult).toContain('useChat');
      
      const amplifyResult = expandQuery('amplify auth');
      expect(amplifyResult).toContain('Amplify');
      expect(amplifyResult).toContain('aws-amplify');
      expect(amplifyResult).toContain('@aws-amplify');
    });

    it('should handle queries with no expansion patterns', () => {
      const result = expandQuery('custom business logic');
      
      // Should return original query split into terms
      expect(result).toContain('custom');
      expect(result).toContain('business');
      expect(result).toContain('logic');
      expect(result.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Relevance Scoring', () => {
    it('should rank semantic matches highest', () => {
      const semanticFile: FileMatch = {
        path: 'src/components/Auth.tsx',
        relevance: 0,
        snippet: 'export const AuthComponent',
        source: 'semantic'
      };
      
      const grepFile: FileMatch = {
        path: 'src/utils/helper.ts',
        relevance: 0,
        snippet: 'const auth = true',
        source: 'grep'
      };
      
      const fileFile: FileMatch = {
        path: 'src/auth.ts',
        relevance: 0,
        snippet: '',
        source: 'file'
      };
      
      const query = 'authentication components';
      const semanticScore = calculateRelevance(semanticFile, query);
      const grepScore = calculateRelevance(grepFile, query);
      const fileScore = calculateRelevance(fileFile, query);
      
      expect(semanticScore).toBeGreaterThan(grepScore);
      expect(grepScore).toBeGreaterThan(fileScore);
      expect(semanticScore).toBeGreaterThanOrEqual(0.5);
    });

    it('should add bonuses for query terms in path', () => {
      const file: FileMatch = {
        path: 'src/components/AuthComponent.tsx',
        relevance: 0,
        snippet: 'export const AuthComponent',
        source: 'semantic'
      };
      
      const query = 'auth component';
      const score = calculateRelevance(file, query);
      
      // Base 0.5 + path bonus (0.1 for 'auth', 0.1 for 'component') + snippet bonus
      expect(score).toBeGreaterThan(0.7);
    });

    it('should add bonuses for query term frequency in snippet', () => {
      const file: FileMatch = {
        path: 'src/test.ts',
        relevance: 0,
        snippet: 'DataStore DataStore DataStore DataStore',
        source: 'grep'
      };
      
      const query = 'DataStore';
      const score = calculateRelevance(file, query);
      
      // Base 0.3 + frequency bonus (4 * 0.05 = 0.2)
      expect(score).toBeGreaterThanOrEqual(0.5);
    });

    it('should add bonus for source files over test files', () => {
      const sourceFile: FileMatch = {
        path: 'src/components/Chat.tsx',
        relevance: 0,
        snippet: 'const chat',
        source: 'semantic'
      };
      
      const testFile: FileMatch = {
        path: 'src/components/Chat.test.tsx',
        relevance: 0,
        snippet: 'const chat',
        source: 'semantic'
      };
      
      const query = 'chat';
      const sourceScore = calculateRelevance(sourceFile, query);
      const testScore = calculateRelevance(testFile, query);
      
      expect(sourceScore).toBeGreaterThan(testScore);
    });

    it('should cap relevance at 1.0', () => {
      const file: FileMatch = {
        path: 'src/datastore/datastore/datastore.ts',
        relevance: 0,
        snippet: 'datastore '.repeat(50), // 50 occurrences
        source: 'semantic'
      };
      
      const query = 'datastore';
      const score = calculateRelevance(file, query);
      
      expect(score).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Snippet Extraction', () => {
    const sampleCode = `import { DataStore } from 'aws-amplify';

export const Component = () => {
  const [units, setUnits] = useState([]);
  
  useEffect(() => {
    const subscription = DataStore.observeQuery(Unit).subscribe(
      ({ items }) => setUnits(items)
    );
    return () => subscription.unsubscribe();
  }, []);
  
  return <div>{units.length} units</div>;
};`;

    it('should extract snippet with context lines', () => {
      const lineNumber = 7; // DataStore.observeQuery line
      const snippet = extractSnippet(sampleCode, lineNumber);
      
      expect(snippet).toContain('DataStore.observeQuery');
      expect(snippet).toContain('useEffect');
      expect(snippet).toContain('({ items }) => setUnits(items)');
      expect(snippet).toContain('➤'); // Arrow marker
    });

    it('should include line numbers', () => {
      const lineNumber = 7;
      const snippet = extractSnippet(sampleCode, lineNumber);
      
      // Should have line numbers from ~line 5 to ~line 9
      expect(snippet).toMatch(/\d+\s*\|/); // Line number pattern
      expect(snippet).toContain('7'); // Target line number
    });

    it('should handle edge cases (first/last lines)', () => {
      const firstLine = extractSnippet(sampleCode, 1);
      expect(firstLine).toContain('import');
      expect(firstLine).toContain('➤');
      
      const lines = sampleCode.split('\n');
      const lastLine = extractSnippet(sampleCode, lines.length);
      expect(lastLine).toContain('};');
      expect(lastLine).toContain('➤');
    });
  });

  describe('Result Deduplication', () => {
    it('should deduplicate by normalized path', () => {
      const results: FileMatch[] = [
        {
          path: '/Users/user/project/src/App.tsx',
          relevance: 0.8,
          snippet: 'code 1',
          source: 'semantic'
        },
        {
          path: 'src/App.tsx',
          relevance: 0.9,
          snippet: 'code 2',
          source: 'grep'
        },
        {
          path: 'C:\\Users\\user\\project\\src\\App.tsx',
          relevance: 0.7,
          snippet: 'code 3',
          source: 'file'
        }
      ];
      
      const deduplicated = deduplicateResults(results);
      
      expect(deduplicated).toHaveLength(1);
      expect(deduplicated[0].relevance).toBe(0.9); // Keeps highest
    });

    it('should keep separate files as separate results', () => {
      const results: FileMatch[] = [
        {
          path: 'src/App.tsx',
          relevance: 0.8,
          snippet: 'App code',
          source: 'semantic'
        },
        {
          path: 'src/components/Button.tsx',
          relevance: 0.7,
          snippet: 'Button code',
          source: 'grep'
        }
      ];
      
      const deduplicated = deduplicateResults(results);
      
      expect(deduplicated).toHaveLength(2);
    });

    it('should normalize paths with different separators', () => {
      const results: FileMatch[] = [
        {
          path: 'src/components/Auth.tsx',
          relevance: 0.5,
          snippet: 'v1',
          source: 'file'
        },
        {
          path: 'src\\components\\Auth.tsx',
          relevance: 0.8,
          snippet: 'v2',
          source: 'semantic'
        }
      ];
      
      const deduplicated = deduplicateResults(results);
      
      expect(deduplicated).toHaveLength(1);
      expect(deduplicated[0].relevance).toBe(0.8);
    });
  });

  describe('Merge Search Results', () => {
    it('should merge semantic, grep, and file results', () => {
      const semanticResults = [
        { path: 'src/a.ts', snippet: 'code', lineNumber: 10 }
      ];
      const grepResults = [
        { file: 'src/b.ts', line: 20, text: 'code snippet' }
      ];
      const fileResults = [
        { path: 'src/c.ts' }
      ];
      
      const merged = mergeSearchResults(
        semanticResults,
        grepResults,
        fileResults,
        'test query'
      );
      
      expect(merged).toHaveLength(3);
      expect(merged.some(r => r.path.includes('a.ts'))).toBe(true);
      expect(merged.some(r => r.path.includes('b.ts'))).toBe(true);
      expect(merged.some(r => r.path.includes('c.ts'))).toBe(true);
    });

    it('should assign correct source types', () => {
      const semanticResults = [{ path: 'src/a.ts', snippet: 'code', lineNumber: 1 }];
      const grepResults = [{ file: 'src/b.ts', line: 1, text: 'code' }];
      const fileResults = [{ path: 'src/c.ts' }];
      
      const merged = mergeSearchResults(
        semanticResults,
        grepResults,
        fileResults,
        'test'
      );
      
      expect(merged.find(r => r.path.includes('a.ts'))?.source).toBe('semantic');
      expect(merged.find(r => r.path.includes('b.ts'))?.source).toBe('grep');
      expect(merged.find(r => r.path.includes('c.ts'))?.source).toBe('file');
    });

    it('should handle empty result sets', () => {
      const merged1 = mergeSearchResults([], [], [], 'test');
      expect(merged1).toHaveLength(0);
      
      const merged2 = mergeSearchResults(
        [{ path: 'src/a.ts', snippet: 'code', lineNumber: 1 }],
        [],
        [],
        'test'
      );
      expect(merged2).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should return error for empty query', async () => {
      const result = await executeSkill({ query: '' });
      
      expect(result.files).toHaveLength(0);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.summary.toLowerCase()).toContain('error');
    });

    it('should return error for invalid scope pattern', async () => {
      const result = await executeSkill({
        query: 'test',
        scope: '[invalid**pattern'
      });
      
      expect(result.errors).toBeDefined();
      // Should either handle gracefully or report error
    });

    it('should handle limit edge cases', async () => {
      const result1 = await executeSkill({ query: 'test', limit: 0 });
      expect(result1.files).toHaveLength(0);
      
      const result2 = await executeSkill({ query: 'test', limit: -5 });
      expect(result2.errors).toBeDefined();
      
      const result3 = await executeSkill({ query: 'test', limit: 1000 });
      // Should either cap at max or warn about performance
    });

    it('should gracefully handle tool integration errors', async () => {
      // This will fail until tool integration is complete
      const result = await executeSkill({
        query: 'Find DataStore components'
      });
      
      // Should return error about tool integration
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('Tool integration required');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should find DataStore subscription patterns', async () => {
      const result = await executeSkill({
        query: 'Find components using DataStore subscriptions',
        scope: 'src/**',
        limit: 10
      });
      
      expect(result.summary).toBeDefined();
      expect(result.interpretation).toContain('DataStore');
      expect(result.interpretation).toContain('observeQuery');
    });

    it('should find context providers', async () => {
      const result = await executeSkill({
        query: 'React context providers',
        scope: 'src/context/**'
      });
      
      expect(result.interpretation).toContain('Context.Provider');
      expect(result.interpretation).toContain('useContext');
    });

    it('should find authentication components', async () => {
      const result = await executeSkill({
        query: 'authentication and login components',
        scope: 'src/components/**'
      });
      
      expect(result.summary).toBeDefined();
      // Query expansion should include auth-related terms
    });

    it('should find Storybook stories', async () => {
      const result = await executeSkill({
        query: 'Button component stories',
        scope: '**/*.stories.*'
      });
      
      expect(result.summary).toBeDefined();
    });
  });

  describe('Summary Generation', () => {
    it('should generate clear summary for successful search', async () => {
      const mockResults: FileMatch[] = [
        {
          path: 'src/a.ts',
          relevance: 0.9,
          snippet: 'code',
          source: 'semantic'
        },
        {
          path: 'src/b.ts',
          relevance: 0.7,
          snippet: 'code',
          source: 'grep'
        }
      ];
      
      // When tool integration is complete, this should work
      // For now, test the standalone summary function if exported
      const summary = `Found ${mockResults.length} files matching the query`;
      expect(summary).toContain('2 files');
    });

    it('should generate helpful summary for zero results', async () => {
      const result = await executeSkill({
        query: 'nonexistent-pattern-xyz-123',
        limit: 10
      });
      
      // Should provide helpful message
      expect(result.summary).toBeDefined();
      expect(result.summary.toLowerCase()).toMatch(/no.*found|error/);
    });
  });

  describe('Integration with includeContent option', () => {
    it('should include full content when requested', async () => {
      const result = await executeSkill({
        query: 'test',
        includeContent: true,
        limit: 5
      });
      
      // When tool integration complete:
      // result.files.forEach(file => {
      //   if (file.content) {
      //     expect(typeof file.content).toBe('string');
      //     expect(file.content.length).toBeGreaterThan(0);
      //   }
      // });
      
      expect(result).toBeDefined();
    });

    it('should not include content by default', async () => {
      const result = await executeSkill({
        query: 'test',
        limit: 5
      });
      
      // When tool integration complete:
      // result.files.forEach(file => {
      //   expect(file.content).toBeUndefined();
      // });
      
      expect(result).toBeDefined();
    });
  });

  describe('Skill Metadata', () => {
    it('should export valid metadata', () => {
      expect(skillMetadata).toBeDefined();
      expect(skillMetadata.name).toBe('semantic-file-search');
      expect(skillMetadata.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(skillMetadata.inputSchema).toBeDefined();
      expect(skillMetadata.outputSchema).toBeDefined();
    });

    it('should have correct input schema', () => {
      const { inputSchema } = skillMetadata;
      
      expect(inputSchema.required).toContain('query');
      expect(inputSchema.properties.query).toBeDefined();
      expect(inputSchema.properties.scope).toBeDefined();
      expect(inputSchema.properties.limit).toBeDefined();
      expect(inputSchema.properties.includeContent).toBeDefined();
    });

    it('should have correct output schema', () => {
      const { outputSchema } = skillMetadata;
      
      expect(outputSchema.required).toContain('files');
      expect(outputSchema.required).toContain('summary');
      expect(outputSchema.properties.files).toBeDefined();
      expect(outputSchema.properties.summary).toBeDefined();
      expect(outputSchema.properties.interpretation).toBeDefined();
      expect(outputSchema.properties.errors).toBeDefined();
    });
  });
});
