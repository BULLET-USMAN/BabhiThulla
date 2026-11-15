import React, { useState } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  LogOut,
  Sliders,
  Sparkles,
  Smile,
  MessageSquare,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext.js';
import { Button } from '../ui/Button.js';

export interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeaveGame: () => void;
  isMultiplayer?: boolean;
}

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({
  isOpen,
  onClose,
  onLeaveGame,
  isMultiplayer = false,
}) => {
  const { settings, updateSettings } = useSettings();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  if (!isOpen) return null;

  const handleConfirmLeave = () => {
    setShowLeaveConfirm(false);
    onClose();
    onLeaveGame();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fade-in">
      <div className="max-w-md w-full bg-charcoal-850 border border-charcoal-700/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-charcoal-700/80">
          <div className="flex items-center space-x-2.5">
            <Sliders className="w-5 h-5 text-gold-400" />
            <h3 className="text-lg font-bold font-display text-cream-100">Game Settings</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Controls */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Master Sound & SFX */}
          <div className="p-3 bg-charcoal-900 rounded-xl border border-charcoal-750 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cream-100 flex items-center space-x-2">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-500" />
                )}
                <span>Master Sound</span>
              </span>
              <button
                type="button"
                onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`text-xs px-3 py-1 rounded-lg font-bold border transition-all ${
                  settings.soundEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-charcoal-800 text-gray-400 border-charcoal-600'
                }`}
              >
                {settings.soundEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Volume Slider */}
            {settings.soundEnabled && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Volume</span>
                  <span>{settings.volume ?? 70}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.volume ?? 70}
                  onChange={(e) => updateSettings({ volume: parseInt(e.target.value, 10) })}
                  className="w-full accent-gold-500 bg-charcoal-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Animation & Motion */}
          <div className="p-3 bg-charcoal-900 rounded-xl border border-charcoal-750 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cream-100 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-gold-400" />
                <span>Animation Speed</span>
              </span>
              <div className="flex space-x-1">
                {(['normal', 'fast', 'reduced'] as const).map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() =>
                      updateSettings({
                        animationSpeed: spd,
                        reducedMotion: spd === 'reduced',
                      })
                    }
                    className={`text-[11px] px-2.5 py-1 rounded-md font-semibold border capitalize transition-all ${
                      (settings.animationSpeed ?? 'normal') === spd
                        ? 'bg-gold-500/20 text-gold-300 border-gold-500/50'
                        : 'bg-charcoal-800 text-gray-400 border-charcoal-700'
                    }`}
                  >
                    {spd}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card Size */}
          <div className="p-3 bg-charcoal-900 rounded-xl border border-charcoal-750 flex items-center justify-between">
            <span className="text-xs font-semibold text-cream-100">Card Hand Size</span>
            <div className="flex space-x-1">
              {(['compact', 'normal', 'large'] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => updateSettings({ cardSize: sz })}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-semibold border capitalize transition-all ${
                    settings.cardSize === sz
                      ? 'bg-gold-500/20 text-gold-300 border-gold-500/50'
                      : 'bg-charcoal-800 text-gray-400 border-charcoal-700'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Multiplayer Mutes */}
          <div className="p-3 bg-charcoal-900 rounded-xl border border-charcoal-750 space-y-2">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Social Reactions
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-cream-200 flex items-center space-x-2">
                <Smile className="w-3.5 h-3.5 text-gray-400" />
                <span>Mute Emotes</span>
              </span>
              <input
                type="checkbox"
                checked={settings.muteEmotes ?? false}
                onChange={(e) => updateSettings({ muteEmotes: e.target.checked })}
                className="w-4 h-4 accent-gold-500 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-cream-200 flex items-center space-x-2">
                <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                <span>Mute Quick Chat</span>
              </span>
              <input
                type="checkbox"
                checked={settings.muteQuickChat ?? false}
                onChange={(e) => updateSettings({ muteQuickChat: e.target.checked })}
                className="w-4 h-4 accent-gold-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Leave Game Section */}
        <div className="pt-2 border-t border-charcoal-700/80">
          {!showLeaveConfirm ? (
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={() => setShowLeaveConfirm(true)}
              leftIcon={<LogOut className="w-4 h-4 text-ruby-400" />}
              className="text-ruby-400 border-ruby-500/30 hover:bg-ruby-500/10"
            >
              {isMultiplayer ? 'Leave Multiplayer Match' : 'Leave Practice Match'}
            </Button>
          ) : (
            <div className="space-y-3 bg-ruby-950/40 border border-ruby-500/40 p-3 rounded-xl text-center">
              <p className="text-xs font-semibold text-ruby-300">
                Are you sure you want to leave this ongoing game?
              </p>
              <div className="flex space-x-2 justify-center">
                <Button
                  variant="gold"
                  size="sm"
                  onClick={handleConfirmLeave}
                  className="bg-ruby-600 hover:bg-ruby-500 border-ruby-500"
                >
                  Yes, Leave Game
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLeaveConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
