"use server";

/**
 * Collaborator Server Actions
 *
 * CRUD operations for managing CollaboratorAccess records.
 * Handles granting, revoking, and listing collaboration grants.
 * Includes Cognito-based instructor search for the collaborator dialog.
 */

import { getServerClient } from "@/utils/amplifyServerClient";
import {
  CognitoIdentityProviderClient,
  ListUsersInGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({});

function getUserPoolId(): string {
  if (process.env.USER_POOL_ID) return process.env.USER_POOL_ID;
  if (process.env.AMPLIFY_AUTH_USERPOOL_ID)
    return process.env.AMPLIFY_AUTH_USERPOOL_ID;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const outputs = require("../../amplify_outputs.json");
    return outputs?.auth?.user_pool_id || "";
  } catch {
    return "";
  }
}

/**
 * Check if a user belongs to a specific Cognito group.
 */
async function isUserInGroup(
  username: string,
  groupName: string,
): Promise<boolean> {
  const userPoolId = getUserPoolId();
  if (!userPoolId) return false;

  try {
    const command = new ListUsersInGroupCommand({
      UserPoolId: userPoolId,
      GroupName: groupName,
    });
    const response = await cognitoClient.send(command);
    return (response.Users || []).some((u) => u.Username === username);
  } catch {
    return false;
  }
}

interface CollaboratorResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Grant collaborator access on a unit to another instructor.
 *
 * Validates:
 * - Grantee is not the unit owner
 * - Grantee is not already a collaborator
 * - Grantor is the owner, admin, or edit-level collaborator
 */
