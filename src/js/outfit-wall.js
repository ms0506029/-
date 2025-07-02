// outfit-wall.js
// EasyStore 穿搭牆展示模組
// Version: 4.0.0
// Dependencies: outfit-common.js

(function() {
  'use strict';
  
  console.log('🚀 穿搭牆模組 v4.0 載入中...');
  
  // 儲存穿搭資料和當前模態框資料
  let outfitData = [];
  let currentModal = null;
  
  
  // 新增：按鈕點擊反饋函式
  function addRippleEffect(element) {
    element.classList.add('ripple-effect');
    setTimeout(() => {
      element.classList.remove('ripple-effect');
    }, 600);
  }
  
  // 等待 DOM 載入完成
  function initOutfitWall() {
    console.log('📄 初始化穿搭牆...');
    
    // 設定測試 API 按鈕
    const testApiBtn = document.getElementById('testApiBtn');
    if (testApiBtn) {
      testApiBtn.addEventListener('click', function(e) {
        window.addButtonFeedback(this, '正在測試 API 連線...');
        console.log('🧪 測試 API 連線...');
        
        fetch(window.OUTFIT_SCRIPT_URL + '?action=test')
          .then(response => {
            console.log('📡 API 回應狀態:', response.status);
            return response.json();
          })
          .then(result => {
            console.log('✅ API 測試結果:', result);
            window.showToast('✅ API 連線測試成功！');
            alert('API 連線測試結果：\n\n' + JSON.stringify(result, null, 2));
          })
          .catch(error => {
            console.error('❌ API 測試失敗:', error);
            window.showToast('❌ API 連線測試失敗');
            alert('API 連線失敗：' + error.message);
          });
      });
    }
    
    // 設定重新載入按鈕
    const reloadBtn = document.getElementById('reloadBtn');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', function(e) {
        window.addButtonFeedback(this, '正在重新載入...');
        console.log('🔄 手動重新載入穿搭...');
        loadApprovedOutfits();
      });
    }
    
    // 設定除錯按鈕
    const debugBtn = document.getElementById('debugBtn');
    if (debugBtn) {
      debugBtn.addEventListener('click', function(e) {
        window.addButtonFeedback(this);
        const grid = document.getElementById('outfitGrid');
        const info = {
          'API URL': window.OUTFIT_SCRIPT_URL,
          '頁面標題': document.title,
          'outfitGrid 元素': grid ? '✅ 找到' : '❌ 未找到',
          '穿搭資料數量': outfitData.length,
          '當前時間': new Date().toISOString()
        };
        console.log('📊 除錯資訊:', info);
        window.showToast('📊 除錯資訊已輸出到控制台');
        alert('除錯資訊：\n\n' + JSON.stringify(info, null, 2));
      });
    }
    
    // 設定模態框功能
    setupModal();
    
    // 自動載入穿搭
    setTimeout(function() {
      console.log('🚀 自動載入穿搭牆');
      loadApprovedOutfits();
    }, 1000);
  }
  
  // 設定模態框功能
  function setupModal() {
    const modal = document.getElementById('detailModal');
    
    // 點擊背景關閉
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          closeModal();
        }
      });
    }
    
    // ESC 鍵關閉
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
        closeModal();
      }
    });
  }

 // 開啟模態框（升級版）
  function openModal(outfitIndex) {
    const outfit = outfitData[outfitIndex];
    if (!outfit) return;
    
    console.log('📖 開啟穿搭詳情:', outfit);
    currentModal = outfitIndex;
    
    const modal = document.getElementById('detailModal');
    if (!modal) return;
    
    // 填入基本資料
    const modalImage = document.getElementById('modalImage');
    const modalAvatar = document.getElementById('modalAvatar');
    const modalUserName = document.getElementById('modalUserName');
    const modalUserInfo = document.getElementById('modalUserInfo');
    const modalHeight = document.getElementById('modalHeight');
    const modalWeight = document.getElementById('modalWeight');
    const modalWeightRow = document.getElementById('modalWeightRow');
    const modalTopSize = document.getElementById('modalTopSize');
    const modalBottomSize = document.getElementById('modalBottomSize');
    const modalComment = document.getElementById('modalComment');
    
    const imageUrl = outfit['圖片網址'] || 'https://placehold.jp/400x400/f8f9fa/333333?text=穿搭照片';
    const name = outfit['顯示名稱'] || '匿名用戶';
    const height = outfit['身高'] || '';
    const weight = outfit['體重'] || '';
    const topSize = outfit['上衣尺寸'] || '';
    const bottomSize = outfit['下身尺寸'] || '';
    const comment = outfit['穿搭心得'] || '沒有留下穿搭心得';
    const submitTime = outfit['投稿時間'] || '';
    const instagramUrl = outfit['Instagram連結'] || '';
    const avatarUrl = outfit['自訂頭像'] || ''; // 新增：自定義頭像
    
    // 提取 Instagram 用戶名
    let instagramUsername = '';
    if (instagramUrl) {
      const match = instagramUrl.match(/(?:instagram\.com|instagr\.am)\/([^\/\?\#\&]+)/);
      instagramUsername = match ? match[1] : '';
    }
    
    if (modalImage) modalImage.src = imageUrl;
    
    // 設置頭像（支援自定義頭像）
    if (modalAvatar) {
      if (avatarUrl && avatarUrl.startsWith('http')) {
        modalAvatar.style.backgroundImage = 'url(' + avatarUrl + ')';
        modalAvatar.style.backgroundSize = 'cover';
        modalAvatar.style.backgroundPosition = 'center';
        modalAvatar.textContent = '';
        modalAvatar.classList.add('custom-avatar');
      } else {
        modalAvatar.style.backgroundImage = '';
        modalAvatar.textContent = name.charAt(0);
        modalAvatar.classList.remove('custom-avatar');
      }
    }
    
    // 更新用戶名和身高體重（整合顯示）
    if (modalUserName) {
      let userInfoText = name + ' / ' + height + 'cm';
      if (weight) userInfoText += ' / ' + weight + 'kg';
      modalUserName.textContent = userInfoText;
    }

    
    // 更新 Instagram 顯示（分離圖標連結和帳號文字）
if (modalUserInfo) {
  // 優先使用單獨的帳號欄位，如果沒有則從 URL 提取
  let instagramHandle = outfit['Instagram帳號'] || '';
  
  if (!instagramHandle && instagramUrl) {
    const match = instagramUrl.match(/(?:instagram\.com|instagr\.am)\/([^\/\?\#\&]+)/);
    instagramHandle = match ? match[1] : '';
  }
  
  if (instagramHandle || instagramUrl) {
    let htmlContent = '<div class="instagram-display">';
    
    // Instagram 圖標（可點擊，連結到 Instagram）
    if (instagramUrl) {
      htmlContent += `
        <a href="${instagramUrl}" target="_blank" class="instagram-icon-link" title="查看 Instagram">
          <svg class="instagram-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        </a>
      `;
    }
    
    // Instagram 帳號（純文字，不可點擊）
    if (instagramHandle) {
      htmlContent += `<span class="instagram-handle-text">@${instagramHandle}</span>`;
    }
    
    htmlContent += '</div>';
    modalUserInfo.innerHTML = htmlContent;
  } else {
    modalUserInfo.textContent = submitTime ? '投稿時間：' + submitTime.split(' ')[0] : '';
  }
}
    
    // 隱藏原本的統計區域（身高體重已整合到用戶名旁）
    const statsElement = document.querySelector('.modal-stats');
    if (statsElement) {
      statsElement.style.display = 'none';
    }
    
    // 保留尺寸資訊（但可以考慮簡化顯示）
    if (modalTopSize) modalTopSize.textContent = topSize || '未填寫';
    if (modalBottomSize) modalBottomSize.textContent = bottomSize || '未填寫';
    
    // 突出顯示留言
    if (modalComment) {
      modalComment.textContent = comment;
      modalComment.parentElement.classList.add('comment-highlight');
    }
    
    // 其他功能保持不變
    displayProductInfo(outfit);
    displayDemandStats(outfit);
    
    // 隱藏原本的 Instagram 社群區塊（已整合到用戶資訊）
    const modalSocial = document.getElementById('modalSocial');
    if (modalSocial) {
      modalSocial.style.display = 'none';
    }
    
    // 重置所有按鈕狀態
    const actionBtns = modal.querySelectorAll('.action-btn');
    actionBtns.forEach(btn => {
      btn.classList.remove('liked', 'referenced', 'purchased');
    });
  
    // 重置計數顯示
    const purchaseCountElement = document.getElementById('modalPurchaseCount');
    if (purchaseCountElement) {
      purchaseCountElement.textContent = '0';
    }
    
    // 顯示模態框
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  
  // 新增：顯示商品資訊
  function displayProductInfo(outfit) {
    const modalProductsList = document.getElementById('modalProductsList');
    if (!modalProductsList) return;
    
    const products = [];
    
    // 檢查各部位商品資訊
    const productTypes = [
      { key: '上衣商品資訊', typeKey: '上衣商品類型', label: '👕 上衣', type: 'top' },
      { key: '下身商品資訊', typeKey: '下身商品類型', label: '👖 下身', type: 'bottom' },
      { key: '外套商品資訊', typeKey: '外套商品類型', label: '🧥 外套', type: 'outer' },
      { key: '鞋子商品資訊', typeKey: '鞋子商品類型', label: '👟 鞋子', type: 'shoes' },
      { key: '配件商品資訊', typeKey: '配件商品類型', label: '👜 配件', type: 'accessory' }
    ];
    
    productTypes.forEach(item => {
      const info = outfit[item.key];
      const type = outfit[item.typeKey];
      
      if (info && info.trim()) {
        products.push({
          label: item.label,
          info: info,
          type: type,
          category: item.type
        });
      }
    });
    
    if (products.length === 0) {
      modalProductsList.innerHTML = '<p style="color: #7f8c8d; text-align: center;">投稿者未提供商品資訊</p>';
      return;
    }
    
    let html = '';
    products.forEach(product => {
      html += '<div class="product-item">';
      html += '<span class="product-label">' + product.label + '</span>';
      html += '<div class="product-info">';
      
      if (product.type === 'url' && product.info.startsWith('http')) {
        html += '<a href="' + product.info + '" target="_blank" class="product-link">查看商品</a>';
      } else {
        html += '<span style="color: #555; font-size: 0.9rem;">' + product.info + '</span>';
      }
      
      html += '</div>';
      html += '<button class="product-want-btn" onclick="recordWantItem(\'' + outfit['投稿ID'] + '\', \'' + product.category + '\', this)">';
      html += '我也想要';
      html += '</button>';
      html += '</div>';
    });
    
    modalProductsList.innerHTML = html;
  }
  
  // 新增：顯示需求統計
  function displayDemandStats(outfit) {
    const modalDemandStats = document.getElementById('modalDemandStats');
    if (!modalDemandStats) return;
    
    const demandData = [
      { label: '👕 上衣', count: outfit['上衣需求統計'] || 0 },
      { label: '👖 下身', count: outfit['下身需求統計'] || 0 },
      { label: '🧥 外套', count: outfit['外套需求統計'] || 0 },
      { label: '👟 鞋子', count: outfit['鞋子需求統計'] || 0 },
      { label: '👜 配件', count: outfit['配件需求統計'] || 0 }
    ];
    
    const hasAnyDemand = demandData.some(item => item.count > 0);
    
    if (!hasAnyDemand) {
      modalDemandStats.innerHTML = '<p style="color: #7f8c8d; text-align: center;">暫無需求統計</p>';
      return;
    }
    
    let html = '';
    demandData.forEach(item => {
      if (item.count > 0) {
        html += '<div class="demand-item">';
        html += '<span>' + item.label + '</span>';
        html += '<span class="demand-count">' + item.count + ' 人想要</span>';
        html += '</div>';
      }
    });
    
    modalDemandStats.innerHTML = html;
  }
  
  // 新增：記錄商品需求
  window.recordWantItem = function(submissionId, itemType, buttonElement) {
    window.addButtonFeedback(buttonElement, '正在記錄您的需求...');
    
    fetch(window.OUTFIT_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'recordItemWant',
        submissionId: submissionId,
        itemType: itemType
      })
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        buttonElement.textContent = '已記錄 ✓';
        buttonElement.classList.add('clicked');
        buttonElement.disabled = true;
        window.showToast('✅ 已記錄您的需求！');
        
        // 更新需求統計顯示
        setTimeout(() => {
          const outfit = outfitData[currentModal];
          if (outfit) {
            // 更新本地資料
            const statsKey = itemType + '需求統計';
            outfit[statsKey] = result.newCount || (outfit[statsKey] || 0) + 1;
            displayDemandStats(outfit);
          }
        }, 500);
      } else {
        window.showToast('❌ 記錄失敗，請稍後再試');
        console.error('記錄需求失敗:', result.error);
      }
    })
    .catch(error => {
      window.showToast('❌ 網路錯誤，請稍後再試');
      console.error('記錄需求錯誤:', error);
    });
  };
  
  // 關閉模態框
  function closeModal() {
    const modal = document.getElementById('detailModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
      currentModal = null;
    }
  }
  
  // 互動功能（升級版帶反饋）
  function likeOutfit(index) {
    const countElement = document.getElementById('modalLoveCount');
    const buttonElement = event.target.closest('.action-btn');

    if (countElement && buttonElement) {
      window.addButtonFeedback(buttonElement);
      
      let currentCount = parseInt(countElement.textContent) || 0;

      if (buttonElement.classList.contains('liked')) {
        currentCount = Math.max(0, currentCount - 1);
        countElement.textContent = currentCount;
        buttonElement.classList.remove('liked');
        window.showToast('💔 已取消按讚');
      } else {
        currentCount += 1;
        countElement.textContent = currentCount;
        buttonElement.classList.add('liked');
        window.showToast('❤️ 已按讚！');
      }
    }
  }

  function referenceOutfit(index) {
    const countElement = document.getElementById('modalRefCount');
    const buttonElement = event.target.closest('.action-btn');

    if (countElement && buttonElement) {
      window.addButtonFeedback(buttonElement);
      
      let currentCount = parseInt(countElement.textContent) || 0;

      if (buttonElement.classList.contains('referenced')) {
        currentCount = Math.max(0, currentCount - 1);
        countElement.textContent = currentCount;
        buttonElement.classList.remove('referenced');
        window.showToast('💡 已取消參考標記');
      } else {
        currentCount += 1;
        countElement.textContent = currentCount;
        buttonElement.classList.add('referenced');
        window.showToast('💡 標記為很有參考價值！');
      }
    }
  }

  function purchaseOutfit(index) {
    const countElement = document.getElementById('modalPurchaseCount');
    const buttonElement = event.target.closest('.action-btn');

    if (countElement && buttonElement) {
      window.addButtonFeedback(buttonElement);
      
      let currentCount = parseInt(countElement.textContent) || 0;

      if (buttonElement.classList.contains('purchased')) {
        currentCount = Math.max(0, currentCount - 1);
        countElement.textContent = currentCount;
        buttonElement.classList.remove('purchased');
        window.showToast('🛒 已取消購買標記');
      } else {
        currentCount += 1;
        countElement.textContent = currentCount;
        buttonElement.classList.add('purchased');
        window.showToast('🛒 已標記購買同款！');
      }
    }
  }

 // 載入已通過審核的穿搭
  function loadApprovedOutfits() {
    const grid = document.getElementById('outfitGrid');
    if (!grid) {
      console.error('❌ 找不到 outfitGrid 元素');
      return;
    }
    
    console.log('🔄 開始載入穿搭資料...');
    
    // 顯示載入狀態
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #7f8c8d;"><div style="font-size: 1.2rem; margin-bottom: 10px;">🔄 載入穿搭資料中...</div><div style="font-size: 0.9rem;">正在從資料庫取得最新穿搭分享</div></div>';
    
    fetch(window.OUTFIT_SCRIPT_URL + '?action=getApprovedOutfits')
      .then(response => {
        console.log('📡 API 回應狀態:', response.status);
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json();
      })
      .then(result => {
        console.log('📊 API 回應資料:', result);
        
        if (result.success) {
          if (result.data && result.data.length > 0) {
            console.log('✅ 找到 ' + result.data.length + ' 個已通過的穿搭');
            outfitData = result.data;
            
            displayOutfits(result.data);
          } else {
            console.log('ℹ️ 沒有找到已通過的穿搭');
            outfitData = [];
            showNoOutfits();
          }
        } else {
          console.error('❌ API 回傳錯誤:', result.error);
          showError('API 錯誤：' + (result.error || '未知錯誤'));
        }
      })
      .catch(error => {
        console.error('❌ 載入穿搭失敗:', error);
        showError('載入失敗：' + error.message);
      });
  }
  
  // 顯示穿搭列表（升級版）
  function displayOutfits(outfits) {
    const grid = document.getElementById('outfitGrid');
    if (!grid) return;
    
    const cards = [];
    
    for (let i = 0; i < outfits.length; i++) {
      const outfit = outfits[i];
      const name = outfit['顯示名稱'] || '匿名用戶';
      const height = outfit['身高'] || '';
      const weight = outfit['體重'] || '';
      const topSize = outfit['上衣尺寸'] || '';
      const bottomSize = outfit['下身尺寸'] || '';
      const comment = outfit['穿搭心得'] || '';
      const imageUrl = outfit['圖片網址'] || 'https://placehold.jp/300x350/f8f9fa/333333?text=穿搭照片';
      const submitTime = outfit['投稿時間'] || '';
      const status = outfit['審核狀態'] || '';
      const instagramUrl = outfit['Instagram連結'] || '';
      const avatarUrl = outfit['自訂頭像'] || ''; // 確保在這裡宣告
    
      console.log('處理投稿 ' + (i+1) + ':', name, '狀態:', status);
      
      // 確保只顯示已通過的
      if (status !== '已通過') {
        console.log('跳過非已通過投稿:', name, status);
        continue;
      }

  
      
      // 從 Instagram URL 提取用戶名
      let instagramUsername = '';
      if (instagramUrl) {
        // 支援多種 Instagram URL 格式
        const match = instagramUrl.match(/(?:instagram\.com|instagr\.am)\/([^\/\?\#\&]+)/);
        instagramUsername = match ? match[1] : '';
      }
      
      let card = '<div class="outfit-card" onclick="openModal(' + i + ')" style="cursor: pointer;">';
      card += '<img src="' + imageUrl + '" alt="' + name + ' 的穿搭" class="outfit-image" onerror="this.src=\'https://placehold.jp/300x350/f8f9fa/333333?text=圖片載入失敗\'">';
      card += '<div class="outfit-info">';
      
      // 新的用戶資訊佈局
      card += '<div class="user-info-compact">';
      
    
      // 加入除錯
      console.log('卡片 ' + i + ' 頭像URL:', avatarUrl);
      if (avatarUrl && avatarUrl.startsWith('http')) {
        // 自訂頭像 - 加入 width 和 height
        card += '<div class="user-avatar custom-avatar" style="width: 40px; height: 40px; background-image: url(\'' + avatarUrl + '\'); background-size: cover; background-position: center;"></div>';
      } else {
        // 預設頭像 - 也加入 width 和 height 確保一致性
        card += '<div class="user-avatar" style="width: 40px; height: 40px;">' + name.charAt(0) + '</div>';
      }
      
      card += '<div class="user-details-compact">';
      // 身高體重整合在名字旁
      card += '<h3>' + name + ' / ' + height + 'cm';
      if (weight) card += ' / ' + weight + 'kg';
      card += '</h3>';
      
      // Instagram 顯示在名字下方（如果有）
      if (instagramUsername) {
        card += '<p class="instagram-handle">@' + instagramUsername + '</p>';
      }
      card += '</div></div>';
      
      // 簡化的留言預覽
      if (comment) {
        const shortComment = comment.length > 60 ? comment.substring(0, 60) + '...' : comment;
        card += '<div class="outfit-comment-preview">' + shortComment + '</div>';
      }
      
      // 商品資訊預覽標誌
      const hasProducts = outfit['上衣商品資訊'] || outfit['下身商品資訊'] || outfit['外套商品資訊'] || outfit['鞋子商品資訊'] || outfit['配件商品資訊'];
      if (hasProducts) {
        card += '<div class="product-badge">🛍️ 含商品資訊</div>';
      }
      
      card += '</div></div>';
      
      cards.push(card);
    }
    
    if (cards.length > 0) {
      grid.innerHTML = cards.join('');
      console.log('✅ 成功顯示 ' + cards.length + ' 個穿搭卡片');
    } else {
      console.log('ℹ️ 沒有可顯示的穿搭');
      showNoOutfits();
    }
  }
  
  // 顯示無穿搭狀態
  function showNoOutfits() {
    const grid = document.getElementById('outfitGrid');
    if (!grid) return;
    
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 80px 20px; color: #7f8c8d;"><h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 1.5rem;">🌟 還沒有穿搭分享</h3><p style="font-size: 1.1rem; margin-bottom: 25px;">成為第一個分享穿搭的人吧！</p><a href="/pages/穿搭投稿" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none; font-weight: 600; display: inline-block;">立即分享穿搭</a></div>';
  }
  
  // 顯示錯誤狀態
  function showError(message) {
    const grid = document.getElementById('outfitGrid');
    if (!grid) return;
    
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #e74c3c;"><h3>❌ 載入失敗</h3><p>' + message + '</p><button onclick="location.reload()" style="background: #667eea; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer;">重新載入頁面</button></div>';
  }
  
  // 設定全域函數
  window.loadApprovedOutfits = loadApprovedOutfits;
  window.displayOutfits = displayOutfits;
  window.showNoOutfits = showNoOutfits;
  window.showError = showError;
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.likeOutfit = likeOutfit;
  window.referenceOutfit = referenceOutfit;
  window.purchaseOutfit = purchaseOutfit;
  window.currentModal = currentModal;
  
  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOutfitWall);
  } else {
    initOutfitWall();
  }

})();
