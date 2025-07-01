// outfit-common.js
// EasyStore 穿搭牆系統 - 共用功能模組
// Version: 4.0.0
// Updated: 2024-01-15

window.OutfitSystem = window.OutfitSystem || {};

// API URL 配置
window.OUTFIT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw5RiNNZmKaC-NK2cwrTwoFZ9mT6YG42PZ3vJ2XhltnzXBBFO1qZuJ_XAXScbTRUxme/exec';

// 共用的 Toast 功能
window.showToast = function(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    z-index: 10000;
    font-size: 0.9rem;
    opacity: 0;
    transform: translateY(-20px);
    transition: all 0.3s ease;
    max-width: 300px;
    word-wrap: break-word;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 100);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
};

// 共用的按鈕反饋
window.addButtonFeedback = function(element, message) {
  element.style.transform = 'scale(0.95)';
  element.style.opacity = '0.8';
  
  setTimeout(() => {
    element.style.transform = 'scale(1)';
    element.style.opacity = '1';
  }, 150);
  
  if (message) {
    window.showToast(message);
  }
};

// 共用的按鈕點擊反饋動畫
window.addRippleEffect = function(element) {
  element.classList.add('ripple-effect');
  setTimeout(() => {
    element.classList.remove('ripple-effect');
  }, 600);
};

// 共用的載入狀態管理
window.OutfitSystem.loading = {
  show: function(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #7f8c8d;">
          <div style="font-size: 1.2rem; margin-bottom: 10px;">🔄 ${message || '載入中...'}</div>
          <div style="font-size: 0.9rem;">請稍候片刻</div>
        </div>
      `;
    }
  },
  
  hide: function(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = '';
    }
  }
};

// 共用的錯誤處理
window.OutfitSystem.error = {
  show: function(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #e74c3c;">
          <h3>❌ 發生錯誤</h3>
          <p>${message}</p>
          <button onclick="location.reload()" style="
            background: #667eea; 
            color: white; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 6px; 
            cursor: pointer;
            margin-top: 10px;
          ">重新載入頁面</button>
        </div>
      `;
    }
  }
};

// 共用的日期格式化
window.OutfitSystem.formatDate = function(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW');
  } catch (e) {
    return dateString;
  }
};

// 共用的圖片錯誤處理
window.OutfitSystem.handleImageError = function(img, placeholderText) {
  img.onerror = function() {
    this.src = 'https://placehold.jp/300x400/f8f9fa/333333?text=' + encodeURIComponent(placeholderText || '圖片載入失敗');
  };
};

// 除錯模式
window.OUTFIT_DEBUG = true; // 生產環境改為 false

window.OutfitSystem.debug = function(message, data) {
  if (window.OUTFIT_DEBUG) {
    console.log(`[Outfit System] ${message}`, data || '');
  }
};

// 版本資訊
window.OutfitSystem.version = '4.0.0';
console.log(`🚀 EasyStore Outfit System Common Module v${window.OutfitSystem.version} 載入完成`);
