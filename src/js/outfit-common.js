// outfit-common.js
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
