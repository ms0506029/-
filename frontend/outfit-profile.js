import { get, setBaseUrl } from "../src/shared/legacy-compat/apiClient.js";
import { createLookDetailOverlay, injectCardStyles, renderLookCard } from "../src/shared/legacy-compat/renderers.js";
import { getCurrentMember } from "../src/shared/legacy-compat/auth.js";
import { like, markReference, markPurchase, follow as followCreator, unfollow as unfollowCreator } from "../src/shared/legacy-compat/interactions.js";

const GAS_BASE = "https://script.google.com/macros/s/AKfycbw5RiNNZmKaC-NK2cwrTwoFZ9mT6YG42PZ3vJ2XhltnzXBBFO1qZuJ_XAXScbTRUxme/exec";
setBaseUrl(typeof window !== "undefined" && window.OUTFIT_SCRIPT_URL ? window.OUTFIT_SCRIPT_URL : GAS_BASE);

const state = {
  handle: "@demo",
  profile: null,
  looks: [],
  interactions: {},
  detailCache: {},
  page: 0,
  pageSize: 12,
  total: 0,
  hasMore: false,
  loadingProfile: false,
  loadingLooks: false,
  isFollowing: false,
};

const ui = {
  root: null,
  hero: null,
  grid: null,
  loadMore: null,
  modal: null,
  cards: new Map(),
};

function ensureStyles() {
  if (document.head.querySelector("style[data-outfit-profile]")) {
    return;
  }

  const style = document.createElement("style");
  style.dataset.outfitProfile = "";
  style.textContent = `
    .op-root { font-family: 'Noto Sans TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #2c3e50; }
    .op-hero { display: grid; grid-template-columns: auto 1fr; gap: 20px; align-items: center; padding: 24px 0 12px; border-bottom: 1px solid #ecf0f1; }
    .op-hero__avatar { width: 104px; height: 104px; border-radius: 50%; background: #f0f3f5; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 2.4rem; color: #95a5a6; }
    .op-hero__avatar img { width: 100%; height: 100%; object-fit: cover; }
    .op-hero__meta h1 { margin: 0 0 10px; font-size: 1.8rem; display: flex; flex-wrap: wrap; gap: 12px; align-items: baseline; }
    .op-hero__meta h1 small { font-size: 1rem; font-weight: 500; color: #95a5a6; }
    .op-hero__stats { display: flex; gap: 18px; font-size: 0.95rem; color: #7f8c8d; margin-bottom: 8px; }
    .op-hero__sizes { font-size: 0.9rem; color: #7f8c8d; }
    .op-cta { display: flex; gap: 12px; margin-top: 14px; }
    .op-btn { border: none; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; padding: 10px 20px; border-radius: 999px; font-size: 0.95rem; cursor: pointer; transition: transform 120ms ease, box-shadow 120ms ease; }
    .op-btn:active { transform: scale(0.97); }
    .op-btn--ghost { background: #f0f3f5; color: #2c3e50; }
    .op-section-title { margin: 24px 0 16px; font-size: 1.3rem; }
    .op-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
    .op-grid--empty { border: 1px dashed #dfe6e9; border-radius: 16px; padding: 48px 24px; text-align: center; color: #95a5a6; font-size: 0.95rem; }
    .op-loading { padding: 40px 24px; text-align: center; color: #7f8c8d; }
    .op-error { padding: 24px; border-radius: 12px; background: #fdecea; color: #c0392b; }
    .op-section__footer { display: flex; justify-content: center; margin: 20px 0 40px; }
    .op-load-more { border: 1px solid #dce3f0; background: #f5f7fa; color: #2c3e50; padding: 10px 20px; border-radius: 999px; font-size: 0.95rem; cursor: pointer; transition: all 120ms ease; }
    .op-load-more:hover { background: #667eea; color: #fff; border-color: #667eea; }
    .op-load-more[disabled] { opacity: 0.6; cursor: not-allowed; }
    .op-hero--skeleton .op-skeleton-block { width: 180px; height: 24px; }
    .op-skeleton-block { background: linear-gradient(110deg, #f5f7fa 8%, #e6ebf2 18%, #f5f7fa 33%); background-size: 200% 100%; animation: opShimmer 1.2s linear infinite; border-radius: 12px; }
    .op-hero--skeleton .op-hero__avatar { background: #f5f7fa; }
    @keyframes opShimmer { 0% { background-position: -120% 0; } 100% { background-position: 120% 0; } }
    @media (max-width: 768px) {
      .op-hero { grid-template-columns: 1fr; text-align: center; }
      .op-hero__avatar { margin: 0 auto; }
      .op-hero__stats { justify-content: center; }
      .op-cta { justify-content: center; flex-wrap: wrap; }
    }
  `;
  document.head.appendChild(style);
  injectCardStyles(document.head);
}

