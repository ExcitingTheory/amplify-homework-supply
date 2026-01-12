// This file is used to override the REST API resources configuration
import {
  AmplifyApiRestResourceStackTemplate,
  // AmplifyProjectInfo 
} from '@aws-amplify/cli-extensibility-helper';

export function override(
  resources: AmplifyApiRestResourceStackTemplate
  // , amplifyProjectInfo: AmplifyProjectInfo
  ) {
  // Enable Lambda response streaming for /chat endpoint
  resources.restApi.body.paths['/chat']['x-amazon-apigateway-any-method']['x-amazon-apigateway-integration'].type = 'AWS_PROXY';
  resources.restApi.body.paths['/chat']['x-amazon-apigateway-any-method']['x-amazon-apigateway-integration'].uri = {
    'Fn::Join': [
      '',
      [
        'arn:aws:apigateway:',
        { Ref: 'AWS::Region' },
        ':lambda:path/2021-11-15/functions/',
        { Ref: 'functionchatStreamArn' },
        '/response-streaming-invocations'
      ]
    ]
  };
  resources.restApi.body.paths['/chat']['x-amazon-apigateway-any-method']['x-amazon-apigateway-integration'].responseTransferMode = 'STREAM';

  // Add CORS headers to integration response
  resources.restApi.body.paths['/chat']['x-amazon-apigateway-any-method']['x-amazon-apigateway-integration'].responses.default.responseParameters = {
    'method.response.header.Access-Control-Allow-Origin': "'*'",
    'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    'method.response.header.Access-Control-Allow-Methods': "'*'"
  };
  // Add response headers to method response
  resources.restApi.body.paths['/chat']['x-amazon-apigateway-any-method'].responses['200'].headers = {
    'Access-Control-Allow-Origin': { type: 'string' },
    'Access-Control-Allow-Headers': { type: 'string' },
    'Access-Control-Allow-Methods': { type: 'string' }
  };
  
  // Enable Lambda response streaming for /chat/{proxy+} endpoint
  resources.restApi.body.paths['/chat/{proxy+}']['x-amazon-apigateway-any-method']['x-amazon-apigateway-integration'].type = 'AWS_PROXY';
  resources.restApi.body.paths['/chat/{proxy+}']['x-amazon-apigateway-any-method']['x-amazon-apigateway-integration'].uri = {
    'Fn::Join': [
      '',
      [
        'arn:aws:apigateway:',
        { Ref: 'AWS::Region' },
        ':lambda:path/2021-11-15/functions/',
        { Ref: 'functionchatStreamArn' },
        '/response-streaming-invocations'
      ]
    ]
  };
  resources.restApi.body.paths['/chat/{proxy+}']['x-amazon-apigateway-any-method']['x-amazon-apigateway-integration'].responseTransferMode = 'STREAM';
  resources.restApi.body.paths['/chat/{proxy+}']['x-amazon-apigateway-any-method']['x-amazon-apigateway-integration'].responses.default.responseParameters = {
    'method.response.header.Access-Control-Allow-Origin': "'*'",
    'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    'method.response.header.Access-Control-Allow-Methods': "'*'"
  };
  resources.restApi.body.paths['/chat/{proxy+}']['x-amazon-apigateway-any-method'].responses['200'].headers = {
    'Access-Control-Allow-Origin': { type: 'string' },
    'Access-Control-Allow-Headers': { type: 'string' },
    'Access-Control-Allow-Methods': { type: 'string' }
  };
}
