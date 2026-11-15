import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../context/SettingsContext.js';
import { ToastProvider } from '../context/ToastContext.js';
import { SettingsView } from './SettingsView.js';

function renderSettings() {
  return render(
    <SettingsProvider>
      <ToastProvider>
        <MemoryRouter>
          <SettingsView />
        </MemoryRouter>
      </ToastProvider>
    </SettingsProvider>
  );
}

describe('SettingsView Component', () => {
  it('renders guest identity and sound controls', () => {
    renderSettings();
    expect(screen.getByText(/game settings/i)).toBeInTheDocument();
    expect(screen.getByText(/guest identity/i)).toBeInTheDocument();
    expect(screen.getByText(/sound effects/i)).toBeInTheDocument();
  });

  it('allows toggling sound effects and persists state', () => {
    renderSettings();
    const soundButton = screen.getByRole('button', { name: /enabled/i });
    expect(soundButton).toBeInTheDocument();

    fireEvent.click(soundButton);
    expect(screen.getByRole('button', { name: /disabled/i })).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem('bhabhi_guest_settings') || '{}');
    expect(stored.soundEnabled).toBe(false);
  });

  it('allows changing card display sizing', () => {
    renderSettings();
    const compactBtn = screen.getByRole('button', { name: /compact/i });
    fireEvent.click(compactBtn);

    const stored = JSON.parse(localStorage.getItem('bhabhi_guest_settings') || '{}');
    expect(stored.cardSize).toBe('compact');
  });
});
