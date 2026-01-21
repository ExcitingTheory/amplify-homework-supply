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
