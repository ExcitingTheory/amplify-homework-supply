/**
 * Test AssistantChat Creation
 * 
 * Quick diagnostic script to test if AssistantChat.create works
 * Run with: node scripts/test-chat-creation.mjs
 */

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { signInUser } from '@aws-amplify/seed';
import { readFile } from 'node:fs/promises';

// Load amplify_outputs.json
const url = new URL("../amplify_outputs.json", import.meta.url);
const outputs = JSON.parse(await readFile(url, { encoding: 'utf8' }));
Amplify.configure(outputs);

const client = generateClient();

const password = process.env.TEST_USER_PASSWORD;
if (!password) {
  throw new Error('TEST_USER_PASSWORD not set');
}

console.log('🔐 Signing in as instructor1@example.com...');
await signInUser({
  username: 'instructor1@example.com',
  password: password,
  signInFlow: "Password",
});

console.log('✅ Signed in successfully');
console.log('\n📝 Creating AssistantChat...');

try {
  const result = await client.models.AssistantChat.create({
    model: 'gpt-4',
    archived: false,
  });
  
  console.log('\n✅ Create result:', {
    hasData: !!result.data,
    hasErrors: !!result.errors,
  });
  
  if (result.errors) {
    console.error('❌ Errors:', JSON.stringify(result.errors, null, 2));
  }
  
  if (result.data) {
    console.log('✅ Created chat:', {
      id: result.data.id,
      model: result.data.model,
      archived: result.data.archived,
      owner: result.data.owner,
      createdAt: result.data.createdAt,
      _version: result.data._version,
    });
  } else {
    console.error('❌ No data returned');
  }
  
  // Clean up - delete the test chat
  if (result.data?.id) {
    console.log('\n🧹 Cleaning up test chat...');
    await client.models.AssistantChat.delete({ id: result.data.id });
    console.log('✅ Deleted test chat');
  }
  
} catch (error) {
  console.error('❌ Error:', error);
}

console.log('\n✅ Test complete');
process.exit(0);
