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