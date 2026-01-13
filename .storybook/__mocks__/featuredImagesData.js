/**
 * Featured Images - Base64 encoded stock photos for Units and Sections
 * 
 * High-quality images converted from /Downloads/media folder
 * These are used as featured images for mock Units and Sections in Storybook
 */

const featuredImagesData = require('./featuredImages.json');

// Export with descriptive names for different content types
export const FEATURED_IMAGES = {
  // Japanese/Asian themed images
  JAPANESE_CLASSROOM: featuredImagesData['1141381388'], // 11 MB - classroom/education scene
  JAPANESE_CULTURE: featuredImagesData['1185684766'],   // 17 MB - cultural/traditional scene
  JAPANESE_MODERN: featuredImagesData['1312074290'],     // 16 MB - modern Japan scene
  
  // General education themed
  EDUCATION_GENERAL: featuredImagesData['1355927036'],   // 1.6 MB - general education
  LEARNING_SCENE: featuredImagesData['1485922241'],      // 15 MB - learning/study scene
  ACADEMIC: featuredImagesData['243766495'],              // 15 MB - academic setting
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
