export const TRANSITION_MS = 700;
export const AUTOPLAY_MS = 6000;

export const heroKeyframes = `
  @keyframes heroKenBurns {
    from { transform: scale(1); }
    to { transform: scale(1.08); }
  }
  @keyframes heroDiagonalReveal {
    from { clip-path: polygon(100% 0, 100% 0, 100% 100%, 100% 100%); }
    to { clip-path: polygon(0 0, 100% 0, 100% 100%, -15% 100%); }
  }
  @keyframes heroProgressFill {
    from { width: 0%; }
    to { width: 100%; }
  }
  @keyframes heroProgressRing {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(2); }
  }
`;
