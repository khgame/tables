import React, { useId } from 'react';
import type { RawCard } from '../types';
import { CARD_TYPE_PALETTES } from './CardFrame';

interface ArtworkProps {
  palette: typeof CARD_TYPE_PALETTES[keyof typeof CARD_TYPE_PALETTES];
}

const withCanvas =
  (
    draw: (
      palette: ArtworkProps['palette'],
      ids: Record<string, string>
    ) => React.ReactNode
  ): React.FC<ArtworkProps> =>
  ({ palette }) => {
    const unique = useId().replace(/:/g, '-');
    const ids = {
      a: `grad-a-${unique}`,
      b: `grad-b-${unique}`,
      c: `grad-c-${unique}`,
      d: `grad-d-${unique}`,
      e: `grad-e-${unique}`,
      glow: `glow-${unique}`
    };
    return (
      <svg viewBox="0 0 220 220" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {draw(palette, ids)}
      </svg>
    );
  };

const SandstormArt = withCanvas((palette, ids) => (
  <>
    <defs>
      <radialGradient id={ids.a} cx="50%" cy="45%" r="70%">
        <stop offset="0%" stopColor="#fed7aa" />
        <stop offset="45%" stopColor={palette.core} />
        <stop offset="100%" stopColor="#3f1e05" />
      </radialGradient>
      <linearGradient id={ids.b} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#fcd34d" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    <rect width="220" height="220" rx="26" fill={`url(#${ids.a})`} />
    <g opacity={0.9}>
      <path
        d="M8 126C24 116 60 134 96 122C132 110 152 76 190 76C210 76 220 88 220 88V144C220 144 208 158 178 160C136 162 108 202 70 198C40 194 6 156 6 156Z"
        fill="rgba(255,255,255,0.12)"
      />
      <path
        d="M-8 168C24 140 84 172 124 142C158 118 190 112 220 124V196C196 214 152 222 104 214C60 204 18 198 -8 168Z"
        fill="rgba(241,182,76,0.32)"
      />
    </g>
    <g opacity={0.75}>
      <path
        d="M32 58C62 36 100 54 124 40C148 26 170 22 190 30C210 38 220 60 220 60V92C188 68 152 86 120 104C88 122 40 114 28 102Z"
        fill="rgba(255,237,213,0.35)"
      />
    </g>
    <path
      d="M-4 74C12 50 38 38 74 48C110 58 136 92 172 88C204 82 220 40 220 40V18C204 4 184 -4 158 4C110 18 62 8 24 22C2 30 -10 46 -4 74Z"
      fill={`url(#${ids.b})`}
    />
    <g opacity={0.75} stroke="rgba(255,255,255,0.4)" strokeWidth={2} strokeLinecap="round">
      <path d="M28 152C68 126 100 168 140 146C172 128 188 108 220 116" />
      <path d="M10 122C58 86 108 142 152 108" opacity={0.6} />
      <path d="M16 92C52 56 108 108 166 72" opacity={0.45} />
    </g>
  </>
));

const TimeFreezeArt = withCanvas((palette, ids) => (
  <>
    <defs>
      <radialGradient id={ids.a} cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor="#ecfeff" />
        <stop offset="60%" stopColor={palette.core} />
        <stop offset="100%" stopColor="#0c1d3a" />
      </radialGradient>
      <linearGradient id={ids.b} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    <rect width="220" height="220" rx="26" fill={`url(#${ids.a})`} />
    <g opacity={0.6} stroke="rgba(255,255,255,0.8)" strokeWidth={2}>
      <circle cx="110" cy="110" r="70" fill="none" />
      <circle cx="110" cy="110" r="46" fill="none" opacity={0.7} />
      <path d="M110 46V110L158 136" strokeWidth={5} strokeLinecap="round" />
    </g>
    <g opacity={0.4}>
      <path
        d="M24 54C60 30 96 26 134 40C172 54 212 54 220 64V96C176 80 142 110 112 130C82 150 34 144 20 116Z"
        fill={`url(#${ids.b})`}
      />
      <path
        d="M12 170C48 142 98 170 132 150C166 130 180 120 220 132V198C190 214 150 214 108 208C66 202 34 202 12 170Z"
        fill="rgba(129,212,250,0.35)"
      />
    </g>
    <g opacity={0.6}>
      <path
        d="M60 34L86 28L108 22L126 28L156 34L170 60L186 76L170 96L158 120L126 134L112 150L88 138L60 128L54 94L40 64Z"
        fill="rgba(255,255,255,0.18)"
      />
    </g>
  </>
));

