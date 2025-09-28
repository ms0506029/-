<!-- 建議放在 EasyStore 或測試頁直接以 <script type="module"> 載入 -->
<script type="module">
// ====== 設定 ======
const GAS_BASE = "https://script.google.com/macros/s/AKfycbw5RiNNZmKaC-NK2cwrTwoFZ9mT6YG42PZ3vJ2XhltnzXBBFO1qZuJ_XAXScbTRUxme/exec";

// 讀取 handle（優先 data-handle，否則取 URL ?handle=）
const root = document.getElementById("outfit-profile-root");
const urlParams = new URLSearchParams(location.search);
const handle = (root?.dataset?.handle || urlParams.get("handle") || "@demo").trim();

// ====== 極簡 API client（之後可換成 src/shared/legacy-compat/apiClient.js）======
const q = (obj)=> {
  const s = new URLSearchParams(obj || {});
  return s.toString() ? `?${s}` : "";
};
async function get(path, params){
  const r = await fetch(`${GAS_BASE}${path||""}${q(params)}`, {headers:{'Content-Type':'application/json'}});
  const t = await r.text(); let d = {};
  try { d = t ? JSON.parse(t) : {}; } catch { d = {error:'Invalid JSON'}; }
  if(!r.ok || d.error) throw new Error(d.error || r.statusText);
  return d;
}

// ====== Render helpers（之後可換成 compat renderers）======
function h(html){ const el = document.createElement("div"); el.innerHTML = html.trim(); return el.firstElementChild; }
function renderLookCard(l){
  const el = h(`
    <article class="op-card">
      <img class="op-cover" src="${l.cover}" alt="look">
      <div class="op-info">${l.size_summary || ""}</div>
      <div class="op-metrics">❤️ ${l.metrics?.likes||0} ｜ 👀 ${l.metrics?.refs||0} ｜ 🛍️ ${l.metrics?.pm||0}</div>
    </article>
  `);
  return el;
}

// ====== 初始化 ======
if(!root){ console.warn("#outfit-profile-root not found"); }
root.innerHTML = `<div class="op-loading">載入中…</div>`;

try{
  const data = await get("", { route:"profile", handle });
  const p = data.profile || {}; const looks = data.looks || [];
  root.innerHTML = `
    <section class="op-hero">
      <div class="op-avatar"></div>
      <div class="op-meta">
        <h1>${p.display_name || "User"} <small>${p.handle || handle}</small></h1>
        <p>身高 ${p.size_card?.height_cm ?? "-"} ｜ Tops ${p.size_card?.top ?? "-"} / Bottoms ${p.size_card?.bottom ?? "-"}</p>
        <p>追蹤 ${p.stats?.followers ?? 0}｜穿搭 ${p.stats?.looks ?? 0}</p>
      </div>
    </section>
    <section class="op-grid"></section>
  `;
  const grid = root.querySelector(".op-grid");
  looks.forEach(l => grid.appendChild(renderLookCard(l)));
}catch(err){
  root.innerHTML = `<div class="op-error">讀取失敗：${err.message}</div>`;
}
</script>

<style>
/* 最小樣式，之後可用你的 css/ 合併 */
.op-loading,.op-error{padding:12px}
.op-hero{display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid #eee}
.op-avatar{width:56px;height:56px;border-radius:50%;background:#eee}
.op-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;padding:16px 0}
.op-card{border:1px solid #eee;border-radius:12px;overflow:hidden}
.op-card .op-cover{width:100%;display:block}
.op-card .op-info,.op-card .op-metrics{padding:8px 10px;font-size:14px}
</style>