function notify(message) {
  if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
    window.showToast(message);
  } else {
    alert(message);
  }
}

function renderLayout(root) {
  root.innerHTML = `
    <div class="op-root">
      <section class="op-hero op-hero--skeleton" data-role="hero">
        <div class="op-hero__avatar"></div>
        <div class="op-hero__meta">
          <div class="op-skeleton-block" style="width: 220px; height: 24px;"></div>
          <div class="op-skeleton-block" style="width: 160px; height: 16px;"></div>
          <div class="op-skeleton-block" style="width: 200px; height: 14px;"></div>
        </div>
      </section>
      <div class="op-section">
        <h2 class="op-section-title">作品</h2>
        <section class="op-grid" data-role="look-grid"></section>
        <div class="op-section__footer">
          <button type="button" class="op-load-more" data-role="load-more" hidden>載入更多</button>
        </div>
      </div>
    </div>
  `;

  ui.hero = root.querySelector('[data-role="hero"]');
  ui.grid = root.querySelector('[data-role="look-grid"]');
  ui.loadMore = root.querySelector('[data-role="load-more"]');

  ui.loadMore.addEventListener('click', () => {
    if (state.loadingLooks || !state.hasMore) return;
    loadLooks(state.page + 1, { append: true });
  });
}

function renderHeroLoading() {
  ui.hero?.classList.add('op-hero--skeleton');
}

function renderHero(profile) {
  if (!ui.hero) return;
  const member = getCurrentMember();
  const avatar = profile.avatar_url || '';
  const display = profile.display_name || profile.handle || 'Creator';
  const sizes = formatSizeCard(profile.size_card);
  const followers = profile.stats?.followers ?? 0;
  const looks = profile.stats?.looks ?? state.looks.length;

  ui.hero.classList.remove('op-hero--skeleton');
  ui.hero.innerHTML = `
    <div class="op-hero__avatar">
      ${avatar ? `<img src="${avatar}" alt="${display}">` : (display.charAt(0) || '👤')}
    </div>
    <div class="op-hero__meta">
      <h1>${display} <small>${profile.handle || ''}</small></h1>
      <div class="op-hero__stats">
        <span>追蹤 ${followers}</span>
        <span>穿搭 ${looks}</span>
      </div>
      <div class="op-hero__sizes">${sizes}</div>
      <div class="op-cta">
        <button type="button" class="op-btn" data-action="follow">${state.isFollowing ? '已追蹤' : member.verified ? '追蹤創作者' : '登入後追蹤'}</button>
        <button type="button" class="op-btn op-btn--ghost" data-action="share">分享</button>
      </div>
    </div>
  `;

  const followBtn = ui.hero.querySelector('[data-action="follow"]');
  const shareBtn = ui.hero.querySelector('[data-action="share"]');

  followBtn?.addEventListener('click', handleFollowToggle);
  shareBtn?.addEventListener('click', handleShare);
}

function formatSizeCard(sizeCard = {}) {
  const height = sizeCard.height_cm ? `${sizeCard.height_cm}cm` : '-';
  const weight = sizeCard.weight_kg ? `${sizeCard.weight_kg}kg` : null;
  const top = sizeCard.top || '-';
  const bottom = sizeCard.bottom || '-';
  const shoe = sizeCard.shoe_size_jp ? `${sizeCard.shoe_size_jp} JP` : null;

  const parts = [`身高 ${height}`, `上衣 ${top}`, `下身 ${bottom}`];
  if (weight) parts.splice(1, 0, `體重 ${weight}`);
  if (shoe) parts.push(`鞋 ${shoe}`);
  return parts.join(' ｜ ');
}

function createSkeletonCards(count) {
  return Array.from({ length: count }).map(() => {
    const el = document.createElement('article');
    el.className = 'op-card op-card--skeleton';
    el.innerHTML = `
      <div class="op-card__media op-skeleton-block"></div>
      <div class="op-card__body">
        <div class="op-skeleton-block" style="height:20px;width:70%;"></div>
        <div class="op-skeleton-block" style="height:16px;width:60%;"></div>
        <div class="op-skeleton-block" style="height:14px;width:50%;"></div>
      </div>
      <div class="op-card__actions">
        <div class="op-skeleton-block"></div>
        <div class="op-skeleton-block"></div>
        <div class="op-skeleton-block"></div>
      </div>
    `;
    return el;
  });
}

