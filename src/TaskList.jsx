import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Edit2, Save, Trash2, X } from 'lucide-react';
import { FantasyDatePicker, formatFantasyDate } from './FantasyDatePicker';
import { parseQuestMetadata } from './taskBreakdown';
import { playQuestComplete } from './soundEffects';

function getCompanionProfile(userLevel = 1) {
  if (userLevel >= 20) {
    return {
      icon: '🐉',
      name: '古竜の導師',
      tone: '威厳がありつつ温かく、達成を大きく称える',
      fallback: (taskTitle) => `見事だ、勇者よ。「${taskTitle}」を成し遂げた力は本物だ。この調子で次の試練も突破しよう。`
    };
  }

  if (userLevel >= 10) {
    return {
      icon: '🧙',
      name: '旅の魔法使い',
      tone: '落ち着いていて頼れる、少し知的で前向き',
      fallback: (taskTitle) => `いい進み方だね。「${taskTitle}」を終えたなら、次の行動もきっと軽くなる。この勢いをつなげよう。`
    };
  }

  return {
    icon: '🧚',
    name: 'ギルドの案内妖精',
    tone: '親しみやすく元気で、短く励ます',
    fallback: (taskTitle) => `やったね。「${taskTitle}」の完了、おみごと。次のクエストもこの調子で進めよう。`
  };
}

