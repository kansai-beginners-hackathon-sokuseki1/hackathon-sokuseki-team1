import { computeLevelFromXp, calculateExpByDifficulty } from "./rpg.js";
import { createToken, hashPassword, verifyPassword } from "./crypto.js";

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
    id:          task.id,
    title:       task.title,
    description: task.description,
    status:      task.status,
    priority:    task.priority,
    difficulty:  task.difficulty,
    expReward:   task.expReward,
    dueDate:     task.dueDate,
    createdAt:   task.createdAt,
    updatedAt:   task.updatedAt,
    completedAt: task.completedAt
  };
}

function buildTaskFilters(url) {
  const requestedSort = url.searchParams.get("sort");
  return {
    status:   url.searchParams.get("status"),
    priority: url.searchParams.get("priority"),
    sort: ["createdAt", "dueDate", "priority", "status", "difficulty"].includes(requestedSort)
      ? requestedSort : "createdAt",
    order:    url.searchParams.get("order") === "asc" ? "asc" : "desc",
    page:     Math.max(Number.parseInt(url.searchParams.get("page") || "1", 10), 1),
    pageSize: Math.min(Math.max(Number.parseInt(url.searchParams.get("pageSize") || "20", 10), 1), 100)
  };
}

function normalizeUser(sessionUser) {
  if (!sessionUser) return null;
  return {
    id:        sessionUser.id,
    email:     sessionUser.email,
    username:  sessionUser.username,
    createdAt: sessionUser.created_at ?? sessionUser.createdAt
  };
}

export function createApp({ repository, tokenTtlMs = 1000 * 60 * 60 * 24 * 7, rateLimiter }) {
  return {
    async fetch(request) {
      try {
        // CORS preflight
        if (request.method === "OPTIONS") {
          return new Response(null, {
            status: 204,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
              "Access-Control-Allow-Headers": "Authorization, Content-Type"
            }
          });
        }

        const clientIp = request.headers.get("CF-Connecting-IP") ||
                         request.headers.get("x-forwarded-for") || "unknown";
        if (rateLimiter && !rateLimiter.consume(clientIp)) {
          return errorResponse(429, "rate_limited", "Too many requests. Please retry later.");
        }

        const url = new URL(request.url);

        // ヘルスチェック
        if (request.method === "GET" && url.pathname === "/api/health") {
          return json(200, { ok: true });
        }

        // ユーザー登録
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
            email, username: username.trim(),
            passwordHash: hash, passwordSalt: salt, createdAt
          });
          await repository.createAuditLog({ userId: user.id, action: "auth.register", ipAddress: clientIp, createdAt });
          return json(201, { user: { id: user.id, email: user.email, username: user.username, createdAt: user.created_at } });
        }

        // ログイン
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
          const valid = await verifyPassword(
            password,
            user.password_hash ?? user.passwordHash,
            user.password_salt ?? user.passwordSalt
          );
          if (!valid) {
            return errorResponse(401, "invalid_credentials", "The email or password is incorrect.");
          }
          const token = createToken();
          const createdAt = new Date().toISOString();
          await repository.createSession({ userId: user.id, token, createdAt });
          await repository.createAuditLog({ userId: user.id, action: "auth.login", ipAddress: clientIp, createdAt });
          return json(200, { token, user: { id: user.id, email: user.email, username: user.username } });
        }

        // 認証チェック
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

        // タスク一覧
        if (request.method === "GET" && url.pathname === "/api/tasks") {
          const filters = buildTaskFilters(url);
          const page = await repository.listTasks(user.id, filters);
          return json(200, {
            pagination: { total: page.total, page: filters.page, pageSize: filters.pageSize },
            tasks: page.items.map(pickTask)
          });
        }

        // タスク作成
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
            userId: user.id, title, description, priority, difficulty, expReward, dueDate, createdAt: now
          });
          await repository.createAuditLog({ userId: user.id, action: "task.create", targetId: task.id, ipAddress: clientIp, createdAt: now });
          return json(201, { task: pickTask(task) });
        }

        // 進捗取得
        if (request.method === "GET" && url.pathname === "/api/progress") {
          const progress = await repository.getUserProgress(user.id);
          const { level, currentExp } = computeLevelFromXp(Number(progress.xp));
          return json(200, {
            progress: {
              xp:                 Number(progress.xp),
              level,
              currentExp,
              completedTaskCount: Number(progress.completed_task_count ?? 0)
            }
          });
        }

        // タスク完了
        const completeMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)\/complete$/);
        if (completeMatch && request.method === "POST") {
          const now = new Date().toISOString();
          const result = await repository.completeTask(user.id, completeMatch[1], now);
          if (result.status === "missing") {
            return errorResponse(404, "not_found", "The requested resource was not found.");
          }
          await repository.createAuditLog({ userId: user.id, action: "task.complete", targetId: completeMatch[1], ipAddress: clientIp, createdAt: now });
          const progressObj = result.progress
            ? { xp: Number(result.progress.xp), level: Number(result.progress.level), completedTaskCount: Number(result.progress.completed_task_count ?? result.progress.completedTaskCount) }
            : null;
          return json(200, {
            task: pickTask(result.task),
            progress: progressObj,
            alreadyCompleted: result.status === "already_completed"
          });
        }

        // タスク個別操作
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
              // 難易度が変わった場合は未完了タスクのEXPを再計算
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
            await repository.createAuditLog({ userId: user.id, action: "task.update", targetId: taskId, ipAddress: clientIp, createdAt: patch.updatedAt });
            return json(200, { task: pickTask(updated) });
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
        return errorResponse(500, "internal_error", "An unexpected error occurred.");
      }
    }
  };
}
