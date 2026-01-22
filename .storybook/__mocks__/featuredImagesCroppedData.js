/**
 * Featured Images (Cropped) - HTTP URLs for card thumbnails
 * 
 * These point to the same images as full-size versions
 * Modern browsers handle image scaling efficiently, so we don't need separate cropped versions
 * 
 * Use these for:
 * - Card thumbnails on dashboard
 * - Section list previews
 * - Assignment cards
 * - Any UI where full resolution isn't needed
 */

import {
  MOCK_IMAGE_URL_1,
  MOCK_IMAGE_URL_2,
  MOCK_IMAGE_URL_3,
  MOCK_IMAGE_URL_4,
  MOCK_IMAGE_URL_5,
  MOCK_IMAGE_URL_6,
} from './media.js';

// Export with descriptive names matching the full-size versions
export const FEATURED_IMAGES_CROPPED = {
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
export const JAPANESE_THEMED_IMAGES_CROPPED = [
  FEATURED_IMAGES_CROPPED.JAPANESE_CLASSROOM,
  FEATURED_IMAGES_CROPPED.JAPANESE_CULTURE,
  FEATURED_IMAGES_CROPPED.JAPANESE_MODERN,
];

export const EDUCATION_THEMED_IMAGES_CROPPED = [
  FEATURED_IMAGES_CROPPED.EDUCATION_GENERAL,
  FEATURED_IMAGES_CROPPED.LEARNING_SCENE,
  FEATURED_IMAGES_CROPPED.ACADEMIC,
];

export const ALL_FEATURED_IMAGES_CROPPED = [
  ...JAPANESE_THEMED_IMAGES_CROPPED,
  ...EDUCATION_THEMED_IMAGES_CROPPED,
];

/**
 * Get a random cropped featured image from the collection
 */
export function getRandomCroppedImage(theme = 'all') {
  let pool;
  switch (theme) {
    case 'japanese':
      pool = JAPANESE_THEMED_IMAGES_CROPPED;
      break;
    case 'education':
      pool = EDUCATION_THEMED_IMAGES_CROPPED;
      break;
    default:
      pool = ALL_FEATURED_IMAGES_CROPPED;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export default FEATURED_IMAGES_CROPPED;