function getDaysUntilDue(dueDateStr) {
  if (!dueDateStr) return null;

  const due = new Date(dueDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}

function getStatusSymbol(status) {
  if (status === 'completed') return '✔';
  if (status === 'in_progress') return '◐';
  return '○';
}

function getStatusTitle(status) {
  if (status === 'completed') return '未着手に戻す';
  if (status === 'in_progress') return '完了にする';
  return '進行中にする';
}

function buildTaskGroups(tasks) {
  const taskMap = new Map(tasks.map((task) => [task.id, task]));
  const childBuckets = new Map();
  const roots = [];

  for (const task of tasks) {
    const metadata = parseQuestMetadata(task.description);
    if (metadata?.role === 'sub' && metadata.parentTaskId && taskMap.has(metadata.parentTaskId)) {
      const current = childBuckets.get(metadata.parentTaskId) ?? [];
      current.push(task);
      childBuckets.set(metadata.parentTaskId, current);
      continue;
    }
    roots.push(task);
  }

  return roots.map((task) => ({
    task,
    metadata: parseQuestMetadata(task.description),
    children: childBuckets.get(task.id) ?? []
  }));
}

function TaskRow({
  task,
  metadata,
  isEditing,
  loadingMessageId,
  editTitle,
  editDueDate,
  editDifficulty,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onToggle,
  onEditTitleChange,
  onEditDueDateChange,
  onEditDifficultyChange,
  compact = false
}) {
  const daysUntilDue = getDaysUntilDue(task.dueDate);
  const isOverdue = !task.completed && daysUntilDue !== null && daysUntilDue < 0;
  const isDueToday = !task.completed && daysUntilDue === 0;

  let dateColor = 'var(--text-muted)';
  if (!task.completed && daysUntilDue !== null) {
    if (daysUntilDue <= 0) dateColor = 'var(--danger)';
    else if (daysUntilDue <= 2) dateColor = 'var(--warning)';
  }

  return (
    <div
      className={compact ? '' : 'rpg-window'}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: compact ? '10px 12px' : 'var(--spacing-sm) var(--spacing-md)',
        opacity: task.completed ? 0.5 : 1,
        marginBottom: 0,
        border: compact ? '1px solid rgba(255,255,255,0.08)' : undefined,
        borderRadius: compact ? 'var(--radius-sm)' : undefined,
        background: compact ? 'rgba(255,255,255,0.03)' : undefined,
        borderStyle: !compact ? (task.completed ? 'dashed' : 'solid') : undefined,
        borderColor: !compact
          ? (isOverdue
            ? 'rgba(220, 60, 60, 0.8)'
            : isDueToday
              ? 'rgba(255, 190, 70, 0.85)'
              : undefined)
          : undefined,
        boxShadow: !compact && (isOverdue || isDueToday)
          ? '0 0 0 1px rgba(255,255,255,0.05), inset 0 0 18px rgba(255,150,80,0.08)'
          : undefined
      }}
    >
      <button
        onClick={() => onToggle(task)}
        style={{
          color: task.completed ? 'var(--success)' : 'var(--text-muted)',
          marginRight: 'var(--spacing-md)',
          fontSize: compact ? '1rem' : '1.2rem',
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
              onChange={(event) => onEditTitleChange(event.target.value)}
              style={{ padding: '4px 8px', fontSize: '0.95rem' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
              <FantasyDatePicker value={editDueDate} onChange={onEditDueDateChange} />
              <div
                style={{
                  display: 'flex',
                  gap: '2px',
                  padding: '4px 8px',
                  border: '2px solid var(--border-window)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(180deg, rgba(22, 30, 54, 0.96) 0%, rgba(8, 15, 31, 0.96) 100%)',
                  boxShadow: 'inset 0 0 0 1px rgba(109, 139, 212, 0.22)'
                }}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => onEditDifficultyChange(star)}
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
            {metadata?.role && (
              <div style={{ marginBottom: '6px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.68rem',
                    letterSpacing: '0.08em',
                    color: metadata.role === 'main' ? 'var(--accent-secondary)' : 'var(--accent-primary)',
                    border: `1px solid ${metadata.role === 'main' ? 'rgba(255, 204, 102, 0.45)' : 'rgba(255, 153, 102, 0.45)'}`,
                    borderRadius: '999px',
                    padding: '2px 8px',
                    background: 'rgba(255,255,255,0.03)'
                  }}
                >
                  {metadata.role === 'main' ? 'メインクエスト' : 'サブクエスト'}
                </span>
                {metadata.role === 'sub' && metadata.parentTitle && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    親: {metadata.parentTitle}
                  </span>
                )}
              </div>
            )}
            <div
              style={{
                fontWeight: 'normal',
                textDecoration: task.completed ? 'line-through' : 'none',
                color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                fontSize: compact ? '0.94rem' : '1rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
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
            <button onClick={() => onSaveEdit(task.id)} className="btn-icon" style={{ color: 'var(--success)' }} title="保存">
              <Save size={16} />
            </button>
            <button onClick={onCancelEdit} className="btn-icon" style={{ color: 'var(--text-muted)' }} title="キャンセル">
              <X size={16} />
            </button>
          </>
        ) : (
          <>
            {!task.completed && (
              <button onClick={() => onStartEditing(task)} className="btn-icon" style={{ color: 'var(--text-secondary)' }} title="編集">
                <Edit2 size={16} />
              </button>
            )}
            <button onClick={() => onDelete(task.id)} className="btn-icon" style={{ color: 'var(--danger)' }} title="削除">
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function TaskList({
  tasks,
  toggleTask,
  editTask,
  deleteTask,
  userLevel,
  generateCompanionMessage,
  levelUpActive,
  onCompletionSequenceStart,
  onCompletionSequenceEnd
}) {
  const [npcMessage, setNpcMessage] = useState(null);
  const [pendingNpcMessage, setPendingNpcMessage] = useState(null);
  const [loadingMessageId, setLoadingMessageId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [questCompletePopup, setQuestCompletePopup] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editDifficulty, setEditDifficulty] = useState(1);
  const [openGroupIds, setOpenGroupIds] = useState({});

  const questPopupTimerRef = useRef(null);
  const npcHideTimerRef = useRef(null);
  const previousTaskIdsRef = useRef(tasks.map((task) => task.id));

  const groups = useMemo(() => buildTaskGroups(tasks), [tasks]);

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

  const closeNpcMessage = useCallback((taskId) => {
    if (npcHideTimerRef.current) clearTimeout(npcHideTimerRef.current);
    setNpcMessage((current) => (current?.taskId === taskId ? null : current));
    onCompletionSequenceEnd?.(taskId);
  }, [onCompletionSequenceEnd]);

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
      onCompletionSequenceEnd?.(addedTask.id);
    }

    previousTaskIdsRef.current = tasks.map((task) => task.id);
  }, [onCompletionSequenceEnd, tasks]);

  useEffect(() => {
    if (questCompletePopup || levelUpActive || !pendingNpcMessage) return undefined;

    setNpcMessage(pendingNpcMessage);
    setPendingNpcMessage(null);

    if (npcHideTimerRef.current) clearTimeout(npcHideTimerRef.current);
    npcHideTimerRef.current = setTimeout(() => {
      closeNpcMessage(pendingNpcMessage.taskId);
    }, 5000);

    return () => {
      if (npcHideTimerRef.current) clearTimeout(npcHideTimerRef.current);
    };
  }, [closeNpcMessage, levelUpActive, pendingNpcMessage, questCompletePopup]);

  useEffect(() => {
    if (!npcMessage) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        closeNpcMessage(npcMessage.taskId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeNpcMessage, npcMessage]);

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
      onCompletionSequenceEnd?.(task.id);
      setLoadingMessageId(null);
      return;
    }

    if (questPopupTimerRef.current) clearTimeout(questPopupTimerRef.current);
    if (npcHideTimerRef.current) clearTimeout(npcHideTimerRef.current);

    setNpcMessage(null);
    setPendingNpcMessage(null);
    onCompletionSequenceStart?.(task.id);

    playQuestComplete();
    setQuestCompletePopup({ title: updatedTask.title, expReward: updatedTask.expReward });
    questPopupTimerRef.current = setTimeout(() => {
      setQuestCompletePopup(null);
    }, 2500);

    const profile = getCompanionProfile(userLevel);
    queueNpcMessage(task.id, profile, 'メッセージ生成中...', true);

    try {
      const response = await generateCompanionMessage({
        taskTitle: updatedTask.title,
        userLevel
      });
      queueNpcMessage(task.id, profile, response.message ?? '', false);
    } catch (error) {
      console.error(error);
      queueNpcMessage(task.id, profile, profile.fallback(updatedTask.title), false);
    } finally {
      setLoadingMessageId(null);
    }
  };

  const toggleGroup = (taskId) => {
    setOpenGroupIds((current) => ({
      ...current,
      [taskId]: !current[taskId]
    }));
  };

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
          onClick={() => closeNpcMessage(npcMessage.taskId)}
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9600,
            pointerEvents: 'auto'
          }}
        >
          <div
            className="rpg-window"
            onClick={() => closeNpcMessage(npcMessage.taskId)}
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
                <div style={{ color: 'var(--accent-secondary)', fontSize: '0.82rem' }}>{npcMessage.name} からの一言</div>
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
        {groups.length === 0 ? (
          <div className="rpg-window" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--spacing-xl)' }}>
            クエストはまだありません。新しい課題を追加しましょう。
          </div>
        ) : groups.map(({ task, metadata, children }) => {
          const isGroupOpen = openGroupIds[task.id] ?? true;
          const isEditing = editingId === task.id;

          return (
            <div key={task.id} style={{ display: 'grid', gap: '8px' }}>
              {children.length > 0 ? (
                <div className="rpg-window" style={{ padding: '10px', display: 'grid', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(task.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      padding: 0
                    }}
                  >
                    <span style={{ fontSize: '0.76rem', color: 'var(--accent-secondary)', letterSpacing: '0.08em' }}>
                      クエストグループ
                    </span>
                    <ChevronDown
                      size={16}
                      style={{ transform: isGroupOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s ease' }}
                    />
                  </button>

                  <TaskRow
                    task={task}
                    metadata={metadata}
                    isEditing={isEditing}
                    loadingMessageId={loadingMessageId}
                    editTitle={editTitle}
                    editDueDate={editDueDate}
                    editDifficulty={editDifficulty}
                    onStartEditing={startEditing}
                    onSaveEdit={saveEdit}
                    onCancelEdit={cancelEdit}
                    onDelete={deleteTask}
                    onToggle={handleToggle}
                    onEditTitleChange={setEditTitle}
                    onEditDueDateChange={setEditDueDate}
                    onEditDifficultyChange={setEditDifficulty}
                  />

                  {isGroupOpen && (
                    <div style={{ display: 'grid', gap: '8px', paddingLeft: '14px', borderLeft: '2px solid rgba(255, 204, 102, 0.25)' }}>
                      {children.map((child) => (
                        <TaskRow
                          key={child.id}
                          task={child}
                          metadata={parseQuestMetadata(child.description)}
                          isEditing={editingId === child.id}
                          loadingMessageId={loadingMessageId}
                          editTitle={editTitle}
                          editDueDate={editDueDate}
                          editDifficulty={editDifficulty}
                          onStartEditing={startEditing}
                          onSaveEdit={saveEdit}
                          onCancelEdit={cancelEdit}
                          onDelete={deleteTask}
                          onToggle={handleToggle}
                          onEditTitleChange={setEditTitle}
                          onEditDueDateChange={setEditDueDate}
                          onEditDifficultyChange={setEditDifficulty}
                          compact
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <TaskRow
                  task={task}
                  metadata={metadata}
                  isEditing={isEditing}
                  loadingMessageId={loadingMessageId}
                  editTitle={editTitle}
                  editDueDate={editDueDate}
                  editDifficulty={editDifficulty}
                  onStartEditing={startEditing}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEdit}
                  onDelete={deleteTask}
                  onToggle={handleToggle}
                  onEditTitleChange={setEditTitle}
                  onEditDueDateChange={setEditDueDate}
                  onEditDifficultyChange={setEditDifficulty}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
