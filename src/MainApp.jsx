import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LogOut, Settings, Sword } from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { StatusHeader } from './StatusHeader';
import { TaskInput } from './TaskInput';
import { TaskList } from './TaskList';
import { ProfilePrompt } from './ProfilePrompt';
import { playLevelUp } from './soundEffects';
import { useAppState } from './useAppState';
import { sendNotification } from './notifications';

const SESSION_BONUS_TIERS = [
  { tier: 1, minutes: 15, xpAward: 8, label: '15分継続ボーナス' },
  { tier: 2, minutes: 30, xpAward: 12, label: '30分継続ボーナス' },
  { tier: 3, minutes: 60, xpAward: 18, label: '60分継続ボーナス' },
  { tier: 4, minutes: 120, xpAward: 25, label: '120分継続ボーナス' }
];

const ACTIVE_TIME_TICK_MS = 30_000;

function getLocalDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const STATUS_FILTER_OPTIONS = [
  { value: 'todo', label: '未着手' },
  { value: 'in_progress', label: '進行中' },
  { value: 'completed', label: '完了' }
];

export function MainApp({
  currentUser,
  onLogout,
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
  const {
    tasks,
    userStats,
    aiSettings,
    profile,
    saveProfile,
    saveAiSettings,
    testAiSettings,
    scoreDifficulty,
    addTask,
    toggleTask,
    editTask,
    deleteTask,
    claimProgressBonus,
    getRequiredExp,
    levelUpData,
    clearLevelUpData,
    loading,
    error
  } = useAppState();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [profilePromptDismissed, setProfilePromptDismissed] = useState(false);
  const [statusFilters, setStatusFilters] = useState(['todo', 'in_progress']);
  const [sortMode, setSortMode] = useState('created');
  const [stagedCompletedTaskIds, setStagedCompletedTaskIds] = useState([]);
  const [dailyBonusStatus, setDailyBonusStatus] = useState('checking');
  const [activeMinutes, setActiveMinutes] = useState(0);
  const [claimedSessionTiers, setClaimedSessionTiers] = useState([]);
  const [bonusToasts, setBonusToasts] = useState([]);
  const notifiedRef = useRef(new Set());
  const sessionActiveMsRef = useRef(0);
  const lastVisibleAtRef = useRef(Date.now());
  const activeDayKeyRef = useRef(getLocalDayKey());
  const pendingSessionClaimsRef = useRef(new Set());
  const claimedSessionTiersRef = useRef([]);

  const dueTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks.filter((task) => {
      if (task.status === 'completed' || !task.dueDate) return false;
      return new Date(task.dueDate) <= today;
    });
  }, [tasks]);

  useEffect(() => {
    if (!alertEnabled || dueTasks.length === 0) return;

    dueTasks.forEach((task) => {
      if (notifiedRef.current.has(task.id)) return;
      notifiedRef.current.add(task.id);
      sendNotification('期限のタスクがあります', `「${task.title}」の期限です。`);
    });
  }, [alertEnabled, dueTasks]);

  useEffect(() => {
    if (levelUpData) playLevelUp();
  }, [levelUpData]);

  const pushBonusToast = useCallback((bonus) => {
    const toastId = `${bonus.type}-${bonus.claimKey ?? Math.random().toString(36).slice(2)}`;
    setBonusToasts((current) => [...current, { id: toastId, bonus }]);
    window.setTimeout(() => {
      setBonusToasts((current) => current.filter((item) => item.id !== toastId));
    }, 4200);
  }, []);

  const applyBonusResult = useCallback((result) => {
    if (!result?.bonus) return;

    if (result.bonus.type === 'daily_login') {
      setDailyBonusStatus('claimed');
    }

    if (result.bonus.type === 'session_keepalive' && typeof result.bonus.tier === 'number') {
      setClaimedSessionTiers((current) => (
        current.includes(result.bonus.tier) ? current : [...current, result.bonus.tier].sort((a, b) => a - b)
      ));
    }

    if (result.claimed) {
      pushBonusToast(result.bonus);
    }
  }, [pushBonusToast]);

  useEffect(() => {
    claimedSessionTiersRef.current = claimedSessionTiers;
  }, [claimedSessionTiers]);

  useEffect(() => {
    const dayKey = getLocalDayKey();
    activeDayKeyRef.current = dayKey;
    sessionActiveMsRef.current = 0;
    lastVisibleAtRef.current = Date.now();
    pendingSessionClaimsRef.current.clear();
    setActiveMinutes(0);
    setClaimedSessionTiers([]);
    setDailyBonusStatus('checking');

    let cancelled = false;
    claimProgressBonus({ bonusType: 'daily_login', dayKey })
      .then((result) => {
        if (cancelled) return;
        applyBonusResult(result);
      })
      .catch(() => {
        if (!cancelled) setDailyBonusStatus('idle');
      });

    return () => {
      cancelled = true;
    };
  }, [claimProgressBonus, applyBonusResult, currentUser?.id]);

  useEffect(() => {
    let disposed = false;

    const syncActiveTime = () => {
      const nextDayKey = getLocalDayKey();
      if (nextDayKey !== activeDayKeyRef.current) {
        activeDayKeyRef.current = nextDayKey;
        sessionActiveMsRef.current = 0;
        pendingSessionClaimsRef.current.clear();
        setActiveMinutes(0);
        setClaimedSessionTiers([]);
        setDailyBonusStatus('checking');
        claimProgressBonus({ bonusType: 'daily_login', dayKey: nextDayKey })
          .then((result) => {
            if (!disposed) applyBonusResult(result);
          })
          .catch(() => {
            if (!disposed) setDailyBonusStatus('idle');
          });
        lastVisibleAtRef.current = Date.now();
        return;
      }

      const now = Date.now();
      if (document.hidden) {
        lastVisibleAtRef.current = now;
        return;
      }

      const last = lastVisibleAtRef.current ?? now;
      sessionActiveMsRef.current += Math.max(0, now - last);
      lastVisibleAtRef.current = now;
      setActiveMinutes(Math.floor(sessionActiveMsRef.current / 60_000));

      SESSION_BONUS_TIERS.forEach((tierConfig) => {
        const reached = sessionActiveMsRef.current >= tierConfig.minutes * 60_000;
        if (!reached || pendingSessionClaimsRef.current.has(tierConfig.tier) || claimedSessionTiersRef.current.includes(tierConfig.tier)) return;

        pendingSessionClaimsRef.current.add(tierConfig.tier);
        claimProgressBonus({
          bonusType: 'session_keepalive',
          dayKey: activeDayKeyRef.current,
          tier: tierConfig.tier
        })
          .then((result) => {
            pendingSessionClaimsRef.current.delete(tierConfig.tier);
            if (!disposed) applyBonusResult(result);
          })
          .catch(() => {
            pendingSessionClaimsRef.current.delete(tierConfig.tier);
          });
      });
    };

    const handleVisibilityChange = () => {
      lastVisibleAtRef.current = Date.now();
      if (!document.hidden) syncActiveTime();
    };

    const intervalId = window.setInterval(syncActiveTime, ACTIVE_TIME_TICK_MS);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    syncActiveTime();

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [claimProgressBonus, applyBonusResult]);

  const nextSessionBonus = useMemo(
    () => SESSION_BONUS_TIERS.find(({ tier }) => !claimedSessionTiers.includes(tier)) ?? null,
    [claimedSessionTiers]
  );
  const needsProfileOnboarding = !profile.onboardingCompleted && !profilePromptDismissed;

  const displayTasks = useMemo(() => {
    let result = tasks.filter((task) => statusFilters.includes(task.status));

    if (hideCompletedTasks && !statusFilters.includes('completed')) {
      result = result.filter((task) => task.status !== 'completed' || stagedCompletedTaskIds.includes(task.id));
    }

    const getUrgencyRank = (task) => {
      if (!task.dueDate || task.status === 'completed') return 2;
      const taskDate = new Date(task.dueDate);
      const today = new Date();
      taskDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (taskDate < today) return 0;
      if (taskDate.getTime() === today.getTime()) return 1;
      return 2;
    };

    result.sort((a, b) => {
      const urgencyDelta = getUrgencyRank(a) - getUrgencyRank(b);
      if (urgencyDelta !== 0) return urgencyDelta;
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      if (sortMode === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return b.createdAt - a.createdAt;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortMode === 'difficulty') return (b.difficulty || 0) - (a.difficulty || 0);
      if (sortMode === 'exp') return (b.expReward || 0) - (a.expReward || 0);
      return b.createdAt - a.createdAt;
    });
    return result;
  }, [tasks, statusFilters, sortMode, hideCompletedTasks, stagedCompletedTaskIds]);

  const handleCompletionSequenceStart = useCallback((taskId) => {
    setStagedCompletedTaskIds((current) => (
      current.includes(taskId) ? current : [...current, taskId]
    ));
  }, []);

  const handleCompletionSequenceEnd = useCallback((taskId) => {
    setStagedCompletedTaskIds((current) => current.filter((id) => id !== taskId));
  }, []);

  const toggleStatusFilter = (status) => {
    setStatusFilters((current) => {
      const exists = current.includes(status);
      if (exists && current.length === 1) return current;
      if (exists) return current.filter((item) => item !== status);
      return [...current, status];
    });
  };

  const selectedStatusLabel = statusFilters.length === STATUS_FILTER_OPTIONS.length
    ? 'すべて'
    : STATUS_FILTER_OPTIONS
      .filter(({ value }) => statusFilters.includes(value))
      .map(({ label }) => label)
      .join(' / ');

  if (loading) {
    return (
      <div className="app-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="rpg-window" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
          <p style={{ color: 'var(--accent-secondary)', fontSize: '1.2rem', animation: 'blink 1s infinite' }}>
            読み込み中...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="rpg-window" style={{ textAlign: 'center', padding: 'var(--spacing-xl)', maxWidth: '400px' }}>
          <p style={{ color: 'var(--danger)', fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>
            API error: {error}
          </p>
          <button className="btn-primary" onClick={onLogout}>
            ログイン画面へ戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-xl)',
          borderBottom: '2px solid var(--border-window)',
          paddingBottom: 'var(--spacing-md)'
        }}
      >
        <h1
          style={{
            fontSize: '1.6rem',
            color: 'var(--accent-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            letterSpacing: '2px'
          }}
        >
          クエストマネージャー
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--accent-primary)',
              border: '1px solid var(--accent-primary)',
              padding: '2px 8px',
              borderRadius: '2px'
            }}
          >
            AI
          </span>
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          {currentUser && (
            <span
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '3px 10px 4px',
                border: '1px solid var(--accent-primary)',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(0,0,0,0.35)',
                boxShadow: '0 0 8px var(--accent-primary), inset 0 0 6px rgba(0,0,0,0.4)',
                lineHeight: 1.2
              }}
            >
              <span style={{ fontSize: '0.6rem', color: 'var(--accent-primary)', letterSpacing: '2px', opacity: 0.8 }}>USER</span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.82rem',
                  color: 'var(--accent-secondary)',
                  letterSpacing: '1px',
                  fontWeight: 'bold',
                  textShadow: '0 0 6px var(--accent-secondary)'
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    filter: 'drop-shadow(0 0 4px var(--accent-secondary))',
                    animation: 'swordGlow 2.5s ease-in-out infinite'
                  }}
                >
                  <Sword size={14} strokeWidth={2.1} />
                </span>
                {currentUser.username}
              </span>
            </span>
          )}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="btn-icon btn-icon--header"
            title="Settings"
            aria-label="Settings"
          >
            <Settings size={18} strokeWidth={2.2} />
          </button>
          <button
            onClick={onLogout}
            className="btn-icon btn-icon--header btn-icon--danger"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={18} strokeWidth={2.2} />
          </button>
        </div>
      </header>

      {needsProfileOnboarding ? (
        <ProfilePrompt
          profile={profile}
          onSaveProfile={async (payload) => {
            await saveProfile(payload);
            setProfilePromptDismissed(false);
          }}
          onDismiss={() => setProfilePromptDismissed(true)}
        />
      ) : (
        <>
      {dueTasks.length > 0 && (
        <div
          style={{
            marginBottom: 'var(--spacing-md)',
            padding: '8px 14px',
            background: 'rgba(200, 30, 30, 0.18)',
            border: '1px solid rgba(220, 60, 60, 0.5)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.85rem',
            color: 'var(--danger, #ff6666)',
            animation: 'popIn 0.3s ease'
          }}
        >
          <span>!</span>
          <span>
            今日が期限、または期限切れのタスクが {dueTasks.length} 件あります。
          </span>
        </div>
      )}

      <StatusHeader stats={userStats} getRequiredExp={getRequiredExp} />
      <div
        className="rpg-window"
        style={{
          marginBottom: 'var(--spacing-md)',
          padding: '12px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 'var(--spacing-md)',
          flexWrap: 'wrap',
          background: 'linear-gradient(135deg, rgba(27, 39, 82, 0.72), rgba(12, 18, 40, 0.9))'
        }}
      >
        <div style={{ minWidth: '220px' }}>
          <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--accent-primary)', marginBottom: 4 }}>
            ボーナスEXP
          </div>
          <div style={{ fontSize: '0.92rem', color: 'var(--accent-secondary)' }}>
            ログインボーナス: {
              dailyBonusStatus === 'checking'
                ? '確認中...'
                : dailyBonusStatus === 'claimed'
                  ? '+25 EXP 受け取り済み'
                  : '受け取れません'
            }
          </div>
        </div>
        <div style={{ minWidth: '260px', flex: 1 }}>
          <div style={{ fontSize: '0.86rem', color: 'var(--text-main)' }}>
            継続時間: {activeMinutes} 分
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {nextSessionBonus
              ? `次の継続ボーナス: ${nextSessionBonus.minutes}分で +${nextSessionBonus.xpAward} EXP`
              : '本日の継続ボーナスはすべて受け取り済みです'}
          </div>
        </div>
      </div>
      <TaskInput onAdd={addTask} scoreDifficulty={scoreDifficulty} />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-md)',
          flexWrap: 'wrap',
          gap: 'var(--spacing-sm)'
        }}
      >
        <h2 style={{ fontSize: '1rem', color: 'var(--accent-secondary)' }}>
          タスク ({displayTasks.length})
        </h2>

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
          <details className="multi-select-window">
            <summary className="multi-select-window__summary">
              <span className="multi-select-window__label">状態</span>
              <span className="multi-select-window__value">{selectedStatusLabel}</span>
            </summary>
            <div className="multi-select-window__panel rpg-window" style={{ marginBottom: 0 }}>
              {STATUS_FILTER_OPTIONS.map(({ value, label }) => (
                <label key={value} className="multi-select-window__option">
                  <input
                    type="checkbox"
                    checked={statusFilters.includes(value)}
                    onChange={() => toggleStatusFilter(value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </details>

          <div className="sort-control">
            <span style={{ padding: '4px 8px', color: 'var(--text-muted)', fontSize: '0.8rem', borderRight: '1px solid var(--border-window-inner)' }}>並び順</span>
            <select className="sort-control__select" value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
              <option value="created">新しい順</option>
              <option value="dueDate">期限順</option>
              <option value="difficulty">難易度順</option>
              <option value="exp">EXP</option>
            </select>
          </div>
        </div>
      </div>

      <TaskList
        tasks={displayTasks}
        toggleTask={toggleTask}
        editTask={editTask}
        deleteTask={deleteTask}
        apiSettings={aiSettings}
        userLevel={userStats.level}
        levelUpActive={Boolean(levelUpData)}
        onCompletionSequenceStart={handleCompletionSequenceStart}
        onCompletionSequenceEnd={handleCompletionSequenceEnd}
      />

      {levelUpData && (
        <div
          onClick={clearLevelUpData}
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(4px)',
            cursor: 'pointer'
          }}
        >
          <div className="rpg-window" style={{ padding: 'var(--spacing-xl) var(--spacing-lg)', border: '2px solid var(--accent-secondary)' }}>
            <p style={{ fontSize: '2rem', color: 'var(--accent-secondary)', textAlign: 'center' }}>
              LEVEL UP
            </p>
            <p style={{ color: 'var(--accent-primary)', textAlign: 'center' }}>
              Lv.{levelUpData.level}
            </p>
          </div>
        </div>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        aiSettings={aiSettings}
        onSaveAiSettings={saveAiSettings}
        onTestAiSettings={testAiSettings}
        profile={profile}
        onSaveProfile={saveProfile}
        colorTheme={colorTheme}
        onThemeChange={onThemeChange}
        bgTimeLock={bgTimeLock}
        onBgTimeLockChange={onBgTimeLockChange}
        alertEnabled={alertEnabled}
        onAlertEnabledChange={onAlertEnabledChange}
        seVolume={seVolume}
        onSeVolumeChange={onSeVolumeChange}
        bgmVolume={bgmVolume}
        onBgmVolumeChange={onBgmVolumeChange}
        hideCompletedTasks={hideCompletedTasks}
        onHideCompletedTasksChange={onHideCompletedTasksChange}
      />
      {bonusToasts.length > 0 && (
        <div
          style={{
            position: 'fixed',
            right: '16px',
            bottom: '16px',
            zIndex: 10001,
            display: 'grid',
            gap: '10px',
            width: 'min(320px, calc(100vw - 32px))'
          }}
        >
          {bonusToasts.map(({ id, bonus }) => (
            <div
              key={id}
              className="rpg-window"
              style={{
                marginBottom: 0,
                padding: '12px 14px',
                borderColor: 'rgba(92, 171, 255, 0.7)',
                background: 'linear-gradient(135deg, rgba(20, 48, 105, 0.95), rgba(8, 17, 39, 0.98))',
                boxShadow: '0 10px 24px rgba(0, 0, 0, 0.32)'
              }}
            >
              <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--accent-primary)', marginBottom: 4 }}>
                ボーナス獲得
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--accent-secondary)' }}>
                {bonus.label}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: 4 }}>
                +{bonus.xpAward} EXP
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
}
