/**
 * Mock Embedding Utilities
 * 
 * Generates realistic mock 1536-dimensional embedding vectors for testing
 * semantic search functionality without requiring OpenAI API calls.
 * 
 * The embeddings are deterministic based on text content to ensure:
 * 1. Similar content generates similar embeddings (semantic similarity)
 * 2. Same content always generates the same embedding (consistency)
 * 3. Different content generates meaningfully different embeddings
 */

/**
 * Simple hash function to convert text to a deterministic seed
 * @param {string} text - Input text
 * @returns {number} Hash value
 */
function hashText(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Seeded pseudo-random number generator
 * Uses mulberry32 algorithm for deterministic randomness
 * @param {number} seed - Seed value
 * @returns {function} Random number generator function
 */
function createSeededRandom(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Extract semantic features from text for more realistic embeddings
 * @param {string} text - Input text
 * @returns {object} Semantic features
 */
function extractSemanticFeatures(text) {
  const lower = text.toLowerCase();
  
  return {
    // Language detection
    hasJapanese: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text),
    hasSpanish: /[áéíóúñ¿¡]/i.test(text) || /\b(el|la|los|las|un|una)\b/.test(lower),
    hasFrench: /[àâäéèêëïîôùûüÿæœç]/i.test(text) || /\b(le|la|les|un|une|des)\b/.test(lower),
    
    // Content type
    isQuestion: /[?？]/.test(text) || /^(what|who|where|when|why|how|cual|donde|cuando|comment|où|quand)/i.test(text),
    isDefinition: /(:|\bmeans\b|\bis\b|\bare\b|\bes\b|\best\b)/.test(lower),
    hasNumbers: /\d/.test(text),
    
    // Subject matter hints
    isScience: /\b(cell|biology|chemistry|atom|molecule|energy|photosynthesis|water|cycle)\b/i.test(text),
    isPhilosophy: /\b(philosophy|philosopher|thales|anaximander|being|reality|cosmos|truth)\b/i.test(text),
    isGrammar: /\b(verb|noun|adjective|conjugat|tense|plural|singular|grammar)\b/i.test(text),
    
    // Length features
    wordCount: text.split(/\s+/).length,
    charCount: text.length,
  };
}

/**
 * Generate a deterministic mock embedding vector based on text content
 * Mimics Xenova/all-MiniLM-L6-v2 model (384 dimensions)
 * 
 * @param {string} text - Text to generate embedding for
 * @param {number} [dimensions=384] - Vector dimensions (default 384)
 * @returns {number[]} Embedding vector
 */
export function generateMockEmbedding(text, dimensions = 384) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string');
  }
  
  // Normalize text
  const normalizedText = text.trim().toLowerCase();
  
  // Create deterministic seed from text
  const seed = hashText(normalizedText);
  const random = createSeededRandom(seed);
  
  // Extract semantic features
  const features = extractSemanticFeatures(text);
  
  // Generate base embedding with normal distribution (mean=0, std=0.1)
  const embedding = new Array(dimensions);
  for (let i = 0; i < dimensions; i++) {
    // Box-Muller transform for normal distribution
    const u1 = random();
    const u2 = random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    embedding[i] = z * 0.1; // Scale to std dev of 0.1
  }
  
  // Add semantic biases to specific dimensions to create similarity clusters
  // This makes similar content have similar embeddings
  
  // Language clusters (dimensions 0-99)
  if (features.hasJapanese) {
    for (let i = 0; i < 20; i++) embedding[i] += 0.3;
  }
  if (features.hasSpanish) {
    for (let i = 20; i < 40; i++) embedding[i] += 0.3;
  }
  if (features.hasFrench) {
    for (let i = 40; i < 60; i++) embedding[i] += 0.3;
  }
  
  // Content type clusters (dimensions 100-199)
  if (features.isQuestion) {
    for (let i = 100; i < 120; i++) embedding[i] += 0.25;
  }
  if (features.isDefinition) {
    for (let i = 120; i < 140; i++) embedding[i] += 0.25;
  }
  
  // Subject matter clusters (dimensions 200-399)
  if (features.isScience) {
    for (let i = 200; i < 250; i++) embedding[i] += 0.3;
  }
  if (features.isPhilosophy) {
    for (let i = 250; i < 300; i++) embedding[i] += 0.3;
  }
  if (features.isGrammar) {
    for (let i = 300; i < 350; i++) embedding[i] += 0.3;
  }
  
  // Length-based features (dimensions 400-449)
  const lengthFactor = Math.min(features.wordCount / 50, 1.0); // Normalize to 0-1
  for (let i = 400; i < 450; i++) {
    embedding[i] += lengthFactor * 0.2;
  }
  
  // Normalize to unit vector (standard for embeddings)
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  for (let i = 0; i < dimensions; i++) {
    embedding[i] /= magnitude;
  }
  
  // Return as plain array (JSON-serializable) not typed array
  return Array.from(embedding);
}

