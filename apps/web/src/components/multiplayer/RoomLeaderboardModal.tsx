import { useEffect, useState } from 'react';
import { RotateCcw, Award } from 'lucide-react';
import { RoomLeaderboardEntry } from '@bhabhi/shared';
import { apiClient } from '../../services/apiClient.js';
import { Modal } from '../ui/Modal.js';
import { AvatarBadge } from '../ui/AvatarBadge.js';
import { Button } from '../ui/Button.js';

export interface RoomLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
}

export function RoomLeaderboardModal({ isOpen, onClose, roomCode }: RoomLeaderboardModalProps) {
  const [leaderboard, setLeaderboard] = useState<RoomLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStandings = async () => {
    if (!roomCode) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.fetchRoomLeaderboard(roomCode);
      setLeaderboard(data);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load leaderboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStandings();
    }
  }, [isOpen, roomCode]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Room ${roomCode} Standings`}
      description="Overall statistics and rankings for friends playing in this private room."
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Ranked by Escape Rate & Games Played</span>
          <Button variant="outline" size="sm" onClick={fetchStandings} disabled={isLoading}>
            <RotateCcw className={`w-3.5 h-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-gray-400">Loading standings...</div>
        ) : error ? (
          <div className="py-6 text-center text-sm text-red-400">{error}</div>
        ) : leaderboard.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            No completed matches recorded in this room yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-charcoal-750 text-[11px] uppercase tracking-wider text-gray-400">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Player</th>
                  <th className="py-2.5 px-3 text-center">Escape Rate</th>
                  <th className="py-2.5 px-3 text-center">Games</th>
                  <th className="py-2.5 px-3 text-center">Escapes</th>
                  <th className="py-2.5 px-3 text-center">Bhabhi</th>
                  <th className="py-2.5 px-3 text-right">Thullas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800">
                {leaderboard.map((entry, idx) => (
                  <tr
                    key={entry.guestId}
                    className={`hover:bg-charcoal-800/50 transition-colors ${
                      idx === 0 ? 'bg-gold-500/5' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-bold font-mono text-xs">
                      {idx === 0 ? (
                        <Award className="w-4 h-4 text-gold-400" />
                      ) : (
                        <span className="text-gray-400">#{idx + 1}</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2.5">
                        <AvatarBadge avatarId={entry.avatar} size="sm" />
                        <span className="font-medium text-cream-100">{entry.nickname}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-400">
                      {entry.escapeRate}%
                    </td>
                    <td className="py-3 px-3 text-center text-gray-300">{entry.gamesPlayed}</td>
                    <td className="py-3 px-3 text-center text-emerald-400 font-medium">
                      {entry.escapes}
                    </td>
                    <td className="py-3 px-3 text-center text-red-400 font-medium">
                      {entry.bhabhiCount}
                    </td>
                    <td className="py-3 px-3 text-right text-amber-400 font-mono font-medium">
                      {entry.thullasGiven}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button variant="gold" onClick={onClose} size="sm">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
