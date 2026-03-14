import { useState, useEffect, useCallback } from 'react';
import { api } from './api';

function computeLevelFromXp(totalXp) {
  let level = 1;
  let remaining = totalXp;

  while (true) {
    const required = Math.floor(100 * Math.pow(1.2, level - 1));
    if (remaining < required) break;
    remaining -= required;
    level += 1;
  }

  return { level, currentExp: remaining };
}

function normalizeTask(dbTask) {
  return {
    id: dbTask.id,
    title: dbTask.title,
    completed: dbTask.status === 'completed',
    expReward: dbTask.expReward ?? 10,
    difficulty: dbTask.difficulty ?? 1,
    dueDate: dbTask.dueDate ? dbTask.dueDate.slice(0, 10) : null,
    createdAt: dbTask.createdAt ? new Date(dbTask.createdAt).getTime() : Date.now(),
    status: dbTask.status
  };
}

export const getRequiredExp = (level) => Math.floor(100 * Math.pow(1.2, level - 1));

export const useAppState = () => {
  const [tasks, setTasks] = useState([]);
  const [userStats, setUserStats] = useState({ level: 1, currentExp: 0 });
  const [apiSettings, setApiSettings] = useState(() => {
    const saved = localStorage.getItem('apiSettings');
    return saved ? JSON.parse(saved) : { apiKey: '', modelName: 'google/gemini-2.5-flash' };
  });
  const [levelUpData, setLevelUpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.setItem('apiSettings', JSON.stringify(apiSettings));
  }, [apiSettings]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [tasksData, progressData] = await Promise.all([
        api.getTasks({ pageSize: 100, sort: 'createdAt', order: 'desc' }),
        api.getProgress()
      ]);

      setTasks(tasksData.tasks.map(normalizeTask));
      setUserStats(computeLevelFromXp(Number(progressData.progress.xp)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addTask = async (title, difficulty = 1, dueDate = null) => {
    const data = await api.createTask({ title, difficulty, dueDate });
    const task = normalizeTask(data.task);
    setTasks((prev) => [task, ...prev]);
    return task;
  };

  const applyProgress = (progress) => {
    if (!progress) return null;

    const nextXp = Number(progress.xp);
    const nextStats = computeLevelFromXp(nextXp);
    setUserStats(nextStats);
    return nextStats;
  };

  const toggleTask = async (id) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) return null;

    if (task.status === 'todo') {
      const res = await api.updateTask(id, { status: 'in_progress' });
      const updated = normalizeTask(res.task);
      setTasks((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return { task: updated, completedNow: false };
    }

    if (task.status === 'in_progress') {
      const res = await api.completeTask(id);
      const updated = normalizeTask(res.task);
      setTasks((prev) => prev.map((item) => (item.id === id ? updated : item)));

      if (res.progress) {
        const prevLevel = userStats.level;
        const nextStats = applyProgress(res.progress);
        if (nextStats && nextStats.level > prevLevel) {
          setLevelUpData(nextStats);
        }
      }

      return {
        task: updated,
        completedNow: true,
        leveledUp: res.progress ? Number(res.progress.level) > userStats.level : false
      };
    }

    const res = await api.updateTask(id, { status: 'todo' });
    const updated = normalizeTask(res.task);
    setTasks((prev) => prev.map((item) => (item.id === id ? updated : item)));
    applyProgress(res.progress);
    return { task: updated, completedNow: false };
  };

  const editTask = async (id, newTitle, newDifficulty, newDueDate) => {
    const res = await api.updateTask(id, {
      title: newTitle,
      difficulty: newDifficulty,
      dueDate: newDueDate || null
    });
    const updated = normalizeTask(res.task);
    setTasks((prev) => prev.map((item) => (item.id === id ? updated : item)));
  };

  const deleteTask = async (id) => {
    await api.deleteTask(id);
    setTasks((prev) => prev.filter((item) => item.id !== id));
  };

  const clearLevelUpData = () => setLevelUpData(null);

  const calculateExpByDifficulty = (difficulty) => {
    const multipliers = [0, 1, 3, 6, 12, 25];
    const normalized = Math.max(1, Math.min(5, Math.floor(difficulty) || 1));
    return 10 * multipliers[normalized];
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
