import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../context/SettingsContext.js';
import { ToastProvider } from '../context/ToastContext.js';
import { GameTablePreviewView } from './GameTablePreviewView.js';

function renderTable(initialEntries = ['/table']) {
  return render(
    <SettingsProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <GameTablePreviewView />
        </MemoryRouter>
      </ToastProvider>
    </SettingsProvider>
  );
}

describe('GameTablePreviewView Component', () => {
  it('renders the game table preview with felt surface, opponents, and local player hand', () => {
    renderTable();
    expect(screen.getByText(/bhabhi thulla trick pile/i)).toBeInTheDocument();
    expect(screen.getByText(/lead suit:/i)).toBeInTheDocument();
    expect(screen.getByText(/interactive preview/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play card/i })).toBeInTheDocument();
  });

  it('allows switching layout player counts (3P, 4P, 5P, 6P)', () => {
    renderTable();
    const btn6P = screen.getByRole('button', { name: /6p/i });
    fireEvent.click(btn6P);

    // Should render 5 opponents for 6 players
    expect(screen.getAllByText('Farhan')[0]).toBeInTheDocument();
    expect(screen.getByText('Bilal')).toBeInTheDocument();
  });

  it('allows selecting and playing a card to the trick pile', () => {
    renderTable();
    const playBtn = screen.getByRole('button', { name: /play card/i });

    // Initial selected card is Ace of Spades
    expect(playBtn).not.toBeDisabled();
    fireEvent.click(playBtn);

    // Card played notification and update
    expect(screen.getAllByText(/you/i)[0]).toBeInTheDocument();
  });
});