const InstantWinArt = withCanvas((palette, ids) => (
  <>
    <defs>
      <linearGradient id={ids.a} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#fff7ed" />
        <stop offset="40%" stopColor={palette.edge} />
        <stop offset="100%" stopColor="#3b0211" />
      </linearGradient>
      <radialGradient id={ids.b} cx="50%" cy="40%" r="70%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="60%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#451a03" />
      </radialGradient>
      <linearGradient id={ids.c} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde68a" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#fb923c" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    <rect width="220" height="220" rx="26" fill={`url(#${ids.a})`} />
    <g opacity={0.45}>
      <circle cx="110" cy="120" r="72" fill={`url(#${ids.b})`} />
    </g>
    <g>
      <path
        d="M14 146C54 128 90 160 122 142C154 124 184 80 220 94V146C190 154 168 182 144 196C120 210 84 212 60 198C42 188 14 172 14 172Z"
        fill="rgba(255,255,255,0.18)"
      />
      <path
        d="M10 84C36 64 62 56 98 66C134 76 162 108 198 94C214 88 220 70 220 70V40C192 24 164 24 130 40C96 56 78 60 50 52C22 44 8 58 8 58Z"
        fill={`url(#${ids.c})`}
      />
    </g>
    <path
      d="M34 198L74 112L108 160L150 70L186 162L210 106L220 130L194 198Z"
      fill="rgba(254,240,138,0.65)"
      stroke="rgba(255,255,255,0.5)"
      strokeWidth={4}
      strokeLinejoin="round"
    />
  </>
));

const CleanSweepArt = withCanvas((palette, ids) => (
  <>
    <defs>
      <radialGradient id={ids.a} cx="50%" cy="60%" r="70%">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="45%" stopColor={palette.core} />
        <stop offset="100%" stopColor="#1f1302" />
      </radialGradient>
      <linearGradient id={ids.b} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fff7ed" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.08" />
      </linearGradient>
      <linearGradient id={ids.c} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffedd5" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>
    <rect width="220" height="220" rx="26" fill={`url(#${ids.a})`} />
    <path
      d="M24 182C48 158 86 186 110 162C134 138 168 130 202 138C214 140 220 162 220 162V200C202 216 180 222 152 216C102 208 48 220 24 200Z"
      fill={`url(#${ids.b})`}
    />
    <g opacity={0.8}>
      <path
        d="M80 48L124 24L140 44L104 72Z"
        fill="rgba(255,255,255,0.35)"
      />
      <path
        d="M72 72L124 32L204 124L120 184C120 184 60 152 48 120C36 88 72 72 72 72Z"
        fill={`url(#${ids.c})`}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path
        d="M84 96L108 122"
        stroke="#fff7ed"
        strokeWidth={6}
        strokeLinecap="round"
      />
      <path
        d="M150 122C150 122 162 108 170 102"
        stroke="#fde68a"
        strokeWidth={6}
        strokeLinecap="round"
      />
    </g>
    <g opacity={0.35}>
      <path
        d="M18 100C46 78 88 96 120 80C152 64 182 44 220 64V84C184 80 162 104 132 120C102 136 40 138 18 130Z"
        fill="rgba(255,255,255,0.22)"
      />
    </g>
  </>
));

const BaseballArt = withCanvas((palette, ids) => (
  <>
    <defs>
      <radialGradient id={ids.a} cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor="#ffe4e6" />
        <stop offset="45%" stopColor={palette.core} />
        <stop offset="100%" stopColor="#2b0c02" />
      </radialGradient>
      <linearGradient id={ids.b} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#ea580c" stopOpacity="0.12" />
      </linearGradient>
    </defs>
    <rect width="220" height="220" rx="26" fill={`url(#${ids.a})`} />
    <g opacity={0.82}>
      <circle cx="162" cy="82" r="34" fill="#fef2f2" stroke="#991b1b" strokeWidth={4} />
      <path
        d="M140 72C152 80 154 98 166 104"
        stroke="#991b1b"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <path
        d="M160 108C168 96 186 94 192 80"
        stroke="#991b1b"
        strokeWidth={4}
        strokeLinecap="round"
      />
    </g>
    <g opacity={0.75}>
      <path
        d="M34 164C74 126 114 152 154 120L182 148L116 206C90 218 58 212 34 192C18 178 26 172 34 164Z"
        fill="rgba(255,255,255,0.18)"
      />
      <path
        d="M22 142C50 110 98 128 130 100C154 78 170 70 190 76C208 82 220 94 220 94L218 136C184 122 158 142 130 158C102 174 44 178 22 166Z"
        fill={`url(#${ids.b})`}
      />
    </g>
  </>
));

