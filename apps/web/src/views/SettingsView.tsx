import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Eye,
  Sliders,
  RotateCcw,
  Sparkles,
  Save,
  Vibrate,
  Smile,
  MessageSquareOff,
  Smartphone,
} from 'lucide-react';
import {
  AvatarId,
  AVAILABLE_AVATARS,
  validateNickname,
} from '@bhabhi/shared';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { PlayingCard } from '../components/cards/PlayingCard.js';
import { useSettings } from '../context/SettingsContext.js';
import { useToast } from '../context/ToastContext.js';
import { soundService } from '../services/sound.js';
import {
  hapticsService,
  lifecycleManager,
  APP_VERSION,
  BUILD_NUMBER,
  getPlatformName,
} from '../platform/index.js';

export function SettingsView() {
  const navigate = useNavigate();
  const { settings, updateSettings, resetSettings } = useSettings();
  const { showToast } = useToast();

  useEffect(() => {
    const unbind = lifecycleManager.registerBackHandler(10, () => {
      navigate('/');
      return true;
    });
    return unbind;
  }, [navigate]);

  const [nickname, setNickname] = useState(settings.nickname);
  const [nicknameError, setNicknameError] = useState<string | undefined>();
  const [avatar, setAvatar] = useState<AvatarId>(settings.avatar);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateNickname(nickname);
    if (!result.valid) {
      setNicknameError(result.error);
      return;
    }
    const clean = nickname.trim();
    updateSettings({ nickname: clean, avatar });
    setNicknameError(undefined);
    showToast('Profile saved successfully!', 'success');
  };

  const handleToggleSound = (enabled: boolean) => {
    updateSettings({ soundEnabled: enabled });
    if (enabled) {
      soundService.setEnabled(true);
      soundService.playCardSelect();
      showToast('Sound effects enabled', 'success');
    } else {
      soundService.setEnabled(false);
      showToast('Sound effects muted', 'info');
    }
  };

  const handleToggleReducedMotion = (enabled: boolean) => {
    updateSettings({ reducedMotion: enabled });
    showToast(
      enabled ? 'Reduced animations activated' : 'Full animations restored',
      'info'
    );
  };

  const handleCardSizeChange = (size: 'compact' | 'normal' | 'large') => {
    updateSettings({ cardSize: size });
    showToast(`Card display size set to ${size}`, 'info');
  };

  const handleReset = () => {
    resetSettings();
    setNickname('Player');
    setAvatar('avatar-1');
    setNicknameError(undefined);
    showToast('Settings reset to factory defaults', 'info');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Back Link */}
      <Link
        to="/"
        className="inline-flex items-center space-x-2 text-sm text-gray-400 hover:text-gold-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display gold-gradient-text">
          Game Settings
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Customize your sound, accessibility, card sizing, and guest profile
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-charcoal-850 border border-charcoal-700/80 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-charcoal-700">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-gold-400" />
            <h2 className="text-base font-bold text-cream-100 font-display">
              Guest Identity
            </h2>
          </div>
          <span className="text-[11px] text-gray-400">Stored locally in browser</span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Avatar Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-cream-200 uppercase tracking-wide">
              Select Avatar
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
              {AVAILABLE_AVATARS.map((av) => (
                <button
                  type="button"
                  key={av.id}
                  onClick={() => setAvatar(av.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                    avatar === av.id
                      ? 'border-gold-500 bg-gold-500/10 ring-2 ring-gold-500/50 scale-105'
                      : 'border-charcoal-700 bg-charcoal-900/60 hover:border-gray-500'
                  }`}
                  title={av.label}
                >
                  <span className="text-2xl mb-1">{av.emoji}</span>
                  <span className="text-[9px] text-gray-300 truncate max-w-full">
                    {av.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Nickname Input */}
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="flex-1 w-full">
              <Input
                label="Player Nickname (2-20 characters)"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  if (nicknameError) setNicknameError(undefined);
                }}
                maxLength={20}
                error={nicknameError}
                placeholder="Enter nickname"
                required
              />
            </div>
            <Button
              type="submit"
              variant="gold"
              size="md"
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Profile
            </Button>
          </div>
        </form>
      </div>

      {/* Audio & Visual Accessibility Section */}
      <div className="bg-charcoal-850 border border-charcoal-700/80 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center space-x-2 pb-4 border-b border-charcoal-700">
          <Volume2 className="w-5 h-5 text-gold-400" />
          <h2 className="text-base font-bold text-cream-100 font-display">
            Audio & Accessibility
          </h2>
        </div>

        <div className="space-y-4">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between p-4 bg-charcoal-900 rounded-xl border border-charcoal-700">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-charcoal-800 text-gold-400 border border-charcoal-700">
                {settings.soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-gray-500" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-cream-100">Sound Effects</p>
                <p className="text-xs text-gray-400">Play card slaps, trick collection, and Thulla alerts</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Toggle Sound Effects"
              onClick={() => handleToggleSound(!settings.soundEnabled)}
              className={`text-xs px-4 py-2 rounded-xl font-bold border transition-all ${
                settings.soundEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-charcoal-800 text-gray-400 border-charcoal-600'
              }`}
            >
              {settings.soundEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Reduced Motion Toggle */}
          <div className="flex items-center justify-between p-4 bg-charcoal-900 rounded-xl border border-charcoal-700">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-charcoal-800 text-gold-400 border border-charcoal-700">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-cream-100">Reduced Motion</p>
                <p className="text-xs text-gray-400">Eliminate card elevation springs and table transitions</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Toggle Reduced Motion"
              onClick={() => handleToggleReducedMotion(!settings.reducedMotion)}
              className={`text-xs px-4 py-2 rounded-xl font-bold border transition-all ${
                settings.reducedMotion
                  ? 'bg-gold-500/20 text-gold-300 border-gold-500/40'
                  : 'bg-charcoal-800 text-gray-400 border-charcoal-600'
              }`}
            >
              {settings.reducedMotion ? 'On' : 'Off'}
            </button>
          </div>

          {/* Card Size Selector */}
          <div className="p-4 bg-charcoal-900 rounded-xl border border-charcoal-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-cream-100">Card Display Sizing</p>
                <p className="text-xs text-gray-400">Choose your preferred card scale on the game table</p>
              </div>
              <span className="text-xs font-bold text-gold-400 uppercase font-mono">
                {settings.cardSize}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(['compact', 'normal', 'large'] as const).map((size) => (
                <button
                  type="button"
                  key={size}
                  onClick={() => handleCardSizeChange(size)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all ${
                    settings.cardSize === size
                      ? 'bg-felt-800 border-gold-500 text-gold-300 shadow-sm ring-1 ring-gold-500'
                      : 'bg-charcoal-800 border-charcoal-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* Live Size Preview Sample */}
            <div className="pt-2 flex items-center justify-center bg-felt-950/40 p-4 rounded-xl border border-charcoal-800">
              <PlayingCard
                suit="spades"
                rank="A"
                size={settings.cardSize === 'compact' ? 'sm' : settings.cardSize === 'large' ? 'lg' : 'md'}
                isSelected
              />
            </div>
          </div>

          {/* Haptic Feedback Toggle */}
          <div className="flex items-center justify-between p-4 bg-charcoal-900 rounded-xl border border-charcoal-700">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-charcoal-800 text-gold-400 border border-charcoal-700">
                <Vibrate className="w-5 h-5 text-gold-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-cream-100">Haptic Vibration</p>
                <p className="text-xs text-gray-400">Subtle tactile pulses on card selection, play, and Thulla</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Toggle Haptic Vibration"
              onClick={() => {
                const next = settings.hapticsEnabled === false;
                updateSettings({ hapticsEnabled: next });
                hapticsService.setEnabled(next);
                if (next) hapticsService.cardPlay();
                showToast(next ? 'Haptic feedback enabled' : 'Haptic feedback disabled', 'info');
              }}
              className={`text-xs px-4 py-2 rounded-xl font-bold border transition-all ${
                settings.hapticsEnabled !== false
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-charcoal-800 text-gray-400 border-charcoal-600'
              }`}
            >
              {settings.hapticsEnabled !== false ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Volume Control */}
          <div className="p-4 bg-charcoal-900 rounded-xl border border-charcoal-700 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-charcoal-800 text-gold-400 border border-charcoal-700">
                  <Volume2 className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-cream-100">Master Volume</p>
                  <p className="text-xs text-gray-400">Adjust sound effects and game audio level</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-gold-400">
                {settings.volume ?? 70}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.volume ?? 70}
              onChange={(e) => {
                const vol = parseInt(e.target.value, 10);
                updateSettings({ volume: vol });
              }}
              className="w-full accent-gold-500 cursor-pointer h-2 bg-charcoal-800 rounded-lg appearance-none"
            />
          </div>

          {/* Emotes & Quick Chat Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-4 bg-charcoal-900 rounded-xl border border-charcoal-700">
              <div className="flex items-center space-x-2.5">
                <Smile className="w-4 h-4 text-gold-400" />
                <span className="text-xs font-semibold text-cream-100">Player Emotes</span>
              </div>
              <button
                type="button"
                aria-label="Toggle Player Emotes"
                onClick={() => {
                  const next = !settings.muteEmotes;
                  updateSettings({ muteEmotes: next });
                  showToast(next ? 'Player emotes muted' : 'Player emotes unmuted', 'info');
                }}
                className={`text-[11px] px-3 py-1.5 rounded-lg font-bold border transition-all ${
                  settings.muteEmotes
                    ? 'bg-ruby-500/20 text-ruby-300 border-ruby-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {settings.muteEmotes ? 'Muted' : 'Visible'}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-charcoal-900 rounded-xl border border-charcoal-700">
              <div className="flex items-center space-x-2.5">
                <MessageSquareOff className="w-4 h-4 text-gold-400" />
                <span className="text-xs font-semibold text-cream-100">Quick Chat</span>
              </div>
              <button
                type="button"
                aria-label="Toggle Quick Chat"
                onClick={() => {
                  const next = !settings.muteQuickChat;
                  updateSettings({ muteQuickChat: next });
                  showToast(next ? 'Quick chat muted' : 'Quick chat unmuted', 'info');
                }}
                className={`text-[11px] px-3 py-1.5 rounded-lg font-bold border transition-all ${
                  settings.muteQuickChat
                    ? 'bg-ruby-500/20 text-ruby-300 border-ruby-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {settings.muteQuickChat ? 'Muted' : 'Visible'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* App & Platform Info */}
      <div className="p-4 bg-charcoal-850/80 rounded-2xl border border-charcoal-700/60 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-2">
          <Smartphone className="w-4 h-4 text-gold-400" />
          <span>Bhabhi Thulla Mobile & Web</span>
        </div>
        <div className="flex items-center space-x-2 font-mono">
          <span className="capitalize px-2 py-0.5 rounded bg-charcoal-800 text-gold-300 border border-charcoal-700">
            {getPlatformName()}
          </span>
          <span>v{APP_VERSION} (Build {BUILD_NUMBER})</span>
        </div>
      </div>

      {/* Reset Defaults */}
      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center space-x-1.5 text-xs text-gray-400 hover:text-ruby-400 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All to Defaults</span>
        </button>

        <Link to="/table">
          <Button variant="emerald" size="sm" rightIcon={<Sparkles className="w-4 h-4" />}>
            Open Game Table
          </Button>
        </Link>
      </div>
    </div>
  );
}
