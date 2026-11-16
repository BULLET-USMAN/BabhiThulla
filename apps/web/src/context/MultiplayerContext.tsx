import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  AvatarId,
  ClientSessionCredentials,
  EmoteBroadcastPayload,
  EmoteId,
  GameSyncPayload,
  PlayerGameView,
  QuickChatBroadcastPayload,
  QuickChatId,
  RematchStatusPayload,
  RoomCreatedResponse,
  RoomJoinedResponse,
  RoomSummary,
  TrickResult,
} from '@bhabhi/shared';
import { socketClient } from '../services/socketClient.js';
import { audioManager } from '../audio/audioManager.js';
import { soundService } from '../services/sound.js';
import { useToast } from './ToastContext.js';
import { platformStorage, hapticsService, lifecycleManager } from '../platform/index.js';

const SESSION_STORAGE_KEY = 'bhabhi_multiplayer_session';

export interface ActiveEmote {
  id: string;
  playerId: string;
  emoteId: EmoteId;
  symbol: string;
  timestamp: number;
}

export interface ActiveQuickChat {
  id: string;
  playerId: string;
  messageId: QuickChatId;
  text: string;
  timestamp: number;
}

export interface MultiplayerContextValue {
  room: RoomSummary | null;
  credentials: ClientSessionCredentials | null;
  gameState: PlayerGameView | null;
  isPaused: boolean;
  pauseReason?: string;
  pauseGraceSeconds: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  rematchStatus: RematchStatusPayload | null;
  lastTrickResult: TrickResult | null;
  thullaBanner: { playerId: string; cardId?: string } | null;
  activeEmotes: ActiveEmote[];
  activeQuickChats: ActiveQuickChat[];
  createRoom: (nickname: string, avatar: AvatarId, maxPlayers?: number) => Promise<{ success: boolean; roomCode?: string; error?: string }>;
  joinRoom: (roomCode: string, nickname: string, avatar: AvatarId) => Promise<{ success: boolean; error?: string }>;
  toggleReady: (isReady: boolean) => Promise<void>;
  startGame: () => Promise<{ success: boolean; error?: string }>;
  playCard: (cardId: string) => Promise<{ success: boolean; error?: string }>;
  voteRematch: (vote: boolean) => Promise<void>;
  sendEmote: (emoteId: EmoteId) => Promise<boolean>;
  sendQuickChat: (messageId: QuickChatId) => Promise<boolean>;
  leaveRoom: () => Promise<void>;
  reconnect: () => Promise<boolean>;
}

const MultiplayerContext = createContext<MultiplayerContextValue | undefined>(undefined);

