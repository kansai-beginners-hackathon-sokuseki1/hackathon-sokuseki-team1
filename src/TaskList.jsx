import React, { useEffect, useRef, useState } from 'react';
import { Edit2, Save, Trash2, X } from 'lucide-react';
import { FantasyDatePicker, formatFantasyDate } from './FantasyDatePicker';
import { generateCompanionMessage, getCompanionProfile } from './aiService';
import { playQuestComplete } from './soundEffects';

export function TaskList({
  tasks,
  toggleTask,
  editTask,
  deleteTask,
  apiSettings,
  userLevel,
  levelUpActive
}) {
  const [npcMessage, setNpcMessage] = useState(null);
  const [pendingNpcMessage, setPendingNpcMessage] = useState(null);
  const [loadingMessageId, setLoadingMessageId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [questCompletePopup, setQuestCompletePopup] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editDifficulty, setEditDifficulty] = useState(1);

  const questPopupTimerRef = useRef(null);
  const npcHideTimerRef = useRef(null);
  const previousTaskIdsRef = useRef(tasks.map((task) => task.id));

  useEffect(() => () => {
    if (questPopupTimerRef.current) clearTimeout(questPopupTimerRef.current);
    if (npcHideTimerRef.current) clearTimeout(npcHideTimerRef.current);
  }, []);

  useEffect(() => {
    const previousTaskIds = previousTaskIdsRef.current;
    const addedTask = tasks.find((task) => !previousTaskIds.includes(task.id));

    if (addedTask && !addedTask.completed) {
      if (questPopupTimerRef.current) clearTimeout(questPopupTimerRef.current);
      if (npcHideTimerRef.current) clearTimeout(npcHideTimerRef.current);
      setQuestCompletePopup(null);
      setNpcMessage(null);
      setPendingNpcMessage(null);
    }

    previousTaskIdsRef.current = tasks.map((task) => task.id);
  }, [tasks]);

  useEffect(() => {
    if (questCompletePopup || levelUpActive || !pendingNpcMessage) return undefined;

    setNpcMessage(pendingNpcMessage);
    setPendingNpcMessage(null);

    if (npcHideTimerRef.current) clearTimeout(npcHideTimerRef.current);
    npcHideTimerRef.current = setTimeout(() => {
      setNpcMessage((current) => (current?.taskId === pendingNpcMessage.taskId ? null : current));
    }, 8000);

    return () => {
      if (npcHideTimerRef.current) clearTimeout(npcHideTimerRef.current);
    };
  }, [levelUpActive, pendingNpcMessage, questCompletePopup]);

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

  const queueNpcMessage = (taskId, profile, text, loading = false) => {
    setPendingNpcMessage({
      taskId,
      text,
      icon: profile.icon,
      name: profile.name,
      loading
    });
  };

  const handleToggle = async (task) => {
    setLoadingMessageId(task.id);

    let result;
    try {
      result = await toggleTask(task.id);
    } catch (error) {
      console.error(error);
      setLoadingMessageId(null);
      return;
    }

    if (!result) {
      setLoadingMessageId(null);
      return;
    }

    const { task: updatedTask, completedNow } = result;
    if (!completedNow) {
      setLoadingMessageId(null);
      return;
    }

    if (questPopupTimerRef.current) clearTimeout(questPopupTimerRef.current);
    if (npcHideTimerRef.current) clearTimeout(npcHideTimerRef.current);

    setNpcMessage(null);
    setPendingNpcMessage(null);

    playQuestComplete();
    setQuestCompletePopup({ title: updatedTask.title, expReward: updatedTask.expReward });
    questPopupTimerRef.current = setTimeout(() => {
      setQuestCompletePopup(null);
    }, 2500);

    const profile = getCompanionProfile(userLevel);
    queueNpcMessage(task.id, profile, 'メッセージを準備中...', true);

    try {
      const text = await generateCompanionMessage(
        apiSettings.apiKey,
        apiSettings.modelName,
        updatedTask.title,
        userLevel
      );
      queueNpcMessage(task.id, profile, text, false);
    } catch (error) {
      console.error(error);
      queueNpcMessage(task.id, profile, profile.fallback(updatedTask.title), false);
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

  const getStatusSymbol = (status) => {
    if (status === 'completed') return '✔';
    if (status === 'in_progress') return '◐';
    return '○';
  };

  const getStatusTitle = (status) => {
    if (status === 'completed') return '未着手に戻す';
    if (status === 'in_progress') return '完了にする';
    return '進行中にする';
  };

  if (tasks.length === 0) {
    return (
      <div className="rpg-window" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--spacing-xl)' }}>
        クエストはまだありません。新しい依頼を始めましょう。
      </div>
    );
  }

  return (
    <>
      {questCompletePopup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9500,
            pointerEvents: 'none'
          }}
        >
          <div
            className="rpg-window"
            style={{
              width: 'min(480px, 90vw)',
              padding: 'var(--spacing-lg)',
              textAlign: 'center',
              animation: 'popIn 0.2s ease',
              boxShadow: '0 0 28px rgba(0, 0, 0, 0.85), 0 0 40px rgba(255, 238, 0, 0.18)'
            }}
          >
            <div style={{ color: 'var(--accent-secondary)', fontSize: '1.1rem', letterSpacing: '2px', marginBottom: '8px' }}>
              クエスト達成
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '10px', lineHeight: 1.7 }}>
              「{questCompletePopup.title}」
            </div>
            <div style={{ color: 'var(--accent-primary)', fontSize: '1rem', letterSpacing: '1px' }}>
              +{questCompletePopup.expReward} EXP を獲得
            </div>
          </div>
        </div>
      )}

      {npcMessage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9600,
            pointerEvents: 'none'
          }}
        >
          <div
            className="rpg-window"
            style={{
              width: 'min(420px, 90vw)',
              padding: 'var(--spacing-md) var(--spacing-lg)',
              animation: 'popIn 0.2s ease',
              boxShadow: '0 0 24px rgba(0, 0, 0, 0.85), 0 0 32px rgba(0, 200, 255, 0.14)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  fontSize: '1.2rem'
                }}
              >
                {npcMessage.icon}
              </div>
              <div>
                <div style={{ color: 'var(--accent-secondary)', fontSize: '0.82rem' }}>NPCメッセージ</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>{npcMessage.name}</div>
              </div>
            </div>
            <div style={{ fontSize: '0.92rem', lineHeight: 1.8 }}>
              {npcMessage.loading ? (
                <span style={{ color: 'var(--text-muted)' }}>{npcMessage.text}</span>
              ) : (
                npcMessage.text
              )}
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
            <div key={task.id}>
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
                  title={getStatusTitle(task.status)}
                >
                  {loadingMessageId === task.id ? (
                    <span style={{ animation: 'blink 0.5s infinite' }}>…</span>
                  ) : (
                    getStatusSymbol(task.status)
                  )}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        style={{ padding: '4px 8px', fontSize: '0.95rem' }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
                        <FantasyDatePicker value={editDueDate} onChange={setEditDueDate} />
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
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {task.status === 'todo' ? '未着手' : task.status === 'in_progress' ? '進行中' : '完了'}
                        </span>
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
            </div>
          );
        })}
      </div>
    </>
  );
}
