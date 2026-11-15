import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../context/SettingsContext.js';
import { ToastProvider } from '../context/ToastContext.js';
import { PracticeGameView } from './PracticeGameView.js';

function renderPracticeGame(initialEntries = ['/practice?players=4']) {
  return render(
    <SettingsProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <PracticeGameView />
        </MemoryRouter>
      </ToastProvider>
    </SettingsProvider>
  );
}

describe('PracticeGameView Component', () => {
  it('renders practice table with opponents and real hand', () => {
    renderPracticeGame();
    expect(screen.getByText(/practice vs bots \(4p\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play card/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /toggle game event history/i })).toBeInTheDocument();
  });

  it('renders reaction emote bar and opens on click', () => {
    renderPracticeGame();
    const emoteTrigger = screen.getByRole('button', { name: /reactions and quick chat/i });
    expect(emoteTrigger).toBeInTheDocument();

    fireEvent.click(emoteTrigger);
    expect(screen.getByText('Emotes')).toBeInTheDocument();
    expect(screen.getByText('Quick Chat')).toBeInTheDocument();
  });

  it('opens in-game settings modal when settings button is clicked', () => {
    renderPracticeGame();
    const settingsBtn = screen.getByRole('button', { name: /game settings/i });
    expect(settingsBtn).toBeInTheDocument();

    fireEvent.click(settingsBtn);
    expect(screen.getByText('Game Settings')).toBeInTheDocument();
    expect(screen.getByText(/animation speed/i)).toBeInTheDocument();
  });
});
