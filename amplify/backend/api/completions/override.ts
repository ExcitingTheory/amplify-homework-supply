// This file is used to override the REST API resources configuration
import { AmplifyApiRestResourceStackTemplate, AmplifyProjectInfo } from '@aws-amplify/cli-extensibility-helper';

export function override(resources: AmplifyApiRestResourceStackTemplate, amplifyProjectInfo: AmplifyProjectInfo) {
  // Enable Lambda response streaming for /chat endpoint
  resources.restApi.addPropertyOverride(
    'Body.paths./chat.x-amazon-apigateway-any-method.x-amazon-apigateway-integration.invokeMode',
    'RESPONSE_STREAM'
  );
  resources.restApi.addPropertyOverride(
    'Body.paths./chat.x-amazon-apigateway-any-method.x-amazon-apigateway-integration.responseMode',
    'STREAM'
  );
  
  // Enable Lambda response streaming for /chat/{proxy+} endpoint
  resources.restApi.addPropertyOverride(
    'Body.paths./chat/{proxy+}.x-amazon-apigateway-any-method.x-amazon-apigateway-integration.invokeMode',
    'RESPONSE_STREAM'
  );
  resources.restApi.addPropertyOverride(
    'Body.paths./chat/{proxy+}.x-amazon-apigateway-any-method.x-amazon-apigateway-integration.responseMode',
    'STREAM'
  );
}
