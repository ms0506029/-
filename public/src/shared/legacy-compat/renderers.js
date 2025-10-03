// src/shared/legacy-compat/renderers.js
// 提供可重用的卡片與詳情模態組件，維持與舊版穿搭牆一致的視覺語彙。
const DEFAULT_PLACEHOLDER = "https://placehold.co/600x800?text=Outfit";

function createElement(html) {
  const container = document.createElement("div");
  container.innerHTML = html.trim();
  return container.firstElementChild;
}

function formatSizeSummary(look) {
  return look.size_summary || look.sizeCard || "";
}

function ensureArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value) return [value];
  return [];
}

function resolveImages(look) {
  const images = ensureArray(look.images);
  if (images.length) return images;
  if (look.cover) return [look.cover];
  return [DEFAULT_PLACEHOLDER];
}

function assignMetrics(card, metrics = {}) {
  const likes = metrics.likes ?? 0;
  const refs = metrics.refs ?? metrics.references ?? 0;
  const purchases = metrics.pm ?? metrics.purchase_marks ?? 0;

  const likeEl = card.querySelector('[data-count="likes"]');
  const refEl = card.querySelector('[data-count="refs"]');
  const purchaseEl = card.querySelector('[data-count="purchase"]');

  if (likeEl) likeEl.textContent = likes;
  if (refEl) refEl.textContent = refs;
  if (purchaseEl) purchaseEl.textContent = purchases;
}

function toggleActionStates(target, state = {}) {
  const actions = target.querySelectorAll('[data-action]');
  actions.forEach((btn) => {
    const type = btn.getAttribute('data-action');
    const active = !!state?.[type];
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

export function renderLookCard(look, options = {}) {
  const { onOpen, onAction, interactionState } = options;
  const title = look.title || look.display_name || 'Look';
  const summary = formatSizeSummary(look);
  const cover = resolveImages(look)[0];

  const card = createElement(`
    <article class="op-card" data-look-id="${look.look_id || ''}">
      <button type="button" class="op-card__media" data-role="open-detail" aria-label="檢視穿搭詳情">
        <img src="${cover}" alt="${title}" loading="lazy" />
      </button>
      <div class="op-card__body">
        <h3 class="op-card__title">${title}</h3>
        <p class="op-card__size">${summary}</p>
        <div class="op-card__metrics">
          <span>❤️ <strong data-count="likes">0</strong></span>
          <span>👀 <strong data-count="refs">0</strong></span>
          <span>🛍️ <strong data-count="purchase">0</strong></span>
        </div>
      </div>
      <div class="op-card__actions" role="group" aria-label="互動動作">
        <button type="button" data-action="like">喜歡</button>
        <button type="button" data-action="reference">參考</button>
        <button type="button" data-action="purchase">同款</button>
      </div>
    </article>
  `);

  assignMetrics(card, look.metrics);
  toggleActionStates(card, interactionState);

  const detailTrigger = card.querySelector('[data-role="open-detail"]');
  if (typeof onOpen === 'function') {
    detailTrigger.addEventListener('click', (event) => {
      event.preventDefault();
      onOpen(look);
    });
  }

  if (typeof onAction === 'function') {
    card.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const type = button.getAttribute('data-action');
        onAction(type, look, card, button);
      });
    });
  }

  card.updateMetrics = (metrics) => assignMetrics(card, metrics);
  card.setActiveState = (state) => toggleActionStates(card, state);
  card.setBusy = (busy) => {
    card.classList.toggle('is-busy', !!busy);
    card.querySelectorAll('button').forEach((btn) => {
      btn.disabled = !!busy;
    });
  };

  return card;
}

