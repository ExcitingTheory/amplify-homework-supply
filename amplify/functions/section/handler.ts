/**
 * Section Management Handler for Gen 2
 *
 * Handles class section management:
 * - createSectionGroup: Creates section record + Cognito groups
 * - addSelfToSection: Adds user to section + creates assignments
 * - listSectionStudents: Lists users in section's learner group
 */

import type { Handler } from "aws-lambda";
import { type Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { GroupManager } from "./groupManager";
import {
  createNotification,
  createNotificationsForRecipients,
} from "../shared/notificationUtils";
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import { fromEnv } from "@aws-sdk/credential-providers";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import * as crypto from "crypto";

// Cache for User Pool ID discovery
let cachedUserPoolId: string | null = null;

// Cold-start cache for CloudFront signing credentials
let cfPrivateKey: string | null = null;
let cfKeyPairId: string | null = null;

/**
 * Generate a CloudFront canned-policy signed URL using Node.js built-in crypto.
 * Avoids any external signing library dependency.
 */
function signCFUrl(
  url: string,
  privateKey: string,
  keyPairId: string,
  expiresAt: number, // Unix epoch seconds
): string {
  const policy = JSON.stringify({
    Statement: [
      {
        Resource: url,
        Condition: {
          DateLessThan: { "AWS:EpochTime": expiresAt },
        },
      },
    ],
  });

  const sign = crypto.createSign("RSA-SHA1");
  sign.update(Buffer.from(policy));
  const rawSig = sign.sign(privateKey, "base64");

  // CloudFront base64 uses - _ ~ instead of + = /
  const signature = rawSig.replace(/\+/g, "-").replace(/=/g, "_").replace(/\//g, "~");

  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}Expires=${expiresAt}&Signature=${signature}&Key-Pair-Id=${keyPairId}`;
}

/**
 * Discover User Pool ID from CloudFormation stack exports
 * Amplify Gen 2 exports the user pool ID in stack outputs
 */
async function getUserPoolId(): Promise<string> {
  if (cachedUserPoolId) return cachedUserPoolId;

  // Try environment variable first (if set by other means)
  if (process.env.USER_POOL_ID) {
    cachedUserPoolId = process.env.USER_POOL_ID;
    return cachedUserPoolId;
  }

  // Discover from CloudFormation - Amplify exports as amplify-{appName}-{branch}-{hash}-auth-userpool
  const cfnClient = new CloudFormationClient({
    region: process.env.AWS_REGION,
  });

  try {
    // Get stack name from Lambda function ARN or environment
    const stackName = process.env.AWS_LAMBDA_FUNCTION_NAME?.split("-")
      .slice(0, -2)
      .join("-");

    if (stackName) {
      const response = await cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName }),
      );
      const stack = response.Stacks?.[0];
      const userPoolOutput = stack?.Outputs?.find(
        (o) =>
          o.OutputKey?.includes("UserPool") ||
          o.OutputKey?.includes("userPool"),
      );

      if (userPoolOutput?.OutputValue) {
        cachedUserPoolId = userPoolOutput.OutputValue;
        return cachedUserPoolId;
      }
    }
  } catch (error) {
    console.warn(
      "[getUserPoolId] Failed to discover from CloudFormation:",
      error,
    );
  }

  throw new Error(
    "USER_POOL_ID not found. Set as environment variable or ensure CloudFormation exports are available.",
  );
}

// In Gen 2, Lambda resolvers automatically get AppSync endpoint via env vars
// Configure Amplify with the endpoint for data client operations
Amplify.configure(
  {
    API: {
      GraphQL: {
        endpoint: process.env.API_ENDPOINT || "",
        region: process.env.AWS_REGION || "us-east-1",
        defaultAuthMode: "iam", // Lambda uses IAM auth to call AppSync
      },
    },
  },
  {
    Auth: {
      credentialsProvider: {
        getCredentialsAndIdentityId: async () => ({
          credentials: await fromEnv()(),
        }),
        clearCredentialsAndIdentityId: () => {},
      },
    },
  },
);

// Raw GraphQL operations - .models API doesn't work in Lambda resolvers
const CREATE_SECTION = /* GraphQL */ `
  mutation CreateSection($input: CreateSectionInput!) {
    createSection(input: $input) {
      id
      _version
      _lastChangedAt
      _deleted
      name
      code
      createdAt
    }
  }
`;

const GET_SECTION = /* GraphQL */ `
  query GetSection($id: ID!) {
    getSection(id: $id) {
      id
      _version
      _lastChangedAt
      _deleted
      name
      code
      readableGroups
      writableGroups
    }
  }
`;

const UPDATE_SECTION = /* GraphQL */ `
  mutation UpdateSection($input: UpdateSectionInput!) {
    updateSection(input: $input) {
      id
      _version
      _lastChangedAt
      _deleted
      readableGroups
      writableGroups
    }
  }
`;

const LIST_SECTIONS_BY_CODE = /* GraphQL */ `
  query ListSections($filter: ModelSectionFilterInput) {
    listSections(filter: $filter) {
      items {
        id
        _version
        _lastChangedAt
        _deleted
        name
        code
      }
    }
  }
`;

const LIST_ASSIGNMENTS = /* GraphQL */ `
  query ListAssignments($filter: ModelAssignmentFilterInput) {
    listAssignments(filter: $filter) {
      items {
        id
        _version
        _lastChangedAt
        _deleted
        unitID
        sectionID
      }
    }
  }
`;

const CREATE_ASSIGNMENT = /* GraphQL */ `
  mutation CreateAssignment($input: CreateAssignmentInput!) {
    createAssignment(input: $input) {
      id
      _version
      _lastChangedAt
      _deleted
    }
  }
`;

// Peer Review GraphQL operations
const GET_GRADE = /* GraphQL */ `
  query GetGrade($id: ID!) {
    getGrade(id: $id) {
      id
      _version
      _lastChangedAt
      _deleted
      sectionID
      owner
    }
  }
`;

const UPDATE_GRADE = /* GraphQL */ `
  mutation UpdateGrade($input: UpdateGradeInput!) {
    updateGrade(input: $input) {
      id
      _version
      _lastChangedAt
      _deleted
      reviewRoomId
      peerReviewGroup
    }
  }
`;

const CREATE_HOMEWORK_ROOM = /* GraphQL */ `
  mutation CreateHomeworkRoom($input: CreateHomeworkRoomInput!) {
    createHomeworkRoom(input: $input) {
      id
      _version
      _lastChangedAt
      _deleted
      code
      gradeId
      ownerId
      sectionID
      status
      peerGroup
      invitedUserIds
    }
  }
`;

const LIST_HOMEWORK_ROOMS_BY_CODE = /* GraphQL */ `
  query ListHomeworkRoomsByCode($code: String!) {
    listHomeworkRooms(filter: { code: { eq: $code } }) {
      items {
        id
        _version
        _lastChangedAt
        _deleted
        code
        gradeId
        ownerId
        sectionID
        status
        peerGroup
        invitedUserIds
      }
    }
  }
`;

const UPDATE_HOMEWORK_ROOM = /* GraphQL */ `
  mutation UpdateHomeworkRoom($input: UpdateHomeworkRoomInput!) {
    updateHomeworkRoom(input: $input) {
      id
      _version
      _lastChangedAt
      _deleted
      invitedUserIds
    }
  }
`;

const LIST_GRADES_BY_SECTION = /* GraphQL */ `
  query ListGradesBySection($filter: ModelGradeFilterInput) {
    listGrades(filter: $filter) {
      items {
        id
        _version
        _lastChangedAt
        _deleted
        sectionID
        owner
      }
    }
  }
`;

// Query used by getStudentSubmissionUrl — includes identityId for path validation
const GET_GRADE_WITH_IDENTITY = /* GraphQL */ `
  query GetGradeWithIdentity($id: ID!) {
    getGrade(id: $id) {
      id
      sectionID
      owner
      identityId
    }
  }
`;

// Query used by getStudentSubmissionUrl — includes instructor for section ownership check
const GET_SECTION_INSTRUCTOR = /* GraphQL */ `
  query GetSectionInstructor($id: ID!) {
    getSection(id: $id) {
      id
      instructor
    }
  }
`;

// Initialize client lazily to ensure environment variables are set
let client: any = null;

function getClient() {
  if (!client) {
    if (!process.env.API_ENDPOINT) {
      throw new Error(
        "API_ENDPOINT environment variable not set. Lambda must be configured as AppSync resolver.",
      );
    }
    // Create client - authMode is already set in Amplify.configure()
    // Use untyped client to avoid auto-generation of versioning fields
    console.log("[Section] Initializing untyped GraphQL client");
    client = generateClient();
  }
  return client;
}

export const handler: Handler = async (event: any, context: any) => {
  // Extract operation name from AppSync event
  const operationName = event.info?.fieldName || event.fieldName;
  const args = event.arguments || {};

  if (!operationName) {
    console.error(
      "[Section Handler] No operation name found in event:",
      JSON.stringify(event, null, 2),
    );
    throw new Error("Unable to determine operation name from event");
  }

  // Extract userId from AppSync identity (Gen 2 pattern)
  const userId = event.identity?.sub;
  const username = event.identity?.username;
  const claims = event.identity?.claims || {};

  if (!userId) {
    console.error(
      "[Section Handler] No user identity found in event:",
      JSON.stringify(event, null, 2),
    );
    throw new Error("Unauthorized: User ID not found in event context");
  }

  console.log(`[Section Handler] ${operationName}`, { userId, username, args });

  try {
    const userPoolId = await getUserPoolId();
    const groupManager = new GroupManager(
      userPoolId,
      process.env.AWS_REGION || "us-east-1",
    );

    switch (operationName) {
      case "createSectionGroup":
        return await handleCreateSectionGroup(
          args,
          userId,
          username || userId,
          groupManager,
        );
      case "addSelfToSection":
        return await handleAddSelfToSection(
          args,
          userId,
          username || userId,
          groupManager,
        );
      case "listSectionStudents":
        return await handleListSectionStudents(args, userId, groupManager);
      case "createPeerReviewRoom":
        return await handleCreatePeerReviewRoom(
          args,
          userId,
          username || userId,
          groupManager,
        );
      case "joinPeerReview":
        return await handleJoinPeerReview(
          args,
          userId,
          username || userId,
          groupManager,
        );
      case "getStudentSubmissionUrl":
        return await handleGetStudentSubmissionUrl(args, userId, claims);
      default:
        throw new Error(`Unknown operation: ${operationName}`);
    }
  } catch (error) {
    console.error(`[Section Handler Error] ${operationName}:`, error);
    // Ensure we throw a proper Error instance, not an object
    if (error instanceof Error) {
      throw error;
    }
    // Convert non-Error objects to Error instances
    const errorMessage =
      typeof error === "object" && error !== null
        ? JSON.stringify(error, null, 2)
        : String(error);
    throw new Error(`Section handler error: ${errorMessage}`);
  }
};

/**
 * Creates a new section with Cognito groups
 */
async function handleCreateSectionGroup(
  args: any,
  userId: string,
  username: string,
  groupManager: GroupManager,
): Promise<string> {
  const { name, description } = args;

  try {
    // Generate unique 6-character code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const client = getClient();

    // Pre-generate section ID for group names (we'll let DynamoDB auto-generate if needed)
    // Actually, we need to use a UUID since we need to know the ID before creation for groups
    const sectionId = crypto.randomUUID();

    // Pre-calculate group names to include in CREATE (avoids need for UPDATE with _version)
    const readableGroups = [
      `section-${sectionId}-instructors`,
      `section-${sectionId}-learners`,
    ];
    const writableGroups = [`section-${sectionId}-instructors`];

    // Create section using GraphQL mutation with groups included
    // This avoids needing a separate UPDATE which would require _version
    const { data, errors } = await client.graphql({
      query: CREATE_SECTION,
      variables: {
        input: {
          id: sectionId, // Specify ID so it matches pre-calculated group names
          name,
          description: description || "",
          code,
          instructor: userId,
          status: "PUBLISHED",
          readableGroups,
          writableGroups,
        },
      },
    });

    if (errors || !data?.createSection) {
      console.error("[Create Section Error]:", { data, errors });
      throw new Error(`Failed to create section: ${JSON.stringify(errors)}`);
    }

    const section = data.createSection;

    // Create Cognito groups for this section
    console.log(`[Section] Creating Cognito groups for section ${sectionId}`);
    try {
      await groupManager.createInstructorGroup(sectionId, name);
      await groupManager.createLearnerGroup(sectionId, name);

      // Add the creator as an instructor
      await groupManager.addInstructor(username, sectionId);
      console.log(
        `[Section] Groups created successfully, ${username} added as instructor`,
      );
    } catch (groupError) {
      console.error(
        `[Section] Warning: Failed to create/manage groups:`,
        groupError,
      );
      // Log full error details
      if (groupError instanceof Error) {
        console.error(`[Section] Error message: ${groupError.message}`);
        console.error(`[Section] Error stack: ${groupError.stack}`);
      } else {
        console.error(
          `[Section] Error object:`,
          JSON.stringify(groupError, null, 2),
        );
      }
      // Don't fail section creation if groups fail - groups are for authorization only
    }

    return JSON.stringify({
      sectionId,
      name,
      code,
      createdAt: section.createdAt,
      message: `Section "${name}" created with code ${code}. Instructor added to section.`,
    });
  } catch (error) {
    console.error("[Create Section Error]:", error);
    // Log detailed error information
    if (error instanceof Error) {
      console.error("[Create Section Error Details]:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    } else {
      console.error(
        "[Create Section Error Object]:",
        JSON.stringify(error, null, 2),
      );
    }
    throw error;
  }
}

/**
 * Adds user to section and creates assignments for all units
 */
async function handleAddSelfToSection(
  args: any,
  userId: string,
  username: string,
  groupManager: GroupManager,
): Promise<string> {
  const { code } = args;

  try {
    // Look up Section by code using GraphQL
    const client = getClient();
    const { data: listData, errors: lookupErrors } = await client.graphql({
      query: LIST_SECTIONS_BY_CODE,
      variables: {
        filter: { code: { eq: code } },
      },
    });

    if (
      lookupErrors ||
      !listData?.listSections?.items ||
      listData.listSections.items.length === 0
    ) {
      console.error("[Section] Section not found with code:", code);
      throw new Error(`No section found with code ${code}`);
    }

    const section = listData.listSections.items[0];
    const sectionId = section.id;

    // Add user to section learner group
    await groupManager.addLearner(username, sectionId);
    console.log(
      `[Section] Added ${username} to learner group for section ${sectionId}`,
    );

    // Get all assignments for this section to create student copies
    const { data: assignmentsData } = await client.graphql({
      query: LIST_ASSIGNMENTS,
      variables: {
        filter: { sectionID: { eq: sectionId } },
      },
    });

    const sectionAssignments = assignmentsData?.listAssignments?.items || [];

    // Create assignments for this student
    // Must match GroupManager's naming pattern: section-{id}-{role}
    const readableGroups = [`section-${sectionId}-learners`];
    const writableGroups = [`section-${sectionId}-learners`];

    // Filter out null items that can appear in subscription arrays
    const validAssignments = sectionAssignments.filter(
      (a: any) => a != null && a.id != null,
    );

    for (const assignment of validAssignments) {
      await client.graphql({
        query: CREATE_ASSIGNMENT,
        variables: {
          input: {
            sectionID: sectionId,
            unitID: assignment.unitID,
            learner: userId,
            readableGroups,
            writableGroups,
            status: "PUBLISHED",
          },
        },
      });
    }

    return JSON.stringify({
      success: true,
      sectionId,
      sectionName: section.name,
      assignmentsCreated: sectionAssignments?.length || 0,
      message: `Successfully joined section "${section.name}"`,
    });
  } catch (error) {
    console.error("[Add Self to Section Error]:", error);
    throw error;
  }
}

/**
 * Lists students in a section's learner group
 */
async function handleListSectionStudents(
  args: any,
  userId: string,
  groupManager: GroupManager,
): Promise<any[]> {
  const { sectionCode } = args;

  try {
    // Look up section by code to get the actual UUID
    const client = getClient();
    const { data } = await client.graphql({
      query: LIST_SECTIONS_BY_CODE,
      variables: { filter: { code: { eq: sectionCode } } },
    });

    const section = data?.listSections?.items?.[0];
    if (!section) {
      console.warn(
        `[listSectionStudents] No section found with code: ${sectionCode}`,
      );
      return [];
    }

    const sectionId = section.id;

    // Get learners from Cognito group
    const learners = await groupManager.listLearnersInSection(sectionId);

    return learners.map((learner: any) => {
      const attrs = learner.Attributes || [];
      const firstName =
        attrs.find((a: any) => a.Name === "given_name")?.Value || "";
      const lastName =
        attrs.find((a: any) => a.Name === "family_name")?.Value || "";
      const preferredName =
        attrs.find((a: any) => a.Name === "preferred_username")?.Value || "";
      const legacyName = attrs.find((a: any) => a.Name === "name")?.Value || "";
      const email = attrs.find((a: any) => a.Name === "email")?.Value || "";

      // Build display name: prefer first+last, fall back to legacy "name", then username
      const name =
        firstName && lastName
          ? `${firstName} ${lastName}`
          : legacyName || learner.Username;

      return {
        id: learner.Username,
        name,
        firstName,
        lastName,
        preferredName,
        email,
      };
    });
  } catch (error) {
    console.error("[List Section Students Error]:", error);
    throw error;
  }
}

// ========================================================================
// PEER REVIEW HANDLERS
// ========================================================================

/**
 * Creates a peer review room.
 *
 * 1. Verifies the caller owns the Grade
 * 2. Creates a Cognito group `review-{roomId}-peers`
 * 3. Adds invited users to the group (validates same section)
 * 4. Creates HomeworkRoom record with join code
 * 5. Updates Grade with reviewRoomId and peerReviewGroup
 */
async function handleCreatePeerReviewRoom(
  args: any,
  userId: string,
  username: string,
  groupManager: GroupManager,
): Promise<string> {
  const { gradeId, invitedUserIds } = args;
  const client = getClient();

  try {
    // 1. Fetch grade and verify ownership
    const { data: gradeData, errors: gradeErrors } = await client.graphql({
      query: GET_GRADE,
      variables: { id: gradeId },
    });

    if (gradeErrors || !gradeData?.getGrade) {
      throw new Error(`Grade ${gradeId} not found`);
    }

    const grade = gradeData.getGrade;
    if (grade.owner !== userId && grade.owner !== username) {
      throw new Error("Only the grade owner can create a peer review room");
    }

    const sectionId = grade.sectionID;

    // 2. Generate room ID and join code
    const roomId = crypto.randomUUID();
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const peerGroupName = `review-${roomId}-peers`;

    // 3. Create Cognito group for peers
    try {
      await groupManager.createPeerReviewGroup(roomId);
    } catch (groupError) {
      console.error("[PeerReview] Failed to create Cognito group:", groupError);
      // Continue — group auth is additive, room still works via invitedUserIds check
    }

    // 4. Validate invited users are in the same section and add to group
    const validInvites: string[] = [];
    if (invitedUserIds && invitedUserIds.length > 0 && sectionId) {
      for (const invitedUserId of invitedUserIds) {
        const isSameSection = await isUserInSection(
          client,
          invitedUserId,
          sectionId,
        );
        if (isSameSection) {
          validInvites.push(invitedUserId);
          try {
            await groupManager.addToPeerReviewGroup(invitedUserId, roomId);
          } catch (err) {
            console.warn(
              `[PeerReview] Failed to add ${invitedUserId} to group:`,
              err,
            );
          }
        } else {
          console.warn(
            `[PeerReview] Skipping ${invitedUserId} — not in section ${sectionId}`,
          );
        }
      }
    }

    // 5. Create HomeworkRoom
    const { data: roomData, errors: roomErrors } = await client.graphql({
      query: CREATE_HOMEWORK_ROOM,
      variables: {
        input: {
          id: roomId,
          gradeId,
          ownerId: userId,
          sectionID: sectionId || null,
          status: "OPEN",
          code,
          peerGroup: peerGroupName,
          invitedUserIds: validInvites,
        },
      },
    });

    if (roomErrors || !roomData?.createHomeworkRoom) {
      console.error("[PeerReview] Failed to create room:", roomErrors);
      throw new Error("Failed to create peer review room");
    }

    // 6. Update Grade with room reference
    await client.graphql({
      query: UPDATE_GRADE,
      variables: {
        input: {
          id: gradeId,
          reviewRoomId: roomId,
          peerReviewGroup: peerGroupName,
          _version: grade._version ?? 1,
        },
      },
    });

    // 7. Create notifications for invited users
    if (validInvites.length > 0) {
      try {
        await createNotificationsForRecipients(client, validInvites, {
          type: "PEER_REVIEW_INVITE",
          title: "Peer Review Invitation",
          body: `${username} invited you to review their work. Code: ${code}`,
          linkPath: `/review/${roomId}`,
          linkLabel: "Join Review",
          referenceId: roomId,
          referenceType: "HomeworkRoom",
          senderName: username,
          metadata: { roomId, code, gradeId },
        });
      } catch (err) {
        console.warn("[PeerReview] Notification creation failed:", err);
      }
    }

    return JSON.stringify({
      success: true,
      roomId,
      code,
      invitedCount: validInvites.length,
      skippedCount: (invitedUserIds?.length || 0) - validInvites.length,
      message: `Peer review room created with code ${code}`,
    });
  } catch (error) {
    console.error("[Create Peer Review Room Error]:", error);
    throw error;
  }
}

/**
 * Joins a peer review room via join code.
 *
 * 1. Looks up HomeworkRoom by code
 * 2. Validates room is open
 * 3. Validates caller is in the same section as the room's Grade
 * 4. Adds caller to invitedUserIds and Cognito group
 */
async function handleJoinPeerReview(
  args: any,
  userId: string,
  username: string,
  groupManager: GroupManager,
): Promise<string> {
  const { code } = args;
  const client = getClient();

  try {
    // 1. Look up room by code
    const { data: listData, errors: lookupErrors } = await client.graphql({
      query: LIST_HOMEWORK_ROOMS_BY_CODE,
      variables: { code },
    });

    if (lookupErrors || !listData?.listHomeworkRooms?.items?.length) {
      throw new Error(`No peer review room found with code ${code}`);
    }

    const room = listData.listHomeworkRooms.items[0];

    // 2. Validate room is not closed
    if (room.status === "REVIEW_COMPLETE") {
      throw new Error("This peer review session has ended");
    }

    // 3. Prevent self-join by owner
    if (room.ownerId === userId || room.ownerId === username) {
      throw new Error("You cannot join your own review room");
    }

    // 4. Check if already joined
    const existingInvites: string[] = room.invitedUserIds || [];
    if (
      existingInvites.includes(userId) ||
      existingInvites.includes(username)
    ) {
      return JSON.stringify({
        success: true,
        roomId: room.id,
        alreadyJoined: true,
        message: "You have already joined this review room",
      });
    }

    // 5. Validate same section
    if (room.sectionID) {
      const isSameSection = await isUserInSection(
        client,
        userId,
        room.sectionID,
      );
      if (!isSameSection) {
        throw new Error(
          "You must be in the same class section to join this review",
        );
      }
    }

    // 6. Add to Cognito group
    if (room.peerGroup) {
      try {
        await groupManager.addToPeerReviewGroup(
          username,
          room.id.replace("review-", "").replace("-peers", ""),
        );
      } catch (err) {
        console.warn(
          `[PeerReview] Failed to add ${username} to Cognito group:`,
          err,
        );
      }
    }

    // 7. Update invitedUserIds on the room
    const updatedInvites = [...existingInvites, userId];
    await client.graphql({
      query: UPDATE_HOMEWORK_ROOM,
      variables: {
        input: {
          id: room.id,
          invitedUserIds: updatedInvites,
          _version: room._version ?? 1,
        },
      },
    });

    return JSON.stringify({
      success: true,
      roomId: room.id,
      gradeId: room.gradeId,
      message: `Successfully joined peer review room`,
    });
  } catch (error) {
    console.error("[Join Peer Review Error]:", error);
    throw error;
  }
}

/**
 * Checks if a user has a Grade in the given section (same-section validation).
 */
async function isUserInSection(
  client: any,
  userId: string,
  sectionID: string,
): Promise<boolean> {
  try {
    const { data } = await client.graphql({
      query: LIST_GRADES_BY_SECTION,
      variables: {
        filter: {
          sectionID: { eq: sectionID },
          owner: { eq: userId },
        },
      },
    });
    return (data?.listGrades?.items?.length || 0) > 0;
  } catch (error) {
    console.warn(`[PeerReview] Section check failed for ${userId}:`, error);
    return false;
  }
}

// ========================================================================
// STUDENT SUBMISSION URL (instructor cross-user file access)
// ========================================================================

/**
 * Returns a short-lived S3 presigned URL for a student's private submission file.
 *
 * Authorization checks (in order):
 *  1. AppSync auth rule already verified caller is in Instructors or Admins group.
 *  2. Grade exists and its identityId is used to validate the submissionKey prefix
 *     (prevents path traversal — an instructor cannot request an arbitrary private path).
 *  3. Caller is the section instructor (section.instructor === userId) OR is an Admin
 *     OR is in the section's Cognito instructor group.
 */
async function handleGetStudentSubmissionUrl(
  args: any,
  userId: string,
  claims: Record<string, any>,
): Promise<string> {
  const { gradeId, submissionKey } = args;

  if (!gradeId || !submissionKey) {
    throw new Error("gradeId and submissionKey are required");
  }

  const client = getClient();

  // 1. Fetch grade — needs identityId and sectionID
  const { data: gradeData, errors: gradeErrors } = await client.graphql({
    query: GET_GRADE_WITH_IDENTITY,
    variables: { id: gradeId },
  });

  if (gradeErrors?.length || !gradeData?.getGrade) {
    console.error("[getStudentSubmissionUrl] Grade not found:", gradeErrors);
    throw new Error("Grade not found");
  }

  const grade = gradeData.getGrade;

  // 2. Path traversal prevention — submissionKey must be under the grade owner's private path
  const expectedPrefix = `private/${grade.identityId}/`;
  if (!grade.identityId || !submissionKey.startsWith(expectedPrefix)) {
    console.error(
      "[getStudentSubmissionUrl] submissionKey does not match grade owner identity",
      { submissionKey, expectedPrefix },
    );
    throw new Error(
      "Unauthorized: submission key does not match grade owner identity",
    );
  }

  // 3. Section authorization — caller must be the section's instructor or an Admin
  const userGroups: string[] = claims["cognito:groups"] || [];
  const isAdmin = userGroups.includes("Admins");

  if (!isAdmin) {
    if (!grade.sectionID) {
      throw new Error(
        "Unauthorized: grade is not associated with a section",
      );
    }

    const { data: sectionData, errors: sectionErrors } = await client.graphql({
      query: GET_SECTION_INSTRUCTOR,
      variables: { id: grade.sectionID },
    });

    if (sectionErrors?.length || !sectionData?.getSection) {
      console.error(
        "[getStudentSubmissionUrl] Section not found:",
        sectionErrors,
      );
      throw new Error("Section not found");
    }

    const section = sectionData.getSection;
    const sectionInstructorGroup = `section-${grade.sectionID}-instructors`;
    const isInstructorOfSection =
      section.instructor === userId ||
      userGroups.includes(sectionInstructorGroup);

    if (!isInstructorOfSection) {
      console.error(
        "[getStudentSubmissionUrl] Caller is not an instructor of this section",
        { userId, sectionId: grade.sectionID, sectionInstructor: section.instructor },
      );
      throw new Error(
        "Unauthorized: caller is not an instructor of this section",
      );
    }
  }

  // 4. Generate short-lived CloudFront signed URL (15 minutes)
  const cdnDomain = process.env.CDN_DOMAIN;
  if (!cdnDomain) {
    throw new Error("CDN_DOMAIN environment variable not set");
  }

  // Load CF credentials from SSM on first invocation, then reuse from cache
  if (!cfPrivateKey || !cfKeyPairId) {
    const ssmClient = new SSMClient({ region: process.env.AWS_REGION || "us-east-1" });
    const [pkResult, kpIdResult] = await Promise.all([
      ssmClient.send(new GetParameterCommand({
        Name: "/homework-supply/cloudfront/private-key",
        WithDecryption: true,
      })),
      ssmClient.send(new GetParameterCommand({
        Name: "/homework-supply/cloudfront/key-pair-id",
      })),
    ]);
    cfPrivateKey = pkResult.Parameter?.Value ?? null;
    cfKeyPairId = kpIdResult.Parameter?.Value ?? null;
  }

  if (!cfPrivateKey || !cfKeyPairId) {
    throw new Error("CloudFront signing credentials not available in SSM");
  }

  const signedUrl = signCFUrl(
    `https://${cdnDomain}/${submissionKey}`,
    cfPrivateKey,
    cfKeyPairId,
    Math.floor((Date.now() + 15 * 60 * 1000) / 1000),
  );

  console.log("[getStudentSubmissionUrl] Generated CloudFront signed URL for:", {
    gradeId,
    sectionID: grade.sectionID,
    requestedBy: userId,
  });

  return signedUrl;
}
