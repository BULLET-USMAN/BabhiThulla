import { Link } from 'react-router-dom';
import { HelpCircle, Home } from 'lucide-react';
import { Button } from '../components/ui/Button.js';

export function NotFoundView() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="w-16 h-16 rounded-2xl bg-charcoal-800 border border-gold-500/30 flex items-center justify-center text-gold-400 mb-6 shadow-xl">
        <HelpCircle className="w-8 h-8" />
      </div>

      <h1 className="text-4xl sm:text-5xl font-black font-display gold-gradient-text mb-3">
        404 - Hand Folded
      </h1>
      <p className="text-sm text-gray-400 max-w-md mb-8">
        The card or room table you are looking for does not exist or has already been reshuffled.
      </p>

      <Link to="/">
        <Button variant="gold" size="md" leftIcon={<Home className="w-4 h-4" />}>
          Return to Table Lobby
        </Button>
      </Link>
    </div>
  );
}
