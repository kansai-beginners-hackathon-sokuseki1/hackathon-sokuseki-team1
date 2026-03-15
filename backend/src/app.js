import { calculateExpByDifficulty, computeLevelFromXp } from "./rpg.js";
import { decryptSecret, encryptSecret, createToken, hashPassword, verifyPassword } from "./crypto.js";
import {
  PROFILE_CATEGORIES,
  generateCompanionMessage,
  getDefaultAiDescriptor,
  resolveActiveAiConfig,
  scoreTaskDifficulty,
  testAiConnection
} from "./ai.js";
import { verifyGoogleIdToken } from "./google-auth.js";

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function errorResponse(status, code, message) {
  return json(status, { error: { code, message } });
}

async function readBody(request) {
  const text = await request.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw Object.assign(new Error("Invalid JSON body"), { statusCode: 400, code: "invalid_json" });
  }
}

function validateEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function pickTask(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    difficulty: task.difficulty,
    expReward: task.expReward,
    dueDate: task.dueDate,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    completedAt: task.completedAt
  };
}

function buildTaskFilters(url) {
  const requestedSort = url.searchParams.get("sort");
  return {
    status: url.searchParams.get("status"),
    priority: url.searchParams.get("priority"),
    sort: ["createdAt", "dueDate", "priority", "status", "difficulty"].includes(requestedSort) ? requestedSort : "createdAt",
    order: url.searchParams.get("order") === "asc" ? "asc" : "desc",
    page: Math.max(Number.parseInt(url.searchParams.get("page") || "1", 10), 1),
    pageSize: Math.min(Math.max(Number.parseInt(url.searchParams.get("pageSize") || "20", 10), 1), 100)
  };
}

function normalizeUser(sessionUser) {
  if (!sessionUser) return null;
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    username: sessionUser.username,
    authProvider: sessionUser.auth_provider ?? sessionUser.authProvider ?? "local",
    createdAt: sessionUser.created_at ?? sessionUser.createdAt
  };
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeUsernameCandidate(value, fallbackEmail) {
  const base = typeof value === "string" ? value.trim() : "";
  const fallback = typeof fallbackEmail === "string" ? fallbackEmail.split("@")[0] : "adventurer";
  const selected = (base || fallback).replace(/\s+/g, " ").trim();
  return selected.length >= 2 ? selected.slice(0, 40) : "adventurer";
}

function createGuestIdentity() {
  const guestKey = createToken().replace(/[^a-zA-Z0-9]/g, "").slice(0, 12) || Date.now().toString(36);
  return {
    email: `guest-${guestKey}@guest.local`,
    username: `Guest-${guestKey.slice(0, 6).toUpperCase()}`,
    providerUserId: guestKey
  };
}

async function createAuthenticatedSession(repository, userId, userPayload, auditAction, clientIp) {
  const token = createToken();
  const createdAt = new Date().toISOString();
  await repository.createSession({ userId, token, createdAt });
  await repository.createAuditLog({ userId, action: auditAction, ipAddress: clientIp, createdAt });
  return json(200, { token, user: userPayload });
}

const KEEPALIVE_BONUS_TIERS = {
  1: { minutes: 15, xpAward: 8, label: "15分継続ボーナス" },
  2: { minutes: 30, xpAward: 12, label: "30分継続ボーナス" },
  3: { minutes: 60, xpAward: 18, label: "60分継続ボーナス" },
  4: { minutes: 120, xpAward: 25, label: "120分継続ボーナス" }
};

function resolveProgressBonus(body) {
  const dayKey = typeof body.dayKey === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.dayKey)
    ? body.dayKey
    : null;

  if (!dayKey) {
    throw Object.assign(new Error("dayKey must be provided in YYYY-MM-DD format."), {
      statusCode: 400,
      code: "invalid_input"
    });
  }

  if (body.bonusType === "daily_login") {
    return {
      bonusType: "daily_login",
      claimKey: `daily_login:${dayKey}`,
      xpAward: 25,
      label: "ログインボーナス",
      metadata: { dayKey }
    };
  }

  if (body.bonusType === "session_keepalive") {
    const tier = Math.floor(Number(body.tier));
    const config = KEEPALIVE_BONUS_TIERS[tier];
    if (!config) {
      throw Object.assign(new Error("tier must be between 1 and 4."), {
        statusCode: 400,
        code: "invalid_input"
      });
    }

    return {
      bonusType: "session_keepalive",
      claimKey: `session_keepalive:${dayKey}:tier${tier}`,
      xpAward: config.xpAward,
      label: config.label,
      metadata: {
        dayKey,
        tier,
        minutes: config.minutes
      }
    };
  }

  throw Object.assign(new Error("Unsupported bonusType."), {
    statusCode: 400,
    code: "invalid_input"
  });
}

