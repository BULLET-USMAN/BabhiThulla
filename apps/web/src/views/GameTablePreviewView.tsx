import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  LogOut,
  Settings as SettingsIcon,
  HelpCircle,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  Card,
  Suit,
  DEFAULT_PLAYERS,
} from '@bhabhi/shared';
import { PlayingCard } from '../components/cards/PlayingCard.js';
import { CardHand } from '../components/cards/CardHand.js';
import { CardBack } from '../components/cards/CardBack.js';
import { AvatarBadge } from '../components/ui/AvatarBadge.js';
import { StatusBadge } from '../components/ui/StatusBadge.js';
import { SuitIcon } from '../components/cards/SuitIcon.js';
import { useSettings } from '../context/SettingsContext.js';
import { soundService } from '../services/sound.js';
import { useToast } from '../context/ToastContext.js';
import { Modal } from '../components/ui/Modal.js';
import { Button } from '../components/ui/Button.js';

// Initial sample hand for player in preview mode (13 cards standard deal)
const INITIAL_PLAYER_HAND: Card[] = [
  { id: 'spades-A', suit: 'spades', rank: 'A' },
  { id: 'spades-K', suit: 'spades', rank: 'K' },
  { id: 'spades-10', suit: 'spades', rank: '10' },
  { id: 'spades-4', suit: 'spades', rank: '4' },
  { id: 'hearts-Q', suit: 'hearts', rank: 'Q' },
  { id: 'hearts-J', suit: 'hearts', rank: 'J' },
  { id: 'hearts-7', suit: 'hearts', rank: '7' },
  { id: 'hearts-2', suit: 'hearts', rank: '2' },
  { id: 'diamonds-K', suit: 'diamonds', rank: 'K' },
  { id: 'diamonds-9', suit: 'diamonds', rank: '9' },
  { id: 'diamonds-3', suit: 'diamonds', rank: '3' },
  { id: 'clubs-A', suit: 'clubs', rank: 'A' },
  { id: 'clubs-8', suit: 'clubs', rank: '8' },
];

interface TrickCard {
  card: Card;
  playedBy: string;
  rotation: number;
}

