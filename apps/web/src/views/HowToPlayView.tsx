import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, AlertCircle, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { PlayingCard } from '../components/cards/PlayingCard.js';
import { Button } from '../components/ui/Button.js';

export function HowToPlayView() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-10">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center space-x-2 text-sm text-gray-400 hover:text-gold-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Complete Game Manual</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black font-display gold-gradient-text">
          How to Play Bhabhi Thulla
        </h1>
        <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
          The beloved South Asian trick-avoidance card game. Your objective is simple: empty your hand as quickly as possible. The last player left with cards is crowned the <strong className="text-gold-300">Bhabhi</strong>!
        </p>
      </div>

      {/* Step by Step Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rule 1: Deck & Dealing */}
        <div className="bg-charcoal-850 border border-charcoal-700/80 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-gold-400 font-bold text-sm">
            <span className="w-6 h-6 rounded-full bg-gold-500/20 flex items-center justify-center text-xs">1</span>
            <span>The 52-Card Deck</span>
          </div>
          <h3 className="text-lg font-bold text-cream-100 font-display">Dealing & Hand Sizes</h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            Standard 52-card deck without jokers. All cards are dealt clockwise. In a 4-player game, each player gets 13 cards. In 3, 5, or 6 player games, some players naturally receive one extra card. Card ranking: <strong className="text-gold-300">A &gt; K &gt; Q &gt; J &gt; 10 &gt; ... &gt; 2</strong>. There is no trump suit.
          </p>
        </div>

        {/* Rule 2: Ace of Spades Opening */}
        <div className="bg-charcoal-850 border border-charcoal-700/80 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-gold-400 font-bold text-sm">
            <span className="w-6 h-6 rounded-full bg-gold-500/20 flex items-center justify-center text-xs">2</span>
            <span>Starting the Match</span>
          </div>
          <h3 className="text-lg font-bold text-cream-100 font-display">Ace of Spades Opening</h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            The player holding the <strong className="text-gold-300">Ace of Spades (♠A)</strong> must lead it on the very first trick. Play then proceeds clockwise. There is no special immunity on the opening trick!
          </p>
        </div>

        {/* Rule 3: Following Suit */}
        <div className="bg-charcoal-850 border border-charcoal-700/80 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-gold-400 font-bold text-sm">
            <span className="w-6 h-6 rounded-full bg-gold-500/20 flex items-center justify-center text-xs">3</span>
            <span>Trick Rules</span>
          </div>
          <h3 className="text-lg font-bold text-cream-100 font-display">Must Follow Suit</h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            The first card played establishes the <strong className="text-cream-100">leading suit</strong>. If you hold ANY card of that suit, you <strong className="text-ruby-400">must</strong> play one. You can choose freely among your matching cards.
          </p>
        </div>

        {/* Rule 4: Giving a Thulla */}
        <div className="bg-charcoal-850 border border-charcoal-700/80 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-ruby-400 font-bold text-sm">
            <span className="w-6 h-6 rounded-full bg-ruby-500/20 flex items-center justify-center text-xs">4</span>
            <span>The Penalty</span>
          </div>
          <h3 className="text-lg font-bold text-cream-100 font-display">Giving a "Thulla"</h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            If you have <strong className="text-gold-300">no cards</strong> of the leading suit, you can play any other off-suit card. This is called giving a <strong className="text-ruby-400">Thulla</strong>! It immediately ends the trick and penalizes the player who played the highest card of the leading suit.
          </p>
        </div>
      </div>

      {/* Illustrated Walkthrough of a Thulla */}
      <div className="bg-charcoal-850 border-2 border-gold-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center space-x-2.5">
          <ShieldAlert className="w-6 h-6 text-ruby-400" />
          <h2 className="text-xl sm:text-2xl font-bold font-display gold-gradient-text">
            Illustrated Example of a "Thulla" Trick
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-gray-300">
          Observe how the Thulla mechanic works in action when a player is out of the leading suit:
        </p>

        {/* Visual Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          {/* Player A */}
          <div className="flex flex-col items-center bg-charcoal-900/90 border border-charcoal-700 p-4 rounded-2xl">
            <span className="text-xs font-semibold text-gray-400 mb-2">Player A (Leads)</span>
            <PlayingCard suit="spades" rank="7" size="md" />
            <p className="text-xs text-cream-200 mt-3 text-center">
              Leads with <strong className="text-gold-300">7 of Spades</strong>. Suit is Spades.
            </p>
          </div>

          {/* Player B */}
          <div className="flex flex-col items-center bg-felt-950/60 border border-gold-500/60 p-4 rounded-2xl ring-1 ring-gold-500/30">
            <span className="text-xs font-semibold text-gold-300 mb-2">Player B (Follows)</span>
            <PlayingCard suit="spades" rank="K" size="md" isHighlighted />
            <p className="text-xs text-cream-200 mt-3 text-center">
              Plays <strong className="text-gold-300">King of Spades</strong>. Currently highest Spade!
            </p>
          </div>

          {/* Player C */}
          <div className="flex flex-col items-center bg-ruby-950/40 border border-ruby-500/60 p-4 rounded-2xl ring-1 ring-ruby-500/30">
            <span className="text-xs font-semibold text-ruby-400 mb-2">Player C (Gives Thulla)</span>
            <PlayingCard suit="hearts" rank="3" size="md" />
            <p className="text-xs text-cream-200 mt-3 text-center">
              Has NO Spades! Plays <strong className="text-ruby-400">3 of Hearts (THULLA)</strong>.
            </p>
          </div>
        </div>

        {/* Explanation Card */}
        <div className="bg-charcoal-900 border border-gold-500/30 rounded-2xl p-5 space-y-3">
          <h4 className="text-sm font-bold text-gold-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-gold-400" />
            <span>What happens next?</span>
          </h4>
          <ul className="text-xs text-gray-300 space-y-2 list-disc list-inside">
            <li>
              The trick immediately terminates. Any remaining players who have not played are skipped.
            </li>
            <li>
              <strong className="text-cream-100">Player B</strong> played the highest card of the leading suit (<strong className="text-gold-300">King of Spades</strong>).
            </li>
            <li>
              <strong className="text-ruby-400">Player B must pick up ALL 3 cards</strong> (7♠, K♠, 3♥) and add them to their hand!
            </li>
            <li>
              <strong className="text-cream-100">Player B leads the next trick</strong>.
            </li>
          </ul>
        </div>
      </div>

      {/* Escaping & Declaring Bhabhi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-charcoal-850 border border-charcoal-700/80 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Escaping Safely</span>
          </div>
          <h3 className="text-lg font-bold text-cream-100 font-display">Emptying Your Hand</h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            When you play your last card and do NOT have to collect a Thulla pile, you are safely <strong className="text-emerald-400">out of the game</strong>! You no longer take turns.
          </p>
        </div>

        <div className="bg-charcoal-850 border border-charcoal-700/80 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-ruby-400 font-bold text-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>The Loser</span>
          </div>
          <h3 className="text-lg font-bold text-cream-100 font-display">Becoming the Bhabhi</h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            The game continues until exactly ONE player remains with cards. That player loses the match and is crowned the <strong className="text-ruby-400">BHABHI</strong>!
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center pt-4">
        <Link to="/table">
          <Button variant="gold" size="lg" rightIcon={<Sparkles className="w-4 h-4" />}>
            Explore the Interactive Table Preview
          </Button>
        </Link>
      </div>
    </div>
  );
}
