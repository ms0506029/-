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
    
    if (modalImage) modalImage.src = imageUrl;
    if (modalAvatar) modalAvatar.textContent = name.charAt(0);
    if (modalUserName) modalUserName.textContent = name;
    if (modalUserInfo) modalUserInfo.textContent = submitTime ? '投稿時間：' + submitTime.split(' ')[0] : '';
    if (modalHeight) modalHeight.textContent = height + 'cm';
    if (modalWeight) modalWeight.textContent = weight + 'kg';
    if (modalTopSize) modalTopSize.textContent = topSize || '未填寫';
    if (modalBottomSize) modalBottomSize.textContent = bottomSize || '未填寫';
    if (modalComment) modalComment.textContent = comment;
    
    // 如果沒有體重資料，隱藏該行
    if (modalWeightRow) {
      modalWeightRow.style.display = weight ? 'flex' : 'none';
    }
    
    // 新增：顯示商品資訊
    displayProductInfo(outfit);
    
    // 新增：顯示需求統計
    displayDemandStats(outfit);
    
    // 新增：顯示 Instagram 連結
    const modalSocial = document.getElementById('modalSocial');
    const modalInstagramLink = document.getElementById('modalInstagramLink');
    if (instagramUrl && modalSocial && modalInstagramLink) {
      modalInstagramLink.href = instagramUrl;
      modalSocial.style.display = 'block';
    } else if (modalSocial) {
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
      
      console.log('處理投稿 ' + (i+1) + ':', name, '狀態:', status);
      
      // 確保只顯示已通過的
      if (status !== '已通過') {
        console.log('跳過非已通過投稿:', name, status);
        continue;
      }
      
      let card = '<div class="outfit-card" onclick="openModal(' + i + ')" style="cursor: pointer;">';
      card += '<img src="' + imageUrl + '" alt="' + name + ' 的穿搭" class="outfit-image" onerror="this.src=\'https://placehold.jp/300x350/f8f9fa/333333?text=圖片載入失敗\'">';
      card += '<div class="outfit-info">';
      card += '<div class="user-info">';
      card += '<div class="user-avatar">' + name.charAt(0) + '</div>';
      card += '<div class="user-details">';
      card += '<h3>' + name + '</h3>';
      card += '<p>身高: ' + height + 'cm';
      if (weight) card += ' | 體重: ' + weight + 'kg';
      card += '</p></div></div>';
      
      // 尺寸標籤
      if (topSize || bottomSize) {
        card += '<div class="size-info">';
        if (topSize) card += '<span class="size-tag">上衣: ' + topSize + '</span>';
        if (bottomSize) card += '<span class="size-tag">下身: ' + bottomSize + '</span>';
        card += '</div>';
      }
      
      if (comment) {
        const shortComment = comment.length > 50 ? comment.substring(0, 50) + '...' : comment;
        card += '<div class="outfit-comment">' + shortComment + '</div>';
      }
      
      // Instagram 連結
      if (instagramUrl) {
        card += '<div style="margin: 8px 0;">';
        card += '<a href="' + instagramUrl + '" target="_blank" class="instagram-link" onclick="event.stopPropagation();" style="';
        card += 'display: inline-block; background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); ';
        card += 'color: white; padding: 4px 8px; border-radius: 12px; text-decoration: none; font-size: 0.7rem; transition: transform 0.2s;">';
        card += '📷 追蹤投稿者</a>';
        card += '</div>';
      }
      
      // 新增：快速商品預覽
      const hasProducts = outfit['上衣商品資訊'] || outfit['下身商品資訊'] || outfit['外套商品資訊'] || outfit['鞋子商品資訊'] || outfit['配件商品資訊'];
      if (hasProducts) {
        card += '<div style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 6px;">';
        card += '<small style="color: #667eea; font-weight: 600;">🛍️ 有商品資訊</small>';
        card += '</div>';
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
