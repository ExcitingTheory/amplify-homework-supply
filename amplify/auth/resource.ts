import { defineAuth } from '@aws-amplify/backend';
import { sectionHandler } from '../functions/section/resource';

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
  groups: ['Learners', 'Instructors', 'Moderators', 'Admins'],
  access: (allow) => [
    allow.resource(sectionHandler).to([
      'manageGroupMembership',
      'listUsersInGroup',
      'listGroupsForUser',
      'getGroup',
      'listGroups',
      'getUser',
      'listUsers',
    ]),
  ],
});
