const DIFFICULTY_DIMENSIONS = [
  { key: "task_size", weight: 0.3 },
  { key: "cognitive_load", weight: 0.25 },
  { key: "ambiguity", weight: 0.15 },
  { key: "domain_skill", weight: 0.2 },
  { key: "friction", weight: 0.1 }
];

const PURPOSE_DEFAULTS = {
  general: {
    openai: "gpt-4o-mini",
    openrouter: "google/gemini-2.5-flash"
  },
  quest_breakdown: {
    openai: "gpt-4o",
    openrouter: "google/gemini-2.5-pro"
  },
  difficulty_scoring: {
    openai: "gpt-4o-mini",
    openrouter: "google/gemini-2.5-flash"
  }
};

const QUEST_BREAKDOWN_SCHEMA = {
  name: "quest_breakdown",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      mainQuest: { type: "string" },
      subQuests: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            intent: { type: "string" }
          },
          required: ["title", "intent"]
        }
      }
    },
    required: ["mainQuest", "subQuests"]
  }
};

const DIMENSION_SCORE_SCHEMA = {
  name: "dimension_score",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      score: { type: "integer", minimum: 1, maximum: 5 },
      reason: { type: "string" },
      matchedCategories: {
        type: "array",
        items: { type: "string" }
      }
    },
    required: ["score", "reason", "matchedCategories"]
  }
};

const QUEST_GENERIC_PATTERNS = [
  /目的を整理する/u,
  /必要な情報を洗い出す/u,
  /最初の一歩を決める/u,
  /目的を明確にする/u
];

const JAPANESE_CATEGORY_HINTS = {
  planning: /計画|整理|手順|段取り|進め方|見積|優先/u,
  focus: /集中|見直し|確認|仕上げ|修正/u,
  writing: /文章|議事録|資料|原稿|要約|メモ|文面/u,
  communication: /会議|連絡|共有|相談|送る|送付|返信|依頼/u,
  research: /調査|原因|確認|分析|検証|比較|情報収集/u,
  numbers: /数値|集計|請求|費用|予算|見積金額/u,
  routine: /提出|申請|請求書|報告|定例|更新/u,
  physical_tasks: /移動|設置|片付け|印刷|梱包/u
};

