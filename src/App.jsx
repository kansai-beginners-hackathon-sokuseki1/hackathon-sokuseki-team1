import React, { useState, useMemo, useEffect } from 'react';
import { useAppState } from './useAppState';
import { StatusHeader } from './StatusHeader';
import { TaskInput } from './TaskInput';
import { TaskList } from './TaskList';
import { SettingsModal } from './SettingsModal';
import { AuthScreen } from './AuthScreen';
import { applyTheme } from './themes';
import { playLevelUp } from './soundEffects';
import { FantasyBackground, FantasyOverlay } from './FantasyBackground';
import './index.css';

// Service Worker 登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/hackathon-sokuseki-team1/sw.js', {
      scope: '/hackathon-sokuseki-team1/'
    }).catch(() => {});
  });
}

// 通知送信（Service Worker 経由でモバイル対応）
async function sendNotification(title, body) {
  if (Notification.permission !== 'granted') return;
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, { body, icon: '/hackathon-sokuseki-team1/icon-192.svg' });
      return;
    } catch (_) {}
  }
  new Notification(title, { body });
}

// 認証ラッパー：トークンがある場合はメインアプリを表示
function App() {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken'));
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [bgTimeLock, setBgTimeLock] = useState(
    () => localStorage.getItem('bgTimeLock') ?? 'auto'
  );

  const handleBgTimeLockChange = (value) => {
    localStorage.setItem('bgTimeLock', value);
    setBgTimeLock(value);
  };

  const [alertEnabled, setAlertEnabled] = useState(
    () => localStorage.getItem('alertEnabled') === 'true'
  );

  const handleAlertEnabledChange = async (enabled) => {
    if (enabled && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
    }
    localStorage.setItem('alertEnabled', enabled);
    setAlertEnabled(enabled);
  };

  // 時間帯をhtmlのdata-time属性に設定（毎分更新）
  useEffect(() => {
    function updateTimePeriod() {
      if (bgTimeLock !== 'auto') {
        document.documentElement.dataset.time = bgTimeLock;
        return;
      }
      const h = new Date().getHours();
      let period;
      if (h >= 20 || h < 5)  period = 'night';
      else if (h < 7)         period = 'dawn';
      else if (h < 11)        period = 'morning';
      else if (h < 15)        period = 'noon';
      else                    period = 'dusk';
      document.documentElement.dataset.time = period;
    }
    updateTimePeriod();
    const id = setInterval(updateTimePeriod, 60_000);
    return () => clearInterval(id);
  }, [bgTimeLock]);

  const [colorTheme, setColorTheme] = useState(
    () => localStorage.getItem('colorTheme') ?? 'dark-blue'
  );

  // マウント時および変更時にテーマを適用
  useEffect(() => {
    applyTheme(colorTheme);
  }, [colorTheme]);

  const handleThemeChange = (themeKey) => {
    localStorage.setItem('colorTheme', themeKey);
    setColorTheme(themeKey);
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
      {!authToken
        ? <AuthScreen onLogin={handleLogin} />
        : <MainApp currentUser={currentUser} onLogout={handleLogout} colorTheme={colorTheme} onThemeChange={handleThemeChange} bgTimeLock={bgTimeLock} onBgTimeLockChange={handleBgTimeLockChange} alertEnabled={alertEnabled} onAlertEnabledChange={handleAlertEnabledChange} />
      }
    </>
  );
}

