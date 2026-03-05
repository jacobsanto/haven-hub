export function GrainOverlay() {
  return (
    <>
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <filter id="heroGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 5,
          filter: 'url(#heroGrain)',
          opacity: 0.04,
          mixBlendMode: 'overlay',
        }}
        aria-hidden="true"
      />
    </>
  );
}
