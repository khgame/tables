import React from 'react';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';

export interface MusicToggleProps {
  className?: string;
  isPlaying?: boolean;
  onToggle?: () => void;
}

export const MusicToggle: React.FC<MusicToggleProps> = ({ className = '', isPlaying: controlledPlaying, onToggle }) => {
  const internal = useBackgroundMusic();
  const isControlled = typeof controlledPlaying === 'boolean' && typeof onToggle === 'function';
  const isPlaying = isControlled ? (controlledPlaying as boolean) : internal.isPlaying;
  const toggle = isControlled ? (onToggle as () => void) : internal.toggle;

  return (
    <button
      type="button"
      onClick={toggle}
      className={[
        'rounded-full border p-2 backdrop-blur transition',
        'shadow-[0_8px_18px_rgba(15,23,42,0.35)] hover:-translate-y-px hover:shadow-[0_12px_24px_rgba(15,23,42,0.45)]',
        isPlaying
          ? 'border-emerald-300/50 bg-emerald-400/20 text-emerald-200 hover:bg-emerald-400/30'
          : 'border-amber-300/50 bg-slate-900/80 text-amber-300/80',
        className
      ].join(' ')}
      title={isPlaying ? '暂停背景音乐' : '播放背景音乐'}
      aria-label="背景音乐开关"
    >
      {/* music icon (note) / muted icon */}
      {isPlaying ? (
        <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M12 3v10.55A4 4 0 1 1 10 17V7h8V3h-6z"/></svg>
      ) : (
        <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M4 9v6h4l5 5V4L8 9H4zm13.5 3a3.5 3.5 0 0 0-2.45 5.95l1.41-1.41A1.5 1.5 0 1 1 18.5 12a1.49 1.49 0 0 1 .95.34l1.42-1.42A3.5 3.5 0 0 0 17.5 12z"/></svg>
      )}
    </button>
  );
};

export default MusicToggle;
