import { cn } from '@/lib/utils';

interface WorldMapDecorProps {
  className?: string;
}

export const WorldMapDecor = ({ className }: WorldMapDecorProps) => {
  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      <svg
        viewBox="0 0 1200 600"
        className="w-full h-full opacity-[0.06]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Simplified world map continents */}
        <g stroke="hsl(220, 70%, 50%)" strokeWidth="1.5" fill="none">
          {/* North America */}
          <path d="M150 120 C160 100, 200 80, 250 90 C280 95, 310 100, 330 120 C340 130, 345 150, 340 170 C335 190, 320 210, 300 230 C280 250, 250 260, 230 255 C200 245, 180 230, 170 210 C155 185, 145 150, 150 120Z" />
          {/* South America */}
          <path d="M280 300 C290 280, 310 275, 320 285 C335 295, 340 320, 338 350 C335 380, 325 410, 310 430 C295 450, 280 455, 270 440 C260 420, 258 390, 260 360 C262 330, 270 310, 280 300Z" />
          {/* Europe */}
          <path d="M520 100 C540 90, 570 85, 590 95 C610 105, 620 120, 615 140 C610 155, 595 165, 575 170 C555 175, 530 170, 520 155 C510 140, 510 115, 520 100Z" />
          {/* Africa */}
          <path d="M540 200 C555 185, 580 180, 600 190 C620 200, 630 225, 628 260 C625 295, 615 330, 600 360 C585 385, 565 395, 550 380 C535 360, 530 330, 532 295 C534 260, 535 220, 540 200Z" />
          {/* Asia */}
          <path d="M650 80 C690 70, 750 65, 810 75 C860 85, 900 100, 920 130 C935 155, 930 180, 910 200 C880 225, 840 235, 800 230 C760 225, 720 210, 690 190 C660 170, 640 140, 640 115 C640 95, 645 85, 650 80Z" />
          {/* Southeast Asia / Indonesia */}
          <path d="M830 250 C850 245, 870 248, 885 260 C900 272, 910 290, 905 305 C898 318, 880 322, 860 315 C840 308, 825 290, 825 270 C825 258, 828 252, 830 250Z" />
          {/* Australia */}
          <path d="M880 370 C905 355, 940 350, 965 360 C990 370, 1005 390, 1000 415 C995 435, 975 450, 950 452 C920 455, 895 440, 882 420 C870 400, 870 380, 880 370Z" />
        </g>

        {/* Dotted connection lines */}
        <g stroke="hsl(220, 70%, 50%)" strokeWidth="0.8" strokeDasharray="4 6" opacity="0.5">
          <line x1="280" y1="170" x2="540" y2="130" />
          <line x1="590" y1="140" x2="700" y2="120" />
          <line x1="810" y1="200" x2="880" y2="370" />
          <line x1="300" y1="230" x2="300" y2="300" />
          <line x1="600" y1="190" x2="580" y2="260" />
        </g>

        {/* Pin markers with pulse animation */}
        <g>
          {/* Paris */}
          <circle cx="560" cy="120" r="4" fill="hsl(220, 70%, 50%)" opacity="0.8">
            <animate attributeName="r" values="4;6;4" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0.4;0.8" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="560" cy="120" r="2" fill="hsl(220, 70%, 50%)" />
          
          {/* Bali */}
          <circle cx="870" cy="280" r="4" fill="hsl(220, 70%, 50%)" opacity="0.8">
            <animate attributeName="r" values="4;6;4" dur="3.5s" repeatCount="indefinite" begin="0.5s" />
            <animate attributeName="opacity" values="0.8;0.4;0.8" dur="3.5s" repeatCount="indefinite" begin="0.5s" />
          </circle>
          <circle cx="870" cy="280" r="2" fill="hsl(220, 70%, 50%)" />
          
          {/* Maldives */}
          <circle cx="720" cy="270" r="4" fill="hsl(220, 70%, 50%)" opacity="0.8">
            <animate attributeName="r" values="4;6;4" dur="4s" repeatCount="indefinite" begin="1s" />
            <animate attributeName="opacity" values="0.8;0.4;0.8" dur="4s" repeatCount="indefinite" begin="1s" />
          </circle>
          <circle cx="720" cy="270" r="2" fill="hsl(220, 70%, 50%)" />
          
          {/* Tuscany */}
          <circle cx="570" cy="145" r="4" fill="hsl(220, 70%, 50%)" opacity="0.8">
            <animate attributeName="r" values="4;6;4" dur="3.2s" repeatCount="indefinite" begin="1.5s" />
            <animate attributeName="opacity" values="0.8;0.4;0.8" dur="3.2s" repeatCount="indefinite" begin="1.5s" />
          </circle>
          <circle cx="570" cy="145" r="2" fill="hsl(220, 70%, 50%)" />
          
          {/* Caribbean */}
          <circle cx="260" cy="220" r="4" fill="hsl(220, 70%, 50%)" opacity="0.8">
            <animate attributeName="r" values="4;6;4" dur="3.8s" repeatCount="indefinite" begin="2s" />
            <animate attributeName="opacity" values="0.8;0.4;0.8" dur="3.8s" repeatCount="indefinite" begin="2s" />
          </circle>
          <circle cx="260" cy="220" r="2" fill="hsl(220, 70%, 50%)" />
        </g>
      </svg>
    </div>
  );
};
