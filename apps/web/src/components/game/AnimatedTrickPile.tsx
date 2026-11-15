import React, { useState } from 'react';
import { PlayedCard, Suit } from '@bhabhi/shared';
import { PlayingCard } from '../cards/PlayingCard.js';

export interface AnimatedTrickPileProps {
  trickCards: PlayedCard[];
  leadingSuit: Suit | null;
  isMyTurn: boolean;
  onDropCard?: (cardId: string) => void;
  getPlayerNickname?: (playerId: string) => string;
}

export const AnimatedTrickPile: React.FC<AnimatedTrickPileProps> = ({
  trickCards,
  leadingSuit,
  isMyTurn,
  onDropCard,
  getPlayerNickname,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isMyTurn) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const cardId = e.dataTransfer.getData('text/plain');
    if (cardId && onDropCard) {
      onDropCard(cardId);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-48 h-36 sm:w-60 sm:h-44 flex items-center justify-center transition-all duration-200 rounded-2xl ${
        isDragOver
          ? 'ring-2 ring-gold-400 bg-felt-900/40 shadow-gold-glow'
          : ''
      }`}
    >
      {trickCards.length === 0 ? (
        <div
          className={`text-center p-4 rounded-2xl border-2 border-dashed transition-all ${
            isDragOver
              ? 'border-gold-400 bg-gold-500/10 scale-105'
              : 'border-gold-500/20 bg-charcoal-950/30'
          }`}
        >
          <p className="text-xs text-gold-300/80 font-medium">Trick Empty</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {isMyTurn ? 'Your lead! Select card or drag here' : 'Waiting for lead card...'}
          </p>
        </div>
      ) : (
        trickCards.map((item, idx) => {
          const isLastCard = idx === trickCards.length - 1;
          const isThullaPlay = leadingSuit && item.card.suit !== leadingSuit;
          const rotation = (idx % 2 === 0 ? 1 : -1) * (idx * 8 + 4);
          const playerName = getPlayerNickname ? getPlayerNickname(item.playerId) : item.playerId;

          return (
            <div
              key={`${item.card.id}-${idx}`}
              className="absolute transition-all duration-300 animate-scale-up"
              style={{
                transform: `rotate(${rotation}deg) translate(${idx * 4}px, ${idx * 2}px)`,
                zIndex: idx + 10,
              }}
            >
              <PlayingCard
                card={item.card}
                size="md"
                isHighlighted={isLastCard && !!isThullaPlay}
              />
              <span
                className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] px-1.5 py-0.2 rounded border shadow whitespace-nowrap ${
                  isThullaPlay
                    ? 'bg-ruby-950 text-ruby-300 border-ruby-500 font-bold'
                    : 'bg-charcoal-950 text-gold-300 border-charcoal-800'
                }`}
              >
                {playerName}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
};
