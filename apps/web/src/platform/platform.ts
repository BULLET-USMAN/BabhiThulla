import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export const APP_VERSION = '1.0.0';
export const BUILD_NUMBER = '1';
export const APP_NAME = 'Bhabhi Thulla';
export const PACKAGE_ID = 'com.bhabhithulla.app';

export function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function isAndroidPlatform(): boolean {
  try {
    return Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
}

export function getPlatformName(): 'android' | 'ios' | 'web' {
  try {
    const p = Capacitor.getPlatform();
    if (p === 'android' || p === 'ios') return p;
    return 'web';
  } catch {
    return 'web';
  }
}

export async function initPlatformServices(): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0F141C' });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch {
    // Graceful fallback if StatusBar unavailable
  }

  try {
    await SplashScreen.hide();
  } catch {
    // Graceful fallback if SplashScreen already hidden
  }
}
