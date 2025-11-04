import React, { useEffect, useState } from 'react';
import type { AiSettings } from '../ai/openAiClient';
import { useBackgroundMusic } from '../app/hooks/useBackgroundMusic';
import { useSoundEffects } from '../app/hooks/useSoundEffects';
export interface AiSettingsPanelProps {
  open: boolean;
  settings: AiSettings;
  onClose: () => void;
  onSave: (settings: AiSettings) => void;
}

const emptySettings: AiSettings = {
  endpoint: '',
  apiKey: '',
  reasoningModel: '',
  fastModel: ''
};

const DEFAULT_AI_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const DEFAULT_MODEL = 'doubao-seed-1-6-251015';

export const AiSettingsPanel: React.FC<AiSettingsPanelProps> = ({ open, settings, onClose, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AiSettings>(settings ?? emptySettings);

  useEffect(() => {
    const base = settings ?? emptySettings;
    // 如果来自存储的配置是空字符串，填充默认值，避免出现空白
    const withDefaults: AiSettings = {
      endpoint: base.endpoint || DEFAULT_AI_ENDPOINT,
      apiKey: base.apiKey || '',
      reasoningModel: base.reasoningModel || DEFAULT_MODEL,
      fastModel: base.fastModel || DEFAULT_MODEL,
      customPrompt: base.customPrompt || ''
    };
    setLocalSettings(withDefaults);
  }, [settings]);

  if (!open) return null;

  const update = (patch: Partial<AiSettings>) => {
    setLocalSettings(prev => ({ ...prev, ...patch }));
  };

  const applyDefaults = () => {
    setLocalSettings({
      endpoint: DEFAULT_AI_ENDPOINT,
      apiKey: '',
      reasoningModel: DEFAULT_MODEL,
      fastModel: DEFAULT_MODEL
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur flex items-center justify-center p-[clamp(1rem,5vw,2.5rem)]" role="dialog" aria-modal="true">
      <div className="w-[min(640px,100%)] rounded-3xl border border-slate-900/10 shadow-[0_24px_60px_rgba(15,23,42,0.35)] bg-gradient-to-b from-slate-50/95 to-slate-200/90 text-slate-900">
        <header className="flex items-center justify-between px-6 pt-5 pb-2">
          <h2 className="text-lg font-bold tracking-[0.08em] uppercase">AI 配置</h2>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-slate-600 hover:text-slate-800">×</button>
        </header>
        <form className="flex flex-col gap-4 px-6 pb-6" onSubmit={handleSubmit}>
          {/* 音频设置 */}
          <fieldset className="rounded-2xl border border-slate-300/60 bg-white/70 p-4">
            <legend className="px-2 text-sm font-semibold text-slate-700">音频设置</legend>
            <AudioSettings />
          </fieldset>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">推荐默认：火山方舟 Doubao</span>
            <button type="button" onClick={applyDefaults} className="rounded-full border border-slate-300 bg-slate-200/60 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-200">
              使用默认
            </button>
          </div>
          <label className="flex flex-col gap-2 text-[0.95rem]">
            <span>自定义白方策略指令（可选）</span>
            <textarea
              className="w-full min-h-[96px] rounded-xl border border-slate-900/20 bg-white/85 px-3 py-2 text-slate-900 shadow-inner"
              placeholder="例如：优先使用冻结技能限制对手；当对手即将成五时优先反击或落子阻挡；更偏好中腹落子。"
              value={localSettings.customPrompt ?? ''}
              onChange={event => update({ customPrompt: event.target.value })}
            />
            <span className="text-[11px] text-slate-600">注：将作为系统指令附加给云端模型，无配置时忽略。</span>
          </label>
          <label className="flex flex-col gap-2 text-[0.95rem]">
            <span>API Endpoint</span>
            <input
              className="w-full rounded-xl border border-slate-900/20 bg-white/85 px-3 py-2 text-slate-900 shadow-inner"
              type="url"
              placeholder={DEFAULT_AI_ENDPOINT}
              value={localSettings.endpoint}
              onChange={event => update({ endpoint: event.target.value })}
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-[0.95rem]">
            <span>推理模型 (技能/复杂场景)</span>
            <input
              className="w-full rounded-xl border border-slate-900/20 bg-white/85 px-3 py-2 text-slate-900 shadow-inner"
              type="text"
              placeholder={DEFAULT_MODEL}
              value={localSettings.reasoningModel}
              onChange={event => update({ reasoningModel: event.target.value })}
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-[0.95rem]">
            <span>快速模型 (落子决策)</span>
            <input
              className="w-full rounded-xl border border-slate-900/20 bg-white/85 px-3 py-2 text-slate-900 shadow-inner"
              type="text"
              placeholder={DEFAULT_MODEL}
              value={localSettings.fastModel}
              onChange={event => update({ fastModel: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-2 text-[0.95rem]">
            <span>API Key (可留空, 将使用无鉴权请求)</span>
            <input
              className="w-full rounded-xl border border-slate-900/20 bg-white/85 px-3 py-2 text-slate-900 shadow-inner"
              type="password"
              placeholder="sk-..."
              value={localSettings.apiKey}
              onChange={event => update({ apiKey: event.target.value })}
            />
          </label>
          <footer className="mt-1 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-full border border-slate-300 bg-slate-200/60 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
              取消
            </button>
            <button type="submit" className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-[0_12px_24px_rgba(30,64,175,0.35)]">
              保存
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default AiSettingsPanel;

const AudioSettings: React.FC = () => {
  const bgm = useBackgroundMusic();
  const sfx = useSoundEffects();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800">背景音乐</span>
        </div>
        <button
          type="button"
          onClick={() => (bgm.isPlaying ? bgm.pause() : bgm.play())}
          className={[
            'rounded-full border px-3 py-1 text-sm font-semibold backdrop-blur',
            bgm.isPlaying ? 'border-emerald-300/60 bg-emerald-200/30 text-emerald-800' : 'border-slate-300/60 bg-slate-200/60 text-slate-700'
          ].join(' ')}
        >
          {bgm.isPlaying ? '开' : '关'}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-700 w-14">音量</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(bgm.volume * 100)}
          onChange={(e) => bgm.setVolume(Math.round(Number(e.target.value)) / 100)}
          className="accent-emerald-400 h-1 flex-1"
        />
        <span className="w-8 text-right text-sm text-slate-600">{Math.round(bgm.volume * 100)}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800">效果音</span>
        </div>
        <button
          type="button"
          onClick={() => sfx.setEnabled(!sfx.enabled)}
          className={[
            'rounded-full border px-3 py-1 text-sm font-semibold backdrop-blur',
            sfx.enabled ? 'border-emerald-300/60 bg-emerald-200/30 text-emerald-800' : 'border-slate-300/60 bg-slate-200/60 text-slate-700'
          ].join(' ')}
        >
          {sfx.enabled ? '开' : '关'}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-700 w-14">音量</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(sfx.volume * 100)}
          onChange={(e) => sfx.setVolume(Math.round(Number(e.target.value)) / 100)}
          className="accent-indigo-400 h-1 flex-1"
        />
        <span className="w-8 text-right text-sm text-slate-600">{Math.round(sfx.volume * 100)}</span>
      </div>
    </div>
  );
};
