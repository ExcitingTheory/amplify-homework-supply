/**
 * Mock getCachedUrl for Storybook
 * Returns data URLs directly without trying to fetch from S3
 */
const getCachedUrl = async (filePath) => {
  if (!filePath) {
    return null;
  }
  
  // If it's already a data URL or HTTP(S) URL, return it directly
  if (filePath.startsWith('data:') || filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // Otherwise return the path as-is (for S3 paths in tests/stories)
  return filePath;
};

export default getCachedUrl;
