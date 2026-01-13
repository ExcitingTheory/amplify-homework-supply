/**
 * Featured Images (Cropped) - Smaller versions for card thumbnails
 * 
 * These are 300x200 cropped versions of the full featured images
 * Total size: ~0.1 MB (much smaller than original 100 MB)
 * 
 * Use these for:
 * - Card thumbnails on dashboard
 * - Section list previews
 * - Assignment cards
 * - Any UI where full resolution isn't needed
 */

const croppedImagesData = require('./featuredImagesCropped.json');

// Export with descriptive names matching the full-size versions
export const FEATURED_IMAGES_CROPPED = {
  // Japanese/Asian themed images
  JAPANESE_CLASSROOM: croppedImagesData['1141381388'], // 26.2 KB - classroom/education scene
  JAPANESE_CULTURE: croppedImagesData['1185684766'],   // 15.7 KB - cultural/traditional scene
  JAPANESE_MODERN: croppedImagesData['1312074290'],     // 24.1 KB - modern Japan scene
  
  // General education themed
  EDUCATION_GENERAL: croppedImagesData['1355927036'],   // 10.9 KB - general education
  LEARNING_SCENE: croppedImagesData['1485922241'],      // 10.0 KB - learning/study scene
  ACADEMIC: croppedImagesData['243766495'],              // 26.8 KB - academic setting
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
