import {
  signInUser,
} from "@aws-amplify/seed";
import { Amplify } from "aws-amplify";
import { fetchAuthSession } from 'aws-amplify/auth';

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
  const usr = TEST_USERS[user];
  // await signOut();
  await signInUser({ username: usr.username, password: TEST_PASSWORD, signInFlow: 'Password' });
  const session = await fetchAuthSession();
  return session;
}
