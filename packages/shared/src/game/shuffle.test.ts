import { describe, expect, it } from 'vitest';
import {
  fisherYatesShuffle,
  createSeededRng,
  createCryptoRng,
} from './shuffle.js';
import { createDeck } from './cards.js';

describe('Game Engine: Shuffling Module', () => {
  it('preserves all 52 cards without duplicates or loss', () => {
    const deck = createDeck();
    const shuffled = fisherYatesShuffle(deck);

    expect(shuffled).toHaveLength(52);
    const originalIds = new Set(deck.map((c) => c.id));
    const shuffledIds = new Set(shuffled.map((c) => c.id));
    expect(shuffledIds.size).toBe(52);
    expect(shuffledIds).toEqual(originalIds);
  });

  it('produces deterministic output with seeded RNG', () => {
    const deck = createDeck();
    const rng1 = createSeededRng(12345);
    const rng2 = createSeededRng(12345);

    const shuffled1 = fisherYatesShuffle(deck, rng1);
    const shuffled2 = fisherYatesShuffle(deck, rng2);

    expect(shuffled1.map((c) => c.id)).toEqual(shuffled2.map((c) => c.id));
  });

  it('crypto RNG generates valid numbers in bounds', () => {
    const cryptoRng = createCryptoRng();
    for (let i = 0; i < 100; i++) {
      const val = cryptoRng(10);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(10);
      expect(Number.isInteger(val)).toBe(true);
    }
  });
});
