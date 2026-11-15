import React, { useState, useEffect } from 'react';
import { CardBack } from '../cards/CardBack.js';
import { audioManager } from '../../audio/audioManager.js';
import { Sparkles, FastForward } from 'lucide-react';

export interface DealingOverlayProps {
  isDealing: boolean;
  playerCount: number;
  leaderNickname?: string;
  onDealComplete: () => void;
}

export const DealingOverlay: React.FC<DealingOverlayProps> = ({
  isDealing,
  leaderNickname,
  onDealComplete,
}) => {
  const [dealPhase, setDealPhase] = useState<'shuffle' | 'dealing' | 'done'>('shuffle');

  useEffect(() => {
    if (!isDealing) return;

    audioManager.playCardShuffle();
    setDealPhase('shuffle');

    // Shuffle phase
    const shuffleTimer = setTimeout(() => {
      setDealPhase('dealing');
      audioManager.playCardDeal();
    }, 450);

    // Deal phase complete
    const finishTimer = setTimeout(() => {
      setDealPhase('done');
      onDealComplete();
    }, 1400);

    return () => {
      clearTimeout(shuffleTimer);
      clearTimeout(finishTimer);
    };
  }, [isDealing, onDealComplete]);

  if (!isDealing || dealPhase === 'done') {
    return null;
  }

  const handleSkip = () => {
    setDealPhase('done');
    onDealComplete();
  };

  return (
    <div
      onClick={handleSkip}
      className="absolute inset-0 z-40 bg-charcoal-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-4 cursor-pointer select-none animate-fade-in"
    >
      <div className="relative flex flex-col items-center space-y-4">
        {/* Central Deck with dealing / shuffle effect */}
        <div className="relative w-24 h-34 flex items-center justify-center">
          {/* Stack of card backs */}
          <div className="absolute transform -translate-x-1 -translate-y-1 opacity-80 scale-95">
            <CardBack size="md" />
          </div>
          <div className="absolute transform translate-x-1 translate-y-1 opacity-90 scale-95">
            <CardBack size="md" />
          </div>
          <div
            className={`relative transition-all duration-300 ${
              dealPhase === 'shuffle'
                ? 'animate-pulse scale-105'
                : 'animate-bounce scale-100'
            }`}
          >
            <CardBack size="md" />
          </div>
        </div>

        {/* Text Banner */}
        <div className="text-center space-y-1 bg-charcoal-900/90 border border-gold-500/40 px-6 py-2.5 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-center space-x-2 text-gold-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{dealPhase === 'shuffle' ? 'Shuffling 52 Cards...' : 'Dealing Hands...'}</span>
          </div>
          {leaderNickname && dealPhase === 'dealing' && (
            <p className="text-xs text-cream-100 font-semibold">
              ♠ Ace of Spades found! <span className="text-gold-300">{leaderNickname}</span> leads.
            </p>
          )}
        </div>

        {/* Skip button */}
        <button
          type="button"
          onClick={handleSkip}
          className="flex items-center space-x-1 text-[11px] text-gray-400 hover:text-white px-3 py-1 rounded-full bg-charcoal-800/80 border border-charcoal-700 transition-colors"
        >
          <FastForward className="w-3 h-3" />
          <span>Click anywhere to skip</span>
        </button>
      </div>
    </div>
  );
};
