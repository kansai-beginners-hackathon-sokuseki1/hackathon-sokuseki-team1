import { useState, useEffect, useCallback } from 'react';
import { api } from './api';

// 累計XPからレベルと現在EXPを計算（バックエンドと同じ式）
function computeLevelFromXp(totalXp) {
  let level = 1;
  let remaining = totalXp;
  while (true) {
    const required = Math.floor(100 * Math.pow(1.2, level - 1));
    if (remaining < required) break;
    remaining -= required;
    level++;
  }
  return { level, currentExp: remaining };
}

// DBのタスク形式をフロントエンド形式に変換
function normalizeTask(dbTask) {
  return {
    id:         dbTask.id,
    title:      dbTask.title,
    completed:  dbTask.status === 'completed',
    expReward:  dbTask.expReward ?? 10,
    difficulty: dbTask.difficulty ?? 1,
    dueDate:    dbTask.dueDate ? dbTask.dueDate.slice(0, 10) : null, // YYYY-MM-DD
    createdAt:  dbTask.createdAt ? new Date(dbTask.createdAt).getTime() : Date.now(),
    status:     dbTask.status
  };
}

export const getRequiredExp = (level) => Math.floor(100 * Math.pow(1.2, level - 1));

export const useAppState = () => {
  const [tasks, setTasks] = useState([]);
  const [userStats, setUserStats] = useState({ level: 1, currentExp: 0 });
  const [totalXp, setTotalXp] = useState(0);
  const [apiSettings, setApiSettings] = useState(() => {
    const saved = localStorage.getItem('apiSettings');
    return saved ? JSON.parse(saved) : { apiKey: '', modelName: 'google/gemini-2.5-flash' };
  });
  const [levelUpData, setLevelUpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API設定はlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('apiSettings', JSON.stringify(apiSettings));
  }, [apiSettings]);

  // 初回データ取得
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksData, progressData] = await Promise.all([
        api.getTasks({ pageSize: 100, sort: 'createdAt', order: 'desc' }),
        api.getProgress()
      ]);
      setTasks(tasksData.tasks.map(normalizeTask));
      const xp = Number(progressData.progress.xp);
      setTotalXp(xp);
      setUserStats(computeLevelFromXp(xp));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // タスク追加
  const addTask = async (title, difficulty = 1, dueDate = null) => {
    const data = await api.createTask({ title, difficulty, dueDate });
    const task = normalizeTask(data.task);
    setTasks(prev => [task, ...prev]);
    return task;
  };

  // タスク完了トグル
  // 完了時のみEXP付与、取り消し時はEXP変化なし（元の仕様を維持）
  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return null;
    const isCompleting = !task.completed;

    if (isCompleting) {
      const res = await api.completeTask(id);
      const updated = normalizeTask(res.task);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));

      if (res.progress) {
        const prevLevel = userStats.level;
        const newXp = Number(res.progress.xp);
        const newStats = computeLevelFromXp(newXp);
        setTotalXp(newXp);
        setUserStats(newStats);
        if (newStats.level > prevLevel) {
          setLevelUpData(newStats);
        }
      }
      return updated;
    } else {
      // 未完了に戻す（EXPは変化しない）
      const res = await api.updateTask(id, { status: 'todo' });
      const updated = normalizeTask(res.task);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
      return updated;
    }
  };

  // タスク編集
  const editTask = async (id, newTitle, newDifficulty, newDueDate) => {
    const res = await api.updateTask(id, {
      title: newTitle,
      difficulty: newDifficulty,
      dueDate: newDueDate || null
    });
    const updated = normalizeTask(res.task);
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
  };

  // タスク削除
  const deleteTask = async (id) => {
    await api.deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const clearLevelUpData = () => setLevelUpData(null);

  const calculateExpByDifficulty = (difficulty) => {
    const multipliers = [0, 1, 3, 6, 12, 25];
    const d = Math.max(1, Math.min(5, Math.floor(difficulty) || 1));
    return 10 * multipliers[d];
  };

  return {
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
    calculateExpByDifficulty,
    loading,
    error,
    reload: loadData
  };
};
