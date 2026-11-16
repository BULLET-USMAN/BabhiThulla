import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  Flame,
  Users,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { Card, EmoteId, QuickChatId, GameState } from '@bhabhi/shared';
import { useMultiplayer } from '../context/MultiplayerContext.js';
import { useSettings } from '../context/SettingsContext.js';
import { audioManager } from '../audio/audioManager.js';
import { CardHand } from '../components/cards/CardHand.js';
import { CardBack } from '../components/cards/CardBack.js';
import { AvatarBadge } from '../components/ui/AvatarBadge.js';
import { StatusBadge } from '../components/ui/StatusBadge.js';
import { SuitIcon } from '../components/cards/SuitIcon.js';
import { Button } from '../components/ui/Button.js';
import { EventLogDrawer } from '../components/game/EventLogDrawer.js';
import { EmoteBar } from '../components/game/EmoteBar.js';
import { EmoteOverlay } from '../components/game/EmoteOverlay.js';
import { GameSettingsModal } from '../components/game/GameSettingsModal.js';
import { DealingOverlay } from '../components/game/DealingOverlay.js';
import { AnimatedTrickPile } from '../components/game/AnimatedTrickPile.js';
import { ResultModal } from '../components/game/ResultModal.js';
import { lifecycleManager } from '../platform/index.js';

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
    activeEmotes,
    activeQuickChats,
    playCard,
    voteRematch,
    sendEmote,
    sendQuickChat,
    leaveRoom,
  } = useMultiplayer();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [hasVotedRematch, setHasVotedRematch] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDealing, setIsDealing] = useState<boolean>(false);

  // Trigger deal sequence on match start (first trick with empty pile)
  useEffect(() => {
    if (gameState && gameState.trickNumber === 1 && gameState.currentTrick.length === 0) {
      setIsDealing(true);
    }
  }, [gameState?.trickNumber, gameState?.currentTrick.length]);

  // Reset rematch vote status when new match begins
  useEffect(() => {
    if (gameState && gameState.status === 'playing') {
      setHasVotedRematch(false);
    }
  }, [gameState?.status]);

  // Back button confirmation during match
  useEffect(() => {
    const unbind = lifecycleManager.registerBackHandler(20, () => {
      if (isSettingsOpen) {
        setIsSettingsOpen(false);
        return true;
      }
      const confirmed = window.confirm(
        'Leave this match? If you leave now, you will be disconnected from the room.'
      );
      if (confirmed) {
        leaveRoom();
        navigate('/');
      }
      return true;
    });
    return unbind;
  }, [isSettingsOpen, leaveRoom, navigate]);

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

  // Relative seating calculation: local player at bottom, opponents placed clockwise around table
  const myIndex = gameState.players.findIndex((p) => p.id === gameState.myId);
  const opponents =
    myIndex >= 0
      ? [...gameState.players.slice(myIndex + 1), ...gameState.players.slice(0, myIndex)]
      : gameState.players.filter((p) => p.id !== gameState.myId);

  const handleSelectCard = (card: Card) => {
    if (!legalCardIds.includes(card.id)) return;
    setSelectedCardId(card.id === selectedCardId ? null : card.id);
  };

  const handlePlayCard = async (cardIdToPlay?: string) => {
    const targetCardId = cardIdToPlay || selectedCardId;
    if (!targetCardId) return;
    const res = await playCard(targetCardId);
    if (res.success) {
      setSelectedCardId(null);
    }
  };

  const handleDropCard = (cardId: string) => {
    if (!legalCardIds.includes(cardId)) return;
    handlePlayCard(cardId);
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

  const handleLeaveMatch = async () => {
    await leaveRoom();
    navigate('/');
  };

  const handleReturnToLobby = async () => {
    await leaveRoom();
    navigate('/lobby');
  };

  const leaderPlayer = gameState.players.find((p) => p.id === gameState.currentLeaderPlayerId);

  // Construct dummy GameState for ResultModal compatibility
  const finishedGameState: GameState = {
    gameId: gameState.gameId,
    status: gameState.status,
    players: gameState.players.map((p) => ({
      id: p.id,
      nickname: p.nickname,
      avatar: p.avatar,
      cardCount: p.cardCount,
      hasEscaped: p.hasEscaped,
      escapeRank: p.escapeRank,
      isBot: p.isBot,
      seatIndex: p.seatIndex,
      hand: [],
    })),
    playerOrder: gameState.playerOrder,
    currentTurnPlayerId: gameState.currentTurnPlayerId,
    currentLeaderPlayerId: gameState.currentLeaderPlayerId,
    leadingSuit: gameState.leadingSuit,
    currentTrick: gameState.currentTrick,
    discardPile: [],
    lastTrickResult: gameState.lastTrickResult,
    escapedPlayerIds: gameState.escapedPlayerIds,
    bhabhiPlayerId: gameState.bhabhiPlayerId,
    turnNumber: gameState.turnNumber,
    trickNumber: gameState.trickNumber,
    actionHistory: gameState.recentEvents,
    rulesConfig: {
      allowThullaOnFirstTrick: true,
      simultaneousEmptyHandsTieBreak: 'highest_lead_card',
      maxTricksLimit: 1000,
    },
    activeTrickParticipants: [],
  };

  return (
    <div className="relative min-h-screen bg-charcoal-950 flex flex-col justify-between overflow-hidden select-none touch-manipulation">
      {/* Top Header */}
      <header className="relative z-30 w-full bg-charcoal-900/95 border-b border-charcoal-800 px-3 sm:px-6 py-2 flex items-center justify-between backdrop-blur-md">
        {/* Left: Room Code & Quick Reaction Trigger */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={handleCopyCode}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-700 text-xs text-gold-300 font-mono transition-colors shadow-sm"
            title="Click to copy room code"
            aria-label="Copy room code"
          >
            <Users className="w-3.5 h-3.5 text-gold-400" />
            <span className="font-bold tracking-wide">Room {room.roomCode}</span>
            {copiedCode ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 text-gray-400" />
            )}
          </button>

          {/* Emote & Quick Chat Bar */}
          <EmoteBar
            onSendEmote={(emoteId: EmoteId) => sendEmote(emoteId)}
            onSendQuickChat={(chatId: QuickChatId) => sendQuickChat(chatId)}
            disabled={isPaused}
          />
        </div>

        {/* Center: Trick Status & Lead Suit Pill */}
        <div className="flex items-center space-x-2">
          {gameState.leadingSuit ? (
            <div className="flex items-center space-x-1.5 bg-felt-900 border border-gold-500/50 px-3 py-1 rounded-full text-xs shadow-md">
              <span className="text-gray-300 hidden sm:inline">Lead Suit:</span>
              <span className="font-bold text-cream-100 flex items-center space-x-1">
                <SuitIcon suit={gameState.leadingSuit} size={14} />
                <span className="capitalize">{gameState.leadingSuit}</span>
              </span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full bg-charcoal-800 border border-charcoal-700 text-xs text-gray-300 font-medium">
              {gameState.trickNumber === 1 ? '♠ Ace of Spades Opening' : 'New Trick Leading'}
            </div>
          )}
        </div>

        {/* Right: Controls & Connection Status */}
        <div className="flex items-center space-x-2">
          {/* Connection Indicator */}
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? 'bg-emerald-400 ring-2 ring-emerald-400/20' : 'bg-ruby-500 animate-ping'
            }`}
            title={isConnected ? 'Connected to Multiplayer Server' : 'Reconnecting...'}
          />

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const nextState = !settings.soundEnabled;
              updateSettings({ soundEnabled: nextState });
              if (nextState) audioManager.playButtonClick();
            }}
            className="p-1.5 rounded-lg bg-charcoal-800 text-gray-300 hover:text-white border border-charcoal-700"
            title={settings.soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            aria-label="Toggle sound"
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {/* Settings Modal Trigger */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-lg bg-charcoal-800 text-gray-300 hover:text-white border border-charcoal-700"
            title="Game Settings"
            aria-label="Game Settings"
          >
            <Sliders className="w-4 h-4 text-gold-400" />
          </button>

          <Link
            to="/rules"
            className="p-1.5 rounded-lg bg-charcoal-800 text-gray-300 hover:text-white border border-charcoal-700"
            title="How to Play"
            aria-label="How to play"
          >
            <HelpCircle className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Disconnect Pause Banner */}
      {isPaused && (
        <div className="relative z-40 bg-ruby-950/90 border-b border-ruby-600 px-4 py-2 text-center flex items-center justify-center space-x-3 text-cream-100 text-xs shadow-lg animate-pulse">
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
        <div className="relative w-full h-full min-h-[440px] sm:min-h-[500px] rounded-[36px] sm:rounded-[70px] felt-table flex flex-col justify-between p-3 sm:p-6 overflow-hidden shadow-felt-inset">
          {/* Inner Golden Stitch Border Line */}
          <div className="absolute inset-2 sm:inset-4 rounded-[28px] sm:rounded-[60px] felt-stitch pointer-events-none" />

          {/* Opponents Positioning Ring */}
          <div className="relative z-10 w-full flex items-center justify-around gap-2 pt-1 sm:pt-2">
            {opponents.map((opp) => {
              const isInTurn = gameState.currentTurnPlayerId === opp.id;
              const isDisconnected = !room.players.find((p) => p.id === opp.id)?.isConnected;

              return (
                <div
                  key={opp.id}
                  className={`relative flex flex-col items-center space-y-1 transition-all duration-300 ${
                    isInTurn
                      ? 'scale-105 filter drop-shadow-[0_0_15px_rgba(212,175,55,0.7)]'
                      : opp.hasEscaped
                      ? 'opacity-40'
                      : 'opacity-90'
                  }`}
                >
                  {/* Floating Emote / Quick Chat Overlay */}
                  <EmoteOverlay
                    playerId={opp.id}
                    activeEmotes={activeEmotes}
                    activeQuickChats={activeQuickChats}
                  />

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
                      <span className="text-[9px] font-bold text-emerald-400 mt-0.5 flex items-center space-x-1">
                        <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                        <span>Escaped #{opp.escapeRank}</span>
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
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-3 sm:my-6">
            {/* Live Thulla Alert Notification Banner */}
            {thullaBanner && (
              <div className="absolute z-30 flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-ruby-950/95 border-2 border-ruby-500 shadow-2xl animate-bounce">
                <Flame className="w-6 h-6 text-ruby-400 animate-pulse" />
                <div className="text-center">
                  <p className="text-base font-black text-ruby-300 tracking-wider">
                    THULLA!
                  </p>
                  <p className="text-xs text-cream-100">
                    Penalty pile collected!
                  </p>
                </div>
              </div>
            )}

            {/* Central Animated Trick Container */}
            <AnimatedTrickPile
              trickCards={gameState.currentTrick}
              leadingSuit={gameState.leadingSuit}
              isMyTurn={isMyTurn}
              onDropCard={handleDropCard}
              getPlayerNickname={(id) => {
                const found = gameState.players.find((p) => p.id === id);
                return found?.nickname || id;
              }}
            />
          </div>

          {/* Local Human Player Info Bar */}
          <div className="relative z-10 w-full flex items-center justify-between px-2 pt-2 border-t border-gold-500/20">
            <div className="relative flex items-center space-x-2">
              {/* Local Player Floating Emote / Chat */}
              <EmoteOverlay
                playerId={gameState.myId}
                activeEmotes={activeEmotes}
                activeQuickChats={activeQuickChats}
              />

              <AvatarBadge avatarId={settings.avatar} size="sm" />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-cream-100">
                    {settings.nickname} (You)
                  </span>
                  {isMyTurn && <StatusBadge type="turn" label="YOUR TURN" />}
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
              onClick={() => handlePlayCard()}
              className="font-bold tracking-wider px-4 sm:px-6 shadow-lg"
            >
              Play Card
            </Button>
          </div>
        </div>

        {/* Local Player's Interactive Hand with Large Hand Support */}
        <div className="relative z-20 w-full max-w-5xl mt-[-20px] sm:mt-[-30px]">
          <CardHand
            cards={gameState.myHand}
            selectedCardId={selectedCardId}
            onSelectCard={handleSelectCard}
            onPlayCard={(card) => handlePlayCard(card.id)}
            disabledCardIds={gameState.myHand
              .filter((c) => !legalCardIds.includes(c.id))
              .map((c) => c.id)}
            highlightedCardIds={legalCardIds}
            size={settings.cardSize === 'compact' ? 'sm' : settings.cardSize === 'large' ? 'lg' : 'md'}
            isDraggable={isMyTurn && !isPaused}
          />
        </div>
      </main>

      {/* Activity Log Drawer */}
      <EventLogDrawer events={gameState.recentEvents} />

      {/* Card Dealing Animation Overlay */}
      <DealingOverlay
        isDealing={isDealing}
        playerCount={gameState.players.length}
        leaderNickname={leaderPlayer?.nickname}
        onDealComplete={() => setIsDealing(false)}
      />

      {/* In-Game Settings Modal */}
      <GameSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLeaveGame={handleLeaveMatch}
        isMultiplayer={true}
      />

      {/* Game Finished Bhabhi Result Modal */}
      <ResultModal
        isOpen={gameState.status === 'finished'}
        gameState={finishedGameState}
        onPlayAgain={handleRematchClick}
        humanPlayerId={gameState.myId}
        isMultiplayer={true}
        rematchStatus={rematchStatus}
        hasVotedRematch={hasVotedRematch}
        onReturnToLobby={handleReturnToLobby}
        roomCode={room.roomCode}
      />
    </div>
  );
}
