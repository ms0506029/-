// outfit-wall.js
(function() {
  'use strict';
  
  console.log('🚀 穿搭牆模組 v4.0 載入中...');
  
  // 從您原本的程式碼中提取穿搭牆相關的所有功能
  let outfitData = [];
  let currentModal = null;
  
  // 初始化函數
  function initOutfitWall() {
    console.log('📄 初始化穿搭牆...');
    
    // 設定測試 API 按鈕
    const testApiBtn = document.getElementById('testApiBtn');
    if (testApiBtn) {
      testApiBtn.addEventListener('click', function(e) {
        window.addButtonFeedback(this, '正在測試 API 連線...');
        testAPI();
      });
    }
    
    // 其他初始化邏輯...
    setupModal();
    setTimeout(() => {
      loadApprovedOutfits();
    }, 1000);
  }
  
  // 將所有穿搭牆相關函數移到這裡
  // ... (您的其他函數)
  
  // 自動初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOutfitWall);
  } else {
    initOutfitWall();
  }
  
  // 匯出必要的函數到全域
  window.OutfitWall = {
    loadApprovedOutfits: loadApprovedOutfits,
    openModal: openModal,
    closeModal: closeModal
  };
  
})();
