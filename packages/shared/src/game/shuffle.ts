export type RandomNumberGenerator = (maxExclusive: number) => number;

/**
 * Creates a cryptographically secure random number generator.
 * Works seamlessly across modern browser Web Crypto API and Node.js global crypto.
 */
export function createCryptoRng(): RandomNumberGenerator {
  return (maxExclusive: number): number => {
    if (maxExclusive <= 1) return 0;

    // Use rejection sampling to eliminate modulo bias
    const maxUint32 = 0xffffffff;
    const limit = maxUint32 - (maxUint32 % maxExclusive);
    const buffer = new Uint32Array(1);

    if (typeof globalThis !== 'undefined' && globalThis.crypto) {
      let rand: number;
      do {
        globalThis.crypto.getRandomValues(buffer);
        rand = buffer[0]!;
      } while (rand >= limit);
      return rand % maxExclusive;
    }

    // Fallback if crypto is unavailable (rare)
    return Math.floor(Math.random() * maxExclusive);
  };
}

/**
 * Creates a fast, deterministic Mulberry32 seeded pseudo-random number generator for reproducible tests.
 */
export function createSeededRng(seed: number): RandomNumberGenerator {
  let s = Math.floor(seed) >>> 0;
  return (maxExclusive: number): number => {
    if (maxExclusive <= 1) return 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    const floatVal = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return Math.floor(floatVal * maxExclusive);
  };
}

/**
 * Performs an unbiased in-place or copy Fisher-Yates shuffle.
 */
export function fisherYatesShuffle<T>(items: readonly T[], rng?: RandomNumberGenerator): T[] {
  const result = [...items];
  const random = rng || createCryptoRng();

  for (let i = result.length - 1; i > 0; i--) {
    const j = random(i + 1);
    const temp = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }

  return result;
}
