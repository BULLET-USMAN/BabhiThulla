import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Copy,
  Check,
  Play,
  LogOut,
  Users,
  Sparkles,
  Link2,
  Trophy,
} from 'lucide-react';
import {
  RoomParticipant,
  DEFAULT_PLAYERS,
} from '@bhabhi/shared';
import { Button } from '../components/ui/Button.js';
import { AvatarBadge } from '../components/ui/AvatarBadge.js';
import { StatusBadge } from '../components/ui/StatusBadge.js';
import { useSettings } from '../context/SettingsContext.js';
import { useToast } from '../context/ToastContext.js';
import { useMultiplayer } from '../context/MultiplayerContext.js';
import { RoomLeaderboardModal } from '../components/multiplayer/RoomLeaderboardModal.js';

export function LobbyView() {
  const { roomCode: paramCode } = useParams<{ roomCode: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { addToast } = useToast();
  const {
    room,
    credentials,
    gameState,
    toggleReady,
    startGame,
    leaveRoom,
  } = useMultiplayer();

  const isRealMultiplayer = !!room;
  const activeRoomCode = room?.roomCode || paramCode || 'BTH77A';

  const isHost = isRealMultiplayer
    ? credentials?.playerId === room.hostPlayerId
    : searchParams.get('host') !== 'false';

  const maxPlayers = room?.maxPlayers || parseInt(searchParams.get('players') || `${DEFAULT_PLAYERS}`, 10);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [localReady, setLocalReady] = useState(true);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Navigate to multiplayer table when match starts
  useEffect(() => {
    if (gameState && gameState.status === 'playing') {
      navigate('/multiplayer');
    }
  }, [gameState, navigate]);

  const localMember = room?.players.find((p) => p.id === credentials?.playerId);
  const isReady = isRealMultiplayer ? (localMember?.isReady ?? false) : localReady;

  // Mock participants for preview fallback mode
  const mockParticipants: RoomParticipant[] = [
    {
      id: 'local-player',
      nickname: settings.nickname,
      avatar: settings.avatar,
      isHost: isHost,
      isReady: localReady,
      isConnected: true,
      seatIndex: 0,
    },
    {
      id: 'mock-player-2',
      nickname: 'Farhan (Preview Bot)',
      avatar: 'avatar-2' as const,
      isHost: !isHost,
      isReady: true,
      isConnected: true,
      seatIndex: 1,
    },
    ...(maxPlayers >= 3
      ? [
          {
            id: 'mock-player-3',
            nickname: 'Zainab (Preview Bot)',
            avatar: 'avatar-4' as const,
            isHost: false,
            isReady: true,
            isConnected: true,
            seatIndex: 2,
          },
        ]
      : []),
    ...(maxPlayers >= 4
      ? [
          {
            id: 'mock-player-4',
            nickname: 'Hamza (Preview Bot)',
            avatar: 'avatar-5' as const,
            isHost: false,
            isReady: false,
            isConnected: true,
            seatIndex: 3,
          },
        ]
      : []),
    ...(maxPlayers >= 5
      ? [
          {
            id: 'mock-player-5',
            nickname: 'Ayesha (Preview Bot)',
            avatar: 'avatar-7' as const,
            isHost: false,
            isReady: true,
            isConnected: true,
            seatIndex: 4,
          },
        ]
      : []),
    ...(maxPlayers >= 6
      ? [
          {
            id: 'mock-player-6',
            nickname: 'Bilal (Preview Bot)',
            avatar: 'avatar-8' as const,
            isHost: false,
            isReady: true,
            isConnected: true,
            seatIndex: 5,
          },
        ]
      : []),
  ];

  const participants = isRealMultiplayer ? room.players : mockParticipants;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeRoomCode);
    setCopiedCode(true);
    addToast('Room code copied to clipboard!', 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const baseUrl = ((import.meta as any).env?.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '');
    const inviteUrl = `${baseUrl}/join/${activeRoomCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    addToast('Invitation link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleToggleReady = async () => {
    if (isRealMultiplayer) {
      await toggleReady(!isReady);
    } else {
      setLocalReady(!localReady);
    }
  };

  const handleStartGame = async () => {
    if (isRealMultiplayer) {
      const res = await startGame();
      if (res.success) {
        navigate('/multiplayer');
      }
    } else {
      navigate(`/table?players=${maxPlayers}`);
    }
  };

  const handleLeave = async () => {
    if (isRealMultiplayer) {
      await leaveRoom();
    }
    navigate('/');
  };

  const connectedCount = participants.filter((p) => p.isConnected).length;
  const allReady = participants.filter((p) => p.isConnected).every((p) => p.isReady);
  const canStart = isHost && connectedCount >= 3 && allReady;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Top Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-charcoal-850 border border-gold-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gold-300">
              {isRealMultiplayer ? 'Real-Time Multiplayer Room' : 'Multiplayer Lobby Preview'}
            </h3>
            <p className="text-xs text-gray-400">
              {isRealMultiplayer
                ? 'Share the room code or invite link with friends to join and play.'
                : 'Slots and bots are simulated locally for Phase 1 UI validation. Live WebSocket multiplayer arrives in Phase 2.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLeave}
          className="inline-flex items-center space-x-1.5 text-xs text-ruby-400 hover:text-ruby-300 px-3 py-1.5 rounded-lg border border-ruby-500/30 hover:bg-ruby-500/10 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Leave Room</span>
        </button>
      </div>

      {/* Main Room Card */}
      <div className="bg-charcoal-850 border border-charcoal-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-8">
        {/* Room Code & Share Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-charcoal-700/80">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Private Room Code
            </p>
            <div className="flex items-center space-x-3">
              <span className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-gold-300 bg-charcoal-900 px-4 py-1.5 rounded-xl border border-gold-500/40">
                {activeRoomCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-3 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-600 hover:border-gold-500 text-gray-300 hover:text-gold-300 transition-all shadow-md"
                title="Copy room code"
                aria-label="Copy room code"
              >
                {copiedCode ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <Button
              variant="outline"
              size="md"
              onClick={handleCopyLink}
              leftIcon={copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4" />}
            >
              {copiedLink ? 'Link Copied!' : 'Copy Invite Link'}
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsLeaderboardOpen(true)}
              leftIcon={<Trophy className="w-4 h-4 text-gold-400" />}
            >
              Standings
            </Button>
            <div className="flex items-center space-x-1 px-3 py-2 bg-charcoal-900 rounded-xl border border-charcoal-700 text-xs text-gray-300">
              <Users className="w-4 h-4 text-gold-400" />
              <span>
                {connectedCount} / {maxPlayers} Players
              </span>
            </div>
          </div>
        </div>

        {/* Players Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400 uppercase tracking-wide">
            <span>Connected Seats</span>
            <span>Status</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {participants.map((p, idx) => {
              const isLocal = isRealMultiplayer
                ? p.id === credentials?.playerId
                : idx === 0;

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    isLocal
                      ? 'bg-felt-900/40 border-gold-500/50 shadow-md ring-1 ring-gold-500/30'
                      : 'bg-charcoal-900/90 border-charcoal-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <AvatarBadge avatarId={p.avatar} size="md" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-cream-100">
                          {p.nickname}
                        </span>
                        {isLocal && (
                          <span className="text-[10px] uppercase font-bold text-gold-400 bg-gold-500/20 px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <StatusBadge
                          type={p.isConnected ? 'connected' : 'disconnected'}
                          label={p.isConnected ? 'Connected' : 'Offline'}
                        />
                        {p.isHost && <StatusBadge type="host" />}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isLocal ? (
                      <button
                        onClick={handleToggleReady}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all ${
                          isReady
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-charcoal-800 text-gray-400 border-charcoal-600'
                        }`}
                      >
                        {isReady ? 'Ready ✓' : 'Click to Ready'}
                      </button>
                    ) : (
                      <StatusBadge type={p.isReady ? 'ready' : 'waiting'} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-charcoal-700/80">
          <p className="text-xs text-gray-400 text-center sm:text-left">
            {isHost
              ? connectedCount < 3
                ? 'Need at least 3 players to start the match.'
                : !allReady
                ? 'Waiting for all players to click Ready...'
                : 'All players are ready! Click to start the match.'
              : isReady
              ? 'Waiting for the host to launch the match...'
              : 'Click Ready when you are prepared to play.'}
          </p>

          <Button
            variant="gold"
            size="lg"
            disabled={isRealMultiplayer && !canStart}
            onClick={handleStartGame}
            leftIcon={<Play className="w-5 h-5 fill-current" />}
            className="w-full sm:w-auto min-w-[200px]"
          >
            {isRealMultiplayer ? 'Start Match' : 'Launch Table Preview'}
          </Button>
        </div>
      </div>

      {/* Room Leaderboard Modal */}
      <RoomLeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        roomCode={activeRoomCode}
      />
    </div>
  );
}
