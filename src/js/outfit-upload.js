// outfit-upload.js
// EasyStore 穿搭投稿模組 - Google Drive 整合版
// Version: 4.1.0
// Dependencies: outfit-common.js

console.log('🚀 開始載入升級版穿搭投稿系統 (Google Drive 版)...');

var selectedImage = null;
var selectedAvatar = null;

// 直接檢查 window.isLoggedIn
if (window.isLoggedIn) {
  console.log('✅ 使用者已登入:', window.customerInfo);
} else {
  console.log('❌ 使用者未登入');
}

// 等待 DOM 載入完成後再初始化
document.addEventListener('DOMContentLoaded', function() {
  // 初始化投稿表單
  initUploadForm();
  
  // 設定除錯功能
  setupDebug();
  
  // 設定商品資訊切換功能
  setupProductInputs();
});

// 初始化投稿表單
function initUploadForm() {
  console.log('📝 初始化升級版投稿表單...');
  
  // 更新登入狀態顯示
  updateLoginStatus();
  
  // 設定圖片上傳
  setupImageUpload();
  
  // 設定頭像上傳
  setupAvatarUpload();
  
  // 設定表單提交
  setupFormSubmit();
  
  // 設定 Instagram 相關事件
  setupInstagramInputs();
  
  console.log('✅ 投稿表單初始化完成');
}

// 更新登入狀態顯示
function updateLoginStatus() {
  console.log('🔄 更新登入狀態...');
  
  var memberStatus = document.getElementById('memberStatus');
  if (!memberStatus) {
    console.warn('⚠️ 找不到 memberStatus 元素');
    return;
  }
  
  if (window.isLoggedIn) {
    memberStatus.innerHTML = '<strong>歡迎！</strong> 準備分享你的穿搭吧！';
    memberStatus.className = 'welcome-message';
    
    // 自動填入會員名稱
    var displayNameInput = document.getElementById('displayName');
    if (displayNameInput && window.customerInfo && window.customerInfo.name) {
      displayNameInput.value = window.customerInfo.name;
    }
  } else {
    memberStatus.innerHTML = '<strong>提醒：</strong> 需要先 <a href="/account/login?return_to=' + encodeURIComponent(window.location.href) + '">登入會員</a> 才能投稿穿搭照片';
    memberStatus.className = 'login-prompt';
  }
  
  console.log('✅ 登入狀態更新完成');
}

// 設定圖片上傳
function setupImageUpload() {
  console.log('📷 設定圖片上傳...');
  
  var imageInput = document.getElementById('imageInput');
  
  if (!imageInput) {
    console.error('❌ 找不到圖片上傳元素');
    return;
  }

  // 確保 CSS 不會干擾
  imageUpload.style.cursor = 'pointer';
  imageUpload.style.pointerEvents = 'auto';
  imageInput.style.pointerEvents = 'auto';
  imageInput.style.cursor = 'pointer';
  
  // 方法 1：直接綁定 onchange
  imageInput.onchange = function(e) {
    console.log('📷 圖片檔案選擇變更');
    if (e.target.files && e.target.files.length > 0) {
      handleImageSelect(e.target.files[0]);
    }
  };
  
  // 方法 2：同時綁定容器的點擊事件（備用）
  imageUpload.onclick = function(e) {
    // 如果點擊的不是 input 本身
    if (e.target !== imageInput) {
      e.preventDefault();
      e.stopPropagation();
      imageInput.click();
    }
  };
  
  console.log('✅ 圖片上傳設定完成');
}

// 設定頭像上傳
function setupAvatarUpload() {
  console.log('👤 設定頭像上傳...');
  
  var avatarInput = document.getElementById('avatarInput');
  
  if (!avatarInput) {
    console.error('❌ 找不到頭像上傳元素');
    return;
  }
  

  // 確保 CSS 不會干擾
  avatarUpload.style.cursor = 'pointer';
  avatarUpload.style.pointerEvents = 'auto';
  avatarInput.style.pointerEvents = 'auto';
  avatarInput.style.cursor = 'pointer';
  
  // 方法 1：直接綁定 onchange
  avatarInput.onchange = function(e) {
    console.log('👤 頭像檔案選擇變更');
    if (e.target.files && e.target.files.length > 0) {
      handleAvatarSelect(e.target.files[0]);
    }
  };
  
  // 方法 2：同時綁定容器的點擊事件（備用）
  avatarUpload.onclick = function(e) {
    if (e.target !== avatarInput) {
      e.preventDefault();
      e.stopPropagation();
      avatarInput.click();
    }
  };
  
  console.log('✅ 頭像上傳設定完成');
}

