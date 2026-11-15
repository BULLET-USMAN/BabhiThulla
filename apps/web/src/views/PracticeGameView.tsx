import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  LogOut,
  RotateCcw,
  Volume2,
  VolumeX,
  HelpCircle,
  Flame,
  Bot,
} from 'lucide-react';
import {
  Card,
  DEFAULT_PLAYERS,
} from '@bhabhi/shared';
import { usePracticeGame } from '../hooks/usePracticeGame.js';
import { PlayingCard } from '../components/cards/PlayingCard.js';
import { CardHand } from '../components/cards/CardHand.js';
import { CardBack } from '../components/cards/CardBack.js';
import { AvatarBadge } from '../components/ui/AvatarBadge.js';
import { StatusBadge } from '../components/ui/StatusBadge.js';
import { SuitIcon } from '../components/cards/SuitIcon.js';
import { Button } from '../components/ui/Button.js';
import { EventLogDrawer } from '../components/game/EventLogDrawer.js';
import { ResultModal } from '../components/game/ResultModal.js';
import { useSettings } from '../context/SettingsContext.js';

export function PracticeGameView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();

  const playerCountParam = parseInt(searchParams.get('players') || `${DEFAULT_PLAYERS}`, 10);
  const playerCount = Math.min(6, Math.max(3, playerCountParam));

  const {
    gameState,
    playerView,
    playHumanCard,
    restartMatch,
    isBotThinking,
    thullaAlert,
  } = usePracticeGame({
    playerCount,
    humanNickname: settings.nickname,
    humanAvatar: settings.avatar,
  });

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const isHumanTurn = playerView.currentTurnPlayerId === playerView.myId;
  const legalCardIds = playerView.legalCardIds;

  // Non-human players (opponents)
  const opponents = playerView.players.filter((p) => p.id !== playerView.myId);

  const handleSelectCard = (card: Card) => {
    if (!legalCardIds.includes(card.id)) return;
    setSelectedCardId(card.id === selectedCardId ? null : card.id);
  };

  const handlePlayCard = () => {
    if (!selectedCardId) return;
    const success = playHumanCard(selectedCardId);
    if (success) {
      setSelectedCardId(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-charcoal-950 flex flex-col justify-between overflow-hidden select-none">
      {/* Top Table Header */}
      <header className="relative z-30 w-full bg-charcoal-900/90 border-b border-charcoal-800 px-3 sm:px-6 py-2.5 flex items-center justify-between backdrop-blur-md">
        {/* Left: Back & Game Mode Badge */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-1.5 text-xs text-gray-300 hover:text-white bg-charcoal-800 hover:bg-charcoal-700 px-2.5 py-1.5 rounded-lg border border-charcoal-700 transition-colors"
            title="Leave Practice Mode"
          >
            <LogOut className="w-3.5 h-3.5 text-ruby-400" />
            <span className="hidden sm:inline">Leave</span>
          </button>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs font-semibold">
            <Bot className="w-3.5 h-3.5 text-gold-400" />
            <span>Practice vs Bots ({playerCount}P)</span>
          </div>
        </div>

        {/* Center: Trick Status & Leading Suit */}
        <div className="flex items-center space-x-2">
          {playerView.leadingSuit ? (
            <div className="flex items-center space-x-1.5 bg-felt-900 border border-gold-500/50 px-3 py-1 rounded-full text-xs shadow-md">
              <span className="text-gray-300">Lead Suit:</span>
              <span className="font-bold text-cream-100 flex items-center space-x-1">
                <SuitIcon suit={playerView.leadingSuit} size={14} />
                <span className="capitalize">{playerView.leadingSuit}</span>
              </span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full bg-charcoal-800 border border-charcoal-700 text-xs text-gray-400">
              {playerView.trickNumber === 1 ? '♠ Ace of Spades Opening' : 'New Trick Leading'}
            </div>
          )}
        </div>

        {/* Right: Sound, Restart, Rules */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className="p-1.5 rounded-lg bg-charcoal-800 text-gray-300 hover:text-white border border-charcoal-700"
            title={settings.soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-500" />
            )}
          </button>

          <button
            onClick={restartMatch}
            className="p-1.5 rounded-lg bg-charcoal-800 text-gray-300 hover:text-white border border-charcoal-700"
            title="Restart Match"
          >
            <RotateCcw className="w-4 h-4 text-gold-400" />
          </button>

          <Link
            to="/rules"
            className="p-1.5 rounded-lg bg-charcoal-800 text-gray-300 hover:text-white border border-charcoal-700"
            title="How to Play"
          >
            <HelpCircle className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main Playing Table */}
      <main className="relative flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 flex flex-col justify-between items-center overflow-hidden">
        {/* Felt Table Oval Surface */}
        <div className="relative w-full h-full min-h-[460px] sm:min-h-[520px] rounded-[40px] sm:rounded-[80px] felt-table flex flex-col justify-between p-4 sm:p-8 overflow-hidden shadow-felt-inset">
          {/* Inner Golden Stitch Border Line */}
          <div className="absolute inset-3 sm:inset-5 rounded-[30px] sm:rounded-[70px] felt-stitch pointer-events-none" />

          {/* Opponents Positioning Ring */}
          <div className="relative z-10 w-full flex items-center justify-around gap-2 pt-2">
            {opponents.map((opp) => {
              const isInTurn = playerView.currentTurnPlayerId === opp.id;

              return (
                <div
                  key={opp.id}
                  className={`flex flex-col items-center space-y-1 transition-all duration-300 ${
                    isInTurn
                      ? 'scale-105 filter drop-shadow-[0_0_15px_rgba(212,175,55,0.7)]'
                      : opp.hasEscaped
                      ? 'opacity-40'
                      : 'opacity-90'
                  }`}
                >
                  {/* Opponent Avatar with Turn Ring */}
                  <div className="relative">
                    <AvatarBadge avatarId={opp.avatar} size="md" />
                    {isInTurn && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gold-400 border-2 border-charcoal-900 animate-ping" />
                    )}
                    {/* Remaining Card Count */}
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-charcoal-950 text-gold-300 text-[10px] font-bold rounded-full border border-gold-500/40">
                      {opp.cardCount}
                    </span>
                  </div>

                  {/* Nickname & Escaped Indicator */}
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-semibold text-cream-100 bg-charcoal-950/70 px-2 py-0.5 rounded-md border border-charcoal-800">
                      {opp.nickname}
                    </span>
                    {opp.hasEscaped ? (
                      <span className="text-[9px] font-bold text-emerald-400 mt-0.5">
                        Escaped #{opp.escapeRank} ✓
                      </span>
                    ) : isInTurn ? (
                      <span className="text-[9px] font-bold text-gold-400 mt-0.5 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
                        <span>Thinking...</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Opponent Card Back Stack */}
                  {!opp.hasEscaped && opp.cardCount > 0 && (
                    <div className="flex -space-x-3 mt-0.5">
                      <CardBack size="sm" className="scale-75 shadow-md" />
                      {opp.cardCount > 1 && <CardBack size="sm" className="scale-75 shadow-md" />}
                      {opp.cardCount > 2 && <CardBack size="sm" className="scale-75 shadow-md" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Central Trick Pile & Thulla Alert */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-4 sm:my-8">
            {/* Thulla Alert Overlay Notification */}
            {thullaAlert && (
              <div className="absolute z-30 flex items-center space-x-2 px-4 py-2 rounded-2xl bg-ruby-950/95 border-2 border-ruby-500 shadow-2xl animate-bounce">
                <Flame className="w-5 h-5 text-ruby-400" />
                <div className="text-center">
                  <p className="text-sm font-black text-ruby-300 tracking-wider">
                    THULLA!
                  </p>
                  <p className="text-xs text-cream-100">
                    <strong className="text-gold-300">{thullaAlert.collectorPlayer}</strong> picks up {thullaAlert.cardCount} cards!
                  </p>
                </div>
              </div>
            )}

            {/* Trick Cards Container */}
            <div className="relative w-48 h-36 sm:w-56 sm:h-44 flex items-center justify-center">
              {playerView.currentTrick.length === 0 ? (
                <div className="text-center p-4 rounded-2xl border-2 border-dashed border-gold-500/20 bg-charcoal-950/30">
                  <p className="text-xs text-gold-300/80 font-medium">Trick Empty</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {isHumanTurn ? 'Your lead! Select any card' : 'Waiting for lead card...'}
                  </p>
                </div>
              ) : (
                playerView.currentTrick.map((item, idx) => {
                  const player = gameState.players.find((p) => p.id === item.playerId);
                  const isLastCard = idx === playerView.currentTrick.length - 1;
                  const isThullaPlay = playerView.leadingSuit && item.card.suit !== playerView.leadingSuit;
                  // Deterministic slight rotation tilt based on index
                  const rotation = (idx % 2 === 0 ? 1 : -1) * (idx * 8 + 4);

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
                        {player?.nickname || item.playerId}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Local Human Player Info Bar */}
          <div className="relative z-10 w-full flex items-center justify-between px-2 pt-2 border-t border-gold-500/20">
            <div className="flex items-center space-x-2">
              <AvatarBadge avatarId={settings.avatar} size="sm" />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-cream-100">
                    {settings.nickname} (You)
                  </span>
                  {isHumanTurn ? (
                    <StatusBadge type="turn" label="Your Turn!" />
                  ) : isBotThinking ? (
                    <span className="text-[10px] text-gray-400">Bots are playing...</span>
                  ) : null}
                </div>
                <p className="text-[10px] text-gray-300">
                  {playerView.myHand.length} cards remaining • Trick #{playerView.trickNumber}
                </p>
              </div>
            </div>

            {/* Play Selected Card Action */}
            <Button
              variant="gold"
              size="sm"
              disabled={!isHumanTurn || !selectedCardId}
              onClick={handlePlayCard}
              className="font-bold tracking-wider"
            >
              Play Card
            </Button>
          </div>
        </div>

        {/* Local Player's Real Interactive Hand */}
        <div className="relative z-20 w-full max-w-5xl mt-[-20px] sm:mt-[-30px]">
          <CardHand
            cards={playerView.myHand}
            selectedCardId={selectedCardId}
            onSelectCard={handleSelectCard}
            disabledCardIds={playerView.myHand
              .filter((c) => !legalCardIds.includes(c.id))
              .map((c) => c.id)}
            highlightedCardIds={legalCardIds}
            size={settings.cardSize === 'compact' ? 'sm' : settings.cardSize === 'large' ? 'lg' : 'md'}
          />
        </div>
      </main>

      {/* Activity Log Drawer */}
      <EventLogDrawer events={gameState.actionHistory} />

      {/* Game Finished Bhabhi Result Modal */}
      <ResultModal
        isOpen={gameState.status === 'finished'}
        gameState={gameState}
        onPlayAgain={restartMatch}
        humanPlayerId={playerView.myId}
      />
    </div>
  );
}
