import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlayingCard } from './PlayingCard.js';

describe('PlayingCard Component', () => {
  it('renders face-up card with correct suit and rank', () => {
    render(<PlayingCard suit="spades" rank="A" />);
    const cardEl = screen.getByRole('img', { name: /ace of spades/i });
    expect(cardEl).toBeInTheDocument();
  });

  it('renders face-down card back when isFaceDown is true', () => {
    render(<PlayingCard suit="hearts" rank="K" isFaceDown />);
    const cardBack = screen.getByLabelText(/card back/i);
    expect(cardBack).toBeInTheDocument();
  });

  it('renders selected state with elevated ring and aria-pressed true', () => {
    render(<PlayingCard suit="diamonds" rank="10" isSelected onClick={() => {}} />);
    const cardBtn = screen.getByRole('button', { name: /10 of diamonds/i });
    expect(cardBtn).toHaveAttribute('aria-pressed', 'true');
    expect(cardBtn.className).toContain('ring-4');
  });

  it('handles click events when enabled', () => {
    const handleClick = vi.fn();
    render(<PlayingCard suit="clubs" rank="Q" onClick={handleClick} />);
    const cardBtn = screen.getByRole('button', { name: /queen of clubs/i });
    fireEvent.click(cardBtn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not trigger click when isDisabled is true', () => {
    const handleClick = vi.fn();
    render(<PlayingCard suit="spades" rank="2" isDisabled onClick={handleClick} />);
    const cardBtn = screen.getByRole('button', { name: /2 of spades/i });
    expect(cardBtn).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(cardBtn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders with highlighted animation ring when isHighlighted is true', () => {
    render(<PlayingCard suit="spades" rank="A" isHighlighted />);
    const card = screen.getByRole('img', { name: /ace of spades/i });
    expect(card.className).toContain('ring-2');
  });
});
