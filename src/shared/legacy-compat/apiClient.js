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
  return data;
}

export function get(path = "", params = {}){
  const url = `${baseUrl}${path}${q(params)}`;
  // 不要加任何自訂標頭，避免預檢
  return fetchJson(url);
}

export function post(path = "", payload = {}){
  const url = `${baseUrl}${path}`;
  // 用 x-www-form-urlencoded（簡單請求，不會預檢）
  const body = new URLSearchParams(payload).toString();
  return fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body
  });
}
