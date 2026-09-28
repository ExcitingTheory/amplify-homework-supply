import { defineStorage, defineFunction } from "@aws-amplify/backend";

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
  name: "homeworkSupplyStorage",
  access: (allow) => ({
    // Public content - guest (unauthenticated) read + authenticated full access
    // Published materials, shared resources
    "public/*": [
      allow.guest.to(["read"]),
      allow.authenticated.to(["read", "write", "delete"]),
    ],

    // Protected files - owner (entity_id) full control + all authenticated read
    // Pattern: protected/{entity_id}/*
    // Use for: student submissions, recordings, draft work
    // Note: groups added because Cognito group roles override the authenticated
    // role, so allow.entity('identity') alone is insufficient for group members.
    "protected/{entity_id}/*": [
      allow.authenticated.to(["read"]),
      allow.entity("identity").to(["read", "write", "delete"]),
      allow
        .groups(["Admins", "Instructors", "Moderators", "Learners"])
        .to(["read", "write", "delete"]),
    ],

    // Private files - owner (entity_id) only
    // Pattern: private/{entity_id}/*
    // Use for: personal/instructor materials, answer keys
    // Cross-user access (instructor reviewing student submissions) is mediated
    // by the getStudentSubmissionUrl Lambda, which validates section membership
    // before generating a short-lived presigned/signed URL.
    // Note: groups added because Cognito group roles override the authenticated
    // role, so allow.entity('identity') alone is insufficient for group members.
    // The {entity_id} substitution still ensures per-user isolation.
    "private/{entity_id}/*": [
      allow.entity("identity").to(["read", "write", "delete"]),
      allow
        .groups(["Admins", "Instructors", "Moderators", "Learners"])
        .to(["read", "write", "delete"]),
    ],

    // !! protected/units/* is intentionally NOT listed here !!
    //
    // Published unit content (protected/units/{unitId}/published.json,
    // protected/units/audio/*, protected/units/images/*, protected/units/ngrams/*)
    // is served EXCLUSIVELY via CloudFront OAC + signed cookie. There is no
    // Amplify Storage client rule for this prefix, which means:
    //   - No IAM s3:GetObject granted to Cognito identity roles for this prefix
    //   - No IAM s3:ListBucket granted — students cannot enumerate unit IDs
    //   - Direct S3 access is blocked; the CloudFront OAC service role is the
    //     only principal with GetObject on protected/units/*
    //
    // Write access for this prefix is handled exclusively by Lambda functions
    // (publishUnit, rebuildNgramIndex) using their IAM execution role, which
    // has full bucket access regardless of the Amplify storage rules.
    //
    // See: docs/CLOUDFRONT_MIGRATION_PLAN.md Phase 6
  }),
});
