export type SoundEffectType =
  | 'cardSelect'
  | 'cardPlay'
  | 'cardDeal'
  | 'cardShuffle'
  | 'trickSweep'
  | 'thulla'
  | 'pileCollect'
  | 'playerEscape'
  | 'bhabhiFinish'
  | 'buttonClick'
  | 'playerJoined'
  | 'rematchStart'
  | 'emote';

export interface SoundConfig {
  id: SoundEffectType;
  name: string;
  description: string;
  category: 'cards' | 'gameplay' | 'ui' | 'reactions';
}

export const SOUND_MANIFEST: Record<SoundEffectType, SoundConfig> = {
  cardSelect: {
    id: 'cardSelect',
    name: 'Card Select',
    description: 'Crisp tactile click when selecting or hovering a card',
    category: 'cards',
  },
  cardPlay: {
    id: 'cardPlay',
    name: 'Card Play / Slap',
    description: 'Satisfying physical card slap on felt surface',
    category: 'cards',
  },
  cardDeal: {
    id: 'cardDeal',
    name: 'Card Deal',
    description: 'Fast air friction swish as cards are dealt',
    category: 'cards',
  },
  cardShuffle: {
    id: 'cardShuffle',
    name: 'Card Shuffle',
    description: 'Rhythmic riffle shuffle flutter sequence',
    category: 'cards',
  },
  trickSweep: {
    id: 'trickSweep',
    name: 'Trick Sweep',
    description: 'Smooth whoosh sweep into the discard pile',
    category: 'gameplay',
  },
  thulla: {
    id: 'thulla',
    name: 'Thulla Sting',
    description: 'Dramatic descending brass strike when a Thulla is played',
    category: 'gameplay',
  },
  pileCollect: {
    id: 'pileCollect',
    name: 'Pile Collect',
    description: 'Ascending card scoop sound when collecting the penalty pile',
    category: 'gameplay',
  },
  playerEscape: {
    id: 'playerEscape',
    name: 'Player Escape',
    description: 'Triumphant major-chord fanfare when shedding all cards',
    category: 'gameplay',
  },
  bhabhiFinish: {
    id: 'bhabhiFinish',
    name: 'Bhabhi Finish',
    description: 'Playful defeat sting when the Bhabhi is declared',
    category: 'gameplay',
  },
  buttonClick: {
    id: 'buttonClick',
    name: 'Button Interaction',
    description: 'Soft tactile interface click',
    category: 'ui',
  },
  playerJoined: {
    id: 'playerJoined',
    name: 'Player Joined',
    description: 'Warm two-tone chime when a player joins the room',
    category: 'ui',
  },
  rematchStart: {
    id: 'rematchStart',
    name: 'Rematch Start',
    description: 'Energetic starting chime when a rematch is approved',
    category: 'ui',
  },
  emote: {
    id: 'emote',
    name: 'Emote Pop',
    description: 'Light playful bubble pop when an emote appears',
    category: 'reactions',
  },
};
