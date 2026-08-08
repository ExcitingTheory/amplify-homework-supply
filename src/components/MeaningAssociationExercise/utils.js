/**
 * Calculate drag card width based on the longest unbroken word across all phrases.
 * Uses canvas text measurement for accuracy, with an SSR fallback.
 * @param {string[]} phrases - Array of phrase strings
 * @param {object} [options]
 * @param {number} [options.maxWidth=200] - Maximum card width in px
 * @param {number} [options.minWidth=80] - Minimum card width in px
 * @param {number} [options.paddingPx=30] - Total horizontal padding + border in px
 * @param {string} [options.font] - CSS font string for measurement
 * @returns {number} Calculated card width in px
 */
export function calcCardWidth(phrases, options = {}) {
  const {
    maxWidth = 300,
    minWidth = 80,
    paddingPx = 30,
    font = '500 19.2px Roboto, Helvetica, Arial, sans-serif',
  } = options;

  let longestWord = '';
  for (const phrase of phrases) {
    if (!phrase) continue;
    const words = String(phrase).split(/\s+/);
    for (const word of words) {
      if (word.length > longestWord.length) {
        longestWord = word;
      }
    }
  }

  if (!longestWord) return minWidth;

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    const textWidth = ctx.measureText(longestWord).width;
    // Scale up to compensate for web fonts being wider than canvas fallback font
    const calculatedWidth = Math.ceil(textWidth * 1.5 + paddingPx);
    return Math.min(Math.max(calculatedWidth, minWidth), maxWidth);
  }

  // SSR fallback: estimate ~10px per character
  const estimated = longestWord.length * 10 + paddingPx;
  return Math.min(Math.max(estimated, minWidth), maxWidth);
}

/**
 * Simple seeded random number generator (Mulberry32)
 * @param {number} seed - Seed value
 * @returns {function(): number} Random number generator function
 */
function seededRandom(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @param {number} [seed] - Optional seed for deterministic shuffling
 * @returns {Array} Shuffled array
 */
export function shuffle(array, seed) {
    const arrayCopy = [...array];
    let currentIndex = arrayCopy.length, randomIndex;
    const random = seed !== undefined ? seededRandom(seed) : Math.random;
  
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [arrayCopy[currentIndex], arrayCopy[randomIndex]] = [
        arrayCopy[randomIndex], arrayCopy[currentIndex]];
    }
  
    return arrayCopy;
  }