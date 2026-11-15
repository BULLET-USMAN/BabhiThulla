import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../context/SettingsContext.js';
import { ToastProvider } from '../context/ToastContext.js';
import { MultiplayerContextValue, useMultiplayer } from '../context/MultiplayerContext.js';
import { MultiplayerGameView } from './MultiplayerGameView.js';
import { PlayerGameView, RoomSummary } from '@bhabhi/shared';

// Mock useMultiplayer
vi.mock('../context/MultiplayerContext.js', async () => {
  const actual = await vi.importActual('../context/MultiplayerContext.js');
  return {
    ...actual,
    useMultiplayer: vi.fn(),
  };
});

describe('MultiplayerGameView Component', () => {
  it('renders fallback screen when no active game session is found', () => {
    vi.mocked(useMultiplayer).mockReturnValue({
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
      createRoom: vi.fn(),
      joinRoom: vi.fn(),
      toggleReady: vi.fn(),
      startGame: vi.fn(),
      playCard: vi.fn(),
      voteRematch: vi.fn(),
      sendEmote: vi.fn(),
      sendQuickChat: vi.fn(),
      leaveRoom: vi.fn(),
      reconnect: vi.fn(),
    });

    render(
      <SettingsProvider>
        <ToastProvider>
          <MemoryRouter>
            <MultiplayerGameView />
          </MemoryRouter>
        </ToastProvider>
      </SettingsProvider>
    );

    expect(screen.getByText(/no active multiplayer match/i)).toBeInTheDocument();
  });

  it('renders live multiplayer game table with opponents and hand when active', () => {
    const mockRoom: RoomSummary = {
      roomId: 'room-1',
      roomCode: 'LIVE99',
      hostPlayerId: 'p-1',
      maxPlayers: 3,
      status: 'playing',
      players: [
        {
          id: 'p-1',
          nickname: 'LocalHero',
          avatar: 'avatar-1',
          isHost: true,
          isReady: true,
          isConnected: true,
          seatIndex: 0,
        },
        {
          id: 'p-2',
          nickname: 'Opponent1',
          avatar: 'avatar-2',
          isHost: false,
          isReady: true,
          isConnected: true,
          seatIndex: 1,
        },
        {
          id: 'p-3',
          nickname: 'Opponent2',
          avatar: 'avatar-3',
          isHost: false,
          isReady: true,
          isConnected: true,
          seatIndex: 2,
        },
      ],
      isPaused: false,
      createdAt: Date.now(),
    };

    const mockGameState: PlayerGameView = {
      gameId: 'game-1',
      status: 'playing',
      myId: 'p-1',
      myHand: [
        { id: 'c-1', suit: 'spades', rank: 'A' },
        { id: 'c-2', suit: 'hearts', rank: 'K' },
      ],
      players: [
        {
          id: 'p-1',
          nickname: 'LocalHero',
          avatar: 'avatar-1',
          cardCount: 2,
          hasEscaped: false,
          isBot: false,
          seatIndex: 0,
        },
        {
          id: 'p-2',
          nickname: 'Opponent1',
          avatar: 'avatar-2',
          cardCount: 5,
          hasEscaped: false,
          isBot: false,
          seatIndex: 1,
        },
        {
          id: 'p-3',
          nickname: 'Opponent2',
          avatar: 'avatar-3',
          cardCount: 6,
          hasEscaped: false,
          isBot: false,
          seatIndex: 2,
        },
      ],
      playerOrder: ['p-1', 'p-2', 'p-3'],
      currentTurnPlayerId: 'p-1',
      currentLeaderPlayerId: 'p-1',
      leadingSuit: null,
      currentTrick: [],
      discardCount: 0,
      lastTrickResult: null,
      escapedPlayerIds: [],
      bhabhiPlayerId: null,
      turnNumber: 1,
      trickNumber: 1,
      recentEvents: [],
      legalCardIds: ['c-1'],
    };

    const mockValue: MultiplayerContextValue = {
      room: mockRoom,
      credentials: { playerId: 'p-1', reconnectToken: 'tok', roomCode: 'LIVE99' },
      gameState: mockGameState,
      isPaused: false,
      pauseReason: undefined,
      pauseGraceSeconds: null,
      isConnected: true,
      isConnecting: false,
      error: null,
      rematchStatus: null,
      lastTrickResult: null,
      thullaBanner: null,
      activeEmotes: [],
      activeQuickChats: [],
      createRoom: vi.fn(),
      joinRoom: vi.fn(),
      toggleReady: vi.fn(),
      startGame: vi.fn(),
      playCard: vi.fn(),
      voteRematch: vi.fn(),
      sendEmote: vi.fn(),
      sendQuickChat: vi.fn(),
      leaveRoom: vi.fn(),
      reconnect: vi.fn(),
    };

    vi.mocked(useMultiplayer).mockReturnValue(mockValue);

    render(
      <SettingsProvider>
        <ToastProvider>
          <MemoryRouter>
            <MultiplayerGameView />
          </MemoryRouter>
        </ToastProvider>
      </SettingsProvider>
    );

    expect(screen.getByText(/room live99/i)).toBeInTheDocument();
    expect(screen.getByText('Opponent1')).toBeInTheDocument();
    expect(screen.getByText('Opponent2')).toBeInTheDocument();
    expect(screen.getByText(/your turn/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play card/i })).toBeInTheDocument();
  });

  it('displays pause banner when match is paused due to disconnected player', () => {
    const mockRoom: RoomSummary = {
      roomId: 'room-1',
      roomCode: 'PAUS99',
      hostPlayerId: 'p-1',
      maxPlayers: 3,
      status: 'paused',
      players: [
        {
          id: 'p-1',
          nickname: 'LocalHero',
          avatar: 'avatar-1',
          isHost: true,
          isReady: true,
          isConnected: true,
          seatIndex: 0,
        },
        {
          id: 'p-2',
          nickname: 'Opponent1',
          avatar: 'avatar-2',
          isHost: false,
          isReady: true,
          isConnected: false,
          seatIndex: 1,
        },
      ],
      isPaused: true,
      pauseReason: 'Waiting for Opponent1 to reconnect...',
      createdAt: Date.now(),
    };

    const mockGameState: PlayerGameView = {
      gameId: 'game-1',
      status: 'playing',
      myId: 'p-1',
      myHand: [{ id: 'c-1', suit: 'spades', rank: 'A' }],
      players: [
        {
          id: 'p-1',
          nickname: 'LocalHero',
          avatar: 'avatar-1',
          cardCount: 1,
          hasEscaped: false,
          isBot: false,
          seatIndex: 0,
        },
        {
          id: 'p-2',
          nickname: 'Opponent1',
          avatar: 'avatar-2',
          cardCount: 3,
          hasEscaped: false,
          isBot: false,
          seatIndex: 1,
        },
      ],
      playerOrder: ['p-1', 'p-2'],
      currentTurnPlayerId: 'p-2',
      currentLeaderPlayerId: 'p-1',
      leadingSuit: 'spades',
      currentTrick: [],
      discardCount: 0,
      lastTrickResult: null,
      escapedPlayerIds: [],
      bhabhiPlayerId: null,
      turnNumber: 2,
      trickNumber: 1,
      recentEvents: [],
      legalCardIds: ['c-1'],
    };

    const mockValue: MultiplayerContextValue = {
      room: mockRoom,
      credentials: { playerId: 'p-1', reconnectToken: 'tok', roomCode: 'PAUS99' },
      gameState: mockGameState,
      isPaused: true,
      pauseReason: 'Waiting for Opponent1 to reconnect...',
      pauseGraceSeconds: 85,
      isConnected: true,
      isConnecting: false,
      error: null,
      rematchStatus: null,
      lastTrickResult: null,
      thullaBanner: null,
      activeEmotes: [],
      activeQuickChats: [],
      createRoom: vi.fn(),
      joinRoom: vi.fn(),
      toggleReady: vi.fn(),
      startGame: vi.fn(),
      playCard: vi.fn(),
      voteRematch: vi.fn(),
      sendEmote: vi.fn(),
      sendQuickChat: vi.fn(),
      leaveRoom: vi.fn(),
      reconnect: vi.fn(),
    };

    vi.mocked(useMultiplayer).mockReturnValue(mockValue);

    render(
      <SettingsProvider>
        <ToastProvider>
          <MemoryRouter>
            <MultiplayerGameView />
          </MemoryRouter>
        </ToastProvider>
      </SettingsProvider>
    );

    expect(screen.getByText(/match paused:/i)).toBeInTheDocument();
    expect(screen.getByText(/85s/i)).toBeInTheDocument();
  });
});
