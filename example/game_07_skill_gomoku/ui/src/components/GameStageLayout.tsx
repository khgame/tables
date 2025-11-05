import React from 'react';

// Presentational layout for the main game stage
// Extracted from App to keep App slim (state/effects only) and make layout reusable.

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

export interface GameStageLayoutProps {
  // left column overlays
  topHUD: React.ReactNode;
  board: React.ReactNode;
  bottomHUD: React.ReactNode;
  boardBlocked?: boolean;

  // right column
  rightTop: React.ReactNode;
  rightMiddle: React.ReactNode;
  rightBottom: React.ReactNode;
}

export const GameStageLayout: React.FC<GameStageLayoutProps> = ({
  topHUD,
  board,
  bottomHUD,
  boardBlocked = false,
  rightTop,
  rightMiddle,
  rightBottom
}) => {
  return (
    <div className="min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 relative">
      {/* Overlay pattern */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          background:
            'linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.1) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.1) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.1) 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }}
      />

      <div
        className="relative z-[1] rounded-3xl bg-transparent overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
        style={{ width: 'min(1600px, 98vw)', height: '100vh', maxHeight: '100vh', padding: 'clamp(0.4rem, 1vw, 1rem)' }}
      >
        <div
          className="h-full grid"
          style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(300px,360px)', gap: 'clamp(0.6rem,1.2vw,1.6rem)', padding: 'clamp(0.4rem, 1vw, 1rem)' }}
        >
          {/* Left column */}
          <div className="relative h-full min-w-0">
            {/* Board stage with spacing reserved for HUD overlays */}
            <div
              className={cx('absolute inset-0 flex items-center justify-center', boardBlocked && 'animate-board-shudder')}
              style={{ paddingTop: 'clamp(0.8rem, 5vh, 5rem)', paddingBottom: 'clamp(0.8rem, 6vh, 6.5rem)', paddingRight: 'clamp(0.8rem, 6vh, 2rem)' }}
            >
              {/* Ambient glow behind board */}
              <div
                className="absolute inset-[8%] rounded-full opacity-60"
                style={{ background: 'radial-gradient(circle at 50% 50%, rgba(96, 165, 250, 0.08), transparent 70%)', filter: 'blur(40px)' }}
              />

              {/* Board and overlays (draft/selector/pending are expected to be part of this node) */}
              {board}
            </div>

            {/* Top HUD overlay */}
            <div className="absolute left-0 right-0 top-0 pointer-events-none">
              <div className="pointer-events-auto">{topHUD}</div>
            </div>

            {/* Bottom HUD overlay */}
            <div className="absolute left-0 right-0 bottom-0 pointer-events-none">
              <div className="pointer-events-auto">{bottomHUD}</div>
            </div>
          </div>

          {/* Right column */}
          <div className="grid h-full w-[360px] max-w-[380px] min-w-[320px]" style={{ gridTemplateRows: 'auto minmax(0,1fr) auto', rowGap: 'clamp(0.6rem,1vw,1.2rem)' }}>
            <div>{rightTop}</div>
            <div className="min-h-0">{rightMiddle}</div>
            <div>{rightBottom}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameStageLayout;

