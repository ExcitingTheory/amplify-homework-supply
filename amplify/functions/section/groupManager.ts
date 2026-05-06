/**
 * Cognito Group Management Utility
 * 
 * Manages dynamic section-based Cognito groups for fine-grained authorization.
 * Pattern: section-{sectionId}-{role} (e.g., section-abc123-instructors)
 * 
 * Groups are used in Data model authorization:
 * - allow.field('sectionID').group('section-{id}-instructors').to(['read'])
 * - allow.field('sectionID').group('section-{id}-learners').to(['read'])
 */

import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand, AdminRemoveUserFromGroupCommand, CreateGroupCommand, DeleteGroupCommand, ListUsersInGroupCommand } from '@aws-sdk/client-cognito-identity-provider';

export class GroupManager {
  private cognitoClient: CognitoIdentityProviderClient;
  private userPoolId: string;

  constructor(userPoolId: string, region: string) {
    if (!userPoolId) {
      throw new Error('GroupManager requires userPoolId parameter');
    }
    this.userPoolId = userPoolId;
    this.cognitoClient = new CognitoIdentityProviderClient({ region });
  }

  /**
   * Create instructor group for a section
   * @param sectionId - Section ID
   * @param sectionName - Section name (for description)
   */
  async createInstructorGroup(sectionId: string, sectionName: string): Promise<void> {
    const groupName = this.getInstructorGroupName(sectionId);
    
    try {
      await this.cognitoClient.send(new CreateGroupCommand({
        GroupName: groupName,
        UserPoolId: this.userPoolId,
        Description: `Instructors for section: ${sectionName}`,
        Precedence: 10, // Higher precedence = stronger permissions
      }));
      console.log(`[GroupManager] Created group: ${groupName}`);
    } catch (error: any) {
      if (error.name === 'GroupExistsException') {
        console.log(`[GroupManager] Group already exists: ${groupName}`);
        return;
      }
      throw error;
    }
  }

  /**
   * Create learner group for a section
   * @param sectionId - Section ID
   * @param sectionName - Section name (for description)
   */
  async createLearnerGroup(sectionId: string, sectionName: string): Promise<void> {
    const groupName = this.getLearnerGroupName(sectionId);
    
    try {
      await this.cognitoClient.send(new CreateGroupCommand({
        GroupName: groupName,
        UserPoolId: this.userPoolId,
        Description: `Learners in section: ${sectionName}`,
        Precedence: 5, // Lower precedence than instructors
      }));
      console.log(`[GroupManager] Created group: ${groupName}`);
    } catch (error: any) {
      if (error.name === 'GroupExistsException') {
        console.log(`[GroupManager] Group already exists: ${groupName}`);
        return;
      }
      throw error;
    }
  }

  /**
   * Add user to instructor group for a section
   * @param username - Cognito username
   * @param sectionId - Section ID
   */
  async addInstructor(username: string, sectionId: string): Promise<void> {
    const groupName = this.getInstructorGroupName(sectionId);
    
    try {
      await this.cognitoClient.send(new AdminAddUserToGroupCommand({
        GroupName: groupName,
        UserPoolId: this.userPoolId,
        Username: username,
      }));
      console.log(`[GroupManager] Added ${username} to ${groupName}`);
    } catch (error: any) {
      if (error.name === 'UserNotFoundException') {
        console.error(`[GroupManager] User not found: ${username}`);
      }
      throw error;
    }
  }

  /**
   * Add user to learner group for a section
   * @param username - Cognito username
   * @param sectionId - Section ID
   */
  async addLearner(username: string, sectionId: string): Promise<void> {
    const groupName = this.getLearnerGroupName(sectionId);
    
    try {
      await this.cognitoClient.send(new AdminAddUserToGroupCommand({
        GroupName: groupName,
        UserPoolId: this.userPoolId,
        Username: username,
      }));
      console.log(`[GroupManager] Added ${username} to ${groupName}`);
    } catch (error: any) {
      if (error.name === 'UserNotFoundException') {
        console.error(`[GroupManager] User not found: ${username}`);
      }
      throw error;
    }
  }

  /**
   * Remove user from instructor group
   * @param username - Cognito username
   * @param sectionId - Section ID
   */
  async removeInstructor(username: string, sectionId: string): Promise<void> {
    const groupName = this.getInstructorGroupName(sectionId);
    
    try {
      await this.cognitoClient.send(new AdminRemoveUserFromGroupCommand({
        GroupName: groupName,
        UserPoolId: this.userPoolId,
        Username: username,
      }));
      console.log(`[GroupManager] Removed ${username} from ${groupName}`);
    } catch (error: any) {
      if (error.name === 'UserNotFoundException') {
        console.error(`[GroupManager] User not found: ${username}`);
      }
      throw error;
    }
  }

