import { defineFunction } from '@aws-amplify/backend';

/**
 * Section Lambda function resource
 * 
 * Handles:
 * - Create/update/delete sections (classes)
 * - Assign students to sections
 * - Generate join codes
 * - List students in section
 * 
 * Authorization: ADMINS (full), INSTRUCTORS (own sections), LEARNERS (none)
 * Cognito Operations: manageGroupMembership, listUsersInGroup, listGroupsForUser, getGroup, listGroups, getUser, listUsers
 */

export const sectionHandler = defineFunction({
  timeoutSeconds: 60,
  memoryMB: 256,
  resourceGroupName: 'data', // Place with data resolvers to avoid cross-stack cycles
});
