// outfit-admin.js  
// EasyStore 穿搭牆管理後台模組
// Version: 4.0.0
// Dependencies: outfit-common.js

(function() {
  'use strict';
  
  // 管理後台變數
  window.adminSubmissions = [];
  window.adminFilteredSubmissions = [];
  window.currentAdminUser = null;
  
  // 新增：Toast 訊息功能（如果 common 沒載入）
  if (typeof window.showToast === 'undefined') {
    window.showToast = function(message) {
      alert(message);
    };
  }
  
  // 檢查是否已登入
  function checkAdminLoginStatus() {
    var token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    var loginTime = localStorage.getItem('adminLoginTime') || sessionStorage.getItem('adminLoginTime');
    var username = localStorage.getItem('adminUsername') || sessionStorage.getItem('adminUsername');
    
    if (token && loginTime && username) {
      var currentTime = Date.now();
      var timeDiff = currentTime - parseInt(loginTime);
      var oneHour = 60 * 60 * 1000;
      
      if (timeDiff < oneHour) {
        // 還在有效期內，自動登入
        window.currentAdminUser = username;
        document.getElementById('adminLoginOverlay').style.display = 'none';
        document.getElementById('adminMainContent').style.display = 'block';
        updateAdminWelcome(username);
        adminLoadSubmissions();
        window.showToast('✅ 自動登入成功！歡迎回來 ' + username);
        return true;
      } else {
        // 超過時效，清除儲存
        clearAdminLoginData();
        window.showToast('⏰ 登入已過期，請重新登入');
      }
    }
    return false;
  }

  // 清除登入資料
  function clearAdminLoginData() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminLoginTime');
    localStorage.removeItem('adminUsername');
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminLoginTime');
    sessionStorage.removeItem('adminUsername');
  }

  // 更新歡迎訊息
  function updateAdminWelcome(username) {
    var welcomeElement = document.getElementById('adminWelcome');
    if (welcomeElement) {
      welcomeElement.textContent = '歡迎回來，' + username;
    }
  }

  // 檢查密碼
  window.adminCheckPassword = function() {
    var username = document.getElementById('adminUsernameInput').value.trim();
    var password = document.getElementById('adminPasswordInput').value;
    var rememberMe = document.getElementById('adminRememberMe').checked;
    var errorElement = document.getElementById('adminLoginError');

    if (!username || !password) {
      if (errorElement) {
        errorElement.textContent = '請填寫帳號和密碼';
        errorElement.style.display = 'block';
      }
      window.showToast('❌ 請填寫帳號和密碼');
      return;
    }

    // 添加按鈕反饋
    var loginBtn = event.target;
    loginBtn.disabled = true;
    loginBtn.textContent = '登入中...';
    loginBtn.style.opacity = '0.7';

    adminLogin(username, password, rememberMe);
  };

  // 登入函式
  function adminLogin(username, password, rememberMe) {
    fetch(window.OUTFIT_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'adminLogin',
        username: username,
        password: password
      })
    })
    .then(response => response.json())
    .then(result => {
      resetLoginButton();
      
      if (result.success) {
        var loginToken = result.token || generateToken();
        var loginTime = Date.now();
        window.currentAdminUser = username;

        // 儲存登入狀態
        if (rememberMe) {
          localStorage.setItem('adminToken', loginToken);
          localStorage.setItem('adminLoginTime', loginTime);
          localStorage.setItem('adminUsername', username);
        } else {
          sessionStorage.setItem('adminToken', loginToken);
          sessionStorage.setItem('adminLoginTime', loginTime);
          sessionStorage.setItem('adminUsername', username);
        }

        // 隱藏登入頁面，顯示後台
        document.getElementById('adminLoginOverlay').style.display = 'none';
        document.getElementById('adminMainContent').style.display = 'block';
        updateAdminWelcome(username);
        adminLoadSubmissions();

        // 清除錯誤訊息
        var errorElement = document.getElementById('adminLoginError');
        if (errorElement) errorElement.style.display = 'none';
        
        window.showToast('✅ 登入成功！歡迎 ' + username);
      } else {
        // 登入失敗
        var errorElement = document.getElementById('adminLoginError');
        if (errorElement) {
          errorElement.textContent = result.error || '帳號或密碼錯誤';
          errorElement.style.display = 'block';
        }
        document.getElementById('adminPasswordInput').value = '';
        window.showToast('❌ ' + (result.error || '登入失敗'));
      }
    })
    .catch(error => {
      resetLoginButton();
      console.error('管理員登入失敗:', error);
      var errorElement = document.getElementById('adminLoginError');
      if (errorElement) {
        errorElement.textContent = '網路連線錯誤，請稍後再試';
        errorElement.style.display = 'block';
      }
      window.showToast('❌ 網路連線錯誤');
    });
  }

  // 重置登入按鈕
  function resetLoginButton() {
    var loginBtn = document.querySelector('.login-btn-primary');
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = '登入';
      loginBtn.style.opacity = '1';
    }
  }

  // 生成token
  function generateToken() {
    return 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 新增：管理員登出
  window.adminLogout = function() {
    if (confirm('確定要登出嗎？')) {
      clearAdminLoginData();
      window.currentAdminUser = null;
      location.reload();
    }
  };
  // 載入投稿資料
  window.adminLoadSubmissions = async function() {
    try {
      document.getElementById('adminLoading').style.display = 'block';
      document.getElementById('adminNoData').style.display = 'none';
      
      var response = await fetch(`${window.OUTFIT_SCRIPT_URL}?action=getAllOutfits`);
      var result = await response.json();
      
      console.log('📊 後台載入結果:', result);
      
      if (result.success) {
        window.adminSubmissions = result.data.map(item => ({
          id: item['投稿ID'],
          displayName: item['顯示名稱'],
          memberEmail: item['會員Email'] || '',
          height: item['身高'],
          weight: item['體重'],
          topSize: item['上衣尺寸'],
          bottomSize: item['下身尺寸'],
          comment: item['穿搭心得'],
          imageUrl: item['圖片網址'],
          instagramUrl: item['Instagram連結'] || '',
          submitTime: item['投稿時間'],
          status: item['審核狀態'] === '已通過' ? 'approved' : 
                  item['審核狀態'] === '已拒絕' ? 'rejected' : 'pending',
          // 新增：商品資訊
          topProductInfo: item['上衣商品資訊'] || '',
          topProductType: item['上衣商品類型'] || '',
          bottomProductInfo: item['下身商品資訊'] || '',
          bottomProductType: item['下身商品類型'] || '',
          outerProductInfo: item['外套商品資訊'] || '',
          outerProductType: item['外套商品類型'] || '',
          shoesProductInfo: item['鞋子商品資訊'] || '',
          shoesProductType: item['鞋子商品類型'] || '',
          accessoryProductInfo: item['配件商品資訊'] || '',
          accessoryProductType: item['配件商品類型'] || '',
          // 新增：需求統計
          topDemand: item['上衣需求統計'] || 0,
          bottomDemand: item['下身需求統計'] || 0,
          outerDemand: item['外套需求統計'] || 0,
          shoesDemand: item['鞋子需求統計'] || 0,
          accessoryDemand: item['配件需求統計'] || 0
        }));
        
        console.log('📋 處理後的投稿資料:', window.adminSubmissions);
        
        adminUpdateStats();
        adminApplyFilters();
        window.showToast('✅ 成功載入 ' + window.adminSubmissions.length + ' 筆投稿資料');
      } else {
        adminShowNoData();
        window.showToast('❌ 載入失敗：' + (result.error || '未知錯誤'));
      }
    } catch (error) {
      console.error('載入失敗:', error);
      adminShowNoData();
      window.showToast('❌ 網路錯誤，請稍後再試');
    } finally {
      document.getElementById('adminLoading').style.display = 'none';
    }
  };

  // 更新統計
  window.adminUpdateStats = function() {
    var pending = window.adminSubmissions.filter(item => item.status === 'pending').length;
    var approved = window.adminSubmissions.filter(item => item.status === 'approved').length;
    var rejected = window.adminSubmissions.filter(item => item.status === 'rejected').length;
    var total = window.adminSubmissions.length;
    
    document.getElementById('adminPendingCount').textContent = pending;
    document.getElementById('adminApprovedCount').textContent = approved;
    document.getElementById('adminRejectedCount').textContent = rejected;
    document.getElementById('adminTotalCount').textContent = total;
  };

  // 套用篩選
  window.adminApplyFilters = function() {
    var statusFilter = document.getElementById('adminStatusFilter').value;
    var searchTerm = document.getElementById('adminSearchInput').value.toLowerCase();

    window.adminFilteredSubmissions = window.adminSubmissions.filter(item => {
      var statusMatch = statusFilter === 'all' || item.status === statusFilter;
      var searchMatch = searchTerm === '' || 
                       item.displayName.toLowerCase().includes(searchTerm) ||
                       (item.memberEmail && item.memberEmail.toLowerCase().includes(searchTerm));
      return statusMatch && searchMatch;
    });

    adminRenderSubmissions();
  };

  // 渲染投稿列表（升級版）
  window.adminRenderSubmissions = function() {
    var grid = document.getElementById('adminSubmissionsGrid');
    
    if (window.adminFilteredSubmissions.length === 0) {
      adminShowNoData();
      return;
    }

    document.getElementById('adminNoData').style.display = 'none';
    
    grid.innerHTML = window.adminFilteredSubmissions.map(item => {
      // 生成商品資訊顯示
      var productInfoHtml = generateProductInfoHtml(item);
      var demandStatsHtml = generateDemandStatsHtml(item);
      
      return `
        <div class="admin-card ${item.status}">
          <div style="padding: 15px; display: flex; justify-content: space-between; align-items: center;">
            <span style="
              padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;
              background: ${item.status === 'approved' ? '#d4edda' : item.status === 'rejected' ? '#f8d7da' : '#fff3cd'};
              color: ${item.status === 'approved' ? '#155724' : item.status === 'rejected' ? '#721c24' : '#856404'};
            ">
              ${item.status === 'approved' ? '已通過' : item.status === 'rejected' ? '已拒絕' : '待審核'}
            </span>
            <small style="color: #7f8c8d;">${item.submitTime}</small>
          </div>
          
          <img src="${item.imageUrl}" style="width: 100%; height: 200px; object-fit: cover;" 
               onerror="this.src='https://placehold.jp/300x200/f8f9fa/333333?text=圖片載入失敗'">
          
          <div style="padding: 15px;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <div style="
                width: 30px; height: 30px; border-radius: 50%; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex; align-items: center; justify-content: center;
                color: white; font-weight: bold; margin-right: 10px; font-size: 0.8rem;
              ">${item.displayName.charAt(0)}</div>
              <div>
                <h4 style="color: #2c3e50; margin: 0; font-size: 1rem;">${item.displayName}</h4>
                <p style="color: #7f8c8d; font-size: 0.8rem; margin: 0;">
                  身高: ${item.height}cm ${item.memberEmail ? '| ' + item.memberEmail : ''}
                </p>
              </div>
            </div>
            
            ${item.comment ? `
            <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; margin-bottom: 15px;">
              <div style="color: #555; font-size: 0.85rem; line-height: 1.4;">${item.comment}</div>
            </div>
            ` : ''}
            
            ${item.instagramUrl ? `
            <div style="margin-bottom: 15px;">
              <a href="${item.instagramUrl}" target="_blank" style="
                color: #667eea; text-decoration: none; font-size: 0.8rem;
                display: flex; align-items: center; gap: 5px;
              ">
                📷 Instagram 連結
              </a>
            </div>
            ` : ''}
            
            ${productInfoHtml}
            ${demandStatsHtml}
            
            <div style="display: flex; gap: 8px; margin-top: 15px;">
              ${item.status === 'pending' ? `
                <button onclick="adminApprove('${item.id}')" class="admin-btn admin-btn-approve" style="flex: 1;">通過</button>
                <button onclick="adminReject('${item.id}')" class="admin-btn admin-btn-reject" style="flex: 1;">拒絕</button>
              ` : item.status === 'approved' ? `
                <button onclick="adminReject('${item.id}')" class="admin-btn admin-btn-reject" style="width: 100%;">撤銷通過</button>
              ` : `
                <button onclick="adminApprove('${item.id}')" class="admin-btn admin-btn-approve" style="width: 100%;">重新通過</button>
              `}
            </div>
            
            <div style="display: flex; gap: 8px; margin-top: 8px;">
              <button onclick="adminViewDetail('${item.id}')" class="admin-btn admin-btn-secondary" style="flex: 1;">詳細檢視</button>
              <button onclick="adminEditProduct('${item.id}')" class="admin-btn admin-btn-secondary" style="flex: 1;">編輯商品</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  };

  // 新增：生成商品資訊HTML
  function generateProductInfoHtml(item) {
    var products = [];
    
    if (item.topProductInfo) products.push({ label: '👕 上衣', info: item.topProductInfo, type: item.topProductType });
    if (item.bottomProductInfo) products.push({ label: '👖 下身', info: item.bottomProductInfo, type: item.bottomProductType });
    if (item.outerProductInfo) products.push({ label: '🧥 外套', info: item.outerProductInfo, type: item.outerProductType });
    if (item.shoesProductInfo) products.push({ label: '👟 鞋子', info: item.shoesProductInfo, type: item.shoesProductType });
    if (item.accessoryProductInfo) products.push({ label: '👜 配件', info: item.accessoryProductInfo, type: item.accessoryProductType });
    
    if (products.length === 0) return '';
    
    var html = '<div class="product-info-section"><h6>🛍️ 商品資訊</h6>';
    products.forEach(product => {
      html += '<div class="product-item">';
      html += '<span style="font-weight: 600; font-size: 0.8rem;">' + product.label + '</span>';
      if (product.type === 'url' && product.info.startsWith('http')) {
        html += '<a href="' + product.info + '" target="_blank" style="color: #667eea; font-size: 0.8rem;">查看商品</a>';
      } else {
        html += '<span style="color: #555; font-size: 0.8rem;">' + product.info + '</span>';
      }
      html += '</div>';
    });
    html += '</div>';
    
    return html;
  }

  // 新增：生成需求統計HTML
  function generateDemandStatsHtml(item) {
    var demands = [
      { label: '👕 上衣', count: item.topDemand },
      { label: '👖 下身', count: item.bottomDemand },
      { label: '🧥 外套', count: item.outerDemand },
      { label: '👟 鞋子', count: item.shoesDemand },
      { label: '👜 配件', count: item.accessoryDemand }
    ];
    
    var hasAnyDemand = demands.some(d => d.count > 0);
    if (!hasAnyDemand) return '';
    
    var html = '<div class="demand-stats"><h6>💡 需求統計</h6>';
    demands.forEach(demand => {
      if (demand.count > 0) {
        html += '<div class="demand-item">';
        html += '<span style="font-size: 0.8rem;">' + demand.label + '</span>';
        html += '<span class="demand-count">' + demand.count + '</span>';
        html += '</div>';
      }
    });
    html += '</div>';
    
    return html;
  }

 // 通過投稿
  window.adminApprove = async function(id) {
    var button = event.target;
    button.disabled = true;
    button.textContent = '處理中...';
    
    try {
      await adminUpdateStatus(id, '已通過');
      var item = window.adminSubmissions.find(x => x.id === id);
      if (item) {
        item.status = 'approved';
        adminUpdateStats();
        adminApplyFilters();
        window.showToast('✅ 投稿已通過審核');
      }
    } catch (error) {
      button.disabled = false;
      button.textContent = '通過';
      window.showToast('❌ 操作失敗，請稍後再試');
    }
  };

  // 拒絕投稿
  window.adminReject = async function(id) {
    if (!confirm('確定要拒絕這個投稿嗎？')) return;
    
    var button = event.target;
    button.disabled = true;
    button.textContent = '處理中...';
    
    try {
      await adminUpdateStatus(id, '已拒絕');
      var item = window.adminSubmissions.find(x => x.id === id);
      if (item) {
        item.status = 'rejected';
        adminUpdateStats();
        adminApplyFilters();
        window.showToast('✅ 投稿已拒絕');
      }
    } catch (error) {
      button.disabled = false;
      button.textContent = '拒絕';
      window.showToast('❌ 操作失敗，請稍後再試');
    }
  };

  // 更新狀態
  window.adminUpdateStatus = async function(id, status) {
    var response = await fetch(window.OUTFIT_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'updateStatus',
        submissionId: id,
        status: status
      })
    });
    
    var result = await response.json();
    if (!result.success) {
      throw new Error(result.error);
    }
  };

  // 新增：詳細檢視
  window.adminViewDetail = function(id) {
    var item = window.adminSubmissions.find(x => x.id === id);
    if (!item) return;
    
    var detailHtml = `
      <h3>${item.displayName} 的投稿詳細資訊</h3>
      <p><strong>投稿編號：</strong>${item.id}</p>
      <p><strong>會員信箱：</strong>${item.memberEmail || '未提供'}</p>
      <p><strong>身高：</strong>${item.height}cm</p>
      <p><strong>體重：</strong>${item.weight || '未填寫'}kg</p>
      <p><strong>上衣尺寸：</strong>${item.topSize || '未填寫'}</p>
      <p><strong>下身尺寸：</strong>${item.bottomSize || '未填寫'}</p>
      <p><strong>投稿時間：</strong>${item.submitTime}</p>
      <p><strong>審核狀態：</strong>${item.status === 'approved' ? '已通過' : item.status === 'rejected' ? '已拒絕' : '待審核'}</p>
      ${item.comment ? `<p><strong>穿搭心得：</strong>${item.comment}</p>` : ''}
      ${item.instagramUrl ? `<p><strong>Instagram：</strong><a href="${item.instagramUrl}" target="_blank">${item.instagramUrl}</a></p>` : ''}
    `;
    
    alert(detailHtml.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' '));
  };

  // 新增：編輯商品資訊
  window.adminEditProduct = function(id) {
    var item = window.adminSubmissions.find(x => x.id === id);
    if (!item) return;
    
    var productInfo = prompt('編輯商品資訊（JSON格式）：', JSON.stringify({
      topProductInfo: item.topProductInfo,
      bottomProductInfo: item.bottomProductInfo,
      outerProductInfo: item.outerProductInfo,
      shoesProductInfo: item.shoesProductInfo,
      accessoryProductInfo: item.accessoryProductInfo
    }, null, 2));
    
    if (productInfo) {
      try {
        var parsedInfo = JSON.parse(productInfo);
        // 這裡可以調用API更新商品資訊
        window.showToast('💡 商品資訊編輯功能開發中...');
      } catch (e) {
        window.showToast('❌ JSON格式錯誤');
      }
    }
  };

  // 新增：統計報表
  window.adminShowStats = function() {
    var stats = {
      總投稿數: window.adminSubmissions.length,
      待審核: window.adminSubmissions.filter(x => x.status === 'pending').length,
      已通過: window.adminSubmissions.filter(x => x.status === 'approved').length,
      已拒絕: window.adminSubmissions.filter(x => x.status === 'rejected').length,
      有商品資訊: window.adminSubmissions.filter(x => x.topProductInfo || x.bottomProductInfo).length,
      有Instagram: window.adminSubmissions.filter(x => x.instagramUrl).length
    };
    
    var statsText = '📊 統計報表\n\n';
    Object.keys(stats).forEach(key => {
      statsText += key + '：' + stats[key] + '\n';
    });
    
    alert(statsText);
  };

  // 顯示無資料
  window.adminShowNoData = function() {
    document.getElementById('adminNoData').style.display = 'block';
    document.getElementById('adminSubmissionsGrid').innerHTML = '';
  };

  // 重新整理
  window.adminRefreshData = async function() {
    var button = event.target;
    button.disabled = true;
    button.textContent = '載入中...';
    
    try {
      await adminLoadSubmissions();
    } catch (err) {
      console.error('重新整理失敗：', err);
    } finally {
      button.disabled = false;
      button.textContent = '重新整理';
    }
  };

  // 修改密碼功能
  window.showChangePassword = function() {
    var currentContent = document.getElementById('adminLoginOverlay').innerHTML;
    
    document.getElementById('adminLoginOverlay').innerHTML = `
      <div class="admin-login-box">
        <h2 style="margin-bottom: 20px; color: #2c3e50;">🔐 修改管理員密碼</h2>
        
        <input type="text" id="changeUsername" placeholder="請輸入管理員帳號" class="login-input" />
        <input type="password" id="changeOldPassword" placeholder="請輸入舊密碼" class="login-input" />
        <input type="password" id="changeNewPassword" placeholder="請輸入新密碼" class="login-input" />
        <input type="password" id="changeConfirmPassword" placeholder="請確認新密碼" class="login-input" />
        
        <button onclick="processChangePassword()" class="login-btn login-btn-primary">修改密碼</button>
        <button onclick="backToLogin()" class="login-btn login-btn-secondary">返回登入</button>
        
        <div id="changePasswordError" class="error-message">密碼修改失敗，請檢查輸入</div>
        <div id="changePasswordSuccess" class="success-message">密碼修改成功！</div>
      </div>
    `;
  };

  // 處理密碼修改
  window.processChangePassword = function() {
    var username = document.getElementById('changeUsername').value.trim();
    var oldPassword = document.getElementById('changeOldPassword').value;
    var newPassword = document.getElementById('changeNewPassword').value;
    var confirmPassword = document.getElementById('changeConfirmPassword').value;

    if (!username || !oldPassword || !newPassword || !confirmPassword) {
      showChangePasswordError('請填寫所有欄位');
      return;
    }

    if (newPassword !== confirmPassword) {
      showChangePasswordError('新密碼與確認密碼不一致');
      return;
    }

    if (newPassword.length < 6) {
      showChangePasswordError('新密碼長度至少6個字元');
      return;
    }

    var button = event.target;
    button.disabled = true;
    button.textContent = '處理中...';

    fetch(window.OUTFIT_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'changePassword',
        username: username,
        oldPassword: oldPassword,
        newPassword: newPassword
      })
    })
    .then(response => response.json())
    .then(result => {
      button.disabled = false;
      button.textContent = '修改密碼';
      
      if (result.success) {
        showChangePasswordSuccess('密碼修改成功！將在3秒後返回登入頁面');
        window.showToast('✅ 密碼修改成功');
        setTimeout(() => {
          backToLogin();
        }, 3000);
      } else {
        showChangePasswordError(result.error || '密碼修改失敗');
      }
    })
    .catch(error => {
      button.disabled = false;
      button.textContent = '修改密碼';
      console.error('修改密碼失敗:', error);
      showChangePasswordError('網路連線錯誤，請稍後再試');
    });
  };

  // 返回登入頁面
  window.backToLogin = function() {
    location.reload();
  };

  // 顯示修改密碼錯誤
  function showChangePasswordError(message) {
    var errorDiv = document.getElementById('changePasswordError');
    var successDiv = document.getElementById('changePasswordSuccess');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }
    if (successDiv) {
      successDiv.style.display = 'none';
    }
    window.showToast('❌ ' + message);
  }

  // 顯示修改密碼成功
  function showChangePasswordSuccess(message) {
    var errorDiv = document.getElementById('changePasswordError');
    var successDiv = document.getElementById('changePasswordSuccess');
    if (successDiv) {
      successDiv.textContent = message;
      successDiv.style.display = 'block';
    }
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }

  // 回車鍵登入
  document.addEventListener('DOMContentLoaded', function() {
    var passwordInput = document.getElementById('adminPasswordInput');
    if (passwordInput) {
      passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          adminCheckPassword();
        }
      });
    }

    // 自動檢查登入狀態
    if (document.getElementById('adminLoginOverlay')) {
      if (!checkAdminLoginStatus()) {
        document.getElementById('adminLoginOverlay').style.display = 'flex';
      }
    }
  });

})();
