import React, { useState, useMemo } from 'react';
import { Settings, Sparkles, Filter } from 'lucide-react';
import { useAppState } from './useAppState';
import { StatusHeader } from './StatusHeader';
import { TaskInput } from './TaskInput';
import { TaskList } from './TaskList';
import { SettingsModal } from './SettingsModal';
import './index.css';

function App() {
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
    clearLevelUpData
  } = useAppState();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [filterMode, setFilterMode] = useState('all');
  const [sortMode, setSortMode] = useState('created');

  const displayTasks = useMemo(() => {
    let result = [...tasks];
    if (filterMode === 'active') {
      result = result.filter(t => !t.completed);
    }
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
      return b.createdAt - a.createdAt;
    });
    return result;
  }, [tasks, filterMode, sortMode]);

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

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="btn-icon"
          title="AI設定"
          style={{ fontSize: '1.2rem' }}
        >
          ⚙
        </button>
      </header>

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
              <option value="active">未完了のみ</option>
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
            {/* RPGウィンドウ風のレベルアップ表示 */}
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
      />
    </div>
  );
}

export default App;
