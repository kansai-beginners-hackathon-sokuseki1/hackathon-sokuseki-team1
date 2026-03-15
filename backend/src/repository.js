import { computeLevelFromXp } from "./rpg.js";
import { createId } from "./crypto.js";

function normalizeTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id ?? row.userId,
    title: row.title,
    description: row.description ?? "",
    status: row.status,
    priority: row.priority,
    difficulty: row.difficulty ?? 1,
    expReward: row.exp_reward ?? row.expReward ?? 10,
    dueDate: row.due_date ?? row.dueDate ?? null,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
    completedAt: row.completed_at ?? row.completedAt ?? null
  };
}

function sortToSql(sort) {
  switch (sort) {
    case "dueDate": return "due_date";
    case "priority": return "priority";
    case "status": return "status";
    case "difficulty": return "difficulty";
    default: return "created_at";
  }
}

function normalizeProfileMeta(row) {
  if (!row) return null;
  return {
    userId: row.user_id ?? row.userId,
    onboardingCompleted: Boolean(row.onboarding_completed ?? row.onboardingCompleted),
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt
  };
}

function normalizeAiSettings(row) {
  if (!row) return null;
  return {
    userId: row.user_id ?? row.userId,
    useServerDefault: Boolean(row.use_server_default ?? row.useServerDefault),
    provider: row.provider ?? null,
    model: row.model ?? null,
    encryptedApiKey: row.encrypted_api_key ?? row.encryptedApiKey ?? null,
    baseUrl: row.base_url ?? row.baseUrl ?? "",
    lastTestedAt: row.last_tested_at ?? row.lastTestedAt ?? null,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt
  };
}

