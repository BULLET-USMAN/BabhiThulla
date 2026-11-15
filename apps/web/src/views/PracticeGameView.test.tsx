import { render, screen } from '@testing-library/react';
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
});
