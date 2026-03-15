import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Bot,
  ChevronDown,
  ChevronRight,
  Clock3,
  Info,
  Map,
  Palette,
  Save,
  Volume2,
  X
} from 'lucide-react';
import { PreferenceSwipeCard } from './PreferenceSwipeCard';
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
  const resolvedOption = BG_TIME_OPTIONS.find(({ value }) => value === resolvedTime);

  if (!preview) return null;

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
            {bgTimeLock === 'auto'
              ? `自動設定中: 現在は「${resolvedOption?.label ?? resolvedTime}」`
              : option?.description}
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
  onHideCompletedTasksChange,
  selectedStageKey,
  selectedStageMode,
  autoStageLabel,
  stageOptions,
  canUseLockedStages,
  onStageChange
}) {
  const [draftSettings, setDraftSettings] = useState(aiSettings);
  const [draftPreferences, setDraftPreferences] = useState([]);
  const [openSections, setOpenSections] = useState({
    theme: false,
    stage: false,
    time: false,
    alerts: false,
    audio: false,
    ai: false,
    profile: false,
    credits: false
  });
  const [connectionResult, setConnectionResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveError, setSaveError] = useState(null);

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

  useEffect(() => {
    if (isOpen) {
      setSaveError(null);
    }
  }, [isOpen]);

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
    setSaveError(null);
    setConnectionResult(null);
    try {
      await Promise.all([
        onSaveAiSettings(draftSettings),
        onSaveProfile({
          preferences: draftPreferences,
          onboardingCompleted: true
        })
      ]);
      onClose();
    } catch (error) {
      setSaveError(error.message);
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
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>表示、通知、AI、プロフィール設定をまとめて調整できます。</p>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="設定を閉じる">
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
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              現在の設定: {selectedTime.label}。表示時間帯: {bgTimeLock === 'auto' ? resolveAutoTime() : bgTimeLock}。
            </p>
            <TimePreview bgTimeLock={bgTimeLock} />
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
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>完了したタスクを一覧から自動で隠します。</span>
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
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>期限切れや当日期限のタスクをブラウザ通知します。</span>
              </div>
            </div>

            {notificationDenied && (
              <p style={{ fontSize: '0.78rem', color: 'var(--danger)', marginTop: '10px' }}>
                ブラウザ通知が拒否されています。ブラウザ設定から通知を許可してください。
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
                サーバー既定の接続設定を使う
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

          <Section icon={Info} title="プロフィール設定" isOpen={openSections.profile} onToggle={() => toggleSection('profile')}>
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

          <Section icon={Map} title="ステージ" isOpen={openSections.stage} onToggle={() => toggleSection('stage')}>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {selectedStageMode === 'manual'
                  ? `手動選択中: ${stageOptions.find((stage) => stage.key === selectedStageKey)?.label ?? selectedStageKey}`
                  : `自動設定: ${autoStageLabel}`}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => onStageChange(null)}
                  style={{
                    padding: '8px 12px',
                    border: selectedStageMode === 'auto' ? '2px solid var(--accent-secondary)' : '1px solid var(--border-window-inner)',
                    borderRadius: '999px',
                    background: selectedStageMode === 'auto' ? 'rgba(255,255,255,0.06)' : 'transparent',
                    color: selectedStageMode === 'auto' ? 'var(--accent-secondary)' : 'var(--text-primary)',
                    fontSize: '0.82rem'
                  }}
                >
                  自動
                </button>
                {stageOptions.map((stage) => {
                  const isSelected = selectedStageMode === 'manual' && selectedStageKey === stage.key;
                  return (
                    <button
                      key={stage.key}
                      type="button"
                      onClick={() => onStageChange(stage.key)}
                      style={{
                        padding: '8px 12px',
                        border: isSelected ? '2px solid var(--accent-secondary)' : '1px solid var(--border-window-inner)',
                        borderRadius: '999px',
                        background: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
                        color: isSelected ? 'var(--accent-secondary)' : 'var(--text-primary)',
                        fontSize: '0.82rem'
                      }}
                    >
                      {stage.label}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                {canUseLockedStages
                  ? 'master アカウントのため、未解放ステージも切り替えできます。'
                  : '現在のレベルまでに解放したステージだけを選択できます。'}
              </p>
            </div>
          </Section>
        </div>

        {saveError && (
          <p style={{ marginTop: '12px', color: 'var(--danger)', fontSize: '0.82rem' }}>
            {saveError}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}>
          <button type="button" onClick={onClose} className="btn-icon" style={{ padding: '8px 16px', border: '2px solid var(--text-muted)' }}>
            キャンセル
          </button>
          <button type="button" onClick={handleSave} className="btn-primary" disabled={isSaving}>
            <Save size={18} />
            {isSaving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  );
}
