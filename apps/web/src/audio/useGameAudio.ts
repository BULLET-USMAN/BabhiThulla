import { useSettings } from '../context/SettingsContext.js';
import { audioManager } from './audioManager.js';
import { useEffect } from 'react';

export function useGameAudio() {
  const { settings } = useSettings();

  useEffect(() => {
    audioManager.updateSettings({
      masterSound: settings.soundEnabled ?? true,
      sfxEnabled: settings.sfxEnabled ?? true,
      volume: settings.volume ?? 70,
    });
  }, [settings.soundEnabled, settings.sfxEnabled, settings.volume]);

  return audioManager;
}
