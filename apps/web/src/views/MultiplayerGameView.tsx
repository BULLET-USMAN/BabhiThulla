import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LogOut,
  Volume2,
  VolumeX,
  HelpCircle,
  Flame,
  Users,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@bhabhi/shared';
import { useMultiplayer } from '../context/MultiplayerContext.js';
import { useSettings } from '../context/SettingsContext.js';
import { PlayingCard } from '../components/cards/PlayingCard.js';
import { CardHand } from '../components/cards/CardHand.js';
import { CardBack } from '../components/cards/CardBack.js';
import { AvatarBadge } from '../components/ui/AvatarBadge.js';
import { StatusBadge } from '../components/ui/StatusBadge.js';
import { SuitIcon } from '../components/cards/SuitIcon.js';
import { Button } from '../components/ui/Button.js';
import { EventLogDrawer } from '../components/game/EventLogDrawer.js';

export function MultiplayerGameView() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const {
    room,
    gameState,
    isPaused,
    pauseReason,
    pauseGraceSeconds,
    isConnected,
    isConnecting,
    rematchStatus,
    thullaBanner,
    playCard,
    voteRematch,
    leaveRoom,
  } = useMultiplayer();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [hasVotedRematch, setHasVotedRematch] = useState<boolean>(false);

  // If no active game state
  if (!gameState || !room) {
    return (
      <div className="min-h-screen bg-charcoal-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-charcoal-850 border border-charcoal-700/80 rounded-2xl p-6 text-center space-y-4">
          {isConnecting ? (
            <>
              <RefreshCw className="w-8 h-8 text-gold-400 animate-spin mx-auto" />
              <h2 className="text-lg font-bold text-cream-100">Connecting to Room...</h2>
              <p className="text-xs text-gray-400">Restoring your seat and cards...</p>
            </>
          ) : (
            <>
              <AlertTriangle className="w-8 h-8 text-gold-400 mx-auto" />
              <h2 className="text-lg font-bold text-cream-100">No Active Multiplayer Match</h2>
              <p className="text-xs text-gray-400">
                You are not currently in an active game room.
              </p>
              <div className="flex justify-center space-x-3 pt-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/lobby')}>
                  Go to Lobby
                </Button>
                <Button variant="gold" size="sm" onClick={() => navigate('/')}>
                  Back Home
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const isMyTurn = gameState.currentTurnPlayerId === gameState.myId;
  const legalCardIds = gameState.legalCardIds;

  // Relative seating calculation: local player at bottom (index 0), opponents clockwise
  const myIndex = gameState.players.findIndex((p) => p.id === gameState.myId);
  const opponents =
    myIndex >= 0
      ? [...gameState.players.slice(myIndex + 1), ...gameState.players.slice(0, myIndex)]
      : gameState.players.filter((p) => p.id !== gameState.myId);

  const handleSelectCard = (card: Card) => {
    if (!legalCardIds.includes(card.id)) return;
    setSelectedCardId(card.id === selectedCardId ? null : card.id);
  };

  const handlePlayCard = async () => {
    if (!selectedCardId) return;
    const res = await playCard(selectedCardId);
    if (res.success) {
      setSelectedCardId(null);
    }
  };

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRematchClick = async () => {
    setHasVotedRematch(true);
    await voteRematch(true);
  };

  const isGameOver = gameState.status === 'finished';
  const bhabhiPlayer = isGameOver
    ? gameState.players.find((p) => p.id === gameState.bhabhiPlayerId)
    : null;

  return (
    <div className="relative min-h-screen bg-charcoal-950 flex flex-col justify-between overflow-hidden select-none">
      {/* Top Header */}
      <header className="relative z-30 w-full bg-charcoal-900/90 border-b border-charcoal-800 px-3 sm:px-6 py-2.5 flex items-center justify-between backdrop-blur-md">
        {/* Left: Leave & Room Code */}
        <div className="flex items-center space-x-3">
          <button
            onClick={async () => {
              await leaveRoom();
              navigate('/');
            }}
            className="flex items-center space-x-1.5 text-xs text-gray-300 hover:text-white bg-charcoal-800 hover:bg-charcoal-700 px-2.5 py-1.5 rounded-lg border border-charcoal-700 transition-colors"
            title="Leave Match"
          >
            <LogOut className="w-3.5 h-3.5 text-ruby-400" />
            <span className="hidden sm:inline">Leave</span>
          </button>

          <button
            onClick={handleCopyCode}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-700 text-xs text-gold-300 font-mono transition-colors"
            title="Click to copy room code"
          >
            <Users className="w-3.5 h-3.5 text-gold-400" />
            <span>Room {room.roomCode}</span>
            {copiedCode ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 text-gray-400" />
            )}
          </button>
        </div>

        {/* Center: Trick Status & Leading Suit */}
        <div className="flex items-center space-x-2">
          {gameState.leadingSuit ? (
            <div className="flex items-center space-x-1.5 bg-felt-900 border border-gold-500/50 px-3 py-1 rounded-full text-xs shadow-md">
              <span className="text-gray-300">Lead Suit:</span>
              <span className="font-bold text-cream-100 flex items-center space-x-1">
                <SuitIcon suit={gameState.leadingSuit} size={14} />
                <span className="capitalize">{gameState.leadingSuit}</span>
              </span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full bg-charcoal-800 border border-charcoal-700 text-xs text-gray-400">
              {gameState.trickNumber === 1 ? '♠ Ace of Spades Opening' : 'New Trick Leading'}
            </div>
          )}
        </div>

        {/* Right: Controls & Connection Status */}
        <div className="flex items-center space-x-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? 'bg-emerald-400 ring-2 ring-emerald-400/20' : 'bg-ruby-500 animate-ping'
            }`}
            title={isConnected ? 'Connected to Multiplayer Server' : 'Reconnecting...'}
          />

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

          <Link
            to="/rules"
            className="p-1.5 rounded-lg bg-charcoal-800 text-gray-300 hover:text-white border border-charcoal-700"
            title="How to Play"
          >
            <HelpCircle className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Disconnect Pause Banner */}
      {isPaused && (
        <div className="relative z-40 bg-ruby-950/90 border-b border-ruby-600 px-4 py-2.5 text-center flex items-center justify-center space-x-3 text-cream-100 text-xs shadow-lg animate-pulse">
          <AlertTriangle className="w-4 h-4 text-ruby-400 flex-shrink-0" />
          <span>
            <strong>Match Paused:</strong> {pauseReason || 'Waiting for disconnected player...'}
          </span>
          {pauseGraceSeconds !== null && (
            <span className="bg-ruby-900 px-2 py-0.5 rounded font-mono font-bold text-gold-300 border border-ruby-500">
              {pauseGraceSeconds}s
            </span>
          )}
        </div>
      )}

      {/* Main Playing Table */}
      <main className="relative flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 flex flex-col justify-between items-center overflow-hidden">
        {/* Felt Oval Table Surface */}
        <div className="relative w-full h-full min-h-[460px] sm:min-h-[520px] rounded-[40px] sm:rounded-[80px] felt-table flex flex-col justify-between p-4 sm:p-8 overflow-hidden shadow-felt-inset">
          {/* Inner Stitch Border */}
          <div className="absolute inset-3 sm:inset-5 rounded-[30px] sm:rounded-[70px] felt-stitch pointer-events-none" />

          {/* Opponents Positioning Ring */}
          <div className="relative z-10 w-full flex items-center justify-around gap-2 pt-2">
            {opponents.map((opp) => {
              const isInTurn = gameState.currentTurnPlayerId === opp.id;
              const isDisconnected = !room.players.find((p) => p.id === opp.id)?.isConnected;

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
                    {isDisconnected && (
                      <span className="absolute -top-1 -left-1 px-1 py-0.2 bg-ruby-900 text-ruby-300 text-[9px] font-bold rounded border border-ruby-500">
                        Offline
                      </span>
                    )}
                    {/* Remaining Card Count */}
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-charcoal-950 text-gold-300 text-[10px] font-bold rounded-full border border-gold-500/40">
                      {opp.cardCount}
                    </span>
                  </div>

                  {/* Nickname & Status */}
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
                        <span>Playing...</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Card Back Stacks */}
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
            {/* Live Thulla Alert Notification */}
            {thullaBanner && (
              <div className="absolute z-30 flex items-center space-x-2 px-4 py-2 rounded-2xl bg-ruby-950/95 border-2 border-ruby-500 shadow-2xl animate-bounce">
                <Flame className="w-5 h-5 text-ruby-400" />
                <div className="text-center">
                  <p className="text-sm font-black text-ruby-300 tracking-wider">
                    THULLA!
                  </p>
                  <p className="text-xs text-cream-100">
                    A Thulla was played! Pile collected!
                  </p>
                </div>
              </div>
            )}

            {/* Trick Cards Container */}
            <div className="relative w-48 h-36 sm:w-56 sm:h-44 flex items-center justify-center">
              {gameState.currentTrick.length === 0 ? (
                <div className="text-center p-4 rounded-2xl border-2 border-dashed border-gold-500/20 bg-charcoal-950/30">
                  <p className="text-xs text-gold-300/80 font-medium">Trick Empty</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {isMyTurn ? 'Your lead! Play any card' : 'Waiting for lead card...'}
                  </p>
                </div>
              ) : (
                gameState.currentTrick.map((item, idx) => {
                  const player = gameState.players.find((p) => p.id === item.playerId);
                  const isLastCard = idx === gameState.currentTrick.length - 1;
                  const isThullaPlay =
                    gameState.leadingSuit && item.card.suit !== gameState.leadingSuit;
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
                  {isMyTurn && <StatusBadge type="turn" label="Your Turn!" />}
                </div>
                <p className="text-[10px] text-gray-300">
                  {gameState.myHand.length} cards remaining • Trick #{gameState.trickNumber}
                </p>
              </div>
            </div>

            {/* Play Selected Card Action */}
            <Button
              variant="gold"
              size="sm"
              disabled={!isMyTurn || !selectedCardId || isPaused}
              onClick={handlePlayCard}
              className="font-bold tracking-wider"
            >
              Play Card
            </Button>
          </div>
        </div>

        {/* Local Player's Interactive Hand */}
        <div className="relative z-20 w-full max-w-5xl mt-[-20px] sm:mt-[-30px]">
          <CardHand
            cards={gameState.myHand}
            selectedCardId={selectedCardId}
            onSelectCard={handleSelectCard}
            disabledCardIds={gameState.myHand
              .filter((c) => !legalCardIds.includes(c.id))
              .map((c) => c.id)}
            highlightedCardIds={legalCardIds}
            size={settings.cardSize === 'compact' ? 'sm' : settings.cardSize === 'large' ? 'lg' : 'md'}
          />
        </div>
      </main>

      {/* Activity Log Drawer */}
      <EventLogDrawer events={gameState.recentEvents} />

      {/* Game Finished Modal */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm">
          <div className="max-w-md w-full bg-charcoal-850 border border-charcoal-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-ruby-500/20 text-ruby-400 border border-ruby-500/40 text-xs font-bold uppercase tracking-wider mb-2">
                Match Concluded
              </span>
              <h2 className="text-2xl font-black font-display text-cream-100">
                {bhabhiPlayer?.nickname} is the Bhabhi!
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                The last player holding cards lost the match.
              </p>
            </div>

            {/* Escaped Ranking List */}
            <div className="space-y-2 bg-charcoal-900 p-3 rounded-xl border border-charcoal-800 text-left">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Finishing Order
              </p>
              {gameState.players
                .filter((p) => p.hasEscaped)
                .sort((a, b) => (a.escapeRank || 0) - (b.escapeRank || 0))
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs py-1">
                    <span className="text-cream-100 flex items-center space-x-2">
                      <span className="text-gold-400 font-bold">#{p.escapeRank}</span>
                      <span>{p.nickname}</span>
                    </span>
                    <span className="text-emerald-400 font-semibold">Escaped ✓</span>
                  </div>
                ))}
              {bhabhiPlayer && (
                <div className="flex items-center justify-between text-xs py-1 border-t border-charcoal-800">
                  <span className="text-ruby-300 flex items-center space-x-2">
                    <span className="text-ruby-400 font-bold">BHABHI</span>
                    <span>{bhabhiPlayer.nickname}</span>
                  </span>
                  <span className="text-ruby-400 font-bold">Remaining in Hand</span>
                </div>
              )}
            </div>

            {/* Rematch Voting Section */}
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                {rematchStatus?.approvals.length || 0} of {rematchStatus?.totalRequired || room.players.length} players voted for a rematch
              </p>

              <div className="flex justify-center space-x-3">
                <Button
                  variant="gold"
                  size="md"
                  disabled={hasVotedRematch}
                  onClick={handleRematchClick}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  {hasVotedRematch ? 'Voted for Rematch ✓' : 'Vote Rematch'}
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={async () => {
                    await leaveRoom();
                    navigate('/');
                  }}
                >
                  Leave
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
