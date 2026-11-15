import { describe, expect, it } from 'vitest';
import {
  createDeck,
  compareCards,
  isSameSuit,
  getCardDisplayName,
  sortHand,
  removeCard,
} from './cards.js';
import { Card } from '../models/card.js';

describe('Game Engine: Cards Module', () => {
  it('creates exactly 52 cards with unique IDs', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    const ids = new Set(deck.map((c) => c.id));
    expect(ids.size).toBe(52);
  });

  it('correctly compares cards by rank (A > K > Q > ... > 2)', () => {
    const ace: Card = { id: 'spades-A', suit: 'spades', rank: 'A' };
    const king: Card = { id: 'hearts-K', suit: 'hearts', rank: 'K' };
    const two: Card = { id: 'clubs-2', suit: 'clubs', rank: '2' };

    expect(compareCards(ace, king)).toBeGreaterThan(0);
    expect(compareCards(two, king)).toBeLessThan(0);
    expect(compareCards(ace, ace)).toBe(0);
  });

  it('correctly identifies same suit', () => {
    const card1: Card = { id: 'spades-A', suit: 'spades', rank: 'A' };
    const card2: Card = { id: 'spades-7', suit: 'spades', rank: '7' };
    const card3: Card = { id: 'hearts-A', suit: 'hearts', rank: 'A' };

    expect(isSameSuit(card1, card2)).toBe(true);
    expect(isSameSuit(card1, card3)).toBe(false);
  });

  it('generates friendly display names', () => {
    expect(getCardDisplayName({ id: 'spades-A', suit: 'spades', rank: 'A' })).toBe('Ace of Spades');
    expect(getCardDisplayName({ id: 'diamonds-10', suit: 'diamonds', rank: '10' })).toBe('10 of Diamonds');
  });

  it('sorts hand by suit and descending rank value', () => {
    const hand: Card[] = [
      { id: 'hearts-2', suit: 'hearts', rank: '2' },
      { id: 'spades-K', suit: 'spades', rank: 'K' },
      { id: 'spades-A', suit: 'spades', rank: 'A' },
      { id: 'diamonds-Q', suit: 'diamonds', rank: 'Q' },
    ];

    const sorted = sortHand(hand);
    expect(sorted[0]!.id).toBe('spades-A');
    expect(sorted[1]!.id).toBe('spades-K');
    expect(sorted[2]!.id).toBe('hearts-2');
    expect(sorted[3]!.id).toBe('diamonds-Q');
  });

  it('removes card immutably', () => {
    const hand: Card[] = [
      { id: 'spades-A', suit: 'spades', rank: 'A' },
      { id: 'spades-K', suit: 'spades', rank: 'K' },
    ];

    const { updatedHand, removedCard } = removeCard(hand, 'spades-A');
    expect(updatedHand).toHaveLength(1);
    expect(updatedHand[0]!.id).toBe('spades-K');
    expect(removedCard?.id).toBe('spades-A');
    expect(hand).toHaveLength(2); // original unmodified
  });
});
