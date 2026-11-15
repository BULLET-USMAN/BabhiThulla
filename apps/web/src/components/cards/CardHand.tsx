import React from 'react';
import { Card } from '@bhabhi/shared';
import { PlayingCard } from './PlayingCard.js';

export interface CardHandProps {
  cards: Card[];
  selectedCardId?: string | null;
  onSelectCard?: (card: Card) => void;
  size?: 'sm' | 'md' | 'lg';
  disabledCardIds?: string[];
  highlightedCardIds?: string[];
  className?: string;
}

export const CardHand: React.FC<CardHandProps> = ({
  cards,
  selectedCardId,
  onSelectCard,
  size = 'md',
  disabledCardIds = [],
  highlightedCardIds = [],
  className = '',
}) => {
  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center p-6 text-gray-400 text-sm italic">
        No cards in hand. (Safely out!)
      </div>
    );
  }

  return (
    <div className={`relative w-full overflow-x-auto py-6 px-4 no-scrollbar ${className}`}>
      <div className="flex items-end justify-center min-w-max mx-auto -space-x-4 sm:-space-x-6 md:-space-x-8 px-8">
        {cards.map((card, index) => {
          const isSelected = selectedCardId === card.id;
          const isDisabled = disabledCardIds.includes(card.id);
          const isHighlighted = highlightedCardIds.includes(card.id);

          return (
            <div
              key={card.id}
              className="transition-all duration-200"
              style={{
                zIndex: isSelected ? 30 : index + 1,
              }}
            >
              <PlayingCard
                card={card}
                size={size}
                isSelected={isSelected}
                isDisabled={isDisabled}
                isHighlighted={isHighlighted}
                onClick={() => onSelectCard && onSelectCard(card)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
