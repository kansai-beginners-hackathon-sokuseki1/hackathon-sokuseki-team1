import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api';
import { parseQuestMetadata, serializeQuestBreakdown, serializeSubQuestMetadata } from './taskBreakdown';

function computeLevelFromXp(totalXp) {
  const safeTotalXp = Number.isFinite(Number(totalXp)) ? Number(totalXp) : 0;
  let level = 1;
  let remaining = safeTotalXp;

  while (true) {
    const required = Math.floor(100 * Math.pow(1.2, level - 1));
    if (remaining < required) break;
    remaining -= required;
    level += 1;
  }

  return { level, currentExp: remaining };
}

function normalizeProgressPayload(progress) {
  return {
    xp: Number(progress?.xp ?? 0),
    level: Number(progress?.level ?? 1),
    currentExp: Number(progress?.currentExp ?? 0),
    completedTaskCount: Number(progress?.completedTaskCount ?? progress?.completed_task_count ?? 0)
  };
}

function normalizeTask(dbTask) {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description ?? '',
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
  provider: 'openai',
  model: 'gpt-4o-mini',
  baseUrl: '',
  hasUserApiKey: false,
  defaultProvider: 'openai',
  defaultModel: 'gpt-4o-mini',
  providers: ['openai', 'openrouter'],
  modelOptionsByProvider: {
    openai: ['gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o', 'gpt-4o-mini', 'o4-mini'],
    openrouter: [
      'google/gemini-2.5-flash',
      'google/gemini-2.5-pro',
      'openai/gpt-4o-mini',
      'openai/gpt-4.1-mini',
      'anthropic/claude-3.5-haiku',
      'meta-llama/llama-3.3-70b-instruct'
    ]
  }
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
  const userStatsRef = useRef(userStats);

  useEffect(() => {
    userStatsRef.current = userStats;
  }, [userStats]);

  const loadAllTasks = useCallback(async () => {
    const pageSize = 100;
    let page = 1;
    let total = 0;
    const allTasks = [];

    do {
      const response = await api.getTasks({ page, pageSize, sort: 'createdAt', order: 'desc' });
      const items = Array.isArray(response.tasks) ? response.tasks : [];
      const paginationTotal = Number(response.pagination?.total ?? 0);

      allTasks.push(...items.map(normalizeTask));
      total = paginationTotal;
      page += 1;
    } while (allTasks.length < total);

    return allTasks;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [tasksData, progressData, profileData, aiSettingsData] = await Promise.all([
        loadAllTasks(),
        api.getProgress(),
        api.getProfile(),
        api.getAiSettings()
      ]);

      const safeProgress = normalizeProgressPayload(progressData?.progress);
      setTasks(tasksData);
      setUserStats(computeLevelFromXp(safeProgress.xp));
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
  }, [loadAllTasks]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addTask = async (title, difficulty = 1, dueDate = null, questBreakdown = null) => {
    const subQuests = Array.isArray(questBreakdown?.subQuests) ? questBreakdown.subQuests : [];
    const mainTaskResponse = await api.createTask({
      title,
      difficulty,
      dueDate,
      description: serializeQuestBreakdown(questBreakdown)
    });
    const task = normalizeTask(mainTaskResponse.task);

    const subtaskPayloads = subQuests
      .map((subQuest) => ({
        title: String(subQuest?.title || '').trim(),
        difficulty: Math.max(1, difficulty - 1),
        dueDate,
        description: serializeSubQuestMetadata({
          parentTaskId: task.id,
          parentTitle: title,
          mainQuest: questBreakdown?.mainQuest,
          subQuest
        })
      }))
      .filter((subTask) => subTask.title);

    let createdSubtasks = [];
    if (subtaskPayloads.length > 0) {
      const bulkResponse = await api.createTasksBulk({ tasks: subtaskPayloads });
      createdSubtasks = (bulkResponse.tasks ?? []).map(normalizeTask);
    }

    setTasks((prev) => [task, ...createdSubtasks, ...prev]);
    return task;
  };

  const applyProgress = useCallback((progress) => {
    if (!progress) return null;

    const safeProgress = normalizeProgressPayload(progress);
    const nextXp = safeProgress.xp;
    const nextStats = computeLevelFromXp(nextXp);
    setUserStats(nextStats);
    return nextStats;
  }, []);

  const syncParentTaskStatus = useCallback(async (currentTasks, parentTaskId, updatedChildTask) => {
    if (!parentTaskId) return { tasks: currentTasks, parentTask: null, parentCompletedNow: false };

    const parentTask = currentTasks.find((item) => item.id === parentTaskId);
    if (!parentTask) return { tasks: currentTasks, parentTask: null, parentCompletedNow: false };

    const siblingTasks = currentTasks.filter((item) => {
      const metadata = parseQuestMetadata(item.description);
      return metadata?.role === 'sub' && metadata.parentTaskId === parentTaskId;
    }).map((item) => (item.id === updatedChildTask.id ? updatedChildTask : item));

    if (siblingTasks.length === 0) {
      return { tasks: currentTasks, parentTask, parentCompletedNow: false };
    }

    const allCompleted = siblingTasks.every((item) => item.status === 'completed');
    const anyStarted = siblingTasks.some((item) => item.status !== 'todo');
    const desiredParentStatus = allCompleted ? 'completed' : anyStarted ? 'in_progress' : 'todo';

    if (parentTask.status === desiredParentStatus) {
      return { tasks: currentTasks, parentTask, parentCompletedNow: false };
    }

    let parentResponse;
    if (desiredParentStatus === 'completed') {
      parentResponse = await api.completeTask(parentTaskId);
    } else {
      parentResponse = await api.updateTask(parentTaskId, { status: desiredParentStatus });
    }

    const updatedParentTask = normalizeTask(parentResponse.task);
    const nextTasks = currentTasks.map((item) => (item.id === updatedParentTask.id ? updatedParentTask : item));
    applyProgress(parentResponse.progress);

    return {
      tasks: nextTasks,
      parentTask: updatedParentTask,
      parentCompletedNow: desiredParentStatus === 'completed'
    };
  }, [applyProgress]);

  const toggleTask = async (id) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) return null;
    const metadata = parseQuestMetadata(task.description);

    if (metadata?.role === 'main') {
      const hasChildren = tasks.some((item) => {
        const childMetadata = parseQuestMetadata(item.description);
        return childMetadata?.role === 'sub' && childMetadata.parentTaskId === task.id;
      });

      if (hasChildren) {
        return { task, completedNow: false, parentControlled: true };
      }
    }

    if (task.status === 'todo') {
      const res = await api.updateTask(id, { status: 'in_progress' });
      const updated = normalizeTask(res.task);
      let nextTasks = tasks.map((item) => (item.id === id ? updated : item));

      if (metadata?.role === 'sub' && metadata.parentTaskId) {
        const parentSync = await syncParentTaskStatus(nextTasks, metadata.parentTaskId, updated);
        nextTasks = parentSync.tasks;
      }

      setTasks(nextTasks);
      return { task: updated, completedNow: false };
    }

    if (task.status === 'in_progress') {
      const res = await api.completeTask(id);
      const updated = normalizeTask(res.task);
      let nextTasks = tasks.map((item) => (item.id === id ? updated : item));

      if (res.progress) {
        const prevLevel = userStats.level;
        const nextStats = applyProgress(res.progress);
        if (nextStats && nextStats.level > prevLevel) {
          setLevelUpData(nextStats);
        }
      }

      let parentCompletedNow = false;
      if (metadata?.role === 'sub' && metadata.parentTaskId) {
        const parentSync = await syncParentTaskStatus(nextTasks, metadata.parentTaskId, updated);
        nextTasks = parentSync.tasks;
        parentCompletedNow = parentSync.parentCompletedNow;
      }

      setTasks(nextTasks);

      return {
        task: updated,
        completedNow: true,
        parentCompletedNow,
        leveledUp: res.progress ? Number(res.progress.level) > userStats.level : false
      };
    }

    const res = await api.updateTask(id, { status: 'todo' });
    const updated = normalizeTask(res.task);
    let nextTasks = tasks.map((item) => (item.id === id ? updated : item));
    applyProgress(res.progress);

    if (metadata?.role === 'sub' && metadata.parentTaskId) {
      const parentSync = await syncParentTaskStatus(nextTasks, metadata.parentTaskId, updated);
      nextTasks = parentSync.tasks;
    }

    setTasks(nextTasks);
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
  const generateCompanionMessage = async (payload) => api.generateCompanionMessage(payload);
  const generateQuestBreakdown = async (payload) => api.generateQuestBreakdown(payload);

  const clearLevelUpData = () => setLevelUpData(null);

  const claimProgressBonus = useCallback(async (payload) => {
    const prevLevel = userStatsRef.current.level;
    const result = await api.claimProgressBonus(payload);
    const nextStats = applyProgress(result.progress);

    if (result.claimed && nextStats && nextStats.level > prevLevel) {
      setLevelUpData(nextStats);
    }

    return result;
  }, [applyProgress]);

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
    generateCompanionMessage,
    generateQuestBreakdown,
    addTask,
    toggleTask,
    editTask,
    deleteTask,
    claimProgressBonus,
    getRequiredExp,
    levelUpData,
    clearLevelUpData,
    loading,
    error,
    reload: loadData
  };
};
