/**
 * Mock aws-amplify/storage for Storybook
 */

export const getUrl = async ({ key, options = {} }) => {
  console.log('Mock getUrl called with:', key);
  
  // If key is a data URL, return it as-is
  if (key?.startsWith('data:')) {
    return { url: { href: key } };
  }
  
  // Otherwise return the key wrapped in URL object
  return { url: { href: key || 'mock-url' } };
};

export const uploadData = async () => ({
  result: Promise.resolve({ key: 'mock-key' }),
});

export const remove = async () => ({});

export const list = async () => ({ items: [] });
