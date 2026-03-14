import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useAppState = () => {
  // --- 状態の初期化（ローカルストレージからの読み込みとマイグレーション） ---
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('questTasks');
    if (!saved) return [];
    
    try {
      const parsedTasks = JSON.parse(saved);
      // フェーズ1データからフェーズ2へのマイグレーション
      return parsedTasks.map(task => ({
        ...task,
        dueDate: task.dueDate || null,
        difficulty: task.difficulty || 1, // デフォルト難易度は★1
        // フェーズ1でexpRewardが固定されていたものはそのまま維持
      }));
    } catch (e) {
      console.error("Failed to parse tasks from localStorage", e);
      return [];
    }
  });

  const [userStats, setUserStats] = useState(() => {
    const saved = localStorage.getItem('userStats');
    return saved ? JSON.parse(saved) : { level: 1, currentExp: 0 };
  });

  const [apiSettings, setApiSettings] = useState(() => {
    const saved = localStorage.getItem('apiSettings');
    return saved ? JSON.parse(saved) : { apiKey: '', modelName: 'google/gemini-2.5-flash' };
  });

  // --- ローカルストレージへの保存 ---
  useEffect(() => {
    localStorage.setItem('questTasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('userStats', JSON.stringify(userStats));
  }, [userStats]);

  useEffect(() => {
    localStorage.setItem('apiSettings', JSON.stringify(apiSettings));
  }, [apiSettings]);

  // --- タスク管理機能 ---
  
  // 難易度(1〜5)から獲得EXPを計算する
  const calculateExpByDifficulty = (difficulty) => {
    const baseExp = 10;
    // ★1=10〜20, ★2=30〜50, ★3=60〜100, ★4=120〜200, ★5=250〜400 程度の範囲
    const multipliers = [0, 1, 3, 6, 12, 25];
    const diffInt = Math.max(1, Math.min(5, parseInt(difficulty) || 1));
    const baseReward = baseExp * multipliers[diffInt];
    // 少しランダム性をもたせる (±20%)
    const variance = Math.floor(baseReward * 0.2);
    const randomOffset = Math.floor(Math.random() * (variance * 2 + 1)) - variance;
    
    return Math.max(5, baseReward + randomOffset); // 最低5EXP
  };

  const addTask = (title, difficulty = 1, dueDate = null, expReward = null) => {
    // 報酬EXPが明示されていない場合は難易度から計算
    const reward = expReward !== null ? expReward : calculateExpByDifficulty(difficulty);
    
    const newTask = {
      id: uuidv4(),
      title,
      completed: false,
      expReward: reward,
      difficulty,
      dueDate,
      createdAt: Date.now()
    };
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  };

  const toggleTask = (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return null;

    const isCompleting = !task.completed;
    
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, completed: isCompleting } : t
    ));

    // タスク完了時にのみ経験値を付与（取り消し時は取り消さない仕様）
    if (isCompleting) {
      addExp(task.expReward);
    }
    
    return { ...task, completed: isCompleting };
  };

  const editTask = (id, newTitle, newDifficulty, newDueDate) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        // 難易度が変わった場合は獲得EXPを再計算する（未完了のタスクのみ）
        let newExpReward = t.expReward;
        if (!t.completed && t.difficulty !== newDifficulty) {
           newExpReward = calculateExpByDifficulty(newDifficulty);
        }
        return { 
          ...t, 
          title: newTitle, 
          difficulty: newDifficulty, 
          dueDate: newDueDate,
          expReward: newExpReward
        };
      }
      return t;
    }));
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // --- ゲーミフィケーション機能 ---
  // 次のレベルに必要な経験値を計算する式
  const getRequiredExp = (level) => {
    return Math.floor(100 * Math.pow(1.2, level - 1));
  };

  const [levelUpData, setLevelUpData] = useState(null);

  const addExp = (amount) => {
    setUserStats(prev => {
      let { level, currentExp } = prev;
      let newExp = currentExp + amount;
      let requiredExp = getRequiredExp(level);
      let didLevelUp = false;

      // レベルアップの判定
      while (newExp >= requiredExp) {
        newExp -= requiredExp;
        level += 1;
        requiredExp = getRequiredExp(level);
        didLevelUp = true;
      }

      const newStats = { level, currentExp: newExp };
      
      if (didLevelUp) {
        setLevelUpData(newStats); // アニメーション・UI表示トリガー用
      }

      return newStats;
    });
  };

  const clearLevelUpData = () => {
    setLevelUpData(null);
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
    calculateExpByDifficulty
  };
};
