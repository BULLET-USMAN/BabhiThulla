import React, { useRef } from 'react';
import { Card } from '@bhabhi/shared';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PlayingCard } from './PlayingCard.js';
import { hapticsService } from '../../platform/index.js';

export interface CardHandProps {
  cards: Card[];
  selectedCardId?: string | null;
  onSelectCard?: (card: Card) => void;
  onPlayCard?: (card: Card) => void;
  size?: 'sm' | 'md' | 'lg';
  disabledCardIds?: string[];
  highlightedCardIds?: string[];
  isDraggable?: boolean;
  onDragStartCard?: (card: Card) => void;
  className?: string;
}

export const CardHand: React.FC<CardHandProps> = ({
  cards,
  selectedCardId,
  onSelectCard,
  onPlayCard,
  size = 'md',
  disabledCardIds = [],
  highlightedCardIds = [],
  isDraggable = true,
  onDragStartCard,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center p-6 text-gray-400 text-sm italic">
        No cards in hand. (Safely out!)
      </div>
    );
  }

  // Scroll hand container horizontally
  const handleScroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Adaptive spacing calculation for large hands
  const cardCount = cards.length;
  const isLargeHand = cardCount > 13;
  const isHugeHand = cardCount > 20;

  const overlapClass = isHugeHand
    ? '-space-x-8 sm:-space-x-12 md:-space-x-14'
    : isLargeHand
    ? '-space-x-6 sm:-space-x-8 md:-space-x-10'
    : '-space-x-4 sm:-space-x-6 md:-space-x-8';

  return (
    <div className={`relative w-full py-4 group ${className}`}>
      {/* Scroll Controls for Large Hands */}
      {isLargeHand && (
        <>
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-40 p-1.5 rounded-full bg-charcoal-900/90 border border-gold-500/40 text-gold-300 shadow-xl hover:bg-charcoal-800 transition-all opacity-80 hover:opacity-100"
            title="Scroll cards left"
            aria-label="Scroll cards left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-40 p-1.5 rounded-full bg-charcoal-900/90 border border-gold-500/40 text-gold-300 shadow-xl hover:bg-charcoal-800 transition-all opacity-80 hover:opacity-100"
            title="Scroll cards right"
            aria-label="Scroll cards right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Large Hand Indicator Badge */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-charcoal-900/90 border border-gold-500/40 text-[10px] font-bold text-gold-300 shadow pointer-events-none">
            {cardCount} Cards in Hand
          </div>
        </>
      )}

      {/* Cards Container */}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto overflow-y-visible py-4 px-8 no-scrollbar scroll-smooth"
        tabIndex={0}
        role="region"
        aria-label="Player Hand"
      >
        <div className={`flex items-end justify-center min-w-max mx-auto ${overlapClass} px-8`}>
          {cards.map((card, index) => {
            const isSelected = selectedCardId === card.id;
            const isDisabled = disabledCardIds.includes(card.id);
            const isHighlighted = highlightedCardIds.includes(card.id);

            return (
              <div
                key={card.id}
                className="transition-all duration-200"
                style={{
                  zIndex: isSelected ? 35 : index + 1,
                }}
              >
                <PlayingCard
                  card={card}
                  size={size}
                  isSelected={isSelected}
                  isDisabled={isDisabled}
                  isHighlighted={isHighlighted}
                  isDraggable={isDraggable && !isDisabled}
                  onClick={() => {
                    if (!isDisabled) {
                      hapticsService.cardSelect();
                    }
                    onSelectCard?.(card);
                  }}
                  onDoubleClick={() => onPlayCard?.(card)}
                  onDragStart={(e) => {
                    if (isDisabled) return;
                    e.dataTransfer.setData('text/plain', card.id);
                    onDragStartCard?.(card);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
