export interface EscapeAnimationConfig {
  celebrationDurationMs: number;
}

export const DEFAULT_ESCAPE_CONFIG: EscapeAnimationConfig = {
  celebrationDurationMs: 2500,
};

export const REDUCED_ESCAPE_CONFIG: EscapeAnimationConfig = {
  celebrationDurationMs: 1200,
};

export function getEscapeConfig(isReducedMotion: boolean): EscapeAnimationConfig {
  return isReducedMotion ? REDUCED_ESCAPE_CONFIG : DEFAULT_ESCAPE_CONFIG;
}
