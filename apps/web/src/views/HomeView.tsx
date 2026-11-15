import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Users, BookOpen, Settings, ShieldCheck, Sparkles, Bot } from 'lucide-react';
import { PlayingCard } from '../components/cards/PlayingCard.js';
import { Button } from '../components/ui/Button.js';
import { useSettings } from '../context/SettingsContext.js';
import { AvatarBadge } from '../components/ui/AvatarBadge.js';
import { PracticeSetupModal } from '../components/game/PracticeSetupModal.js';

export function HomeView() {
  const { settings } = useSettings();
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden">
      {/* Subtle Background Watermarks */}
      <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-around select-none">
        <span className="text-9xl font-serif">♠</span>
        <span className="text-9xl font-serif">♥</span>
        <span className="text-9xl font-serif">♦</span>
        <span className="text-9xl font-serif">♣</span>
      </div>

      {/* Main Hero Container */}
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-16 w-full flex flex-col items-center text-center z-10">
        {/* Phase 1 Preview Banner */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
          <span>Phase 1 Architecture & Design System Preview</span>
        </div>

        {/* Title & Tagline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight font-display mb-4">
          <span className="gold-gradient-text">BHABHI THULLA</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 max-w-xl mx-auto font-light mb-8">
          The Classic Card Game. Now Online.
        </p>

        {/* Guest Profile Welcome */}
        <div className="flex items-center space-x-3 bg-charcoal-850/80 border border-charcoal-700/80 rounded-2xl px-4 py-2.5 mb-10 shadow-lg">
          <AvatarBadge avatarId={settings.avatar} size="sm" />
          <div className="text-left">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider">Playing as</p>
            <p className="text-sm font-semibold text-cream-100">{settings.nickname}</p>
          </div>
          <Link
            to="/settings"
            className="text-xs text-gold-400 hover:text-gold-300 underline ml-2"
          >
            Edit
          </Link>
        </div>

        {/* Visual Card Showcase (Fan of Spades) */}
        <div className="relative h-44 sm:h-52 w-64 sm:w-80 flex items-center justify-center mb-10 select-none">
          {/* Queen of Spades */}
          <div className="absolute -left-2 transform -rotate-15 hover:rotate-0 transition-transform duration-300 z-10">
            <PlayingCard suit="spades" rank="Q" size="md" />
          </div>
          {/* Ace of Spades (Centerpiece with Gold Glow) */}
          <div className="absolute z-30 transform hover:scale-105 transition-transform duration-300 shadow-gold-glow">
            <PlayingCard suit="spades" rank="A" size="md" isHighlighted />
          </div>
          {/* King of Spades */}
          <div className="absolute -right-2 transform rotate-15 hover:rotate-0 transition-transform duration-300 z-20">
            <PlayingCard suit="spades" rank="K" size="md" />
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col items-center justify-center gap-3.5 w-full max-w-md mb-8">
          <Button
            variant="gold"
            size="lg"
            fullWidth
            onClick={() => setIsPracticeModalOpen(true)}
            leftIcon={<Bot className="w-5 h-5" />}
            className="shadow-gold-glow text-base"
          >
            Play vs Bots (Practice)
          </Button>

          <div className="grid grid-cols-2 gap-3 w-full">
            <Link to="/create" className="w-full">
              <Button
                variant="emerald"
                size="md"
                fullWidth
                leftIcon={<Play className="w-4 h-4 fill-current" />}
              >
                Create Room
              </Button>
            </Link>
            <Link to="/join" className="w-full">
              <Button
                variant="outline"
                size="md"
                fullWidth
                leftIcon={<Users className="w-4 h-4" />}
              >
                Join Room
              </Button>
            </Link>
          </div>
        </div>

        {/* Secondary Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/table">
            <Button variant="outline" size="sm" leftIcon={<Sparkles className="w-4 h-4 text-gold-400" />}>
              Table Preview
            </Button>
          </Link>
          <Link to="/rules">
            <Button variant="outline" size="sm" leftIcon={<BookOpen className="w-4 h-4 text-gray-400" />}>
              How to Play
            </Button>
          </Link>
          <Link to="/settings">
            <Button variant="outline" size="sm" leftIcon={<Settings className="w-4 h-4 text-gray-400" />}>
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer Notice & Security Disclaimer */}
      <footer className="w-full border-t border-charcoal-800 bg-charcoal-950/60 py-4 px-4 text-center z-10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-2">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-gold-500" />
            <span>Server-Authoritative • Private 3–6 Player Rooms</span>
          </div>
          <p className="text-[11px] text-gray-400">
            Phase 1: Visual Design & Table Engine Preview • Live Multiplayer in Phase 2
          </p>
        </div>
      </footer>
      {/* Practice Setup Modal */}
      <PracticeSetupModal
        isOpen={isPracticeModalOpen}
        onClose={() => setIsPracticeModalOpen(false)}
      />
    </div>
  );
}
