const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 10000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(resource, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(id);
  }
}

async function callOpenRouterApi(apiKey, modelName, systemPrompt, userPrompt) {
  if (!apiKey) {
    throw new Error('API key is not set');
  }

  const response = await fetchWithTimeout(OPENROUTER_API_URL, {
    timeout: 12000,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.href,
      'X-Title': 'Gamified Task Manager'
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 300,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API Error: ${response.status} ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

export async function generateSubtasks(apiKey, modelName, taskTitle) {
  const systemPrompt = `
You are a helpful assistant for a task management application.
The user will give you a task. Break it down into a main task and 3 to 5 actionable sub-tasks.
Reply ONLY with valid JSON in exactly this format (no explanation, no markdown):
{"mainTask": "refined main task title", "subtasks": ["step 1", "step 2", "step 3"]}
- mainTask: a concise, clarified version of the input task
- subtasks: 3 to 5 concrete, actionable steps
  `;

  const userPrompt = `Task: "${taskTitle}"`;

  try {
    const resultText = await callOpenRouterApi(apiKey, modelName, systemPrompt, userPrompt);

    try {
      const parsed = JSON.parse(resultText);
      if (parsed && typeof parsed.mainTask === 'string' && Array.isArray(parsed.subtasks)) {
        return {
          mainTask: parsed.mainTask,
          subtasks: parsed.subtasks.filter((subtask) => subtask && subtask.trim())
        };
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        return { mainTask: taskTitle, subtasks: parsed };
      }

      throw new Error('Invalid format returned.');
    } catch {
      console.error('AI returned invalid JSON:', resultText);
      const subtasks = resultText
        .split('\n')
        .map((line) => line.replace(/^[-* 0-9.]+/, '').trim())
        .filter((line) => line.length > 0)
        .slice(0, 5);
      return { mainTask: taskTitle, subtasks };
    }
  } catch (error) {
    console.error('generateSubtasks Error:', error);
    throw error;
  }
}

export function getCompanionProfile(userLevel = 1) {
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

function buildCompanionPrompt(profile) {
  return `
あなたは RPG 風タスク管理アプリの companion character です。
キャラクター名は「${profile.name}」、雰囲気は「${profile.tone}」です。
ユーザーがクエストを完了した直後に表示する、短い祝福メッセージを日本語で 1〜2 文だけ返してください。
大げさすぎる説明や箇条書きは不要です。前向きで、次の一歩が少し軽くなる言い方にしてください。
`;
}

export async function generateCompanionMessage(apiKey, modelName, taskTitle, userLevel = 1) {
  const profile = getCompanionProfile(userLevel);

  if (!apiKey) {
    return profile.fallback(taskTitle);
  }

  const systemPrompt = buildCompanionPrompt(profile);
  const userPrompt = `完了したクエスト: 「${taskTitle}」`;

  try {
    return await callOpenRouterApi(apiKey, modelName, systemPrompt, userPrompt);
  } catch (error) {
    console.error('generateCompanionMessage Error:', error);
    return profile.fallback(taskTitle);
  }
}
