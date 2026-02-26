/**
 * Upload debug artifact to S3 for support analysis
 * 
 * Uploads diagnostic snapshots to a public S3 path and generates
 * a signed URL with 30-day expiration for support team access.
 */

import { uploadData, getUrl } from 'aws-amplify/storage';
import { StateSnapshot } from './StateSnapshot';

/**
 * Upload debug artifact to S3 and generate signed URL
 * 
 * @param snapshot - State snapshot to upload
 * @returns Promise with S3 key and signed URL (30-day expiration)
 */
export async function uploadDebugArtifact(
  snapshot: StateSnapshot
): Promise<{ key: string; url: string }> {
  try {
    // Create filename with timestamp
    const timestamp = snapshot.timestamp;
    const filename = `diagnostic-${timestamp}.json`;
    const key = `debug/${filename}`;
    
    // Convert snapshot to JSON blob
    const json = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    
    console.log('[DebugArtifact] Uploading to S3:', key);
    
    // Upload to S3 public path
    const uploadOperation = uploadData({
      key,
      data: blob,
      options: {
        contentType: 'application/json',
        accessLevel: 'guest', // Public access for support team
      }
    });
    
    // Wait for upload to complete
    const result = await uploadOperation.result;
    console.log('[DebugArtifact] Upload completed:', result);
    
    // Generate signed URL with 30-day expiration
    const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60; // 2,592,000 seconds
    
    const urlResult = await getUrl({
      key,
      options: {
        accessLevel: 'guest',
        expiresIn: THIRTY_DAYS_IN_SECONDS,
      }
    });
    
    const signedUrl = urlResult.url.href;
    console.log('[DebugArtifact] Generated signed URL (30-day expiration)');
    
    return {
      key,
      url: signedUrl,
    };
    
  } catch (error) {
    console.error('[DebugArtifact] Upload failed:', error);
    throw new Error(
      error instanceof Error 
        ? `Failed to upload debug artifact: ${error.message}`
        : 'Failed to upload debug artifact: Unknown error'
    );
  }
}

/**
 * Check if debug artifact uploads are enabled
 * (Always true if Storage is configured)
 */
export function isDebugArtifactUploadEnabled(): boolean {
  return typeof window !== 'undefined';
}
