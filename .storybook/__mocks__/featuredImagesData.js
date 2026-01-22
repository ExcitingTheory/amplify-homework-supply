/**
 * Featured Images - HTTP URLs to stock photos for Units and Sections
 * 
 * High-quality images served from /story-mocks/
 * These are used as featured images for mock Units and Sections in Storybook
 */

import {
  MOCK_IMAGE_URL_1,
  MOCK_IMAGE_URL_2,
  MOCK_IMAGE_URL_3,
  MOCK_IMAGE_URL_4,
  MOCK_IMAGE_URL_5,
  MOCK_IMAGE_URL_6,
} from './media.js';

// Export with descriptive names for different content types
export const FEATURED_IMAGES = {
  // Japanese/Asian themed images
  JAPANESE_CLASSROOM: MOCK_IMAGE_URL_1, // piano-10046998_1280.jpg
  JAPANESE_CULTURE: MOCK_IMAGE_URL_2,   // animals-10008941_1280.jpg
  JAPANESE_MODERN: MOCK_IMAGE_URL_3,     // namibia-9992336_1280.jpg
  
  // General education themed
  EDUCATION_GENERAL: MOCK_IMAGE_URL_4,   // sand-4753305_1280.jpg
  LEARNING_SCENE: MOCK_IMAGE_URL_5,      // rhinoceros-10074916_1280.jpg
  ACADEMIC: MOCK_IMAGE_URL_6,              // beef-9706049_1280.jpg
};

// Create convenient arrays for random selection
export const JAPANESE_THEMED_IMAGES = [
  FEATURED_IMAGES.JAPANESE_CLASSROOM,
  FEATURED_IMAGES.JAPANESE_CULTURE,
  FEATURED_IMAGES.JAPANESE_MODERN,
];

export const EDUCATION_THEMED_IMAGES = [
  FEATURED_IMAGES.EDUCATION_GENERAL,
  FEATURED_IMAGES.LEARNING_SCENE,
  FEATURED_IMAGES.ACADEMIC,
];

export const ALL_FEATURED_IMAGES = [
  ...JAPANESE_THEMED_IMAGES,
  ...EDUCATION_THEMED_IMAGES,
];

/**
 * Get a random featured image from the collection
 */
export function getRandomFeaturedImage(theme = 'all') {
  let pool;
  switch (theme) {
    case 'japanese':
      pool = JAPANESE_THEMED_IMAGES;
      break;
    case 'education':
      pool = EDUCATION_THEMED_IMAGES;
      break;
    default:
      pool = ALL_FEATURED_IMAGES;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export default FEATURED_IMAGES;
