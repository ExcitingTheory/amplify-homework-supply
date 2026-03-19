/**
 * Section Management Handler for Gen 2
 * 
 * Handles class section management:
 * - createSectionGroup: Creates section record + Cognito groups
 * - addSelfToSection: Adds user to section + creates assignments
 * - listSectionStudents: Lists users in section's learner group
 */

import type { Handler } from 'aws-lambda';
import { type Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { GroupManager } from './groupManager';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { fromEnv } from '@aws-sdk/credential-providers';

// Cache for User Pool ID discovery
let cachedUserPoolId: string | null = null;

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
  const cfnClient = new CloudFormationClient({ region: process.env.AWS_REGION });
  
  try {
    // Get stack name from Lambda function ARN or environment
    const stackName = process.env.AWS_LAMBDA_FUNCTION_NAME?.split('-').slice(0, -2).join('-');
    
    if (stackName) {
      const response = await cfnClient.send(new DescribeStacksCommand({ StackName: stackName }));
      const stack = response.Stacks?.[0];
      const userPoolOutput = stack?.Outputs?.find(o => o.OutputKey?.includes('UserPool') || o.OutputKey?.includes('userPool'));
      
      if (userPoolOutput?.OutputValue) {
        cachedUserPoolId = userPoolOutput.OutputValue;
        return cachedUserPoolId;
      }
    }
  } catch (error) {
    console.warn('[getUserPoolId] Failed to discover from CloudFormation:', error);
  }
  
  throw new Error('USER_POOL_ID not found. Set as environment variable or ensure CloudFormation exports are available.');
}


