import { defineAuth } from '@aws-amplify/backend';
// import { openaiHandler } from '../backend/functions/openai/resource';
import { sectionHandler } from '../functions/section/resource';
// import { documentAnalysisHandler } from '../backend/functions/documentAnalysis/resource';
// import { embeddingsHandler } from '../backend/functions/embeddings/resource';
// import { aiHandler } from '../backend/functions/ai/resource';
// import { assistantHandler } from '../backend/functions/assistant/resource';
// import { moderationHandler } from '../backend/functions/moderation/resource';
// import { chatStreamHandler } from '../backend/functions/chatStream/resource';
// import { contentCompletionStreamHandler } from '../backend/functions/contentCompletionStream/resource';
// import { suggestBlocksStreamHandler } from '../backend/functions/suggestBlocksStream/resource';

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
    // Section handler needs to manage group membership and list users
    allow.resource(sectionHandler).to([
      'manageGroupMembership',     // AdminAddUserToGroup, AdminRemoveUserFromGroup
      'listUsersInGroup',           // List students in a section
      'listGroupsForUser',          // List user's sections
      'getGroup',                   // Get section details
      'listGroups',                 // List all sections
      'getUser',                    // Get user details
      'listUsers',                  // List all users
    ]),
  ],
});