export function createLookDetailOverlay(look, options = {}) {
  const { onClose, onAction, interactionState } = options;
  const overlay = createElement(`
    <div class="op-modal" role="dialog" aria-modal="true" data-role="modal">
      <div class="op-modal__backdrop" data-role="close"></div>
      <div class="op-modal__panel">
        <button type="button" class="op-modal__close" data-role="close" aria-label="關閉">×</button>
        <div class="op-modal__gallery" data-role="gallery"></div>
        <div class="op-modal__content">
          <h2 class="op-modal__title" data-role="title">穿搭詳情</h2>
          <p class="op-modal__size" data-role="size"></p>
          <div class="op-modal__metrics">
            <span>❤️ <strong data-count="likes">0</strong></span>
            <span>👀 <strong data-count="refs">0</strong></span>
            <span>🛍️ <strong data-count="purchase">0</strong></span>
          </div>
          <p class="op-modal__desc" data-role="desc"></p>
          <div class="op-modal__items" data-role="items"></div>
          <div class="op-modal__actions" role="group" aria-label="互動動作">
            <button type="button" data-action="like">喜歡</button>
            <button type="button" data-action="reference">參考</button>
            <button type="button" data-action="purchase">同款</button>
          </div>
          <div class="op-modal__footer" data-role="footer"></div>
        </div>
      </div>
      <div class="op-modal__loading" data-role="loading">載入中…</div>
      <div class="op-modal__error" data-role="error" hidden></div>
    </div>
  `);

  const gallery = overlay.querySelector('[data-role="gallery"]');
  const titleEl = overlay.querySelector('[data-role="title"]');
  const sizeEl = overlay.querySelector('[data-role="size"]');
  const descEl = overlay.querySelector('[data-role="desc"]');
  const itemsEl = overlay.querySelector('[data-role="items"]');
  const footerEl = overlay.querySelector('[data-role="footer"]');
  const loadingEl = overlay.querySelector('[data-role="loading"]');
  const errorEl = overlay.querySelector('[data-role="error"]');

  const actionButtons = overlay.querySelectorAll('[data-action]');
  const closeTriggers = overlay.querySelectorAll('[data-role="close"]');

  closeTriggers.forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      if (typeof onClose === 'function') {
        onClose();
      }
    });
  });

  if (typeof onAction === 'function') {
    actionButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        const type = button.getAttribute('data-action');
        onAction(type, look, overlay, button);
      });
    });
  }

  overlay.setBusy = (busy) => {
    overlay.classList.toggle('is-busy', !!busy);
    actionButtons.forEach((btn) => {
      btn.disabled = !!busy;
    });
  };

  overlay.setLoading = (value) => {
    loadingEl.hidden = !value;
  };

  overlay.setError = (message) => {
    if (!message) {
      errorEl.hidden = true;
      errorEl.textContent = '';
      return;
    }
    errorEl.hidden = false;
    errorEl.textContent = message;
  };

  overlay.update = (nextLook, state = {}) => {
    const current = nextLook || look;
    const title = current.title || current.display_name || 'Look';
    const summary = formatSizeSummary(current);
    const images = resolveImages(current);
    const description = current.desc || current.description || current.comment || '';
    const items = ensureArray(current.items || current.look_items);

    titleEl.textContent = title;
    sizeEl.textContent = summary;
    descEl.textContent = description || '尚未提供穿搭心得。';

    gallery.innerHTML = '';
    images.forEach((src) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = title;
      img.loading = 'lazy';
      gallery.appendChild(img);
    });

    if (items.length) {
      itemsEl.innerHTML = '<h4>🛍️ 商品清單</h4>' + items.map((item) => {
        if (typeof item === 'string') {
          return `<p class="op-modal__item">${item}</p>`;
        }
        const name = item.title || item.name || item.product_name || '商品';
        const link = item.product_url || item.url || item.product_handle;
        const size = item.size || item.variant_sku || '';
        const brand = item.brand || '';
        return `<div class="op-modal__item">
          <div class="op-modal__item-name">${name}</div>
          ${brand ? `<div class="op-modal__item-brand">${brand}</div>` : ''}
          ${size ? `<div class="op-modal__item-size">尺寸：${size}</div>` : ''}
          ${link ? `<a href="${link}" target="_blank" rel="noopener">查看商品</a>` : ''}
        </div>`;
      }).join('');
    } else {
      itemsEl.innerHTML = '';
    }

    footerEl.textContent = current.published_at ? `更新於 ${current.published_at}` : '';

    assignMetrics(overlay, current.metrics || {});
    toggleActionStates(overlay, state || interactionState || {});
  };

  overlay.destroy = () => {
    overlay.remove();
  };

  overlay.update(look, interactionState);
  overlay.setLoading(false);
  overlay.setError('');

  return overlay;
}

