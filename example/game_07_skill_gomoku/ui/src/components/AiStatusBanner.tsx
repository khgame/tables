import React from 'react';
import type { AiScenario } from '../ai/openAiClient';

export interface AiStatusBannerProps {
  status: { scenario: AiScenario['kind'] | null; message: string; reason?: string };
}

const ACCENTS: Record<AiScenario['kind'], { accent: string; background: string }> = {
  stone: {
    accent: 'rgba(148,163,255,0.85)',
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.78) 45%, rgba(71, 85, 105, 0.68) 100%)'
  },
  skill: {
    accent: 'rgba(96,165,250,0.88)',
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(37, 99, 235, 0.82) 55%, rgba(59, 130, 246, 0.72) 100%)'
  },
  card_targeting: {
    accent: 'rgba(125,211,252,0.85)',
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(14, 116, 144, 0.78) 45%, rgba(21, 94, 117, 0.7) 100%)'
  },
  counter_window: {
    accent: 'rgba(251,191,36,0.9)',
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(55, 65, 81, 0.78) 45%, rgba(120, 53, 15, 0.6) 100%)'
  },
  mulligan: {
    accent: 'rgba(252,211,77,0.92)',
    background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.92) 0%, rgba(59, 130, 246, 0.82) 100%)'
  }
};

export const AiStatusBanner: React.FC<AiStatusBannerProps> = ({ status }) => {
  if (!status.scenario || !status.message) return null;

  const visuals = ACCENTS[status.scenario] ?? ACCENTS.stone;

  return (
    <div
      className="fixed left-1/2 top-4 z-[120] flex -translate-x-1/2 items-center gap-3 rounded-full border px-5 py-2 text-sm tracking-wide text-slate-100 shadow-[0_18px_42px_rgba(10,12,28,0.35)] backdrop-blur-md"
      style={{
        borderColor: visuals.accent,
        background: visuals.background,
        boxShadow: '0 18px 42px rgba(10, 12, 28, 0.35), inset 0 0 0 1px rgba(255,255,255,0.05)'
      }}
    >
      <span
        className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"
        style={{
          borderColor: 'rgba(148, 163, 255, 0.18)',
          borderTopColor: visuals.accent
        }}
        aria-hidden
      />
      <span className="flex flex-col gap-0.5 text-left leading-tight">
        <span className="font-medium">{status.message}</span>
        {status.reason && <span className="text-xs text-slate-200/80">{status.reason}</span>}
      </span>
    </div>
  );
};
