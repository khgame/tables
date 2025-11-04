import React from 'react';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import { useSoundEffects } from '../hooks/useSoundEffects';

export interface AiSettingsTriggerProps {
  onOpen: (open: boolean) => void;
  hasConfig: boolean;
}

/**
 * Fixed top-right trigger button for opening AI settings dialog.
 * Replaces previous CSS (.ai-settings__trigger) with Tailwind utilities.
 */
export const AiSettingsTrigger: React.FC<AiSettingsTriggerProps> = ({ onOpen, hasConfig }) => {
  const bgm = useBackgroundMusic();
  const sfx = useSoundEffects();

  const btnBase = 'rounded-full border p-2 backdrop-blur transition shadow-[0_8px_18px_rgba(15,23,42,0.35)] hover:-translate-y-px hover:shadow-[0_12px_24px_rgba(15,23,42,0.45)]';
  const ready = 'border-emerald-300/50 bg-emerald-400/20 text-emerald-200 hover:bg-emerald-400/30';
  const idle  = 'border-amber-300/50 bg-slate-900/80 text-amber-300/80';

  return (
    <div className="fixed right-6 top-6 z-20 flex flex-col items-end gap-2 select-none">
      {/* Settings button: swap to sliders icon for better affordance */}
      <button
        type="button"
        onClick={() => onOpen(true)}
        className={[btnBase, hasConfig ? ready : idle].join(' ')}
        title="AI 设置"
        aria-label="AI 设置"
      >
        {/* sliders icon */}
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
          <path fill="currentColor" d="M10 5a2 2 0 114 0h6v2h-6a2 2 0 11-4 0H4V5h6zm-6 7h8a2 2 0 114 0h4v2h-4a2 2 0 11-4 0H4v-2zm0 7h2a2 2 0 114 0h14v2H6a2 2 0 11-4 0v-2z"/>
        </svg>
      </button>

      {/* Quick audio toggles */}
      <div className="flex flex-col items-end gap-2">
        {/* Music toggle */}
        <button
          type="button"
          onClick={() => (bgm.isPlaying ? bgm.pause() : bgm.play())}
          className={[btnBase, bgm.isPlaying ? 'border-emerald-300/50 bg-emerald-400/20 text-emerald-200 hover:bg-emerald-400/30' : 'border-slate-300/50 bg-slate-900/80 text-amber-300/80'].join(' ')}
          title={bgm.isPlaying ? '关闭音乐' : '开启音乐'}
          aria-label="音乐开关"
        >
          {bgm.isPlaying ? (
            // note icon
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true"><path fill="currentColor" d="M12 3v10.55A4 4 0 1 1 10 17V7h8V3h-6z"/></svg>
          ) : (
            // note off icon
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 5V4L8 9H4zm13.5 3a3.5 3.5 0 0 0-2.45 5.95l1.41-1.41A1.5 1.5 0 1 1 18.5 12a1.49 1.49 0 0 1 .95.34l1.42-1.42A3.5 3.5 0 0 0 17.5 12z"/></svg>
          )}
        </button>

        {/* SFX toggle */}
        <button
          type="button"
          onClick={() => sfx.setEnabled(!sfx.enabled)}
          className={[btnBase, sfx.enabled ? 'border-emerald-300/50 bg-emerald-400/20 text-emerald-200 hover:bg-emerald-400/30' : 'border-slate-300/50 bg-slate-900/80 text-amber-300/80'].join(' ')}
          title={sfx.enabled ? '关闭音效' : '开启音效'}
          aria-label="音效开关"
        >
          {sfx.enabled ? (
            // speaker icon
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true"><path fill="currentColor" d="M3 10v4h4l5 5V5L7 10H3zm13.5 2a3.5 3.5 0 0 0-3.5 3.5c0 .97.39 1.85 1.02 2.49l1.42-1.42A1.5 1.5 0 1 1 18.5 12a1.49 1.49 0 0 1-.95.34l1.42-1.42A3.5 3.5 0 0 0 16.5 12z"/></svg>
          ) : (
            // speaker off icon
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true"><path fill="currentColor" d="M16.5 12a3.5 3.5 0 0 1 1.83-3.05l1.42-1.42A5.5 5.5 0 0 0 14.5 12c0 1.27.43 2.44 1.14 3.37l1.42-1.42A3.5 3.5 0 0 1 16.5 12zM3 10v4h4l5 5V5L7 10H3zm15.5 7.09L5.91 4.5 4.5 5.91 18.09 19.5l1.41-1.41z"/></svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default AiSettingsTrigger;
