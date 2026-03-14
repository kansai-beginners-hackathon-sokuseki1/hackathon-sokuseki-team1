import {
  XP_PER_COMPLETED_TASK,
  calculateLevel,
  calculateProgressStage
} from "./rpg.js";
import { createId } from "./crypto.js";

function normalizeTask(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id ?? row.userId,
    title: row.title,
    description: row.description ?? "",
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date ?? row.dueDate ?? null,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
    completedAt: row.completed_at ?? row.completedAt ?? null
  };
}

function sortToSql(sort) {
  switch (sort) {
    case "dueDate":
      return "due_date";
    case "priority":
      return "priority";
    case "status":
      return "status";
    default:
      return "created_at";
  }
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
      return {
        id: userId,
        email,
        username,
        created_at: createdAt
      };
    },

    async createSession({ userId, token, createdAt }) {
      await db.prepare(
        "INSERT INTO sessions (token, user_id, created_at, last_used_at) VALUES (?, ?, ?, ?)"
      ).bind(token, userId, createdAt, createdAt).run();
    },

    async findSessionWithUser(token) {
      return db.prepare(`
        SELECT
          s.token,
          s.user_id,
          s.created_at AS session_created_at,
          s.last_used_at,
          u.id,
          u.email,
          u.username,
          u.password_hash,
          u.password_salt,
          u.created_at
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

    async createTask({ userId, title, description, priority, dueDate, createdAt }) {
      const taskId = createId("task");
      await db.prepare(`
        INSERT INTO tasks (id, user_id, title, description, status, priority, due_date, created_at, updated_at, completed_at)
        VALUES (?, ?, ?, ?, 'todo', ?, ?, ?, ?, NULL)
      `).bind(taskId, userId, title, description, priority, dueDate, createdAt, createdAt).run();
      return this.findTaskById(userId, taskId);
    },

    async findTaskById(userId, taskId) {
      const row = await db.prepare(`
        SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at, completed_at
        FROM tasks
        WHERE id = ? AND user_id = ?
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
        SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at, completed_at
        FROM tasks
        WHERE ${where}
        ORDER BY ${sortColumn} ${direction}
        LIMIT ? OFFSET ?
      `).bind(...values, filters.pageSize, offset).all();

      return {
        total: Number(totalRow.count),
        items: rows.results.map(normalizeTask)
      };
    },

    async updateTask(userId, taskId, patch) {
      const current = await this.findTaskById(userId, taskId);
      if (!current) {
        return null;
      }

      const next = {
        title: patch.title ?? current.title,
        description: patch.description ?? current.description,
        status: patch.status ?? current.status,
        priority: patch.priority ?? current.priority,
        dueDate: patch.dueDate === undefined ? current.dueDate : patch.dueDate,
        completedAt: patch.status && patch.status !== "completed" ? null : current.completedAt,
        updatedAt: patch.updatedAt
      };

      await db.prepare(`
        UPDATE tasks
        SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, completed_at = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `).bind(
        next.title,
        next.description,
        next.status,
        next.priority,
        next.dueDate,
        next.completedAt,
        next.updatedAt,
        taskId,
        userId
      ).run();

      return this.findTaskById(userId, taskId);
    },

    async deleteTask(userId, taskId) {
      const result = await db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").bind(taskId, userId).run();
      return result.meta.changes > 0;
    },

    async getUserProgress(userId) {
      return db.prepare(`
        SELECT user_id, xp, level, completed_task_count, updated_at
        FROM user_progress
        WHERE user_id = ?
      `).bind(userId).first();
    },

    async getTaskSummary(userId, nowIso) {
      const row = await db.prepare(`
        SELECT
          COUNT(*) AS totalTaskCount,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completedTaskCount,
          SUM(CASE WHEN status != 'completed' AND due_date IS NOT NULL AND due_date < ? THEN 1 ELSE 0 END) AS overdueTaskCount
        FROM tasks
        WHERE user_id = ?
      `).bind(nowIso, userId).first();

      return {
        totalTaskCount: Number(row.totalTaskCount ?? 0),
        completedTaskCount: Number(row.completedTaskCount ?? 0),
        overdueTaskCount: Number(row.overdueTaskCount ?? 0)
      };
    },

    async completeTask(userId, taskId, completedAt) {
      const task = await this.findTaskById(userId, taskId);
      if (!task) {
        return { status: "missing" };
      }
      if (task.status === "completed") {
        const progress = await this.getUserProgress(userId);
        return { status: "already_completed", task, progress };
      }

      const progress = await this.getUserProgress(userId);
      const nextXp = Number(progress.xp) + XP_PER_COMPLETED_TASK;
      const nextCompleted = Number(progress.completed_task_count) + 1;
      const nextLevel = calculateLevel(nextXp);
      const previousLevel = Number(progress.level);
      const progressStage = calculateProgressStage(nextCompleted);

      await db.batch([
        db.prepare(`
          UPDATE tasks
          SET status = 'completed', completed_at = ?, updated_at = ?
          WHERE id = ? AND user_id = ?
        `).bind(completedAt, completedAt, taskId, userId),
        db.prepare(`
          UPDATE user_progress
          SET xp = ?, level = ?, completed_task_count = ?, updated_at = ?
          WHERE user_id = ?
        `).bind(nextXp, nextLevel, nextCompleted, completedAt, userId),
        db.prepare(`
          INSERT INTO milestone_events (id, user_id, type, metadata_json, created_at)
          VALUES (?, ?, 'task_completed', ?, ?)
        `).bind(
          createId("event"),
          userId,
          JSON.stringify({
            taskId,
            xpAwarded: XP_PER_COMPLETED_TASK,
            progressStage
          }),
          completedAt
        )
      ]);

      if (nextLevel > previousLevel) {
        await db.prepare(`
          INSERT INTO milestone_events (id, user_id, type, metadata_json, created_at)
          VALUES (?, ?, 'level_up', ?, ?)
        `).bind(
          createId("event"),
          userId,
          JSON.stringify({ level: nextLevel }),
          completedAt
        ).run();
      }

      return {
        status: "completed",
        task: await this.findTaskById(userId, taskId),
        progress: {
          xp: nextXp,
          level: nextLevel,
          completed_task_count: nextCompleted
        }
      };
    }
  };
}

export function createMemoryRepository() {
  const state = {
    users: [],
    sessions: [],
    tasks: [],
    progress: [],
    events: [],
    auditLogs: []
  };

  return {
    async findUserByEmail(email) {
      return state.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
    },

    async createUser({ email, username, passwordHash, passwordSalt, createdAt }) {
      const user = {
        id: createId("user"),
        email,
        username,
        password_hash: passwordHash,
        password_salt: passwordSalt,
        created_at: createdAt
      };
      state.users.push(user);
      state.progress.push({
        user_id: user.id,
        xp: 0,
        level: 1,
        completed_task_count: 0,
        updated_at: createdAt
      });
      return user;
    },

    async createSession({ userId, token, createdAt }) {
      state.sessions.push({
        token,
        user_id: userId,
        session_created_at: createdAt,
        last_used_at: createdAt
      });
    },

    async findSessionWithUser(token) {
      const session = state.sessions.find((item) => item.token === token);
      if (!session) {
        return null;
      }
      const user = state.users.find((item) => item.id === session.user_id);
      if (!user) {
        return null;
      }
      return {
        ...session,
        ...user
      };
    },

    async touchSession(token, usedAt) {
      const session = state.sessions.find((item) => item.token === token);
      if (session) {
        session.last_used_at = usedAt;
      }
    },

    async deleteSession(token) {
      const index = state.sessions.findIndex((item) => item.token === token);
      if (index >= 0) {
        state.sessions.splice(index, 1);
      }
    },

    async createAuditLog(entry) {
      state.auditLogs.push(entry);
    },

    async createTask({ userId, title, description, priority, dueDate, createdAt }) {
      const task = {
        id: createId("task"),
        userId,
        title,
        description,
        status: "todo",
        priority,
        dueDate,
        createdAt,
        updatedAt: createdAt,
        completedAt: null
      };
      state.tasks.push(task);
      return task;
    },

    async findTaskById(userId, taskId) {
      return state.tasks.find((task) => task.id === taskId && task.userId === userId) ?? null;
    },

    async listTasks(userId, filters) {
      let tasks = state.tasks.filter((task) => task.userId === userId);
      if (filters.status) {
        tasks = tasks.filter((task) => task.status === filters.status);
      }
      if (filters.priority) {
        tasks = tasks.filter((task) => task.priority === filters.priority);
      }

      const direction = filters.order === "asc" ? 1 : -1;
      tasks = tasks.sort((left, right) => {
        const leftValue = left[filters.sort] ?? "";
        const rightValue = right[filters.sort] ?? "";
        if (leftValue < rightValue) {
          return -1 * direction;
        }
        if (leftValue > rightValue) {
          return 1 * direction;
        }
        return 0;
      });

      const offset = (filters.page - 1) * filters.pageSize;
      return {
        total: tasks.length,
        items: tasks.slice(offset, offset + filters.pageSize)
      };
    },

    async updateTask(userId, taskId, patch) {
      const task = await this.findTaskById(userId, taskId);
      if (!task) {
        return null;
      }
      Object.assign(task, {
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.description !== undefined ? { description: patch.description } : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
        ...(patch.dueDate !== undefined ? { dueDate: patch.dueDate } : {}),
        ...(patch.status && patch.status !== "completed" ? { completedAt: null } : {}),
        updatedAt: patch.updatedAt
      });
      return task;
    },

    async deleteTask(userId, taskId) {
      const index = state.tasks.findIndex((task) => task.id === taskId && task.userId === userId);
      if (index < 0) {
        return false;
      }
      state.tasks.splice(index, 1);
      return true;
    },

    async getUserProgress(userId) {
      return state.progress.find((item) => item.user_id === userId) ?? null;
    },

    async getTaskSummary(userId, nowIso) {
      const tasks = state.tasks.filter((task) => task.userId === userId);
      return {
        totalTaskCount: tasks.length,
        completedTaskCount: tasks.filter((task) => task.status === "completed").length,
        overdueTaskCount: tasks.filter(
          (task) => task.status !== "completed" && task.dueDate && task.dueDate < nowIso
        ).length
      };
    },

    async completeTask(userId, taskId, completedAt) {
      const task = await this.findTaskById(userId, taskId);
      if (!task) {
        return { status: "missing" };
      }
      const progress = await this.getUserProgress(userId);
      if (task.status === "completed") {
        return { status: "already_completed", task, progress };
      }

      task.status = "completed";
      task.completedAt = completedAt;
      task.updatedAt = completedAt;
      progress.xp += XP_PER_COMPLETED_TASK;
      progress.completed_task_count += 1;
      progress.level = calculateLevel(progress.xp);
      progress.updated_at = completedAt;
      state.events.push({ userId, taskId, completedAt });

      return { status: "completed", task, progress };
    }
  };
}
