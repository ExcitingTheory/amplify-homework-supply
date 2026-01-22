import { signIn, signOut, fetchAuthSession } from 'aws-amplify/auth';

export type SignInParams = {
  username: string;
  password: string;
};

// Test user credentials
export const TEST_USERS = {
  admin: {
    username: 'admin@example.com',
    group: 'Admins',
  },
  instructor1: {
    username: 'instructor1@example.com',
    group: 'Instructors',
  },
  instructor2: {
    username: 'instructor2@example.com',
    group: 'Instructors',
  },
  student1: {
    username: 'student1@example.com',
    group: 'Learners',
  },
  student2: {
    username: 'student2@example.com',
    group: 'Learners',
  },
}

// Helper: Sign in as a test user
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';

export async function signInAs(user: keyof typeof TEST_USERS) { 
  if (!TEST_PASSWORD) {
    throw new Error(
      'TEST_USER_PASSWORD environment variable is required. ' +
      'Set it to the password for test users.'
    );
  }
  
  const usr = TEST_USERS[user];
  
  try {
    // Sign out any existing session first
    await signOut();
  } catch (error) {
    // Ignore errors if not signed in
  }
  
  // Sign in with username and password
  await signIn({ username: usr.username, password: TEST_PASSWORD });
  
  const session = await fetchAuthSession();
  return session;
}

// Helper: Parse SSE (Server-Sent Events) format
export interface SSEEvent {
  type?: string;
  textDelta?: string;
  toolCallId?: string;
  toolName?: string;
  args?: any;
  argsTextDelta?: string;
  result?: any;
  finishReason?: string;
  [key: string]: any;
}

export function parseSSEStream(sseText: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  const lines = sseText.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const jsonStr = line.substring(6); // Remove 'data: ' prefix
        const event = JSON.parse(jsonStr);
        events.push(event);
      } catch (error) {
        console.warn('[parseSSEStream] Failed to parse SSE line:', line, error);
      }
    }
  }
  
  return events;
}

// Helper: Extract full text content from SSE stream
export function extractTextFromSSE(sseText: string): string {
  const events = parseSSEStream(sseText);
  return events
    .filter(e => e.type === 'text-delta' && e.textDelta)
    .map(e => e.textDelta)
    .join('');
}

// Helper: Check if SSE stream completed successfully
export function isSSEStreamComplete(sseText: string): boolean {
  const events = parseSSEStream(sseText);
  const lastEvent = events[events.length - 1];
  return lastEvent?.type === 'finish' && lastEvent?.finishReason === 'stop';
}
