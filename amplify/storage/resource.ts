import { defineStorage, defineFunction } from '@aws-amplify/backend';

/**
 * Amplify Gen 2 Storage Configuration (Official Pattern)
 * 
 * Implements the Gen 1 public/protected/private pattern adapted for Gen 2:
 * - public/*: Guest (unauthenticated) read + authenticated RWD (published content)
 * - protected/{entity_id}/*: Owner (entity_id) RWD + authenticated read (submissions/drafts)
 * - private/{entity_id}/*: Owner (entity_id) RWD only (personal materials)
 * 
 * Key Patterns:
 * - use allow.guest for unauthenticated (public) access
 * - use allow.entity('identity') for owner-based access in paths
 * - use allow.authenticated for all signed-in users
 * - use allow.groups() for role-based access (for data model, not storage paths)
 * - Path permissions override parent path permissions (no inheritance)
 * 
 * Integration with Data Models:
 * - File.path stores S3 path (e.g., "public/units/123-content.json")
 * - File.level indicates protection level (PUBLIC, PROTECTED, PRIVATE)
 * - Use File.owner field to track who uploaded the file
 * - Correspond to readableGroups/writableGroups in data model for group-based access
 * 
 * Frontend patterns:
 * - Upload: uploadData({ path: `public/file-${id}.ext`, data })
 * - Retrieve: getUrl({ path: file.path })
 * - Delete: remove({ path: file.path })
 * 
 * @see https://docs.amplify.aws/react/build-a-backend/storage/authorization/
 * @see amplify/data/resource.ts for File model schema with readableGroups/writableGroups
 */

export const storage = defineStorage({
  name: 'homeworkSupplyStorage',
  access: (allow) => ({
    // Public content - guest (unauthenticated) read + authenticated full access
    // Published materials, shared resources
    'public/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write', 'delete']),
    ],

    // Protected files - owner (entity_id) full control + all authenticated read
    // Pattern: protected/{entity_id}/*
    // Use for: student submissions, recordings, draft work
    // Note: groups added because Cognito group roles override the authenticated
    // role, so allow.entity('identity') alone is insufficient for group members.
    'protected/{entity_id}/*': [
      allow.authenticated.to(['read']),
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.groups(['Admins', 'Instructors', 'Moderators', 'Learners']).to(['read', 'write', 'delete']),
    ],

    // Private files - owner (entity_id) only
    // Pattern: private/{entity_id}/*
    // Use for: personal/instructor materials, answer keys
    // Note: groups added because Cognito group roles override the authenticated
    // role, so allow.entity('identity') alone is insufficient for group members.
    'private/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.groups(['Admins', 'Instructors', 'Moderators', 'Learners']).to(['read', 'write', 'delete']),
    ],

    // Section handler write access - allows handlers to create files in private paths
    // 'private/*': [
    //   allow.resource(section).to(['read', 'write']),
    // ],
  }),
});
