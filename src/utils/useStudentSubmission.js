/**
 * useStudentSubmission Hook
 * 
 * React hook for accessing student submission files with proper authorization.
 * 
 * - Students access their own files directly from private storage
 * - Teachers use GraphQL endpoint to get presigned URLs for student files
 * - Automatic role detection and appropriate access method
 */

import { useState, useEffect } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { getAmplifyClient } from './amplifyClient';
import getCachedUrl from './getCachedUrl';

/**
 * Get student submission URL with appropriate access method
 * 
 * @param {Object} params Parameters
 * @param {string} params.submissionKey The S3 key for the submission file
 * @param {Object} params.grade The grade object containing identityId and instructor info
 * @param {string[]} params.userGroups Current user's Cognito groups
 * @returns {Object} { url, loading, error }
 */
export function useStudentSubmission({ submissionKey, grade, userGroups = [] }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!submissionKey || !grade) {
      setLoading(false);
      return;
    }

    async function fetchSubmissionUrl() {
      try {
        setLoading(true);
        setError(null);

        const { username } = await getCurrentUser();
        const isInstructor = userGroups.includes('Instructors') || userGroups.includes('Admins');
        const isOwner = grade.owner === username;

        console.log('[useStudentSubmission] Fetching:', {
          submissionKey,
          gradeId: grade.id,
          isOwner,
          isInstructor,
        });

        if (isOwner) {
          // Student accessing their own file - use direct private access
          console.log('[useStudentSubmission] Owner access - using direct private URL');
          const directUrl = await getCachedUrl(submissionKey, 'private', grade.identityId);
          setUrl(directUrl);
        } else if (isInstructor) {
          // Teacher accessing student file - use GraphQL endpoint
          console.log('[useStudentSubmission] Teacher access - using GraphQL endpoint');
          
          const client = getAmplifyClient();

          const response = await client.queries.getStudentSubmissionUrl({
            gradeId: grade.id,
            submissionKey: submissionKey,
          });

          const teacherUrl = response.data?.url;
          setUrl(teacherUrl);
        } else {
          throw new Error('Unauthorized: Must be the student owner or an instructor');
        }

        console.log('[useStudentSubmission] URL fetched successfully');
      } catch (err) {
        console.error('[useStudentSubmission] Error:', err);
        setError(err.message);
        setUrl(null);
      } finally {
        setLoading(false);
      }
    }

    fetchSubmissionUrl();
  }, [submissionKey, grade, userGroups]);

  return { url, loading, error };
}

/**
 * Get multiple student submission URLs
 * Useful for displaying all files associated with a grade
 * 
 * @param {Object} params Parameters
 * @param {string[]} params.submissionKeys Array of S3 keys
 * @param {Object} params.grade The grade object
 * @param {string[]} params.userGroups Current user's Cognito groups
 * @returns {Object} { urls, loading, error }
 */
export function useStudentSubmissions({ submissionKeys = [], grade, userGroups = [] }) {
  const [urls, setUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!submissionKeys.length || !grade) {
      setLoading(false);
      return;
    }

    async function fetchSubmissionUrls() {
      try {
        setLoading(true);
        setError(null);

        const { username } = await getCurrentUser();
        const isInstructor = userGroups.includes('Instructors') || userGroups.includes('Admins');
        const isOwner = grade.owner === username;

        const urlPromises = submissionKeys.map(async (key) => {
          try {
            if (isOwner) {
              const directUrl = await getCachedUrl(key, 'private', grade.identityId);
              return [key, directUrl];
            } else if (isInstructor) {
              const client = getAmplifyClient();

              const response = await client.queries.getStudentSubmissionUrl({
                gradeId: grade.id,
                submissionKey: key,
              });

              return [key, response.data?.url];
            }
            throw new Error('Unauthorized');
          } catch (err) {
            console.error(`[useStudentSubmissions] Error fetching ${key}:`, err);
            return [key, null];
          }
        });

        const results = await Promise.all(urlPromises);
        const urlMap = Object.fromEntries(results);
        setUrls(urlMap);

        console.log('[useStudentSubmissions] Fetched URLs:', urlMap);
      } catch (err) {
        console.error('[useStudentSubmissions] Error:', err);
        setError(err.message);
        setUrls({});
      } finally {
        setLoading(false);
      }
    }

    fetchSubmissionUrls();
  }, [JSON.stringify(submissionKeys), grade, userGroups]);

  return { urls, loading, error };
}

/**
 * Helper to extract user groups from Auth session
 * Use this in components to get userGroups for the hooks
 */
export async function getUserGroups() {
  try {
    const { tokens } = await fetchAuthSession();
    const groups = tokens?.accessToken?.payload['cognito:groups'] || [];
    return groups;
  } catch (error) {
    console.error('[getUserGroups] Error:', error);
    return [];
  }
}
