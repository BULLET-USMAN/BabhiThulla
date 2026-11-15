import { useState } from 'react';
import { History, ChevronDown, ChevronUp } from 'lucide-react';
import { GameEvent } from '@bhabhi/shared';

export interface EventLogDrawerProps {
  events: GameEvent[];
  className?: string;
}

export function EventLogDrawer({ events, className = '' }: EventLogDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const recentEvents = events.slice(-12).reverse();

  return (
    <div
      className={`fixed bottom-2 left-3 z-30 max-w-xs sm:max-w-sm transition-all duration-300 ${className}`}
    >
      <div className="bg-charcoal-900/95 border border-charcoal-700/90 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden">
        {/* Toggle Header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-semibold text-gray-300 hover:text-white bg-charcoal-850 hover:bg-charcoal-800 transition-colors"
          aria-expanded={isOpen}
          aria-label="Toggle game event history"
        >
          <div className="flex items-center space-x-2">
            <History className="w-3.5 h-3.5 text-gold-400" />
            <span>Activity Log ({events.length})</span>
          </div>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>

        {/* Expandable Events List */}
        {isOpen && (
          <div className="p-3 max-h-48 sm:max-h-60 overflow-y-auto space-y-2 text-xs divide-y divide-charcoal-800">
            {recentEvents.length === 0 ? (
              <p className="text-gray-500 italic py-1">No moves yet.</p>
            ) : (
              recentEvents.map((ev) => (
                <div key={ev.id} className="pt-1.5 first:pt-0">
                  <p
                    className={`${
                      ev.type === 'THULLA_OCCURRED'
                        ? 'text-ruby-400 font-bold'
                        : ev.type === 'PLAYER_ESCAPED'
                        ? 'text-emerald-400 font-semibold'
                        : ev.type === 'BHABHI_DECLARED'
                        ? 'text-gold-300 font-black'
                        : 'text-cream-200'
                    }`}
                  >
                    {ev.message}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
