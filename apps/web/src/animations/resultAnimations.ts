export interface ResultAnimationConfig {
  introDelayMs: number;
  confettiDurationMs: number;
}

export const DEFAULT_RESULT_CONFIG: ResultAnimationConfig = {
  introDelayMs: 300,
  confettiDurationMs: 3500,
};

export const REDUCED_RESULT_CONFIG: ResultAnimationConfig = {
  introDelayMs: 0,
  confettiDurationMs: 0,
};

export function getResultConfig(isReducedMotion: boolean): ResultAnimationConfig {
  return isReducedMotion ? REDUCED_RESULT_CONFIG : DEFAULT_RESULT_CONFIG;
}
