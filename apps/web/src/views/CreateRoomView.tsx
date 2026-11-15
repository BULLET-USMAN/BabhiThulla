import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Lock, Users, Sparkles } from 'lucide-react';
import {
  generateMockRoomCode,
  MIN_PLAYERS,
  MAX_PLAYERS,
  DEFAULT_PLAYERS,
} from '@bhabhi/shared';
import { Button } from '../components/ui/Button.js';
import { AvatarBadge } from '../components/ui/AvatarBadge.js';
import { useSettings } from '../context/SettingsContext.js';
import { ProfileModal } from '../components/profile/ProfileModal.js';

export function CreateRoomView() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [maxPlayers, setMaxPlayers] = useState<number>(DEFAULT_PLAYERS);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    // In Phase 1 preview, generate mock room code and navigate to Lobby preview
    const mockCode = generateMockRoomCode();
    navigate(`/lobby/${mockCode}?host=true&players=${maxPlayers}`);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center space-x-2 text-sm text-gray-400 hover:text-gold-300 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      {/* Main Card */}
      <div className="bg-charcoal-850 border border-charcoal-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-charcoal-700/80">
          <div>
            <h2 className="text-2xl font-bold font-display gold-gradient-text">
              Create Game Room
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Configure your private table for friends
            </p>
          </div>
          <span className="p-2.5 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-400">
            <Lock className="w-5 h-5" />
          </span>
        </div>

        {/* Preview Notice Banner */}
        <div className="mb-6 p-3.5 rounded-xl bg-charcoal-900 border border-gold-500/30 flex items-start space-x-3 text-xs text-cream-200">
          <Sparkles className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-gold-300">Phase 1 Preview Mode:</strong> Creating a room launches a local offline lobby simulation with mock seats. Real multiplayer networking connects in Phase 2.
          </div>
        </div>

        <form onSubmit={handleCreateRoom} className="space-y-6">
          {/* Player Identity Row */}
          <div className="flex items-center justify-between p-4 bg-charcoal-900 rounded-xl border border-charcoal-700">
            <div className="flex items-center space-x-3">
              <AvatarBadge avatarId={settings.avatar} size="md" />
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider">Host Nickname</p>
                <p className="text-base font-semibold text-cream-100">{settings.nickname}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsProfileModalOpen(true)}
            >
              Change
            </Button>
          </div>

          {/* Number of Players */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-cream-200 uppercase tracking-wide flex items-center justify-between">
              <span>Player Count</span>
              <span className="text-gold-400 font-semibold">{maxPlayers} Players</span>
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i).map(
                (count) => (
                  <button
                    type="button"
                    key={count}
                    onClick={() => setMaxPlayers(count)}
                    className={`py-3 px-2 rounded-xl text-sm font-semibold border flex flex-col items-center justify-center transition-all ${
                      maxPlayers === count
                        ? 'bg-felt-800 border-gold-500 text-gold-300 shadow-md ring-1 ring-gold-500'
                        : 'bg-charcoal-900 border-charcoal-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <Users className="w-4 h-4 mb-1" />
                    <span>{count}</span>
                  </button>
                )
              )}
            </div>
            <p className="text-[11px] text-gray-400">
              Traditional Bhabhi Thulla is played with 3 to 6 players (default: 4).
            </p>
          </div>

          {/* Room Visibility Indicator */}
          <div className="flex items-center justify-between p-3.5 bg-charcoal-900/60 rounded-xl border border-charcoal-700/60">
            <div className="flex items-center space-x-2.5">
              <Lock className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-medium text-cream-100">Private Room</p>
                <p className="text-[11px] text-gray-400">
                  Only players with the 6-character room code or link can join.
                </p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full font-medium">
              Private
            </span>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="gold"
            size="lg"
            fullWidth
            rightIcon={<Sparkles className="w-4 h-4" />}
          >
            Create Room (Preview)
          </Button>
        </form>
      </div>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
