const API_BASE = import.meta.env.PROD
  ? "https://hackathon-sokuseki-team1-backend.btsi10-558.workers.dev/api"
  : "/api";

function getToken() {
  return localStorage.getItem("authToken");
}

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    const err = new Error("Backend response was not valid JSON.");
    err.code = "network_error";
    err.status = res.status;
    throw err;
  }

  if (!res.ok) {
    const err = new Error(data.error?.message || `API Error: ${res.status}`);
    err.code = data.error?.code;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  register: (email, username, password) =>
    request("POST", "/auth/register", { email, username, password }),
  login: (email, password) =>
    request("POST", "/auth/login", { email, password }),

  getTasks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request("GET", `/tasks${qs ? `?${qs}` : ""}`);
  },
  createTask: (data) => request("POST", "/tasks", data),
  updateTask: (id, data) => request("PATCH", `/tasks/${id}`, data),
  deleteTask: (id) => request("DELETE", `/tasks/${id}`),
  completeTask: (id) => request("POST", `/tasks/${id}/complete`),
  getProgress: () => request("GET", "/progress"),

  getProfile: () => request("GET", "/me/profile"),
  saveProfile: (data) => request("PUT", "/me/profile", data),

  getAiSettings: () => request("GET", "/me/ai-settings"),
  saveAiSettings: (data) => request("PUT", "/me/ai-settings", data),
  testAiSettings: (data) => request("POST", "/me/ai-settings/test", data),

  scoreDifficulty: (data) => request("POST", "/ai/difficulty", data)
};