const TimeRewindArt = withCanvas((palette, ids) => (
  <>
    <defs>
      <radialGradient id={ids.a} cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor="#f0f9ff" />
        <stop offset="42%" stopColor={palette.core} />
        <stop offset="100%" stopColor="#04122f" />
      </radialGradient>
      <linearGradient id={ids.b} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.08" />
      </linearGradient>
    </defs>
    <rect width="220" height="220" rx="26" fill={`url(#${ids.a})`} />
    <g opacity={0.8}>
      <path
        d="M110 44C150 44 182 76 182 116C182 156 150 188 110 188C70 188 38 156 38 116H60C60 144 82 166 110 166C138 166 160 144 160 116C160 88 138 66 110 66C96 66 84 72 74 82L102 110H38V46L64 72C78 56 96 44 110 44Z"
        fill="rgba(255,255,255,0.75)"
      />
    </g>
    <g opacity={0.5}>
      <path
        d="M16 74C48 46 98 64 130 40C162 16 186 4 220 22V54C178 44 150 70 120 92C90 114 46 120 16 108Z"
        fill="rgba(255,255,255,0.16)"
      />
      <path
        d="M10 144C42 112 100 134 134 112C162 94 182 92 220 108V184C186 202 152 208 112 200C72 192 42 188 10 144Z"
        fill={`url(#${ids.b})`}
      />
    </g>
  </>
));

const DistractArt = withCanvas((palette, ids) => (
  <>
    <defs>
      <radialGradient id={ids.a} cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor="#e0e7ff" />
        <stop offset="50%" stopColor={palette.core} />
        <stop offset="100%" stopColor="#130a2a" />
      </radialGradient>
      <linearGradient id={ids.b} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbcfe8" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#f472b6" stopOpacity="0.08" />
      </linearGradient>
    </defs>
    <rect width="220" height="220" rx="26" fill={`url(#${ids.a})`} />
    <g opacity={0.75}>
      <path
        d="M42 80C58 56 86 42 112 48C138 54 160 78 184 78C208 78 220 54 220 54V104C184 108 162 142 132 156C102 170 58 170 36 146C18 128 30 96 42 80Z"
        fill="rgba(255,255,255,0.2)"
      />
      <path
        d="M10 148C30 118 62 134 92 124C122 114 150 94 182 100C208 104 220 130 220 130V194C188 206 158 204 126 198C94 192 50 198 10 148Z"
        fill={`url(#${ids.b})`}
      />
    </g>
    <g transform="translate(60 60)" opacity={0.85}>
      <path
        d="M50 0C22 0 0 22 0 50C0 78 22 100 50 100C78 100 100 78 100 50C100 22 78 0 50 0ZM50 18C66 18 78 30 78 46C78 58 70 66 58 72C46 78 32 82 32 96C32 96 32 96 32 96C18 88 10 70 10 50C10 30 24 18 50 18Z"
        fill="rgba(255,255,255,0.75)"
      />
      <circle cx="50" cy="50" r="14" fill="rgba(255,255,255,0.85)" />
    </g>
  </>
));

const RetrieveArt = withCanvas((palette, ids) => (
  <>
    <defs>
      <radialGradient id={ids.a} cx="50%" cy="55%" r="70%">
        <stop offset="0%" stopColor="#ecfccb" />
        <stop offset="45%" stopColor={palette.core} />
        <stop offset="100%" stopColor="#0a1a36" />
      </radialGradient>
      <linearGradient id={ids.b} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f0fdf4" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    <rect width="220" height="220" rx="26" fill={`url(#${ids.a})`} />
    <g opacity={0.78}>
      <path
        d="M44 112C60 86 100 66 120 76C140 86 138 112 160 116C176 118 184 116 200 104C208 98 216 100 220 108V160C204 170 162 182 128 174C94 166 66 156 42 176C30 186 10 170 18 154C24 142 32 126 44 112Z"
        fill={`url(#${ids.b})`}
      />
      <path
        d="M56 62C88 44 128 54 150 44C172 34 184 22 220 32V64C190 60 168 84 138 96C108 108 70 108 46 96C34 90 40 70 56 62Z"
        fill="rgba(255,255,255,0.2)"
      />
    </g>
    <g opacity={0.85} stroke="#f7fee7" strokeWidth={6} strokeLinecap="round">
      <path d="M78 144L102 180" />
      <path d="M134 132L156 166" />
      <path d="M96 162C112 150 134 138 160 142" />
    </g>
  </>
));

