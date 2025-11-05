import React from 'react';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { IconAdjustmentsHorizontal, IconMusic, IconMusicOff, IconVolume, IconVolumeOff } from '@tabler/icons-react';

export interface AiSettingsTriggerProps {
  onOpen: (open: boolean) => void;
  hasConfig: boolean;
  onOpenCardCollection?: () => void;
}

/**
 * Fixed top-right trigger button for opening AI settings dialog.
 * Replaces previous CSS (.ai-settings__trigger) with Tailwind utilities.
 */
export const AiSettingsTrigger: React.FC<AiSettingsTriggerProps> = ({ onOpen, hasConfig, onOpenCardCollection }) => {
  const bgm = useBackgroundMusic();
  const sfx = useSoundEffects();

  const btnBase = 'rounded-full border p-2 backdrop-blur transition shadow-[0_8px_18px_rgba(15,23,42,0.35)] hover:-translate-y-px hover:shadow-[0_12px_24px_rgba(15,23,42,0.45)]';
  const ready = 'border-emerald-300/50 bg-emerald-400/20 text-emerald-200 hover:bg-emerald-400/30';
  const idle  = 'border-amber-300/50 bg-slate-900/80 text-amber-300/80';

  const labelStyle: React.CSSProperties = { fontSize: '10px', lineHeight: '10px', textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 -1px 2px rgba(0,0,0,0.6)' };
  const Caption: React.FC<{ text: string }> = ({ text }) => (
    <span className="mt-0.5 text-white/95 tracking-[0.2em]" style={labelStyle}>{text}</span>
  );

  return (
    <div className="fixed right-6 top-6 z-20 flex flex-col items-end gap-2 select-none">
      {/* Settings */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => onOpen(true)}
          className={[btnBase, hasConfig ? ready : idle].join(' ')}
          title="AI 设置"
          aria-label="AI 设置"
        >
          <IconAdjustmentsHorizontal size={20} stroke={2.0} />
        </button>
        <Caption text="设置" />
      </div>

      {/* Card Collection */}
      {onOpenCardCollection && (
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={onOpenCardCollection}
            className={[btnBase, 'border-amber-300/50 bg-amber-400/20 text-amber-200 hover:bg-amber-400/30'].join(' ')}
            title="查看卡牌图鉴"
            aria-label="卡牌图鉴"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6m16 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </button>
          <Caption text="图鉴" />
        </div>
      )}

      {/* Music toggle */}
      <div className="flex flex-col items-center">
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
        <Caption text={bgm.isPlaying ? '音乐开' : '音乐关'} />
      </div>

      {/* SFX toggle */}
      <div className="flex flex-col items-center">
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
        <Caption text={sfx.enabled ? '音效开' : '音效关'} />
      </div>
    </div>
  );
};

export default AiSettingsTrigger;
