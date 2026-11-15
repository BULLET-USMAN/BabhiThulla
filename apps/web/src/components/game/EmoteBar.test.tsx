import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmoteBar } from './EmoteBar.js';

describe('EmoteBar Component', () => {
  it('renders trigger button and is initially collapsed', () => {
    render(<EmoteBar onSendEmote={vi.fn()} onSendQuickChat={vi.fn()} />);

    const trigger = screen.getByRole('button', { name: /reactions and quick chat/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Emotes')).not.toBeInTheDocument();
  });

  it('opens panel and allows sending an emote', () => {
    const handleSendEmote = vi.fn();
    const handleSendQuickChat = vi.fn();

    render(<EmoteBar onSendEmote={handleSendEmote} onSendQuickChat={handleSendQuickChat} />);

    const trigger = screen.getByRole('button', { name: /reactions and quick chat/i });
    fireEvent.click(trigger);

    expect(screen.getByText('Emotes')).toBeInTheDocument();
    expect(screen.getByText('Quick Chat')).toBeInTheDocument();

    // Click laughing emote
    const laughBtn = screen.getByTitle(/laugh/i);
    fireEvent.click(laughBtn);

    expect(handleSendEmote).toHaveBeenCalledWith('laugh');
    // Panel should close after selection
    expect(screen.queryByText('Emotes')).not.toBeInTheDocument();
  });

  it('switches to Quick Chat tab and sends quick chat message', () => {
    const handleSendEmote = vi.fn();
    const handleSendQuickChat = vi.fn();

    render(<EmoteBar onSendEmote={handleSendEmote} onSendQuickChat={handleSendQuickChat} />);

    fireEvent.click(screen.getByRole('button', { name: /reactions and quick chat/i }));

    const quickChatTab = screen.getByRole('button', { name: /^quick chat$/i });
    fireEvent.click(quickChatTab);

    const thullaMsg = screen.getByText('THULLA!');
    fireEvent.click(thullaMsg);

    expect(handleSendQuickChat).toHaveBeenCalledWith('thulla');
    expect(screen.queryByText('THULLA!')).not.toBeInTheDocument();
  });

  it('respects disabled prop', () => {
    render(<EmoteBar onSendEmote={vi.fn()} onSendQuickChat={vi.fn()} disabled={true} />);

    const trigger = screen.getByRole('button', { name: /reactions and quick chat/i });
    expect(trigger).toBeDisabled();

    fireEvent.click(trigger);
    expect(screen.queryByText('Emotes')).not.toBeInTheDocument();
  });
});
