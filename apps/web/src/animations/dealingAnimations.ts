export interface DealingAnimationConfig {
  shuffleDurationMs: number;
  perCardDealMs: number;
  totalDealMs: number;
}

export const DEFAULT_DEAL_CONFIG: DealingAnimationConfig = {
  shuffleDurationMs: 400,
  perCardDealMs: 60,
  totalDealMs: 1200,
};

export const REDUCED_DEAL_CONFIG: DealingAnimationConfig = {
  shuffleDurationMs: 0,
  perCardDealMs: 0,
  totalDealMs: 0,
};

export function getDealingConfig(isReducedMotion: boolean): DealingAnimationConfig {
  return isReducedMotion ? REDUCED_DEAL_CONFIG : DEFAULT_DEAL_CONFIG;
}
