export const TRANSITION_MS = 800;
export const AUTOPLAY_MS = 5500;

// Card deck constants
export const CARD_SPACING = 30;
export const CARD_ROTATION = 2;
export const CARD_SCALE_BASE = 0.85;
export const CARD_SCALE_STEP = 0.05;

export const heroKeyframes = `
  @keyframes heroProgressFill {
    from { width: 0%; }
    to { width: 100%; }
  }
  @keyframes heroProgressRing {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(2); }
  }
`;
