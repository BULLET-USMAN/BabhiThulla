import React, { useState, useRef, useEffect } from 'react';
import { Smile, MessageSquare, X } from 'lucide-react';
import { ALLOWED_EMOTES, ALLOWED_QUICK_CHATS, EmoteId, QuickChatId } from '@bhabhi/shared';

export interface EmoteBarProps {
  onSendEmote: (emoteId: EmoteId) => void;
  onSendQuickChat: (messageId: QuickChatId) => void;
  disabled?: boolean;
}

export const EmoteBar: React.FC<EmoteBarProps> = ({
  onSendEmote,
  onSendQuickChat,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'emotes' | 'chat'>('emotes');
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectEmote = (emoteId: EmoteId) => {
    onSendEmote(emoteId);
    setIsOpen(false);
  };

  const handleSelectChat = (messageId: QuickChatId) => {
    onSendQuickChat(messageId);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={panelRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 sm:p-2.5 rounded-xl bg-charcoal-800/90 hover:bg-charcoal-700/90 border border-charcoal-700 text-gold-300 hover:text-gold-200 shadow-lg transition-all active:scale-95 flex items-center space-x-1.5"
        title="Reactions & Quick Chat"
        aria-label="Reactions and Quick Chat"
        aria-expanded={isOpen}
      >
        <Smile className="w-4 h-4 sm:w-5 sm:h-5 text-gold-400" />
      </button>

      {/* Floating Popup Panel */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-50 w-72 sm:w-80 bg-charcoal-850/95 border border-charcoal-700 rounded-2xl p-3 shadow-2xl backdrop-blur-md animate-scale-up">
          {/* Header with Tabs */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-charcoal-700/80">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab('emotes')}
                className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === 'emotes'
                    ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Smile className="w-3.5 h-3.5" />
                <span>Emotes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === 'chat'
                    ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Quick Chat</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white p-1 rounded-md"
              aria-label="Close reaction panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tab 1: Emotes Grid */}
          {activeTab === 'emotes' && (
            <div className="grid grid-cols-4 gap-2 py-1">
              {ALLOWED_EMOTES.map((emote) => (
                <button
                  type="button"
                  key={emote.id}
                  onClick={() => handleSelectEmote(emote.id)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-charcoal-900/80 hover:bg-charcoal-800 border border-charcoal-750 hover:border-gold-500/50 hover:scale-110 active:scale-95 transition-all"
                  title={emote.label}
                >
                  <span className="text-2xl leading-none">{emote.symbol}</span>
                  <span className="text-[10px] text-gray-400 mt-1">{emote.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Tab 2: Quick Chat Messages */}
          {activeTab === 'chat' && (
            <div className="grid grid-cols-2 gap-2 py-1">
              {ALLOWED_QUICK_CHATS.map((chat) => (
                <button
                  type="button"
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className="text-left px-2.5 py-2 rounded-xl bg-charcoal-900/80 hover:bg-charcoal-800 border border-charcoal-750 hover:border-gold-500/50 text-xs text-cream-100 font-medium hover:text-gold-300 active:scale-95 transition-all"
                >
                  {chat.text}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
