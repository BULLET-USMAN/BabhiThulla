import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SettingsProvider } from '../context/SettingsContext.js';
import { ToastProvider } from '../context/ToastContext.js';
import { CreateRoomView } from './CreateRoomView.js';
import { JoinRoomView } from './JoinRoomView.js';
import { LobbyView } from './LobbyView.js';

describe('Create, Join & Lobby Views', () => {
  it('renders CreateRoomView with player count options and preview notice', () => {
    render(
      <SettingsProvider>
        <ToastProvider>
          <MemoryRouter>
            <CreateRoomView />
          </MemoryRouter>
        </ToastProvider>
      </SettingsProvider>
    );

    expect(screen.getByText(/create game room/i)).toBeInTheDocument();
    expect(screen.getByText(/player count/i)).toBeInTheDocument();
    expect(screen.getByText(/private room/i)).toBeInTheDocument();
  });

  it('validates 6-character room codes in JoinRoomView', () => {
    render(
      <SettingsProvider>
        <ToastProvider>
          <MemoryRouter>
            <JoinRoomView />
          </MemoryRouter>
        </ToastProvider>
      </SettingsProvider>
    );

    const input = screen.getByPlaceholderText(/e\.g\. 7x9k2a/i);
    const submitBtn = screen.getByRole('button', { name: /enter room/i });

    // Enter invalid short code
    fireEvent.change(input, { target: { value: 'AB' } });
    fireEvent.click(submitBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/must be exactly 6 characters/i);
  });

  it('renders LobbyView with room code, player slots, and launch button', () => {
    render(
      <SettingsProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={['/lobby/TEST99?host=true&players=4']}>
            <Routes>
              <Route path="/lobby/:roomCode" element={<LobbyView />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </SettingsProvider>
    );

    expect(screen.getByText('TEST99')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy invite link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /launch table preview/i })).toBeInTheDocument();
  });
});
