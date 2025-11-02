import React, { useEffect, useState } from 'react';
import type { AiSettings } from '../ai/openAiClient';
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
      fastModel: base.fastModel || DEFAULT_MODEL
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
    <div className="ai-settings__backdrop" role="dialog" aria-modal="true">
      <div className="ai-settings__panel">
        <header className="ai-settings__header">
          <h2>AI 配置</h2>
          <button type="button" className="ai-settings__close" onClick={onClose}>
            ×
          </button>
        </header>
        <form className="ai-settings__form" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">推荐默认：火山方舟 Doubao</span>
            <button type="button" className="ai-settings__button ai-settings__button--ghost" onClick={applyDefaults}>
              使用默认
            </button>
          </div>
          <label className="ai-settings__field">
            <span>API Endpoint</span>
            <input
              type="url"
              placeholder={DEFAULT_AI_ENDPOINT}
              value={localSettings.endpoint}
              onChange={event => update({ endpoint: event.target.value })}
              required
            />
          </label>
          <label className="ai-settings__field">
            <span>推理模型 (技能/复杂场景)</span>
            <input
              type="text"
              placeholder={DEFAULT_MODEL}
              value={localSettings.reasoningModel}
              onChange={event => update({ reasoningModel: event.target.value })}
              required
            />
          </label>
          <label className="ai-settings__field">
            <span>快速模型 (落子决策)</span>
            <input
              type="text"
              placeholder={DEFAULT_MODEL}
              value={localSettings.fastModel}
              onChange={event => update({ fastModel: event.target.value })}
            />
          </label>
          <label className="ai-settings__field">
            <span>API Key (可留空, 将使用无鉴权请求)</span>
            <input
              type="password"
              placeholder="sk-..."
              value={localSettings.apiKey}
              onChange={event => update({ apiKey: event.target.value })}
            />
          </label>
          <footer className="ai-settings__footer">
            <button type="button" className="ai-settings__button ai-settings__button--ghost" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="ai-settings__button ai-settings__button--primary">
              保存
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
