// マスターアカウントのシードデータを生成してローカルDBに挿入するスクリプト
// Usage: node seed.js | wrangler d1 execute hackathon-sokuseki-team1-db --local --command "$(node seed.js)"

import { hashPassword, createId } from "./src/crypto.js";

const email = "master@example.com";
const username = "master";
const password = "password123";

const { hash, salt } = await hashPassword(password);
const id = createId("usr");
const now = new Date().toISOString();

const sql = [
  `INSERT OR IGNORE INTO users (id, email, username, password_hash, password_salt, created_at) VALUES ('${id}', '${email}', '${username}', '${hash}', '${salt}', '${now}');`,
  `INSERT OR IGNORE INTO user_progress (user_id, xp, level, completed_task_count, updated_at) VALUES ('${id}', 0, 1, 0, '${now}');`
].join("\n");

console.log(sql);
