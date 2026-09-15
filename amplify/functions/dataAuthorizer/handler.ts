import { AppSyncAuthorizerHandler, AppSyncAuthorizerEvent } from "aws-lambda";
import { verifyToken, extractGroups } from "./jwt";
import { decide } from "./authz";

/**
 * AppSync Lambda Authorizer Handler
 *
 * Receives AppSync authorization requests (at operation time, before execution).
 * Verifies the Cognito JWT, extracts claims, runs authorization logic,
 * and returns a decision that AppSync enforces.
 *
 * Input event structure:
 * {
 *   authorizationToken: "Bearer <JWT>",
 *   requestContext: {
 *     apiId: "...",
 *     operationName: "getUnit",  (or "listGrades", "updateDocument", etc.)
 *     queryString: "query { ... }",
 *     variables: { ... }
 *   }
 * }
 *
 * Output structure:
 * {
 *   isAuthorized: boolean,
 *   resolverContext?: { userId, username, groups, isAdmin },
 *   deniedFields?: ["Type.field", ...],
 *   ttlOverride?: number (seconds to cache this decision)
 * }
 */

export const handler: AppSyncAuthorizerHandler = async (
  event: AppSyncAuthorizerEvent,
): Promise<any> => {
  console.log("[Authorizer] Received:", {
    operationName: event.requestContext?.operationName,
    apiId: event.requestContext?.apiId,
  });

  try {
    // Extract the JWT from Authorization header
    const token = event.authorizationToken;
    if (!token) {
      console.warn("[Authorizer] No token provided");
      return { isAuthorized: false };
    }

    // Environment variables set by defineFunction
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const clientId = process.env.COGNITO_CLIENT_ID;

    if (!userPoolId || !clientId) {
      console.error("[Authorizer] Missing Cognito configuration", {
        userPoolId: !!userPoolId,
        clientId: !!clientId,
      });
      return { isAuthorized: false };
    }

    // Construct issuer from user pool ID (format: arn:aws:cognito-idp:REGION:ACCOUNT:userpool/REGION_POOLID)
    // Extract region from pool ID (e.g., us-east-1_abc123xyz -> us-east-1)
    const poolParts = userPoolId.split("_");
    const region = poolParts[0];
    const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

    // Verify JWT and extract claims
    const claims = await verifyToken(token, issuer, clientId);
    if (!claims) {
      console.warn("[Authorizer] Token verification failed");
      return { isAuthorized: false };
    }

    // Extract user ID and groups
    const userId = claims.sub;
    const username = claims["cognito:username"] ?? claims.sub;
    const groups = extractGroups(claims);
    const isAdmin = groups.includes("Admins");

    // Run authorization logic
    const decision = decide({
      userId,
      groups,
      operationName: event.requestContext?.operationName ?? "unknown",
      variables: event.requestContext?.variables,
    });

    console.log("[Authorizer] Decision:", {
      operationName: event.requestContext?.operationName,
      userId,
      isAdmin,
      allowed: decision.allowed,
      deniedFieldsCount: decision.deniedFields?.length ?? 0,
    });

    // Return authorization decision
    const response: any = {
      isAuthorized: decision.allowed,
    };

    // Attach resolver context if allowed (available as $ctx.identity.resolverContext in resolvers)
    if (decision.allowed) {
      response.resolverContext = {
        userId,
        username,
        groups: JSON.stringify(groups), // Must be scalar - stringify array
        isAdmin: String(isAdmin),
      };
    }

    // Attach denied fields if any
    if (decision.deniedFields && decision.deniedFields.length > 0) {
      response.deniedFields = decision.deniedFields;
    }

    // Attach TTL override (300s = 5 min, or 0 to disable caching)
    response.ttlOverride = 300;

    return response;
  } catch (error) {
    console.error("[Authorizer] Unexpected error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return { isAuthorized: false };
  }
};
