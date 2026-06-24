#!/usr/bin/env node
/**
 * Copy RNNoise worklet and sync files from @jitsi/rnnoise-wasm to public/workers/
 * Runs automatically after npm install via postinstall script.
 *
 * Same pattern as copy-pdf-worker.js — gracefully skips if package not installed.
 */
const fs = require('fs');
const path = require('path');

const workersDir = path.join(__dirname, '../public/workers');

// Ensure public/workers directory exists
if (!fs.existsSync(workersDir)) {
  fs.mkdirSync(workersDir, { recursive: true });
}

// Copy rnnoise-sync.js (WASM binary inlined as base64)
const syncSource = path.join(__dirname, '../node_modules/@jitsi/rnnoise-wasm/dist/rnnoise-sync.js');
const syncDest = path.join(workersDir, 'rnnoise-sync.js');

try {
  if (!fs.existsSync(syncSource)) {
    console.warn('⚠️  @jitsi/rnnoise-wasm not found in node_modules. Skipping RNNoise copy.');
    process.exit(0);
  }

  fs.copyFileSync(syncSource, syncDest);
  console.log('✅ rnnoise-sync.js copied to public/workers/');
} catch (error) {
  console.error('❌ Error copying RNNoise files:', error.message);
  process.exit(1);
}

// Copy the worklet processor (our own file, created alongside this script)
const workletSource = path.join(__dirname, '../src/workers/rnnoise-worklet.js');
const workletDest = path.join(workersDir, 'rnnoise-worklet.js');

try {
  if (fs.existsSync(workletSource)) {
    fs.copyFileSync(workletSource, workletDest);
    console.log('✅ rnnoise-worklet.js copied to public/workers/');
  } else {
    console.warn('⚠️  src/workers/rnnoise-worklet.js not found. Skipping worklet copy.');
  }
} catch (error) {
  console.error('❌ Error copying worklet file:', error.message);
  process.exit(1);
}
