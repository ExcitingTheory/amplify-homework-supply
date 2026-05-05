import { defineAuth } from '@aws-amplify/backend';

/**
 * Authentication configuration for Amplify Gen 2
 * Migrated from Gen 1 Cognito user pool configuration
 * 
 * User groups: ADMINS, INSTRUCTORS, LEARNERS
 * 
 * Authorization Rules:
 * - ADMINS: Full access to all resources
 * - INSTRUCTORS: Can create content, manage sections and students
 * - LEARNERS: Read-only access to published content, can submit work
 * 
 * Note: Cognito permissions for section handler are granted via IAM policy in backend.ts
 * to avoid circular dependency between auth and data stacks
 */

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailSubject: 'Verify your email for Homework Supply',
    },
    phone: true,
  },
  multifactor: {
    mode: 'OPTIONAL',
    totp: true,
    sms: true,
  },
  groups: ['Learners', 'Instructors', 'Moderators', 'Admins'],
  userAttributes: {
    locale: {
      mutable: true,
      required: false,
    },
    preferredUsername: {
      mutable: true,
      required: false,
    },
  },
  accountRecovery: 'EMAIL_ONLY',
});
