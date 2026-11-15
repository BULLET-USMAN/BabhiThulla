import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams, useParams } from 'react-router-dom';
import { ArrowLeft, KeyRound, Sparkles } from 'lucide-react';
import { validateRoomCode } from '@bhabhi/shared';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { AvatarBadge } from '../components/ui/AvatarBadge.js';
import { useSettings } from '../context/SettingsContext.js';
import { useMultiplayer } from '../context/MultiplayerContext.js';
import { ProfileModal } from '../components/profile/ProfileModal.js';

export function JoinRoomView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { roomCode: paramCode } = useParams<{ roomCode: string }>();
  const { settings } = useSettings();
  const { joinRoom, isConnecting } = useMultiplayer();

  const initialCode = (paramCode || searchParams.get('code') || '').toUpperCase().slice(0, 6);
  const [roomCode, setRoomCode] = useState(initialCode);
  const [error, setError] = useState<string | undefined>();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    if (initialCode) {
      setRoomCode(initialCode);
    }
  }, [initialCode]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateRoomCode(roomCode);
    if (!result.valid) {
      setError(result.error);
      return;
    }

    const cleanCode = roomCode.trim().toUpperCase();
    const joinResult = await joinRoom(cleanCode, settings.nickname, settings.avatar);
    if (joinResult.success) {
      navigate(`/lobby/${cleanCode}?host=false`);
    } else {
      setError(joinResult.error || 'Failed to join room.');
    }
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
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-charcoal-700/80">
          <div>
            <h2 className="text-2xl font-bold font-display gold-gradient-text">
              Join Game Room
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Enter your friend's 6-character room code
            </p>
          </div>
          <span className="p-2.5 rounded-xl bg-felt-800 border border-felt-600 text-emerald-400">
            <KeyRound className="w-5 h-5" />
          </span>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-3.5 rounded-xl bg-charcoal-900 border border-gold-500/30 flex items-start space-x-3 text-xs text-cream-200">
          <Sparkles className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-gold-300">Live Multiplayer:</strong> Connects in real-time to your friend's private room.
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-6">
          {/* Player Identity Row */}
          <div className="flex items-center justify-between p-4 bg-charcoal-900 rounded-xl border border-charcoal-700">
            <div className="flex items-center space-x-3">
              <AvatarBadge avatarId={settings.avatar} size="md" />
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider">Joining as</p>
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

          {/* Room Code Input */}
          <div className="space-y-2">
            <Input
              label="6-Character Room Code"
              value={roomCode}
              onChange={(e) => {
                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                setRoomCode(val);
                if (error) setError(undefined);
              }}
              maxLength={6}
              placeholder="e.g. 7X9K2A"
              error={error}
              helperText="Ask the room host for their 6-character code"
              leftIcon={<KeyRound className="w-4 h-4 text-gold-400" />}
              className="text-center font-mono tracking-widest text-lg font-bold"
              required
            />
          </div>

          {/* Quick Demo Code Suggestion */}
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span>Have an invite link?</span>
            <span className="text-gray-400">Paste the 6-character code above</span>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="emerald"
            size="lg"
            disabled={isConnecting}
            fullWidth
            rightIcon={<Sparkles className="w-4 h-4" />}
          >
            {isConnecting ? 'Entering Room...' : 'Enter Room'}
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
