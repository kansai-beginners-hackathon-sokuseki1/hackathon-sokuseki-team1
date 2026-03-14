import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { THEME_LABELS, THEME_PREVIEW } from './themes';

const BG_TIME_OPTIONS = [
  { value: 'auto',    label: '自動（現在時刻）' },
  { value: 'night',   label: '🌙 夜' },
  { value: 'dawn',    label: '🌄 夜明け' },
  { value: 'morning', label: '🌅 朝' },
  { value: 'noon',    label: '☀ 昼' },
  { value: 'dusk',    label: '🌇 夕方' },
];

export function SettingsModal({ isOpen, onClose, apiSettings, setApiSettings, colorTheme, onThemeChange, bgTimeLock, onBgTimeLockChange }) {
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
    <div className="modal-overlay">
      <div className="rpg-window" style={{
        width: '90%',
        maxWidth: '500px',
        padding: 'var(--spacing-lg)',
      }}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)', borderBottom: '2px solid var(--border-window-inner)', paddingBottom: 'var(--spacing-sm)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)' }}>
            ⚙ 設定
          </h2>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* カラーテーマ */}
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
                    border: isSelected
                      ? '2px solid var(--accent-secondary)'
                      : '2px solid var(--border-window-inner)',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  {/* カラーチップ */}
                  <span style={{
                    display: 'inline-flex',
                    gap: '2px',
                  }}>
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

        {/* 背景時間帯 */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', color: 'var(--accent-primary)' }}>
            ▶ 背景時間帯
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
                    border: isSelected
                      ? '2px solid var(--accent-secondary)'
                      : '2px solid var(--border-window-inner)',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            ※ 固定すると時刻に関わらず選んだ時間帯の背景になります。流れ星は夜のみ表示されます。
          </p>
        </div>

        {/* セパレーター */}
        <div style={{ borderTop: '1px solid var(--border-window-inner)', marginBottom: 'var(--spacing-lg)' }} />

        {/* AI設定 */}
        <p style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', marginBottom: 'var(--spacing-md)' }}>
          ▶ AI連携設定 (OpenRouter)
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
            ※ APIキーはお使いのブラウザのLocal Storageにのみ保存されます。
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
            例: google/gemini-2.5-flash, anthropic/claude-3-haiku, openai/gpt-4o-mini
          </p>
        </div>

        {/* セパレーター */}
        <div style={{ borderTop: '1px solid var(--border-window-inner)', marginBottom: 'var(--spacing-lg)' }} />

        {/* 権利表記（アコーディオン） */}
        <button
          type="button"
          onClick={() => setCreditsOpen(o => !o)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'transparent',
            border: 'none',
            padding: '4px 0',
            cursor: 'pointer',
            color: 'var(--accent-primary)',
            fontSize: '0.8rem',
            marginBottom: creditsOpen ? 'var(--spacing-md)' : 'var(--spacing-lg)',
          }}
        >
          <span>▶ 権利表記・クレジット</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{creditsOpen ? '▲ 閉じる' : '▼ 開く'}</span>
        </button>
        {creditsOpen && (
          <div style={{
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            lineHeight: 1.9,
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid var(--border-window-inner)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            marginBottom: 'var(--spacing-lg)',
          }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>🔊 効果音</span>
            </div>
            <div>
              OtoLogic（<span style={{ color: 'var(--accent-primary)' }}>https://otologic.jp</span>）
            </div>
            <div style={{ marginTop: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              本アプリの効果音素材はOtoLogicが提供するフリー素材を使用しています。<br />
              素材の著作権はOtoLogicに帰属します。素材の二次配布・再販売は禁止されています。
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
