const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const TOKEN_KEY = "bitcoin_forensics_token";
const USER_KEY = "bitcoin_forensics_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});

  const token = getToken();

  // Always attach the JWT when available
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const isFormData = options.body instanceof FormData;

  // IMPORTANT:
  // Do NOT manually set Content-Type for FormData.
  // Browser will automatically add multipart/form-data boundary.
  if (!isFormData && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();

  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {
      error: text || "Unexpected server response.",
    };
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAuth();

      window.dispatchEvent(
        new Event("auth-expired")
      );
    }

    throw new Error(
      data.error ||
      data.message ||
      `Request failed (${response.status})`
    );
  }

  return data;
}

const client = {
  get(path) {
    return request(path, {
      method: "GET",
    });
  },

  post(path, body) {
    return request(path, {
      method: "POST",
      body:
        body instanceof FormData
          ? body
          : JSON.stringify(body),
    });
  },

  put(path, body) {
    return request(path, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  delete(path) {
    return request(path, {
      method: "DELETE",
    });
  },
};

export default client;