// 處理頭像選擇
function handleAvatarSelect(file) {
  console.log('👤 處理頭像:', file.name);
  
  if (!file.type.startsWith('image/')) {
    window.showToast('❌ 請選擇圖片檔案');
    return;
  }
  
  if (file.size > 2 * 1024 * 1024) {
    window.showToast('❌ 頭像大小不能超過2MB');
    return;
  }
  
  window.selectedAvatar = file;
  window.showToast('✅ 頭像選擇成功');
  
  // 顯示預覽
  var reader = new FileReader();
  reader.onload = function(e) {
    var avatarPreview = document.getElementById('avatarPreview');
    if (avatarPreview) {
      // 清除原本的內容並顯示圖片
      avatarPreview.innerHTML = '<img src="' + e.target.result + '" alt="頭像預覽" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">';
    }
  };
  reader.readAsDataURL(file);
}

// 處理圖片選擇
function handleImageSelect(file) {
  console.log('🖼️ 處理圖片:', file.name);
  
  if (!file.type.startsWith('image/')) {
    window.showToast('❌ 請選擇圖片檔案');
    return;
  }
  
  if (file.size > 10 * 1024 * 1024) {
    window.showToast('❌ 圖片大小不能超過10MB');
    return;
  }
  
  selectedImage = file;
  window.showToast('✅ 圖片選擇成功');
  
  // 顯示預覽
  var reader = new FileReader();
  reader.onload = function(e) {
    var imagePreview = document.getElementById('imagePreview');
    if (imagePreview) {
      imagePreview.innerHTML = '<img src="' + e.target.result + '" alt="預覽圖片" style="max-width: 100%; height: auto;"><p style="margin-top: 10px; color: #7f8c8d;">圖片已選擇：' + file.name + '</p>';
    }
  };
  reader.readAsDataURL(file);
}

// ===== Google Drive 圖片上傳函式 =====

/**
 * 上傳圖片到 Google Drive
 */
function uploadImageToGoogleDrive(file) {
  return new Promise((resolve, reject) => {
    console.log('📸 準備上傳圖片到 Google Drive:', file.name);
    
    // 檢查檔案大小（建議限制 5MB）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      reject(new Error('圖片大小不能超過 5MB'));
      return;
    }
    
    // 使用 FileReader 讀取檔案
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const base64Data = e.target.result;
      
      // 準備上傳資料
      const uploadData = {
        action: 'uploadImage',
        imageData: {
          data: base64Data,
          fileName: file.name,
          mimeType: file.type
        }
      };
      
      // 發送到 Google Apps Script
      fetch(window.OUTFIT_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(uploadData)
      })
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          console.log('✅ 圖片上傳成功:', result.url);
          resolve(result.url);
        } else {
          reject(new Error(result.error || '上傳失敗'));
        }
      })
      .catch(error => {
        console.error('❌ 上傳請求失敗:', error);
        reject(error);
      });
    };
    
    reader.onerror = function() {
      reject(new Error('讀取檔案失敗'));
    };
    
    // 開始讀取檔案
    reader.readAsDataURL(file);
  });
}

/**
 * 上傳頭像到 Google Drive（含尺寸壓縮）
 */
function uploadAvatarToGoogleDrive(file) {
  return new Promise((resolve, reject) => {
    console.log('👤 準備上傳頭像:', file.name);
    
    // 建立圖片物件進行尺寸調整
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = function(e) {
      img.src = e.target.result;
    };
    
    img.onload = function() {
      // 設定目標尺寸
      const targetSize = 200; // 200x200 像素
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 計算裁切區域（保持正方形）
      const size = Math.min(img.width, img.height);
      const x = (img.width - size) / 2;
      const y = (img.height - size) / 2;
      
      // 設定 canvas 尺寸
      canvas.width = targetSize;
      canvas.height = targetSize;
      
      // 繪製並縮放圖片
      ctx.drawImage(img, x, y, size, size, 0, 0, targetSize, targetSize);
      
      // 轉換為 base64
      const base64Data = canvas.toDataURL('image/jpeg', 0.8); // 0.8 品質
      
      // 準備上傳資料
      const uploadData = {
        action: 'uploadAvatar',
        avatarData: {
          data: base64Data,
          fileName: 'avatar_' + Date.now() + '.jpg',
          mimeType: 'image/jpeg'
        }
      };
      
      // 發送到 Google Apps Script
      fetch(window.OUTFIT_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(uploadData)
      })
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          console.log('✅ 頭像上傳成功:', result.url);
          resolve(result.url);
        } else {
          reject(new Error(result.error || '上傳失敗'));
        }
      })
      .catch(reject);
    };
    
    img.onerror = function() {
      reject(new Error('圖片載入失敗'));
    };
    
    reader.readAsDataURL(file);
  });
}

