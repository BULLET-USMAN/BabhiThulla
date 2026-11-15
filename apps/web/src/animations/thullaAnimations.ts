export interface ThullaAnimationConfig {
  bannerDisplayMs: number;
  highlightLeadCardMs: number;
  pileCollectMs: number;
}

export const DEFAULT_THULLA_CONFIG: ThullaAnimationConfig = {
  bannerDisplayMs: 2500,
  highlightLeadCardMs: 800,
  pileCollectMs: 700,
};

export const REDUCED_THULLA_CONFIG: ThullaAnimationConfig = {
  bannerDisplayMs: 1500,
  highlightLeadCardMs: 0,
  pileCollectMs: 0,
};

export function getThullaConfig(isReducedMotion: boolean): ThullaAnimationConfig {
  return isReducedMotion ? REDUCED_THULLA_CONFIG : DEFAULT_THULLA_CONFIG;
}
