#!/usr/bin/env node
/**
 * Manage Admins Group - Add users to Admins group for Amplify Studio access
 * 
 * Usage:
 *   npm run manage-admins                    # Interactive mode - lists users and prompts
 *   npm run manage-admins add user@email.com # Add specific user
 *   npm run manage-admins list               # List all users and their groups
 *   npm run manage-admins remove user@email.com # Remove user from Admins
 */

import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminListGroupsForUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { CloudFormationClient, DescribeStackResourcesCommand } from '@aws-sdk/client-cloudformation';
import * as readline from 'readline';

const REGION = 'us-east-1'; // Update if your region is different

// Get current Amplify environment from package.json or default to 'dev'
const getAmplifyEnv = () => {
  try {
    const amplifyMeta = JSON.parse(
      require('fs').readFileSync('./amplify/team-provider-info.json', 'utf8')
    );
    const envs = Object.keys(amplifyMeta);
    
    // Check if AMPLIFY_ENV is set, otherwise default to first env or 'dev'
    return process.env.AMPLIFY_ENV || envs[0] || 'dev';
  } catch (err) {
    console.warn('Could not read amplify environment, defaulting to "dev"');
    return 'dev';
  }
};

const ENV = getAmplifyEnv();
const cognito = new CognitoIdentityProviderClient({ region: REGION });
const cfn = new CloudFormationClient({ region: REGION });

/**
 * Get the User Pool ID from CloudFormation stack
 */
async function getUserPoolId() {
  const teamProviderInfo = JSON.parse(
    require('fs').readFileSync('./amplify/team-provider-info.json', 'utf8')
  );
  
  const stackName = teamProviderInfo[ENV]?.awscloudformation?.StackName;
  if (!stackName) {
    throw new Error(`Could not find stack name for environment: ${ENV}`);
  }

  console.log(`📦 Using Amplify environment: ${ENV}`);
  console.log(`🔍 Looking up resources in stack: ${stackName}`);

  const response = await cfn.send(
    new DescribeStackResourcesCommand({ StackName: stackName })
  );

  // Find the auth stack (nested stack)
  const authStack = response.StackResources?.find(
    (resource) =>
      resource.LogicalResourceId?.includes('auth') &&
      resource.ResourceType === 'AWS::CloudFormation::Stack'
  );

  if (!authStack?.PhysicalResourceId) {
    throw new Error('Could not find auth stack');
  }

  // Get resources from auth nested stack
  const authResources = await cfn.send(
    new DescribeStackResourcesCommand({
      StackName: authStack.PhysicalResourceId,
    })
  );

  // Find UserPool resource
  const userPool = authResources.StackResources?.find(
    (resource) => resource.ResourceType === 'AWS::Cognito::UserPool'
  );

  if (!userPool?.PhysicalResourceId) {
    throw new Error('Could not find User Pool');
  }

  console.log(`✅ Found User Pool: ${userPool.PhysicalResourceId}\n`);
  return userPool.PhysicalResourceId;
}

/**
 * List all users in the user pool
 */
async function listUsers(userPoolId) {
  const response = await cognito.send(
    new ListUsersCommand({ UserPoolId: userPoolId })
  );

  const users = [];
  for (const user of response.Users || []) {
    const username = user.Username;
    const email = user.Attributes?.find((attr) => attr.Name === 'email')?.Value;
    const name = user.Attributes?.find((attr) => attr.Name === 'name')?.Value;
    
    // Get user's groups
    const groupsResponse = await cognito.send(
      new AdminListGroupsForUserCommand({
        UserPoolId: userPoolId,
        Username: username,
      })
    );
    const groups = groupsResponse.Groups?.map((g) => g.GroupName) || [];

    users.push({ username, email, name, groups });
  }

  return users;
}

/**
 * Add user to Admins group
 */
async function addUserToAdmins(userPoolId, username) {
  try {
    await cognito.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: username,
        GroupName: 'Admins',
      })
    );
    console.log(`✅ Added ${username} to Admins group`);
    return true;
  } catch (error) {
    console.error(`❌ Error adding ${username} to Admins:`, error.message);
    return false;
  }
}

/**
 * Remove user from Admins group
 */
async function removeUserFromAdmins(userPoolId, username) {
  try {
    await cognito.send(
      new AdminRemoveUserFromGroupCommand({
        UserPoolId: userPoolId,
        Username: username,
        GroupName: 'Admins',
      })
    );
    console.log(`✅ Removed ${username} from Admins group`);
    return true;
  } catch (error) {
    console.error(`❌ Error removing ${username} from Admins:`, error.message);
    return false;
  }
}

/**
 * Interactive user selection
 */
async function interactiveMode(userPoolId) {
  const users = await listUsers(userPoolId);

  if (users.length === 0) {
    console.log('❌ No users found in the user pool');
    return;
  }

  console.log('👥 Users in pool:\n');
  users.forEach((user, index) => {
    const adminBadge = user.groups.includes('Admins') ? '👑 ADMIN' : '';
    const groupsList = user.groups.join(', ') || 'none';
    console.log(
      `${index + 1}. ${user.email || user.username} ${adminBadge}`
    );
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Groups: ${groupsList}\n`);
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      'Enter user number to toggle Admin status (or press Enter to cancel): ',
      async (answer) => {
        rl.close();
        
        if (!answer) {
          console.log('Cancelled');
          resolve();
          return;
        }

        const index = parseInt(answer) - 1;
        if (index < 0 || index >= users.length) {
          console.log('❌ Invalid selection');
          resolve();
          return;
        }

        const user = users[index];
        const isAdmin = user.groups.includes('Admins');

        if (isAdmin) {
          await removeUserFromAdmins(userPoolId, user.username);
        } else {
          await addUserToAdmins(userPoolId, user.username);
        }

        resolve();
      }
    );
  });
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const emailOrUsername = args[1];

  try {
    const userPoolId = await getUserPoolId();

    if (command === 'list') {
      const users = await listUsers(userPoolId);
      console.log('👥 All users:\n');
      users.forEach((user) => {
        const adminBadge = user.groups.includes('Admins') ? '👑' : '  ';
        console.log(`${adminBadge} ${user.email || user.username}`);
        console.log(`   Groups: ${user.groups.join(', ') || 'none'}\n`);
      });
    } else if (command === 'add' && emailOrUsername) {
      // Find user by email or username
      const users = await listUsers(userPoolId);
      const user = users.find(
        (u) => u.email === emailOrUsername || u.username === emailOrUsername
      );

      if (!user) {
        console.log(`❌ User not found: ${emailOrUsername}`);
        console.log('\nAvailable users:');
        users.forEach((u) => console.log(`  - ${u.email || u.username}`));
        return;
      }

      await addUserToAdmins(userPoolId, user.username);
    } else if (command === 'remove' && emailOrUsername) {
      const users = await listUsers(userPoolId);
      const user = users.find(
        (u) => u.email === emailOrUsername || u.username === emailOrUsername
      );

      if (!user) {
        console.log(`❌ User not found: ${emailOrUsername}`);
        return;
      }

      await removeUserFromAdmins(userPoolId, user.username);
    } else {
      // Interactive mode
      await interactiveMode(userPoolId);
    }

    console.log('\n✨ Done!');
    console.log('\n💡 Admins can now access all data in Amplify Studio');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
