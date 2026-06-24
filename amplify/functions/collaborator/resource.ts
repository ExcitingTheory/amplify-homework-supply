import { defineFunction } from "@aws-amplify/backend";

/**
 * Collaborator Lambda function resource
 *
 * Handles validation for CollaboratorAccess operations:
 * - Verify grantor is owner/admin/edit-collaborator
 * - Verify grantee is in the Instructors Cognito group
 * - Prevent self-assignment
 *
 * Authorization: ADMINS (full), INSTRUCTORS (own units)
 * Cognito Operations: listUsersInGroup, adminGetUser
 */

export const collaboratorHandler = defineFunction({
  timeoutSeconds: 30,
  memoryMB: 256,
  resourceGroupName: "data",
});
