import React from 'react';
import { Card, Suit, Rank, SUIT_NAMES, SUIT_COLORS, RANK_NAMES } from '@bhabhi/shared';
import { SuitIcon } from './SuitIcon.js';
import { CardBack } from './CardBack.js';
import { audioManager } from '../../audio/audioManager.js';
import { soundService } from '../../services/sound.js';

export interface PlayingCardProps {
  card?: Card;
  suit?: Suit;
  rank?: Rank;
  isFaceDown?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  isHighlighted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isDraggable?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  className?: string;
  rotation?: number; // In degrees for trick pile rotations
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  suit: propSuit,
  rank: propRank,
  isFaceDown = false,
  isSelected = false,
  isDisabled = false,
  isHighlighted = false,
  size = 'md',
  isDraggable = false,
  onClick,
  onDoubleClick,
  onDragStart,
  onDragEnd,
  className = '',
  rotation = 0,
}) => {
  const suit = card?.suit || propSuit || 'spades';
  const rank = card?.rank || propRank || 'A';
  const isRed = SUIT_COLORS[suit] === 'red';

  const handleClick = () => {
    if (isDisabled) return;
    audioManager.playCardSelect();
    soundService.playCardSelect();
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isDisabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    } else if (e.key === 'ArrowUp' && onDoubleClick) {
      e.preventDefault();
      onDoubleClick();
    }
  };

  const sizeClasses = {
    sm: 'w-12 h-16 rounded-md p-1 text-xs',
    md: 'w-20 h-28 sm:w-24 sm:h-34 rounded-xl p-2 text-sm sm:text-base',
    lg: 'w-28 h-40 sm:w-32 sm:h-48 rounded-2xl p-2.5 text-lg',
  };

  const iconSizes = {
    sm: 10,
    md: 16,
    lg: 22,
  };

  const centerIconSizes = {
    sm: 18,
    md: 32,
    lg: 48,
  };

  if (isFaceDown) {
    return (
      <div
        style={{
          transform: `rotate(${rotation}deg)`,
        }}
        className={`transition-transform duration-200 ${className}`}
      >
        <CardBack size={size} />
      </div>
    );
  }

  const cardLabel = `${RANK_NAMES[rank]} of ${SUIT_NAMES[suit]}`;

  return (
    <div
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick && !isDisabled ? 0 : undefined}
      aria-label={cardLabel}
      aria-pressed={isSelected}
      aria-disabled={isDisabled}
      draggable={!isDisabled && isDraggable}
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={handleKeyDown}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        transform: `rotate(${rotation}deg) translateY(${isSelected ? '-16px' : '0px'})`,
      }}
      className={`relative select-none flex flex-col justify-between bg-cream-50 text-charcoal-950 border border-gray-300 shadow-md transition-all duration-200 cursor-pointer ${
        sizeClasses[size]
      } ${
        isSelected
          ? 'ring-4 ring-gold-400 shadow-gold-glow z-20 -translate-y-4'
          : 'hover:-translate-y-2 hover:shadow-card-lift'
      } ${
        isHighlighted
          ? 'ring-2 ring-gold-500 shadow-[0_0_12px_rgba(212,175,55,0.6)]'
          : ''
      } ${
        isDisabled
          ? 'opacity-40 grayscale pointer-events-none cursor-not-allowed hover:translate-y-0'
          : 'active:scale-95'
      } ${className}`}
    >
      {/* Top Left Index */}
      <div className="flex flex-col items-center leading-none self-start">
        <span
          className={`font-bold font-serif ${
            isRed ? 'text-ruby-600' : 'text-charcoal-900'
          }`}
        >
          {rank}
        </span>
        <SuitIcon suit={suit} size={iconSizes[size]} />
      </div>

      {/* Center Graphic */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {['J', 'Q', 'K'].includes(rank) ? (
          <div
            className={`font-serif font-black opacity-85 ${
              isRed ? 'text-ruby-700' : 'text-charcoal-800'
            } ${size === 'sm' ? 'text-xl' : size === 'md' ? 'text-4xl' : 'text-6xl'}`}
          >
            {rank}
          </div>
        ) : (
          <SuitIcon suit={suit} size={centerIconSizes[size]} className="opacity-90" />
        )}
      </div>

      {/* Bottom Right Inverted Index */}
      <div className="flex flex-col items-center leading-none self-end rotate-180">
        <span
          className={`font-bold font-serif ${
            isRed ? 'text-ruby-600' : 'text-charcoal-900'
          }`}
        >
          {rank}
        </span>
        <SuitIcon suit={suit} size={iconSizes[size]} />
      </div>
    </div>
  );
};
