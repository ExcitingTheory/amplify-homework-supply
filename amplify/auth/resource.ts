import { defineAuth } from '@aws-amplify/backend';

/**
 * Authentication configuration for Amplify Gen 2
 * Migrated from Gen 1 Cognito user pool configuration
 * 
 * User groups: Admins, Instructors, Learners
 */

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailSubject: 'Verify your email for Homework Supply',
    },
  },
  multifactor: {
    mode: 'OPTIONAL',
    totp: true,
  },
});
