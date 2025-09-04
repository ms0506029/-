// outfit-wall.js
// EasyStore 穿搭牆展示模組
// Version: 4.0.0
// Dependencies: outfit-common.js

(function() {
  'use strict';
  
  console.log('🚀 穿搭牆模組 v4.0 載入中...');
  
  
  // 儲存穿搭資料和當前模態框資料
  window.outfitData = [];
  window.currentModal = null;
  window.userInteractions = {};
  let isLoadingInteractions = false;
  
  // 確保這兩行在這裡，而不是在函數內部
  let memberVerified = false;
  let memberData = null;
  
  // 並且要設為 window 物件的屬性，讓其他地方可以存取
  window.memberVerified = false;
  window.memberData = null;
  
  
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
          '穿搭資料數量': window.outfitData.length,
          '當前時間': new Date().toISOString()
        };
        console.log('📊 除錯資訊:', info);
        window.showToast('📊 除錯資訊已輸出到控制台');
        alert('除錯資訊：\n\n' + JSON.stringify(info, null, 2));
      });
    }

      // 新增：確保 verifyMemberLogin 函數存在
      if (typeof verifyMemberLogin !== 'function') {
        console.log('⚠️ verifyMemberLogin 函數不存在，重新定義...');
        window.verifyMemberLogin = verifyMemberLogin;
      }
      // 自動驗證會員身份
      verifyMemberLogin();
    
    // 設定模態框功能
    setupModal();
    
    // 自動載入穿搭
    setTimeout(function() {
      console.log('🚀 自動載入穿搭牆');
      loadApprovedOutfits();
    }, 1000);
  }
  
  function loadUserInteractions(memberEmail) {
    console.log('載入用戶互動記錄:', memberEmail);
    isLoadingInteractions = true;
    
    fetch(`${window.OUTFIT_SCRIPT_URL}?action=getUserInteractions&memberEmail=${encodeURIComponent(memberEmail)}`)
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          userInteractions = result.interactions || {};
          console.log('用戶互動記錄:', userInteractions);
          
          // 如果穿搭已經載入，更新按鈕狀態
          if (window.outfitData.length > 0) {
            updateAllInteractionButtons();
          }
        }
      })
      .catch(error => {
        console.error('載入互動記錄失敗:', error);
      })
      .finally(() => {
        isLoadingInteractions = false;
      });
  }

  // 新增：驗證會員登入（強化版）
  async function verifyMemberLogin() {
    try {
      console.log('🔍 開始會員驗證流程...');
      
      // 多重檢查取得 email
      let memberEmail = null;
      
      // 方法1：從 window.customerInfo
      if (window.customerInfo && window.customerInfo.email) {
        memberEmail = window.customerInfo.email;
        console.log('✅ 方法1成功：window.customerInfo.email =', memberEmail);
      }
      // 方法2：從 window.customer  
      else if (window.customer && window.customer.email) {
        memberEmail = window.customer.email;
        console.log('✅ 方法2成功：window.customer.email =', memberEmail);
      }
      // 方法3：從 meta 標籤
      else {
        const metaEmail = document.querySelector('meta[name="customer-email"]');
        if (metaEmail && metaEmail.content) {
          memberEmail = metaEmail.content;
          console.log('✅ 方法3成功：meta標籤 =', memberEmail);
        }
      }
      
      // 方法4：硬編碼測試（臨時）
      if (!memberEmail) {
        memberEmail = "eddc9104@gmail.com"; // 臨時硬編碼
        console.log('⚠️ 使用臨時硬編碼 Email:', memberEmail);
      }
      
      if (!memberEmail) {
        console.log('❌ 無法取得會員Email，設為未登入');
        memberVerified = false;
        window.memberVerified = false;
        return;
      }
      
      console.log('📧 準備驗證會員:', memberEmail);
      
      // 呼叫 Google Apps Script 驗證
      const url = `${window.OUTFIT_SCRIPT_URL}?action=verifyMemberAndGetData&email=${encodeURIComponent(memberEmail)}`;
      console.log('🔗 API URL:', url);
      
      // 改為使用 POST 方式：
      const response = await fetch(window.OUTFIT_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'verifyMemberAndGetData',
          email: memberEmail
        })
      });
      
      const result = await response.json();
      console.log('🔍 驗證結果:', result);
      
      if (result.success && result.isLoggedIn) {
        memberVerified = true;
        memberData = result.memberData;
        
        // 更新全域變數
        window.memberVerified = true;
        window.memberData = result.memberData;
        
        userInteractions = result.interactions || {};
        
        console.log('✅ 會員驗證成功:', memberData.name);
        window.showToast('👋 歡迎回來，' + memberData.name);
        
        // 更新按鈕狀態
        if (window.outfitData && window.outfitData.length > 0) {
          updateAllInteractionButtons();
        }
      } else {
        console.log('❌ 會員驗證失敗:', result.error || '未知錯誤');
        memberVerified = false;
        window.memberVerified = false;
        
        // 特別處理：如果是找不到會員資料，可能是 EasyStore API 問題
        if (result.error && result.error.includes('找不到會員資料')) {
          console.log('⚠️ EasyStore API 找不到會員，可能需要檢查 API 權限或會員狀態');
          window.showToast('⚠️ 會員驗證失敗：' + result.error);
        }
      }
      
    } catch (error) {
      console.error('❌ 會員驗證錯誤:', error);
      memberVerified = false;
      window.memberVerified = false;
    }
  }
  
  // 將函數暴露到全域
  window.verifyMemberLogin = verifyMemberLogin;
  
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
    const outfit = window.outfitData[outfitIndex];
    if (!outfit) return;
    
    console.log('📖 開啟穿搭詳情:', outfit);
    window.currentModal = outfitIndex;
    
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

    // 更新計數顯示
    const modalLoveCount = document.getElementById('modalLoveCount');
    const modalRefCount = document.getElementById('modalRefCount');
    const modalPurchaseCount = document.getElementById('modalPurchaseCount');
    
    if (modalLoveCount) modalLoveCount.textContent = outfit['按讚數'] || 0;
    if (modalRefCount) modalRefCount.textContent = outfit['參考數'] || 0;
    if (modalPurchaseCount) modalPurchaseCount.textContent = outfit['購買數'] || 0;
    
    // 更新按鈕狀態
    const outfitId = outfit['投稿ID'];
    const actionBtns = modal.querySelectorAll('.action-btn');
    
    actionBtns.forEach(btn => {
      const action = btn.getAttribute('data-action');
      if (action === 'like' && userInteractions[outfitId]?.like) {
        btn.classList.add('liked');
      } else if (action === 'reference' && userInteractions[outfitId]?.reference) {
        btn.classList.add('referenced');
      } else if (action === 'purchase' && userInteractions[outfitId]?.purchase) {
        btn.classList.add('purchased');
      }
    });
    
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

    // 更新投票按鈕狀態
    const hasVoted = userInteractions[outfitId]?.vote || false;
    updateModalVoteButton(outfit, hasVoted);
    
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
          const outfit = window.outfitData[window.currentModal];
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
      window.currentModal = null;
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
            window.outfitData = result.data;
            
            displayOutfits(result.data);
          } else {
            console.log('ℹ️ 沒有找到已通過的穿搭');
            window.outfitData = [];
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
  
  
  // 顯示穿搭列表（修正版）
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
      const avatarUrl = outfit['自訂頭像'] || '';
  
      console.log('處理投稿 ' + (i+1) + ':', name, '狀態:', status);
      
      // 確保只顯示已通過的
      if (status !== '已通過') {
        console.log('跳過非已通過投稿:', name, status);
        continue;
      }

      // 讀取實際的計數 - 加強版安全處理
      const loveCount = parseInt(outfit['按讚數']) || 0;
      const refCount = parseInt(outfit['參考數']) || 0;
      const purchaseCount = parseInt(outfit['購買數']) || 0;
      const voteCount = parseInt(outfit['投票數']) || 0;
      
      // 檢查用戶是否已經互動過
      const outfitId = outfit['投稿ID'];
      const hasLiked = userInteractions[outfitId]?.like || false;
      const hasReferenced = userInteractions[outfitId]?.reference || false;
      const hasPurchased = userInteractions[outfitId]?.purchase || false;
      const hasVoted = userInteractions[outfitId]?.vote || false;
      
      // 從 Instagram URL 提取用戶名
      let instagramUsername = '';
      if (instagramUrl) {
        const match = instagramUrl.match(/(?:instagram\.com|instagr\.am)\/([^\/\?\#\&]+)/);
        instagramUsername = match ? match[1] : '';
      }
      
      // 開始建立卡片
      let card = '<div class="outfit-card" onclick="openModal(' + i + ')" style="cursor: pointer;">';
      card += '<img src="' + imageUrl + '" alt="' + name + ' 的穿搭" class="outfit-image" onerror="this.src=\'https://placehold.jp/300x350/f8f9fa/333333?text=圖片載入失敗\'">';
      card += '<div class="outfit-info">';
      
      // 用戶資訊區塊
      card += '<div class="user-info-compact">';
      
      // 頭像
      console.log('卡片 ' + i + ' 頭像URL:', avatarUrl);
      if (avatarUrl && avatarUrl.startsWith('http')) {
        card += '<div class="user-avatar custom-avatar" style="width: 40px; height: 40px; padding: 0; overflow: hidden;">';
        card += '<img src="' + avatarUrl + '" style="width: 100%; height: 100%; object-fit: cover;" alt="頭像">';
        card += '</div>';
      } else {
        card += '<div class="user-avatar" style="width: 40px; height: 40px;">' + name.charAt(0) + '</div>';
      }
      
      // 用戶詳細資訊
      card += '<div class="user-details-compact">';
      card += '<h3><span class="author-name-clickable" onclick="event.stopPropagation(); goToAuthorPage(\'' + 
              name.replace(/'/g, "\\'") + '\', \'' + 
              (outfit['會員Email'] || '').replace(/'/g, "\\'") + '\')" ' +
              'style="cursor: pointer; color: #667eea; text-decoration: underline; font-weight: bold;">' + 
              name + '</span> / ' + height + 'cm';
      if (weight) card += ' / ' + weight + 'kg';
      card += '</h3>';
      
      // Instagram 顯示
      if (instagramUsername) {
        card += '<p class="instagram-handle">@' + instagramUsername + '</p>';
      }
      card += '</div>'; // 關閉 user-details-compact
      
      card += '</div>'; // 關閉 user-info-compact
      
      // 留言預覽
      if (comment) {
        const shortComment = comment.length > 60 ? comment.substring(0, 60) + '...' : comment;
        card += '<div class="outfit-comment-preview">' + shortComment + '</div>';
      }
      
      // 商品資訊標誌
      const hasProducts = outfit['上衣商品資訊'] || outfit['下身商品資訊'] || outfit['外套商品資訊'] || outfit['鞋子商品資訊'] || outfit['配件商品資訊'];
      if (hasProducts) {
        card += '<div class="product-badge">🛍️ 含商品資訊</div>';
      }
      
      // 手機端互動按鈕（包含投票）
      card += '<div class="outfit-actions-mobile">';
      card += `<button class="action-btn-mobile vote-btn-mobile ${hasVoted ? 'voted' : ''}" onclick="handleInteraction(${i}, 'vote', this)" data-outfit-id="${outfitId}" data-interaction-type="vote">`;
      card += '<span>🗳️</span>';
      card += `<span class="count">${voteCount}</span>`;
      card += '<span class="label">投票</span>';
      card += '</button>';
      card += `<button class="action-btn-mobile ${hasLiked ? 'liked' : ''}" onclick="handleInteraction(${i}, 'like', this)" data-outfit-id="${outfitId}" data-interaction-type="like">`;
      card += '<span>❤️</span>';
      card += `<span class="count">${loveCount}</span>`;
      card += '</button>';
      card += `<button class="action-btn-mobile ${hasReferenced ? 'referenced' : ''}" onclick="handleInteraction(${i}, 'reference', this)" data-outfit-id="${outfitId}" data-interaction-type="reference">`;
      card += '<span>💡</span>';
      card += `<span class="count">${refCount}</span>`;
      card += '</button>';
      card += `<button class="action-btn-mobile ${hasPurchased ? 'purchased' : ''}" onclick="handleInteraction(${i}, 'purchase', this)" data-outfit-id="${outfitId}" data-interaction-type="purchase">`;
      card += '<span>🛒</span>';
      card += `<span class="count">${purchaseCount}</span>`;
      card += '</button>';
      card += '</div>';
      
      card += '</div>'; // 關閉 outfit-info
      card += '</div>'; // 關閉 outfit-card
      
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
  
  // 輔助函數：取得互動按鈕的 CSS class
  function getInteractionClass(interactionType) {
    const classMap = {
      'like': 'liked',
      'reference': 'referenced',
      'purchase': 'purchased',
      'vote': 'voted'
    };
    return classMap[interactionType];
  }
  
  // 更新模態框中的計數
  function updateModalCounts(outfit) {
    const modalLoveCount = document.getElementById('modalLoveCount');
    const modalRefCount = document.getElementById('modalRefCount');
    const modalPurchaseCount = document.getElementById('modalPurchaseCount');
    const modalVoteCount = document.getElementById('modalVoteCount');
    
    if (modalLoveCount) modalLoveCount.textContent = outfit['按讚數'] || 0;
    if (modalRefCount) modalRefCount.textContent = outfit['參考數'] || 0;
    if (modalPurchaseCount) modalPurchaseCount.textContent = outfit['購買數'] || 0;
    if (modalVoteCount) modalVoteCount.textContent = outfit['投票數'] || 0;
  }
  
  // 更新 Modal 投票按鈕狀態
  function updateModalVoteButton(outfit, hasVoted) {
    const modalVoteBtn = document.getElementById('modalVoteBtn');
    const modalVoteCount = document.getElementById('modalVoteCount');
    
    if (modalVoteBtn && modalVoteCount) {
      const voteCount = outfit['投票數'] || 0;
      modalVoteCount.textContent = voteCount;
      
      if (hasVoted) {
        modalVoteBtn.classList.add('voted');
        modalVoteBtn.innerHTML = `<span>✅</span><span class="count" id="modalVoteCount">${voteCount}</span>已投票`;
        modalVoteBtn.disabled = true; // 投票後禁用
      } else {
        modalVoteBtn.classList.remove('voted');
        modalVoteBtn.innerHTML = `<span>🗳️</span><span class="count" id="modalVoteCount">${voteCount}</span>投票支持`;
        modalVoteBtn.disabled = false;
      }
    }
  }

  // 更新所有互動按鈕狀態
  function updateAllInteractionButtons() {
    // 更新手機端按鈕
    document.querySelectorAll('.action-btn-mobile').forEach(button => {
      const outfitId = button.getAttribute('data-outfit-id');
      const interactionType = button.getAttribute('data-interaction-type');
      
      if (userInteractions[outfitId] && userInteractions[outfitId][interactionType]) {
        const classMap = {
          'like': 'liked',
          'reference': 'referenced',
          'purchase': 'purchased',
          'vote': 'voted'
        };
        button.classList.add(classMap[interactionType]);
      }
    });
  }
  
  // 設定全域函數
  window.loadApprovedOutfits = loadApprovedOutfits;
  window.displayOutfits = displayOutfits;
  window.showNoOutfits = showNoOutfits;
  window.showError = showError;
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.currentModal = currentModal;
  
  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOutfitWall);
  } else {
    initOutfitWall();
  }

  // ===== 主要互動處理函數 =====
  window.handleInteraction = function(index, interactionType, button) {
    // 檢查登入狀態
    if (!window.memberVerified || !window.memberData) {
      window.showToast('❌ 請先登入會員才能互動');
      setTimeout(() => {
        window.location.href = '/account/login?return_to=' + encodeURIComponent(window.location.href);
      }, 1500);
      return;
    }
    
    const outfit = window.outfitData[index];
    if (!outfit) return;
    
    const submissionId = outfit['投稿ID'];
    const memberEmail = window.memberData.email;
    
    // 特殊處理：為投票按鈕尋找或創建計數元素
    let countSpan = button.querySelector('.count');
    
    if (!countSpan) {
      // 如果是投票按鈕且沒有 .count 元素，嘗試找到或創建
      if (interactionType === 'vote') {
        // 嘗試從 Modal 中找投票計數
        countSpan = document.getElementById('modalVoteCount');
        
        if (!countSpan) {
          // 創建一個計數元素
          countSpan = document.createElement('span');
          countSpan.className = 'count';
          countSpan.id = 'modalVoteCount';
          countSpan.textContent = outfit['投票數'] || 0;
          button.appendChild(countSpan);
          console.log('已為投票按鈕創建計數元素');
        }
      } else {
        console.error('找不到計數元素，interactionType:', interactionType);
        return;
      }
    }

    // 檢查當前狀態
    const hasInteracted = window.userInteractions[submissionId]?.[interactionType] || false;
    
    // 安全的計數取得
    let currentCount = 0;
    if (countSpan) {
      const textContent = countSpan.textContent;
      if (textContent !== null && textContent !== undefined && textContent !== '') {
        currentCount = parseInt(textContent) || 0;
      } else {
        // 如果 textContent 有問題，從原始數據恢復
        const countMap = {
          'like': '按讚數',
          'reference': '參考數',
          'purchase': '購買數',
          'vote': '投票數'
        };
        currentCount = parseInt(outfit[countMap[interactionType]]) || 0;
        countSpan.textContent = currentCount; // 修復 DOM
        console.log(`已修復 ${interactionType} 計數:`, currentCount);
      }
    }
        
    // 投票邏輯：只能投票，不能取消
    if (interactionType === 'vote') {
      if (hasInteracted) {
        window.showToast('ℹ️ 您已經投過票了');
        return;
      }
      
      // 顯示確認框
      if (!confirm(`確定要投票給「${outfit['顯示名稱'] || outfit['會員Email']}」的穿搭嗎？\n投票後無法取消。`)) {
        return;
      }
      
      // 禁用按鈕，防止重複點擊
      button.disabled = true;
      
      // 發送投票請求到後端
      fetch(window.OUTFIT_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'handleInteraction',
          memberEmail: memberEmail,
          submissionId: submissionId,
          interactionType: interactionType
        })
      })
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          // 更新本地狀態
          currentCount = result.newCount;
          if (countSpan) countSpan.textContent = currentCount;
          button.classList.add('voted');
          
          // 更新本地互動記錄
          if (!window.userInteractions[submissionId]) {
            window.userInteractions[submissionId] = {};
          }
          window.userInteractions[submissionId][interactionType] = true;
          
          // 更新 outfitData
          outfit['投票數'] = currentCount;
          
          // 同步更新 Modal（如果開啟中）
          if (window.currentModal === index) {
            updateModalVoteButton(outfit, true);
          }
          
          window.showToast('🗳️ 投票成功！');
        } else {
          window.showToast('❌ 投票失敗：' + (result.error || '未知錯誤'));
        }
      })
      .catch(error => {
        console.error('投票錯誤:', error);
        window.showToast('❌ 網路錯誤，請稍後再試');
      })
      .finally(() => {
        // 重新啟用按鈕
        button.disabled = false;
      });
      
      return;
    }
    
    // 其他互動邏輯：可以切換（取消/新增）
    if (hasInteracted) {
      // 取消互動
      currentCount = Math.max(0, currentCount - 1);
      if (countSpan) countSpan.textContent = currentCount;
      button.classList.remove(getInteractionClass(interactionType));
      window.userInteractions[submissionId][interactionType] = false;
      
      // 顯示取消訊息
      const cancelMessages = {
        'like': '💔 已取消按讚',
        'reference': '📝 已取消參考標記', 
        'purchase': '🛒 已取消購買標記'
      };
      window.showToast(cancelMessages[interactionType]);
      
    } else {
      // 新增互動
      currentCount += 1;
      if (countSpan) countSpan.textContent = currentCount;
      button.classList.add(getInteractionClass(interactionType));
      
      if (!window.userInteractions[submissionId]) {
        window.userInteractions[submissionId] = {};
      }
      window.userInteractions[submissionId][interactionType] = true;
      
      // 顯示成功訊息
      const successMessages = {
        'like': '❤️ 已按讚！',
        'reference': '💡 標記為很有參考價值！',
        'purchase': '🛒 已標記購買同款！'
      };
      window.showToast(successMessages[interactionType]);
    }
    
    // 更新本地資料
    const countMap = {
      'like': '按讚數',
      'reference': '參考數',
      'purchase': '購買數'
    };
    outfit[countMap[interactionType]] = currentCount;
    
    // 同步到後端保存（不再傳送 isToggle，讓後端自動處理切換）
    fetch(window.OUTFIT_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'handleInteraction',
        memberEmail: memberEmail,
        submissionId: submissionId,
        interactionType: interactionType
      })
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        const finalCount = result.newCount;
        if (countSpan) countSpan.textContent = finalCount;
        outfit[countMap[interactionType]] = finalCount;
        
        if (window.currentModal === index) {
          updateModalCounts(outfit);
        }
        
        console.log(`✅ ${interactionType} 互動已同步到後端，最終計數: ${finalCount}`);
      } else {
        console.error('後端同步失敗:', result.error);
        // 不顯示錯誤提示，因為前端已經更新了
      }
    })
    .catch(error => {
      console.error('後端同步錯誤:', error);
      // 不顯示錯誤提示，因為前端已經更新了
    });
    
    // 同步更新 Modal（如果開啟中）
    if (window.currentModal === index) {
      updateModalCounts(outfit);
    }
  };
  // ========== 投票相關函數 ==========

  // 處理 Modal 中的投票
  window.handleModalVote = function() {
    if (window.currentModal !== null && window.outfitData[window.currentModal]) {
      const modalVoteBtn = document.getElementById('modalVoteBtn');
      
      // 使用現有的 handleInteraction 機制
      handleInteraction(window.currentModal, 'vote', modalVoteBtn);
    }
  };

  // ========== 作者個人頁面功能 ==========

  window.goToAuthorPage = function(authorName, authorEmail) {
    const url = `/pages/穿搭作者?author=${encodeURIComponent(authorName)}&email=${encodeURIComponent(authorEmail)}`;
    window.location.href = url;
  };

  // 為將來的作者頁面準備：根據作者過濾投稿
  window.filterOutfitsByAuthor = function(authorEmail) {
    if (!window.outfitData) return [];
    
    return window.outfitData.filter(outfit => {
      return outfit['會員Email'] === authorEmail;
    });
  };

  // 為將來的作者頁面準備：取得作者統計
  window.getAuthorStats = function(authorEmail) {
    const authorOutfits = window.filterOutfitsByAuthor(authorEmail);
    
    if (authorOutfits.length === 0) return null;
    
    const totalVotes = authorOutfits.reduce((sum, outfit) => {
      return sum + (parseInt(outfit['投票數']) || 0);
    }, 0);
    
    const totalLikes = authorOutfits.reduce((sum, outfit) => {
      return sum + (parseInt(outfit['按讚數']) || 0);
    }, 0);
    
    return {
      totalOutfits: authorOutfits.length,
      totalVotes: totalVotes,
      totalLikes: totalLikes,
      authorName: authorOutfits[0]['顯示名稱'],
      latestOutfit: authorOutfits[0]['投稿時間']
    };
  };

})();
