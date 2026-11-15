import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App.js';

describe('App Navigation and Home View', () => {
  it('renders landing page with title and primary actions', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /bhabhi thulla/i })).toBeInTheDocument();
    expect(screen.getByText(/the classic card game\. now online\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create room/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join room/i })).toBeInTheDocument();
  });
});
