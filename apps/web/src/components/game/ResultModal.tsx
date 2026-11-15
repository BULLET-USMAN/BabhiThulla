import { Link } from 'react-router-dom';
import { Skull, Trophy, RotateCcw, Home } from 'lucide-react';
import { GameState } from '@bhabhi/shared';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { AvatarBadge } from '../ui/AvatarBadge.js';

export interface ResultModalProps {
  isOpen: boolean;
  gameState: GameState;
  onPlayAgain: () => void;
  humanPlayerId?: string;
}

export function ResultModal({
  isOpen,
  gameState,
  onPlayAgain,
  humanPlayerId = 'human-player',
}: ResultModalProps) {
  if (!isOpen || gameState.status !== 'finished' || !gameState.bhabhiPlayerId) {
    return null;
  }

  const bhabhi = gameState.players.find((p) => p.id === gameState.bhabhiPlayerId)!;
  const isHumanBhabhi = bhabhi.id === humanPlayerId;

  // Escaped players sorted by escape rank
  const escapedPlayers = [...gameState.players]
    .filter((p) => p.hasEscaped)
    .sort((a, b) => (a.escapeRank || 99) - (b.escapeRank || 99));

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Force user to use explicit action buttons
      maxWidth="md"
    >
      <div className="flex flex-col items-center text-center space-y-6 pt-2">
        {/* Crown / Bhabhi Header */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-ruby-700 to-ruby-950 border-2 border-ruby-500/60 flex items-center justify-center shadow-xl">
            <Skull className="w-10 h-10 text-ruby-300 animate-bounce" />
          </div>
          <span className="absolute -top-3 -right-3 text-2xl">👑</span>
        </div>

        <div>
          <h2 className="text-3xl sm:text-4xl font-black font-display text-ruby-400 tracking-wide">
            BHABHI MIL GAYI!
          </h2>
          <p className="text-sm sm:text-base text-gray-300 mt-1 font-light">
            <strong className="text-gold-300 font-semibold">{bhabhi.nickname}</strong> is crowned the Bhabhi!
          </p>
          {isHumanBhabhi ? (
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold bg-ruby-900/60 text-ruby-300 border border-ruby-500/40">
              Better luck next round! You were caught with cards.
            </span>
          ) : (
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-500/40">
              🎉 Congratulations! You escaped safely!
            </span>
          )}
        </div>

        {/* Escape Order Ranking Table */}
        <div className="w-full bg-charcoal-900 border border-charcoal-700/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold uppercase tracking-wider pb-2 border-b border-charcoal-700">
            <span>Finishing Order</span>
            <span>Tricks Played: {gameState.trickNumber}</span>
          </div>

          <div className="space-y-2">
            {escapedPlayers.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 rounded-xl bg-charcoal-800/80 border border-charcoal-700 text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="font-bold text-gold-400 w-5 flex items-center justify-center">
                    {idx === 0 ? <Trophy className="w-4 h-4 text-gold-400" /> : `#${idx + 1}`}
                  </span>
                  <AvatarBadge avatarId={p.avatar} size="sm" showBorder={false} />
                  <span className="font-semibold text-cream-100">
                    {p.nickname} {p.id === humanPlayerId && '(You)'}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Escaped #{p.escapeRank}
                </span>
              </div>
            ))}

            {/* Bhabhi Entry at Bottom */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-ruby-950/60 border border-ruby-600/40 text-xs">
              <div className="flex items-center space-x-2.5">
                <span className="font-bold text-ruby-400 w-5 flex items-center justify-center">
                  💀
                </span>
                <AvatarBadge avatarId={bhabhi.avatar} size="sm" showBorder={false} />
                <span className="font-semibold text-ruby-300">
                  {bhabhi.nickname} {bhabhi.id === humanPlayerId && '(You)'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ruby-500/20 text-ruby-300 border border-ruby-500/40">
                BHABHI
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full pt-2">
          <Button
            variant="gold"
            size="lg"
            fullWidth
            onClick={onPlayAgain}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Play Again
          </Button>

          <Link to="/" className="w-full">
            <Button
              variant="outline"
              size="lg"
              fullWidth
              leftIcon={<Home className="w-4 h-4" />}
            >
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
}