// In Gen 2, Lambda resolvers automatically get AppSync endpoint via env vars
// Configure Amplify with the endpoint for data client operations
Amplify.configure(
  {
    API: {
      GraphQL: {
        endpoint: process.env.API_ENDPOINT || '',
        region: process.env.AWS_REGION || 'us-east-1',
        defaultAuthMode: 'iam', // Lambda uses IAM auth to call AppSync
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
  }
);

// Raw GraphQL operations - .models API doesn't work in Lambda resolvers
const CREATE_SECTION = /* GraphQL */ `
  mutation CreateSection($input: CreateSectionInput!) {
    createSection(input: $input) {
      id
      name
      code
      createdAt
      _version
    }
  }
`;

const UPDATE_SECTION = /* GraphQL */ `
  mutation UpdateSection($input: UpdateSectionInput!) {
    updateSection(input: $input) {
      id
      readableGroups
      writableGroups
      _version
    }
  }
`;

const LIST_SECTIONS_BY_CODE = /* GraphQL */ `
  query ListSections($filter: ModelSectionFilterInput) {
    listSections(filter: $filter) {
      items {
        id
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
    }
  }
`;

// Initialize client lazily to ensure environment variables are set
let client: any = null;

function getClient() {
  if (!client) {
    if (!process.env.API_ENDPOINT) {
      throw new Error('API_ENDPOINT environment variable not set. Lambda must be configured as AppSync resolver.');
    }
    // Create client - authMode is already set in Amplify.configure()
    // Use untyped client to avoid auto-generation of versioning fields
    console.log('[Section] Initializing untyped GraphQL client');
    client = generateClient();
  }
  return client;
}

export const handler: Handler = async (event: any, context: any) => {
    // Extract operation name from AppSync event
    const operationName = event.info?.fieldName || event.fieldName;
    const args = event.arguments || {};
    
    if (!operationName) {
        console.error('[Section Handler] No operation name found in event:', JSON.stringify(event, null, 2));
        throw new Error('Unable to determine operation name from event');
    }

    // Extract userId from AppSync identity (Gen 2 pattern)
    const userId = event.identity?.sub;
    const username = event.identity?.username;
    const claims = event.identity?.claims || {};

    if (!userId) {
        console.error('[Section Handler] No user identity found in event:', JSON.stringify(event, null, 2));
        throw new Error('Unauthorized: User ID not found in event context');
    }

    console.log(`[Section Handler] ${operationName}`, { userId, username, args });

    try {
        const userPoolId = await getUserPoolId();
        const groupManager = new GroupManager(userPoolId, process.env.AWS_REGION || 'us-east-1');

        switch (operationName) {
            case 'createSectionGroup':
                return await handleCreateSectionGroup(args, userId, username || userId, groupManager);
            case 'addSelfToSection':
                return await handleAddSelfToSection(args, userId, username || userId, groupManager);
            case 'listSectionStudents':
                return await handleListSectionStudents(args, userId, groupManager);
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
        const errorMessage = typeof error === 'object' && error !== null 
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
    groupManager: GroupManager
): Promise<string> {
    const { name, description } = args;

    try {
        // Generate unique 6-character code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const client = getClient();
        
        // Create section using GraphQL mutation - only pass required fields (no _version)
        const { data, errors } = await client.graphql({
            query: CREATE_SECTION,
            variables: {
                input: {
                    name,
                    description: description || '',
                    code,
                    instructor: userId,
                    status: 'PUBLISHED',
                },
            },
        });

        if (errors || !data?.createSection) {
            console.error('[Create Section Error]:', { data, errors });
            throw new Error(`Failed to create section: ${JSON.stringify(errors)}`);
        }

        const section = data.createSection;
        const sectionId = section.id;

        // Create Cognito groups for this section
        console.log(`[Section] Creating Cognito groups for section ${sectionId}`);
        try {
            await groupManager.createInstructorGroup(sectionId, name);
            await groupManager.createLearnerGroup(sectionId, name);
            
            // Add the creator as an instructor
            await groupManager.addInstructor(username, sectionId);
            console.log(`[Section] Groups created successfully, ${username} added as instructor`);
            
            // Update Section with dynamic groups for authorization
            const readableGroups = [`instructor-${sectionId}`, `learner-${sectionId}`];
            const writableGroups = [`instructor-${sectionId}`];
            
            console.log(`[Section] Updating section ${sectionId} with groups, _version: ${section._version}`);
            const updateResult = await client.graphql({
                query: UPDATE_SECTION,
                variables: {
                    input: {
                        id: sectionId,
                        _version: section._version, // Required for optimistic concurrency
                        readableGroups,
                        writableGroups,
                    },
                },
            });
            
            if (updateResult.errors) {
                console.error(`[Section] Update section errors:`, JSON.stringify(updateResult.errors, null, 2));
                throw new Error(`Failed to update section groups: ${JSON.stringify(updateResult.errors)}`);
            }
            
            console.log(`[Section] Updated section with group authorization`);
        } catch (groupError) {
            console.error(`[Section] Warning: Failed to create/manage groups:`, groupError);
            // Log full error details
            if (groupError instanceof Error) {
                console.error(`[Section] Error message: ${groupError.message}`);
                console.error(`[Section] Error stack: ${groupError.stack}`);
            } else {
                console.error(`[Section] Error object:`, JSON.stringify(groupError, null, 2));
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
        console.error('[Create Section Error]:', error);
        // Log detailed error information
        if (error instanceof Error) {
            console.error('[Create Section Error Details]:', {
                message: error.message,
                stack: error.stack,
                name: error.name,
            });
        } else {
            console.error('[Create Section Error Object]:', JSON.stringify(error, null, 2));
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
    groupManager: GroupManager
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

        if (lookupErrors || !listData?.listSections?.items || listData.listSections.items.length === 0) {
            console.error('[Section] Section not found with code:', code);
            throw new Error(`No section found with code ${code}`);
        }

        const section = listData.listSections.items[0];
        const sectionId = section.id;

        // Add user to section learner group
        await groupManager.addLearner(username, sectionId);
        console.log(`[Section] Added ${username} to learner group for section ${sectionId}`);

        // Get all assignments for this section to create student copies
        const { data: assignmentsData } = await client.graphql({
            query: LIST_ASSIGNMENTS,
            variables: {
                filter: { sectionID: { eq: sectionId } },
            },
        });

        const sectionAssignments = assignmentsData?.listAssignments?.items || [];

        // Create assignments for this student
        const readableGroups = [`learner-${sectionId}`];
        const writableGroups = [`learner-${sectionId}`];

        for (const assignment of sectionAssignments) {
            await client.graphql({
                query: CREATE_ASSIGNMENT,
                variables: {
                    input: {
                        sectionID: sectionId,
                        unitID: assignment.unitID,
                        learner: userId,
                        readableGroups,
                        writableGroups,
                        status: 'PUBLISHED',
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
        console.error('[Add Self to Section Error]:', error);
        throw error;
    }
}

/**
 * Lists students in a section's learner group
 */
async function handleListSectionStudents(
    args: any,
    userId: string,
    groupManager: GroupManager
): Promise<any[]> {
    const { sectionCode } = args;
    
    try {
        // Derive sectionId from code (temporary pattern)
        const sectionId = `section-${sectionCode}`;
        
        // Get learners from Cognito group
        const learners = await groupManager.listLearnersInSection(sectionId);

        return learners.map((learner: any) => ({
            id: learner.Username,
            name: learner.Attributes?.find((a: any) => a.Name === 'name')?.Value || learner.Username,
            email: learner.Attributes?.find((a: any) => a.Name === 'email')?.Value || '',
        }));
    } catch (error) {
        console.error('[List Section Students Error]:', error);
        throw error;
    }
}
