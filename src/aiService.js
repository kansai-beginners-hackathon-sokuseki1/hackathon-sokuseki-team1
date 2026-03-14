// OpenRouter APIを利用するための関数群

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * タイムアウト付きのFetchラッパー
 */
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 10000 } = options; // デフォルト10秒
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal  
  });
  clearTimeout(id);
  return response;
}

/**
 * OpenRouterにリクエストを送信する共通関数
 */
async function callOpenRouterApi(apiKey, modelName, systemPrompt, userPrompt) {
  if (!apiKey) {
    throw new Error('API Key is not set');
  }

  const response = await fetchWithTimeout(OPENROUTER_API_URL, {
    timeout: 12000, // 12秒でタイムアウト
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.href, // 必須 (OpenRouter)
      'X-Title': 'Gamified Task Manager', // 推奨
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 300,
      temperature: 0.7,
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API Error: ${response.status} ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

/**
 * タスクをメインタスク＋サブタスクに構造化分解する
 * @returns {{ mainTask: string, subtasks: string[] }}
 */
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
        return { mainTask: parsed.mainTask, subtasks: parsed.subtasks.filter(s => s && s.trim()) };
      }
      // 旧形式（配列）が返ってきた場合のフォールバック
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { mainTask: taskTitle, subtasks: parsed };
      }
      throw new Error("Invalid format returned.");
    } catch(e) {
      console.error("AI returned invalid JSON:", resultText);
      const subtasks = resultText.split('\n').map(s => s.replace(/^[-* 0-9.]+/, '').trim()).filter(s => s.length > 0).slice(0, 5);
      return { mainTask: taskTitle, subtasks };
    }
  } catch (error) {
    console.error('generateSubtasks Error:', error);
    throw error;
  }
}

/**
 * 案C強化: コンパニオン労いメッセージ（レベル連動とエラー対応）
 * レベルに応じてキャラクターを変える
 */
export async function generateCompanionMessage(apiKey, modelName, taskTitle, userLevel = 1) {
  // レベルによるキャラクター分岐
  let characterDesc = "RPGの冒険者ギルドの受付嬢";
  let toneDesc = "元気で丁寧なトーン";
  
  if (userLevel >= 20) {
    characterDesc = "世界の命運を握る威厳ある国王";
    toneDesc = "威厳がありつつも勇者(ユーザー)を心から信頼し称えるトーン";
  } else if (userLevel >= 10) {
    characterDesc = "歴戦のパーティーメンバー（ベテランの傭兵）";
    toneDesc = "ぶっきらぼうだが仲間思いで、肩を叩いて褒めるようなトーン";
  }

  const systemPrompt = `
あなたは${characterDesc}です。
ユーザー（勇者）がクエスト（タスク）を完了した報告に来ました。
完了したクエストの内容に基づいて、${toneDesc}で労いの言葉をかけてください。
必ず日本語で、短く（2〜3文程度）返信してください。
  `;

  const userPrompt = `完了したクエスト: 「${taskTitle}」`;

  try {
    return await callOpenRouterApi(apiKey, modelName, systemPrompt, userPrompt);
  } catch (error) {
    console.error('generateCompanionMessage Error:', error);
    // API・通信エラー時のフォールバック（世界観を保つメッセージ）
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
       return `（通信が遅延しているようだ…）よくやった！「${taskTitle}」の完了、確かにギルドへ報告しておこう！`;
    }
    return `（ギルドの通信網が混雑しているようだ…）おお勇者よ！よくぞ「${taskTitle}」を成し遂げた！次も期待しておるぞ！`;
  }
}