export async function grantCollaboratorAccess(
  unitId: string,
  unitOwner: string,
  grantorUsername: string,
  granteeUsername: string,
  permission: "READ" | "EDIT",
): Promise<CollaboratorResult> {
  if (!unitId || !grantorUsername || !granteeUsername || !permission) {
    return { success: false, error: "Missing required parameters" };
  }

  // Prevent self-assignment
  if (grantorUsername === granteeUsername) {
    return { success: false, error: "Cannot grant access to yourself" };
  }

  // Cannot grant to unit owner
  if (unitOwner === granteeUsername) {
    return { success: false, error: "Cannot grant access to the unit owner" };
  }

  const client = getServerClient();

  try {
    // Validate grantor is owner, admin, or edit-level collaborator
    const isOwner = grantorUsername === unitOwner;
    if (!isOwner) {
      const isAdmin = await isUserInGroup(grantorUsername, "Admins");
      if (!isAdmin) {
        // Check if grantor is an edit-level collaborator
        const { data: grantorAccess } = await (
          client as any
        ).models.CollaboratorAccess.list({
          filter: {
            unitID: { eq: unitId },
            collaboratorId: { eq: grantorUsername },
          },
        });
        const hasEditPermission =
          grantorAccess &&
          grantorAccess.some((g: any) => g.permission === "EDIT");
        if (!hasEditPermission) {
          return {
            success: false,
            error:
              "Only the owner, admins, or edit-level collaborators can grant access",
          };
        }
      }
    }

    // Validate grantee is in the Instructors group
    const isInstructor = await isUserInGroup(granteeUsername, "Instructors");
    if (!isInstructor) {
      // Also allow admins to receive grants
      const isAdmin = await isUserInGroup(granteeUsername, "Admins");
      if (!isAdmin) {
        return {
          success: false,
          error: "Collaborators must be in the Instructors group",
        };
      }
    }

    // Check if already a collaborator
    const { data: existing } = await (
      client as any
    ).models.CollaboratorAccess.list({
      filter: {
        unitID: { eq: unitId },
        collaboratorId: { eq: granteeUsername },
      },
    });

    if (existing && existing.length > 0) {
      // Update existing permission level
      const record = existing[0];
      if (record.permission === permission) {
        return { success: false, error: "User already has this access level" };
      }
      const { data: updated, errors } = await (
        client as any
      ).models.CollaboratorAccess.update({
        id: record.id,
        permission,
        _version: record._version,
      });
      if (errors?.length > 0) {
        return { success: false, error: errors[0].message };
      }
      return { success: true, data: updated };
    }

    // Create new collaborator access
    const { data: created, errors } = await (
      client as any
    ).models.CollaboratorAccess.create({
      unitID: unitId,
      collaboratorId: granteeUsername,
      grantedBy: grantorUsername,
      permission,
      grantedAt: new Date().toISOString(),
    });

    if (errors?.length > 0) {
      return { success: false, error: errors[0].message };
    }

    return { success: true, data: created };
  } catch (error) {
    console.error("[grantCollaboratorAccess] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Revoke collaborator access — removes a collaborator from a unit.
 * Owner/admin can revoke anyone; collaborators can revoke themselves (leave).
 */
export async function revokeCollaboratorAccess(
  collaboratorAccessId: string,
  version: number,
): Promise<CollaboratorResult> {
  if (!collaboratorAccessId) {
    return { success: false, error: "Missing collaborator access ID" };
  }

  const client = getServerClient();

  try {
    const { errors } = await (client as any).models.CollaboratorAccess.delete({
      id: collaboratorAccessId,
      _version: version,
    });

    if (errors?.length > 0) {
      return { success: false, error: errors[0].message };
    }

    return { success: true };
  } catch (error) {
    console.error("[revokeCollaboratorAccess] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * List all collaborators for a specific unit.
 */
export async function listUnitCollaborators(
  unitId: string,
): Promise<CollaboratorResult> {
  if (!unitId) {
    return { success: false, error: "Missing unit ID" };
  }

  const client = getServerClient();

  try {
    const { data, errors } = await (
      client as any
    ).models.CollaboratorAccess.list({
      filter: {
        unitID: { eq: unitId },
      },
    });

    if (errors?.length > 0) {
      return { success: false, error: errors[0].message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("[listUnitCollaborators] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * List all units shared with a specific user (for "Shared With Me" tab).
 */
export async function listSharedWithMe(
  username: string,
): Promise<CollaboratorResult> {
  if (!username) {
    return { success: false, error: "Missing username" };
  }

  const client = getServerClient();

  try {
    const { data: grants, errors } = await (
      client as any
    ).models.CollaboratorAccess.list({
      filter: {
        collaboratorId: { eq: username },
      },
    });

    if (errors?.length > 0) {
      return { success: false, error: errors[0].message };
    }

    if (!grants || grants.length === 0) {
      return { success: true, data: [] };
    }

    // Fetch unit details for each grant
    const unitResults = await Promise.all(
      grants.map(async (grant: any) => {
        try {
          const { data: unit } = await (client as any).models.Unit.get(
            { id: grant.unitID },
            {
              selectionSet: [
                "id",
                "name",
                "description",
                "owner",
                "identityId",
                "status",
                "featuredImage",
                "thumbnail",
              ],
            },
          );
          return unit
            ? {
                ...unit,
                _collaboratorPermission: grant.permission,
                _collaboratorAccessId: grant.id,
                _collaboratorAccessVersion: grant._version,
              }
            : null;
        } catch {
          return null;
        }
      }),
    );

    return { success: true, data: unitResults.filter(Boolean) };
  } catch (error) {
    console.error("[listSharedWithMe] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * List published community units (for "Community" tab).
 * Excludes the current user's own units.
 */
export async function listCommunityUnits(
  currentUsername: string,
): Promise<CollaboratorResult> {
  if (!currentUsername) {
    return { success: false, error: "Missing username" };
  }

  const client = getServerClient();

  try {
    const { data: units, errors } = await (client as any).models.Unit.list({
      filter: {
        status: { eq: "PUBLISHED" },
      },
      selectionSet: [
        "id",
        "name",
        "description",
        "owner",
        "identityId",
        "status",
        "featuredImage",
        "thumbnail",
        "publishedAt",
      ],
    });

    if (errors?.length > 0) {
      return { success: false, error: errors[0].message };
    }

    // Client-side filter: exclude own units
    const communityUnits = (units || []).filter(
      (u: any) => u.owner !== currentUsername,
    );

    return { success: true, data: communityUnits };
  } catch (error) {
    console.error("[listCommunityUnits] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Search for instructors by username prefix (for the Add Collaborator dialog).
 *
 * Queries Cognito's Instructors group and filters by prefix match.
 * Excludes the current user and the unit owner from results.
 */
export async function searchInstructors(
  query: string,
  currentUsername: string,
  unitOwner: string,
): Promise<CollaboratorResult> {
  if (!query || query.length < 2) {
    return { success: true, data: [] };
  }

  const userPoolId = getUserPoolId();
  if (!userPoolId) {
    return { success: false, error: "User pool not configured" };
  }

  try {
    const command = new ListUsersInGroupCommand({
      UserPoolId: userPoolId,
      GroupName: "Instructors",
      Limit: 60,
    });

    const response = await cognitoClient.send(command);
    const users = response.Users || [];

    // Filter by query prefix (case-insensitive) and exclude self/owner
    const lowerQuery = query.toLowerCase();
    const filtered = users
      .filter((user) => {
        const username = user.Username || "";
        const email =
          user.Attributes?.find((a) => a.Name === "email")?.Value || "";
        const name =
          user.Attributes?.find((a) => a.Name === "name")?.Value || "";
        const matchesQuery =
          username.toLowerCase().includes(lowerQuery) ||
          email.toLowerCase().includes(lowerQuery) ||
          name.toLowerCase().includes(lowerQuery);
        const isExcluded =
          username === currentUsername || username === unitOwner;
        return matchesQuery && !isExcluded;
      })
      .slice(0, 10)
      .map((user) => ({
        username: user.Username || "",
        email: user.Attributes?.find((a) => a.Name === "email")?.Value || "",
        name: user.Attributes?.find((a) => a.Name === "name")?.Value || "",
      }));

    return { success: true, data: filtered };
  } catch (error) {
    console.error("[searchInstructors] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Search failed",
    };
  }
}