export function createD1Repository(db) {
  return {
    async findUserByEmail(email) {
      return db.prepare(
        "SELECT id, email, username, password_hash, password_salt, created_at FROM users WHERE lower(email) = lower(?)"
      ).bind(email).first();
    },

    async createUser({ email, username, passwordHash, passwordSalt, createdAt }) {
      const userId = createId("user");
      await db.batch([
        db.prepare(
          "INSERT INTO users (id, email, username, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(userId, email, username, passwordHash, passwordSalt, createdAt),
        db.prepare(
          "INSERT INTO user_progress (user_id, xp, level, completed_task_count, updated_at) VALUES (?, 0, 1, 0, ?)"
        ).bind(userId, createdAt)
      ]);
      return { id: userId, email, username, created_at: createdAt };
    },

    async createSession({ userId, token, createdAt }) {
      await db.prepare(
        "INSERT INTO sessions (token, user_id, created_at, last_used_at) VALUES (?, ?, ?, ?)"
      ).bind(token, userId, createdAt, createdAt).run();
    },

    async findSessionWithUser(token) {
      return db.prepare(`
        SELECT
          s.token, s.user_id, s.created_at AS session_created_at, s.last_used_at,
          u.id, u.email, u.username, u.password_hash, u.password_salt, u.created_at
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = ?
      `).bind(token).first();
    },

    async touchSession(token, usedAt) {
      await db.prepare("UPDATE sessions SET last_used_at = ? WHERE token = ?").bind(usedAt, token).run();
    },

    async deleteSession(token) {
      await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
    },

    async createAuditLog(entry) {
      await db.prepare(
        "INSERT INTO audit_logs (id, user_id, action, target_id, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(
        createId("audit"),
        entry.userId ?? null,
        entry.action,
        entry.targetId ?? null,
        entry.ipAddress ?? null,
        entry.createdAt
      ).run();
    },

    async resetExpiredTasks(userId, updatedAt, todayIso) {
      await db.prepare(`
        UPDATE tasks
        SET status = 'todo', updated_at = ?
        WHERE user_id = ?
          AND status = 'in_progress'
          AND due_date IS NOT NULL
          AND substr(due_date, 1, 10) < ?
      `).bind(updatedAt, userId, todayIso).run();
    },

    async createTask({ userId, title, description, priority, difficulty, expReward, dueDate, createdAt }) {
      const taskId = createId("task");
      await db.prepare(`
        INSERT INTO tasks (id, user_id, title, description, status, priority, difficulty, exp_reward, due_date, created_at, updated_at, completed_at)
        VALUES (?, ?, ?, ?, 'todo', ?, ?, ?, ?, ?, ?, NULL)
      `).bind(taskId, userId, title, description, priority, difficulty, expReward, dueDate, createdAt, createdAt).run();
      return this.findTaskById(userId, taskId);
    },

    async findTaskById(userId, taskId) {
      const row = await db.prepare(`
        SELECT id, user_id, title, description, status, priority, difficulty, exp_reward, due_date, created_at, updated_at, completed_at
        FROM tasks WHERE id = ? AND user_id = ?
      `).bind(taskId, userId).first();
      return normalizeTask(row);
    },

    async listTasks(userId, filters) {
      const clauses = ["user_id = ?"];
      const values = [userId];
      if (filters.status) {
        clauses.push("status = ?");
        values.push(filters.status);
      }
      if (filters.priority) {
        clauses.push("priority = ?");
        values.push(filters.priority);
      }

      const where = clauses.join(" AND ");
      const totalRow = await db.prepare(`SELECT COUNT(*) AS count FROM tasks WHERE ${where}`).bind(...values).first();
      const sortColumn = sortToSql(filters.sort);
      const direction = filters.order === "asc" ? "ASC" : "DESC";
      const offset = (filters.page - 1) * filters.pageSize;

      const rows = await db.prepare(`
        SELECT id, user_id, title, description, status, priority, difficulty, exp_reward, due_date, created_at, updated_at, completed_at
        FROM tasks WHERE ${where}
        ORDER BY ${sortColumn} ${direction}
        LIMIT ? OFFSET ?
      `).bind(...values, filters.pageSize, offset).all();

      return { total: Number(totalRow.count), items: rows.results.map(normalizeTask) };
    },

    async updateTask(userId, taskId, patch) {
      const current = await this.findTaskById(userId, taskId);
      if (!current) return null;

      const next = {
        title: patch.title ?? current.title,
        description: patch.description ?? current.description,
        status: patch.status ?? current.status,
        priority: patch.priority ?? current.priority,
        difficulty: patch.difficulty ?? current.difficulty,
        expReward: patch.expReward ?? current.expReward,
        dueDate: patch.dueDate === undefined ? current.dueDate : patch.dueDate,
        completedAt:
          patch.status === "completed" && current.status !== "completed"
            ? patch.updatedAt
            : patch.status && patch.status !== "completed"
              ? null
              : current.completedAt,
        updatedAt: patch.updatedAt
      };

      await db.prepare(`
        UPDATE tasks
        SET title = ?, description = ?, status = ?, priority = ?, difficulty = ?, exp_reward = ?,
            due_date = ?, completed_at = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `).bind(
        next.title,
        next.description,
        next.status,
        next.priority,
        next.difficulty,
        next.expReward,
        next.dueDate,
        next.completedAt,
        next.updatedAt,
        taskId,
        userId
      ).run();

      return this.findTaskById(userId, taskId);
    },

    async adjustProgress(userId, { xpDelta = 0, completedDelta = 0, updatedAt }) {
      const current = await this.getUserProgress(userId);
      if (!current) return null;

      const nextXp = Math.max(0, Number(current.xp) + xpDelta);
      const nextCompleted = Math.max(0, Number(current.completed_task_count) + completedDelta);
      const { level: nextLevel } = computeLevelFromXp(nextXp);

      await db.prepare(`
        UPDATE user_progress
        SET xp = ?, level = ?, completed_task_count = ?, updated_at = ?
        WHERE user_id = ?
      `).bind(nextXp, nextLevel, nextCompleted, updatedAt, userId).run();

      return {
        xp: nextXp,
        level: nextLevel,
        completed_task_count: nextCompleted
      };
    },

    async claimProgressBonus(userId, { bonusType, claimKey, xpAward, metadata = {}, claimedAt }) {
      const current = await this.getUserProgress(userId);
      if (!current) return null;

      const insert = await db.prepare(`
        INSERT OR IGNORE INTO progress_bonus_claims (id, user_id, bonus_type, claim_key, xp_award, metadata_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        createId("bonus"),
        userId,
        bonusType,
        claimKey,
        xpAward,
        JSON.stringify(metadata),
        claimedAt
      ).run();

      if ((insert.meta?.changes ?? 0) === 0) {
        return {
          claimed: false,
          progress: {
            xp: Number(current.xp),
            level: Number(current.level),
            completed_task_count: Number(current.completed_task_count)
          }
        };
      }

      const nextXp = Number(current.xp) + xpAward;
      const nextCompleted = Number(current.completed_task_count);
      const { level: nextLevel } = computeLevelFromXp(nextXp);

      await db.batch([
        db.prepare(`
          UPDATE user_progress SET xp = ?, level = ?, completed_task_count = ?, updated_at = ?
          WHERE user_id = ?
        `).bind(nextXp, nextLevel, nextCompleted, claimedAt, userId),
        db.prepare(`
          INSERT INTO milestone_events (id, user_id, type, metadata_json, created_at)
          VALUES (?, ?, 'progress_bonus', ?, ?)
        `).bind(
          createId("event"),
          userId,
          JSON.stringify({ bonusType, claimKey, xpAward, ...metadata }),
          claimedAt
        )
      ]);

      if (nextLevel > Number(current.level)) {
        await db.prepare(`
          INSERT INTO milestone_events (id, user_id, type, metadata_json, created_at)
          VALUES (?, ?, 'level_up', ?, ?)
        `).bind(createId("event"), userId, JSON.stringify({ level: nextLevel }), claimedAt).run();
      }

      return {
        claimed: true,
        progress: {
          xp: nextXp,
          level: nextLevel,
          completed_task_count: nextCompleted
        }
      };
    },

    async deleteTask(userId, taskId) {
      const result = await db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").bind(taskId, userId).run();
      return result.meta.changes > 0;
    },

    async getUserProgress(userId) {
      return db.prepare(
        "SELECT user_id, xp, level, completed_task_count, updated_at FROM user_progress WHERE user_id = ?"
      ).bind(userId).first();
    },

    async getTaskSummary(userId, nowIso) {
      const row = await db.prepare(`
        SELECT
          COUNT(*) AS totalTaskCount,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completedTaskCount,
          SUM(CASE WHEN status != 'completed' AND due_date IS NOT NULL AND due_date < ? THEN 1 ELSE 0 END) AS overdueTaskCount
        FROM tasks WHERE user_id = ?
      `).bind(nowIso, userId).first();
      return {
        totalTaskCount: Number(row.totalTaskCount ?? 0),
        completedTaskCount: Number(row.completedTaskCount ?? 0),
        overdueTaskCount: Number(row.overdueTaskCount ?? 0)
      };
    },

    async completeTask(userId, taskId, completedAt) {
      const task = await this.findTaskById(userId, taskId);
      if (!task) return { status: "missing" };

      const markCompleted = await db.prepare(`
        UPDATE tasks
        SET status = 'completed', completed_at = ?, updated_at = ?
        WHERE id = ? AND user_id = ? AND status != 'completed'
      `).bind(completedAt, completedAt, taskId, userId).run();

      if (markCompleted.meta.changes === 0) {
        const latestTask = await this.findTaskById(userId, taskId);
        const progress = await this.getUserProgress(userId);
        return { status: "already_completed", task: latestTask ?? task, progress };
      }

      const progress = await this.getUserProgress(userId);
      const xpGain = task.expReward;
      const nextXp = Number(progress.xp) + xpGain;
      const nextCompleted = Number(progress.completed_task_count) + 1;
      const { level: nextLevel } = computeLevelFromXp(nextXp);

      await db.batch([
        db.prepare(`
          UPDATE user_progress SET xp = ?, level = ?, completed_task_count = ?, updated_at = ?
          WHERE user_id = ?
        `).bind(nextXp, nextLevel, nextCompleted, completedAt, userId),
        db.prepare(`
          INSERT INTO milestone_events (id, user_id, type, metadata_json, created_at)
          VALUES (?, ?, 'task_completed', ?, ?)
        `).bind(createId("event"), userId, JSON.stringify({ taskId, xpAwarded: xpGain }), completedAt)
      ]);

      if (nextLevel > Number(progress.level)) {
        await db.prepare(`
          INSERT INTO milestone_events (id, user_id, type, metadata_json, created_at)
          VALUES (?, ?, 'level_up', ?, ?)
        `).bind(createId("event"), userId, JSON.stringify({ level: nextLevel }), completedAt).run();
      }

      return {
        status: "completed",
        task: await this.findTaskById(userId, taskId),
        progress: { xp: nextXp, level: nextLevel, completed_task_count: nextCompleted }
      };
    },

    async getProfile(userId) {
      const [meta, preferences] = await Promise.all([
        db.prepare("SELECT user_id, onboarding_completed, created_at, updated_at FROM user_profiles WHERE user_id = ?")
          .bind(userId)
          .first(),
        db.prepare(`
          SELECT id, user_id, category_id, preference_type, created_at, updated_at
          FROM user_profile_preferences
          WHERE user_id = ?
          ORDER BY category_id ASC
        `).bind(userId).all()
      ]);

      return {
        meta: normalizeProfileMeta(meta),
        preferences: preferences.results.map((row) => ({
          id: row.id,
          userId: row.user_id,
          categoryId: row.category_id,
          preferenceType: row.preference_type,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }))
      };
    },

    async saveProfile(userId, { onboardingCompleted, preferences, now }) {
      await db.prepare(`
        INSERT INTO user_profiles (user_id, onboarding_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET onboarding_completed = excluded.onboarding_completed, updated_at = excluded.updated_at
      `).bind(userId, onboardingCompleted ? 1 : 0, now, now).run();

      await db.prepare("DELETE FROM user_profile_preferences WHERE user_id = ?").bind(userId).run();

      if (preferences.length > 0) {
        const statements = preferences.map((item) => db.prepare(`
          INSERT INTO user_profile_preferences (id, user_id, category_id, preference_type, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(createId("pref"), userId, item.categoryId, item.preferenceType, now, now));
        await db.batch(statements);
      }

      return this.getProfile(userId);
    },

    async getAiSettings(userId) {
      const row = await db.prepare(`
        SELECT user_id, use_server_default, provider, model, encrypted_api_key, base_url, last_tested_at, created_at, updated_at
        FROM user_ai_settings
        WHERE user_id = ?
      `).bind(userId).first();
      return normalizeAiSettings(row);
    },

    async saveAiSettings(userId, { useServerDefault, provider, model, encryptedApiKey, baseUrl, lastTestedAt, now }) {
      await db.prepare(`
        INSERT INTO user_ai_settings (user_id, use_server_default, provider, model, encrypted_api_key, base_url, last_tested_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          use_server_default = excluded.use_server_default,
          provider = excluded.provider,
          model = excluded.model,
          encrypted_api_key = excluded.encrypted_api_key,
          base_url = excluded.base_url,
          last_tested_at = excluded.last_tested_at,
          updated_at = excluded.updated_at
      `).bind(
        userId,
        useServerDefault ? 1 : 0,
        provider ?? null,
        model ?? null,
        encryptedApiKey ?? null,
        baseUrl ?? null,
        lastTestedAt ?? null,
        now,
        now
      ).run();

      return this.getAiSettings(userId);
    }
  };
}
