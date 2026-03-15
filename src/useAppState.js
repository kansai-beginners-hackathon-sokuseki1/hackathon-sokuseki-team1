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

const DEFAULT_AI_SETTINGS = {
  useServerDefault: true,
  provider: 'openrouter',
  model: 'google/gemini-2.5-flash',
  baseUrl: '',
  hasUserApiKey: false,
  defaultProvider: 'openrouter',
  defaultModel: 'google/gemini-2.5-flash',
  providers: ['openrouter', 'openai']
};

const DEFAULT_PROFILE = {
  onboardingCompleted: false,
  hasProfile: false,
  categories: [],
  preferences: []
};

export const getRequiredExp = (level) => Math.floor(100 * Math.pow(1.2, level - 1));

export const useAppState = () => {
  const [tasks, setTasks] = useState([]);
  const [userStats, setUserStats] = useState({ level: 1, currentExp: 0 });
  const [aiSettings, setAiSettings] = useState(DEFAULT_AI_SETTINGS);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [levelUpData, setLevelUpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [tasksData, progressData, profileData, aiSettingsData] = await Promise.all([
        api.getTasks({ pageSize: 100, sort: 'createdAt', order: 'desc' }),
        api.getProgress(),
        api.getProfile(),
        api.getAiSettings()
      ]);

      setTasks(tasksData.tasks.map(normalizeTask));
      setUserStats(computeLevelFromXp(Number(progressData.progress.xp)));
      setProfile({
        onboardingCompleted: profileData.onboardingCompleted,
        hasProfile: profileData.hasProfile,
        categories: profileData.categories,
        preferences: profileData.preferences
      });
      setAiSettings({
        ...DEFAULT_AI_SETTINGS,
        ...aiSettingsData
      });
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

  const saveProfile = async ({ preferences, onboardingCompleted }) => {
    const result = await api.saveProfile({ preferences, onboardingCompleted });
    setProfile({
      onboardingCompleted: result.onboardingCompleted,
      hasProfile: result.hasProfile,
      categories: result.categories,
      preferences: result.preferences
    });
    return result;
  };

  const saveAiSettings = async (payload) => {
    const result = await api.saveAiSettings(payload);
    setAiSettings({
      ...DEFAULT_AI_SETTINGS,
      ...result
    });
    return result;
  };

  const testAiSettings = async (payload) => api.testAiSettings(payload);

  const scoreDifficulty = async (payload) => api.scoreDifficulty(payload);

  const clearLevelUpData = () => setLevelUpData(null);

  return {
    tasks,
    userStats,
    aiSettings,
    profile,
    setProfile,
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
    error,
    reload: loadData
  };
};
