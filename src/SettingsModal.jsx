import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Bot,
  ChevronDown,
  ChevronRight,
  Clock3,
  Info,
  Palette,
  Save,
  Volume2,
  X
} from 'lucide-react';
import { PreferenceSwipeCard } from './PreferenceSwipeCard';
import { THEME_LABELS, THEME_PREVIEW } from './themes';

const BG_TIME_OPTIONS = [
  { value: 'auto', label: '自動', description: '現在時刻に合わせます。' },
  { value: 'night', label: '夜', description: '夜空の表示です。' },
  { value: 'dawn', label: '明け方', description: '早朝の表示です。' },
  { value: 'morning', label: '朝', description: '朝の表示です。' },
  { value: 'noon', label: '昼', description: '日中の表示です。' },
  { value: 'dusk', label: '夕方', description: '夕暮れの表示です。' }
];

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

export function SettingsModal({
  isOpen,
  onClose,
  aiSettings,
  onSaveAiSettings,
  onTestAiSettings,
  profile,
  onSaveProfile,
  colorTheme,
  onThemeChange,
  bgTimeLock,
  onBgTimeLockChange,
  alertEnabled,
  onAlertEnabledChange,
  seVolume,
  onSeVolumeChange,
  bgmVolume,
  onBgmVolumeChange,
  hideCompletedTasks,
  onHideCompletedTasksChange
}) {
  const [draftSettings, setDraftSettings] = useState(aiSettings);
  const [draftPreferences, setDraftPreferences] = useState([]);
  const [openSections, setOpenSections] = useState({
    theme: true,
    time: false,
    alerts: false,
    audio: false,
    ai: true,
    profile: true,
    credits: false
  });
  const [connectionResult, setConnectionResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const notificationDenied = typeof Notification !== 'undefined' && Notification.permission === 'denied';
  const selectedTime = useMemo(
    () => BG_TIME_OPTIONS.find(({ value }) => value === bgTimeLock) ?? BG_TIME_OPTIONS[0],
    [bgTimeLock]
  );

  useEffect(() => {
    setDraftSettings(aiSettings);
  }, [aiSettings]);

  useEffect(() => {
    setDraftPreferences(profile.preferences);
  }, [profile.preferences]);

  if (!isOpen) return null;

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const preferenceMap = new Map(draftPreferences.map((item) => [item.categoryId, item.preferenceType]));

  const handlePreferenceChange = (categoryId, nextValue) => {
    setDraftPreferences((current) => {
      const others = current.filter((item) => item.categoryId !== categoryId);
      return [...others, { categoryId, preferenceType: nextValue }];
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setConnectionResult(null);
    try {
      await onSaveAiSettings(draftSettings);
      await onSaveProfile({
        preferences: draftPreferences,
        onboardingCompleted: true
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const result = await onTestAiSettings(draftSettings);
      setConnectionResult({ ok: true, text: `${result.provider} / ${result.model} / ${result.latencyMs}ms` });
    } catch (error) {
      setConnectionResult({ ok: false, text: error.message });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ alignItems: 'flex-start', overflowY: 'auto', padding: '20px 0' }}>
      <div
        className="rpg-window"
        style={{
          width: '92%',
          maxWidth: '640px',
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
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>見た目、AI 接続、プロフィール設定を管理します。</p>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="設定を閉じる">
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          <Section icon={Palette} title="テーマ" isOpen={openSections.theme} onToggle={() => toggleSection('theme')}>
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {BG_TIME_OPTIONS.map(({ value, label, description }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onBgTimeLockChange(value)}
                  style={{
                    padding: '8px 12px',
                    border: bgTimeLock === value ? '2px solid var(--accent-secondary)' : '1px solid var(--border-window-inner)',
                    borderRadius: '999px',
                    background: bgTimeLock === value ? 'rgba(255,255,255,0.06)' : 'transparent',
                    color: bgTimeLock === value ? 'var(--accent-secondary)' : 'var(--text-primary)',
                    fontSize: '0.82rem'
                  }}
                >
                  {label}
                  <span style={{ display: 'none' }}>{description}</span>
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '12px' }}>
              現在の設定: {selectedTime.label}。表示時間帯: {bgTimeLock === 'auto' ? resolveAutoTime() : bgTimeLock}。
            </p>
          </Section>

          <Section icon={Bell} title="タスク表示" isOpen={openSections.alerts} onToggle={() => toggleSection('alerts')}>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => onHideCompletedTasksChange(!hideCompletedTasks)}
                  style={{
                    padding: '8px 16px',
                    border: hideCompletedTasks ? '2px solid var(--accent-secondary)' : '1px solid var(--border-window-inner)',
                    borderRadius: '999px',
                    background: hideCompletedTasks ? 'rgba(255,255,255,0.06)' : 'transparent',
                    color: hideCompletedTasks ? 'var(--accent-secondary)' : 'var(--text-muted)'
                  }}
                >
                  {hideCompletedTasks ? 'ON' : 'OFF'}
                </button>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>完了したタスクを初期表示で隠します。</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => onAlertEnabledChange(!alertEnabled)}
                  style={{
                    padding: '8px 16px',
                    border: alertEnabled ? '2px solid var(--accent-secondary)' : '1px solid var(--border-window-inner)',
                    borderRadius: '999px',
                    background: alertEnabled ? 'rgba(255,255,255,0.06)' : 'transparent',
                    color: alertEnabled ? 'var(--accent-secondary)' : 'var(--text-muted)'
                  }}
                >
                  {alertEnabled ? 'ON' : 'OFF'}
                </button>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>期限タスクのブラウザ通知を有効にします。</span>
              </div>
            </div>

            {notificationDenied && (
              <p style={{ fontSize: '0.78rem', color: 'var(--danger)', marginTop: '10px' }}>
                ブラウザ通知がブロックされています。ブラウザ設定で許可してください。
              </p>
            )}
          </Section>

          <Section icon={Volume2} title="サウンド" isOpen={openSections.audio} onToggle={() => toggleSection('audio')}>
            <div style={{ display: 'grid', gap: '14px' }}>
              <label style={{ display: 'grid', gap: '6px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>SE 音量: {seVolume}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={seVolume}
                  onChange={(event) => onSeVolumeChange(Number(event.target.value))}
                />
              </label>

              <label style={{ display: 'grid', gap: '6px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>BGM 音量: {bgmVolume}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={bgmVolume}
                  onChange={(event) => onBgmVolumeChange(Number(event.target.value))}
                />
              </label>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                初回はブラウザ操作後に音声が有効になります。BGM は軽いループ音源です。
              </p>
            </div>
          </Section>

          <Section icon={Bot} title="AI 接続" isOpen={openSections.ai} onToggle={() => toggleSection('ai')}>
            <div style={{ display: 'grid', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={draftSettings.useServerDefault}
                  onChange={(event) => setDraftSettings((current) => ({ ...current, useServerDefault: event.target.checked }))}
                />
                サーバー既定の認証情報を使う
              </label>

              <div style={{ display: 'grid', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>プロバイダー</label>
                <select
                  value={draftSettings.provider}
                  onChange={(event) => setDraftSettings((current) => ({ ...current, provider: event.target.value }))}
                >
                  {draftSettings.providers?.map((provider) => (
                    <option key={provider} value={provider}>{provider}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>モデル</label>
                <input
                  type="text"
                  value={draftSettings.model || ''}
                  onChange={(event) => setDraftSettings((current) => ({ ...current, model: event.target.value }))}
                  placeholder={draftSettings.provider === 'openai' ? 'gpt-4o-mini' : 'google/gemini-2.5-flash'}
                />
              </div>

              {!draftSettings.useServerDefault && (
                <>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>API キー</label>
                    <input
                      type="password"
                      value={draftSettings.apiKey || ''}
                      onChange={(event) => setDraftSettings((current) => ({ ...current, apiKey: event.target.value }))}
                      placeholder="sk-..."
                    />
                  </div>

                  <div style={{ display: 'grid', gap: '6px' }}>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Base URL（任意）</label>
                    <input
                      type="text"
                      value={draftSettings.baseUrl || ''}
                      onChange={(event) => setDraftSettings((current) => ({ ...current, baseUrl: event.target.value }))}
                      placeholder="https://api.openai.com"
                    />
                  </div>
                </>
              )}

              {draftSettings.useServerDefault && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  サーバー既定: {draftSettings.defaultProvider} / {draftSettings.defaultModel}
                </p>
              )}

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button type="button" className="btn-primary" onClick={handleTest} disabled={isTesting}>
                  {isTesting ? '接続確認中...' : '接続テスト'}
                </button>
                {connectionResult && (
                  <span style={{ color: connectionResult.ok ? 'var(--success)' : 'var(--danger)', fontSize: '0.8rem' }}>
                    {connectionResult.text}
                  </span>
                )}
              </div>
            </div>
          </Section>

          <Section icon={Info} title="得意・苦手設定" isOpen={openSections.profile} onToggle={() => toggleSection('profile')}>
            <div style={{ display: 'grid', gap: '8px' }}>
              {profile.categories.map((category) => (
                <PreferenceSwipeCard
                  key={category.id}
                  category={category}
                  value={preferenceMap.get(category.id) || 'neutral'}
                  onChange={(nextValue) => handlePreferenceChange(category.id, nextValue)}
                />
              ))}
            </div>
          </Section>

          <Section icon={Info} title="クレジット" isOpen={openSections.credits} onToggle={() => toggleSection('credits')}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <div>OtoLogic https://otologic.jp</div>
            </div>
          </Section>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}>
          <button onClick={onClose} className="btn-icon" style={{ padding: '8px 16px', border: '2px solid var(--text-muted)' }}>
            キャンセル
          </button>
          <button onClick={handleSave} className="btn-primary" disabled={isSaving}>
            <Save size={18} />
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
