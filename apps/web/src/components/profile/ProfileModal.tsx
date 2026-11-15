import React, { useState } from 'react';
import {
  AvatarId,
  AVAILABLE_AVATARS,
  validateNickname,
} from '@bhabhi/shared';
import { Modal } from '../ui/Modal.js';
import { Input } from '../ui/Input.js';
import { Button } from '../ui/Button.js';
import { AvatarBadge } from '../ui/AvatarBadge.js';
import { useSettings } from '../../context/SettingsContext.js';
import { useToast } from '../../context/ToastContext.js';

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { settings, updateSettings } = useSettings();
  const { showToast } = useToast();

  const [nickname, setNickname] = useState(settings.nickname);
  const [avatar, setAvatar] = useState<AvatarId>(settings.avatar);
  const [error, setError] = useState<string | undefined>();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateNickname(nickname);
    if (!result.valid) {
      setError(result.error);
      return;
    }

    const trimmed = nickname.trim();
    updateSettings({ nickname: trimmed, avatar });
    setError(undefined);
    showToast('Profile updated successfully!', 'success');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Guest Profile"
      description="Choose your table name and avatar. Stored locally on this device."
      maxWidth="md"
    >
      <form onSubmit={handleSave} className="space-y-6">
        {/* Current Avatar Showcase */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <AvatarBadge avatarId={avatar} size="xl" />
          <span className="text-xs text-gold-400 font-medium">Selected Avatar</span>
        </div>

        {/* Avatar Picker Grid */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-cream-200 uppercase tracking-wide">
            Select Avatar
          </label>
          <div className="grid grid-cols-4 gap-3">
            {AVAILABLE_AVATARS.map((av) => (
              <button
                type="button"
                key={av.id}
                onClick={() => setAvatar(av.id)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                  avatar === av.id
                    ? 'border-gold-500 bg-gold-500/10 shadow-gold-glow scale-105'
                    : 'border-charcoal-700 bg-charcoal-900/60 hover:border-gray-500'
                }`}
              >
                <span className="text-2xl mb-1">{av.emoji}</span>
                <span className="text-[10px] text-gray-300 truncate max-w-full">
                  {av.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Nickname Input */}
        <Input
          label="Nickname (2-20 characters)"
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value);
            if (error) setError(undefined);
          }}
          maxLength={20}
          error={error}
          placeholder="e.g. SultanOfSpades"
          required
        />

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-charcoal-700">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="gold">
            Save Profile
          </Button>
        </div>
      </form>
    </Modal>
  );
}
