# Cryptographic Proof Generation

How the multi-model translation skill generates verifiable, auditable proof of translation provenance.

## Overview

In **Provable Mode**, the skill generates cryptographic evidence that:
1. Actual API calls were made to all three providers
2. Outputs haven't been tampered with
3. Translations occurred in parallel (not cherry-picked)
4. Results are independently verifiable

This creates an audit trail for compliance, legal review, or quality assurance.

---

## Proof Components

### 1. SHA-256 Fingerprints

**What**: Cryptographic hash of each model's output

**Purpose**: Detect any modification to translated content

**How it works**:
```typescript
import crypto from 'crypto';

function generateFingerprint(text: string): string {
  return crypto
    .createHash('sha-256')
    .update(text, 'utf-8')
    .digest('hex');
}

// Example
const fingerprint = generateFingerprint("Las partes acuerdan arbitraje vinculante.");
// → "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
```

**Verification**:
```typescript
function verifyFingerprint(text: string, expectedHash: string): boolean {
  const actualHash = generateFingerprint(text);
  return actualHash === expectedHash;
}
```

### 2. API Request IDs

**What**: Unique identifier returned by each API provider

**Purpose**: Traceable in provider dashboards to prove actual API usage

**Format**:
- Anthropic Claude: `req_<alphanumeric>` (e.g., `req_abc123xyz`)
- OpenAI GPT-4o: `chatcmpl-<alphanumeric>` (e.g., `chatcmpl-def456uvw`)
- Google Gemini: `gen_<alphanumeric>` (e.g., `gen_ghi789rst`)

**How to retrieve**:
```typescript
// Claude
const claudeMessage = await anthropic.messages.create({...});
const requestId = claudeMessage.id;  // req_abc123xyz

// GPT-4o
const gptCompletion = await openai.chat.completions.create({...});
const requestId = gptCompletion.id;  // chatcmpl-def456uvw

// Gemini
const geminiResult = await model.generateContent({...});
const requestId = geminiResult.response.id;  // gen_ghi789rst (if available)
```

**Verification**: Check request ID in API provider dashboard:
- Anthropic: https://console.anthropic.com → "API Requests"
- OpenAI: https://platform.openai.com/usage
- Google: https://aistudio.google.com/app/apikey

### 3. Timestamps

**What**: UTC timestamp of each API call

**Purpose**: Prove parallel execution (all within seconds of each other)

**Format**: ISO 8601 (e.g., `2026-01-29T14:32:01.234Z`)

**How to capture**:
```typescript
const timestamp = new Date().toISOString();
// → "2026-01-29T14:32:01.234Z"
```

**Verification**: All timestamps should be within 5 seconds if truly parallel.

---

## Proof Document Structure

```typescript
interface ProofDocument {
  // Document metadata
  version: string;  // "1.0"
  generated: string;  // ISO 8601 timestamp
  
  // Translation details
  source: string;
  target: string;
  sourceLanguage: string;
  targetLanguage: string;
  
  // Model outputs with cryptographic proof
  models: {
    claude: ModelProof;
    gpt: ModelProof;
    translategemma: ModelProof;
  };
  
  // Consensus result
  consensus: {
    chosen: string;
    agreement: number;
    level: 'full' | 'partial' | 'none';
  };
  
  // Reverse translation verification (if performed)
  verification?: {
    passed: boolean;
    semanticSimilarity: number;
  };
  
  // Overall verification status
  verified: boolean;
}

interface ModelProof {
  output: string;
  fingerprint: string;  // SHA-256 hex
  requestId: string;
  timestamp: string;  // ISO 8601
  model: string;  // Model version ID
}
```

### Example Proof Document

```json
{
  "version": "1.0",
  "generated": "2026-01-29T14:32:05.678Z",
  "source": "The parties agree to binding arbitration.",
  "target": "Las partes acuerdan un arbitraje vinculante.",
  "sourceLanguage": "en",
  "targetLanguage": "es",
  "models": {
    "claude": {
      "output": "Las partes acuerdan un arbitraje vinculante.",
      "fingerprint": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
      "requestId": "req_abc123xyz",
      "timestamp": "2026-01-29T14:32:01.234Z",
      "model": "claude-sonnet-4-20250514"
    },
    "gpt": {
      "output": "Las partes aceptan el arbitraje obligatorio.",
      "fingerprint": "d4e5f6a1b2c3789012345678901234567890abcdef1234567890abcdef789012",
      "requestId": "chatcmpl-def456uvw",
      "timestamp": "2026-01-29T14:32:01.456Z",
      "model": "gpt-4o-2024-11-20"
    },
    "translategemma": {
      "output": "Las partes acuerdan arbitraje vinculante.",
      "fingerprint": "g7h8i9j0k1l2345678901234567890abcdef1234567890abcdef345678901234",
      "requestId": "gen_ghi789rst",
      "timestamp": "2026-01-29T14:32:02.123Z",
      "model": "gemini-2.0-flash-001"
    }
  },
  "consensus": {
    "chosen": "Las partes acuerdan un arbitraje vinculante.",
    "agreement": 0.67,
    "level": "partial"
  },
  "verification": {
    "passed": true,
    "semanticSimilarity": 0.95
  },
  "verified": true
}
```

