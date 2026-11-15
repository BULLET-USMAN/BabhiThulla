import React from 'react';
import { ActiveEmote, ActiveQuickChat } from '../../context/MultiplayerContext.js';
import { useSettings } from '../../context/SettingsContext.js';

export interface EmoteOverlayProps {
  playerId: string;
  activeEmotes: ActiveEmote[];
  activeQuickChats: ActiveQuickChat[];
}

export const EmoteOverlay: React.FC<EmoteOverlayProps> = ({
  playerId,
  activeEmotes,
  activeQuickChats,
}) => {
  const { settings } = useSettings();

  const isEmotesMuted = settings.muteEmotes ?? false;
  const isChatMuted = settings.muteQuickChat ?? false;

  const playerEmotes = isEmotesMuted
    ? []
    : activeEmotes.filter((e) => e.playerId === playerId);

  const playerChats = isChatMuted
    ? []
    : activeQuickChats.filter((c) => c.playerId === playerId);

  if (playerEmotes.length === 0 && playerChats.length === 0) {
    return null;
  }

  return (
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none z-50 flex flex-col items-center space-y-1">
      {/* Floating Emote */}
      {playerEmotes.map((emote) => (
        <div
          key={emote.id}
          className="text-3xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] animate-float-up transition-all duration-300"
          role="img"
          aria-label={emote.emoteId}
        >
          {emote.symbol}
        </div>
      ))}

      {/* Speech Bubble Quick Chat */}
      {playerChats.map((chat) => (
        <div
          key={chat.id}
          className="relative px-3 py-1 rounded-xl bg-charcoal-900/95 border border-gold-500/60 text-gold-300 text-xs font-bold shadow-2xl whitespace-nowrap animate-scale-up"
        >
          <span>{chat.text}</span>
          {/* Downward triangle arrow */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gold-500" />
        </div>
      ))}
    </div>
  );
};
