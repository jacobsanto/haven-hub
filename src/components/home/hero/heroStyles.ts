export const TRANSITION_MS = 900;
export const AUTOPLAY_MS = 5500;

// Card deck constants
export const CARD_SPACING = 28;
export const CARD_ROTATION = 3;
export const CARD_SCALE_BASE = 0.88;
export const CARD_SCALE_STEP = 0.04;

// Shared easing curve — smooth spring-like feel
export const EASE_SMOOTH = 'cubic-bezier(0.22, 1, 0.36, 1)';

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
