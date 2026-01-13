/**
 * Mock amplify configuration for Storybook
 * Prevents webpack from trying to resolve the actual amplifyconfiguration.json
 */

export default {
  aws_project_region: 'us-east-1',
  aws_cognito_region: 'us-east-1',
  aws_user_pools_id: 'mock-pool-id',
  aws_user_pools_web_client_id: 'mock-client-id',
  oauth: {},
  aws_cognito_username_attributes: [],
  aws_cognito_social_providers: [],
  aws_cognito_signup_attributes: ['EMAIL'],
  aws_cognito_mfa_configuration: 'OFF',
  aws_cognito_mfa_types: ['SMS'],
  aws_cognito_password_protection_settings: {
    passwordPolicyMinLength: 8,
    passwordPolicyCharacters: []
  },
  aws_cognito_verification_mechanisms: ['EMAIL'],
  aws_appsync_graphqlEndpoint: 'https://mock-endpoint.appsync-api.us-east-1.amazonaws.com/graphql',
  aws_appsync_region: 'us-east-1',
  aws_appsync_authenticationType: 'AMAZON_COGNITO_USER_POOLS',
  aws_appsync_apiKey: 'mock-api-key',
  aws_user_files_s3_bucket: 'mock-bucket',
  aws_user_files_s3_bucket_region: 'us-east-1'
};
