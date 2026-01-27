/**
 * Semantic File Search Agent Skill
 * 
 * Natural language file discovery with relevance ranking and snippet extraction.
 * Combines semantic_search, grep_search, and file_search for comprehensive code exploration.
 * 
 * @module agent-skills/semantic-file-search
 */

export interface SemanticFileSearchInput {
  /** Natural language query (e.g., "Find components using DataStore subscriptions") */
  query: string;
  /** Optional scope filter (e.g., "src/components/**") */
  scope?: string;
  /** Maximum results to return (default: 10) */
  limit?: number;
  /** Include file contents in results (default: false for performance) */
  includeContent?: boolean;
}

export interface FileMatch {
  /** Absolute file path */
  path: string;
  /** Relevance score (0-1, higher is better) */
  relevance: number;
  /** Code snippet showing match context */
  snippet: string;
  /** Line number where match was found */
  lineNumber?: number;
  /** Match source (semantic, grep, or file) */
  source: 'semantic' | 'grep' | 'file';
  /** Full file content (if includeContent=true) */
  content?: string;
}

export interface SemanticFileSearchOutput {
  /** Array of matching files ranked by relevance */
  files: FileMatch[];
  /** Human-readable summary */
  summary: string;
  /** Query interpretation/expansion */
  interpretation?: string;
  /** Errors encountered during search */
  errors?: string[];
}

/**
 * Normalize file path for deduplication
 * - Remove workspace folder prefix if present
 * - Normalize slashes
 */