---

## Proof Generation Process

### Step 1: Execute Parallel Translations

```typescript
import { Anthropic } from '@anthropic-ai/sdk';
import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function executeTranslations(text: string, targetLang: string) {
  const [claudeResult, gptResult, geminiResult] = await Promise.all([
    translateWithClaude(text, targetLang),
    translateWithGPT(text, targetLang),
    translateWithGemini(text, targetLang)
  ]);
  
  return { claudeResult, gptResult, geminiResult };
}
```

### Step 2: Generate Fingerprints

```typescript
function generateProof(result: TranslationResult): ModelProof {
  const fingerprint = crypto
    .createHash('sha-256')
    .update(result.output, 'utf-8')
    .digest('hex');
  
  return {
    output: result.output,
    fingerprint,
    requestId: result.id,
    timestamp: result.timestamp,
    model: result.model
  };
}
```

### Step 3: Assemble Proof Document

```typescript
function createProofDocument(
  source: string,
  target: string,
  models: { claude: ModelProof, gpt: ModelProof, translategemma: ModelProof },
  consensus: ConsensusResult
): ProofDocument {
  return {
    version: '1.0',
    generated: new Date().toISOString(),
    source,
    target,
    sourceLanguage: 'en',
    targetLanguage: 'es',
    models,
    consensus,
    verified: verifyAllFingerprints(models)
  };
}
```

### Step 4: Save Proof Document

```typescript
import fs from 'fs';

function saveProof(proof: ProofDocument, filename: string) {
  const json = JSON.stringify(proof, null, 2);
  fs.writeFileSync(filename, json, 'utf-8');
  console.log(`✅ Proof saved: ${filename}`);
}

// Usage
saveProof(proofDoc, `proof_${Date.now()}.json`);
```

---

## Verification Process

### Automated Verification

```typescript
async function verifyProofDocument(proofPath: string): Promise<VerificationResult> {
  const proof: ProofDocument = JSON.parse(fs.readFileSync(proofPath, 'utf-8'));
  
  const checks = {
    fingerprintsValid: verifyFingerprints(proof),
    timestampsParallel: verifyTimestamps(proof),
    consensusCorrect: verifyConsensus(proof),
    requestIdsFormat: verifyRequestIds(proof)
  };
  
  const allPassed = Object.values(checks).every(v => v === true);
  
  return {
    valid: allPassed,
    checks,
    timestamp: new Date().toISOString()
  };
}
```

### Verify Fingerprints

```typescript
function verifyFingerprints(proof: ProofDocument): boolean {
  const models = ['claude', 'gpt', 'translategemma'];
  
  for (const model of models) {
    const { output, fingerprint } = proof.models[model];
    const recalculatedFingerprint = generateFingerprint(output);
    
    if (fingerprint !== recalculatedFingerprint) {
      console.error(`❌ Fingerprint mismatch for ${model}`);
      console.error(`   Expected: ${fingerprint}`);
      console.error(`   Actual:   ${recalculatedFingerprint}`);
      return false;
    }
  }
  
  console.log('✅ All fingerprints valid (content unchanged)');
  return true;
}
```

### Verify Parallel Execution

```typescript
function verifyTimestamps(proof: ProofDocument): boolean {
  const timestamps = [
    new Date(proof.models.claude.timestamp),
    new Date(proof.models.gpt.timestamp),
    new Date(proof.models.translategemma.timestamp)
  ];
  
  const earliest = Math.min(...timestamps.map(t => t.getTime()));
  const latest = Math.max(...timestamps.map(t => t.getTime()));
  const diffSeconds = (latest - earliest) / 1000;
  
  if (diffSeconds > 10) {
    console.error(`❌ Timestamps not parallel (${diffSeconds}s apart)`);
    return false;
  }
  
  console.log(`✅ Timestamps verify parallel execution (${diffSeconds.toFixed(2)}s)`);
  return true;
}
```