/**
 * Calculate cosine similarity between two embedding vectors
 * Returns value between -1 and 1, where 1 is identical
 * 
 * @param {number[]} embedding1 - First embedding vector
 * @param {number[]} embedding2 - Second embedding vector
 * @returns {number} Cosine similarity
 */
export function cosineSimilarity(embedding1, embedding2) {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have same dimensions');
  }
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    mag1 += embedding1[i] * embedding1[i];
    mag2 += embedding2[i] * embedding2[i];
  }
  
  return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

/**
 * Find most similar items based on embedding similarity
 * 
 * @param {number[]} queryEmbedding - Query embedding vector
 * @param {Array} items - Array of items with embedding property
 * @param {number} [topK=5] - Number of results to return
 * @returns {Array} Top K similar items with similarity scores
 */
export function findSimilarItems(queryEmbedding, items, topK = 5) {
  const results = items
    .map(item => ({
      item,
      similarity: cosineSimilarity(queryEmbedding, item.embedding)
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
  
  return results;
}

/**
 * Generate mock embeddings for multiple texts (batch)
 * 
 * @param {string[]} texts - Array of texts
 * @param {number} [dimensions=384] - Vector dimensions
 * @returns {number[][]} Array of embedding vectors
 */
export function generateMockEmbeddingsBatch(texts, dimensions = 384) {
  return texts.map(text => generateMockEmbedding(text, dimensions));
}

/**
 * Mock the embedding API response format
 * 
 * @param {string|string[]} input - Single text or array of texts
 * @param {string} [model='Xenova/all-MiniLM-L6-v2'] - Model name
 * @param {number} [dimensions=384] - Vector dimensions
 * @returns {object} API-style response
 */
export function mockEmbeddingAPIResponse(input, model = 'Xenova/all-MiniLM-L6-v2', dimensions = 384) {
  const texts = Array.isArray(input) ? input : [input];
  const embeddings = generateMockEmbeddingsBatch(texts, dimensions);
  
  return {
    object: 'list',
    data: embeddings.map((embedding, index) => ({
      object: 'embedding',
      index,
      embedding
    })),
    model,
    usage: {
      prompt_tokens: texts.reduce((sum, text) => sum + Math.ceil(text.length / 4), 0),
      total_tokens: texts.reduce((sum, text) => sum + Math.ceil(text.length / 4), 0)
    }
  };
}

// Example usage and tests
 if (typeof window === 'undefined' && require.main === module) {
  // Node.js environment - run tests
  console.log('Testing mock embedding generation...\n');
  
  const testTexts = [
    '水 (mizu) - water',
    'agua - water (Spanish)',
    'cell - The basic unit of life',
    'What is photosynthesis?',
    'Thales believed water was the origin of all things'
  ];
  
  console.log('Generating embeddings for test texts:');
  testTexts.forEach((text, i) => {
    const embedding = generateMockEmbedding(text);
    console.log(`${i + 1}. "${text}"`);
    console.log(`   Dimensions: ${embedding.length}`);
    console.log(`   First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    console.log(`   Magnitude: ${Math.sqrt(embedding.reduce((s, v) => s + v * v, 0)).toFixed(4)}`);
  });
  
  console.log('\nTesting semantic similarity:');
  const waterJapanese = generateMockEmbedding('水 (mizu) - water');
  const waterSpanish = generateMockEmbedding('agua - water (Spanish)');
  const cellDefinition = generateMockEmbedding('cell - The basic unit of life');
  
  console.log(`Japanese "water" vs Spanish "water": ${cosineSimilarity(waterJapanese, waterSpanish).toFixed(4)}`);
  console.log(`Japanese "water" vs "cell" definition: ${cosineSimilarity(waterJapanese, cellDefinition).toFixed(4)}`);
  console.log('\n✓ Higher similarity expected for related content');
}
