import React, { useState } from 'react';
import { Edit2, Save, Trash2, X } from 'lucide-react';
import { FantasyDatePicker, formatFantasyDate } from './FantasyDatePicker';
import { generateCompanionMessage, getCompanionProfile } from './aiService';
import { playQuestComplete } from './soundEffects';

export function TaskList({ tasks, toggleTask, editTask, deleteTask, apiSettings, userLevel }) {
  const [npcMessage, setNpcMessage] = useState(null);
  const [loadingMessageId, setLoadingMessageId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [questCompletePopup, setQuestCompletePopup] = useState(null);

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
    const updatedTask = await toggleTask(task.id);
    if (!updatedTask || !updatedTask.completed) return;

    playQuestComplete();
    setQuestCompletePopup({ title: task.title, expReward: updatedTask.expReward });
    setTimeout(() => setQuestCompletePopup(null), 3000);

    const profile = getCompanionProfile(userLevel);
    setNpcMessage({
      taskId: task.id,
      text: 'メッセージを準備中...',
      icon: profile.icon,
      name: profile.name,
      loading: true
    });

    setLoadingMessageId(task.id);
    try {
      const text = await generateCompanionMessage(
        apiSettings.apiKey,
        apiSettings.modelName,
        task.title,
        userLevel
      );

      setNpcMessage({
        taskId: task.id,
        text,
        icon: profile.icon,
        name: profile.name,
        loading: false
      });
      setTimeout(() => {
        setNpcMessage((current) => (current?.taskId === task.id ? null : current));
      }, 8000);
    } catch (error) {
      console.error(error);
      setNpcMessage({
        taskId: task.id,
        text: profile.fallback(task.title),
        icon: profile.icon,
        name: profile.name,
        loading: false
      });
    } finally {
      setLoadingMessageId(null);
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
        クエストはまだありません。新しい冒険を始めましょう。
      </div>
    );
  }

  return (
    <>
      {questCompletePopup && (
        <div
          style={{
            position: 'fixed',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1500,
            width: 'min(480px, 90vw)',
            animation: 'popIn 0.2s ease',
            pointerEvents: 'none'
          }}
        >
          <div className="rpg-window" style={{ padding: 'var(--spacing-md) var(--spacing-lg)', textAlign: 'center' }}>
            <div style={{ color: 'var(--accent-secondary)', fontSize: '1.1rem', letterSpacing: '2px', marginBottom: '6px' }}>
              ✦ クエスト完了 ✦
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              「{questCompletePopup.title}」
            </div>
            <div style={{ color: 'var(--accent-primary)', fontSize: '1rem', letterSpacing: '1px' }}>
              +{questCompletePopup.expReward} EXP を獲得した！
            </div>
          </div>
        </div>
      )}

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
        {tasks.map((task) => {
          const isEditing = editingId === task.id;
          const daysUntilDue = getDaysUntilDue(task.dueDate);

          let dateColor = 'var(--text-muted)';
          if (!task.completed && daysUntilDue !== null) {
            if (daysUntilDue <= 0) dateColor = 'var(--danger)';
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
                  borderStyle: task.completed ? 'dashed' : 'solid'
                }}
              >
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
                  title={task.completed ? '完了済み' : '完了にする'}
                >
                  {loadingMessageId === task.id ? (
                    <span style={{ animation: 'blink 0.5s infinite' }}>⌛</span>
                  ) : task.completed ? '✔' : '○'}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '0.95rem' }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
                        <FantasyDatePicker
                          value={editDueDate}
                          onChange={setEditDueDate}
                        />
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setEditDifficulty(star)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '0 2px',
                                color: star <= editDifficulty ? 'var(--accent-secondary)' : 'var(--text-muted)'
                              }}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          fontWeight: 'normal',
                          textDecoration: task.completed ? 'line-through' : 'none',
                          color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                          fontSize: '1rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {!task.completed && <span style={{ color: 'var(--accent-primary)', marginRight: '6px' }}>▶</span>}
                        {task.title}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '2px', fontSize: '0.78rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ color: 'var(--accent-secondary)' }}>+{task.expReward} EXP</span>
                        {task.difficulty && (
                          <span style={{ color: 'var(--accent-secondary)' }}>
                            {'★'.repeat(task.difficulty)}
                            {'☆'.repeat(5 - task.difficulty)}
                          </span>
                        )}
                        {task.dueDate && (
                          <span style={{ color: dateColor }}>
                            期限 {formatFantasyDate(task.dueDate)}
                            {!task.completed && daysUntilDue !== null && (
                              <span style={{ marginLeft: '4px' }}>
                                (
                                {daysUntilDue === 0
                                  ? '今日まで'
                                  : daysUntilDue < 0
                                    ? `${Math.abs(daysUntilDue)}日超過`
                                    : `あと${daysUntilDue}日`}
                                )
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '4px', marginLeft: 'var(--spacing-sm)', flexShrink: 0 }}>
                  {isEditing ? (
                    <>
                      <button onClick={() => saveEdit(task.id)} className="btn-icon" style={{ color: 'var(--success)' }} title="保存">
                        <Save size={16} />
                      </button>
                      <button onClick={cancelEdit} className="btn-icon" style={{ color: 'var(--text-muted)' }} title="キャンセル">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      {!task.completed && (
                        <button onClick={() => startEditing(task)} className="btn-icon" style={{ color: 'var(--text-secondary)' }} title="編集">
                          <Edit2 size={16} />
                        </button>
                      )}
                      <button onClick={() => deleteTask(task.id)} className="btn-icon" style={{ color: 'var(--danger)' }} title="削除">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {npcMessage && npcMessage.taskId === task.id && (
                <div
                  className="rpg-window"
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 8px)',
                    right: '0',
                    zIndex: 10,
                    maxWidth: '360px',
                    minWidth: '240px',
                    animation: 'popIn 0.2s ease',
                    padding: 'var(--spacing-sm) var(--spacing-md)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)',
                        fontSize: '1.1rem'
                      }}
                    >
                      {npcMessage.icon}
                    </div>
                    <div>
                      <div style={{ color: 'var(--accent-secondary)', fontSize: '0.8rem' }}>NPCメッセージ</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{npcMessage.name}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>
                    {npcMessage.loading ? (
                      <span style={{ color: 'var(--text-muted)' }}>{npcMessage.text}</span>
                    ) : (
                      npcMessage.text
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