### Verify Request IDs

```typescript
function verifyRequestIds(proof: ProofDocument): boolean {
  const formats = {
    claude: /^req_[a-zA-Z0-9]+$/,
    gpt: /^chatcmpl-[a-zA-Z0-9]+$/,
    translategemma: /^gen_[a-zA-Z0-9]+$/
  };
  
  for (const [model, pattern] of Object.entries(formats)) {
    const requestId = proof.models[model].requestId;
    if (!pattern.test(requestId)) {
      console.error(`❌ Invalid request ID format for ${model}: ${requestId}`);
      return false;
    }
  }
  
  console.log('✅ All request IDs have valid format');
  return true;
}
```

---

## Manual Verification

### Step 1: Verify Fingerprints

```bash
# Recalculate SHA-256 of each output
echo -n "Las partes acuerdan un arbitraje vinculante." | shasum -a 256

# Compare to fingerprint in proof document
# Should match exactly
```

### Step 2: Check Request IDs in API Dashboards

**Anthropic Console**:
1. Go to https://console.anthropic.com
2. Navigate to "API Requests"
3. Search for request ID: `req_abc123xyz`
4. Verify timestamp matches proof document

**OpenAI Platform**:
1. Go to https://platform.openai.com/usage
2. Filter by date range
3. Search for request ID: `chatcmpl-def456uvw`
4. Verify model and timestamp

**Google AI Studio**:
1. Go to https://aistudio.google.com/app/apikey
2. Check API usage logs
3. Search for request ID: `gen_ghi789rst`
4. Verify activity matches timestamp

### Step 3: Verify Timestamps

Check that all timestamps are within 5-10 seconds:
- Claude: `2026-01-29T14:32:01.234Z`
- GPT: `2026-01-29T14:32:01.456Z`
- Gemini: `2026-01-29T14:32:02.123Z`

Difference: ~0.9 seconds ✅ (parallel execution)

---

## Use Cases

### Legal Compliance

**Scenario**: Law firm needs auditable translation of contractsfor multi-jurisdictional filing.

**Requirements**:
- Cryptographic proof of translation method
- Traceability to specific AI models used
- Timestamp verification of when translation occurred
- Immutable record for court proceedings

**Solution**: Provable mode with full proof document.

### Quality Assurance Audits

**Scenario**: Translation service wants to audit quality of AI translations.

**Requirements**:
- Compare multiple AI approaches
- Verify consensus methodology
- Validate reverse translation accuracy
- Provide evidence to clients

**Solution**: Proof documents as QA artifacts.

### Regulatory Compliance

**Scenario**: Medical device manufacturer requires FDA-compliant translation of patient instructions.

**Requirements**:
- Documented translation process
- Multiple independent translations
- Verification of accuracy
- Chain of custody for all steps

**Solution**: Provable mode with verification and proof archival.

---

## Proof Storage & Archival

### File Naming Convention

```
proof_${timestamp}_${sourceHash}.json
```

Example:
```
proof_2026-01-29T14-32-05-678Z_a1b2c3d4.json
```

### Storage Recommendations

1. **Local Archive**: Store in `proofs/` directory
2. **Cloud Backup**: Upload to S3, Google Cloud Storage, etc.
3. **Database**: Store metadata in database for searchability
4. **Version Control**: Commit proof documents to git (if appropriate)

### Retention Policy

- **Legal/Medical**: Keep indefinitely (permanent archive)
- **Marketing**: 1 year minimum
- **Internal/Dev**: 30-90 days

---

## Proof Tampering Detection

Any modification to the proof document breaks verification:

**What breaks it**:
- Changing any model's output text
- Modifying timestamps
- Altering request IDs
- Changing consensus result

**Detection**:
- Fingerprint verification fails
- `verified: false` status

**Prevention**:
- Store proof documents immutably (S3 with object lock)
- Sign proof documents with private key (optional enhancement)

---

## Related Files

- [../SKILL.md](../SKILL.md) - Main skill documentation
- [API_REFERENCE.md](./API_REFERENCE.md) - Complete API schemas
- [EXAMPLES.md](./EXAMPLES.md) - Usage examples with proof
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common verification issues
- [../scripts/verify-translations.ts](../scripts/verify-translations.ts) - Verification script
