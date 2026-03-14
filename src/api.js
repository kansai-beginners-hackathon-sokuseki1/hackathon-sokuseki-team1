// バックエンドAPIクライアント
// vite.config.js のプロキシ設定で /api/* → http://localhost:8787 に転送される

const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("authToken");
}

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error?.message || `API Error: ${res.status}`);
    err.code = data.error?.code;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // 認証
  register: (email, username, password) =>
    request("POST", "/auth/register", { email, username, password }),
  login: (email, password) =>
    request("POST", "/auth/login", { email, password }),

  // タスク
  getTasks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request("GET", `/tasks${qs ? "?" + qs : ""}`);
  },
  createTask: (data) => request("POST", "/tasks", data),
  updateTask: (id, data) => request("PATCH", `/tasks/${id}`, data),
  deleteTask: (id) => request("DELETE", `/tasks/${id}`),
  completeTask: (id) => request("POST", `/tasks/${id}/complete`),

  // 進捗
  getProgress: () => request("GET", "/progress"),
};
