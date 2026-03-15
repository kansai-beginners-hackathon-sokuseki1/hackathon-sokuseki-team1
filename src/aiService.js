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
    throw new Error('APIキーが設定されていません');
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

function parseJsonResponse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text).match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeMainQuest(value, fallbackTaskTitle) {
  const normalized = String(value || '').trim();
  if (normalized.length >= 6) return normalized.slice(0, 80);

  const task = String(fallbackTaskTitle || '').trim();
  if (!task) return '達成したい目的を整理する';
  if (task.endsWith('する')) return `${task.replace(/する$/, '')}できる状態にする`;
  return `${task}を達成できる状態にする`;
}

function normalizeSubQuests(items, fallbackTaskTitle) {
  const normalized = (Array.isArray(items) ? items : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .map((item) => item.replace(/[。．]+$/u, ''))
    .filter((item, index, array) => array.indexOf(item) === index)
    .slice(0, 5);

  if (normalized.length >= 3) return normalized;

  const task = String(fallbackTaskTitle || '').trim() || 'タスク';
  return [
    `${task}の目的を確認する`,
    `${task}に必要な要素を書き出す`,
    `${task}の最初の一歩に着手する`
  ];
}

function formatQuestBreakdown(mainQuest, subQuests, taskTitle) {
  const normalizedMainQuest = normalizeMainQuest(mainQuest, taskTitle);
  const normalizedSubQuests = normalizeSubQuests(subQuests, taskTitle);

  return {
    mainQuest: normalizedMainQuest,
    subQuests: normalizedSubQuests,
    // Keep the old keys for compatibility with any existing callers.
    mainTask: normalizedMainQuest,
    subtasks: normalizedSubQuests
  };
}

function buildMainQuestPrompt(taskTitle) {
  return {
    systemPrompt: `
You are designing quests for an RPG-themed task manager.
Extract the higher-level objective behind the user's task.
Return JSON only.
Do not output steps or explanations.
mainQuest must be one Japanese sentence.
mainQuest must be one level more abstract than the input task.
mainQuest must describe the goal, not the actions.
Output format:
{"mainQuest":"..."}
    `,
    userPrompt: `Task: "${taskTitle}"`
  };
}

function buildSubQuestPrompt(taskTitle, mainQuest) {
  return {
    systemPrompt: `
You are breaking a quest into actionable sub-quests for an RPG-themed task manager.
Return JSON only.
Output 3 to 5 subQuests.
Each subQuest must be a concrete action the user can do now.
Each subQuest must start with a Japanese verb phrase when possible.
One subQuest should represent one action only.
Avoid vague items like "考える", "頑張る", "検討する" unless made specific.
Do not repeat the mainQuest wording.
Output format:
{"subQuests":["...", "...", "..."]}
    `,
    userPrompt: `Original task: "${taskTitle}"\nMain quest: "${mainQuest}"`
  };
}

async function generateMainQuest(apiKey, modelName, taskTitle) {
  const { systemPrompt, userPrompt } = buildMainQuestPrompt(taskTitle);
  const resultText = await callOpenRouterApi(apiKey, modelName, systemPrompt, userPrompt);
  const parsed = parseJsonResponse(resultText);
  return normalizeMainQuest(parsed?.mainQuest, taskTitle);
}

async function generateSubQuests(apiKey, modelName, taskTitle, mainQuest) {
  const { systemPrompt, userPrompt } = buildSubQuestPrompt(taskTitle, mainQuest);
  const resultText = await callOpenRouterApi(apiKey, modelName, systemPrompt, userPrompt);
  const parsed = parseJsonResponse(resultText);

  if (Array.isArray(parsed?.subQuests)) {
    return normalizeSubQuests(parsed.subQuests, taskTitle);
  }

  const fallbackLines = resultText
    .split('\n')
    .map((line) => line.replace(/^[-* 0-9.]+/, '').trim())
    .filter((line) => line.length > 0);
  return normalizeSubQuests(fallbackLines, taskTitle);
}

export async function generateSubtasks(apiKey, modelName, taskTitle) {
  try {
    const mainQuest = await generateMainQuest(apiKey, modelName, taskTitle);
    const subQuests = await generateSubQuests(apiKey, modelName, taskTitle, mainQuest);
    return formatQuestBreakdown(mainQuest, subQuests, taskTitle);
  } catch (error) {
    console.error('generateSubtasks Error:', error);
    return formatQuestBreakdown(taskTitle, [], taskTitle);
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
あなたは RPG 風タスク管理アプリの仲間キャラクターです。
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