  /**
   * Remove user from learner group
   * @param username - Cognito username
   * @param sectionId - Section ID
   */
  async removeLearner(username: string, sectionId: string): Promise<void> {
    const groupName = this.getLearnerGroupName(sectionId);
    
    try {
      await this.cognitoClient.send(new AdminRemoveUserFromGroupCommand({
        GroupName: groupName,
        UserPoolId: this.userPoolId,
        Username: username,
      }));
      console.log(`[GroupManager] Removed ${username} from ${groupName}`);
    } catch (error: any) {
      if (error.name === 'UserNotFoundException') {
        console.error(`[GroupManager] User not found: ${username}`);
      }
      throw error;
    }
  }

  /**
   * Delete section groups (when section is deleted)
   * @param sectionId - Section ID
   */
  async deleteGroups(sectionId: string): Promise<void> {
    const instructorGroup = this.getInstructorGroupName(sectionId);
    const learnerGroup = this.getLearnerGroupName(sectionId);
    
    try {
      await this.cognitoClient.send(new DeleteGroupCommand({
        GroupName: instructorGroup,
        UserPoolId: this.userPoolId,
      }));
      console.log(`[GroupManager] Deleted group: ${instructorGroup}`);
    } catch (error: any) {
      if (error.name !== 'GroupNotFoundException') {
        throw error;
      }
    }
    
    try {
      await this.cognitoClient.send(new DeleteGroupCommand({
        GroupName: learnerGroup,
        UserPoolId: this.userPoolId,
      }));
      console.log(`[GroupManager] Deleted group: ${learnerGroup}`);
    } catch (error: any) {
      if (error.name !== 'GroupNotFoundException') {
        throw error;
      }
    }
  }

  /**
   * List all learners in a section
   * @param sectionId - Section ID
   * @returns Array of user objects
   */
  async listLearnersInSection(sectionId: string): Promise<any[]> {
    const groupName = this.getLearnerGroupName(sectionId);
    
    try {
      const response = await this.cognitoClient.send(new ListUsersInGroupCommand({
        GroupName: groupName,
        UserPoolId: this.userPoolId,
      }));
      
      return response.Users || [];
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException' || error.name === 'GroupNotFoundException') {
        console.log(`[GroupManager] Group not found: ${groupName}`);
        return [];
      }
      throw error;
    }
  }

  /**
   * Get instructor group name for section
   * @param sectionId - Section ID
   */
  private getInstructorGroupName(sectionId: string): string {
    return `section-${sectionId}-instructors`;
  }

  /**
   * Get learner group name for section
   * @param sectionId - Section ID
   */
  private getLearnerGroupName(sectionId: string): string {
    return `section-${sectionId}-learners`;
  }

  // ====================================================================
  // Peer Review Groups
  // ====================================================================

  /**
   * Create a Cognito group for peer review room participants.
   * Group name: review-{roomId}-peers
   */
  async createPeerReviewGroup(roomId: string): Promise<void> {
    const groupName = `review-${roomId}-peers`;

    try {
      await this.cognitoClient.send(new CreateGroupCommand({
        GroupName: groupName,
        UserPoolId: this.userPoolId,
        Description: `Peer reviewers for room: ${roomId}`,
        Precedence: 3,
      }));
      console.log(`[GroupManager] Created peer review group: ${groupName}`);
    } catch (error: any) {
      if (error.name === 'GroupExistsException') {
        console.log(`[GroupManager] Peer review group already exists: ${groupName}`);
        return;
      }
      throw error;
    }
  }

  /**
   * Add a user to a peer review room's Cognito group.
   */
  async addToPeerReviewGroup(username: string, roomId: string): Promise<void> {
    const groupName = `review-${roomId}-peers`;

    try {
      await this.cognitoClient.send(new AdminAddUserToGroupCommand({
        GroupName: groupName,
        UserPoolId: this.userPoolId,
        Username: username,
      }));
      console.log(`[GroupManager] Added ${username} to ${groupName}`);
    } catch (error: any) {
      if (error.name === 'UserNotFoundException') {
        console.error(`[GroupManager] User not found: ${username}`);
      }
      throw error;
    }
  }

  /**
   * Remove a user from a peer review room's Cognito group.
   */
  async removeFromPeerReviewGroup(username: string, roomId: string): Promise<void> {
    const groupName = `review-${roomId}-peers`;

    try {
      await this.cognitoClient.send(new AdminRemoveUserFromGroupCommand({
        GroupName: groupName,
        UserPoolId: this.userPoolId,
        Username: username,
      }));
      console.log(`[GroupManager] Removed ${username} from ${groupName}`);
    } catch (error: any) {
      if (error.name === 'UserNotFoundException') {
        console.error(`[GroupManager] User not found: ${username}`);
      }
      throw error;
    }
  }
}
