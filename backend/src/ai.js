const DIFFICULTY_DIMENSIONS = [
  { key: "task_size", weight: 0.3 },
  { key: "cognitive_load", weight: 0.25 },
  { key: "ambiguity", weight: 0.15 },
  { key: "domain_skill", weight: 0.2 },
  { key: "friction", weight: 0.1 }
];

export const AI_MODEL_OPTIONS = {
  openai: [
    "gpt-4.1",
    "gpt-4.1-mini",
    "gpt-4.1-nano",
    "gpt-4o",
    "gpt-4o-mini",
    "o4-mini"
  ],
  openrouter: [
    "google/gemini-2.5-flash",
    "google/gemini-2.5-pro",
    "openai/gpt-4o-mini",
    "openai/gpt-4.1-mini",
    "anthropic/claude-3.5-haiku",
    "meta-llama/llama-3.3-70b-instruct"
  ]
};

export const PROFILE_CATEGORIES = [
  { id: "planning", label: "Planning" },
  { id: "focus", label: "Focus" },
  { id: "writing", label: "Writing" },
  { id: "communication", label: "Communication" },
  { id: "research", label: "Research" },
  { id: "numbers", label: "Numbers" },
  { id: "routine", label: "Routine" },
  { id: "physical_tasks", label: "Physical Tasks" }
];

const PROFILE_WEIGHTS = {
  strength: 0.5,
  neutral: 1,
  weakness: 1.5
};

function getDefaultProvider(env) {
  return env.DEFAULT_AI_PROVIDER || "openai";
}

function clampDifficulty(value) {
  return Math.max(1, Math.min(5, Math.round(value)));
}

function normalizeDimensionScores(scores = {}) {
  const normalized = {};
  for (const { key } of DIFFICULTY_DIMENSIONS) {
    normalized[key] = Math.max(1, Math.min(5, Number.parseInt(scores[key] ?? 3, 10) || 3));
  }
  return normalized;
}