export function injectCardStyles(target = document.head) {
  if (!target || target.querySelector('style[data-op-card]') || typeof document === 'undefined') {
    return;
  }

  const style = document.createElement('style');
  style.dataset.opCard = '';
  style.textContent = `
    .op-card { border: 1px solid #ececec; border-radius: 14px; overflow: hidden; background: #fff; display: flex; flex-direction: column; box-shadow: 0 6px 18px -12px rgba(0,0,0,0.25); transition: transform 120ms ease, box-shadow 120ms ease; position: relative; }
    .op-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -16px rgba(0,0,0,0.25); }
    .op-card.is-busy { opacity: 0.65; pointer-events: none; }
    .op-card__media { border: none; padding: 0; background: none; cursor: pointer; }
    .op-card__media img { width: 100%; height: auto; display: block; }
    .op-card__body { padding: 14px 16px 10px; }
    .op-card__title { margin: 0 0 8px; font-size: 1rem; color: #2c3e50; }
    .op-card__size { margin: 0 0 10px; font-size: 0.85rem; color: #7f8c8d; min-height: 18px; }
    .op-card__metrics { display: flex; gap: 12px; font-size: 0.85rem; color: #95a5a6; }
    .op-card__metrics span { display: inline-flex; align-items: center; gap: 4px; }
    .op-card__metrics strong { font-weight: 600; color: #2c3e50; }
    .op-card__actions { display: flex; gap: 8px; padding: 0 16px 16px; }
    .op-card__actions button { flex: 1; border: 1px solid #dfe6e9; border-radius: 999px; background: #f5f7fa; color: #2c3e50; font-size: 0.85rem; padding: 8px 10px; cursor: pointer; transition: all 120ms ease; }
    .op-card__actions button:hover { background: #667eea; border-color: #667eea; color: #fff; }
    .op-card__actions button.is-active { background: linear-gradient(135deg, #667eea, #764ba2); border-color: transparent; color: #fff; }

    .op-modal { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 999; }
    .op-modal__backdrop { position: absolute; inset: 0; background: rgba(20, 24, 35, 0.65); backdrop-filter: blur(2px); }
    .op-modal__panel { position: relative; background: #fff; border-radius: 20px; width: min(980px, 95vw); max-height: 92vh; overflow: hidden auto; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; padding: 28px; box-shadow: 0 20px 60px -28px rgba(0,0,0,0.35); }
    .op-modal__close { position: absolute; top: 14px; right: 16px; width: 36px; height: 36px; border-radius: 50%; border: none; background: #f0f3f5; color: #2c3e50; font-size: 1.4rem; cursor: pointer; }
    .op-modal__gallery { display: grid; gap: 12px; }
    .op-modal__gallery img { width: 100%; border-radius: 14px; object-fit: cover; }
    .op-modal__content { display: flex; flex-direction: column; gap: 12px; }
    .op-modal__title { margin: 0; font-size: 1.4rem; }
    .op-modal__size { margin: 0; font-size: 0.95rem; color: #7f8c8d; }
    .op-modal__metrics { display: flex; gap: 16px; font-size: 0.9rem; color: #95a5a6; }
    .op-modal__metrics strong { color: #2c3e50; }
    .op-modal__desc { font-size: 0.95rem; line-height: 1.6; color: #44515a; white-space: pre-wrap; }
    .op-modal__items { display: grid; gap: 12px; margin-top: 8px; }
    .op-modal__item { border: 1px solid #ecf0f1; border-radius: 12px; padding: 12px; font-size: 0.9rem; color: #2c3e50; display: grid; gap: 4px; }
    .op-modal__item a { color: #667eea; font-weight: 600; text-decoration: none; }
    .op-modal__item a:hover { text-decoration: underline; }
    .op-modal__actions { display: flex; gap: 10px; margin-top: 8px; }
    .op-modal__actions button { flex: 1; border-radius: 999px; border: 1px solid #dce3f0; padding: 10px 14px; background: #f5f7fa; color: #2c3e50; font-size: 0.95rem; cursor: pointer; transition: all 120ms ease; }
    .op-modal__actions button:hover { background: #667eea; border-color: #667eea; color: #fff; }
    .op-modal__actions button.is-active { background: linear-gradient(135deg, #667eea, #764ba2); border-color: transparent; color: #fff; }
    .op-modal__footer { font-size: 0.8rem; color: #95a5a6; margin-top: auto; }
    .op-modal__loading { position: absolute; inset: auto 24px 24px; padding: 10px 14px; border-radius: 999px; background: rgba(255,255,255,0.92); font-size: 0.85rem; color: #2c3e50; box-shadow: 0 12px 24px -18px rgba(0,0,0,0.4); }
    .op-modal__error { position: absolute; inset: auto 24px 24px; padding: 10px 16px; border-radius: 12px; background: #fdecea; color: #c0392b; font-size: 0.85rem; box-shadow: 0 12px 24px -18px rgba(0,0,0,0.35); }
    .op-modal.is-busy .op-modal__actions button { pointer-events: none; opacity: 0.7; }

    @media (max-width: 900px) {
      .op-modal__panel { grid-template-columns: 1fr; max-height: 96vh; }
    }
    @media (max-width: 520px) {
      .op-modal__panel { padding: 20px; }
      .op-modal__actions { flex-direction: column; }
    }

    .op-card--skeleton { border: 1px solid #f0f3f5; background: #fbfcfe; overflow: hidden; border-radius: 14px; }
    .op-card--skeleton .op-skeleton-block { background: linear-gradient(110deg, #f5f7fa 8%, #e6ebf2 18%, #f5f7fa 33%); background-size: 200% 100%; animation: opShimmer 1.2s linear infinite; border-radius: 12px; }
    .op-card--skeleton .op-card__media { height: 260px; }
    .op-card--skeleton .op-card__body { padding: 16px; display: grid; gap: 12px; }
    .op-card--skeleton .op-card__actions { padding: 0 16px 16px; display: grid; gap: 8px; }
    .op-card--skeleton .op-card__actions .op-skeleton-block { height: 32px; border-radius: 999px; }
    @keyframes opShimmer {
      0% { background-position: -120% 0; }
      100% { background-position: 120% 0; }
    }
  `;

  target.appendChild(style);
}
