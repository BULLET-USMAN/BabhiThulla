import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  GuestSettings,
  DEFAULT_GUEST_SETTINGS,
} from '@bhabhi/shared';
import { audioManager } from '../audio/audioManager.js';
import { soundService } from '../services/sound.js';
import { platformStorage, hapticsService } from '../platform/index.js';

interface SettingsContextValue {
  settings: GuestSettings;
  updateSettings: (partial: Partial<GuestSettings>) => void;
  resetSettings: () => void;
}

const SETTINGS_STORAGE_KEY = 'bhabhi_guest_settings';

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<GuestSettings>(() => {
    try {
      const stored = platformStorage.getSync(SETTINGS_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_GUEST_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to read settings from storage', e);
    }
    return DEFAULT_GUEST_SETTINGS;
  });

  useEffect(() => {
    platformStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings)).catch(() => {});

    // Sync legacy sound service as well
    soundService.setEnabled(settings.soundEnabled);

    // Sync audio manager
    audioManager.updateSettings({
      masterSound: settings.soundEnabled,
      sfxEnabled: settings.sfxEnabled ?? true,
      volume: settings.volume ?? 70,
    });

    // Sync haptics service
    hapticsService.setEnabled(settings.hapticsEnabled !== false);

    // Apply reduced motion class to root
    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isReduced = settings.reducedMotion || settings.animationSpeed === 'reduced' || prefersReduced;

    if (isReduced) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  }, [settings]);

  const updateSettings = (partial: Partial<GuestSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_GUEST_SETTINGS);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
