import { useEffect, useRef, useState } from 'react';

interface OdometerCounterProps {
  value: number;
  total: number;
  reduced?: boolean;
}

export function OdometerCounter({ value, total, reduced }: OdometerCounterProps) {
  const padded = String(value + 1).padStart(2, '0');
  const totalPadded = String(total).padStart(2, '0');

  if (reduced) {
    return (
      <span className="text-sm font-sans tracking-wider text-primary-foreground/70">
        {padded} / {totalPadded}
      </span>
    );
  }

  return (
    <span className="text-sm font-sans tracking-wider text-primary-foreground/70 flex items-center gap-0.5">
      <OdometerDigit value={parseInt(padded[0])} />
      <OdometerDigit value={parseInt(padded[1])} />
      <span className="mx-1">/</span>
      <span>{totalPadded}</span>
    </span>
  );
}

function OdometerDigit({ value }: { value: number }) {
  const [prev, setPrev] = useState(value);
  const [current, setCurrent] = useState(value);
  const [animating, setAnimating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (value !== current) {
      setPrev(current);
      setCurrent(value);
      setAnimating(true);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setAnimating(false), 400);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [value, current]);

  return (
    <span className="inline-block overflow-hidden h-[1.2em] w-[0.65em] relative">
      <span
        className="absolute inset-x-0 flex flex-col items-center transition-transform duration-400"
        style={{
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          transform: animating ? 'translateY(-1.2em)' : 'translateY(0)',
        }}
      >
        <span className="h-[1.2em] flex items-center justify-center">
          {animating ? prev : current}
        </span>
        <span className="h-[1.2em] flex items-center justify-center">{current}</span>
      </span>
    </span>
  );
}
