# HTTP API Setup Required

The three streaming handlers need to be wired up in `amplify/backend.ts` as HTTP API routes.

## Implementation Steps

Add the following to `amplify/backend.ts`:

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { Stack } from 'aws-cdk-lib';
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
} from 'aws-cdk-lib/aws-apigatewayv2';
import {
  HttpUserPoolAuthorizer,
} from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { chatStreamHandler } from './backend/functions/chatStream/resource';
import { contentCompletionStreamHandler } from './backend/functions/contentCompletionStream/resource';
import { suggestBlocksStreamHandler } from './backend/functions/suggestBlocksStream/resource';
import { auth } from './auth/resource';
import { data } from './data/resource';

const backend = defineBackend({
  auth,
  data,
  chatStreamHandler,
  contentCompletionStreamHandler,
  suggestBlocksStreamHandler,
});

// Create API stack
const apiStack = backend.createStack('stream-api-stack');

// Create Cognito User Pool authorizer
const userPoolAuthorizer = new HttpUserPoolAuthorizer(
  'userPoolAuth',
  backend.auth.resources.userPool,
  {
    userPoolClients: [backend.auth.resources.userPoolClient],
  }
);

// Create HTTP API
const httpApi = new HttpApi(apiStack, 'StreamHttpApi', {
  apiName: 'homeworkSupplyStreamApi',
  corsPreflight: {
    allowMethods: [CorsHttpMethod.POST, CorsHttpMethod.OPTIONS],
    allowOrigins: ['*'], // Restrict to your domain in production
    allowHeaders: ['*'],
  },
  createDefaultStage: true,
});

// Create Lambda integrations
const chatStreamIntegration = new HttpLambdaIntegration(
  'ChatStreamIntegration',
  backend.chatStreamHandler.resources.lambda
);

const contentCompletionIntegration = new HttpLambdaIntegration(
  'ContentCompletionIntegration',
  backend.contentCompletionStreamHandler.resources.lambda
);

const suggestBlocksIntegration = new HttpLambdaIntegration(
  'SuggestBlocksIntegration',
  backend.suggestBlocksStreamHandler.resources.lambda
);

// Add routes with Cognito authorization
httpApi.addRoutes({
  path: '/chat',
  methods: [HttpMethod.POST],
  integration: chatStreamIntegration,
  authorizer: userPoolAuthorizer,
});

httpApi.addRoutes({
  path: '/content-completion',
  methods: [HttpMethod.POST],
  integration: contentCompletionIntegration,
  authorizer: userPoolAuthorizer,
});

httpApi.addRoutes({
  path: '/suggest-blocks',
  methods: [HttpMethod.POST],
  integration: suggestBlocksIntegration,
  authorizer: userPoolAuthorizer,
});

// Create IAM policy for API access
const apiPolicy = new Policy(apiStack, 'StreamApiPolicy', {
  statements: [
    new PolicyStatement({
      actions: ['execute-api:Invoke'],
      resources: [
        `${httpApi.arnForExecuteApi('*', '/chat')}`,
        `${httpApi.arnForExecuteApi('*', '/content-completion')}`,
        `${httpApi.arnForExecuteApi('*', '/suggest-blocks')}`,
      ],
    }),
  ],
});

// Attach policy to authenticated role
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(apiPolicy);

// Export API endpoint
backend.addOutput({
  custom: {
    API: {
      [httpApi.httpApiName!]: {
        endpoint: httpApi.url,
        region: Stack.of(httpApi).region,
        apiName: httpApi.httpApiName,
      },
    },
  },
});
```

## Frontend Usage

After calling `Amplify.configure()`, you can call these endpoints:

```typescript
import { get, post } from 'aws-amplify/api';

// Chat streaming
const response = await post({
  apiName: 'homeworkSupplyStreamApi',
  path: '/chat',
  options: {
    body: {
      messages: [...],
      context: {...}
    },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  },
}).response;

// Listen for SSE events
const reader = response.body?.getReader();
```

## API Endpoints

- **POST /chat** - Streaming chat with AI tools (SSE)
- **POST /content-completion** - Streaming content completion (SSE)
- **POST /suggest-blocks** - Block suggestions (JSON response)

All endpoints require Cognito User Pool authentication via Bearer token in Authorization header.
