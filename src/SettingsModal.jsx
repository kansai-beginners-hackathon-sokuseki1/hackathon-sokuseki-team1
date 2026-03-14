import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { THEME_LABELS, THEME_PREVIEW } from './themes';

const BG_TIME_OPTIONS = [
  { value: 'auto', label: '自動（現在時刻）' },
  { value: 'night', label: '🌙 夜' },
  { value: 'dawn', label: '🌄 夜明け' },
  { value: 'morning', label: '☀ 朝' },
  { value: 'noon', label: '🌞 昼' },
  { value: 'dusk', label: '🌆 夕方' }
];

export function SettingsModal({
  isOpen,
  onClose,
  apiSettings,
  setApiSettings,
  colorTheme,
  onThemeChange,
  bgTimeLock,
  onBgTimeLockChange,
  alertEnabled,
  onAlertEnabledChange
}) {
  const [keyInput, setKeyInput] = useState(apiSettings.apiKey);
  const [modelInput, setModelInput] = useState(apiSettings.modelName || 'google/gemini-2.5-flash');
  const [creditsOpen, setCreditsOpen] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiSettings({
      apiKey: keyInput.trim(),
      modelName: modelInput.trim()
    });
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ alignItems: 'flex-start', overflowY: 'auto', padding: '20px 0' }}>
      <div
        className="rpg-window"
        style={{
          width: '90%',
          maxWidth: '500px',
          padding: 'var(--spacing-lg)',
          margin: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)', borderBottom: '2px solid var(--border-window-inner)', paddingBottom: 'var(--spacing-sm)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)' }}>
            ⚙ 設定
          </h2>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', color: 'var(--accent-primary)' }}>
            ▶ カラーテーマ
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
            {Object.entries(THEME_LABELS).map(([key, label]) => {
              const preview = THEME_PREVIEW[key];
              const isSelected = colorTheme === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onThemeChange(key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    border: isSelected ? '2px solid var(--accent-secondary)' : '2px solid var(--border-window-inner)',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  <span style={{ display: 'inline-flex', gap: '2px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: preview.bg, border: '1px solid rgba(255,255,255,0.3)', display: 'inline-block' }} />
                    <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: preview.accent, display: 'inline-block' }} />
                    <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: preview.text, display: 'inline-block' }} />
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', color: 'var(--accent-primary)' }}>
            ▶ 背景の時間帯
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
            {BG_TIME_OPTIONS.map(({ value, label }) => {
              const isSelected = bgTimeLock === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onBgTimeLockChange(value)}
                  style={{
                    padding: '6px 12px',
                    border: isSelected ? '2px solid var(--accent-secondary)' : '2px solid var(--border-window-inner)',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            自動を選ぶと現在時刻に応じて背景が切り替わります。固定すると指定した時間帯の見た目を確認できます。
          </p>
        </div>

        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', color: 'var(--accent-primary)' }}>
            ▶ 期限アラート
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => onAlertEnabledChange(!alertEnabled)}
              style={{
                padding: '6px 16px',
                border: alertEnabled ? '2px solid var(--accent-secondary)' : '2px solid var(--border-window-inner)',
                borderRadius: 'var(--radius-sm)',
                background: alertEnabled ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: alertEnabled ? 'var(--accent-secondary)' : 'var(--text-muted)',
                fontSize: '0.85rem',
                transition: 'all 0.15s ease',
                minWidth: '80px'
              }}
            >
              {alertEnabled ? '🔔 ON' : '🔕 OFF'}
            </button>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {alertEnabled ? 'ブラウザ通知で期限切れのクエストを知らせます。' : '期限アラートは無効です。'}
            </span>
          </div>
          {alertEnabled && Notification.permission === 'denied' && (
            <p style={{ fontSize: '0.78rem', color: 'var(--danger, #ff6666)', marginTop: '6px' }}>
              通知権限がブラウザで拒否されています。ブラウザ設定から許可してください。
            </p>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border-window-inner)', marginBottom: 'var(--spacing-lg)' }} />

        <p style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', marginBottom: 'var(--spacing-md)' }}>
          ▶ AI 連携設定（OpenRouter）
        </p>

        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            API Key
          </label>
          <input
            type="text"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="sk-or-v1-..."
            style={{ fontFamily: 'monospace' }}
          />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            APIキーはこのブラウザの Local Storage にのみ保存されます。
          </p>
        </div>

        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Model Name (OpenRouter Identifier)
          </label>
          <input
            type="text"
            value={modelInput}
            onChange={(e) => setModelInput(e.target.value)}
            placeholder="google/gemini-2.5-flash"
          />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            例: `google/gemini-2.5-flash`, `anthropic/claude-3-haiku`, `openai/gpt-4o-mini`
          </p>
        </div>

        <div style={{ borderTop: '1px solid var(--border-window-inner)', marginBottom: 'var(--spacing-lg)' }} />

        <button
          type="button"
          onClick={() => setCreditsOpen((open) => !open)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'transparent',
            border: 'none',
            padding: '4px 0',
            color: 'var(--accent-primary)',
            fontSize: '0.8rem',
            marginBottom: creditsOpen ? 'var(--spacing-md)' : 'var(--spacing-lg)'
          }}
        >
          <span>▶ 効果音クレジット</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{creditsOpen ? '▲ 閉じる' : '▼ 開く'}</span>
        </button>

        {creditsOpen && (
          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              lineHeight: 1.9,
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--border-window-inner)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--spacing-sm) var(--spacing-md)',
              marginBottom: 'var(--spacing-lg)'
            }}
          >
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>効果音提供</span>
            </div>
            <div>
              OtoLogic
              {' '}
              <span style={{ color: 'var(--accent-primary)' }}>https://otologic.jp</span>
            </div>
            <div style={{ marginTop: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              本アプリの効果音は OtoLogic のフリー素材を利用しています。
              クレジット表記と利用条件は OtoLogic の案内に従っています。
            </div>
          </div>
        )}

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