export function normalizePath(filePath: string): string {
  // Remove common workspace prefixes - be more aggressive
  let normalized = filePath
    .replace(/\\/g, '/') // Normalize slashes first
    .replace(/^\/Users\/[^/]+\/.+?\//, '') // Remove /Users/username/anywhere/
    .replace(/^[A-Z]:\/Users\/[^/]+\/.+?\//, '') // Remove C:/Users/username/anywhere/
    .replace(/^\/[^/]+\/[^/]+\/[^/]+\//, ''); // Remove any /a/b/c/ prefix
  
  // If the path starts with 'src/' we're good
  if (!normalized.startsWith('src/') && normalized.includes('/src/')) {
    // Extract from src/ onwards
    normalized = normalized.substring(normalized.indexOf('src/'));
  }
  
  return normalized;
}

/**
 * Extract code snippet with context around line number
 * 
 * @param content - Full file content
 * @param lineNumber - Target line (1-indexed)
 * @param contextLines - Lines before/after to include (default: 2)
 */
export function extractSnippet(
  content: string,
  lineNumber: number,
  contextLines: number = 2
): string {
  const lines = content.split('\n');
  const startLine = Math.max(0, lineNumber - 1 - contextLines);
  const endLine = Math.min(lines.length, lineNumber + contextLines);
  
  const snippetLines = lines.slice(startLine, endLine);
  
  // Add line numbers for context
  const numberedLines = snippetLines.map((line, idx) => {
    const lineNum = startLine + idx + 1;
    const marker = lineNum === lineNumber ? '➤' : ' ';
    return `${marker} ${lineNum.toString().padStart(4, ' ')} | ${line}`;
  });
  
  return numberedLines.join('\n');
}

/**
 * Calculate relevance score based on multiple factors
 * 
 * Scoring factors:
 * - Source type (semantic > grep > file)
 * - Query term frequency in snippet
 * - File path relevance (keywords in path)
 * - Snippet quality (code vs comments)
 */
export function calculateRelevance(
  file: Partial<FileMatch>,
  query: string
): number {
  let score = 0;
  
  // Base score by source
  if (file.source === 'semantic') score += 0.5;
  else if (file.source === 'grep') score += 0.3;
  else if (file.source === 'file') score += 0.2;
  
  // Query term frequency in snippet
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const snippetLower = (file.snippet || '').toLowerCase();
  const pathLower = (file.path || '').toLowerCase();
  
  queryTerms.forEach(term => {
    // Count occurrences in snippet
    const snippetMatches = (snippetLower.match(new RegExp(term, 'g')) || []).length;
    score += snippetMatches * 0.05;
    
    // Bonus if term appears in file path
    if (pathLower.includes(term)) {
      score += 0.1;
    }
  });
  
  // Prefer source files over tests
  if (file.path && !file.path.includes('.test.') && !file.path.includes('.spec.')) {
    score += 0.05;
  }
  
  // Cap at 1.0
  return Math.min(score, 1.0);
}

/**
 * Deduplicate file matches by normalized path
 * Keeps highest relevance score for each unique file
 */
export function deduplicateResults(matches: FileMatch[]): FileMatch[] {
  const seen = new Map<string, FileMatch>();
  
  matches.forEach(match => {
    const normalizedPath = normalizePath(match.path);
    const existing = seen.get(normalizedPath);
    
    if (!existing || match.relevance > existing.relevance) {
      seen.set(normalizedPath, match);
    }
  });
  
  return Array.from(seen.values());
}

/**
 * Expand query with common synonyms and patterns
 * 
 * Example:
 * - "DataStore" → "DataStore|observeQuery|DataStore.query"
 * - "component" → "component|Component|.tsx|.jsx"
 */
export function expandQuery(query: string): string[] {
  const expansions: string[] = [query];
  
  // Add original query terms
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  expansions.push(...queryTerms);
  
  // Common patterns
  const patterns: Record<string, string[]> = {
    'datastore': ['DataStore', 'observeQuery', 'DataStore.query', 'DataStore.save'],
    'component': ['.tsx', '.jsx', 'Component', 'export const', 'export function'],
    'context': ['Context.Provider', 'useContext', 'createContext', 'Context'],
    'hook': ['use[A-Z]', 'useEffect', 'useState', 'useMemo'],
    'amplify': ['Amplify', 'aws-amplify', '@aws-amplify'],
    'ai': ['openai', 'anthropic', 'useChat', 'generateText', 'streamText']
  };
  
  const queryLower = query.toLowerCase();
  Object.entries(patterns).forEach(([key, values]) => {
    if (queryLower.includes(key)) {
      expansions.push(...values);
    }
  });
  
  return [...new Set(expansions)]; // Deduplicate
}

/**
 * Execute Semantic File Search
 * 
 * Main entry point that orchestrates multiple search strategies and
 * returns ranked, deduplicated results.
 */
export async function executeSkill(
  input: SemanticFileSearchInput
): Promise<SemanticFileSearchOutput> {
  const errors: string[] = [];
  const allMatches: FileMatch[] = [];
  
  try {
    // Validate input
    if (!input.query || input.query.trim().length === 0) {
      return {
        files: [],
        summary: 'Error: Query cannot be empty',
        errors: ['Query cannot be empty']
      };
    }
    
    if (input.limit && input.limit < 0) {
      return {
        files: [],
        summary: 'Error: Limit must be a positive number',
        errors: ['Limit must be a positive number']
      };
    }
    
    const limit = input.limit || 10;
    const queryExpansions = expandQuery(input.query);
    
    // Phase 1: Semantic search (best for natural language queries)
    // Note: In actual implementation, would call semantic_search tool here
    // For now, this is a placeholder that would be filled when integrated with VS Code
    
    // Phase 2: Grep search for code patterns
    // Would use grep_search tool with expanded query terms
    
    // Phase 3: File search for filename patterns
    // Would use file_search tool with scope filter
    
    // Placeholder: Since we can't actually call VS Code tools from this module,
    // we mark this as requiring tool integration
    errors.push('Tool integration required: This skill needs to be called within VS Code agent context with access to semantic_search, grep_search, and file_search tools');
    
    // Calculate relevance scores
    allMatches.forEach(match => {
      match.relevance = calculateRelevance(match, input.query);
    });
    
    // Deduplicate by normalized path
    const uniqueMatches = deduplicateResults(allMatches);
    
    // Sort by relevance descending
    const rankedMatches = uniqueMatches.sort((a, b) => b.relevance - a.relevance);
    
    // Limit results
    const limitedMatches = rankedMatches.slice(0, limit);
    
    // Generate summary
    const summary = limitedMatches.length > 0
      ? `Found ${limitedMatches.length} file${limitedMatches.length !== 1 ? 's' : ''} matching "${input.query}"`
      : `No files found matching "${input.query}"${input.scope ? ` in scope ${input.scope}` : ''}`;
    
    const interpretation = queryExpansions.length > 1
      ? `Expanded query to include: ${queryExpansions.slice(1).join(', ')}`
      : undefined;
    
    return {
      files: limitedMatches,
      summary,
      interpretation,
      errors: errors.length > 0 ? errors : undefined
    };
    
  } catch (error: any) {
    return {
      files: [],
      summary: `Search failed: ${error.message}`,
      errors: [error.message]
    };
  }
}

/**
 * Helper: Merge results from multiple search strategies
 * 
 * This would be used when calling actual VS Code tools:
 * 1. Call semantic_search with natural language query
 * 2. Call grep_search with code patterns
 * 3. Call file_search with filename patterns
 * 4. Merge and rank all results
 */
export function mergeSearchResults(
  semanticResults: any[],
  grepResults: any[],
  fileResults: any[],
  query: string
): FileMatch[] {
  const matches: FileMatch[] = [];
  
  // Convert semantic search results
  semanticResults.forEach(result => {
    matches.push({
      path: result.path || result.filePath || '',
      relevance: 0.8, // High base relevance for semantic matches
      snippet: result.snippet || result.text || '',
      lineNumber: result.lineNumber,
      source: 'semantic'
    });
  });
  
  // Convert grep search results
  grepResults.forEach(result => {
    matches.push({
      path: result.file || result.path || result.filePath || '',
      relevance: 0.6, // Medium base relevance for grep matches
      snippet: result.text || result.snippet || '',
      lineNumber: result.line || result.lineNumber,
      source: 'grep'
    });
  });
  
  // Convert file search results
  fileResults.forEach(result => {
    const filePath = result.path || result.filePath || '';
    matches.push({
      path: filePath,
      relevance: 0.4, // Lower base relevance for filename-only matches
      snippet: `File: ${filePath}`,
      source: 'file'
    });
  });
  
  return matches;
}

// Export metadata for VS Code agent system
export const skillMetadata = {
  name: 'semantic-file-search',
  description: 'Natural language file discovery with relevance ranking and snippet extraction',
  version: '1.0.0',
  inputSchema: {
    type: 'object',
    required: ['query'],
    properties: {
      query: {
        type: 'string',
        description: 'Natural language search query (e.g., "Find components using DataStore subscriptions")'
      },
      scope: {
        type: 'string',
        description: 'Optional scope filter (e.g., "src/components/**")'
      },
      limit: {
        type: 'number',
        description: 'Maximum results to return (default: 10)',
        default: 10
      },
      includeContent: {
        type: 'boolean',
        description: 'Include full file contents in results (default: false)',
        default: false
      }
    }
  },
  outputSchema: {
    type: 'object',
    required: ['files', 'summary'],
    properties: {
      files: {
        type: 'array',
        description: 'Array of matching files ranked by relevance',
        items: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            relevance: { type: 'number' },
            snippet: { type: 'string' },
            lineNumber: { type: 'number' },
            source: { type: 'string', enum: ['semantic', 'grep', 'file'] },
            content: { type: 'string' }
          }
        }
      },
      summary: { type: 'string' },
      interpretation: { type: 'string' },
      errors: {
        type: 'array',
        items: { type: 'string' }
      }
    }
  }
};
