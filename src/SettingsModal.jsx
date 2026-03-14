import React, { useState } from 'react';
import { X, Save, Settings } from 'lucide-react';

export function SettingsModal({ isOpen, onClose, apiSettings, setApiSettings }) {
  const [keyInput, setKeyInput] = useState(apiSettings.apiKey);
  const [modelInput, setModelInput] = useState(apiSettings.modelName || 'google/gemini-2.5-flash');

  if (!isOpen) return null;

  const handleSave = () => {
    setApiSettings({
      apiKey: keyInput.trim(),
      modelName: modelInput.trim()
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="rpg-window" style={{
        width: '90%',
        maxWidth: '500px',
        padding: 'var(--spacing-lg)',
      }}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)', borderBottom: '2px solid var(--border-window-inner)', paddingBottom: 'var(--spacing-sm)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)' }}>
            ⚙ AI連携設定 (OpenRouter)
          </h2>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', color: 'var(--accent-primary)' }}>
            ▶ OpenRouter API Key
          </label>
          <input
            type="text"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="sk-or-v1-..."
            style={{ fontFamily: 'monospace' }}
          />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            ※ APIキーはお使いのブラウザのLocal Storageにのみ保存されます。
          </p>
        </div>

        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', color: 'var(--accent-primary)' }}>
            ▶ Model Name (OpenRouter Identifier)
          </label>
          <input
            type="text"
            value={modelInput}
            onChange={(e) => setModelInput(e.target.value)}
            placeholder="google/gemini-2.5-flash"
          />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            例: google/gemini-2.5-flash, anthropic/claude-3-haiku, openai/gpt-4o-mini
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
          <button onClick={onClose} className="btn-icon" style={{ padding: '8px 16px', border: '2px solid var(--text-muted)' }}>
            キャンセル
          </button>
          <button onClick={handleSave} className="btn-primary">
            <Save size={18} />
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}
