import React, { useState } from 'react';
import { CheckCircle2, Circle, Trash2, ArrowUpCircle, Edit2, Calendar, X, Save } from 'lucide-react';
import { generateCompanionMessage } from './aiService';

export function TaskList({ tasks, toggleTask, editTask, deleteTask, apiSettings, userLevel }) {
  const [npcMessage, setNpcMessage] = useState(null);
  const [loadingMessageId, setLoadingMessageId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editDifficulty, setEditDifficulty] = useState(1);

  const startEditing = (task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDueDate(task.dueDate || '');
    setEditDifficulty(task.difficulty || 1);
  };

  const saveEdit = (id) => {
    if (editTitle.trim()) {
      editTask(id, editTitle.trim(), editDifficulty, editDueDate || null);
    }
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const handleToggle = async (task) => {
    const updatedTask = toggleTask(task.id);
    if (updatedTask && updatedTask.completed && apiSettings.apiKey) {
      setLoadingMessageId(task.id);
      try {
        const msg = await generateCompanionMessage(apiSettings.apiKey, apiSettings.modelName, task.title, userLevel);
        setNpcMessage({ taskId: task.id, text: msg });
        setTimeout(() => setNpcMessage(null), 8000);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMessageId(null);
      }
    }
  };

  const getDaysUntilDue = (dueDateStr) => {
    if (!dueDateStr) return null;
    const due = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  };

  if (tasks.length === 0) {
    return (
      <div className="rpg-window" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--spacing-xl)' }}>
        クエストがありません。新しい冒険を始めましょう！
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm)',
        maxHeight: '60vh',
        overflowY: 'auto',
        paddingRight: '4px'
      }}
    >
      {tasks.map(task => {
        const isEditing = editingId === task.id;
        const daysUntilDue = getDaysUntilDue(task.dueDate);
        let dateColor = 'var(--text-muted)';
        if (!task.completed && daysUntilDue !== null) {
          if (daysUntilDue < 0) dateColor = 'var(--danger)';
          else if (daysUntilDue === 0) dateColor = 'var(--danger)';
          else if (daysUntilDue <= 2) dateColor = 'var(--warning)';
        }

        return (
          <div key={task.id} style={{ position: 'relative' }}>
            <div
              className="rpg-window"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                opacity: task.completed ? 0.5 : 1,
                marginBottom: 0,
                /* 完了タスクは枠を点線に */
                borderStyle: task.completed ? 'dashed' : 'solid',
              }}
            >
              {/* チェックボタン */}
              <button
                onClick={() => handleToggle(task)}
                style={{
                  color: task.completed ? 'var(--success)' : 'var(--text-muted)',
                  marginRight: 'var(--spacing-md)',
                  fontSize: '1.2rem',
                  background: 'transparent',
                  border: 'none',
                  padding: '2px'
                }}
                disabled={loadingMessageId === task.id || isEditing}
              >
                {loadingMessageId === task.id ? (
                  <span style={{ animation: 'blink 0.5s infinite' }}>⌛</span>
                ) : task.completed ? '✓' : '○'}
              </button>

              {/* タスク内容（表示 or 編集） */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '0.95rem' }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-window)', borderRadius: 'var(--radius-sm)', padding: '2px 8px', gap: '4px' }}>
                        <Calendar size={13} />
                        <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} style={{ border: 'none', padding: 0, fontSize: '0.8rem', width: 'auto' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button key={star} type="button" onClick={() => setEditDifficulty(star)}
                            style={{ background: 'none', border: 'none', padding: '0 2px', color: star <= editDifficulty ? 'var(--accent-secondary)' : 'var(--text-muted)' }}>★</button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{
                      fontWeight: 'normal',
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                      fontSize: '1rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {!task.completed && <span style={{ color: 'var(--accent-primary)', marginRight: '6px' }}>▶</span>}
                      {task.title}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '2px', fontSize: '0.78rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ color: 'var(--accent-secondary)' }}>+{task.expReward} EXP</span>
                      {task.difficulty && (
                        <span style={{ color: 'var(--accent-secondary)' }}>
                          {'★'.repeat(task.difficulty)}{'☆'.repeat(5 - task.difficulty)}
                        </span>
                      )}
                      {task.dueDate && (
                        <span style={{ color: dateColor }}>
                          📅 {task.dueDate}
                          {!task.completed && daysUntilDue !== null && (
                            <span style={{ marginLeft: '4px' }}>
                              ({daysUntilDue === 0 ? '今日まで！' : daysUntilDue < 0 ? `${Math.abs(daysUntilDue)}日超過` : `残り${daysUntilDue}日`})
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* アクションボタン群 */}
              <div style={{ display: 'flex', gap: '4px', marginLeft: 'var(--spacing-sm)', flexShrink: 0 }}>
                {isEditing ? (
                  <>
                    <button onClick={() => saveEdit(task.id)} className="btn-icon" style={{ color: 'var(--success)' }} title="保存">✔</button>
                    <button onClick={cancelEdit} className="btn-icon" style={{ color: 'var(--text-muted)' }} title="キャンセル">✕</button>
                  </>
                ) : (
                  <>
                    {!task.completed && (
                      <button onClick={() => startEditing(task)} className="btn-icon" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }} title="編集">✏</button>
                    )}
                    <button onClick={() => deleteTask(task.id)} className="btn-icon" style={{ color: 'var(--danger)', fontSize: '0.9rem' }} title="削除">✕</button>
                  </>
                )}
              </div>
            </div>

            {/* NPCメッセージポップアップ（ドラクエ風ウィンドウ） */}
            {npcMessage && npcMessage.taskId === task.id && (
              <div
                className="rpg-window"
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 8px)',
                  right: '0',
                  zIndex: 10,
                  maxWidth: '340px',
                  minWidth: '220px',
                  animation: 'popIn 0.2s ease',
                  padding: 'var(--spacing-sm) var(--spacing-md)'
                }}
              >
                <div style={{ color: 'var(--accent-secondary)', fontSize: '0.78rem', marginBottom: '4px' }}>
                  🧚 NPCからのメッセージ
                </div>
                <div style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>{npcMessage.text}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
