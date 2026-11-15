import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  GuestSettings,
  DEFAULT_GUEST_SETTINGS,
} from '@bhabhi/shared';
import { soundService } from '../services/sound.js';

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
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_GUEST_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to read settings from localStorage', e);
    }
    return DEFAULT_GUEST_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e);
    }

    soundService.setEnabled(settings.soundEnabled);

    // Apply reduced motion class to root
    if (settings.reducedMotion) {
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