function MainApp({ currentUser, onLogout, colorTheme, onThemeChange, bgTimeLock, onBgTimeLockChange, alertEnabled, onAlertEnabledChange }) {
  const {
    tasks,
    userStats,
    apiSettings,
    setApiSettings,
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

  // 期限アラート（ブラウザ通知 + アプリ内バナー）
  const notifiedRef = React.useRef(new Set());
  const dueTasks = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks.filter(t => {
      if (t.status === 'completed' || !t.dueDate) return false;
      return new Date(t.dueDate) <= today;
    });
  }, [tasks]);

  useEffect(() => {
    if (!alertEnabled || dueTasks.length === 0) return;
    dueTasks.forEach(t => {
      if (notifiedRef.current.has(t.id)) return;
      notifiedRef.current.add(t.id);
      sendNotification('⚔ クエスト期限アラート', `「${t.title}」の期限が過ぎています！`);
    });
  }, [alertEnabled, dueTasks]);

  // レベルアップSE
  useEffect(() => {
    if (levelUpData) playLevelUp();
  }, [levelUpData]);
  const [filterMode, setFilterMode] = useState('all');
  const [sortMode, setSortMode] = useState('created');

  const displayTasks = useMemo(() => {
    let result = [...tasks];
    if (filterMode === 'todo')        result = result.filter(t => t.status === 'todo');
    else if (filterMode === 'in_progress') result = result.filter(t => t.status === 'in_progress');
    else if (filterMode === 'completed')   result = result.filter(t => t.status === 'completed');
    result.sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      if (sortMode === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return b.createdAt - a.createdAt;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortMode === 'difficulty') {
        return (b.difficulty || 0) - (a.difficulty || 0);
      }
      if (sortMode === 'exp') {
        return (b.expReward || 0) - (a.expReward || 0);
      }
      return b.createdAt - a.createdAt;
    });
    return result;
  }, [tasks, filterMode, sortMode]);

  // 初期ロード中
  if (loading) {
    return (
      <div className="app-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="rpg-window" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
          <p style={{ color: 'var(--accent-secondary)', fontSize: '1.2rem', animation: 'blink 1s infinite' }}>
            ⌛ クエストデータを読み込み中...
          </p>
        </div>
      </div>
    );
  }

  // API接続エラー（セッション切れ含む）
  if (error) {
    return (
      <div className="app-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="rpg-window" style={{ textAlign: 'center', padding: 'var(--spacing-xl)', maxWidth: '400px' }}>
          <p style={{ color: 'var(--danger)', fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>
            ⚠ 接続エラー: {error}
          </p>
          <button className="btn-primary" onClick={onLogout}>
            ログイン画面に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {/* タイトルヘッダー */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--spacing-xl)',
        borderBottom: '2px solid var(--border-window)',
        paddingBottom: 'var(--spacing-md)'
      }}>
        <h1 style={{
          fontSize: '1.6rem',
          color: 'var(--accent-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          letterSpacing: '2px'
        }}>
          ⚔ クエストマネージャー
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--accent-primary)',
            border: '1px solid var(--accent-primary)',
            padding: '2px 8px',
            borderRadius: '2px'
          }}>AI</span>
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          {currentUser && (
            <span style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '3px 10px 4px',
              border: '1px solid var(--accent-primary)',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0,0,0,0.35)',
              boxShadow: '0 0 8px var(--accent-primary), inset 0 0 6px rgba(0,0,0,0.4)',
              lineHeight: 1.2,
              cursor: 'default',
            }}>
              <span style={{
                fontSize: '0.6rem',
                color: 'var(--accent-primary)',
                letterSpacing: '2px',
                opacity: 0.8,
              }}>冒険者</span>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.82rem',
                color: 'var(--accent-secondary)',
                letterSpacing: '1px',
                fontWeight: 'bold',
                textShadow: '0 0 6px var(--accent-secondary)',
              }}>
                <span style={{
                  fontSize: '0.9rem',
                  filter: 'drop-shadow(0 0 4px var(--accent-secondary))',
                  animation: 'swordGlow 2.5s ease-in-out infinite',
                }}>⚔</span>
                {currentUser.username}
              </span>
            </span>
          )}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="btn-icon"
            title="AI設定"
            style={{ fontSize: '1.2rem' }}
          >
            ⚙
          </button>
          <button
            onClick={onLogout}
            className="btn-icon"
            title="ログアウト"
            style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
          >
            ⏏
          </button>
        </div>
      </header>

      {/* 期限切れアラートバナー */}
      {dueTasks.length > 0 && (
        <div style={{
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
          animation: 'popIn 0.3s ease',
        }}>
          <span style={{ fontSize: '1rem' }}>⚠</span>
          <span>
            期限切れ・本日期限のクエストが <strong>{dueTasks.length}件</strong> あります！
          </span>
        </div>
      )}

      {/* ステータスバー（Lv, EXP） */}
      <StatusHeader stats={userStats} getRequiredExp={getRequiredExp} />

      {/* タスク入力フォーム */}
      <TaskInput onAdd={addTask} apiSettings={apiSettings} />

      {/* コントロールバー（ソート・フィルター） */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--spacing-md)',
        flexWrap: 'wrap',
        gap: 'var(--spacing-sm)'
      }}>
        <h2 style={{ fontSize: '1rem', color: 'var(--accent-secondary)' }}>
          ▶ クエスト一覧 ({displayTasks.length})
        </h2>

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* フィルター */}
          <div style={{ display: 'flex', alignItems: 'center', border: '2px solid var(--border-window)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <span style={{ padding: '4px 8px', color: 'var(--text-muted)', fontSize: '0.8rem', borderRight: '1px solid var(--border-window-inner)' }}>Filter</span>
            <select
              value={filterMode}
              onChange={e => setFilterMode(e.target.value)}
              style={{ border: 'none', borderRadius: 0, width: 'auto', padding: '4px 8px' }}
            >
              <option value="all">すべて</option>
              <option value="todo">未実施</option>
              <option value="in_progress">進行中</option>
              <option value="completed">完了</option>
            </select>
          </div>

          {/* ソート */}
          <div style={{ display: 'flex', alignItems: 'center', border: '2px solid var(--border-window)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <span style={{ padding: '4px 8px', color: 'var(--text-muted)', fontSize: '0.8rem', borderRight: '1px solid var(--border-window-inner)' }}>Sort</span>
            <select
              value={sortMode}
              onChange={e => setSortMode(e.target.value)}
              style={{ border: 'none', borderRadius: 0, width: 'auto', padding: '4px 8px' }}
            >
              <option value="created">追加した順</option>
              <option value="dueDate">期限が近い順</option>
              <option value="difficulty">難易度が高い順</option>
              <option value="exp">EXP が高い順</option>
            </select>
          </div>
        </div>
      </div>

      {/* タスク一覧 */}
      <TaskList
        tasks={displayTasks}
        toggleTask={toggleTask}
        editTask={editTask}
        deleteTask={deleteTask}
        apiSettings={apiSettings}
        userLevel={userStats.level}
      />

      {/* レベルアップ演出（RPGメッセージウィンドウ風） */}
      {levelUpData && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={clearLevelUpData}
        >
          <div style={{
            textAlign: 'center',
            animation: 'popIn 0.3s ease',
            maxWidth: '400px',
            width: '90%'
          }}>
            <div className="rpg-window" style={{ marginBottom: 'var(--spacing-md)' }}>
              <p style={{ color: 'var(--accent-secondary)', fontSize: '2rem', letterSpacing: '4px', marginBottom: '12px', textAlign: 'center' }}>
                ★ LEVEL UP! ★
              </p>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-primary)', textAlign: 'center' }}>
                Lv. {levelUpData.level - 1}
                <span style={{ color: 'var(--accent-secondary)', margin: '0 12px' }}>→</span>
                <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.5rem' }}>Lv. {levelUpData.level}</span>
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '16px', textAlign: 'center' }}>
                経験値が上がった！
              </p>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', animation: 'blink 1s infinite' }}>
              ▼ クリックで閉じる
            </p>
          </div>
        </div>
      )}

      {/* AI設定モーダル */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiSettings={apiSettings}
        setApiSettings={setApiSettings}
        colorTheme={colorTheme}
        onThemeChange={onThemeChange}
        bgTimeLock={bgTimeLock}
        onBgTimeLockChange={onBgTimeLockChange}
        alertEnabled={alertEnabled}
        onAlertEnabledChange={onAlertEnabledChange}
      />
    </div>
  );
}

export default App;
