import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Play } from 'lucide-react';
import { MIN_PLAYERS, MAX_PLAYERS, DEFAULT_PLAYERS } from '@bhabhi/shared';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { AvatarBadge } from '../ui/AvatarBadge.js';
import { useSettings } from '../../context/SettingsContext.js';

export interface PracticeSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PracticeSetupModal({ isOpen, onClose }: PracticeSetupModalProps) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [playerCount, setPlayerCount] = useState<number>(DEFAULT_PLAYERS);

  const handleStart = () => {
    onClose();
    navigate(`/practice?players=${playerCount}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Play vs Bots (Practice Mode)"
      description="Play offline against computer-controlled opponents."
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Guest Profile Preview */}
        <div className="flex items-center justify-between p-3.5 bg-charcoal-900 rounded-xl border border-charcoal-700">
          <div className="flex items-center space-x-3">
            <AvatarBadge avatarId={settings.avatar} size="sm" />
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Human Player</p>
              <p className="text-sm font-semibold text-cream-100">{settings.nickname}</p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-gold-500/10 text-gold-300 border border-gold-500/30 font-medium">
            Offline Practice
          </span>
        </div>

        {/* Player Count Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-cream-200 uppercase tracking-wide flex items-center justify-between">
            <span>Select Table Size</span>
            <span className="text-gold-400 font-semibold">{playerCount} Players (1 You + {playerCount - 1} Bots)</span>
          </label>
          <div className="grid grid-cols-4 gap-2.5">
            {Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i).map(
              (count) => (
                <button
                  type="button"
                  key={count}
                  onClick={() => setPlayerCount(count)}
                  className={`py-3 px-2 rounded-xl text-sm font-semibold border flex flex-col items-center justify-center transition-all ${
                    playerCount === count
                      ? 'bg-felt-800 border-gold-500 text-gold-300 shadow-md ring-1 ring-gold-500'
                      : 'bg-charcoal-900 border-charcoal-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <Users className="w-4 h-4 mb-1" />
                  <span>{count}P</span>
                </button>
              )
            )}
          </div>
          <p className="text-[11px] text-gray-400">
            Hand sizes: {playerCount === 3 ? '18, 17, 17' : playerCount === 4 ? '13 each' : playerCount === 5 ? '11, 11, 10, 10, 10' : '9, 9, 9, 9, 8, 8'}.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-end space-x-3 border-t border-charcoal-700">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="gold"
            size="md"
            onClick={handleStart}
            leftIcon={<Play className="w-4 h-4 fill-current" />}
          >
            Start Practice Match
          </Button>
        </div>
      </div>
    </Modal>
  );
}
