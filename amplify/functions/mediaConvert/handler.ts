/**
 * MediaConvert Lambda Handler
 *
 * Three entry points:
 * 1. GraphQL mutation `transcodeMedia(fileID)` — explicit transcode request
 * 2. S3 OBJECT_CREATED_PUT event — auto-trigger for video uploads
 * 3. EventBridge `MediaConvert Job State Change` — job completion callback
 *
 * Creates HLS (.m3u8) output at: protected/{identityId}/{fileId}/{fileId}.m3u8
 */

import type { Handler } from 'aws-lambda';
import { type Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { fromEnv } from '@aws-sdk/credential-providers';
import {
  MediaConvertClient,
  CreateJobCommand,
  DescribeEndpointsCommand,
} from '@aws-sdk/client-mediaconvert';

// Configure Amplify at module level (same pattern as openai handler)
Amplify.configure(
  {
    API: {
      GraphQL: {
        endpoint: process.env.API_ENDPOINT || '',
        region: process.env.AWS_REGION || 'us-east-1',
        defaultAuthMode: 'iam',
      },
    },
  },
  {
    Auth: {
      credentialsProvider: {
        getCredentialsAndIdentityId: async () => ({
          credentials: await fromEnv()(),
        }),
        clearCredentialsAndIdentityId: () => {},
      },
    },
  }
);

let dataClient: ReturnType<typeof generateClient<Schema>> | null = null;
let cachedEndpoint: string | null = null;

// ---------------------------------------------------------------------------
// GraphQL operations (raw strings — .models API doesn't work in Lambda resolvers)
// ---------------------------------------------------------------------------

const GET_FILE = /* GraphQL */ `
  query GetFile($id: ID!) {
    getFile(id: $id) {
      id
      _version
      _lastChangedAt
      _deleted
      path
      mimeType
      identityId
      owner
    }
  }
`;

const LIST_FILES_BY_PATH = /* GraphQL */ `
  query ListFiles($filter: ModelFileFilterInput) {
    listFiles(filter: $filter, limit: 1) {
      items {
        id
        _version
        _lastChangedAt
        _deleted
        path
        mimeType
        identityId
        owner
      }
    }
  }
`;

const UPDATE_FILE = /* GraphQL */ `
  mutation UpdateFile($input: UpdateFileInput!) {
    updateFile(input: $input) {
      id
      _version
      _lastChangedAt
      _deleted
      hlsUrl
      transcodeStatus
      mediaConvertJobId
    }
  }
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDataClient() {
  if (!dataClient) {
    dataClient = generateClient<Schema>({ authMode: 'iam' });
  }
  return dataClient;
}

async function getMediaConvertEndpoint(): Promise<string> {
  if (cachedEndpoint) return cachedEndpoint;
  const client = new MediaConvertClient({});
  const resp = await client.send(new DescribeEndpointsCommand({ MaxResults: 1 }));
  const endpoint = resp.Endpoints?.[0]?.Url;
  if (!endpoint) throw new Error('Failed to discover MediaConvert endpoint');
  cachedEndpoint = endpoint;
  return endpoint;
}

function isVideo(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

function isAudio(mimeType: string): boolean {
  return mimeType.startsWith('audio/');
}

// ---------------------------------------------------------------------------
// MediaConvert job creation
// ---------------------------------------------------------------------------

async function createMediaConvertJob(
  fileId: string,
  s3Key: string,
  identityId: string,
  mimeType: string,
): Promise<string> {
  const endpoint = await getMediaConvertEndpoint();
  const client = new MediaConvertClient({ endpoint });

  const bucket = process.env.STORAGE_BUCKET!;
  const roleArn = process.env.MEDIACONVERT_ROLE_ARN!;

  const sourceUrl = `s3://${bucket}/${s3Key}`;
  // Output base: protected/{identityId}/{fileId}/{fileId}
  // MediaConvert appends NameModifier + .m3u8 → {fileId}.m3u8
  const outputPrefix = `s3://${bucket}/protected/${identityId}/${fileId}/${fileId}`;

  const inputConfig: Record<string, any> = {
    FileInput: sourceUrl,
    AudioSelectors: {
      'Audio Selector 1': { DefaultSelection: 'DEFAULT' },
    },
  };

  if (isVideo(mimeType)) {
    inputConfig.VideoSelector = {};
  }

  const outputs: Record<string, any>[] = [];

  if (isVideo(mimeType)) {
    // Adaptive bitrate — 720p, 480p, 360p renditions
    const videoBitrates = [
      { modifier: '_720p', w: 1280, h: 720, maxBitrate: 3_000_000, audioBitrate: 128_000 },
      { modifier: '_480p', w: 854,  h: 480, maxBitrate: 1_500_000, audioBitrate: 96_000 },
      { modifier: '_360p', w: 640,  h: 360, maxBitrate: 800_000,   audioBitrate: 64_000 },
    ];

    for (const v of videoBitrates) {
      outputs.push({
        NameModifier: v.modifier,
        ContainerSettings: { Container: 'M3U8' },
        VideoDescription: {
          Width: v.w,
          Height: v.h,
          CodecSettings: {
            Codec: 'H_264',
            H264Settings: {
              RateControlMode: 'QVBR',
              MaxBitrate: v.maxBitrate,
              QvbrSettings: { QvbrQualityLevel: 7 },
            },
          },
        },
        AudioDescriptions: [{
          AudioSourceName: 'Audio Selector 1',
          CodecSettings: {
            Codec: 'AAC',
            AacSettings: {
              Bitrate: v.audioBitrate,
              CodingMode: 'CODING_MODE_2_0',
              SampleRate: 44100,
            },
          },
        }],
      });
    }
  } else {
    // Audio-only — single AAC output
    outputs.push({
      NameModifier: '',
      ContainerSettings: { Container: 'M3U8' },
      AudioDescriptions: [{
        AudioSourceName: 'Audio Selector 1',
        CodecSettings: {
          Codec: 'AAC',
          AacSettings: {
            Bitrate: 128_000,
            CodingMode: 'CODING_MODE_2_0',
            SampleRate: 44100,
          },
        },
      }],
    });
  }

  const command = new CreateJobCommand({
    Role: roleArn,
    UserMetadata: { fileId, identityId },
    Settings: {
      Inputs: [inputConfig],
      OutputGroups: [{
        Name: 'HLS',
        OutputGroupSettings: {
          Type: 'HLS_GROUP_SETTINGS',
          HlsGroupSettings: {
            Destination: outputPrefix,
            SegmentLength: 6,
            MinSegmentLength: 0,
          },
        },
        Outputs: outputs,
      }],
    },
  });

  const response = await client.send(command);
  return response.Job!.Id!;
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

/** GraphQL mutation: transcodeMedia(fileID) */
async function handleTranscodeMedia(args: any): Promise<string> {
  const { fileID } = args;
  const client = getDataClient();

  const { data, errors } = await client.graphql({
    query: GET_FILE,
    variables: { id: fileID },
  }) as any;

  if (errors || !data?.getFile) {
    throw new Error(`File not found: ${fileID}`);
  }

  const file = data.getFile;

  if (!file.mimeType || (!isAudio(file.mimeType) && !isVideo(file.mimeType))) {
    throw new Error(`Unsupported media type: ${file.mimeType}`);
  }

  const jobId = await createMediaConvertJob(
    file.id,
    file.path,
    file.identityId,
    file.mimeType,
  );

  await client.graphql({
    query: UPDATE_FILE,
    variables: {
      input: {
        id: file.id,
        transcodeStatus: 'PROCESSING',
        mediaConvertJobId: jobId,
        _version: file._version,
      },
    },
  });

  return JSON.stringify({ jobId, fileId: file.id, status: 'PROCESSING' });
}

/** S3 OBJECT_CREATED event */
async function handleS3Event(event: any): Promise<void> {
  const client = getDataClient();

  for (const record of event.Records) {
    const s3Key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    console.log(`[MediaConvert] S3 upload detected: ${s3Key}`);

    // Look up File record by path
    const { data, errors } = await client.graphql({
      query: LIST_FILES_BY_PATH,
      variables: { filter: { path: { eq: s3Key } } },
    }) as any;

    if (errors) {
      console.error('[MediaConvert] GraphQL error:', errors);
      continue;
    }

    const file = data?.listFiles?.items?.[0];
    if (!file) {
      console.warn(`[MediaConvert] No File record for path: ${s3Key}, skipping`);
      continue;
    }

    if (!file.mimeType || (!isAudio(file.mimeType) && !isVideo(file.mimeType))) {
      console.log(`[MediaConvert] Skipping non-media file: ${file.mimeType}`);
      continue;
    }

    try {
      const jobId = await createMediaConvertJob(
        file.id,
        file.path,
        file.identityId,
        file.mimeType,
      );

      await client.graphql({
        query: UPDATE_FILE,
        variables: {
          input: {
            id: file.id,
            transcodeStatus: 'PROCESSING',
            mediaConvertJobId: jobId,
            _version: file._version,
          },
        },
      });

      console.log(`[MediaConvert] Job created: ${jobId} for file: ${file.id}`);
    } catch (error) {
      console.error(`[MediaConvert] Failed to create job for ${file.id}:`, error);
    }
  }
}

/** EventBridge: MediaConvert Job State Change */
async function handleEventBridge(event: any): Promise<void> {
  const detail = event.detail;
  const status = detail.status;
  const jobId = detail.jobId;
  const fileId = detail.userMetadata?.fileId;
  const identityId = detail.userMetadata?.identityId;

  console.log(`[MediaConvert] Job ${jobId} status: ${status}, fileId: ${fileId}`);

  if (!fileId) {
    console.warn('[MediaConvert] No fileId in userMetadata, skipping');
    return;
  }

  const client = getDataClient();

  // Get current file version for optimistic locking
  const { data: fileData } = await client.graphql({
    query: GET_FILE,
    variables: { id: fileId },
  }) as any;

  const file = fileData?.getFile;
  if (!file) {
    console.error(`[MediaConvert] File not found: ${fileId}`);
    return;
  }

  if (status === 'COMPLETE') {
    // Extract HLS manifest path from MediaConvert output details
    const outputGroupDetails = detail.outputGroupDetails;
    let hlsManifestPath = '';

    if (outputGroupDetails?.[0]?.playlistFilePaths?.[0]) {
      const fullPath = outputGroupDetails[0].playlistFilePaths[0];
      const bucket = process.env.STORAGE_BUCKET!;
      hlsManifestPath = fullPath.replace(`s3://${bucket}/`, '');
    } else {
      // Fall back to convention
      hlsManifestPath = `protected/${identityId}/${fileId}/${fileId}.m3u8`;
    }

    await client.graphql({
      query: UPDATE_FILE,
      variables: {
        input: {
          id: fileId,
          hlsUrl: hlsManifestPath,
          transcodeStatus: 'COMPLETE',
          _version: file._version,
        },
      },
    });

    console.log(`[MediaConvert] File ${fileId} updated with HLS: ${hlsManifestPath}`);
  } else if (status === 'ERROR') {
    const errorMessage = detail.errorMessage || 'Unknown error';
    console.error(`[MediaConvert] Job ${jobId} failed: ${errorMessage}`);

    await client.graphql({
      query: UPDATE_FILE,
      variables: {
        input: {
          id: fileId,
          transcodeStatus: 'ERROR',
          _version: file._version,
        },
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export const handler: Handler = async (event, context) => {
  console.log('[MediaConvert] Event:', JSON.stringify(event, null, 2));

  // 1. EventBridge MediaConvert completion/error
  if (event.source === 'aws.mediaconvert') {
    return handleEventBridge(event);
  }

  // 2. EventBridge S3 Object Created event (used instead of S3 notifications to avoid circular deps)
  if (event.source === 'aws.s3' && event['detail-type'] === 'Object Created') {
    const key = event.detail?.object?.key;
    if (!key) {
      console.warn('[MediaConvert] EventBridge S3 event missing object key');
      return;
    }
    // Check file extension
    const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];
    if (!videoExtensions.some(ext => key.toLowerCase().endsWith(ext))) {
      console.log(`[MediaConvert] Skipping non-video file: ${key}`);
      return;
    }
    // Convert to S3 notification format and reuse existing handler
    const syntheticEvent = {
      Records: [{
        s3: {
          bucket: { name: event.detail.bucket.name },
          object: { key },
        },
      }],
    };
    return handleS3Event(syntheticEvent);
  }

  // 3. S3 upload event (legacy S3 notification format)
  if (event.Records && event.Records[0]?.s3) {
    return handleS3Event(event);
  }

  // 3. GraphQL resolver (transcodeMedia mutation)
  const fieldName = event.fieldName || event.info?.fieldName;
  if (fieldName === 'transcodeMedia') {
    return handleTranscodeMedia(event.arguments);
  }

  console.warn('[MediaConvert] Unknown event type');
};
