const DIFFICULTY_DIMENSIONS = [
  { key: "task_size", weight: 0.3 },
  { key: "cognitive_load", weight: 0.25 },
  { key: "ambiguity", weight: 0.15 },
  { key: "domain_skill", weight: 0.2 },
  { key: "friction", weight: 0.1 }
];

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

async function chatCompletion(providerConfig, messages) {
  if (!providerConfig.apiKey) {
    throw new Error(`Missing API key for ${providerConfig.provider}.`);
  }

  const response = await fetch(providerConfig.url, {
    method: "POST",
    headers: buildProviderHeaders(providerConfig.provider, providerConfig.apiKey),
    body: JSON.stringify({
      model: providerConfig.model,
      messages,
      temperature: 0.2,
      max_tokens: 300,
      response_format: providerConfig.provider === "openai" ? { type: "json_object" } : undefined
    })
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
  ]);
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

export async function scoreTaskDifficulty({ taskInput, aiConfig, profile, env }) {
  const providerConfig = resolveProviderConfig(aiConfig.provider, aiConfig, env);
  let parsed = null;

  try {
    const responseText = await chatCompletion(providerConfig, buildDifficultyPrompt(taskInput, profile));
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
    provider: env.DEFAULT_AI_PROVIDER || "openrouter",
    model: settings?.model || null,
    apiKey: "",
    baseUrl: ""
  };
}

export function getDefaultAiDescriptor(env) {
  const provider = env.DEFAULT_AI_PROVIDER || "openrouter";
  return {
    provider,
    model: provider === "openai"
      ? env.OPENAI_MODEL || "gpt-4o-mini"
      : env.OPENROUTER_MODEL || "google/gemini-2.5-flash"
  };
}

function getCompanionProfile(userLevel = 1) {
  if (userLevel >= 20) {
    return {
      name: "Ancient Dragon",
      tone: "majestic, warm, and deeply impressed",
      fallback(taskTitle) {
        return `${taskTitle}を成し遂げたか。次の高みも、もう見えているぞ。`;
      }
    };
  }

  if (userLevel >= 10) {
    return {
      name: "Archmage",
      tone: "intelligent, proud, and encouraging",
      fallback(taskTitle) {
        return `${taskTitle}を片づけたね。その積み重ねは、ちゃんと力になっているよ。`;
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
    ]);

    return sanitizeCompanionMessage(text, profile.fallback(taskTitle));
  } catch {
    return profile.fallback(taskTitle);
  }
}
