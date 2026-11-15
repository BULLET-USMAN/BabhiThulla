import { describe, expect, it } from 'vitest';
import { createStandardDeck, isValidCard } from './deck.js';
import { SUITS, RANKS } from '../models/card.js';

describe('Deck Utility', () => {
  it('creates exactly 52 cards without jokers', () => {
    const deck = createStandardDeck();
    expect(deck).toHaveLength(52);
  });

  it('contains 13 cards for each of the 4 suits', () => {
    const deck = createStandardDeck();
    for (const suit of SUITS) {
      const suitCards = deck.filter((c) => c.suit === suit);
      expect(suitCards).toHaveLength(13);
    }
  });

  it('contains 4 of each rank', () => {
    const deck = createStandardDeck();
    for (const rank of RANKS) {
      const rankCards = deck.filter((c) => c.rank === rank);
      expect(rankCards).toHaveLength(4);
    }
  });

  it('contains unique card IDs', () => {
    const deck = createStandardDeck();
    const ids = new Set(deck.map((c) => c.id));
    expect(ids.size).toBe(52);
  });

  it('validates valid and invalid cards correctly', () => {
    expect(isValidCard({ id: 'spades-A', suit: 'spades', rank: 'A' })).toBe(true);
    expect(isValidCard({ id: 'hearts-7', suit: 'hearts', rank: '7' })).toBe(true);
    expect(isValidCard(null)).toBe(false);
    expect(isValidCard({})).toBe(false);
    expect(isValidCard({ id: 'fake', suit: 'stars', rank: '15' })).toBe(false);
  });
});