const SeizeArt = withCanvas((palette, ids) => (
  <>
    <defs>
      <radialGradient id={ids.a} cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor="#f5f3ff" />
        <stop offset="50%" stopColor={palette.core} />
        <stop offset="100%" stopColor="#22093b" />
      </radialGradient>
      <linearGradient id={ids.b} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ede9fe" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    <rect width="220" height="220" rx="26" fill={`url(#${ids.a})`} />
    <g opacity={0.85}>
      <path
        d="M38 88C54 64 88 46 112 54C136 62 140 90 154 96C168 102 194 94 212 108C220 114 220 124 220 132C220 150 204 170 188 178C150 198 98 186 64 204C44 214 18 196 22 170C26 146 28 120 38 88Z"
        fill={`url(#${ids.b})`}
      />
    </g>
    <g opacity={0.9}>
      <path
        d="M70 136C74 150 98 166 110 158C122 150 132 136 142 126C154 114 162 102 172 100C182 98 190 102 196 106C200 110 202 114 204 118C210 130 208 146 198 160C180 186 138 200 108 196C78 192 58 162 58 146C58 136 66 132 70 136Z"
        fill="rgba(255,255,255,0.24)"
      />
      <path
        d="M88 134C94 118 112 104 118 90"
        stroke="#f5f3ff"
        strokeWidth={6}
        strokeLinecap="round"
      />
      <path
        d="M142 122C148 110 164 96 174 92"
        stroke="#f5f3ff"
        strokeWidth={6}
        strokeLinecap="round"
      />
    </g>
  </>
));

const ThawArt = withCanvas((palette, ids) => (
  <>
    <defs>
      <radialGradient id={ids.a} cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor="#e0f2fe" />
        <stop offset="50%" stopColor={palette.core} />
        <stop offset="100%" stopColor="#03172f" />
      </radialGradient>
      <linearGradient id={ids.b} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    <rect width="220" height="220" rx="26" fill={`url(#${ids.a})`} />
    <g opacity={0.8}>
      <path
        d="M32 190C56 164 90 184 112 166C134 148 162 122 194 126C212 128 220 142 220 142V186C198 198 168 202 134 200C100 198 70 212 32 190Z"
        fill={`url(#${ids.b})`}
      />
      <path
        d="M24 66C52 38 94 58 128 42C162 26 178 26 206 40C214 44 220 60 220 60V108C190 104 162 126 132 144C102 162 52 160 32 134C18 114 20 84 24 66Z"
        fill="rgba(255,255,255,0.2)"
      />
    </g>
    <g opacity={0.85} stroke="#e0f2fe" strokeWidth={6} strokeLinecap="round">
      <path d="M70 132L94 174" />
      <path d="M118 112L138 152" />
      <path d="M154 128L174 156" />
    </g>
  </>
));

const ReverseWinArt = withCanvas((palette, ids) => (
  <>
    <defs>
      <radialGradient id={ids.a} cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor="#fce7f3" />
        <stop offset="45%" stopColor={palette.core} />
        <stop offset="100%" stopColor="#180820" />
      </radialGradient>
      <linearGradient id={ids.b} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbcfe8" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#c084fc" stopOpacity="0.12" />
      </linearGradient>
    </defs>
    <rect width="220" height="220" rx="26" fill={`url(#${ids.a})`} />
    <g opacity={0.8}>
      <path
        d="M14 74C44 52 74 66 106 48C138 30 164 16 202 28C214 32 220 50 220 50V92C194 88 168 108 140 122C112 136 74 152 44 146C18 142 8 116 14 74Z"
        fill="rgba(255,255,255,0.2)"
      />
    </g>
    <g opacity={0.85}>
      <path
        d="M26 166C54 130 96 156 134 128C158 110 178 102 200 108C220 114 220 136 220 136L218 194C180 210 126 220 72 208C40 200 12 200 26 166Z"
        fill={`url(#${ids.b})`}
      />
      <path
        d="M42 196L94 128L126 162L170 108L212 160L202 206L154 180L126 208L94 182L68 214Z"
        fill="rgba(255,255,255,0.18)"
      />
    </g>
  </>
));