function normalizeProfilePayload(body) {
  const preferences = Array.isArray(body.preferences) ? body.preferences : [];
  return preferences
    .map((item) => ({
      categoryId: item?.categoryId,
      preferenceType: item?.preferenceType
    }))
    .filter((item) => PROFILE_CATEGORIES.some((category) => category.id === item.categoryId))
    .map((item) => ({
      categoryId: item.categoryId,
      preferenceType: ["strength", "neutral", "weakness"].includes(item.preferenceType) ? item.preferenceType : "neutral"
    }));
}

function serializeProfile(profile) {
  return {
    onboardingCompleted: Boolean(profile.meta?.onboardingCompleted),
    hasProfile: Boolean(profile.meta),
    categories: PROFILE_CATEGORIES,
    preferences: profile.preferences
  };
}

function serializeAiSettings(settings, env) {
  const defaults = getDefaultAiDescriptor(env);
  return {
    useServerDefault: settings?.useServerDefault ?? true,
    provider: settings?.provider ?? defaults.provider,
    model: settings?.model ?? defaults.model,
    baseUrl: settings?.baseUrl ?? "",
    hasUserApiKey: Boolean(settings?.encryptedApiKey),
    defaultProvider: defaults.provider,
    defaultModel: defaults.model,
    providers: ["openrouter", "openai"]
  };
}

async function loadResolvedAiSettings(repository, userId, env) {
  const stored = await repository.getAiSettings(userId);
  if (!stored) {
    return {
      stored: null,
      resolved: resolveActiveAiConfig({ useServerDefault: true }, env)
    };
  }

  const apiKey = stored.encryptedApiKey ? await decryptSecret(stored.encryptedApiKey, env.APP_SECRET) : "";
  return {
    stored,
    resolved: resolveActiveAiConfig({
      useServerDefault: stored.useServerDefault,
      provider: stored.provider,
      model: stored.model,
      baseUrl: stored.baseUrl,
      apiKey
    }, env)
  };
}

