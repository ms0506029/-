// src/shared/legacy-compat/apiClient.js
// Compatibility wrapper for GAS endpoints used by legacy outfit wall modules.
const DEFAULT_GAS_BASE = "https://script.google.com/macros/s/AKfycbw5RiNNZmKaC-NK2cwrTwoFZ9mT6YG42PZ3vJ2XhltnzXBBFO1qZuJ_XAXScbTRUxme/exec";
let baseUrl = typeof window !== "undefined" && window.OUTFIT_SCRIPT_URL
  ? window.OUTFIT_SCRIPT_URL
  : DEFAULT_GAS_BASE;

export function setBaseUrl(url) {
  if (typeof url === "string" && url.trim()) {
    baseUrl = url.trim();
  }
}

export function getBaseUrl() {
  return baseUrl;
}

function buildQuery(params) {
  const search = new URLSearchParams(params || {});
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function fetchJson(path, options = {}, retries = 1) {
  const url = `${baseUrl}${path || ""}`;
  const request = {
    headers: { "Content-Type": "application/json" },
    ...options,
  };

  const response = await fetch(url, request);
  const raw = await response.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (err) {
    data = { error: "Invalid JSON response" };
  }

  if (!response.ok || data?.error) {
    if (retries > 0) {
      return fetchJson(path, options, retries - 1);
    }
    const message = data?.error || response.statusText || "Request failed";
    throw new Error(message);
  }

  return data;
}

export async function get(path = "", params = {}) {
  return fetchJson(`${path}${buildQuery(params)}`);
}

export async function post(path = "", payload = {}) {
  return fetchJson(path, { method: "POST", body: JSON.stringify(payload) });
}

export async function del(path = "", payload = {}) {
  return fetchJson(path, { method: "DELETE", body: JSON.stringify(payload) });
}
