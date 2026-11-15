import { Card, RANKS, SUITS } from '../models/card.js';

/**
 * Creates a standard 52-card deck in canonical order without jokers.
 */
export function createStandardDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
      });
    }
  }
  return deck;
}

/**
 * Validates whether a card object is well-formed.
 */
export function isValidCard(card: unknown): card is Card {
  if (!card || typeof card !== 'object') return false;
  const c = card as Partial<Card>;
  return (
    typeof c.id === 'string' &&
    typeof c.suit === 'string' &&
    SUITS.includes(c.suit as (typeof SUITS)[number]) &&
    typeof c.rank === 'string' &&
    RANKS.includes(c.rank as (typeof RANKS)[number])
  );
}