export function GameTablePreviewView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const { showToast } = useToast();

  const initialPlayerCount = parseInt(searchParams.get('players') || `${DEFAULT_PLAYERS}`, 10);
  const [playerCount, setPlayerCount] = useState<number>(
    Math.min(6, Math.max(3, initialPlayerCount))
  );

  const [hand, setHand] = useState<Card[]>(INITIAL_PLAYER_HAND);
  const [selectedCardId, setSelectedCardId] = useState<string | null>('spades-A');
  const [leadSuit, setLeadSuit] = useState<Suit>('spades');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Current active trick pile cards
  const [trickPile, setTrickPile] = useState<TrickCard[]>([
    {
      card: { id: 'spades-7', suit: 'spades', rank: '7' },
      playedBy: 'Farhan',
      rotation: -12,
    },
    {
      card: { id: 'spades-K', suit: 'spades', rank: 'K' },
      playedBy: 'Zainab',
      rotation: 8,
    },
  ]);

  // Turn tracking for demo
  const [activeTurnSeat, setActiveTurnSeat] = useState<number>(0); // 0 = local player

  // Opponents definitions depending on player count (1 to 5 opponents)
  const allOpponents = [
    { id: 'p2', name: 'Farhan', avatar: 'avatar-2' as const, cards: 12, seat: 1 },
    { id: 'p3', name: 'Zainab', avatar: 'avatar-4' as const, cards: 12, seat: 2 },
    { id: 'p4', name: 'Hamza', avatar: 'avatar-5' as const, cards: 13, seat: 3 },
    { id: 'p5', name: 'Ayesha', avatar: 'avatar-7' as const, cards: 10, seat: 4 },
    { id: 'p6', name: 'Bilal', avatar: 'avatar-8' as const, cards: 11, seat: 5 },
  ];

  const opponents = allOpponents.slice(0, playerCount - 1);

  const handleSelectCard = (card: Card) => {
    setSelectedCardId(card.id === selectedCardId ? null : card.id);
  };

  const handlePlaySelectedCard = () => {
    if (!selectedCardId) {
      showToast('Select a card from your hand first', 'info');
      return;
    }

    const cardToPlay = hand.find((c) => c.id === selectedCardId);
    if (!cardToPlay) return;

    soundService.playCardPlay();

    // Check if off-suit (Thulla)
    const isThulla = cardToPlay.suit !== leadSuit;
    if (isThulla) {
      soundService.playThulla();
      showToast(`THULLA! ${settings.nickname} gave Thulla with ${cardToPlay.rank} of ${cardToPlay.suit}!`, 'error', 'Thulla Played');
    } else {
      showToast(`Played ${cardToPlay.rank} of ${cardToPlay.suit}`, 'success');
    }

    // Add to trick pile with random tilt
    const rotation = (Math.random() - 0.5) * 26;
    setTrickPile((prev) => [
      ...prev,
      {
        card: cardToPlay,
        playedBy: `${settings.nickname} (You)`,
        rotation,
      },
    ]);

    // Remove from hand
    setHand((prev) => prev.filter((c) => c.id !== selectedCardId));
    setSelectedCardId(null);

    // Pass turn to next seat
    setActiveTurnSeat(1);
  };

  const handleResetHand = () => {
    setHand(INITIAL_PLAYER_HAND);
    setSelectedCardId('spades-A');
    setLeadSuit('spades');
    setTrickPile([
      {
        card: { id: 'spades-7', suit: 'spades', rank: '7' },
        playedBy: 'Farhan',
        rotation: -12,
      },
      {
        card: { id: 'spades-K', suit: 'spades', rank: 'K' },
        playedBy: 'Zainab',
        rotation: 8,
      },
    ]);
    setActiveTurnSeat(0);
    showToast('Hand and trick pile reset to initial preview state', 'info');
  };

  const handleCollectPileDemo = () => {
    soundService.playCollectPile();
    showToast('Zainab (highest spade) collected the trick pile!', 'info', 'Pile Collected');
    setTrickPile([]);
  };

  return (
    <div className="relative min-h-screen bg-charcoal-950 flex flex-col justify-between overflow-hidden select-none">
      {/* Top Table Control Bar */}
      <header className="relative z-30 w-full bg-charcoal-900/90 border-b border-charcoal-800 px-3 sm:px-6 py-2.5 flex items-center justify-between backdrop-blur-md">
        {/* Left: Table Status & Player Count Switcher */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/lobby')}
            className="flex items-center space-x-1.5 text-xs text-gray-300 hover:text-white bg-charcoal-800 hover:bg-charcoal-700 px-2.5 py-1.5 rounded-lg border border-charcoal-700 transition-colors"
            title="Leave Table"
          >
            <LogOut className="w-3.5 h-3.5 text-ruby-400" />
            <span className="hidden sm:inline">Leave</span>
          </button>

          {/* Quick Player Layout Switcher */}
          <div className="flex items-center bg-charcoal-950 rounded-lg p-0.5 border border-charcoal-700">
            <span className="text-[10px] text-gray-400 px-2 uppercase font-medium hidden md:inline">
              Layout:
            </span>
            {[3, 4, 5, 6].map((count) => (
              <button
                key={count}
                onClick={() => setPlayerCount(count)}
                className={`text-xs px-2 py-1 rounded font-semibold transition-all ${
                  playerCount === count
                    ? 'bg-gold-500 text-charcoal-950 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
                title={`Preview ${count}-player table geometry`}
              >
                {count}P
              </button>
            ))}
          </div>

          <span className="hidden lg:inline-flex items-center space-x-1 text-xs text-gold-400 font-mono bg-gold-500/10 px-2 py-0.5 rounded border border-gold-500/20">
            <Sparkles className="w-3 h-3" />
            <span>Interactive Preview</span>
          </span>
        </div>

        {/* Center: Trick Status Badge */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 bg-felt-900/90 border border-gold-500/40 px-3 py-1 rounded-full text-xs shadow-md">
            <span className="text-gray-300">Lead Suit:</span>
            <span className="font-bold text-cream-100 flex items-center space-x-1">
              <SuitIcon suit={leadSuit} size={14} />
              <span className="capitalize">{leadSuit}</span>
            </span>
          </div>
        </div>

        {/* Right: Sound, Reset & Help */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className="p-1.5 rounded-lg bg-charcoal-800 text-gray-300 hover:text-white border border-charcoal-700"
            title={settings.soundEnabled ? 'Mute sound' : 'Enable sound'}
            aria-label="Toggle sound"
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-500" />
            )}
          </button>

          <button
            onClick={handleResetHand}
            className="p-1.5 rounded-lg bg-charcoal-800 text-gray-300 hover:text-white border border-charcoal-700"
            title="Reset preview hand"
            aria-label="Reset preview hand"
          >
            <RotateCcw className="w-4 h-4 text-gold-400" />
          </button>

          <Link
            to="/rules"
            className="p-1.5 rounded-lg bg-charcoal-800 text-gray-300 hover:text-white border border-charcoal-700"
            title="How to Play"
          >
            <HelpCircle className="w-4 h-4" />
          </Link>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-lg bg-charcoal-800 text-gray-300 hover:text-white border border-charcoal-700"
            title="Table Settings"
            aria-label="Table settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Felt Playing Surface */}
      <main className="relative flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 flex flex-col justify-between items-center overflow-hidden">
        {/* Felt Table Surface Oval Container */}
        <div className="relative w-full h-full min-h-[460px] sm:min-h-[520px] rounded-[40px] sm:rounded-[80px] felt-table flex flex-col justify-between p-4 sm:p-8 overflow-hidden shadow-felt-inset">
          {/* Inner Golden Stitch Border Line */}
          <div className="absolute inset-3 sm:inset-5 rounded-[30px] sm:rounded-[70px] felt-stitch pointer-events-none" />

          {/* Opponents Positioning Ring */}
          <div className="relative z-10 w-full flex items-center justify-around gap-2 pt-2">
            {opponents.map((opp) => (
              <div
                key={opp.id}
                className={`flex flex-col items-center space-y-1 transition-all duration-300 ${
                  activeTurnSeat === opp.seat
                    ? 'scale-105 filter drop-shadow-[0_0_12px_rgba(212,175,55,0.6)]'
                    : 'opacity-90'
                }`}
              >
                {/* Opponent Avatar & Status */}
                <div className="relative">
                  <AvatarBadge avatarId={opp.avatar} size="md" />
                  {activeTurnSeat === opp.seat && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gold-400 border-2 border-charcoal-900 animate-ping" />
                  )}
                  {/* Card count bubble */}
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-charcoal-950 text-gold-300 text-[10px] font-bold rounded-full border border-gold-500/40">
                    {opp.cards}
                  </span>
                </div>

                {/* Nickname */}
                <span className="text-xs font-semibold text-cream-100 bg-charcoal-950/70 px-2 py-0.5 rounded-md border border-charcoal-800">
                  {opp.name}
                </span>

                {/* Opponent Card Back Stack Preview */}
                <div className="flex -space-x-3 mt-0.5">
                  <CardBack size="sm" className="scale-75 shadow-md" />
                  <CardBack size="sm" className="scale-75 shadow-md" />
                  <CardBack size="sm" className="scale-75 shadow-md" />
                </div>
              </div>
            ))}
          </div>

          {/* Central Trick Pile & Table Activity Area */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-4 sm:my-8">
            {/* Center Felt Badge */}
            <div className="mb-2 text-center pointer-events-none select-none">
              <span className="text-[11px] uppercase tracking-widest text-gold-400/80 font-bold">
                Bhabhi Thulla Trick Pile
              </span>
            </div>

            {/* Trick Cards Display */}
            <div className="relative w-48 h-36 sm:w-56 sm:h-44 flex items-center justify-center">
              {trickPile.length === 0 ? (
                <div className="text-center p-4 rounded-2xl border-2 border-dashed border-gold-500/20 bg-charcoal-950/30">
                  <p className="text-xs text-gold-300/80 font-medium">Trick Pile Empty</p>
                  <p className="text-[10px] text-gray-400 mt-1">Lead card starts here</p>
                </div>
              ) : (
                trickPile.map((item, idx) => (
                  <div
                    key={`${item.card.id}-${idx}`}
                    className="absolute transition-all duration-300 animate-scale-up"
                    style={{
                      transform: `rotate(${item.rotation}deg) translate(${idx * 4}px, ${idx * 2}px)`,
                      zIndex: idx + 10,
                    }}
                  >
                    <PlayingCard card={item.card} size="md" />
                    {/* Small name tag */}
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] bg-charcoal-950 text-gold-300 px-1.5 py-0.2 rounded border border-charcoal-800 whitespace-nowrap shadow">
                      {item.playedBy}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Quick Trick Action Buttons (For testing pile mechanics in preview) */}
            <div className="flex items-center space-x-2 mt-4">
              {trickPile.length > 0 && (
                <button
                  onClick={handleCollectPileDemo}
                  className="text-[11px] px-3 py-1 bg-charcoal-900/80 hover:bg-charcoal-800 border border-gold-500/40 text-gold-300 rounded-lg shadow transition-colors"
                >
                  Simulate Collect Pile
                </button>
              )}
            </div>
          </div>

          {/* Local Player Info Bar */}
          <div className="relative z-10 w-full flex items-center justify-between px-2 pt-2 border-t border-gold-500/20">
            <div className="flex items-center space-x-2">
              <AvatarBadge avatarId={settings.avatar} size="sm" />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-cream-100">
                    {settings.nickname} (You)
                  </span>
                  <StatusBadge type="turn" label="Your Turn" />
                </div>
                <p className="text-[10px] text-gray-300">
                  {hand.length} cards in hand • {selectedCardId ? '1 Card Selected' : 'Tap a card to select'}
                </p>
              </div>
            </div>

            {/* Play Card Action Button */}
            <Button
              variant="gold"
              size="sm"
              disabled={!selectedCardId}
              onClick={handlePlaySelectedCard}
              className="font-bold tracking-wider"
            >
              Play Card
            </Button>
          </div>
        </div>

        {/* Local Player's Interactive Hand at Bottom */}
        <div className="relative z-20 w-full max-w-5xl mt-[-20px] sm:mt-[-30px]">
          <CardHand
            cards={hand}
            selectedCardId={selectedCardId}
            onSelectCard={handleSelectCard}
            highlightedCardIds={['spades-A']}
            size={settings.cardSize === 'compact' ? 'sm' : settings.cardSize === 'large' ? 'lg' : 'md'}
          />
        </div>
      </main>

      {/* Quick Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Table Settings"
        description="Adjust in-game sound and visual options"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-charcoal-900 rounded-xl border border-charcoal-700">
            <div>
              <p className="text-sm font-medium text-cream-100">Sound Effects</p>
              <p className="text-xs text-gray-400">Tactile card sounds and Thulla alerts</p>
            </div>
            <button
              onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                settings.soundEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-charcoal-800 text-gray-400 border-charcoal-600'
              }`}
            >
              {settings.soundEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-charcoal-900 rounded-xl border border-charcoal-700">
            <div>
              <p className="text-sm font-medium text-cream-100">Reduced Animations</p>
              <p className="text-xs text-gray-400">Disable card elevation and motion</p>
            </div>
            <button
              onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                settings.reducedMotion
                  ? 'bg-gold-500/20 text-gold-300 border-gold-500/40'
                  : 'bg-charcoal-800 text-gray-400 border-charcoal-600'
              }`}
            >
              {settings.reducedMotion ? 'On' : 'Off'}
            </button>
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="gold" size="sm" onClick={() => setIsSettingsOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