const RestoreBoardArt = withCanvas((palette, ids) => (
  <>
    <defs>
      <radialGradient id={ids.a} cx="50%" cy="55%" r="70%">
        <stop offset="0%" stopColor="#f0fdf4" />
        <stop offset="45%" stopColor={palette.core} />
        <stop offset="100%" stopColor="#042012" />
      </radialGradient>
      <linearGradient id={ids.b} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#bbf7d0" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#4ade80" stopOpacity="0.08" />
      </linearGradient>
    </defs>
    <rect width="220" height="220" rx="26" fill={`url(#${ids.a})`} />
    <g opacity={0.8}>
      <path
        d="M10 90C26 62 54 50 88 58C122 66 142 100 176 102C198 102 220 90 220 90V128C190 128 172 148 148 160C124 172 90 178 62 166C22 150 -6 130 10 90Z"
        fill="rgba(255,255,255,0.2)"
      />
      <path
        d="M16 152C54 126 82 162 120 142C158 122 182 108 220 116V180C196 214 156 220 110 214C64 208 26 214 16 152Z"
        fill={`url(#${ids.b})`}
      />
    </g>
    <g opacity={0.75} stroke="#dcfce7" strokeWidth={6} strokeLinecap="round">
      <path d="M42 140L64 168" />
      <path d="M74 122L96 150" />
      <path d="M108 104L130 140" />
      <path d="M148 116L170 144" />
    </g>
    <rect x="44" y="70" width="132" height="80" rx="14" stroke="#dcfce7" strokeWidth={4} fill="none" opacity={0.45} />
  </>
));

const ShoutArt = withCanvas((palette, ids) => (
  <>
    <defs>
      <radialGradient id={ids.a} cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor="#ffe6e6" />
        <stop offset="45%" stopColor={palette.core} />
        <stop offset="100%" stopColor="#2b0208" />
      </radialGradient>
      <linearGradient id={ids.b} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fecaca" stopOpacity="0.65" />
        <stop offset="100%" stopColor="#f87171" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    <rect width="220" height="220" rx="26" fill={`url(#${ids.a})`} />
    <g opacity={0.8}>
      <path
        d="M14 82C48 56 82 62 120 54C158 46 180 22 220 36V90C190 82 154 102 124 120C94 138 56 142 26 132C4 124 2 102 14 82Z"
        fill="rgba(255,255,255,0.22)"
      />
      <path
        d="M20 134C56 116 84 154 122 134C160 114 188 100 220 106V180C194 210 154 220 108 212C62 204 22 204 20 134Z"
        fill={`url(#${ids.b})`}
      />
    </g>
    <g opacity={0.9}>
      <path
        d="M54 140L96 72L146 126L204 88L188 158L130 140L94 176Z"
        fill="rgba(255,255,255,0.2)"
      />
    </g>
  </>
));

const PunishArt = withCanvas((palette, ids) => (
  <>
    <defs>
      <radialGradient id={ids.a} cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor="#ffedd5" />
        <stop offset="45%" stopColor={palette.core} />
        <stop offset="100%" stopColor="#2c0404" />
      </radialGradient>
      <linearGradient id={ids.b} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde68a" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    <rect width="220" height="220" rx="26" fill={`url(#${ids.a})`} />
    <g opacity={0.78}>
      <path
        d="M12 76C42 48 76 62 108 48C140 34 168 16 202 24C214 28 220 48 220 48V96C194 92 164 108 138 124C112 140 78 152 48 144C14 134 0 100 12 76Z"
        fill="rgba(255,255,255,0.16)"
      />
      <path
        d="M10 138C36 106 88 134 126 110C154 92 178 86 202 92C216 96 220 110 220 126V198C190 216 150 220 108 210C66 200 28 200 10 138Z"
        fill={`url(#${ids.b})`}
      />
    </g>
    <g opacity={0.9}>
      <path
        d="M78 118L96 146L74 174L102 190L132 160L154 192L180 174L154 118Z"
        fill="rgba(255,255,255,0.22)"
      />
      <path
        d="M128 86C136 74 154 66 164 70C174 74 176 86 168 100C160 114 138 122 130 118C120 114 122 98 128 86Z"
        fill="rgba(255,255,255,0.18)"
      />
    </g>
  </>
));

