import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Card, Suit, Rank } from '@bhabhi/shared';
import { CardHand } from './CardHand.js';

function createMockCards(count: number): Card[] {
  const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  const cards: Card[] = [];
  for (let i = 0; i < count; i++) {
    cards.push({
      id: `card-${i}`,
      suit: suits[i % suits.length]!,
      rank: ranks[i % ranks.length]!,
    });
  }
  return cards;
}

describe('CardHand Large Hand Support', () => {
  it('renders standard hand without scroll buttons when card count <= 13', () => {
    const cards = createMockCards(6);
    render(<CardHand cards={cards} />);

    expect(screen.queryByRole('button', { name: /scroll cards left/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/cards in hand/i)).not.toBeInTheDocument();
  });

  it('renders scroll buttons and badge when hand exceeds 13 cards', () => {
    const cards = createMockCards(16);
    render(<CardHand cards={cards} />);

    expect(screen.getByRole('button', { name: /scroll cards left/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /scroll cards right/i })).toBeInTheDocument();
    expect(screen.getByText('16 Cards in Hand')).toBeInTheDocument();
  });

  it('handles penalty Thulla hand exceeding 20 cards with high density layout', () => {
    const cards = createMockCards(28);
    const { container } = render(<CardHand cards={cards} />);

    expect(screen.getByText('28 Cards in Hand')).toBeInTheDocument();
    const flexRow = container.querySelector('.-space-x-8');
    expect(flexRow).toBeInTheDocument();
  });

  it('allows clicking card to select and double clicking to play', () => {
    const cards = createMockCards(4);
    const onSelect = vi.fn();
    const onPlay = vi.fn();

    render(
      <CardHand
        cards={cards}
        onSelectCard={onSelect}
        onPlayCard={onPlay}
        selectedCardId="card-1"
      />
    );

    const firstCard = screen.getAllByRole('button')[0]!;
    fireEvent.click(firstCard);
    expect(onSelect).toHaveBeenCalled();

    fireEvent.doubleClick(firstCard);
    expect(onPlay).toHaveBeenCalled();
  });

  it('displays empty hand state when player has safely escaped', () => {
    render(<CardHand cards={[]} />);
    expect(screen.getByText(/no cards in hand/i)).toBeInTheDocument();
  });
});