function renderLooks() {
  if (!ui.grid) return;

  ui.cards.clear();
  ui.grid.innerHTML = '';

  if (!state.looks.length && !state.loadingLooks) {
    const empty = document.createElement('div');
    empty.className = 'op-grid--empty';
    empty.innerHTML = '目前尚無作品，歡迎稍後再回來看看。';
    ui.grid.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  state.looks.forEach((look) => {
    const interactions = state.interactions[look.look_id];
    const card = renderLookCard(look, {
      interactionState: interactions,
      onOpen: () => openLookDetail(look.look_id),
      onAction: (type) => handleInteraction(type, look.look_id, 'card'),
    });
    card.updateMetrics(look.metrics || {});
    if (interactions) card.setActiveState(interactions);
    fragment.appendChild(card);
    ui.cards.set(look.look_id, card);
  });

  ui.grid.appendChild(fragment);
}

function updateLoadMoreButton() {
  if (!ui.loadMore) return;
  ui.loadMore.hidden = !state.hasMore;
  ui.loadMore.disabled = state.loadingLooks;
  if (state.hasMore) {
    const loaded = state.looks.length;
    const total = state.total || '？';
    ui.loadMore.textContent = state.loadingLooks ? '載入中…' : `載入更多 (${loaded}/${total})`;
  }
}

async function loadProfile() {
  state.loadingProfile = true;
  renderHeroLoading();

  try {
    const data = await get('', { route: 'profile', handle: state.handle });
    if (!data?.profile) {
      throw new Error('查無此創作者');
    }
    state.profile = data.profile;
    state.isFollowing = Boolean(data.profile?.is_following || data.profile?.following);
    state.total = data.profile?.stats?.looks ?? 0;
    renderHero(state.profile);
  } catch (error) {
    if (ui.hero) {
      ui.hero.innerHTML = `<div class="op-error">讀取創作者資料失敗：${error.message || '未知錯誤'}</div>`;
    }
    throw error;
  } finally {
    state.loadingProfile = false;
  }
}

async function loadLooks(page = 1, { append = false } = {}) {
  if (!state.profile) return;
  if (state.loadingLooks) return;

  state.loadingLooks = true;
  updateLoadMoreButton();

  if (!append && !state.looks.length) {
    createSkeletonCards(Math.min(state.pageSize, 6)).forEach((card) => ui.grid.appendChild(card));
  } else if (append) {
    createSkeletonCards(3).forEach((card) => ui.grid.appendChild(card));
  }

  try {
    const params = {
      route: 'looks',
      profile_id: state.profile.profile_id,
      page,
      page_size: state.pageSize,
    };
    const data = await get('', params);
    const items = Array.isArray(data?.items) ? data.items : [];
    const pagination = data?.pagination || {};

    state.page = page;
    state.total = pagination.total ?? Math.max(state.total, items.length * page);

    if (append) {
      state.looks = state.looks.concat(items);
    } else {
      state.looks = items;
    }

    state.hasMore = Boolean(items.length && state.looks.length < state.total);

    renderLooks();
  } catch (error) {
    notify(`載入穿搭失敗：${error.message || '未知錯誤'}`);
  } finally {
    state.loadingLooks = false;
    updateLoadMoreButton();
  }
}

function getLookById(lookId) {
  return state.looks.find((item) => item.look_id === lookId) || state.detailCache[lookId] || null;
}

function mergeLook(detail) {
  if (!detail?.look_id) return;
  const index = state.looks.findIndex((item) => item.look_id === detail.look_id);
  if (index >= 0) {
    state.looks[index] = { ...state.looks[index], ...detail };
  }
  state.detailCache[detail.look_id] = { ...state.detailCache[detail.look_id], ...detail };
}

function syncLookUI(lookId) {
  const look = getLookById(lookId);
  const card = ui.cards.get(lookId);
  const interactions = state.interactions[lookId];
  if (card && look) {
    card.updateMetrics(look.metrics || {});
    card.setActiveState(interactions);
  }
  if (ui.modal && ui.modal.lookId === lookId && typeof ui.modal.element.update === 'function') {
    ui.modal.element.update(look, interactions);
  }
}

async function handleInteraction(action, lookId, source = 'card') {
  const look = getLookById(lookId);
  if (!look) return;

  state.interactions[lookId] = state.interactions[lookId] || {};
  if (state.interactions[lookId][action]) {
    notify('您已經標記過這個動作囉！');
    return;
  }

  const card = ui.cards.get(lookId);
  if (card) card.setBusy(true);
  if (ui.modal && ui.modal.lookId === lookId) ui.modal.element.setBusy(true);

  try {
    if (action === 'like') {
      await like(lookId);
      look.metrics = look.metrics || {};
      look.metrics.likes = (look.metrics.likes || 0) + 1;
    } else if (action === 'reference') {
      await markReference(lookId);
      look.metrics = look.metrics || {};
      look.metrics.refs = (look.metrics.refs || look.metrics.references || 0) + 1;
    } else if (action === 'purchase') {
      const firstItem = (look.items && look.items[0]) || {};
      await markPurchase(lookId, firstItem.variant_sku || firstItem.sku || null);
      look.metrics = look.metrics || {};
      look.metrics.pm = (look.metrics.pm || look.metrics.purchase_marks || 0) + 1;
    }

    state.interactions[lookId][action] = true;
    syncLookUI(lookId);
    notify('操作成功，感謝互動！');
  } catch (error) {
    notify(`操作失敗：${error.message || '未知錯誤'}`);
  } finally {
    if (card) card.setBusy(false);
    if (ui.modal && ui.modal.lookId === lookId) ui.modal.element.setBusy(false);
  }
}

function handleShare() {
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({ title: document.title, url }).catch(() => {
      navigator.clipboard.writeText(url).then(() => notify('已複製個人頁連結'));
    });
  } else {
    navigator.clipboard.writeText(url).then(() => notify('已複製個人頁連結'));
  }
}

