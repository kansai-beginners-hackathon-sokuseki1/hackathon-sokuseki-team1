import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthScreen } from './AuthScreen';
import { FantasyBackground, FantasyOverlay } from './FantasyBackground';
import { SettingsModal } from './SettingsModal';
import { StatusHeader } from './StatusHeader';
import { TaskInput } from './TaskInput';
import { TaskList } from './TaskList';
import { PreferenceSwipeCard } from './PreferenceSwipeCard';
import { applyTheme } from './themes';
import { playLevelUp } from './soundEffects';
import { useAppState } from './useAppState';
import './index.css';

const STATUS_FILTER_OPTIONS = [
  { value: 'todo', label: '未着手' },
  { value: 'in_progress', label: '進行中' },
  { value: 'completed', label: '完了' }
];

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/hackathon-sokuseki-team1/sw.js', {
      scope: '/hackathon-sokuseki-team1/'
    }).catch(() => {});
  });
}

async function sendNotification(title, body) {
  if (Notification.permission !== 'granted') return;

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/hackathon-sokuseki-team1/icon-192.svg'
      });
      return;
    } catch {
      return;
    }
  }

  new Notification(title, { body });
}

function ProfilePrompt({ profile, onSaveProfile, onDismiss }) {
  const [preferences, setPreferences] = useState(profile.preferences);
  const preferenceMap = new Map(preferences.map((item) => [item.categoryId, item.preferenceType]));

  const handleChange = (categoryId, direction) => {
    const current = preferenceMap.get(categoryId) || 'neutral';
    let next = current;
    if (direction === 'left') {
      next = current === 'neutral' ? 'strength' : current === 'weakness' ? 'neutral' : 'strength';
    } else {
      next = current === 'neutral' ? 'weakness' : current === 'strength' ? 'neutral' : 'weakness';
    }
    setPreferences((items) => {
      const others = items.filter((item) => item.categoryId !== categoryId);
      return [...others, { categoryId, preferenceType: next }];
    });
  };

  return (
    <div className="rpg-window" style={{ marginBottom: 'var(--spacing-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: 'var(--accent-secondary)', fontSize: '0.9rem' }}>開始前に設定してください</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
            得意・苦手を登録すると、AI の難易度判定がより使いやすくなります。あとで設定することもできます。
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-icon" onClick={onDismiss} style={{ padding: '8px 12px' }}>あとで</button>
          <button className="btn-primary" onClick={() => onSaveProfile({ preferences, onboardingCompleted: true })}>保存</button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
        {profile.categories.map((category) => {
          const value = preferenceMap.get(category.id) || 'neutral';
          return (
            <PreferenceSwipeCard
              key={category.id}
              category={category}
              value={value}
              onChange={(nextValue) => {
                const direction = nextValue === 'strength'
                  ? 'left'
                  : nextValue === 'weakness'
                    ? 'right'
                    : value === 'strength'
                      ? 'right'
                      : 'left';
                handleChange(category.id, direction);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function App() {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken'));
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [bgTimeLock, setBgTimeLock] = useState(() => localStorage.getItem('bgTimeLock') ?? 'auto');
  const [alertEnabled, setAlertEnabled] = useState(() => localStorage.getItem('alertEnabled') === 'true');
  const [hideCompletedTasks, setHideCompletedTasks] = useState(() => localStorage.getItem('hideCompletedTasks') !== 'false');
  const [colorTheme, setColorTheme] = useState(() => localStorage.getItem('colorTheme') ?? 'dark-blue');

  useEffect(() => {
    function updateTimePeriod() {
      if (bgTimeLock !== 'auto') {
        document.documentElement.dataset.time = bgTimeLock;
        return;
      }

      const hour = new Date().getHours();
      let period;
      if (hour >= 20 || hour < 5) period = 'night';
      else if (hour < 7) period = 'dawn';
      else if (hour < 11) period = 'morning';
      else if (hour < 15) period = 'noon';
      else period = 'dusk';
      document.documentElement.dataset.time = period;
    }

    updateTimePeriod();
    const id = setInterval(updateTimePeriod, 60_000);
    return () => clearInterval(id);
  }, [bgTimeLock]);

  useEffect(() => {
    applyTheme(colorTheme);
  }, [colorTheme]);

  const handleThemeChange = (themeKey) => {
    localStorage.setItem('colorTheme', themeKey);
    setColorTheme(themeKey);
  };

  const handleBgTimeLockChange = (value) => {
    localStorage.setItem('bgTimeLock', value);
    setBgTimeLock(value);
  };

  const handleAlertEnabledChange = async (enabled) => {
    if (enabled && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
    }
    localStorage.setItem('alertEnabled', enabled);
    setAlertEnabled(enabled);
  };

  const handleLogin = (token, user) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setAuthToken(token);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    setAuthToken(null);
    setCurrentUser(null);
  };

  return (
    <>
      <FantasyBackground />
      <FantasyOverlay />
      {!authToken ? (
        <AuthScreen onLogin={handleLogin} />
      ) : (
        <MainApp
          currentUser={currentUser}
          onLogout={handleLogout}
          colorTheme={colorTheme}
          onThemeChange={handleThemeChange}
          bgTimeLock={bgTimeLock}
          onBgTimeLockChange={handleBgTimeLockChange}
          alertEnabled={alertEnabled}
          onAlertEnabledChange={handleAlertEnabledChange}
          hideCompletedTasks={hideCompletedTasks}
          onHideCompletedTasksChange={(enabled) => {
            localStorage.setItem('hideCompletedTasks', enabled);
            setHideCompletedTasks(enabled);
          }}
        />
      )}
    </>
  );
}

function MainApp({
  currentUser,
  onLogout,
  colorTheme,
  onThemeChange,
  bgTimeLock,
  onBgTimeLockChange,
  alertEnabled,
  onAlertEnabledChange,
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
  const notifiedRef = useRef(new Set());

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
          タスク管理
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
                {currentUser.username}
              </span>
            </span>
          )}
          <button onClick={() => setIsSettingsOpen(true)} className="btn-icon" title="設定" style={{ fontSize: '1.2rem' }}>
            ⚙
          </button>
          <button onClick={onLogout} className="btn-icon" title="ログアウト" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            ↩
          </button>
        </div>
      </header>

      {!profile.hasProfile && !profilePromptDismissed && (
        <ProfilePrompt
          profile={profile}
          onSaveProfile={async (payload) => {
            await saveProfile(payload);
            setProfilePromptDismissed(false);
          }}
          onDismiss={() => setProfilePromptDismissed(true)}
        />
      )}

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

          <div style={{ display: 'flex', alignItems: 'center', border: '2px solid var(--border-window)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <span style={{ padding: '4px 8px', color: 'var(--text-muted)', fontSize: '0.8rem', borderRight: '1px solid var(--border-window-inner)' }}>並び順</span>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value)} style={{ border: 'none', borderRadius: 0, width: 'auto', padding: '4px 8px' }}>
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
        hideCompletedTasks={hideCompletedTasks}
        onHideCompletedTasksChange={onHideCompletedTasksChange}
      />
    </div>
  );
}

export default App;
