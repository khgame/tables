import React from 'react';

export interface AiSettingsTriggerProps {
  onOpen: (open: boolean) => void;
  hasConfig: boolean;
}

/**
 * Fixed top-right trigger button for opening AI settings dialog.
 * Replaces previous CSS (.ai-settings__trigger) with Tailwind utilities.
 */
export const AiSettingsTrigger: React.FC<AiSettingsTriggerProps> = ({ onOpen, hasConfig }) => {
  const base = 'fixed right-6 top-6 z-20 rounded-full border p-2 backdrop-blur transition ' +
               'shadow-[0_8px_18px_rgba(15,23,42,0.35)] hover:-translate-y-px hover:shadow-[0_12px_24px_rgba(15,23,42,0.45)]';
  const ready = 'border-emerald-300/50 bg-emerald-400/20 text-emerald-200 hover:bg-emerald-400/30';
  const idle  = 'border-amber-300/50 bg-slate-900/80 text-amber-300/80';
  return (
    <button
      type="button"
      onClick={() => onOpen(true)}
      className={[base, hasConfig ? ready : idle].join(' ')}
      title="AI 设置"
      aria-label="AI 设置"
    >
      {/* gear icon */}
      <svg viewBox="0 0 24 24" className="w-5 h-5">
        <path fill="currentColor" d="M12 8a4 4 0 100 8 4 4 0 000-8zm9.94 3.5l-2.12-.49a7.95 7.95 0 00-.73-1.77l1.26-1.77-1.41-1.41-1.77 1.26c-.56-.3-1.16-.54-1.77-.73L14.5 2.06h-2.99l-.49 2.12c-.61.19-1.21.43-1.77.73L7.48 3.65 6.07 5.06l1.26 1.77c-.3.56-.54 1.16-.73 1.77L3.5 9.5v2.99l2.12.49c.19.61.43 1.21.73 1.77l-1.26 1.77 1.41 1.41 1.77-1.26c.56.3 1.16.54 1.77.73l.49 2.12h2.99l.49-2.12c.61-.19 1.21-.43 1.77-.73l1.77 1.26 1.41-1.41-1.26-1.77c.3-.56.54-1.16.73-1.77l2.12-.49V11.5z"/>
      </svg>
    </button>
  );
};

export default AiSettingsTrigger;