async function handleFollowToggle() {
  const member = getCurrentMember();
  if (!member.verified) {
    notify('請先登入會員以追蹤創作者');
    return;
  }

  if (!state.profile) return;

  const followBtn = ui.hero?.querySelector('[data-action="follow"]');
  const nextState = !state.isFollowing;
  followBtn.disabled = true;

  try {
    if (nextState) {
      await followCreator(state.profile.profile_id);
      notify('已追蹤創作者');
    } else {
      await unfollowCreator(state.profile.profile_id);
      notify('已取消追蹤');
    }
    state.isFollowing = nextState;
    renderHero(state.profile);
  } catch (error) {
    notify(`更新追蹤狀態失敗：${error.message || '未知錯誤'}`);
  } finally {
    followBtn.disabled = false;
  }
}

function closeModal() {
  if (!ui.modal) return;
  document.removeEventListener('keydown', ui.modal.onKeyDown);
  ui.modal.element.destroy?.();
  ui.modal.element.remove?.();
  ui.modal = null;
}

async function openLookDetail(lookId) {
  const baseLook = getLookById(lookId);
  if (!baseLook) return;

  closeModal();

  const overlay = createLookDetailOverlay(baseLook, {
    interactionState: state.interactions[lookId],
    onClose: closeModal,
    onAction: (action) => handleInteraction(action, lookId, 'modal'),
  });

  document.body.appendChild(overlay);
  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  };
  document.addEventListener('keydown', onKeyDown);

  ui.modal = { element: overlay, lookId, onKeyDown };

  if (!state.detailCache[lookId]) {
    overlay.setLoading(true);
    try {
      const detail = await get('', { route: 'look', look_id: lookId });
      if (!detail?.look) {
        overlay.setError('無法取得穿搭詳情');
      } else {
        state.detailCache[lookId] = detail.look;
        mergeLook(detail.look);
        overlay.update(getLookById(lookId), state.interactions[lookId]);
      }
    } catch (error) {
      overlay.setError(`載入詳情失敗：${error.message || '未知錯誤'}`);
    } finally {
      overlay.setLoading(false);
    }
  }
}

function getHandle(root) {
  const datasetHandle = root?.dataset?.handle?.trim();
  if (datasetHandle) return datasetHandle;
  const search = new URLSearchParams(window.location.search);
  return search.get('handle') || '@demo';
}

async function bootstrap() {
  ui.root = document.getElementById('outfit-profile-root');
  if (!ui.root) {
    console.warn('outfit-profile-root not found');
    return;
  }

  ensureStyles();
  state.handle = getHandle(ui.root);
  renderLayout(ui.root);

  try {
    await loadProfile();
    await loadLooks(1, { append: false });
  } catch (error) {
    if (ui.root) {
      ui.root.innerHTML = `<div class="op-error">載入個人頁失敗：${error.message || '未知錯誤'}</div>`;
    }
  }
}

bootstrap();
