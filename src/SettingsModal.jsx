import React, { useMemo, useState } from 'react';
import {
  Bell,
  Bot,
  ChevronDown,
  ChevronRight,
  Clock3,
  Info,
  Palette,
  Save,
  X
} from 'lucide-react';
import { THEME_LABELS, THEME_PREVIEW } from './themes';

const BG_TIME_OPTIONS = [
  { value: 'auto', label: '自動', description: '現在時刻に合わせて背景の時間帯を切り替えます。' },
  { value: 'night', label: '夜', description: '星空と月が映える深夜の景色です。' },
  { value: 'dawn', label: '夜明け', description: '朝焼けが差し込む静かな空気を表現します。' },
  { value: 'morning', label: '朝', description: '爽やかな光が入る軽やかな時間帯です。' },
  { value: 'noon', label: '昼', description: '明るく視認性の高い日中の景色です。' },
  { value: 'dusk', label: '夕方', description: '夕焼けが残る少し落ち着いた景色です。' }
];

const TIME_PREVIEW = {
  night: {
    sky: 'linear-gradient(180deg, #041026 0%, #101a45 50%, #1d2858 100%)',
    glow: 'rgba(173, 216, 255, 0.38)',
    orb: '#f4f7ff',
    horizon: 'rgba(133, 153, 255, 0.25)',
    stars: true,
    label: '月と星がはっきり見える時間帯です。'
  },
  dawn: {
    sky: 'linear-gradient(180deg, #26153f 0%, #7f5aa8 48%, #f4b37e 100%)',
    glow: 'rgba(255, 210, 160, 0.42)',
    orb: '#ffe9ba',
    horizon: 'rgba(255, 187, 138, 0.30)',
    stars: true,
    label: '紫から橙へ移る夜明け前後の空です。'
  },
  morning: {
    sky: 'linear-gradient(180deg, #7fd6ff 0%, #a9e4ff 55%, #fff0b5 100%)',
    glow: 'rgba(255, 233, 150, 0.44)',
    orb: '#fff7ce',
    horizon: 'rgba(255, 240, 189, 0.30)',
    stars: false,
    label: 'すっきり明るい朝の雰囲気です。'
  },
  noon: {
    sky: 'linear-gradient(180deg, #4bbcff 0%, #8bddff 55%, #daf7ff 100%)',
    glow: 'rgba(255, 245, 194, 0.48)',
    orb: '#fff4ae',
    horizon: 'rgba(255, 255, 255, 0.22)',
    stars: false,
    label: '最も明るく、コントラストの高い時間帯です。'
  },
  dusk: {
    sky: 'linear-gradient(180deg, #1b2446 0%, #8f4f7f 52%, #f09c6f 100%)',
    glow: 'rgba(255, 176, 120, 0.40)',
    orb: '#ffd7a1',
    horizon: 'rgba(255, 158, 118, 0.30)',
    stars: false,
    label: '夕焼けから夜へ切り替わる穏やかな色味です。'
  }
};

function resolveAutoTime() {
  const hour = new Date().getHours();
  if (hour >= 20 || hour < 5) return 'night';
  if (hour < 7) return 'dawn';
  if (hour < 11) return 'morning';
  if (hour < 15) return 'noon';
  return 'dusk';
}

function Section({ icon, title, isOpen, onToggle, children }) {
  return (
    <section
      style={{
        border: '1px solid var(--border-window-inner)',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(0, 0, 0, 0.16)',
        overflow: 'hidden'
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '12px 14px',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-primary)',
          textAlign: 'left'
        }}
        >
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {React.createElement(icon, { size: 16, style: { color: 'var(--accent-secondary)' } })}
          <span style={{ fontSize: '0.95rem', color: 'var(--accent-primary)' }}>{title}</span>
        </span>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {isOpen && (
        <div
          style={{
            borderTop: '1px solid var(--border-window-inner)',
            padding: '14px'
          }}
        >
          {children}
        </div>
      )}
    </section>
  );
}

