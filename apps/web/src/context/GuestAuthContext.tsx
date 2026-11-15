import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AvatarId } from '@bhabhi/shared';
import { apiClient } from '../services/apiClient.js';
import { useSettings } from './SettingsContext.js';

const GUEST_STORAGE_KEY = 'bhabhi_guest_identity';

export interface StoredGuestIdentity {
  guestId: string;
  sessionToken: string;
  displayName: string;
  avatarId: AvatarId;
}

interface GuestAuthContextValue {
  guestId: string | null;
  sessionToken: string | null;
  isRegistered: boolean;
  ensureGuestIdentity: () => Promise<StoredGuestIdentity>;
  updateGuestProfile: (name: string, avatar: AvatarId) => Promise<void>;
}

const GuestAuthContext = createContext<GuestAuthContextValue | undefined>(undefined);

export const GuestAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, updateSettings } = useSettings();
  const [identity, setIdentity] = useState<StoredGuestIdentity | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(GUEST_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const saveIdentity = useCallback((idData: StoredGuestIdentity | null) => {
    setIdentity(idData);
    if (typeof window === 'undefined') return;
    if (idData) {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(idData));
    } else {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    }
  }, []);

  const ensureGuestIdentity = useCallback(async (): Promise<StoredGuestIdentity> => {
    if (identity?.guestId && identity.sessionToken) {
      // Validate session token with backend
      try {
        const verified = await apiClient.fetchGuestProfile(identity.guestId, identity.sessionToken);
        if (verified.displayName !== settings.nickname || verified.avatarId !== settings.avatar) {
          // Sync if local settings changed
          const res = await apiClient.registerGuest(
            settings.nickname,
            settings.avatar,
            identity.guestId
          );
          const updated: StoredGuestIdentity = {
            guestId: res.guest.id,
            sessionToken: res.sessionToken,
            displayName: res.guest.displayName,
            avatarId: res.guest.avatarId,
          };
          saveIdentity(updated);
          return updated;
        }
        return identity;
      } catch {
        // Expired/invalid session, re-register below
      }
    }

    // Register fresh identity
    const res = await apiClient.registerGuest(
      settings.nickname || 'Player',
      settings.avatar || 'avatar-1',
      identity?.guestId
    );

    const newIdentity: StoredGuestIdentity = {
      guestId: res.guest.id,
      sessionToken: res.sessionToken,
      displayName: res.guest.displayName,
      avatarId: res.guest.avatarId,
    };

    saveIdentity(newIdentity);
    return newIdentity;
  }, [identity, settings.nickname, settings.avatar, saveIdentity]);

  const updateGuestProfile = useCallback(
    async (name: string, avatar: AvatarId) => {
      updateSettings({ nickname: name, avatar });
      try {
        const res = await apiClient.registerGuest(name, avatar, identity?.guestId);
        saveIdentity({
          guestId: res.guest.id,
          sessionToken: res.sessionToken,
          displayName: res.guest.displayName,
          avatarId: res.guest.avatarId,
        });
      } catch (err) {
        console.warn('Failed to sync guest profile with backend', err);
      }
    },
    [identity?.guestId, updateSettings, saveIdentity]
  );

  // Initial validation / registration on boot
  useEffect(() => {
    ensureGuestIdentity().catch((err) => {
      console.warn('Could not register guest identity on startup (server may be offline):', err);
    });
  }, [ensureGuestIdentity]);

  return (
    <GuestAuthContext.Provider
      value={{
        guestId: identity?.guestId || null,
        sessionToken: identity?.sessionToken || null,
        isRegistered: !!identity?.guestId,
        ensureGuestIdentity,
        updateGuestProfile,
      }}
    >
      {children}
    </GuestAuthContext.Provider>
  );
};

export function useGuestAuth() {
  const context = useContext(GuestAuthContext);
  if (!context) {
    throw new Error('useGuestAuth must be used within a GuestAuthProvider');
  }
  return context;
}