export function createApp({ repository, tokenTtlMs = 1000 * 60 * 60 * 24 * 7, rateLimiter, env }) {
  return {
    async fetch(request) {
      try {
        if (request.method === "OPTIONS") {
          return new Response(null, {
            status: 204,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
              "Access-Control-Allow-Headers": "Authorization, Content-Type"
            }
          });
        }

        const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || "unknown";
        if (rateLimiter && !rateLimiter.consume(clientIp)) {
          return errorResponse(429, "rate_limited", "Too many requests. Please retry later.");
        }

        const url = new URL(request.url);

        if (request.method === "GET" && url.pathname === "/api/health") {
          return json(200, { ok: true });
        }

        if (request.method === "POST" && url.pathname === "/api/auth/register") {
          const body = await readBody(request);
          const { email, username, password } = body;
          if (!validateEmail(email) || typeof username !== "string" || username.trim().length < 2) {
            return errorResponse(400, "invalid_input", "A valid email and username (2+ chars) are required.");
          }
          if (typeof password !== "string" || password.length < 8) {
            return errorResponse(400, "invalid_input", "Password must be at least 8 characters.");
          }
          const existing = await repository.findUserByEmail(email);
          if (existing) {
            return errorResponse(409, "email_exists", "The email address is already registered.");
          }
          const createdAt = new Date().toISOString();
          const { salt, hash } = await hashPassword(password);
          const user = await repository.createUser({
            email,
            username: username.trim(),
            passwordHash: hash,
            passwordSalt: salt,
            authProvider: "local",
            providerUserId: null,
            createdAt
          });
          await repository.createAuditLog({ userId: user.id, action: "auth.register", ipAddress: clientIp, createdAt });
          return json(201, { user: { id: user.id, email: user.email, username: user.username, createdAt: user.created_at } });
        }

        if (request.method === "POST" && url.pathname === "/api/auth/login") {
          const body = await readBody(request);
          const { email, password } = body;
          if (!validateEmail(email) || typeof password !== "string") {
            return errorResponse(400, "invalid_input", "A valid email and password are required.");
          }
          const user = await repository.findUserByEmail(email);
          if (!user) {
            return errorResponse(401, "invalid_credentials", "The email or password is incorrect.");
          }
          if ((user.auth_provider ?? user.authProvider ?? "local") !== "local") {
            return errorResponse(409, "google_sign_in_required", "This account uses Google sign-in.");
          }
          const valid = await verifyPassword(
            password,
            user.password_hash ?? user.passwordHash,
            user.password_salt ?? user.passwordSalt
          );
          if (!valid) {
            return errorResponse(401, "invalid_credentials", "The email or password is incorrect.");
          }
          return createAuthenticatedSession(
            repository,
            user.id,
            {
              id: user.id,
              email: user.email,
              username: user.username,
              authProvider: user.auth_provider ?? user.authProvider ?? "local"
            },
            "auth.login",
            clientIp
          );
        }

        if (request.method === "POST" && url.pathname === "/api/auth/guest") {
          const createdAt = new Date().toISOString();
          const guestIdentity = createGuestIdentity();
          const user = await repository.createUser({
            email: guestIdentity.email,
            username: guestIdentity.username,
            passwordHash: "",
            passwordSalt: "",
            authProvider: "guest",
            providerUserId: guestIdentity.providerUserId,
            createdAt
          });

          return createAuthenticatedSession(
            repository,
            user.id,
            {
              id: user.id,
              email: user.email,
              username: user.username,
              authProvider: "guest"
            },
            "auth.guest.login",
            clientIp
          );
        }

        if (request.method === "POST" && url.pathname === "/api/auth/google") {
          if (!env.GOOGLE_CLIENT_ID) {
            return errorResponse(503, "google_auth_unavailable", "Google sign-in is not configured.");
          }

          const body = await readBody(request);
          const credential = typeof body.credential === "string" ? body.credential : "";
          if (!credential) {
            return errorResponse(400, "invalid_input", "Google credential is required.");
          }

          const googleUser = await verifyGoogleIdToken(credential, env.GOOGLE_CLIENT_ID);
          let user = await repository.findUserByProvider("google", googleUser.subject);

          if (!user) {
            const existingByEmail = await repository.findUserByEmail(googleUser.email);
            if (existingByEmail) {
              return errorResponse(
                409,
                "account_exists_different_sign_in",
                "An account with this email already exists with a different sign-in method."
              );
            }

            const createdAt = new Date().toISOString();
            user = await repository.createUser({
              email: googleUser.email,
              username: normalizeUsernameCandidate(googleUser.name, googleUser.email),
              passwordHash: "",
              passwordSalt: "",
              authProvider: "google",
              providerUserId: googleUser.subject,
              createdAt
            });
            await repository.createAuditLog({ userId: user.id, action: "auth.google.register", ipAddress: clientIp, createdAt });
          }

          return createAuthenticatedSession(
            repository,
            user.id,
            {
              id: user.id,
              email: user.email,
              username: user.username,
              authProvider: user.auth_provider ?? user.authProvider ?? "google"
            },
            "auth.google.login",
            clientIp
          );
        }

        const authHeader = request.headers.get("authorization") || "";
        if (!authHeader.startsWith("Bearer ")) {
          return errorResponse(401, "unauthorized", "A valid bearer token is required.");
        }
        const token = authHeader.slice("Bearer ".length);
        const sessionUser = await repository.findSessionWithUser(token);
        if (!sessionUser) {
          return errorResponse(401, "unauthorized", "A valid bearer token is required.");
        }
        const sessionCreatedAt = sessionUser.session_created_at ?? sessionUser.createdAt;
        if (Date.now() - Date.parse(sessionCreatedAt) > tokenTtlMs) {
          await repository.deleteSession(token);
          return errorResponse(401, "session_expired", "The session has expired.");
        }
        await repository.touchSession(token, new Date().toISOString());
        const user = normalizeUser(sessionUser);
        await repository.resetExpiredTasks(user.id, new Date().toISOString(), todayIsoDate());

        if (request.method === "GET" && url.pathname === "/api/tasks") {
          const filters = buildTaskFilters(url);
          const page = await repository.listTasks(user.id, filters);
          return json(200, {
            pagination: { total: page.total, page: filters.page, pageSize: filters.pageSize },
            tasks: page.items.map(pickTask)
          });
        }

        if (request.method === "POST" && url.pathname === "/api/tasks") {
          const body = await readBody(request);
          const title = typeof body.title === "string" ? body.title.trim() : "";
          if (!title) return errorResponse(400, "invalid_input", "Task title is required.");

          const description = typeof body.description === "string" ? body.description.trim() : "";
          const priority = ["low", "medium", "high"].includes(body.priority) ? body.priority : "medium";
          const difficulty = Math.max(1, Math.min(5, Math.floor(Number(body.difficulty) || 1)));
          const expReward = calculateExpByDifficulty(difficulty);
          const dueDate = body.dueDate ?? null;
          if (dueDate !== null && Number.isNaN(Date.parse(dueDate))) {
            return errorResponse(400, "invalid_input", "dueDate must be a valid ISO date string.");
          }

          const now = new Date().toISOString();
          const task = await repository.createTask({
            userId: user.id,
            title,
            description,
            priority,
            difficulty,
            expReward,
            dueDate,
            createdAt: now
          });
          await repository.createAuditLog({ userId: user.id, action: "task.create", targetId: task.id, ipAddress: clientIp, createdAt: now });
          return json(201, { task: pickTask(task) });
        }

        if (request.method === "GET" && url.pathname === "/api/progress") {
          const progress = await repository.getUserProgress(user.id);
          const { level, currentExp } = computeLevelFromXp(Number(progress.xp));
          return json(200, {
            progress: {
              xp: Number(progress.xp),
              level,
              currentExp,
              completedTaskCount: Number(progress.completed_task_count ?? 0)
            }
          });
        }

        if (request.method === "POST" && url.pathname === "/api/progress/bonus") {
          const body = await readBody(request);
          const bonus = resolveProgressBonus(body);
          const now = new Date().toISOString();
          const result = await repository.claimProgressBonus(user.id, {
            bonusType: bonus.bonusType,
            claimKey: bonus.claimKey,
            xpAward: bonus.xpAward,
            metadata: bonus.metadata,
            claimedAt: now
          });
          if (!result) {
            return errorResponse(404, "not_found", "The requested resource was not found.");
          }

          await repository.createAuditLog({
            userId: user.id,
            action: `progress.bonus.${bonus.bonusType}`,
            targetId: bonus.claimKey,
            ipAddress: clientIp,
            createdAt: now
          });

          return json(200, {
            claimed: result.claimed,
            bonus: {
              type: bonus.bonusType,
              label: bonus.label,
              claimKey: bonus.claimKey,
              xpAward: bonus.xpAward,
              ...bonus.metadata
            },
            progress: {
              xp: Number(result.progress.xp),
              level: Number(result.progress.level),
              completedTaskCount: Number(result.progress.completed_task_count ?? result.progress.completedTaskCount ?? 0)
            }
          });
        }

        if (request.method === "GET" && url.pathname === "/api/me/profile") {
          const profile = await repository.getProfile(user.id);
          return json(200, serializeProfile(profile));
        }

        if (request.method === "PUT" && url.pathname === "/api/me/profile") {
          const body = await readBody(request);
          const preferences = normalizeProfilePayload(body);
          const saved = await repository.saveProfile(user.id, {
            onboardingCompleted: Boolean(body.onboardingCompleted),
            preferences,
            now: new Date().toISOString()
          });
          return json(200, serializeProfile(saved));
        }

        if (request.method === "GET" && url.pathname === "/api/me/ai-settings") {
          const settings = await repository.getAiSettings(user.id);
          return json(200, serializeAiSettings(settings, env));
        }

        if (request.method === "PUT" && url.pathname === "/api/me/ai-settings") {
          const body = await readBody(request);
          const now = new Date().toISOString();
          const existing = await repository.getAiSettings(user.id);
          const encryptedApiKey = body.apiKey === undefined
            ? existing?.encryptedApiKey ?? null
            : body.apiKey
              ? await encryptSecret(body.apiKey, env.APP_SECRET)
              : null;
          const settings = await repository.saveAiSettings(user.id, {
            useServerDefault: body.useServerDefault !== false,
            provider: body.provider ?? null,
            model: body.model ?? null,
            encryptedApiKey,
            baseUrl: body.baseUrl ?? null,
            lastTestedAt: body.lastTestedAt ?? null,
            now
          });
          return json(200, serializeAiSettings(settings, env));
        }

        if (request.method === "POST" && url.pathname === "/api/me/ai-settings/test") {
          const body = await readBody(request);
          const stored = await repository.getAiSettings(user.id);
          const candidate = {
            useServerDefault: body.useServerDefault !== false,
            provider: body.provider ?? stored?.provider ?? null,
            model: body.model ?? stored?.model ?? null,
            apiKey: body.apiKey ?? (stored?.encryptedApiKey ? await decryptSecret(stored.encryptedApiKey, env.APP_SECRET) : ""),
            baseUrl: body.baseUrl ?? stored?.baseUrl ?? ""
          };
          const result = await testAiConnection(candidate, env);
          await repository.saveAiSettings(user.id, {
            useServerDefault: candidate.useServerDefault,
            provider: candidate.provider,
            model: candidate.model,
            encryptedApiKey: candidate.apiKey ? await encryptSecret(candidate.apiKey, env.APP_SECRET) : stored?.encryptedApiKey ?? null,
            baseUrl: candidate.baseUrl,
            lastTestedAt: new Date().toISOString(),
            now: new Date().toISOString()
          });
          return json(200, result);
        }

        if (request.method === "POST" && url.pathname === "/api/ai/difficulty") {
          const body = await readBody(request);
          const title = typeof body.title === "string" ? body.title.trim() : "";
          if (!title) {
            return errorResponse(400, "invalid_input", "Task title is required.");
          }
          const description = typeof body.description === "string" ? body.description.trim() : "";
          const dueDate = body.dueDate ?? null;
          const profile = await repository.getProfile(user.id);
          const aiSettings = await loadResolvedAiSettings(repository, user.id, env);
          const result = await scoreTaskDifficulty({
            taskInput: { title, description, dueDate },
            aiConfig: aiSettings.resolved,
            profile,
            env
          });
          return json(200, result);
        }

        if (request.method === "POST" && url.pathname === "/api/ai/companion-message") {
          const body = await readBody(request);
          const taskTitle = typeof body.taskTitle === "string" ? body.taskTitle.trim() : "";
          const userLevel = Math.max(1, Math.floor(Number(body.userLevel) || 1));
          if (!taskTitle) {
            return errorResponse(400, "invalid_input", "taskTitle is required.");
          }

          const aiSettings = await loadResolvedAiSettings(repository, user.id, env);
          const message = await generateCompanionMessage({
            taskTitle,
            userLevel,
            aiConfig: aiSettings.resolved,
            env
          });

          return json(200, { message });
        }

        const completeMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)\/complete$/);
        if (completeMatch && request.method === "POST") {
          const now = new Date().toISOString();
          const result = await repository.completeTask(user.id, completeMatch[1], now);
          if (result.status === "missing") {
            return errorResponse(404, "not_found", "The requested resource was not found.");
          }
          await repository.createAuditLog({ userId: user.id, action: "task.complete", targetId: completeMatch[1], ipAddress: clientIp, createdAt: now });
          const progressObj = result.progress
            ? {
                xp: Number(result.progress.xp),
                level: Number(result.progress.level),
                completedTaskCount: Number(result.progress.completed_task_count ?? result.progress.completedTaskCount)
              }
            : null;
          return json(200, {
            task: pickTask(result.task),
            progress: progressObj,
            alreadyCompleted: result.status === "already_completed"
          });
        }

        const taskMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)$/);
        if (taskMatch) {
          const taskId = taskMatch[1];

          if (request.method === "GET") {
            const task = await repository.findTaskById(user.id, taskId);
            if (!task) return errorResponse(404, "not_found", "The requested resource was not found.");
            return json(200, { task: pickTask(task) });
          }

          if (request.method === "PATCH") {
            const body = await readBody(request);
            const currentTask = await repository.findTaskById(user.id, taskId);
            if (!currentTask) return errorResponse(404, "not_found", "The requested resource was not found.");
            const patch = {};
            if (body.title !== undefined) {
              if (typeof body.title !== "string" || !body.title.trim()) {
                return errorResponse(400, "invalid_input", "Task title is required.");
              }
              patch.title = body.title.trim();
            }
            if (body.description !== undefined) {
              patch.description = String(body.description).trim();
            }
            if (body.priority !== undefined) {
              if (!["low", "medium", "high"].includes(body.priority)) {
                return errorResponse(400, "invalid_input", "priority must be low, medium, or high.");
              }
              patch.priority = body.priority;
            }
            if (body.status !== undefined) {
              if (!["todo", "in_progress", "completed"].includes(body.status)) {
                return errorResponse(400, "invalid_input", "status must be todo, in_progress, or completed.");
              }
              patch.status = body.status;
            }
            if (body.difficulty !== undefined) {
              patch.difficulty = Math.max(1, Math.min(5, Math.floor(Number(body.difficulty) || 1)));
              patch.expReward = calculateExpByDifficulty(patch.difficulty);
            }
            if (body.dueDate !== undefined) {
              if (body.dueDate !== null && Number.isNaN(Date.parse(body.dueDate))) {
                return errorResponse(400, "invalid_input", "dueDate must be a valid ISO date string.");
              }
              patch.dueDate = body.dueDate;
            }
            patch.updatedAt = new Date().toISOString();
            const updated = await repository.updateTask(user.id, taskId, patch);
            if (!updated) return errorResponse(404, "not_found", "The requested resource was not found.");

            let progress = null;
            const statusChanged = currentTask.status !== updated.status;
            if (statusChanged && currentTask.status !== "completed" && updated.status === "completed") {
              progress = await repository.adjustProgress(user.id, {
                xpDelta: updated.expReward,
                completedDelta: 1,
                updatedAt: patch.updatedAt
              });
            } else if (statusChanged && currentTask.status === "completed" && updated.status !== "completed") {
              progress = await repository.adjustProgress(user.id, {
                xpDelta: -currentTask.expReward,
                completedDelta: -1,
                updatedAt: patch.updatedAt
              });
            } else if (!statusChanged && updated.status === "completed" && currentTask.expReward !== updated.expReward) {
              progress = await repository.adjustProgress(user.id, {
                xpDelta: updated.expReward - currentTask.expReward,
                updatedAt: patch.updatedAt
              });
            }

            await repository.createAuditLog({ userId: user.id, action: "task.update", targetId: taskId, ipAddress: clientIp, createdAt: patch.updatedAt });
            return json(200, {
              task: pickTask(updated),
              progress: progress
                ? {
                    xp: Number(progress.xp),
                    level: Number(progress.level),
                    completedTaskCount: Number(progress.completed_task_count ?? progress.completedTaskCount ?? 0)
                  }
                : null
            });
          }

          if (request.method === "DELETE") {
            const deleted = await repository.deleteTask(user.id, taskId);
            if (!deleted) return errorResponse(404, "not_found", "The requested resource was not found.");
            await repository.createAuditLog({ userId: user.id, action: "task.delete", targetId: taskId, ipAddress: clientIp, createdAt: new Date().toISOString() });
            return json(200, { deleted: true });
          }
        }

        return errorResponse(404, "not_found", "The requested resource was not found.");
      } catch (error) {
        if (error.statusCode) {
          return errorResponse(error.statusCode, error.code ?? "request_error", error.message);
        }
        console.error("Unhandled error:", error);
        return errorResponse(500, "internal_error", error.message || "An unexpected error occurred.");
      }
    }
  };
}
