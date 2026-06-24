import type { AppSyncResolverHandler } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  AdminListGroupsForUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({});

interface ValidateCollaboratorEvent {
  action: "validateGrant" | "validateRevoke";
  unitOwnerId: string;
  grantorId: string;
  granteeId: string;
  permission?: "READ" | "EDIT";
  existingCollaborators?: Array<{ collaboratorId: string; permission: string }>;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates collaborator access operations.
 *
 * Rules:
 * - Cannot grant access to yourself (self-assignment)
 * - Grantee must be in the Instructors Cognito group
 * - Grantor must be either:
 *   - The unit owner
 *   - An admin (in Admins group)
 *   - An existing edit-level collaborator on the unit
 */
export const handler: AppSyncResolverHandler<
  ValidateCollaboratorEvent,
  ValidationResult
> = async (event) => {
  const {
    action,
    unitOwnerId,
    grantorId,
    granteeId,
    permission,
    existingCollaborators,
  } = event.arguments as unknown as ValidateCollaboratorEvent;

  const userPoolId = process.env.USER_POOL_ID;
  if (!userPoolId) {
    return { valid: false, error: "USER_POOL_ID not configured" };
  }

  if (action === "validateGrant") {
    // 1. Prevent self-assignment
    if (grantorId === granteeId) {
      return { valid: false, error: "Cannot grant access to yourself" };
    }

    if (unitOwnerId === granteeId) {
      return { valid: false, error: "Cannot grant access to the unit owner" };
    }

    // 2. Verify grantee is in Instructors group
    const granteeGroups = await getUserGroups(userPoolId, granteeId);
    if (
      !granteeGroups.includes("Instructors") &&
      !granteeGroups.includes("Admins")
    ) {
      return { valid: false, error: "Grantee must be an instructor" };
    }

    // 3. Verify grantor has permission to grant
    const grantorGroups = await getUserGroups(userPoolId, grantorId);
    const isAdmin = grantorGroups.includes("Admins");
    const isOwner = grantorId === unitOwnerId;
    const isEditCollaborator = existingCollaborators?.some(
      (c) => c.collaboratorId === grantorId && c.permission === "EDIT",
    );

    if (!isAdmin && !isOwner && !isEditCollaborator) {
      return {
        valid: false,
        error: "You do not have permission to grant access to this unit",
      };
    }

    return { valid: true };
  }

  if (action === "validateRevoke") {
    // Owner or admin can revoke anyone; collaborators can only revoke themselves (leave)
    const grantorGroups = await getUserGroups(userPoolId, grantorId);
    const isAdmin = grantorGroups.includes("Admins");
    const isOwner = grantorId === unitOwnerId;
    const isSelf = grantorId === granteeId;

    if (!isAdmin && !isOwner && !isSelf) {
      return {
        valid: false,
        error: "You do not have permission to revoke this access",
      };
    }

    return { valid: true };
  }

  return { valid: false, error: `Unknown action: ${action}` };
};

async function getUserGroups(
  userPoolId: string,
  username: string,
): Promise<string[]> {
  try {
    const response = await cognitoClient.send(
      new AdminListGroupsForUserCommand({
        UserPoolId: userPoolId,
        Username: username,
      }),
    );
    return (response.Groups || [])
      .map((g) => g.GroupName || "")
      .filter(Boolean);
  } catch (error) {
    console.error(`Failed to get groups for user ${username}:`, error);
    return [];
  }
}
