/* Amplify Params - DO NOT EDIT
	API_JAPANESE5_FILETABLE_ARN
	API_JAPANESE5_FILETABLE_NAME
	API_JAPANESE5_GRADETABLE_ARN
	API_JAPANESE5_GRADETABLE_NAME
	API_JAPANESE5_GRAPHQLAPIENDPOINTOUTPUT
	API_JAPANESE5_GRAPHQLAPIIDOUTPUT
	API_JAPANESE5_UNITTABLE_ARN
	API_JAPANESE5_UNITTABLE_NAME
	ENV
	REGION
	STORAGE_FILES_BUCKETNAME
Amplify Params - DO NOT EDIT */

// import crypto from '@aws-crypto/sha256-js';
// import { defaultProvider } from '@aws-sdk/credential-provider-node';
// import { SignatureV4 } from '@aws-sdk/signature-v4';
// import { HttpRequest } from '@aws-sdk/protocol-http';
// import { default as fetch, Request } from 'node-fetch';

// const GRAPHQL_ENDPOINT = process.env.API_AMPLIFYHOMEWORKSUPPL_GRAPHQLAPIENDPOINTOUTPUT;
// const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
// const { Sha256 } = crypto;

// const query = /* GraphQL */ `
//   query LIST_TODOS {
//     listTodos {
//       items {
//         id
//         name
//         description
//       }
//     }
//   }
// `;

// /**
//  * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
//  */

//  export const handler = async (event) => {
//   console.log(`EVENT: ${JSON.stringify(event)}`);

//   const endpoint = new URL(GRAPHQL_ENDPOINT);

//   const signer = new SignatureV4({
//     credentials: defaultProvider(),
//     region: AWS_REGION,
//     service: 'appsync',
//     sha256: Sha256
//   });

//   const requestToBeSigned = new HttpRequest({
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       host: endpoint.host
//     },
//     hostname: endpoint.host,
//     body: JSON.stringify({ query }),
//     path: endpoint.pathname
//   });

//   const signed = await signer.sign(requestToBeSigned);
//   const request = new Request(endpoint, signed);

//   let statusCode = 200;
//   let body;
//   let response;

//   try {
//     response = await fetch(request);
//     body = await response.json();
//     if (body.errors) statusCode = 400;
//   } catch (error) {
//     statusCode = 500;
//     body = {
//       errors: [
//         {
//           message: error.message
//         }
//       ]
//     };
//   }

//   return {
//     statusCode,
//     //  Uncomment below to enable CORS requests
//     // headers: {
//     //   "Access-Control-Allow-Origin": "*",
//     //   "Access-Control-Allow-Headers": "*"
//     // }, 
//     body: JSON.stringify(body)
//   };
// };




/**
 * Lambda Function: getStudentSubmission
 * 
 * Provides secure access to student submission files for authorized instructors.
 * 
 * Authorization Flow:
 * 1. Verify the requester is in the Instructors or Admins group
 * 2. Fetch the Grade record to verify instructor has access (instructor field matches)
 * 3. Extract identityId from the Grade to locate the private S3 file
 * 4. Generate a presigned URL for the file (15-minute expiration)
 * 5. Return URL with metadata
 * 
 * Security:
 * - Files are stored in private/{identityId}/user-submissions/ (student's private folder)
 * - Only instructors assigned to the grade can access
 * - Presigned URLs expire after 15 minutes
 * - All access is logged
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const REGION = process.env.REGION;
const STORAGE_BUCKET_NAME = process.env.STORAGE_BUCKET_NAME;
const ENV = process.env.ENV;

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: REGION });

/**
 * Main handler function
 */
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    // Extract arguments from AppSync event
    const { gradeId, submissionKey } = event.arguments;
    const { groups, username } = event.identity.claims;
    
    // Verify the requester is authorized (Instructors or Admins)
    if (!groups || (!groups.includes('Instructors') && !groups.includes('Admins'))) {
      throw new Error('Unauthorized: User must be in Instructors or Admins group');
    }
    
    console.log(`[Auth] User ${username} requesting submission: ${submissionKey} for grade: ${gradeId}`);
    
    // Fetch the Grade record
    const grade = await getGrade(gradeId);
    
    if (!grade) {
      throw new Error(`Grade not found: ${gradeId}`);
    }
    
    // Verify the instructor has access to this grade
    if (grade.instructor !== username && !groups.includes('Admins')) {
      throw new Error(`Unauthorized: User ${username} is not the instructor for grade ${gradeId}`);
    }
    
    // Extract identityId from the grade
    const { identityId, owner } = grade;
    
    if (!identityId) {
      throw new Error(`Grade ${gradeId} is missing identityId field`);
    }
    
    console.log(`[Auth] Access granted. Student: ${owner}, IdentityId: ${identityId}`);
    
    // Construct the full S3 key (private/{identityId}/user-submissions/...)
    const s3Key = `private/${identityId}/${submissionKey}`;
    
    console.log(`[S3] Generating presigned URL for: ${s3Key}`);
    
    // Get file metadata
    const metadata = await getFileMetadata(s3Key);
    
    // Generate presigned URL (15-minute expiration)
    const url = await generatePresignedUrl(s3Key);
    
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    
    console.log(`[Success] URL generated, expires at: ${expiresAt}`);
    
    return {
      url,
      expiresAt,
      metadata: JSON.stringify({
        contentType: metadata.ContentType,
        contentLength: metadata.ContentLength,
        lastModified: metadata.LastModified,
        customMetadata: metadata.Metadata,
      }),
    };
    
  } catch (error) {
    console.error('[Error]', error);
    throw new Error(error.message);
  }
};

/**
 * Fetch a Grade record from DynamoDB
 */
async function getGrade(gradeId) {
  const tableName = `Grade-${process.env.API_AMPLIFYHOMEWORKSUPPLY_GRAPHQLAPIIDOUTPUT}-${ENV}`;
  
  const params = {
    TableName: tableName,
    Key: { id: gradeId },
  };
  
  try {
    const result = await docClient.send(new GetCommand(params));
    return result.Item;
  } catch (error) {
    console.error('[DynamoDB Error]', error);
    throw new Error(`Failed to fetch grade: ${error.message}`);
  }
}

/**
 * Get file metadata from S3
 */
async function getFileMetadata(s3Key) {
  const params = {
    Bucket: STORAGE_BUCKET_NAME,
    Key: s3Key,
  };
  
  try {
    const command = new HeadObjectCommand(params);
    const result = await s3Client.send(command);
    return result;
  } catch (error) {
    console.error('[S3 Metadata Error]', error);
    throw new Error(`File not found: ${s3Key}`);
  }
}

/**
 * Generate a presigned URL for S3 file access
 */
async function generatePresignedUrl(s3Key) {
  const params = {
    Bucket: STORAGE_BUCKET_NAME,
    Key: s3Key,
  };
  
  try {
    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 minutes
    return url;
  } catch (error) {
    console.error('[S3 Presigned URL Error]', error);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
}