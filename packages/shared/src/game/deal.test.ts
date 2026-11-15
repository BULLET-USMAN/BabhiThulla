import { describe, expect, it } from 'vitest';
import { dealCards } from './deal.js';
import { createDeck } from './cards.js';
import { fisherYatesShuffle, createSeededRng } from './shuffle.js';

describe('Game Engine: Dealing Module', () => {
  const getDeck = () => fisherYatesShuffle(createDeck(), createSeededRng(42));

  it('deals 52 cards correctly for 4 players (13, 13, 13, 13)', () => {
    const { hands, aceOfSpadesHolderIndex } = dealCards(getDeck(), 4);
    expect(hands).toHaveLength(4);
    expect(hands.map((h) => h.length)).toEqual([13, 13, 13, 13]);
    expect(aceOfSpadesHolderIndex).toBeGreaterThanOrEqual(0);
    expect(aceOfSpadesHolderIndex).toBeLessThan(4);
    expect(hands[aceOfSpadesHolderIndex]!.some((c) => c.id === 'spades-A')).toBe(true);
  });

  it('deals 52 cards correctly for 3 players (18, 17, 17)', () => {
    const { hands } = dealCards(getDeck(), 3);
    expect(hands).toHaveLength(3);
    expect(hands.map((h) => h.length)).toEqual([18, 17, 17]);
    const total = hands.reduce((sum, h) => sum + h.length, 0);
    expect(total).toBe(52);
  });

  it('deals 52 cards correctly for 5 players (11, 11, 10, 10, 10)', () => {
    const { hands } = dealCards(getDeck(), 5);
    expect(hands).toHaveLength(5);
    expect(hands.map((h) => h.length)).toEqual([11, 11, 10, 10, 10]);
    const total = hands.reduce((sum, h) => sum + h.length, 0);
    expect(total).toBe(52);
  });

  it('deals 52 cards correctly for 6 players (9, 9, 9, 9, 8, 8)', () => {
    const { hands } = dealCards(getDeck(), 6);
    expect(hands).toHaveLength(6);
    expect(hands.map((h) => h.length)).toEqual([9, 9, 9, 9, 8, 8]);
    const total = hands.reduce((sum, h) => sum + h.length, 0);
    expect(total).toBe(52);
  });

  it('rejects invalid player counts (<3 or >6)', () => {
    expect(() => dealCards(getDeck(), 2)).toThrow();
    expect(() => dealCards(getDeck(), 7)).toThrow();
  });
});