// 設定商品資訊輸入切換
function setupProductInputs() {
  console.log('🛍️ 設定商品資訊輸入切換...');
  
  // 基本商品資訊切換
  var basicProductTypeRadios = document.querySelectorAll('input[name="basicProductType"]');
  basicProductTypeRadios.forEach(function(radio) {
    radio.addEventListener('change', function() {
      toggleProductInput('basic', this.value);
      window.showToast('💡 切換到' + (this.value === 'url' ? '網址' : '名稱') + '模式');
    });
  });
  
  // 進階商品資訊切換
  var productTypes = ['top', 'bottom', 'outer', 'shoes', 'accessory'];
  productTypes.forEach(function(type) {
    var radios = document.querySelectorAll('input[name="' + type + 'ProductType"]');
    radios.forEach(function(radio) {
      radio.addEventListener('change', function() {
        toggleProductInput(type, this.value);
      });
    });
  });
  
  console.log('✅ 商品資訊輸入切換設定完成');
}

// 切換商品輸入模式
function toggleProductInput(type, mode) {
  var urlInput = document.getElementById(type + 'ProductUrlInput');
  var nameInput = document.getElementById(type + 'ProductNameInput');
  
  if (urlInput && nameInput) {
    if (mode === 'url') {
      urlInput.style.display = 'block';
      nameInput.style.display = 'none';
    } else {
      urlInput.style.display = 'none';
      nameInput.style.display = 'block';
    }
  }
}

// 展開/收合進階商品選項
window.toggleAdvancedProducts = function() {
  var container = document.getElementById('advancedProductContainer');
  var icon = document.getElementById('toggleIcon');
  var button = event.target;
  
  // 添加按鈕反饋
  button.style.transform = 'scale(0.98)';
  setTimeout(() => {
    button.style.transform = 'scale(1)';
  }, 150);
  
  if (container.style.display === 'none' || container.style.display === '') {
    container.style.display = 'block';
    icon.textContent = '▲';
    window.showToast('📂 已展開進階商品選項');
  } else {
    container.style.display = 'none';
    icon.textContent = '▼';
    window.showToast('📂 已收合進階商品選項');
  }
};

// 設定表單提交
function setupFormSubmit() {
  console.log('📋 設定表單提交...');
  
  var form = document.getElementById('outfitSubmitForm');
  var submitBtn = document.getElementById('submitBtn');
  
  if (!form || !submitBtn) {
    console.error('❌ 找不到表單或提交按鈕');
    return;
  }
  
  // 防止表單預設提交
  form.onsubmit = function(e) {
    e.preventDefault();
    console.log('📝 表單提交事件觸發（已阻止預設行為）');
    return false;
  };
  
  // 確保按鈕類型正確
  if (submitBtn.type === 'submit') {
    submitBtn.type = 'button';
  }
  
  // 按鈕點擊事件
  submitBtn.onclick = function(e) {
    e.preventDefault();
    console.log('🔘 按鈕點擊事件觸發');
    submitOutfit();
    return false;
  };
  
  console.log('✅ 表單提交設定完成');
}