function computeBaseScore(scores) {
  return DIFFICULTY_DIMENSIONS.reduce(
    (total, dimension) => total + scores[dimension.key] * dimension.weight,
    0
  );
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

function fallbackDimensionScores(input) {
  const title = String(input.title || "");
  const description = String(input.description || "");
  const combined = `${title} ${description}`.trim();
  const lengthScore = combined.length > 80 ? 4 : combined.length > 40 ? 3 : 2;
  const ambiguityHints = /check|review|consider|plan|investigate|research|design|document/i.test(combined) ? 4 : 2;
  const skillHints = /api|sql|db|database|deploy|presentation|report|design|analysis/i.test(combined) ? 4 : 2;

  return {
    task_size: lengthScore,
    cognitive_load: Math.max(lengthScore, ambiguityHints - 1),
    ambiguity: ambiguityHints,
    domain_skill: skillHints,
    friction: /call|meeting|contact|prepare|submit|schedule/i.test(combined) ? 4 : 2
  };
}

function normalizeMainQuest(value, fallbackTaskTitle) {
  const normalized = String(value || "").trim();
  if (normalized.length >= 6) return normalized.slice(0, 80);

  const task = String(fallbackTaskTitle || "").trim();
  if (!task) return "取り組む目的をはっきりさせる";
  return `${task}の目的を明確にする`;
}

function normalizeSubQuests(items, fallbackTaskTitle) {
  const normalized = (Array.isArray(items) ? items : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .map((item) => item.replace(/^[-*0-9.\s]+/, "").trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index)
    .slice(0, 5);

  if (normalized.length >= 3) return normalized;

  const task = String(fallbackTaskTitle || "").trim() || "タスク";
  return [
    `${task}の目的を整理する`,
    `${task}に必要な情報を洗い出す`,
    `${task}の最初の一歩を決める`
  ];
}

function formatQuestBreakdown(mainQuest, subQuests, taskTitle) {
  const normalizedMainQuest = normalizeMainQuest(mainQuest, taskTitle);
  const normalizedSubQuests = normalizeSubQuests(subQuests, taskTitle);

  return {
    mainQuest: normalizedMainQuest,
    subQuests: normalizedSubQuests,
    mainTask: normalizedMainQuest,
    subtasks: normalizedSubQuests
  };
}

function buildProviderHeaders(provider, apiKey) {
  if (provider === "openai") {
    return {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    };
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://mock.local",
    "X-Title": "Mock Task Manager"
  };
}

function resolveProviderConfig(provider, config, env) {
  if (provider === "openai") {
    return {
      provider,
      apiKey: config.apiKey || env.OPENAI_API_KEY || "",
      model: config.model || env.OPENAI_MODEL || "gpt-4o-mini",
      url: `${config.baseUrl || env.OPENAI_BASE_URL || "https://api.openai.com"}/v1/chat/completions`
    };
  }

  return {
    provider: "openrouter",
    apiKey: config.apiKey || env.OPENROUTER_API_KEY || "",
    model: config.model || env.OPENROUTER_MODEL || "google/gemini-2.5-flash",
    url: `${config.baseUrl || env.OPENROUTER_BASE_URL || "https://openrouter.ai"}/api/v1/chat/completions`
  };
}

async function chatCompletion(providerConfig, messages, options = {}) {
  if (!providerConfig.apiKey) {
    throw new Error(`Missing API key for ${providerConfig.provider}.`);
  }

  const {
    temperature = 0.2,
    maxTokens = 300,
    jsonMode = false
  } = options;
  const usesOpenAiCompletionTokens = providerConfig.provider === "openai";
  const omitsTemperature = providerConfig.provider === "openai" && /^(gpt-5|o\d)/i.test(providerConfig.model);
  const requestBody = {
    model: providerConfig.model,
    messages,
    response_format: jsonMode && providerConfig.provider === "openai" ? { type: "json_object" } : undefined
  };

  if (!omitsTemperature) {
    requestBody.temperature = temperature;
  }

  if (usesOpenAiCompletionTokens) {
    requestBody.max_completion_tokens = maxTokens;
  } else {
    requestBody.max_tokens = maxTokens;
  }

  const response = await fetch(providerConfig.url, {
    method: "POST",
    headers: buildProviderHeaders(providerConfig.provider, providerConfig.apiKey),
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `AI request failed with ${response.status}.`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

export async function testAiConnection(config, env) {
  const providerConfig = resolveProviderConfig(config.provider, config, env);
  const start = Date.now();
  const text = await chatCompletion(providerConfig, [
    { role: "system", content: "Reply with a short JSON object: {\"status\":\"ok\",\"message\":\"...\"}" },
    { role: "user", content: "Confirm connectivity." }
  ], { jsonMode: true });
  const parsed = parseJsonResponse(text);

  return {
    ok: true,
    provider: providerConfig.provider,
    model: providerConfig.model,
    latencyMs: Date.now() - start,
    message: parsed?.message || "Connection succeeded."
  };
}

function buildDifficultyPrompt(taskInput, profile) {
  const categories = PROFILE_CATEGORIES.map((category) => category.id).join(", ");
  const preferenceSummary = profile.preferences.length > 0
    ? profile.preferences.map((item) => `${item.categoryId}:${item.preferenceType}`).join(", ")
    : "none";

  return [
    {
      role: "system",
      content: [
        "You score task difficulty for a productivity app.",
        "Return JSON only.",
        "Use these dimensions with integer scores from 1 to 5:",
        "task_size, cognitive_load, ambiguity, domain_skill, friction.",
        `Valid categories: ${categories}.`,
        "Return JSON schema:",
        "{\"dimensionScores\":{\"task_size\":1,\"cognitive_load\":1,\"ambiguity\":1,\"domain_skill\":1,\"friction\":1},\"matchedCategories\":[\"planning\"],\"reason\":\"short reason\"}"
      ].join(" ")
    },
    {
      role: "user",
      content: JSON.stringify({
        task: taskInput,
        profilePreferences: preferenceSummary
      })
    }
  ];
}

function buildMainQuestPrompt(taskTitle) {
  return [
    {
      role: "system",
      content: [
        "You convert a concrete task into one higher-level quest goal for an RPG productivity app.",
        "Reply in Japanese.",
        "Return JSON only.",
        "Schema: {\"mainQuest\":\"...\"}.",
        "mainQuest must be one sentence.",
        "Make it one level more abstract than the original task.",
        "Describe the goal, not the steps."
      ].join(" ")
    },
    {
      role: "user",
      content: JSON.stringify({ taskTitle })
    }
  ];
}

function buildSubQuestPrompt(taskTitle, mainQuest) {
  return [
    {
      role: "system",
      content: [
        "You break a quest into actionable sub-quests for an RPG productivity app.",
        "Reply in Japanese.",
        "Return JSON only.",
        "Schema: {\"subQuests\":[\"...\",\"...\",\"...\"]}.",
        "Return 3 to 5 items.",
        "Each item must be a concrete action the user can do now.",
        "Prefer starting each item with a Japanese verb phrase.",
        "Do not repeat the mainQuest wording."
      ].join(" ")
    },
    {
      role: "user",
      content: JSON.stringify({ taskTitle, mainQuest })
    }
  ];
}

export async function scoreTaskDifficulty({ taskInput, aiConfig, profile, env }) {
  const providerConfig = resolveProviderConfig(aiConfig.provider, aiConfig, env);
  let parsed = null;

  try {
    const responseText = await chatCompletion(
      providerConfig,
      buildDifficultyPrompt(taskInput, profile),
      { jsonMode: true }
    );
    parsed = parseJsonResponse(responseText);
  } catch {
    parsed = null;
  }

  const dimensionScores = normalizeDimensionScores(parsed?.dimensionScores ?? fallbackDimensionScores(taskInput));
  const baseScore = Number(computeBaseScore(dimensionScores).toFixed(2));
  const matchedCategories = Array.isArray(parsed?.matchedCategories)
    ? parsed.matchedCategories.filter((item) => PROFILE_CATEGORIES.some((category) => category.id === item)).slice(0, 3)
    : [];

  const preferenceTypes = matchedCategories.map((categoryId) => {
    const match = profile.preferences.find((item) => item.categoryId === categoryId);
    return match?.preferenceType ?? "neutral";
  });
  const profileWeight = preferenceTypes.length > 0
    ? Number((preferenceTypes.reduce((sum, type) => sum + (PROFILE_WEIGHTS[type] ?? 1), 0) / preferenceTypes.length).toFixed(2))
    : 1;

  const deadlineBonus = taskInput.dueDate && isDueToday(taskInput.dueDate) ? 0.5 : 0;
  const finalScore = clampDifficulty(baseScore * profileWeight + deadlineBonus);

  return {
    difficulty: finalScore,
    baseScore,
    dimensionScores,
    matchedCategories,
    profileWeight,
    deadlineBonus,
    reason: parsed?.reason || "AI scoring unavailable, fallback rules applied."
  };
}

export async function generateQuestBreakdown({ taskTitle, aiConfig, env }) {
  const providerConfig = resolveProviderConfig(aiConfig.provider, aiConfig, env);

  try {
    const mainQuestText = await chatCompletion(
      providerConfig,
      buildMainQuestPrompt(taskTitle)
    );
    const mainQuestParsed = parseJsonResponse(mainQuestText);
    const mainQuest = normalizeMainQuest(
      mainQuestParsed?.mainQuest || mainQuestText,
      taskTitle
    );

    const subQuestText = await chatCompletion(
      providerConfig,
      buildSubQuestPrompt(taskTitle, mainQuest)
    );
    const subQuestParsed = parseJsonResponse(subQuestText);
    const subQuestItems = Array.isArray(subQuestParsed?.subQuests)
      ? subQuestParsed.subQuests
      : String(subQuestText || "")
        .split("\n")
        .map((line) => line.replace(/^[-*0-9.\s]+/, "").trim())
        .filter(Boolean);

    return formatQuestBreakdown(mainQuest, subQuestItems, taskTitle);
  } catch (error) {
    console.error("generateQuestBreakdown Error:", error);
    return formatQuestBreakdown(taskTitle, [], taskTitle);
  }
}

function isDueToday(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getUTCFullYear() === now.getUTCFullYear()
    && date.getUTCMonth() === now.getUTCMonth()
    && date.getUTCDate() === now.getUTCDate();
}

export function resolveActiveAiConfig(settings, env) {
  if (settings && !settings.useServerDefault && settings.provider && settings.apiKey) {
    return {
      provider: settings.provider,
      model: settings.model,
      apiKey: settings.apiKey,
      baseUrl: settings.baseUrl || ""
    };
  }

  return {
    provider: getDefaultProvider(env),
    model: settings?.model || null,
    apiKey: "",
    baseUrl: ""
  };
}

export function getDefaultAiDescriptor(env) {
  const provider = getDefaultProvider(env);
  return {
    provider,
    model: provider === "openai"
      ? env.OPENAI_MODEL || "gpt-4o-mini"
      : env.OPENROUTER_MODEL || "google/gemini-2.5-flash"
  };
}

export function getAiModelOptions() {
  return AI_MODEL_OPTIONS;
}

function getCompanionProfile(userLevel = 1) {
  if (userLevel >= 20) {
    return {
      name: "Ancient Dragon",
      tone: "majestic, warm, and deeply impressed",
      fallback(taskTitle) {
        return `${taskTitle}を成し遂げたか。見事だ、この偉業は古竜の記憶にも刻まれる。`;
      }
    };
  }

  if (userLevel >= 10) {
    return {
      name: "Archmage",
      tone: "intelligent, proud, and encouraging",
      fallback(taskTitle) {
        return `${taskTitle}を片づけたのね。その判断力は確かだし、次も十分に通用するわ。`;
      }
    };
  }

  return {
    name: "Forest Fairy",
    tone: "bright, playful, and cheering the player on",
    fallback(taskTitle) {
      return `${taskTitle}完了だよ。次のクエストもこの調子でいこう。`;
    }
  };
}

function sanitizeCompanionMessage(text, fallback) {
  const normalized = String(text || "")
    .replace(/["`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return fallback;
  }

  if (/\?{3,}/.test(normalized)) {
    return fallback;
  }

  return normalized.slice(0, 120);
}

export async function generateCompanionMessage({ taskTitle, userLevel, aiConfig, env }) {
  const profile = getCompanionProfile(userLevel);
  const providerConfig = resolveProviderConfig(aiConfig.provider, aiConfig, env);

  try {
    const text = await chatCompletion(providerConfig, [
      {
        role: "system",
        content: [
          "You write a short celebration line for an RPG productivity app companion.",
          "Reply in Japanese.",
          "Write 1 or 2 sentences only.",
          "Keep it under 70 Japanese characters when possible.",
          "Do not use markdown, bullet points, or quotes.",
          `Character name: ${profile.name}.`,
          `Character tone: ${profile.tone}.`
        ].join(" ")
      },
      {
        role: "user",
        content: `The player has just completed this quest: ${taskTitle}`
      }
    ], {
      temperature: 0.7,
      maxTokens: 120
    });

    return sanitizeCompanionMessage(text, profile.fallback(taskTitle));
  } catch {
    return profile.fallback(taskTitle);
  }
}
