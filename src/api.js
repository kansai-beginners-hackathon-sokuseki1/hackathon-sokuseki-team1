const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

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

  const responseText = await res.text();
  const contentType = res.headers.get("content-type") || "";

  let data = {};
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      const snippet = responseText.replace(/\s+/g, " ").trim().slice(0, 160);
      const details = [
        `status ${res.status}`,
        contentType ? `content-type: ${contentType}` : null,
        snippet ? `body: ${snippet}` : null
      ].filter(Boolean).join(" / ");

      const err = new Error(`Backend returned a non-JSON response (${details}).`);
      err.code = "invalid_json_response";
      err.status = res.status;
      err.contentType = contentType;
      err.responseText = responseText;
      throw err;
    }
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
  loginAsGuest: () =>
    request("POST", "/auth/guest"),
  loginWithGoogle: (credential) =>
    request("POST", "/auth/google", { credential }),

  getTasks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request("GET", `/tasks${qs ? `?${qs}` : ""}`);
  },
  createTask: (data) => request("POST", "/tasks", data),
  updateTask: (id, data) => request("PATCH", `/tasks/${id}`, data),
  deleteTask: (id) => request("DELETE", `/tasks/${id}`),
  completeTask: (id) => request("POST", `/tasks/${id}/complete`),
  getProgress: () => request("GET", "/progress"),
  claimProgressBonus: (data) => request("POST", "/progress/bonus", data),

  getProfile: () => request("GET", "/me/profile"),
  saveProfile: (data) => request("PUT", "/me/profile", data),

  getAiSettings: () => request("GET", "/me/ai-settings"),
  saveAiSettings: (data) => request("PUT", "/me/ai-settings", data),
  testAiSettings: (data) => request("POST", "/me/ai-settings/test", data),

  scoreDifficulty: (data) => request("POST", "/ai/difficulty", data)
};
