/**
 * Section Management Handler for Gen 2
 * 
 * Handles class section management:
 * - createSectionGroup: Instructor creates new class section
 * - addSelfToSection: Student joins section with code
 * - listSectionStudents: List students in section
 */

import type { Handler } from 'aws-lambda';
import { GraphQLClient, gql } from 'graphql-request';
import { GroupManager } from './groupManager';

function getGraphQLClient(authToken: string): GraphQLClient {
  const apiEndpoint = process.env.API_ENDPOINT;
  if (!apiEndpoint) throw new Error('API_ENDPOINT environment variable not set');
  
  return new GraphQLClient(apiEndpoint, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
}

const createSectionMutation = gql`
  mutation CreateSection($name: String!, $description: String!, $code: String!, $instructor: String!) {
    createSection(input: { name: $name, description: $description, code: $code, instructor: $instructor }) {
      id
      name
      code
      createdAt
    }
  }
`;

const querySectionByCode = gql`
  query GetSectionByCode($code: String!) {
    listSections(filter: { code: { eq: $code } }) {
      items {
        id
        name
        code
      }
    }
  }
`;

const queryAssignmentsBySection = gql`
  query GetAssignmentsBySection($sectionId: ID!) {
    listAssignments(filter: { sectionID: { eq: $sectionId } }) {
      items {
        id
        learner
        unitID
      }
    }
  }
`;

const createAssignmentMutation = gql`
  mutation CreateAssignment($sectionID: ID!, $unitID: ID!, $learner: String!, $readableGroups: [String!]!, $writableGroups: [String!]!) {
    createAssignment(input: { sectionID: $sectionID, unitID: $unitID, learner: $learner, readableGroups: $readableGroups, writableGroups: $writableGroups }) {
      id
    }
  }
`;

export const handler: Handler = async (event: any, context: any) => {
    const operationName = context?.['x-operation-name'] || event.info?.fieldName;
    const args = event.arguments || {};

    // Extract userId and auth token from Cognito claims
    const userId = event.requestContext?.authorizer?.claims?.sub || event.identity?.userArn;
    const authToken = event.request?.authToken || context.authorizer?.token;
    const username = event.requestContext?.authorizer?.claims?.['cognito:username'] || userId;

    if (!userId) {
        throw new Error('Unauthorized: User ID not found in event context');
    }

    if (!authToken) {
        throw new Error('Unauthorized: Auth token not found in event context');
    }

    console.log(`[Section Handler] ${operationName}`, { userId, username, args });

    try {
        const graphqlClient = getGraphQLClient(authToken);
        const groupManager = new GroupManager(process.env.USER_POOL_ID || '', process.env.AWS_REGION || 'us-east-1');

        switch (operationName) {
            case 'createSectionGroup':
                return await handleCreateSectionGroup(args, userId, username, graphqlClient, groupManager);
            case 'addSelfToSection':
                return await handleAddSelfToSection(args, userId, username, graphqlClient, groupManager);
            case 'listSectionStudents':
                return await handleListSectionStudents(args, userId, graphqlClient);
            default:
                throw new Error(`Unknown operation: ${operationName}`);
        }
    } catch (error) {
        console.error(`[Section Handler Error] ${operationName}:`, error);
        throw error;
    }
};

async function handleCreateSectionGroup(
    args: any, 
    userId: string, 
    username: string,
    client: GraphQLClient,
    groupManager: GroupManager
): Promise<string> {
    const { name, description } = args;

    try {
        // Generate unique 6-character code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Create Section using GraphQL
        const response: any = await client.request(createSectionMutation, {
            name,
            description,
            code,
            instructor: userId,
        });

        const sectionId = response.createSection.id;

        // Create Cognito groups for this section
        console.log(`[Section] Creating Cognito groups for section ${sectionId}`);
        try {
            await groupManager.createInstructorGroup(sectionId, name);
            await groupManager.createLearnerGroup(sectionId, name);
            
            // Add the creator as an instructor
            await groupManager.addInstructor(username, sectionId);
            console.log(`[Section] Groups created successfully, ${username} added as instructor`);
        } catch (groupError) {
            console.error(`[Section] Warning: Failed to create/manage groups:`, groupError);
            // Don't fail section creation if groups fail - groups are for authorization only
            // Data model will still work without them
        }

        return JSON.stringify({
            sectionId,
            name,
            code,
            createdAt: response.createSection.createdAt,
            message: `Section "${name}" created with code ${code}. Instructor added to section.`,
        });
    } catch (error) {
        console.error('[Create Section Error]:', error);
        throw error;
    }
}

async function handleAddSelfToSection(
    args: any, 
    userId: string,
    username: string,
    client: GraphQLClient,
    groupManager: GroupManager
): Promise<string> {
    const { code } = args;

    try {
        // Query for section by code
        const sectionResponse: any = await client.request(querySectionByCode, { code });

        if (!sectionResponse.listSections.items || sectionResponse.listSections.items.length === 0) {
            throw new Error(`No section found with code: ${code}`);
        }

        const section = sectionResponse.listSections.items[0];
        const sectionId = section.id;

        // Get all Assignments in this section to count them
        const assignmentsResponse: any = await client.request(queryAssignmentsBySection, {
            sectionId,
        });

        const assignmentCount = assignmentsResponse.listAssignments.items?.length || 0;

        // Add student to learner group for this section
        // Students will now have access to all assignments created by instructors
        console.log(`[Section] Adding ${username} to learner group for section ${sectionId}`);
        try {
            await groupManager.addLearner(username, sectionId);
            console.log(`[Section] ${username} added to learner group successfully`);
        } catch (groupError) {
            console.error(`[Section] Warning: Failed to add user to group:`, groupError);
            // Don't fail join if groups fail - groups are for authorization only
        }

        return JSON.stringify({
            sectionCode: code,
            sectionId,
            sectionName: section.name,
            joined: true,
            joinedAt: new Date().toISOString(),
            availableAssignments: assignmentCount,
            message: `Successfully joined section with code ${code}. You now have access to ${assignmentCount} assignment(s).`,
        });
    } catch (error) {
        console.error('[Add to Section Error]:', error);
        throw error;
    }
}

async function handleListSectionStudents(args: any, _userId: string, client: GraphQLClient): Promise<any[]> {
    const { sectionCode } = args;

    try {
        // Query for section by code
        const sectionResponse: any = await client.request(querySectionByCode, { code: sectionCode });

        if (!sectionResponse.listSections.items || sectionResponse.listSections.items.length === 0) {
            return [];
        }

        const section = sectionResponse.listSections.items[0];

        // Get all assignments for this section
        const assignmentsResponse: any = await client.request(queryAssignmentsBySection, {
            sectionId: section.id,
        });

        // Extract unique learners
        const uniqueLearners = [...new Set(
            assignmentsResponse.listAssignments.items.map((a: any) => a.learner)
        )];

        // In production, fetch user details from Cognito for each learner
        // For now, return basic student info with learner IDs
        return (uniqueLearners as string[]).map((learnerId: string) => ({
            id: learnerId,
            name: `Student ${learnerId.substring(0, 8)}`, // Placeholder name
            email: `${learnerId}@example.com`, // Placeholder email
        }));
    } catch (error) {
        console.error('[List Section Students Error]:', error);
        throw error;
    }
}
