/**
 * Mock getCachedUrl for Storybook
 * Returns data URLs directly without trying to fetch from S3
 */
const getCachedUrl = async (filePath, accessLevel = 'protected', targetIdentityId = null) => {
  if (!filePath) {
    return null;
  }
  
  // If it's already a data URL, return it directly
  if (filePath.startsWith('data:')) {
    return filePath;
  }
  
  // Otherwise return the path as-is (for regular URLs)
  return filePath;
};

export default getCachedUrl;
