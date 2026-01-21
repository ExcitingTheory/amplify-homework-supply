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
Amplify.configure({
  API: {
    GraphQL: {
      endpoint: process.env.API_ENDPOINT || '',
      region: process.env.AWS_REGION || 'us-east-1',
      defaultAuthMode: 'iam', // Lambda uses IAM auth to call AppSync
    },
  },
});

const client = generateClient<Schema>();

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
        throw error;
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
        const { data: section, errors } = await client.models.Section.create({
            name,
            description: description || '',
            code,
            instructor: userId,
        });

        if (errors || !section) {
            console.error('[Section] Failed to create section:', errors);
            throw new Error('Failed to create section record');
        }

        const sectionId = section.id;

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
        // Look up Section by code
        const { data: sections, errors: lookupErrors } = await client.models.Section.list({
            filter: { code: { eq: code } }
        });

        if (lookupErrors || !sections || sections.length === 0) {
            console.error('[Section] Section not found with code:', code);
            throw new Error(`No section found with code ${code}`);
        }

        const section = sections[0];
        const sectionId = section.id;

        // Add user to section learner group
        await groupManager.addLearner(username, sectionId);
        console.log(`[Section] Added ${username} to learner group for section ${sectionId}`);

        // Get all assignments for this section to create student copies
        const { data: sectionAssignments } = await client.models.Assignment.list({
            filter: { sectionID: { eq: sectionId } }
        });

        // Create assignments for this student
        const readableGroups = [`learner-${sectionId}`];
        const writableGroups = [`learner-${sectionId}`];

        for (const assignment of sectionAssignments || []) {
            await client.models.Assignment.create({
                sectionID: sectionId,
                unitID: assignment.unitID,
                learner: userId,
                readableGroups,
                writableGroups,
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
