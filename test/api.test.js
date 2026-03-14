import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { RateLimiter } from "../src/rate-limit.js";
import { createMemoryRepository } from "../src/repository.js";

function startApp() {
  const app = createApp({
    repository: createMemoryRepository(),
    rateLimiter: new RateLimiter(1000, 60_000)
  });

  return {
    async request(method, pathname, body, token) {
      const response = await app.fetch(new Request(`http://example.test${pathname}`, {
        method,
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {})
        },
        body: body ? JSON.stringify(body) : undefined
      }));

      return {
        status: response.status,
        body: await response.json()
      };
    }
  };
}

async function request(app, method, pathname, body, token) {
  return app.request(method, pathname, body, token);
}

test("register, login, task flow, and RPG progress work end-to-end", async () => {
  const app = startApp();

  const register = await request(app, "POST", "/api/auth/register", {
    email: "hero@example.com",
    username: "Hero",
    password: "safepass123"
  });
  assert.equal(register.status, 201);

  const login = await request(app, "POST", "/api/auth/login", {
    email: "hero@example.com",
    password: "safepass123"
  });
  assert.equal(login.status, 200);
  assert.ok(login.body.token);

  const token = login.body.token;

  const createTask = await request(app, "POST", "/api/tasks", {
    title: "Defeat slimes",
    description: "Finish the daily cleanup quest",
    priority: "high",
    dueDate: "2099-12-31T00:00:00.000Z"
  }, token);
  assert.equal(createTask.status, 201);

  const taskId = createTask.body.task.id;

  const listTasks = await request(app, "GET", "/api/tasks?page=1&pageSize=10", null, token);
  assert.equal(listTasks.status, 200);
  assert.equal(listTasks.body.tasks.length, 1);

  const completeTask = await request(app, "POST", `/api/tasks/${taskId}/complete`, null, token);
  assert.equal(completeTask.status, 200);
  assert.equal(completeTask.body.progress.xp, 10);
  assert.equal(completeTask.body.progress.level, 1);

  const progress = await request(app, "GET", "/api/progress", null, token);
  assert.equal(progress.status, 200);
  assert.equal(progress.body.progress.completedTaskCount, 1);

  const rpgState = await request(app, "GET", "/api/rpg-state", null, token);
  assert.equal(rpgState.status, 200);
  assert.equal(rpgState.body.rpgState.progressStage, "meadow");
  assert.equal(rpgState.body.rpgState.guideState, "victory");
});

test("authorization isolates each user's tasks", async () => {
  const app = startApp();

  await request(app, "POST", "/api/auth/register", {
    email: "hero1@example.com",
    username: "Hero1",
    password: "safepass123"
  });
  await request(app, "POST", "/api/auth/register", {
    email: "hero2@example.com",
    username: "Hero2",
    password: "safepass123"
  });

  const login1 = await request(app, "POST", "/api/auth/login", {
    email: "hero1@example.com",
    password: "safepass123"
  });
  const login2 = await request(app, "POST", "/api/auth/login", {
    email: "hero2@example.com",
    password: "safepass123"
  });

  const created = await request(app, "POST", "/api/tasks", { title: "Private quest" }, login1.body.token);
  const taskId = created.body.task.id;

  const forbiddenLookup = await request(app, "GET", `/api/tasks/${taskId}`, null, login2.body.token);
  assert.equal(forbiddenLookup.status, 404);
});

test("completing the same task twice does not double-award XP", async () => {
  const app = startApp();

  await request(app, "POST", "/api/auth/register", {
    email: "hero3@example.com",
    username: "Hero3",
    password: "safepass123"
  });
  const login = await request(app, "POST", "/api/auth/login", {
    email: "hero3@example.com",
    password: "safepass123"
  });
  const token = login.body.token;

  const created = await request(app, "POST", "/api/tasks", { title: "Repeatable?" }, token);
  const taskId = created.body.task.id;

  const firstComplete = await request(app, "POST", `/api/tasks/${taskId}/complete`, null, token);
  const secondComplete = await request(app, "POST", `/api/tasks/${taskId}/complete`, null, token);
  const progress = await request(app, "GET", "/api/progress", null, token);

  assert.equal(firstComplete.status, 200);
  assert.equal(secondComplete.status, 200);
  assert.equal(secondComplete.body.alreadyCompleted, true);
  assert.equal(progress.body.progress.xp, 10);
});
