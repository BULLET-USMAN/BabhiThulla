import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  Flame,
  Bot,
  Sliders,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import {
  Card,
  DEFAULT_PLAYERS,
  EmoteId,
  QuickChatId,
  ALLOWED_EMOTES,
  ALLOWED_QUICK_CHATS,
} from '@bhabhi/shared';
import { ActiveEmote, ActiveQuickChat } from '../context/MultiplayerContext.js';
import { usePracticeGame } from '../hooks/usePracticeGame.js';
import { CardHand } from '../components/cards/CardHand.js';
import { CardBack } from '../components/cards/CardBack.js';
import { AvatarBadge } from '../components/ui/AvatarBadge.js';
import { StatusBadge } from '../components/ui/StatusBadge.js';
import { SuitIcon } from '../components/cards/SuitIcon.js';
import { Button } from '../components/ui/Button.js';
import { EventLogDrawer } from '../components/game/EventLogDrawer.js';
import { ResultModal } from '../components/game/ResultModal.js';
import { EmoteBar } from '../components/game/EmoteBar.js';
import { EmoteOverlay } from '../components/game/EmoteOverlay.js';
import { GameSettingsModal } from '../components/game/GameSettingsModal.js';
import { DealingOverlay } from '../components/game/DealingOverlay.js';
import { AnimatedTrickPile } from '../components/game/AnimatedTrickPile.js';
import { audioManager } from '../audio/audioManager.js';
import { useSettings } from '../context/SettingsContext.js';
import { lifecycleManager } from '../platform/index.js';

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
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDealing, setIsDealing] = useState<boolean>(true);

  // Back button confirmation during offline game
  useEffect(() => {
    const unbind = lifecycleManager.registerBackHandler(20, () => {
      if (isSettingsOpen) {
        setIsSettingsOpen(false);
        return true;
      }
      const confirmed = window.confirm('Exit offline practice game and return home?');
      if (confirmed) {
        navigate('/');
      }
      return true;
    });
    return unbind;
  }, [isSettingsOpen, navigate]);

  // Active floating emotes and quick chats
  const [activeEmotes, setActiveEmotes] = useState<ActiveEmote[]>([]);
  const [activeQuickChats, setActiveQuickChats] = useState<ActiveQuickChat[]>([]);

  const triggerReaction = useCallback((playerId: string, emoteId: EmoteId) => {
    const symbol = ALLOWED_EMOTES.find((e) => e.id === emoteId)?.symbol || '👏';
    const newEmote: ActiveEmote = {
      id: `${playerId}-${Date.now()}-${Math.random()}`,
      playerId,
      emoteId,
      symbol,
      timestamp: Date.now(),
    };
    setActiveEmotes((prev) => [...prev, newEmote]);
    setTimeout(() => {
      setActiveEmotes((prev) => prev.filter((e) => e.id !== newEmote.id));
    }, 3500);
    audioManager.playEmotePop();
  }, []);

  const triggerChat = useCallback((playerId: string, messageId: QuickChatId) => {
    const found = ALLOWED_QUICK_CHATS.find((c) => c.id === messageId);
    if (!found) return;
    const newChat: ActiveQuickChat = {
      id: `${playerId}-${Date.now()}-${Math.random()}`,
      playerId,
      messageId,
      text: found.text,
      timestamp: Date.now(),
    };
    setActiveQuickChats((prev) => [...prev, newChat]);
    setTimeout(() => {
      setActiveQuickChats((prev) => prev.filter((c) => c.id !== newChat.id));
    }, 4500);
    audioManager.playEmotePop();
  }, []);

  // Bot reaction AI: trigger occasional bot emotes on dramatic events
  useEffect(() => {
    if (thullaAlert) {
      // Find the bot players
      const penaltyBot = gameState.players.find(
        (p) => p.isBot && p.nickname === thullaAlert.collectorPlayer
      );
      const thullaBot = gameState.players.find(
        (p) => p.isBot && p.nickname === thullaAlert.thullaPlayer
      );

      if (thullaBot) {
        setTimeout(() => triggerReaction(thullaBot.id, 'fire'), 200);
      }
      if (penaltyBot) {
        setTimeout(() => triggerReaction(penaltyBot.id, 'skull'), 500);
      }
    }
  }, [thullaAlert, gameState.players, triggerReaction]);

  const isHumanTurn = playerView.currentTurnPlayerId === playerView.myId;
  const legalCardIds = playerView.legalCardIds;

  // Non-human players (opponents)
  const opponents = playerView.players.filter((p) => p.id !== playerView.myId);

  const handleSelectCard = (card: Card) => {
    if (!legalCardIds.includes(card.id)) return;
    setSelectedCardId(card.id === selectedCardId ? null : card.id);
  };

  const handlePlayCard = (cardIdToPlay?: string) => {
    const targetCardId = cardIdToPlay || selectedCardId;
    if (!targetCardId) return;
    const success = playHumanCard(targetCardId);
    if (success) {
      setSelectedCardId(null);
    }
  };

  const handleDropCard = (cardId: string) => {
    if (!legalCardIds.includes(cardId)) return;
    handlePlayCard(cardId);
  };

  const handleRestart = () => {
    setIsDealing(true);
    restartMatch();
  };

  const leaderPlayer = gameState.players.find((p) => p.id === gameState.currentLeaderPlayerId);

  return (
    <div className="relative min-h-screen bg-charcoal-950 flex flex-col justify-between overflow-hidden select-none touch-manipulation">
      {/* Top Table Header */}
      <header className="relative z-30 w-full bg-charcoal-900/95 border-b border-charcoal-800 px-3 sm:px-6 py-2 flex items-center justify-between backdrop-blur-md">
        {/* Left: Mode Badge & Emote Bar */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs font-semibold shadow-sm">
            <Bot className="w-3.5 h-3.5 text-gold-400" />
            <span className="font-bold tracking-wide">Practice vs Bots ({playerCount}P)</span>
          </div>

          {/* Emote & Quick Chat Bar */}
          <EmoteBar
            onSendEmote={(emoteId) => triggerReaction(playerView.myId, emoteId)}
            onSendQuickChat={(chatId) => triggerChat(playerView.myId, chatId)}
          />
        </div>

        {/* Center: Trick Status & Leading Suit */}
        <div className="flex items-center space-x-2">
          {playerView.leadingSuit ? (
            <div className="flex items-center space-x-1.5 bg-felt-900 border border-gold-500/50 px-3 py-1 rounded-full text-xs shadow-md">
              <span className="text-gray-300 hidden sm:inline">Lead Suit:</span>
              <span className="font-bold text-cream-100 flex items-center space-x-1">
                <SuitIcon suit={playerView.leadingSuit} size={14} />
                <span className="capitalize">{playerView.leadingSuit}</span>
              </span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full bg-charcoal-800 border border-charcoal-700 text-xs text-gray-300 font-medium">
              {playerView.trickNumber === 1 ? '♠ Ace of Spades Opening' : 'New Trick Leading'}
            </div>
          )}
        </div>

        {/* Right: Sound, Settings, Restart, Rules */}
        <div className="flex items-center space-x-2">
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

          {/* Restart Button */}
          <button
            onClick={handleRestart}
            className="p-1.5 rounded-lg bg-charcoal-800 text-gray-300 hover:text-white border border-charcoal-700"
            title="Restart Match"
            aria-label="Restart Match"
          >
            <RotateCcw className="w-4 h-4 text-gold-400" />
          </button>

          {/* In-Game Settings Modal Trigger */}
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

      {/* Main Playing Table */}
      <main className="relative flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 flex flex-col justify-between items-center overflow-hidden">
        {/* Felt Table Oval Surface */}
        <div className="relative w-full h-full min-h-[440px] sm:min-h-[500px] rounded-[36px] sm:rounded-[70px] felt-table flex flex-col justify-between p-3 sm:p-6 overflow-hidden shadow-felt-inset">
          {/* Inner Golden Stitch Border Line */}
          <div className="absolute inset-2 sm:inset-4 rounded-[28px] sm:rounded-[60px] felt-stitch pointer-events-none" />

          {/* Opponents Positioning Ring */}
          <div className="relative z-10 w-full flex items-center justify-around gap-2 pt-1 sm:pt-2">
            {opponents.map((opp) => {
              const isInTurn = playerView.currentTurnPlayerId === opp.id;

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
                      <span className="text-[9px] font-bold text-emerald-400 mt-0.5 flex items-center space-x-1">
                        <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                        <span>Escaped #{opp.escapeRank}</span>
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
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-3 sm:my-6">
            {/* Thulla Alert Overlay Notification */}
            {thullaAlert && (
              <div className="absolute z-30 flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-ruby-950/95 border-2 border-ruby-500 shadow-2xl animate-bounce">
                <Flame className="w-6 h-6 text-ruby-400 animate-pulse" />
                <div className="text-center">
                  <p className="text-base font-black text-ruby-300 tracking-wider">
                    THULLA!
                  </p>
                  <p className="text-xs text-cream-100">
                    <strong className="text-gold-300">{thullaAlert.collectorPlayer}</strong> picks up {thullaAlert.cardCount} cards!
                  </p>
                </div>
              </div>
            )}

            {/* Central Animated Trick Container with Drag & Drop */}
            <AnimatedTrickPile
              trickCards={playerView.currentTrick}
              leadingSuit={playerView.leadingSuit}
              isMyTurn={isHumanTurn}
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
                playerId={playerView.myId}
                activeEmotes={activeEmotes}
                activeQuickChats={activeQuickChats}
              />

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
              onClick={() => handlePlayCard()}
              className="font-bold tracking-wider px-4 sm:px-6 shadow-lg"
            >
              Play Card
            </Button>
          </div>
        </div>

        {/* Local Player's Real Interactive Hand with Large Hand Support */}
        <div className="relative z-20 w-full max-w-5xl mt-[-20px] sm:mt-[-30px]">
          <CardHand
            cards={playerView.myHand}
            selectedCardId={selectedCardId}
            onSelectCard={handleSelectCard}
            onPlayCard={(card) => handlePlayCard(card.id)}
            disabledCardIds={playerView.myHand
              .filter((c) => !legalCardIds.includes(c.id))
              .map((c) => c.id)}
            highlightedCardIds={legalCardIds}
            size={settings.cardSize === 'compact' ? 'sm' : settings.cardSize === 'large' ? 'lg' : 'md'}
            isDraggable={isHumanTurn}
          />
        </div>
      </main>

      {/* Activity Log Drawer */}
      <EventLogDrawer events={gameState.actionHistory} />

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
        onLeaveGame={() => navigate('/')}
        isMultiplayer={false}
      />

      {/* Game Finished Bhabhi Result Modal */}
      <ResultModal
        isOpen={gameState.status === 'finished'}
        gameState={gameState}
        onPlayAgain={handleRestart}
        humanPlayerId={playerView.myId}
        isMultiplayer={false}
      />
    </div>
  );
}
