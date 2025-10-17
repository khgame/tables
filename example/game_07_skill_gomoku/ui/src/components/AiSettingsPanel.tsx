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
  model: ''
};

export const AiSettingsPanel: React.FC<AiSettingsPanelProps> = ({ open, settings, onClose, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AiSettings>(settings ?? emptySettings);

  useEffect(() => {
    setLocalSettings(settings ?? emptySettings);
  }, [settings]);

  if (!open) return null;

  const update = (patch: Partial<AiSettings>) => {
    setLocalSettings(prev => ({ ...prev, ...patch }));
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
          <label className="ai-settings__field">
            <span>API Endpoint</span>
            <input
              type="url"
              placeholder="https://api.openai.com/v1/chat/completions"
              value={localSettings.endpoint}
              onChange={event => update({ endpoint: event.target.value })}
              required
            />
          </label>
          <label className="ai-settings__field">
            <span>模型名称</span>
            <input
              type="text"
              placeholder="gpt-4o-mini"
              value={localSettings.model}
              onChange={event => update({ model: event.target.value })}
              required
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
