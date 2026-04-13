// Seeded random number generator (Mulberry32)
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const Util = {
  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  },

  // Seeded random integer
  getSeededRandomInt(seed, min, max) {
    const rng = mulberry32(seed);
    return Math.floor(rng() * (max - min)) + min;
  },

  // Generate random seed
  generateSeed() {
    return Math.floor(Math.random() * 2147483647);
  }
};