const SummonArt = withCanvas((palette, ids) => (
  <>
    <defs>
      <radialGradient id={ids.a} cx="50%" cy="50%" r="72%">
        <stop offset="0%" stopColor="#dbeafe" />
        <stop offset="46%" stopColor={palette.core} />
        <stop offset="100%" stopColor="#051c3a" />
      </radialGradient>
      <linearGradient id={ids.b} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.65" />
        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.12" />
      </linearGradient>
    </defs>
    <rect width="220" height="220" rx="26" fill={`url(#${ids.a})`} />
    <g opacity={0.9}>
      <path
        d="M110 48C138 48 164 72 164 102C164 132 138 156 110 156C82 156 56 132 56 102C56 72 82 48 110 48Z"
        fill="rgba(255,255,255,0.18)"
      />
      <path
        d="M12 144C40 118 80 134 116 110C152 86 188 70 220 88V164C182 206 130 214 82 204C48 196 10 196 12 144Z"
        fill={`url(#${ids.b})`}
      />
      <path
        d="M106 172C120 146 140 148 158 120L190 144L168 182L152 214L118 204L88 214L70 182L86 150Z"
        fill="rgba(255,255,255,0.22)"
      />
    </g>
    <g opacity={0.5}>
      <path
        d="M14 74C52 56 78 70 110 58C142 46 170 22 198 28C210 30 220 40 220 58C220 82 198 96 176 98C154 100 114 114 90 110C66 106 24 92 12 88Z"
        fill="rgba(255,255,255,0.22)"
      />
    </g>
  </>
));

const ForceExitArt = withCanvas((palette, ids) => (
  <>
    <defs>
      <radialGradient id={ids.a} cx="50%" cy="52%" r="72%">
        <stop offset="0%" stopColor="#dbeafe" />
        <stop offset="50%" stopColor={palette.core} />
        <stop offset="100%" stopColor="#031930" />
      </radialGradient>
      <linearGradient id={ids.b} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.12" />
      </linearGradient>
    </defs>
    <rect width="220" height="220" rx="26" fill={`url(#${ids.a})`} />
    <g opacity={0.82}>
      <path
        d="M24 110C40 84 64 66 98 74C132 82 168 122 200 116C216 112 220 92 220 92V74C194 54 164 52 134 68C104 84 74 86 50 78C26 70 20 76 12 90C8 98 8 114 24 110Z"
        fill="rgba(255,255,255,0.2)"
      />
      <path
        d="M12 150C40 126 78 140 110 120C142 100 178 96 204 110C216 116 220 132 220 142V198C198 210 158 214 116 206C74 198 28 206 12 150Z"
        fill={`url(#${ids.b})`}
      />
    </g>
    <g opacity={0.85}>
      <path
        d="M68 98L126 160L188 94L204 114L154 184H98L40 114Z"
        fill="rgba(255,255,255,0.22)"
      />
      <path
        d="M132 98L158 72"
        stroke="#bfdbfe"
        strokeWidth={5}
        strokeLinecap="round"
      />
    </g>
  </>
));

const defaultArtByType: Record<string, React.FC<ArtworkProps>> = {
  Attack: SandstormArt,
  Control: TimeFreezeArt,
  Counter: ReverseWinArt,
  Support: SummonArt
};

const artByTid: Record<number, React.FC<ArtworkProps>> = {
  1001: SandstormArt,
  1002: TimeFreezeArt,
  1003: InstantWinArt,
  1004: CleanSweepArt,
  1005: BaseballArt,
  1006: TimeRewindArt,
  1007: DistractArt,
  1008: RetrieveArt,
  1009: SeizeArt,
  1010: ThawArt,
  1011: ReverseWinArt,
  1012: RestoreBoardArt,
  1013: ShoutArt,
  1014: PunishArt,
  1015: SummonArt,
  1016: ForceExitArt
};

export const CardArtwork: React.FC<{ card: RawCard }> = ({ card }) => {
  const palette = CARD_TYPE_PALETTES[card.type] ?? CARD_TYPE_PALETTES.Attack;
  const tid = Number(card._tid ?? card.tid ?? 0);
  const Art = artByTid[tid] ?? defaultArtByType[card.type] ?? SandstormArt;
  return (
    <div className="card-art">
      <Art palette={palette} />
    </div>
  );
};
