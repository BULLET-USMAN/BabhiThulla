import { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameState,
  PlayerGameView,
  createGame,
  stepGame,
  getPlayerView,
  chooseBotMove,
  GameEvent,
  AvatarId,
} from '@bhabhi/shared';
import { audioManager } from '../audio/audioManager.js';
import { useToast } from '../context/ToastContext.js';
import { hapticsService } from '../platform/index.js';

export interface UsePracticeGameOptions {
  playerCount: number;
  humanNickname: string;
  humanAvatar: AvatarId;
  humanId?: string;
  botDelayMs?: number;
}

const BOT_NAMES = ['Farhan', 'Zainab', 'Hamza', 'Ayesha', 'Bilal'];
const BOT_AVATARS: AvatarId[] = [
  'avatar-2',
  'avatar-4',
  'avatar-5',
  'avatar-7',
  'avatar-8',
];

export function usePracticeGame({
  playerCount,
  humanNickname,
  humanAvatar,
  humanId = 'human-player',
  botDelayMs = 800,
}: UsePracticeGameOptions) {
  const { showToast } = useToast();
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initGame = useCallback((): GameState => {
    const players = [
      {
        id: humanId,
        nickname: humanNickname,
        avatar: humanAvatar,
        isBot: false,
      },
      ...Array.from({ length: playerCount - 1 }, (_, idx) => ({
        id: `bot-${idx + 1}`,
        nickname: `${BOT_NAMES[idx % BOT_NAMES.length]} (Bot)`,
        avatar: BOT_AVATARS[idx % BOT_AVATARS.length]!,
        isBot: true,
      })),
    ];

    return createGame({ players });
  }, [playerCount, humanNickname, humanAvatar, humanId]);

  const [gameState, setGameState] = useState<GameState>(() => initGame());
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [thullaAlert, setThullaAlert] = useState<{
    thullaPlayer: string;
    collectorPlayer: string;
    cardCount: number;
  } | null>(null);

  const playerView: PlayerGameView = getPlayerView(gameState, humanId);

  // Play a card by the human player
  const playHumanCard = useCallback(
    (cardId: string) => {
      if (gameState.status !== 'playing') return false;
      if (gameState.currentTurnPlayerId !== humanId) {
        showToast('It is not your turn to play.', 'info');
        return false;
      }

      const result = stepGame(gameState, {
        type: 'PLAY_CARD',
        playerId: humanId,
        cardId,
      });

      if (!result.success) {
        showToast(result.error || 'Illegal move rejected.', 'error');
        return false;
      }

      hapticsService.cardPlay();
      handlePostActionResult(result.state, result.events);
      return true;
    },
    [gameState, humanId, showToast]
  );

  // Restart match with fresh shuffle and deal
  const restartMatch = useCallback(() => {
    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current);
      botTimerRef.current = null;
    }
    setThullaAlert(null);
    setIsBotThinking(false);
    const freshGame = initGame();
    setGameState(freshGame);
    audioManager.playShuffle();
    showToast('Fresh match started! Ace of Spades leads.', 'success');
  }, [initGame, showToast]);

  // Audio and visual notification processing
  const handlePostActionResult = useCallback(
    (nextState: GameState, events?: GameEvent[]) => {
      setGameState(nextState);

      if (events) {
        for (const ev of events) {
          if (ev.type === 'THULLA_OCCURRED') {
            audioManager.playThulla();
            hapticsService.thullaHit();
          } else if (ev.type === 'PILE_COLLECTED') {
            audioManager.playPileCollect();
            const collector = nextState.players.find((p) => p.id === ev.playerId);
            const thullaEvent = events.find((e) => e.type === 'THULLA_OCCURRED');
            const thullaPlayer = nextState.players.find((p) => p.id === thullaEvent?.playerId);

            setThullaAlert({
              thullaPlayer: thullaPlayer?.nickname || 'A player',
              collectorPlayer: collector?.nickname || 'A player',
              cardCount: (ev.details?.cardCount as number) || 0,
            });

            setTimeout(() => {
              setThullaAlert(null);
            }, 3000);
          } else if (ev.type === 'CARD_PLAYED') {
            audioManager.playCardPlay();
          } else if (ev.type === 'TRICK_RESOLVED') {
            audioManager.playTrickSweep();
          } else if (ev.type === 'PLAYER_ESCAPED') {
            audioManager.playEscapeFanfare();
            if (ev.playerId === humanId) {
              hapticsService.victory();
            }
            showToast(`${ev.message}`, 'success');
          } else if (ev.type === 'BHABHI_DECLARED') {
            audioManager.playBhabhiDefeat();
            if (ev.details?.bhabhiPlayerId === humanId) {
              hapticsService.bhabhiDefeat();
            } else {
              hapticsService.victory();
            }
          }
        }
      }
    },
    [showToast]
  );

  // Automated bot turn progression loop
  useEffect(() => {
    if (gameState.status !== 'playing') {
      setIsBotThinking(false);
      return;
    }

    const currentTurnId = gameState.currentTurnPlayerId;
    if (!currentTurnId) return;

    const currentPlayer = gameState.players.find((p) => p.id === currentTurnId);
    if (!currentPlayer || !currentPlayer.isBot) {
      setIsBotThinking(false);
      hapticsService.turnAlert();
      return;
    }

    // Bot is in turn!
    setIsBotThinking(true);

    botTimerRef.current = setTimeout(() => {
      try {
        const botView = getPlayerView(gameState, currentTurnId);
        const chosenCardId = chooseBotMove(botView, 'basic');

        const result = stepGame(gameState, {
          type: 'PLAY_CARD',
          playerId: currentTurnId,
          cardId: chosenCardId,
        });

        if (result.success) {
          handlePostActionResult(result.state, result.events);
        } else {
          console.error(`Bot move failed: ${result.error}`);
        }
      } finally {
        setIsBotThinking(false);
      }
    }, botDelayMs);

    return () => {
      if (botTimerRef.current) {
        clearTimeout(botTimerRef.current);
        botTimerRef.current = null;
      }
    };
  }, [gameState, botDelayMs, handlePostActionResult]);

  return {
    gameState,
    playerView,
    playHumanCard,
    restartMatch,
    isBotThinking,
    thullaAlert,
  };
}
