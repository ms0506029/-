// src/shared/legacy-compat/apiClient.js
const DEFAULT_GAS_BASE = "https://script.google.com/macros/s/AKfycbw5RiNNZmKaC-NK2cwrTwoFZ9mT6YG42PZ3vJ2XhltnzXBBFO1qZuJ_XAXScbTRUxme/exec";
let baseUrl = (typeof window !== "undefined" && window.OUTFIT_SCRIPT_URL) || DEFAULT_GAS_BASE;

export function setBaseUrl(url){ if (url) baseUrl = url; }

function q(params){ const s = new URLSearchParams(params||{}); return s.toString() ? `?${s}` : ""; }

async function fetchJson(url, options = {}, retry = 1){
  const res = await fetch(url, options);
  const txt = await res.text();
  let data = {}; try { data = txt ? JSON.parse(txt) : {}; } catch { data = { error: "Invalid JSON" }; }
  if (!res.ok || data.error){
    if (retry > 0) return fetchJson(url, options, retry-1);
    throw new Error(data.error || res.statusText);
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

async function request(path, options = {}, retries = 1) {
  const url = `${baseUrl}${path || ""}`;
  const response = await fetch(url, options);
  const raw = await response.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (err) {
    data = { error: "Invalid JSON response" };
  }

  if (!response.ok || data?.error) {
    if (retries > 0) {
      return request(path, options, retries - 1);
    }
    const message = data?.error || response.statusText || "Request failed";
    throw new Error(message);
  }

  return data;
}

export function get(path = "", params = {}) {
  return request(`${path}${buildQuery(params)}`);
}

export function post(path = "", payload = {}) {
  const body = new URLSearchParams(payload).toString();
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });
}

export function del(path = "", payload = {}) {
  const body = new URLSearchParams(payload).toString();
  return request(path, {
    method: "DELETE",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });
}
