import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Layers,
  RotateCcw,
  Clock,
  ArrowLeft,
  TrendingUp,
} from 'lucide-react';
import { PlayerStats, MatchHistoryItem } from '@bhabhi/shared';
import { useGuestAuth } from '../context/GuestAuthContext.js';
import { apiClient } from '../services/apiClient.js';
import { AvatarBadge } from '../components/ui/AvatarBadge.js';
import { Button } from '../components/ui/Button.js';

export function StatisticsView() {
  const { guestId, ensureGuestIdentity } = useGuestAuth();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [history, setHistory] = useState<MatchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const identity = await ensureGuestIdentity();
      if (!identity.guestId) {
        setIsLoading(false);
        return;
      }

      const [statsRes, historyRes] = await Promise.all([
        apiClient.fetchPlayerStats(identity.guestId).catch(() => null),
        apiClient.fetchMatchHistory({ guestId: identity.guestId, limit: 15 }).catch(() => []),
      ]);

      setStats(statsRes);
      setHistory(historyRes);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load player statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [guestId]);

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-sm text-gray-400 hover:text-gold-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
          <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-charcoal-850/90 border border-charcoal-700/80 rounded-2xl p-6 sm:p-8 backdrop-blur shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          <AvatarBadge avatarId={stats?.avatarId || 'avatar-1'} size="xl" />
          <div className="text-center sm:text-left space-y-1">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-cream-100">
              {stats?.displayName || 'Player'}
            </h1>
            <p className="text-xs text-gray-400">
              Guest Identity ID:{' '}
              <span className="font-mono text-gray-300">{stats?.guestIdentityId || 'Not registered'}</span>
            </p>
            <div className="flex items-center justify-center sm:justify-start space-x-3 pt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                {stats?.escapeRate ?? 0}% Escape Rate
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950 text-red-400 border border-red-800/40">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                {stats?.bhabhiRate ?? 0}% Bhabhi Rate
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Matches */}
        <div className="bg-charcoal-850 border border-charcoal-700/60 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-1">
          <Trophy className="w-5 h-5 text-gold-400" />
          <span className="text-2xl font-bold font-display text-cream-100">{stats?.totalGames ?? 0}</span>
          <span className="text-[11px] uppercase tracking-wider text-gray-400">Games Played</span>
        </div>

        {/* Escapes */}
        <div className="bg-charcoal-850 border border-charcoal-700/60 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-1">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-2xl font-bold font-display text-emerald-300">{stats?.totalEscapes ?? 0}</span>
          <span className="text-[11px] uppercase tracking-wider text-gray-400">Escapes</span>
        </div>

        {/* Bhabhi Losses */}
        <div className="bg-charcoal-850 border border-charcoal-700/60 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-1">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-2xl font-bold font-display text-red-400">{stats?.totalBhabhiResults ?? 0}</span>
          <span className="text-[11px] uppercase tracking-wider text-gray-400">Bhabhi Count</span>
        </div>

        {/* Thullas Given */}
        <div className="bg-charcoal-850 border border-charcoal-700/60 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-1">
          <Flame className="w-5 h-5 text-amber-400" />
          <span className="text-2xl font-bold font-display text-amber-300">{stats?.totalThullasGiven ?? 0}</span>
          <span className="text-[11px] uppercase tracking-wider text-gray-400">Thullas Given</span>
        </div>

        {/* Piles Collected */}
        <div className="bg-charcoal-850 border border-charcoal-700/60 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-1">
          <Layers className="w-5 h-5 text-blue-400" />
          <span className="text-2xl font-bold font-display text-blue-300">{stats?.totalPilesCollected ?? 0}</span>
          <span className="text-[11px] uppercase tracking-wider text-gray-400">Piles Collected</span>
        </div>

        {/* Cards Picked Up */}
        <div className="bg-charcoal-850 border border-charcoal-700/60 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-1">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          <span className="text-2xl font-bold font-display text-purple-300">{stats?.totalCardsCollected ?? 0}</span>
          <span className="text-[11px] uppercase tracking-wider text-gray-400">Cards Picked</span>
        </div>
      </div>

      {/* Match History Section */}
      <div className="bg-charcoal-850 border border-charcoal-700/80 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-charcoal-750 pb-4">
          <h2 className="text-lg font-bold font-display text-cream-100 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gold-400" />
            <span>Recent Match History</span>
          </h2>
          <span className="text-xs text-gray-400">{history.length} Matches Recorded</span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading match history...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-400 text-sm">{error}</div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="text-gray-400 text-sm">No multiplayer matches recorded yet.</div>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Create a room, invite your friends, and play to completion to record authoritative statistics.
            </p>
            <Link to="/create">
              <Button size="sm" variant="gold" className="mt-2">
                Create Room
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-charcoal-750 text-[11px] uppercase tracking-wider text-gray-400">
                  <th className="py-3 px-3">Room</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Players</th>
                  <th className="py-3 px-3">Your Result</th>
                  <th className="py-3 px-3">Bhabhi Player</th>
                  <th className="py-3 px-3 text-right">Tricks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800">
                {history.map((m) => {
                  const myResult = m.players.find((p) => p.guestId === stats?.guestIdentityId);
                  const isBhabhi = myResult?.wasBhabhi;
                  const isEscaped = myResult?.escaped;

                  return (
                    <tr key={m.matchId} className="hover:bg-charcoal-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-gold-300">
                        {m.roomCode}
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-400">
                        {new Date(m.finishedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-300">
                        {m.playerCount} Players
                      </td>
                      <td className="py-3 px-3">
                        {isBhabhi ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-950 text-red-400 border border-red-800/50">
                            BHABHI
                          </span>
                        ) : isEscaped ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                            Escaped {myResult?.escapeOrder ? `(#${myResult.escapeOrder})` : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Completed</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <AvatarBadge avatarId={m.bhabhiAvatar} size="sm" />
                          <span className="text-xs font-medium text-cream-200">
                            {m.bhabhiNickname}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-xs font-mono text-gray-300">
                        {m.totalTricks}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
