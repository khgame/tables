import React from 'react';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { IconAdjustmentsHorizontal, IconMusic, IconMusicOff, IconVolume, IconVolumeOff } from '@tabler/icons-react';

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
        <IconAdjustmentsHorizontal size={20} stroke={2.0} />
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
            <IconMusic size={20} stroke={2.0} />
          ) : (
            <IconMusicOff size={20} stroke={2.0} />
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
            <IconVolume size={20} stroke={2.0} />
          ) : (
            <IconVolumeOff size={20} stroke={2.0} />
          )}
        </button>
      </div>
    </div>
  );
};

export default AiSettingsTrigger;