export const MultiplayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast();

  const [room, setRoom] = useState<RoomSummary | null>(null);
  const [credentials, setCredentials] = useState<ClientSessionCredentials | null>(() => {
    try {
      const stored = platformStorage.getSync(SESSION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [gameState, setGameState] = useState<PlayerGameView | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pauseReason, setPauseReason] = useState<string | undefined>(undefined);
  const [pauseGraceSeconds, setPauseGraceSeconds] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rematchStatus, setRematchStatus] = useState<RematchStatusPayload | null>(null);
  const [lastTrickResult, setLastTrickResult] = useState<TrickResult | null>(null);
  const [thullaBanner, setThullaBanner] = useState<{ playerId: string; cardId?: string } | null>(null);
  const [activeEmotes, setActiveEmotes] = useState<ActiveEmote[]>([]);
  const [activeQuickChats, setActiveQuickChats] = useState<ActiveQuickChat[]>([]);

  const graceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevTurnPlayerRef = useRef<string | null>(null);

  // Save or remove session from storage
  const persistSession = (creds: ClientSessionCredentials | null) => {
    setCredentials(creds);
    if (creds) {
      platformStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(creds)).catch(() => {});
    } else {
      platformStorage.removeItem(SESSION_STORAGE_KEY).catch(() => {});
    }
  };

  // Reconnection attempt
  const reconnect = useCallback(async (): Promise<boolean> => {
    if (!credentials) return false;
    setIsConnecting(true);

    try {
      const res = await socketClient.emitWithAck<{
        room: RoomSummary;
        gameState?: GameSyncPayload;
      }>('room:reconnect', {
        roomCode: credentials.roomCode,
        playerId: credentials.playerId,
        reconnectToken: credentials.reconnectToken,
      });

      setIsConnecting(false);
      if (res.success && res.data) {
        setRoom(res.data.room);
        if (res.data.gameState) {
          setGameState(res.data.gameState.view);
          setIsPaused(res.data.gameState.isPaused);
          setPauseReason(res.data.gameState.pauseReason);
        }
        addToast('Reconnected to room successfully!', 'success');
        return true;
      } else {
        persistSession(null);
        return false;
      }
    } catch {
      setIsConnecting(false);
      return false;
    }
  }, [credentials, addToast]);

  // Connect socket and register global listeners
  useEffect(() => {
    const socket = socketClient.connect();

    const handleConnect = () => {
      setIsConnected(true);
      setError(null);
      // Attempt reconnect if session credentials exist
      if (credentials && !room) {
        reconnect();
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleRoomUpdated = (data: { room: RoomSummary }) => {
      setRoom(data.room);
    };

    const handleGameState = (data: GameSyncPayload) => {
      setGameState(data.view);
      setIsPaused(data.isPaused);
      setPauseReason(data.pauseReason);
      if (data.view.lastTrickResult) {
        setLastTrickResult(data.view.lastTrickResult);
      }
      if (
        credentials &&
        data.view.currentTurnPlayerId === credentials.playerId &&
        prevTurnPlayerRef.current !== credentials.playerId
      ) {
        hapticsService.turnAlert();
      }
      prevTurnPlayerRef.current = data.view.currentTurnPlayerId;
    };

    const handleGameStarted = () => {
      audioManager.playCardDeal();
      soundService.playCardPlay();
      addToast('The match has begun! Check your cards.', 'info');
      setRematchStatus(null);
    };

    const handleThulla = (data: { playerId: string; card?: { id: string } }) => {
      audioManager.playThulla();
      soundService.playThulla();
      hapticsService.thullaHit();
      const p = room?.players.find((pl) => pl.id === data.playerId);
      const name = p?.nickname || 'A player';
      addToast(`THULLA! ${name} gave a Thulla!`, 'error');
      setThullaBanner({ playerId: data.playerId, cardId: data.card?.id });
      setTimeout(() => setThullaBanner(null), 3500);
    };

    const handleTrickResolved = (data: { result: TrickResult }) => {
      setLastTrickResult(data.result);
      if (data.result.isThulla) {
        audioManager.playPileCollect();
        soundService.playCollectPile();
        hapticsService.thullaHit();
      } else {
        audioManager.playTrickSweep();
        soundService.playCardPlay();
      }
    };

    const handlePlayerEscaped = (data: { playerId: string }) => {
      audioManager.playPlayerEscape();
      if (credentials && data.playerId === credentials.playerId) {
        hapticsService.victory();
      }
      const p = room?.players.find((pl) => pl.id === data.playerId);
      const name = p?.nickname || 'A player';
      addToast(`🎉 ${name} shed all cards and escaped!`, 'success');
    };

    const handleGameFinished = (data: { bhabhiPlayerId: string }) => {
      audioManager.playBhabhiFinish();
      if (credentials && data.bhabhiPlayerId === credentials.playerId) {
        hapticsService.bhabhiDefeat();
      } else {
        hapticsService.victory();
      }
      const bhabhi = room?.players.find((pl) => pl.id === data.bhabhiPlayerId);
      const name = bhabhi?.nickname || 'A player';
      addToast(`Game Over! ${name} is the Bhabhi!`, 'warning');
    };

    const handleGamePaused = (data: { pausedPlayerId: string; gracePeriodRemainingMs: number; reason?: string }) => {
      setIsPaused(true);
      setPauseReason(data.reason || 'Waiting for player to reconnect...');
      const seconds = Math.ceil(data.gracePeriodRemainingMs / 1000);
      setPauseGraceSeconds(seconds);

      if (graceTimerRef.current) clearInterval(graceTimerRef.current);
      graceTimerRef.current = setInterval(() => {
        setPauseGraceSeconds((prev) => {
          if (prev === null || prev <= 1) {
            if (graceTimerRef.current) clearInterval(graceTimerRef.current);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      addToast(data.reason || 'Player disconnected. Match paused.', 'warning');
    };

    const handleGameResumed = () => {
      setIsPaused(false);
      setPauseReason(undefined);
      setPauseGraceSeconds(null);
      if (graceTimerRef.current) {
        clearInterval(graceTimerRef.current);
        graceTimerRef.current = null;
      }
      addToast('All players back! Match resumed.', 'success');
    };

    const handlePlayerJoined = (data: { player: { nickname: string } }) => {
      audioManager.playPlayerJoined();
      addToast(`${data.player.nickname} joined the room.`, 'info');
    };

    const handlePlayerLeft = (data: { playerId: string }) => {
      const p = room?.players.find((pl) => pl.id === data.playerId);
      if (p) {
        addToast(`${p.nickname} left the room.`, 'info');
      }
    };

    const handleRematchStatus = (data: RematchStatusPayload) => {
      setRematchStatus(data);
      if (data.allApproved) {
        audioManager.playRematchStart();
      }
    };

    const handleRoomClosed = (data: { reason?: string }) => {
      addToast(data.reason || 'Room closed.', 'warning');
      setRoom(null);
      setGameState(null);
      persistSession(null);
    };

    const handlePlayerEmote = (data: EmoteBroadcastPayload) => {
      audioManager.playEmote();
      const emoteItem: ActiveEmote = {
        id: `${Date.now()}-${Math.random()}`,
        playerId: data.playerId,
        emoteId: data.emoteId,
        symbol: data.symbol,
        timestamp: data.timestamp,
      };
      setActiveEmotes((prev) => [...prev, emoteItem]);
      setTimeout(() => {
        setActiveEmotes((prev) => prev.filter((e) => e.id !== emoteItem.id));
      }, 3500);
    };

    const handlePlayerQuickChat = (data: QuickChatBroadcastPayload) => {
      audioManager.playButtonClick();
      const chatItem: ActiveQuickChat = {
        id: `${Date.now()}-${Math.random()}`,
        playerId: data.playerId,
        messageId: data.messageId,
        text: data.text,
        timestamp: data.timestamp,
      };
      setActiveQuickChats((prev) => [...prev, chatItem]);
      setTimeout(() => {
        setActiveQuickChats((prev) => prev.filter((c) => c.id !== chatItem.id));
      }, 4500);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('room:updated', handleRoomUpdated);
    socket.on('game:state', handleGameState);
    socket.on('game:started', handleGameStarted);
    socket.on('game:thulla', handleThulla);
    socket.on('game:trick-resolved', handleTrickResolved);
    socket.on('game:player-escaped', handlePlayerEscaped);
    socket.on('game:finished', handleGameFinished);
    socket.on('game:paused', handleGamePaused);
    socket.on('game:resumed', handleGameResumed);
    socket.on('player:joined', handlePlayerJoined);
    socket.on('player:left', handlePlayerLeft);
    socket.on('game:rematch-status', handleRematchStatus);
    socket.on('room:closed', handleRoomClosed);
    socket.on('player:emote', handlePlayerEmote);
    socket.on('player:quick-chat', handlePlayerQuickChat);

    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('room:updated', handleRoomUpdated);
      socket.off('game:state', handleGameState);
      socket.off('game:started', handleGameStarted);
      socket.off('game:thulla', handleThulla);
      socket.off('game:trick-resolved', handleTrickResolved);
      socket.off('game:player-escaped', handlePlayerEscaped);
      socket.off('game:finished', handleGameFinished);
      socket.off('game:paused', handleGamePaused);
      socket.off('game:resumed', handleGameResumed);
      socket.off('player:joined', handlePlayerJoined);
      socket.off('player:left', handlePlayerLeft);
      socket.off('game:rematch-status', handleRematchStatus);
      socket.off('room:closed', handleRoomClosed);
      socket.off('player:emote', handlePlayerEmote);
      socket.off('player:quick-chat', handlePlayerQuickChat);
      if (graceTimerRef.current) clearInterval(graceTimerRef.current);
    };
  }, [room, credentials, reconnect, addToast]);

  // Handle application foreground/background lifecycle
  useEffect(() => {
    const unbind = lifecycleManager.onResume(() => {
      if (credentials && !socketClient.isConnected()) {
        reconnect();
      }
    });
    return unbind;
  }, [credentials, reconnect]);

  const getStoredGuestId = (): string | undefined => {
    try {
      const stored = platformStorage.getSync('bhabhi_guest_identity');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.guestId;
      }
    } catch {
      // ignore
    }
    return undefined;
  };

  const createRoom = async (
    nickname: string,
    avatar: AvatarId,
    maxPlayers = 4
  ): Promise<{ success: boolean; roomCode?: string; error?: string }> => {
    setIsConnecting(true);
    setError(null);

    const guestId = getStoredGuestId();
    const requestId = `cr-${Date.now()}`;
    const res = await socketClient.emitWithAck<RoomCreatedResponse>('room:create', {
      nickname,
      avatar,
      maxPlayers,
      guestId,
      requestId,
    });

    setIsConnecting(false);
    if (!res.success || !res.data) {
      const err = res.error || 'Failed to create room.';
      setError(err);
      addToast(err, 'error');
      return { success: false, error: err };
    }

    setRoom(res.data.room);
    persistSession(res.data.credentials);
    addToast(`Room ${res.data.room.roomCode} created!`, 'success');
    return { success: true, roomCode: res.data.room.roomCode };
  };

  const joinRoom = async (
    roomCode: string,
    nickname: string,
    avatar: AvatarId
  ): Promise<{ success: boolean; error?: string }> => {
    setIsConnecting(true);
    setError(null);

    const guestId = getStoredGuestId();
    const requestId = `jr-${Date.now()}`;
    const res = await socketClient.emitWithAck<RoomJoinedResponse>('room:join', {
      roomCode: roomCode.trim().toUpperCase(),
      nickname,
      avatar,
      guestId,
      requestId,
    });

    setIsConnecting(false);
    if (!res.success || !res.data) {
      const err = res.error || 'Failed to join room.';
      setError(err);
      addToast(err, 'error');
      return { success: false, error: err };
    }

    setRoom(res.data.room);
    persistSession(res.data.credentials);
    addToast(`Joined room ${res.data.room.roomCode}!`, 'success');
    return { success: true };
  };

  const toggleReady = async (isReady: boolean): Promise<void> => {
    if (!room) return;
    audioManager.playButtonClick();
    const res = await socketClient.emitWithAck('room:ready', {
      roomCode: room.roomCode,
      isReady,
    });
    if (!res.success) {
      addToast(res.error || 'Failed to update ready state.', 'error');
    }
  };

  const startGame = async (): Promise<{ success: boolean; error?: string }> => {
    if (!room) return { success: false, error: 'No active room.' };
    audioManager.playButtonClick();
    const res = await socketClient.emitWithAck('room:start', {
      roomCode: room.roomCode,
    });
    if (!res.success) {
      addToast(res.error || 'Failed to start game.', 'error');
      return { success: false, error: res.error };
    }
    return { success: true };
  };

  const playCard = async (cardId: string): Promise<{ success: boolean; error?: string }> => {
    if (!room || !credentials) return { success: false, error: 'No active room.' };
    audioManager.playCardPlay();
    soundService.playCardPlay();
    hapticsService.cardPlay();

    const requestId = `play-${Date.now()}-${cardId}`;
    const res = await socketClient.emitWithAck('game:play-card', {
      roomCode: room.roomCode,
      cardId,
      requestId,
    });

    if (!res.success) {
      addToast(res.error || 'Invalid move.', 'warning');
      return { success: false, error: res.error };
    }
    return { success: true };
  };

  const voteRematch = async (vote: boolean): Promise<void> => {
    if (!room) return;
    audioManager.playButtonClick();
    const res = await socketClient.emitWithAck('game:rematch-vote', {
      roomCode: room.roomCode,
      vote,
    });
    if (!res.success) {
      addToast(res.error || 'Failed to vote for rematch.', 'error');
    }
  };

  const sendEmote = async (emoteId: EmoteId): Promise<boolean> => {
    if (!room) return false;
    audioManager.playEmote();
    const res = await socketClient.emitWithAck('room:emote', {
      roomCode: room.roomCode,
      emoteId,
    });
    return res.success;
  };

  const sendQuickChat = async (messageId: QuickChatId): Promise<boolean> => {
    if (!room) return false;
    audioManager.playButtonClick();
    const res = await socketClient.emitWithAck('room:quick-chat', {
      roomCode: room.roomCode,
      messageId,
    });
    return res.success;
  };

  const leaveRoom = async (): Promise<void> => {
    audioManager.playButtonClick();
    if (room) {
      await socketClient.emitWithAck('room:leave', { roomCode: room.roomCode });
    }
    setRoom(null);
    setGameState(null);
    persistSession(null);
    setActiveEmotes([]);
    setActiveQuickChats([]);
  };

  const value: MultiplayerContextValue = {
    room,
    credentials,
    gameState,
    isPaused,
    pauseReason,
    pauseGraceSeconds,
    isConnected,
    isConnecting,
    error,
    rematchStatus,
    lastTrickResult,
    thullaBanner,
    activeEmotes,
    activeQuickChats,
    createRoom,
    joinRoom,
    toggleReady,
    startGame,
    playCard,
    voteRematch,
    sendEmote,
    sendQuickChat,
    leaveRoom,
    reconnect,
  };

  return <MultiplayerContext.Provider value={value}>{children}</MultiplayerContext.Provider>;
};

export function useMultiplayer(): MultiplayerContextValue {
  const context = useContext(MultiplayerContext);
  if (!context) {
    return {
      room: null,
      credentials: null,
      gameState: null,
      isPaused: false,
      pauseReason: undefined,
      pauseGraceSeconds: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      rematchStatus: null,
      lastTrickResult: null,
      thullaBanner: null,
      activeEmotes: [],
      activeQuickChats: [],
      createRoom: async () => ({ success: false, error: 'No multiplayer provider' }),
      joinRoom: async () => ({ success: false, error: 'No multiplayer provider' }),
      toggleReady: async () => {},
      startGame: async () => ({ success: false, error: 'No multiplayer provider' }),
      playCard: async () => ({ success: false, error: 'No multiplayer provider' }),
      voteRematch: async () => {},
      sendEmote: async () => false,
      sendQuickChat: async () => false,
      leaveRoom: async () => {},
      reconnect: async () => false,
    };
  }
  return context;
}