function TimePreview({ bgTimeLock }) {
  const resolvedTime = bgTimeLock === 'auto' ? resolveAutoTime() : bgTimeLock;
  const preview = TIME_PREVIEW[resolvedTime];
  const option = BG_TIME_OPTIONS.find(({ value }) => value === bgTimeLock);

  return (
    <div
      style={{
        border: '1px solid var(--border-window-inner)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px',
        background: 'rgba(0, 0, 0, 0.14)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: 'var(--accent-secondary)', fontSize: '0.88rem' }}>背景プレビュー</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem', marginTop: '2px' }}>
            {bgTimeLock === 'auto' ? `自動設定中: 現在は「${BG_TIME_OPTIONS.find(({ value }) => value === resolvedTime)?.label}」` : option?.description}
          </div>
        </div>
        <div
          style={{
            alignSelf: 'flex-start',
            padding: '4px 8px',
            borderRadius: '999px',
            border: '1px solid var(--border-window-inner)',
            color: 'var(--text-secondary)',
            fontSize: '0.74rem'
          }}
        >
          {option?.label}
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          height: '140px',
          borderRadius: '12px',
          overflow: 'hidden',
          background: preview.sky,
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: 'inset 0 0 18px rgba(0,0,0,0.18)'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '18px',
            right: '20px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: preview.orb,
            boxShadow: `0 0 22px ${preview.glow}`
          }}
        />

        {preview.stars && (
          <>
            <span style={{ position: 'absolute', top: '28px', left: '34px', width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.95)', boxShadow: '0 0 8px rgba(255,255,255,0.85)' }} />
            <span style={{ position: 'absolute', top: '50px', left: '74px', width: '2px', height: '2px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)', boxShadow: '0 0 6px rgba(255,255,255,0.7)' }} />
            <span style={{ position: 'absolute', top: '22px', left: '118px', width: '2px', height: '2px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)', boxShadow: '0 0 6px rgba(255,255,255,0.7)' }} />
          </>
        )}

        <div
          style={{
            position: 'absolute',
            left: '-8%',
            right: '-8%',
            bottom: '-26px',
            height: '84px',
            borderRadius: '50%',
            background: preview.horizon,
            filter: 'blur(2px)'
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '42px',
            background: 'linear-gradient(180deg, rgba(8, 20, 24, 0.12) 0%, rgba(8, 20, 24, 0.34) 100%)'
          }}
        />
      </div>

      <div style={{ marginTop: '10px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
        {preview.label}
      </div>
    </div>
  );
}

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
  const [openSections, setOpenSections] = useState({
    theme: true,
    time: true,
    alerts: false,
    ai: false,
    credits: false
  });

  const notificationDenied = typeof Notification !== 'undefined' && Notification.permission === 'denied';
  const selectedTime = useMemo(
    () => BG_TIME_OPTIONS.find(({ value }) => value === bgTimeLock) ?? BG_TIME_OPTIONS[0],
    [bgTimeLock]
  );

  if (!isOpen) return null;

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetDraft = () => {
    setKeyInput(apiSettings.apiKey);
    setModelInput(apiSettings.modelName || 'google/gemini-2.5-flash');
  };

  const handleClose = () => {
    resetDraft();
    onClose();
  };

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
          width: '92%',
          maxWidth: '560px',
          padding: 'var(--spacing-lg)',
          margin: 'auto'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            marginBottom: 'var(--spacing-lg)',
            borderBottom: '2px solid var(--border-window-inner)',
            paddingBottom: 'var(--spacing-sm)'
          }}
        >
          <div>
            <h2 style={{ color: 'var(--accent-secondary)', fontSize: '1.2rem', marginBottom: '4px' }}>設定</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>表示、通知、AI 連携をまとめて調整できます。</p>
          </div>
          <button onClick={handleClose} className="btn-icon" aria-label="設定を閉じる">
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          <Section icon={Palette} title="カラーテーマ" isOpen={openSections.theme} onToggle={() => toggleSection('theme')}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {Object.entries(THEME_LABELS).map(([key, label]) => {
                const preview = THEME_PREVIEW[key];
                const isSelected = colorTheme === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onThemeChange(key)}
                    style={{
                      flex: '1 1 160px',
                      minWidth: '160px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      border: isSelected ? '2px solid var(--accent-secondary)' : '1px solid var(--border-window-inner)',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <span style={{ display: 'inline-flex', gap: '4px' }}>
                      <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: preview.bg, border: '1px solid rgba(255,255,255,0.28)' }} />
                      <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: preview.accent }} />
                      <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: preview.text }} />
                    </span>
                    <span style={{ fontSize: '0.86rem' }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section icon={Clock3} title="背景の時間帯" isOpen={openSections.time} onToggle={() => toggleSection('time')}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {BG_TIME_OPTIONS.map(({ value, label }) => {
                const isSelected = bgTimeLock === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onBgTimeLockChange(value)}
                    style={{
                      padding: '8px 12px',
                      border: isSelected ? '2px solid var(--accent-secondary)' : '1px solid var(--border-window-inner)',
                      borderRadius: '999px',
                      background: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
                      color: isSelected ? 'var(--accent-secondary)' : 'var(--text-primary)',
                      fontSize: '0.82rem'
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              現在の設定: {selectedTime.label}
              {' '}
              {selectedTime.description}
            </p>

            <TimePreview bgTimeLock={bgTimeLock} />
          </Section>

          <Section icon={Bell} title="期限アラート" isOpen={openSections.alerts} onToggle={() => toggleSection('alerts')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => onAlertEnabledChange(!alertEnabled)}
                style={{
                  padding: '8px 16px',
                  border: alertEnabled ? '2px solid var(--accent-secondary)' : '1px solid var(--border-window-inner)',
                  borderRadius: '999px',
                  background: alertEnabled ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: alertEnabled ? 'var(--accent-secondary)' : 'var(--text-muted)',
                  minWidth: '88px'
                }}
              >
                {alertEnabled ? 'ON' : 'OFF'}
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {alertEnabled ? '期限切れや当日期限のタスクを通知します。' : '通知は停止しています。'}
              </span>
            </div>

            {notificationDenied && (
              <p style={{ fontSize: '0.78rem', color: 'var(--danger)', marginTop: '10px' }}>
                ブラウザ通知が拒否されています。ブラウザ設定から通知を許可してください。
              </p>
            )}
          </Section>

          <Section icon={Bot} title="AI 連携設定" isOpen={openSections.ai} onToggle={() => toggleSection('ai')}>
            <div style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                  API Key
                </label>
                <input
                  type="text"
                  value={keyInput}
                  onChange={(event) => setKeyInput(event.target.value)}
                  placeholder="sk-or-v1-..."
                  style={{ fontFamily: 'monospace' }}
                />
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  API キーはこのブラウザの Local Storage にのみ保存されます。
                </p>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                  Model Name
                </label>
                <input
                  type="text"
                  value={modelInput}
                  onChange={(event) => setModelInput(event.target.value)}
                  placeholder="google/gemini-2.5-flash"
                />
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  例: `google/gemini-2.5-flash`, `openai/gpt-4o-mini`, `anthropic/claude-3-haiku`
                </p>
              </div>
            </div>
          </Section>

          <Section icon={Info} title="クレジット" isOpen={openSections.credits} onToggle={() => toggleSection('credits')}>
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
                background: 'rgba(0,0,0,0.14)',
                border: '1px solid var(--border-window-inner)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px'
              }}
            >
              <div style={{ color: 'var(--accent-primary)', marginBottom: '6px' }}>効果音クレジット</div>
              <div>OtoLogic https://otologic.jp</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem', marginTop: '6px' }}>
                効果音は OtoLogic のフリー素材を利用しています。利用条件は OtoLogic の案内に従ってください。
              </div>
            </div>
          </Section>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}>
          <button onClick={handleClose} className="btn-icon" style={{ padding: '8px 16px', border: '2px solid var(--text-muted)' }}>
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