export const AI_MODEL_OPTIONS = {
  openai: [
    "gpt-4.1",
    "gpt-4.1-mini",
    "gpt-4.1-nano",
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-5",
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

function getPurposeDefaultModel(provider, purpose, env) {
  const defaults = PURPOSE_DEFAULTS[purpose] || PURPOSE_DEFAULTS.general;
  if (provider === "openai") {
    if (purpose === "difficulty_scoring" && env.OPENAI_DIFFICULTY_MODEL) return env.OPENAI_DIFFICULTY_MODEL;
    if (purpose === "quest_breakdown" && env.OPENAI_QUEST_MODEL) return env.OPENAI_QUEST_MODEL;
    return defaults.openai;
  }

  if (purpose === "difficulty_scoring" && env.OPENROUTER_DIFFICULTY_MODEL) return env.OPENROUTER_DIFFICULTY_MODEL;
  if (purpose === "quest_breakdown" && env.OPENROUTER_QUEST_MODEL) return env.OPENROUTER_QUEST_MODEL;
  return defaults.openrouter;
}

function clampDifficulty(value) {
  return Math.max(1, Math.min(5, Math.round(value)));
}

function clampDimensionScore(value, fallback = 3) {
  const parsed = Number.parseInt(value ?? fallback, 10);
  return Math.max(1, Math.min(5, Number.isFinite(parsed) ? parsed : fallback));
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

function resolvePurposeAiConfig(config, env, purpose = "general") {
  const provider = config?.provider || getDefaultProvider(env);
  const useServerDefault = config?.useServerDefault !== false;
  const purposeModel = getPurposeDefaultModel(provider, purpose, env);

  if (provider === "openai") {
    return {
      provider,
      apiKey: config?.apiKey || env.OPENAI_API_KEY || "",
      model: useServerDefault ? purposeModel : (config?.model || purposeModel),
      url: `${config?.baseUrl || env.OPENAI_BASE_URL || "https://api.openai.com"}/v1/chat/completions`
    };
  }

  return {
    provider: "openrouter",
    apiKey: config?.apiKey || env.OPENROUTER_API_KEY || "",
    model: useServerDefault ? purposeModel : (config?.model || purposeModel),
    url: `${config?.baseUrl || env.OPENROUTER_BASE_URL || "https://openrouter.ai"}/api/v1/chat/completions`
  };
}

async function chatCompletion(providerConfig, messages, options = {}) {
  if (!providerConfig.apiKey) {
    throw new Error(`Missing API key for ${providerConfig.provider}.`);
  }

  const {
    temperature = 0.2,
    maxTokens = 400,
    jsonMode = false,
    jsonSchema = null
  } = options;
  const usesOpenAiCompletionTokens = providerConfig.provider === "openai" && /^(gpt-5|o\d)/i.test(providerConfig.model);
  const omitsTemperature = providerConfig.provider === "openai" && /^(gpt-5|o\d)/i.test(providerConfig.model);
  const requestBody = {
    model: providerConfig.model,
    messages
  };

  if (!omitsTemperature) {
    requestBody.temperature = temperature;
  }

  if (usesOpenAiCompletionTokens) {
    requestBody.max_completion_tokens = maxTokens;
  } else {
    requestBody.max_tokens = maxTokens;
  }

  if (providerConfig.provider === "openai" && jsonSchema) {
    requestBody.response_format = {
      type: "json_schema",
      json_schema: {
        name: jsonSchema.name,
        strict: true,
        schema: jsonSchema.schema
      }
    };
  } else if (providerConfig.provider === "openai" && jsonMode) {
    requestBody.response_format = { type: "json_object" };
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
  const choice = data.choices?.[0];
  const content = choice?.message?.content?.trim() ?? "";

  if (!content) {
    const finishReason = choice?.finish_reason || "unknown";
    throw new Error(`AI returned empty content (finish_reason=${finishReason}).`);
  }

  return content;
}

export async function testAiConnection(config, env) {
  const providerConfig = resolvePurposeAiConfig(config, env, "general");
  const start = Date.now();
  const text = await chatCompletion(providerConfig, [
    { role: "system", content: "Reply with a short JSON object: {\"status\":\"ok\",\"message\":\"...\"}" },
    { role: "user", content: "Confirm connectivity." }
  ], { jsonMode: true, maxTokens: 120 });
  const parsed = parseJsonResponse(text);

  return {
    ok: true,
    provider: providerConfig.provider,
    model: providerConfig.model,
    latencyMs: Date.now() - start,
    message: parsed?.message || "Connection succeeded."
  };
}

function buildQuestBreakdownPrompt(taskTitle) {
  return [
    {
      role: "system",
      content: [
        "You design quest breakdowns for an RPG productivity app.",
        "Reply in Japanese.",
        "Return only valid JSON that matches the provided schema.",
        "mainQuest must be a higher-level goal, not a restatement of the task.",
        "Return exactly 3 subQuests.",
        "Each subQuest.title must be a concrete action the user can do now.",
        "Each subQuest.intent must briefly explain why that action matters.",
        "Avoid generic items like 目的を整理する, 情報を洗い出す, 最初の一歩を決める unless tied to a specific object.",
        "Include concrete nouns from the task where possible."
      ].join(" ")
    },
    {
      role: "user",
      content: JSON.stringify({ taskTitle })
    }
  ];
}

function isQuestBreakdownLowQuality(taskTitle, breakdown) {
  const normalizedTask = String(taskTitle || "").trim();
  const normalizedMain = String(breakdown?.mainQuest || "").trim();
  const normalizedSubs = Array.isArray(breakdown?.subQuests) ? breakdown.subQuests : [];

  if (!normalizedMain || normalizedMain === normalizedTask) return true;
  if (/目的を明確にする/u.test(normalizedMain) && normalizedMain.includes(normalizedTask)) return true;

  return normalizedSubs.some((item) => {
    const title = String(item?.title || "").trim();
    if (!title) return true;
    if (QUEST_GENERIC_PATTERNS.some((pattern) => pattern.test(title))) return true;
    if (normalizedTask && title === normalizedTask) return true;
    return false;
  });
}

function normalizeQuestBreakdown(taskTitle, parsed) {
  const mainQuest = String(parsed?.mainQuest || "").trim();
  const rawSubQuests = Array.isArray(parsed?.subQuests) ? parsed.subQuests : [];
  const subQuests = rawSubQuests
    .map((item) => ({
      title: String(item?.title || "").trim(),
      intent: String(item?.intent || "").trim()
    }))
    .filter((item) => item.title && item.intent)
    .slice(0, 3);

  if (!mainQuest || subQuests.length < 3) {
    throw new Error("Quest breakdown schema validation failed.");
  }

  return {
    mainQuest: mainQuest.slice(0, 90),
    subQuests,
    mainTask: mainQuest.slice(0, 90),
    subtasks: subQuests.map((item) => item.title)
  };
}

function fallbackQuestBreakdown(taskTitle, reason) {
  const task = String(taskTitle || "").trim() || "タスク";
  const payload = {
    mainQuest: `${task}を完了できる状態まで進める`,
    subQuests: [
      { title: `${task}のゴールを確認する`, intent: "完了条件をはっきりさせるため" },
      { title: `${task}に必要な材料を揃える`, intent: "手戻りなく着手するため" },
      { title: `${task}の最初の作業を始める`, intent: "実際に前進させるため" }
    ]
  };

  return {
    ...normalizeQuestBreakdown(task, payload),
    aiUsed: false,
    fallbackUsed: true,
    fallbackReason: reason,
    quality: "low"
  };
}

export async function generateQuestBreakdown({ taskTitle, aiConfig, env }) {
  const providerConfig = resolvePurposeAiConfig(aiConfig, env, "quest_breakdown");
  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const text = await chatCompletion(
        providerConfig,
        buildQuestBreakdownPrompt(taskTitle),
        {
          temperature: 0.35,
          maxTokens: 500,
          jsonSchema: QUEST_BREAKDOWN_SCHEMA
        }
      );
      const parsed = parseJsonResponse(text);
      const normalized = normalizeQuestBreakdown(taskTitle, parsed);
      const quality = isQuestBreakdownLowQuality(taskTitle, normalized) ? "low" : "high";

      return {
        ...normalized,
        aiUsed: true,
        fallbackUsed: false,
        quality
      };
    } catch (error) {
      lastError = error;
      console.error("generateQuestBreakdown attempt failed:", error);
    }
  }

  return fallbackQuestBreakdown(taskTitle, lastError?.message || "Quest breakdown generation failed.");
}

const DIFFICULTY_PROMPT_RULES = {
  task_size: "Judge work volume, number of steps, and amount of output. 1 means tiny and quick. 5 means large or multi-step.",
  cognitive_load: "Judge concentration, reasoning depth, and mental switching cost. 1 means routine. 5 means intense thinking.",
  ambiguity: "Judge how unclear the requirements or success criteria are. 1 means fully clear. 5 means highly uncertain.",
  domain_skill: "Judge specialized knowledge required. 1 means everyday knowledge. 5 means expert knowledge.",
  friction: "Judge external dependency, communication overhead, and emotional resistance. 1 means self-contained. 5 means heavy coordination or resistance."
};

function inferJapaneseCategoryHints(taskInput) {
  const combined = `${String(taskInput.title || "")} ${String(taskInput.description || "")}`;
  return PROFILE_CATEGORIES
    .map((category) => category.id)
    .filter((categoryId) => JAPANESE_CATEGORY_HINTS[categoryId]?.test(combined))
    .slice(0, 3);
}

function fallbackDimensionScore(dimensionKey, taskInput) {
  const title = String(taskInput.title || "");
  const description = String(taskInput.description || "");
  const combined = `${title} ${description}`.trim();
  const lengthScore = combined.length > 80 ? 4 : combined.length > 35 ? 3 : 2;

  const japaneseSignals = {
    task_size: /3枚|複数|まとめ|整理|一覧|資料|議事録/u,
    cognitive_load: /設計|原因|分析|調査|比較|方針|判断/u,
    ambiguity: /原因|検討|方針|調査|確認|整理/u,
    domain_skill: /デプロイ|SQL|API|DB|設計|分析|請求/u,
    friction: /会議|共有|提出|送る|依頼|連絡|返信/u
  };

  const signalMatch = japaneseSignals[dimensionKey]?.test(combined) ? 1 : 0;
  const score = clampDimensionScore(lengthScore + signalMatch, 2);

  return {
    score,
    reason: `${dimensionKey} は日本語ルールで補完しました。`,
    matchedCategories: inferJapaneseCategoryHints(taskInput)
  };
}

function buildDimensionPrompt(dimensionKey, taskInput, profile) {
  const preferenceSummary = profile.preferences.length > 0
    ? profile.preferences.map((item) => `${item.categoryId}:${item.preferenceType}`).join(", ")
    : "none";

  return [
    {
      role: "system",
      content: [
        "You score exactly one difficulty dimension for a productivity app.",
        "Reply in Japanese.",
        "Return only valid JSON that matches the provided schema.",
        `Dimension: ${dimensionKey}.`,
        DIFFICULTY_PROMPT_RULES[dimensionKey],
        "Use score from 1 to 5.",
        `Valid categories: ${PROFILE_CATEGORIES.map((category) => category.id).join(", ")}.`,
        "matchedCategories should contain up to 3 relevant category ids."
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

function isDueToday(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getUTCFullYear() === now.getUTCFullYear()
    && date.getUTCMonth() === now.getUTCMonth()
    && date.getUTCDate() === now.getUTCDate();
}

function computeBaseScore(scores) {
  return DIFFICULTY_DIMENSIONS.reduce(
    (total, dimension) => total + scores[dimension.key] * dimension.weight,
    0
  );
}

export async function scoreTaskDifficulty({ taskInput, aiConfig, profile, env }) {
  const providerConfig = resolvePurposeAiConfig(aiConfig, env, "difficulty_scoring");
  const dimensionScores = {};
  const dimensionReasons = {};
  const matchedCategorySet = new Set();
  const fallbackDimensions = [];
  let aiSuccessCount = 0;

  for (const { key } of DIFFICULTY_DIMENSIONS) {
    try {
      const responseText = await chatCompletion(
        providerConfig,
        buildDimensionPrompt(key, taskInput, profile),
        {
          temperature: 0.1,
          maxTokens: 220,
          jsonSchema: DIMENSION_SCORE_SCHEMA
        }
      );
      const parsed = parseJsonResponse(responseText);
      const score = clampDimensionScore(parsed?.score, 3);
      dimensionScores[key] = score;
      dimensionReasons[key] = String(parsed?.reason || "AI scored this dimension.").trim();
      for (const categoryId of Array.isArray(parsed?.matchedCategories) ? parsed.matchedCategories : []) {
        if (PROFILE_CATEGORIES.some((category) => category.id === categoryId)) {
          matchedCategorySet.add(categoryId);
        }
      }
      aiSuccessCount += 1;
    } catch (error) {
      const fallback = fallbackDimensionScore(key, taskInput);
      dimensionScores[key] = fallback.score;
      dimensionReasons[key] = fallback.reason;
      fallbackDimensions.push(key);
      for (const categoryId of fallback.matchedCategories) {
        matchedCategorySet.add(categoryId);
      }
      console.error(`scoreTaskDifficulty fallback for ${key}:`, error);
    }
  }

  const matchedCategories = Array.from(matchedCategorySet).slice(0, 3);
  const baseScore = Number(computeBaseScore(dimensionScores).toFixed(2));
  const preferenceTypes = matchedCategories.map((categoryId) => {
    const match = profile.preferences.find((item) => item.categoryId === categoryId);
    return match?.preferenceType ?? "neutral";
  });
  const profileWeight = preferenceTypes.length > 0
    ? Number((preferenceTypes.reduce((sum, type) => sum + (PROFILE_WEIGHTS[type] ?? 1), 0) / preferenceTypes.length).toFixed(2))
    : 1;
  const deadlineBonus = taskInput.dueDate && isDueToday(taskInput.dueDate) ? 0.5 : 0;
  const finalScore = clampDifficulty(baseScore * profileWeight + deadlineBonus);
  const fallbackUsed = fallbackDimensions.length > 0;
  const aiUsed = aiSuccessCount > 0;

  return {
    difficulty: finalScore,
    baseScore,
    dimensionScores,
    dimensionReasons,
    matchedCategories,
    profileWeight,
    deadlineBonus,
    aiUsed,
    fallbackUsed,
    fallbackDimensions,
    reason: fallbackUsed
      ? `Fallback applied for: ${fallbackDimensions.join(", ")}`
      : "AI scored all dimensions successfully."
  };
}

export function resolveActiveAiConfig(settings, env) {
  if (settings && !settings.useServerDefault && settings.provider && settings.apiKey) {
    return {
      useServerDefault: false,
      provider: settings.provider,
      model: settings.model,
      apiKey: settings.apiKey,
      baseUrl: settings.baseUrl || ""
    };
  }

  return {
    useServerDefault: true,
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
    model: getPurposeDefaultModel(provider, "general", env)
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

  if (!normalized || /\?{3,}/.test(normalized)) {
    return fallback;
  }

  return normalized.slice(0, 120);
}

export async function generateCompanionMessage({ taskTitle, userLevel, aiConfig, env }) {
  const profile = getCompanionProfile(userLevel);
  const providerConfig = resolvePurposeAiConfig(aiConfig, env, "general");

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
