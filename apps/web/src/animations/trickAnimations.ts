export interface TrickAnimationConfig {
  highlightWinnerMs: number;
  sweepToDiscardMs: number;
}

export const DEFAULT_TRICK_CONFIG: TrickAnimationConfig = {
  highlightWinnerMs: 600,
  sweepToDiscardMs: 500,
};

export const REDUCED_TRICK_CONFIG: TrickAnimationConfig = {
  highlightWinnerMs: 0,
  sweepToDiscardMs: 0,
};

export function getTrickConfig(isReducedMotion: boolean): TrickAnimationConfig {
  return isReducedMotion ? REDUCED_TRICK_CONFIG : DEFAULT_TRICK_CONFIG;
}