// 提交穿搭函式（使用 Google Drive）
function submitOutfit() {
  console.log('🚀 開始提交穿搭（Google Drive 版）...');
  
  if (!window.isLoggedIn) {
    window.showToast('❌ 請先登入會員才能投稿');
    setTimeout(() => {
      window.location.href = '/account/login?return_to=' + encodeURIComponent(window.location.href);
    }, 1500);
    return;
  }
  
  if (!selectedImage) {
    window.showToast('❌ 請選擇穿搭照片');
    return;
  }
  
  var submitBtn = document.getElementById('submitBtn');
  var loading = document.getElementById('uploadLoading');
  
  // 顯示載入狀態
  submitBtn.disabled = true;
  submitBtn.textContent = '上傳中...';
  if (loading) loading.style.display = 'block';
  
  // 收集基本表單資料
  var formData = {
    displayName: document.getElementById('displayName').value.trim(),
    height: document.getElementById('height').value.trim(),
    weight: document.getElementById('weight').value.trim(),
    topSize: document.getElementById('topSize').value,
    bottomSize: document.getElementById('bottomSize').value,
    comment: document.getElementById('comment').value.trim(),
    submitTime: new Date().toISOString()
  };
  
  // 收集 Instagram 資訊
  var instagramHandle = document.getElementById('instagramHandle').value.trim();
  var instagramUrl = document.getElementById('instagramUrl').value.trim();
  
  // 處理 Instagram 資料
  if (instagramUrl) {
    formData.instagramUrl = instagramUrl;
    // 從連結提取帳號（如果沒有單獨填寫帳號）
    if (!instagramHandle) {
      const match = instagramUrl.match(/(?:instagram\.com|instagr\.am)\/([^\/\?\#\&]+)/);
      if (match) {
        formData.instagramHandle = match[1];
      }
    } else {
      formData.instagramHandle = instagramHandle;
    }
  } else if (instagramHandle) {
    // 只有帳號，自動生成連結
    formData.instagramHandle = instagramHandle;
    formData.instagramUrl = 'https://instagram.com/' + instagramHandle;
  } else {
    // 都沒填
    formData.instagramHandle = '';
    formData.instagramUrl = '';
  }
  
  // 收集商品資訊
  collectProductInfo(formData);
  
  console.log('📊 表單資料:', formData);
  
  // 驗證必填欄位
  if (!formData.displayName) {
    window.showToast('❌ 請填寫顯示名稱');
    resetSubmitButton();
    return;
  }
  
  if (!formData.height) {
    window.showToast('❌ 請填寫身高');
    resetSubmitButton();
    return;
  }
  
  if (isNaN(formData.height) || formData.height < 140 || formData.height > 200) {
    window.showToast('❌ 請填寫有效的身高（140-200 公分）');
    resetSubmitButton();
    return;
  }
  
  // 準備上傳圖片
  var uploadPromises = [];
  
  // 上傳主要穿搭照片到 Google Drive
  submitBtn.textContent = '正在上傳圖片到 Google Drive...';
  uploadPromises.push(uploadImageToGoogleDrive(selectedImage));
  
  // 上傳頭像（如果有）
  if (window.selectedAvatar) {
    uploadPromises.push(uploadAvatarToGoogleDrive(window.selectedAvatar));
  } else {
    uploadPromises.push(Promise.resolve('')); // 沒有頭像時返回空字串
  }
  
  Promise.all(uploadPromises)
    .then(function(results) {
      var imageUrl = results[0];
      var avatarUrl = results[1];
      console.log('📸 圖片上傳完成:', imageUrl);
      console.log('👤 頭像上傳完成:', avatarUrl);
      
      // 更新進度
      submitBtn.textContent = '處理資料中...';
      
      // 將圖片 URL 加入表單資料
      formData.imageUrl = imageUrl;
      formData.avatarUrl = avatarUrl;
      
      // 第二步：提交到 Google Apps Script
      return submitToGoogleScript(formData);
    })
    .then(function(result) {
      console.log('✅ 提交成功:', result);
      
      window.showToast('🎉 投稿成功！');
      
      // 顯示成功區塊
      var successMessage = document.getElementById('successMessage');
      if (successMessage) {
        var successHtml = '<strong>🎉 投稿成功！</strong><br>';
        if (result.submissionId) {
          successHtml += '投稿編號：' + result.submissionId + '<br>';
        }
        successHtml += '您的穿搭已提交，等待審核通過後會顯示在穿搭牆上。';
        
        successMessage.innerHTML = successHtml;
        successMessage.style.display = 'block';
        
        // 自動滾動到成功訊息
        successMessage.scrollIntoView({ behavior: 'smooth' });
        
        // 10秒後隱藏
        setTimeout(function() {
          successMessage.style.display = 'none';
        }, 10000);
      }
      
      // 重置表單
      resetForm();
    })
    .catch(function(error) {
      console.error('❌ 提交失敗:', error);
      
      var errorMessage = '投稿失敗：';
      if (error.message.includes('網路')) {
        errorMessage += '網路連線問題，請檢查網路後重試';
      } else if (error.message.includes('Google')) {
        errorMessage += 'Google 服務連線問題，請稍後再試';
      } else if (error.message.includes('5MB')) {
        errorMessage += '圖片檔案過大，請壓縮後再試';
      } else {
        errorMessage += error.message || '未知錯誤，請稍後再試';
      }
      
      window.showToast('❌ ' + errorMessage);
    })
    .finally(function() {
      // 恢復按鈕狀態
      resetSubmitButton();
    });
}

// 設定 Instagram 輸入功能
function setupInstagramInputs() {
  console.log('📱 設定 Instagram 輸入功能...');
  
  // Instagram 帳號即時預覽
  var handleInput = document.getElementById('instagramHandle');
  if (handleInput) {
    handleInput.addEventListener('input', function(e) {
      const value = e.target.value.trim();
      // 移除 @ 符號（如果用戶輸入了）
      if (value.startsWith('@')) {
        e.target.value = value.substring(1);
      }
    });
  }
  
  // Instagram 連結自動填充帳號
  var urlInput = document.getElementById('instagramUrl');
  if (urlInput) {
    urlInput.addEventListener('blur', function(e) {
      const url = e.target.value.trim();
      const handleInputElement = document.getElementById('instagramHandle');
      
      if (url && handleInputElement && !handleInputElement.value) {
        const match = url.match(/(?:instagram\.com|instagr\.am)\/([^\/\?\#\&]+)/);
        if (match) {
          handleInputElement.value = match[1];
          window.showToast('✅ 已自動填入 Instagram 帳號');
        }
      }
    });
  }
  
  console.log('✅ Instagram 輸入功能設定完成');
}

// 收集商品資訊
function collectProductInfo(formData) {
  // 基本商品資訊
  var basicType = document.querySelector('input[name="basicProductType"]:checked');
  basicType = basicType ? basicType.value : 'url';
  
  if (basicType === 'url') {
    var basicUrlElement = document.getElementById('basicProductUrl');
    formData.basicProductInfo = basicUrlElement ? basicUrlElement.value.trim() : '';
  } else {
    var basicNameElement = document.getElementById('basicProductName');
    formData.basicProductInfo = basicNameElement ? basicNameElement.value.trim() : '';
  }
  formData.basicProductType = basicType;
  
  // 進階商品資訊
  var productTypes = [
    { name: 'top', label: '上衣' },
    { name: 'bottom', label: '下身' },
    { name: 'outer', label: '外套' },
    { name: 'shoes', label: '鞋子' },
    { name: 'accessory', label: '配件' }
  ];
  
  productTypes.forEach(function(product) {
    var typeRadio = document.querySelector('input[name="' + product.name + 'ProductType"]:checked');
    var type = typeRadio ? typeRadio.value : 'url';
    
    var info = '';
    if (type === 'url') {
      var urlElement = document.getElementById(product.name + 'ProductUrl');
      info = urlElement ? urlElement.value.trim() : '';
    } else {
      var nameElement = document.getElementById(product.name + 'ProductName');
      info = nameElement ? nameElement.value.trim() : '';
    }
    
    // 根據 Google Sheets 欄位命名
    formData[product.name + 'ProductInfo'] = info;
    formData[product.name + 'ProductType'] = type;
  });
  
  console.log('🛍️ 收集到的商品資訊:', {
    basic: formData.basicProductInfo,
    top: formData.topProductInfo,
    bottom: formData.bottomProductInfo,
    outer: formData.outerProductInfo,
    shoes: formData.shoesProductInfo,
    accessory: formData.accessoryProductInfo
  });
}

// 提交到 Google Apps Script 函式
function submitToGoogleScript(data) {
  return new Promise(function(resolve, reject) {
    console.log('📡 提交到 Google Apps Script...');
    console.log('📊 發送的資料:', data);
    
    fetch(window.OUTFIT_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(data)
    })
    .then(function(response) {
      console.log('📡 收到回應狀態:', response.status);
      
      if (response.status === 200) {
        return response.text();
      } else {
        throw new Error('HTTP 錯誤: ' + response.status);
      }
    })
    .then(function(responseText) {
      console.log('📡 回應內容:', responseText);
      
      try {
        var result = JSON.parse(responseText);
        console.log('📡 解析後的結果:', result);
        
        if (result.success) {
          resolve(result);
        } else {
          reject(new Error(result.error || '提交失敗'));
        }
      } catch (parseError) {
        console.error('JSON 解析錯誤:', parseError);
        console.log('原始回應:', responseText);
        reject(new Error('伺服器回應格式錯誤'));
      }
    })
    .catch(function(error) {
      console.error('📡 提交錯誤:', error);
      reject(error);
    });
  });
}

// 重置提交按鈕狀態
function resetSubmitButton() {
  var submitBtn = document.getElementById('submitBtn');
  var loading = document.getElementById('uploadLoading');
  
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = '立即投稿';
    submitBtn.style.opacity = '1';
  }
  
  if (loading) {
    loading.style.display = 'none';
  }
  
  console.log('🔄 提交按鈕已重置');
}

// 重置表單
function resetForm() {
  console.log('🔄 重置表單...');
  
  var form = document.getElementById('outfitSubmitForm');
  var imagePreview = document.getElementById('imagePreview');
  var avatarPreview = document.getElementById('avatarPreview');
  
  if (form) {
    form.reset();
  }
  
  if (imagePreview) {
    imagePreview.innerHTML = '';
  }
  
  if (avatarPreview) {
    avatarPreview.innerHTML = '<div class="default-avatar">👤</div><div class="upload-text">點擊上傳頭像</div>';
  }
  
  selectedImage = null;
  selectedAvatar = null;
  
  // 重新填入會員名稱（如果已登入）
  if (window.isLoggedIn) {
    updateLoginStatus();
  }
  
  // 重置商品輸入模式
  resetProductInputs();
  
  console.log('✅ 表單重置完成');
}

// 重置商品輸入模式
function resetProductInputs() {
  // 重置基本商品輸入
  toggleProductInput('basic', 'url');
  
  // 重置進階商品輸入
  var productTypes = ['top', 'bottom', 'outer', 'shoes', 'accessory'];
  productTypes.forEach(function(type) {
    toggleProductInput(type, 'url');
  });
  
  // 收合進階選項
  var container = document.getElementById('advancedProductContainer');
  var icon = document.getElementById('toggleIcon');
  if (container && icon) {
    container.style.display = 'none';
    icon.textContent = '▼';
  }
}

// 設定除錯功能
function setupDebug() {
  window.outfitDebug = {
    isLoggedIn: window.isLoggedIn,
    selectedImage: selectedImage,
    checkElements: function() {
      console.log('🔍 檢查元素:');
      var ids = ['outfitSubmitForm', 'submitBtn', 'imageUpload', 'memberStatus', 'displayName'];
      ids.forEach(function(id) {
        var el = document.getElementById(id);
        console.log(id + ':', el ? '✅ 找到' : '❌ 未找到');
      });
    },
    testSubmit: function() {
      console.log('🧪 測試完整提交流程');
      submitOutfit();
    },
    testProductInfo: function() {
      var formData = {};
      collectProductInfo(formData);
      console.log('🛍️ 測試商品資訊收集:', formData);
    },
    testGoogleDriveUpload: function() {
      console.log('🧪 測試 Google Drive 上傳功能');
      if (selectedImage) {
        uploadImageToGoogleDrive(selectedImage)
          .then(url => console.log('✅ 上傳成功:', url))
          .catch(err => console.error('❌ 上傳失敗:', err));
      } else {
        console.log('❌ 請先選擇圖片');
      }
    }
  };
  
  console.log('🎯 除錯功能已設定完成');
  console.log('📌 可用指令：');
  console.log('- outfitDebug.checkElements() - 檢查頁面元素');
  console.log('- outfitDebug.testGoogleDriveUpload() - 測試圖片上傳');
  console.log('- outfitDebug.testProductInfo() - 測試商品資訊收集');
}

// 確保 DOM 載入完成後執行初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 載入完成，開始初始化...');
    initUploadForm();
  });
} else {
  // DOM 已經載入完成
  console.log('DOM 已載入，直接初始化...');
  initUploadForm();
}

// 備用方案：確保初始化
window.addEventListener('load', function() {
  // 檢查是否已經初始化
  if (!document.getElementById('imageInput').onchange) {
    console.log('⚠️ 偵測到未初始化，執行備用初始化...');
    initUploadForm();
  }
});

console.log('✅ outfit-upload.js (Google Drive 版) 載入完成');
