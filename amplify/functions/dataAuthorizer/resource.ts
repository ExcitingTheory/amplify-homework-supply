import { defineFunction, secret } from "@aws-amplify/backend";

/**
 * Data Authorizer Lambda Function
 *
 * Replaces field-level auth resolvers with a centralized Lambda authorizer.
 * Handles authorization decisions for:
 * - Dynamic group-based access (section-*, review-* groups)
 * - Owner-based access for private models
 * - Admin and role-based overrides
 *
 * Input: AppSync authorizationToken (Cognito JWT) + operation metadata
 * Output: { isAuthorized, resolverContext, deniedFields, ttlOverride }
 *
 * Authorization: Invoked by AppSync for all custom-auth models
 * Cognito Operations: Verifies JWTs (issuer, audience, groups from Cognito)
 */

export const dataAuthorizerHandler = defineFunction({
  timeoutSeconds: 30,
  memoryMB: 256,
  resourceGroupName: "data",
  environment: {
    // User pool ID and client ID are injected by Amplify at deploy time
    // Used to validate JWT issuer and audience
    COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID || "placeholder",
    COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID || "placeholder",
  },
});
