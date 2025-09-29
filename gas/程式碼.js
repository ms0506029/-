// ==========================================
// 穿搭投稿系統 - Google Apps Script（完整升級版 v4.0）
// 支援：投稿、審核、管理員登入、商品連結、部位分享、需求統計、自訂頭像
// ==========================================

// 設定您的 Google Sheets ID
const SPREADSHEET_ID = '1KanKKMRSTKB9i-VeAcfltH2LZjGn6fSkCcehsQFe8aA';
const SHEET_NAME = '穿搭投稿';
const ADMIN_SHEET_NAME = '管理員';
const INTERACTION_SHEET_NAME = '互動記錄';

// EasyStore API 設定（根據官方文檔修正）
const EASYSTORE_CONFIG = {
  STORE_URL: "takemejapan",
  ACCESS_TOKEN: "f232b671b6cb3bb8151c23c2bd39129a",
  BASE_API: "https://takemejapan.easy.co/api/3.0"  // ✅ 使用官方文檔的 3.0 版本
};

// 預設管理員帳號（多個管理員）
const DEFAULT_ADMINS = [
  {
    username: 'admin',
    password: 'admin123',
    email: 'eddc9104@gmail.com',
    role: 'super_admin',
    created: new Date().toISOString()
  },
  {
    username: 'reviewer1',
    password: 'reviewer123',
    email: 'vbt89679@gmail.com',
    role: 'reviewer',
    created: new Date().toISOString()
  },
  {
    username: 'reviewer2',
    password: 'reviewer456',
    email: 'julie19971214@gmail.com',
    role: 'reviewer',
    created: new Date().toISOString()
  }
];

// ===== 性能優化版本 =====
let cachedData = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分鐘快取

// 處理 OPTIONS 請求（CORS 預檢）
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * 優化版：取得已通過的投稿（使用快取）
 */
function getApprovedOutfitsFast() {
  try {
    console.log('⚡ 快速取得已通過投稿...');
    
    const now = Date.now();
    
    // 檢查快取是否有效
    if (cachedData && (now - cacheTime < CACHE_DURATION)) {
      console.log('🎯 使用快取資料');
      const output = ContentService.createTextOutput();
      output.setMimeType(ContentService.MimeType.JSON);
      output.setContent(JSON.stringify(cachedData));
      return output;
    }
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      const result = { success: true, data: [], message: '尚無投稿資料' };
      const output = ContentService.createTextOutput();
      output.setMimeType(ContentService.MimeType.JSON);
      output.setContent(JSON.stringify(result));
      return output;
    }
    
    // 只讀取必要的資料
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const statusIndex = headers.indexOf('審核狀態');
    
    if (statusIndex === -1) {
      throw new Error('找不到審核狀態欄位');
    }
    
    // 快速篩選已通過的投稿
    const approvedSubmissions = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][statusIndex] === '已通過') {
        const submission = {};
        // 修正：正確對應標題和資料
        for (let j = 0; j < headers.length; j++) {
          submission[headers[j]] = data[i][j];
        }
        approvedSubmissions.push(submission);
      }
    }
    
    // 更新快取
    cachedData = {
      success: true,
      data: approvedSubmissions,
      count: approvedSubmissions.length
    };
    cacheTime = now;
    
    console.log(`⚡ 快速載入完成：${approvedSubmissions.length} 筆資料`);
    
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify(cachedData));
    return output;
    
  } catch (error) {
    console.error('載入失敗:', error);
    const errorResult = { success: false, error: error.toString() };
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify(errorResult));
    return output;
  }
}

/**
 * 清除快取（當有新投稿或狀態更新時）
 */
function clearCache() {
  cachedData = null;
  cacheTime = 0;
  console.log('🗑️ 快取已清除');
}

/**
 * 處理 HTTP GET 請求
 */
function doGet(e) {
  try {
    console.log('收到 GET 請求');
    console.log('參數:', e.parameter);
    
    const action = e.parameter.action || 'test';
    
    let result;
    switch (action) {
      case 'test':
        result = {
          success: true,
          message: 'Google Apps Script 運作正常',
          timestamp: new Date().toISOString(),
          spreadsheetId: SPREADSHEET_ID,
          version: 'v4.0 - 含自訂頭像系統'
        };
        break;
        
      case 'verifyMemberAndGetData':
        if (e.parameter.email) {
          result = verifyMemberAndGetData({ email: e.parameter.email });
        } else {
          result = { success: false, error: '缺少 email 參數' };
        }
        break;
        
      case 'getAllOutfits':
        result = getAllOutfitsForAdmin();
        return result;
        
      case 'getApprovedOutfits':
        result = getApprovedOutfitsFast();
        return result;
        
      case 'getUserInteractions':
        const memberEmail = e.parameter.memberEmail;
        if (memberEmail) {
          result = getUserInteractions(memberEmail);
        } else {
          result = { success: false, error: '缺少 memberEmail 參數' };
        }
        break;

      case 'quickTestEasyStoreAPI':
        result = quickTestEasyStoreAPI();
        break;

      case 'simpleEasyStoreTest':
        result = simpleEasyStoreTest();
        break;

      case 'debugEasyStoreAPI':
        result = debugEasyStoreAPI();
        break;

      case 'quickFixTest':
        result = quickFixTest();
        break;

      case 'handleInteraction':
        if (e.parameter.memberEmail && e.parameter.submissionId && e.parameter.interactionType) {
          result = handleUserInteraction({
            memberEmail: e.parameter.memberEmail,
            submissionId: e.parameter.submissionId,
            interactionType: e.parameter.interactionType
          });
        } else {
          result = { success: false, error: '缺少必要參數' };
        }
        break;
        
      default:
        result = {
          success: false,
          error: '未知的 action: ' + action
        };
    }
    
    // 支援 JSONP
    const callback = e.parameter.callback;
    if (callback) {
      return ContentService
        .createTextOutput(callback + '(' + JSON.stringify(result) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify(result));
    return output;
    
  } catch (error) {
    console.error('處理 GET 請求時發生錯誤:', error);
    
    const errorResult = {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
    
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify(errorResult));
    return output;
  }
}


/**
 * 處理 HTTP POST 請求
 */
function doPost(e) {
  try {
    console.log('🔥🔥🔥 收到 POST 請求 🔥🔥🔥');
    console.log('📋 參數:', e.parameter);
    console.log('📋 POST 資料是否存在:', !!e.postData);
    
    if (e.postData && e.postData.contents) {
      console.log('📄 POST 內容前 200 字元:', e.postData.contents.substring(0, 200));
    }
    
    // 檢查是否為 LINE Webhook
    if (e.parameter && e.parameter.source === 'line') {
      console.log('🤖 檢測到 LINE Webhook 請求');
      const webhookData = JSON.parse(e.postData.contents);
      console.log('📥 完整 Webhook 資料:', JSON.stringify(webhookData, null, 2));
      
      const result = handleLineWebhook(webhookData);
      
      const output = ContentService.createTextOutput();
      output.setMimeType(ContentService.MimeType.JSON);
      output.setContent(JSON.stringify(result));
      return output;
    }
    
    console.log('⚠️ 非 LINE Webhook 請求，繼續原有處理邏輯');
    
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    
    if (!e.postData || !e.postData.contents) {
      const errorResult = {
        success: false,
        error: '沒有收到資料'
      };
      output.setContent(JSON.stringify(errorResult));
      return output;
    }
    
    // 解析 JSON 資料
    const data = JSON.parse(e.postData.contents);
    console.log('解析後的資料:', data);
    
    let result;
    
    // 根據不同 action 處理請求
    switch (data.action) {
      case 'uploadImage':
        result = uploadImageToDrive(data.imageData);
        break;
        
      case 'uploadAvatar':
        result = uploadImageToDrive(data.avatarData);
        break;

      case 'adminLogin':
        result = handleAdminLogin(data.username, data.password);
        break;
        
      case 'changePassword':
        result = handleChangePassword(data.username, data.oldPassword, data.newPassword);
        break;
        
      case 'updateStatus':
        result = updateSubmissionStatus(data.submissionId, data.status);
        break;
        
      case 'updateProductInfo':
        result = updateProductInfo(data.submissionId, data.productInfo);
        break;
        
      case 'recordItemWant':
        result = recordItemWant(data.submissionId, data.itemType);
        break;

      case 'deleteSubmission':
        result = deleteSubmission(data.submissionId);
        break;

      case 'handleInteraction':
        result = handleUserInteraction(data);
        break;
        
      case 'getUserInteractions':
        result = getUserInteractions(data.memberEmail);
        break;

      case 'verifyMemberAndGetData':
        result = verifyMemberAndGetData(data);
        break;
        
      case 'getCustomerPurchasedProducts':
        result = getCustomerPurchasedProducts(data.email);
        break;
      case 'getCustomerPurchasedProductsEnhanced':
        result = getCustomerPurchasedProductsEnhanced(data.email);
        break;

      case 'quickVerifyMember':
        result = quickVerifyMember(data);
        break;
        
      case 'lineWebhook':
        result = handleLineWebhook(data);
        break;

      default:
        // 原有的投稿功能
        result = handleOutfitSubmission(data);
    }
    
    output.setContent(JSON.stringify(result));
    return output;
      
  } catch (error) {
    console.error('❌ 處理 POST 請求時發生錯誤:', error);
    
    const errorResult = {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
    
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify(errorResult));
    return output;
  }
}

/**
 * 處理穿搭投稿（升級版 v4.0 - 含自訂頭像）
 */
function handleOutfitSubmission(data) {
  try {
    console.log('開始處理穿搭投稿 v4.0...');
    
    // 驗證必要欄位
    if (!data.displayName) {
      throw new Error('缺少顯示名稱');
    }
    
    if (!data.height) {
      throw new Error('缺少身高資訊');
    }
    
    // 取得 Google Sheets
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    // 如果工作表不存在，建立新的
    if (!sheet) {
      console.log('建立新的工作表:', SHEET_NAME);
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      
      // 設定標題列（升級版 v4.0）
      const headers = [
        '投稿時間', '投稿ID', '顯示名稱', '自訂頭像', '會員ID', '會員Email', '會員電話',
        '身高', '體重', '上衣尺寸', '下身尺寸', '穿搭心得', '圖片網址', 'Instagram帳號',
        'Instagram連結', '上衣商品資訊', '上衣商品類型', '下身商品資訊', '下身商品類型',
        '外套商品資訊', '外套商品類型', '鞋子商品資訊', '鞋子商品類型', '配件商品資訊',
        '配件商品類型', '審核狀態', '按讚數', '參考數', '購買數', '上衣需求統計',
        '下身需求統計', '外套需求統計', '鞋子需求統計', '配件需求統計'
      ];
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // 設定標題列格式
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');
      
      console.log('✅ 工作表建立完成，包含自訂頭像欄位');
    }
    
    // 生成唯一的投稿 ID
    const submissionId = 'OUTFIT_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    
    // 準備要寫入的資料（升級版 v4.0）
    const rowData = [
      new Date().toLocaleString('zh-TW'), // 投稿時間
      submissionId, // 投稿ID
      data.displayName || '', // 顯示名稱
      data.avatarUrl || '', // 自訂頭像
      data.memberId || '', // 會員ID
      data.memberEmail || '', // 會員Email
      data.memberPhone || '', // 會員電話
      data.height || '', // 身高
      data.weight || '', // 體重
      data.topSize || '', // 上衣尺寸
      data.bottomSize || '', // 下身尺寸
      data.comment || '', // 穿搭心得
      data.imageUrl || '', // 圖片網址
      data.instagramHandle || '',
      data.instagramUrl || '', // Instagram 連結
      data.topProductInfo || '', // 上衣商品資訊
      data.topProductType || '', // 上衣商品類型
      data.bottomProductInfo || '', // 下身商品資訊
      data.bottomProductType || '', // 下身商品類型
      data.outerProductInfo || '', // 外套商品資訊
      data.outerProductType || '', // 外套商品類型
      data.shoesProductInfo || '', // 鞋子商品資訊
      data.shoesProductType || '', // 鞋子商品類型
      data.accessoryProductInfo || '', // 配件商品資訊
      data.accessoryProductType || '', // 配件商品類型
      '待審核', // 審核狀態
      0, // 按讚數
      0, // 參考數
      0, // 購買數
      0, // 上衣需求統計
      0, // 下身需求統計
      0, // 外套需求統計
      0, // 鞋子需求統計
      0  // 配件需求統計
    ];
    
    // 寫入新的一列
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, 1, rowData.length).setValues([rowData]);
    
    console.log('成功寫入資料，投稿ID:', submissionId);
    console.log('頭像URL:', data.avatarUrl);
    
    // 發送新投稿通知郵件
    sendNewSubmissionEmail(data, submissionId);
    
    // 清除快取
    clearCache();
    
    return {
      success: true,
      message: '投稿成功',
      submissionId: submissionId,
      timestamp: new Date().toISOString(),
      hasAvatar: !!data.avatarUrl
    };
    
  } catch (error) {
    console.error('處理投稿時發生錯誤:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 處理圖片上傳到 Google Drive
 */
function uploadImageToDrive(imageData) {
  try {
    console.log('開始上傳圖片到 Google Drive...');
    
    // 建立或取得圖片資料夾
    const folderName = 'EasyStore穿搭牆圖片';
    let folder;
    
    // 檢查資料夾是否存在
    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      // 建立新資料夾
      folder = DriveApp.createFolder(folderName);
      console.log('建立新資料夾:', folderName);
    }
    
    // 更安全的 base64 解析方式
    let base64Data = imageData.data;
    
    // 檢查並移除 data URL 前綴
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    }
    
    // 確保 base64 字串是有效的
    if (!base64Data || base64Data.length === 0) {
      throw new Error('無效的圖片資料');
    }
    
    console.log('Base64 資料長度:', base64Data.length);
    
    // 解碼 base64
    let decodedData;
    try {
      decodedData = Utilities.base64Decode(base64Data);
      console.log('解碼後資料大小:', decodedData.length, 'bytes');
    } catch (decodeError) {
      console.error('Base64 解碼錯誤:', decodeError);
      throw new Error('圖片資料解碼失敗');
    }
    
    // 建立 Blob
    const blob = Utilities.newBlob(
      decodedData,
      imageData.mimeType || 'image/jpeg',
      imageData.fileName || 'outfit_' + Date.now() + '.jpg'
    );
    
    // 檢查 blob 大小
    console.log('Blob 大小:', blob.getBytes().length, 'bytes');
    
    // 上傳檔案 - 加入錯誤處理
    let file;
    try {
      file = folder.createFile(blob);
      console.log('檔案建立成功');
    } catch (createError) {
      console.error('建立檔案失敗:', createError);
      throw new Error('無法建立檔案：' + createError.toString());
    }
    
    // 檢查 file 是否存在
    if (!file) {
      throw new Error('檔案物件為空');
    }
    
    // 設定檔案權限 - 使用更安全的方式
    try {
      setFilePermissions(file);
    } catch (permError) {
      console.error('設定權限失敗，但繼續處理:', permError);
      // 不要因為權限設定失敗就中斷整個流程
    }
    
    // 取得檔案 ID 和 URL
    const fileId = file.getId();
    const directUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    
    console.log('圖片上傳成功:', directUrl);
    console.log('檔案名稱:', file.getName());
    console.log('檔案大小:', file.getSize(), 'bytes');
    
    return {
      success: true,
      url: directUrl,
      fileId: fileId,
      fileName: file.getName(),
      size: file.getSize()
    };
    
  } catch (error) {
    console.error('圖片上傳失敗:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 設定檔案權限
 */
function setFilePermissions(file) {
  // 正確的檢查方式
  if (!file || typeof file.setSharing !== 'function') {
    console.error('無效的檔案物件');
    return false;
  }
  
  try {
    // 嘗試最開放的權限
    file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
    console.log('✅ 檔案權限設定成功 (ANYONE)');
    return true;
  } catch (e1) {
    console.log('第一種權限設定失敗，嘗試第二種:', e1.toString());
    try {
      // 退而求其次
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      console.log('✅ 檔案權限設定成功 (ANYONE_WITH_LINK)');
      return true;
    } catch (e2) {
      console.error('❌ 檔案權限設定失敗:', e2);
      console.log('警告：檔案已上傳但可能需要手動設定權限');
      return false;
    }
  }
}

/**
 * ========== 管理員系統相關函式 ==========
 */

/**
 * 初始化管理員資料表
 */
function initializeAdminSheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let adminSheet = spreadsheet.getSheetByName(ADMIN_SHEET_NAME);
    
    if (!adminSheet) {
      console.log('建立管理員資料表:', ADMIN_SHEET_NAME);
      adminSheet = spreadsheet.insertSheet(ADMIN_SHEET_NAME);
      
      // 設定標題列
      const headers = [
        '用戶名',
        '密碼（加密）',
        'Email',
        '角色',
        '建立時間',
        '最後登入',
        '狀態'
      ];
      
      adminSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // 設定標題列格式
      const headerRange = adminSheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');
      
      // 插入預設管理員（多個管理員）
      DEFAULT_ADMINS.forEach(admin => {
        const rowData = [
          admin.username,
          hashPassword(admin.password),
          admin.email,
          admin.role,
          admin.created,
          '',
          'active'
        ];
        
        const lastRow = adminSheet.getLastRow();
        adminSheet.getRange(lastRow + 1, 1, 1, rowData.length).setValues([rowData]);
        console.log(`✅ 建立管理員: ${admin.username} (${admin.email})`);
      });
      
      console.log('管理員資料表初始化完成');
    }
    
    return adminSheet;
    
  } catch (error) {
    console.error('初始化管理員資料表失敗:', error);
    throw error;
  }
}

/**
 * 簡單的密碼加密函式
 */
function hashPassword(password) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + 'salt'));
}

/**
 * 處理管理員登入
 */
function handleAdminLogin(username, password) {
  try {
    console.log('處理管理員登入:', username);
    
    const adminSheet = initializeAdminSheet();
    
    const data = adminSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const usernameIndex = headers.indexOf('用戶名');
    const passwordIndex = headers.indexOf('密碼（加密）');
    const statusIndex = headers.indexOf('狀態');
    const lastLoginIndex = headers.indexOf('最後登入');
    const emailIndex = headers.indexOf('Email');
    const roleIndex = headers.indexOf('角色');
    
    // 查找管理員
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      if (row[usernameIndex] === username && 
          row[statusIndex] === 'active' &&
          row[passwordIndex] === hashPassword(password)) {
        
        // 更新最後登入時間
        adminSheet.getRange(i + 2, lastLoginIndex + 1).setValue(new Date().toISOString());
        
        console.log('管理員登入成功:', username);
        
        return {
          success: true,
          message: '登入成功',
          username: username,
          email: row[emailIndex],
          role: row[roleIndex],
          loginTime: new Date().toISOString(),
          token: generateAdminToken(username)
        };
      }
    }
    
    console.log('管理員登入失敗:', username);
    return {
      success: false,
      error: '帳號或密碼錯誤'
    };
    
  } catch (error) {
    console.error('管理員登入處理失敗:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 處理管理員修改密碼
 */
function handleChangePassword(username, oldPassword, newPassword) {
  try {
    console.log('處理密碼修改:', username);
    
    const adminSheet = initializeAdminSheet();
    const data = adminSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const usernameIndex = headers.indexOf('用戶名');
    const passwordIndex = headers.indexOf('密碼（加密）');
    const statusIndex = headers.indexOf('狀態');
    
    // 查找管理員並驗證舊密碼
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      if (row[usernameIndex] === username && 
          row[statusIndex] === 'active' &&
          row[passwordIndex] === hashPassword(oldPassword)) {
        
        // 更新新密碼
        adminSheet.getRange(i + 2, passwordIndex + 1).setValue(hashPassword(newPassword));
        
        console.log('密碼修改成功:', username);
        
        return {
          success: true,
          message: '密碼修改成功',
          username: username,
          updateTime: new Date().toISOString()
        };
      }
    }
    
    console.log('密碼修改失敗 - 舊密碼錯誤:', username);
    return {
      success: false,
      error: '舊密碼錯誤'
    };
    
  } catch (error) {
    console.error('密碼修改處理失敗:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 生成管理員 Token
 */
function generateAdminToken(username) {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substr(2, 9);
  return `${username}_${timestamp}_${randomStr}`;
}

/**
 * ========== 投稿管理函式 ==========
 */

/**
 * 更新投稿狀態
 */
function updateSubmissionStatus(submissionId, newStatus) {
  try {
    console.log(`更新投稿狀態: ${submissionId} -> ${newStatus}`);
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error('找不到工作表: ' + SHEET_NAME);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const statusColumnIndex = headers.indexOf('審核狀態') + 1;
    const idColumnIndex = headers.indexOf('投稿ID') + 1;
    
    if (statusColumnIndex === 0 || idColumnIndex === 0) {
      throw new Error('找不到必要的欄位（投稿ID 或 審核狀態）');
    }
    
    // 找到要更新的列
    for (let i = 1; i < data.length; i++) {
      if (data[i][idColumnIndex - 1] === submissionId) {
        // 更新狀態
        sheet.getRange(i + 1, statusColumnIndex).setValue(newStatus);
        
        // 清除快取
        clearCache();
        
        console.log(`成功更新第 ${i + 1} 列的狀態為: ${newStatus}`);
        
        return {
          success: true,
          message: '狀態更新成功',
          submissionId: submissionId,
          newStatus: newStatus,
          rowIndex: i + 1
        };
      }
    }
    
    throw new Error('找不到指定的投稿ID: ' + submissionId);
    
  } catch (error) {
    console.error('更新投稿狀態失敗:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 刪除投稿
 */
function deleteSubmission(submissionId) {
  try {
    console.log(`開始刪除投稿: ${submissionId}`);
    
    // 開啟試算表
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error('找不到工作表: ' + SHEET_NAME);
    }
    
    // 取得所有資料
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // 找到投稿ID欄位的索引
    const idColumnIndex = headers.indexOf('投稿ID');
    
    if (idColumnIndex === -1) {
      throw new Error('找不到投稿ID欄位');
    }
    
    // 找到要刪除的列
    let rowToDelete = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idColumnIndex] === submissionId) {
        rowToDelete = i + 1; // Google Sheets 的列號從 1 開始
        break;
      }
    }
    
    if (rowToDelete === -1) {
      throw new Error('找不到指定的投稿ID: ' + submissionId);
    }
    
    // 取得要刪除的資料（用於記錄）
    const deletedData = data[rowToDelete - 1];
    const displayName = deletedData[headers.indexOf('顯示名稱')] || '未知';
    
    // 刪除該列
    sheet.deleteRow(rowToDelete);
    
    // 清除快取（如果有使用快取功能）
    if (typeof clearCache === 'function') {
      clearCache();
    }
    
    console.log(`✅ 成功刪除投稿: ${submissionId}（第 ${rowToDelete} 列）- ${displayName}`);
    
    // 記錄刪除操作（可選）
    logDeletion(submissionId, displayName);
    
    return {
      success: true,
      message: '投稿已成功刪除',
      submissionId: submissionId,
      deletedRow: rowToDelete,
      displayName: displayName
    };
    
  } catch (error) {
    console.error('❌ 刪除投稿失敗:', error);
    return {
      success: false,
      error: error.toString(),
      submissionId: submissionId
    };
  }
}

/**
 * 記錄刪除操作（可選功能）
 */
function logDeletion(submissionId, displayName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 檢查是否有刪除記錄表
    let logSheet = spreadsheet.getSheetByName('刪除記錄');
    
    if (!logSheet) {
      // 建立刪除記錄表
      logSheet = spreadsheet.insertSheet('刪除記錄');
      
      // 設定標題
      const headers = [
        '刪除時間',
        '投稿ID',
        '顯示名稱',
        '刪除者',
        '備註'
      ];
      
      logSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // 設定標題格式
      const headerRange = logSheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#f44336');
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');
    }
    
    // 記錄刪除操作
    const logData = [
      new Date().toLocaleString('zh-TW'),
      submissionId,
      displayName,
      '管理員', // 如果有實作使用者追蹤，可以記錄實際操作者
      '從管理後台刪除'
    ];
    
    const lastRow = logSheet.getLastRow();
    logSheet.getRange(lastRow + 1, 1, 1, logData.length).setValues([logData]);
    
    console.log('已記錄刪除操作');
    
  } catch (error) {
    console.error('記錄刪除操作失敗:', error);
    // 不要因為記錄失敗而影響主要的刪除功能
  }
}

/**
 * 更新商品資訊（管理員功能）
 */
function updateProductInfo(submissionId, productInfo) {
  try {
    console.log(`更新商品資訊: ${submissionId}`);
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error('找不到工作表: ' + SHEET_NAME);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idColumnIndex = headers.indexOf('投稿ID') + 1;
    
    // 找到要更新的列
    for (let i = 1; i < data.length; i++) {
      if (data[i][idColumnIndex - 1] === submissionId) {
        // 更新各部位商品資訊
        if (productInfo.topProductInfo !== undefined) {
          const topInfoIndex = headers.indexOf('上衣商品資訊') + 1;
          const topTypeIndex = headers.indexOf('上衣商品類型') + 1;
          sheet.getRange(i + 1, topInfoIndex).setValue(productInfo.topProductInfo);
          sheet.getRange(i + 1, topTypeIndex).setValue(productInfo.topProductType || '');
        }
        
        if (productInfo.bottomProductInfo !== undefined) {
          const bottomInfoIndex = headers.indexOf('下身商品資訊') + 1;
          const bottomTypeIndex = headers.indexOf('下身商品類型') + 1;
          sheet.getRange(i + 1, bottomInfoIndex).setValue(productInfo.bottomProductInfo);
          sheet.getRange(i + 1, bottomTypeIndex).setValue(productInfo.bottomProductType || '');
        }
        
        if (productInfo.outerProductInfo !== undefined) {
          const outerInfoIndex = headers.indexOf('外套商品資訊') + 1;
          const outerTypeIndex = headers.indexOf('外套商品類型') + 1;
          sheet.getRange(i + 1, outerInfoIndex).setValue(productInfo.outerProductInfo);
          sheet.getRange(i + 1, outerTypeIndex).setValue(productInfo.outerProductType || '');
        }
        
        if (productInfo.shoesProductInfo !== undefined) {
          const shoesInfoIndex = headers.indexOf('鞋子商品資訊') + 1;
          const shoesTypeIndex = headers.indexOf('鞋子商品類型') + 1;
          sheet.getRange(i + 1, shoesInfoIndex).setValue(productInfo.shoesProductInfo);
          sheet.getRange(i + 1, shoesTypeIndex).setValue(productInfo.shoesProductType || '');
        }
        
        if (productInfo.accessoryProductInfo !== undefined) {
          const accessoryInfoIndex = headers.indexOf('配件商品資訊') + 1;
          const accessoryTypeIndex = headers.indexOf('配件商品類型') + 1;
          sheet.getRange(i + 1, accessoryInfoIndex).setValue(productInfo.accessoryProductInfo);
          sheet.getRange(i + 1, accessoryTypeIndex).setValue(productInfo.accessoryProductType || '');
        }
        
        console.log(`成功更新第 ${i + 1} 列的商品資訊`);
        
        return {
          success: true,
          message: '商品資訊更新成功',
          submissionId: submissionId
        };
      }
    }
    
    throw new Error('找不到指定的投稿ID: ' + submissionId);
    
  } catch (error) {
    console.error('更新商品資訊失敗:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 記錄訪客對特定部位的需求
 */
function recordItemWant(submissionId, itemType) {
  try {
    console.log(`記錄需求: ${submissionId} - ${itemType}`);
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error('找不到工作表: ' + SHEET_NAME);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idColumnIndex = headers.indexOf('投稿ID') + 1;
    
    // 對應部位的需求統計欄位
    const statsColumnMap = {
      'top': '上衣需求統計',
      'bottom': '下身需求統計',
      'outer': '外套需求統計',
      'shoes': '鞋子需求統計',
      'accessory': '配件需求統計'
    };
    
    const statsColumn = statsColumnMap[itemType];
    if (!statsColumn) {
      throw new Error('無效的部位類型: ' + itemType);
    }
    
    const statsColumnIndex = headers.indexOf(statsColumn) + 1;
    
    // 找到要更新的列
    for (let i = 1; i < data.length; i++) {
      if (data[i][idColumnIndex - 1] === submissionId) {
        // 獲取當前計數並增加1
        const currentCount = parseInt(data[i][statsColumnIndex - 1]) || 0;
        sheet.getRange(i + 1, statsColumnIndex).setValue(currentCount + 1);
        
        console.log(`成功更新第 ${i + 1} 列的${statsColumn}: ${currentCount + 1}`);
        
        return {
          success: true,
          message: '需求記錄成功',
          submissionId: submissionId,
          itemType: itemType,
          newCount: currentCount + 1
        };
      }
    }
    
    throw new Error('找不到指定的投稿ID: ' + submissionId);
    
  } catch (error) {
    console.error('記錄需求失敗:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 發送新投稿通知郵件
 */
function sendNewSubmissionEmail(data, submissionId) {
  try {
    // 取得管理員郵件列表
    const adminEmails = getAdminEmails();
    
    if (adminEmails.length === 0) {
      console.log('沒有管理員郵件地址，跳過郵件通知');
      return;
    }
    
    const subject = `新的穿搭投稿待審核 - ${data.displayName}`;
    const body = `
親愛的管理員，

有一個新的穿搭投稿需要您的審核：

投稿編號：${submissionId}
投稿者：${data.displayName}
會員Email：${data.memberEmail || ''}
身高：${data.height}cm
${data.weight ? '體重：' + data.weight + 'kg' : ''}
${data.avatarUrl ? '自訂頭像：已上傳' : '自訂頭像：使用預設'}
投稿時間：${new Date().toLocaleString('zh-TW')}

${data.comment ? '穿搭心得：' + data.comment : ''}
${data.instagramUrl ? 'Instagram：' + data.instagramUrl : ''}

商品資訊：
${data.topProductInfo ? '上衣：' + data.topProductInfo : ''}
${data.bottomProductInfo ? '下身：' + data.bottomProductInfo : ''}
${data.outerProductInfo ? '外套：' + data.outerProductInfo : ''}
${data.shoesProductInfo ? '鞋子：' + data.shoesProductInfo : ''}
${data.accessoryProductInfo ? '配件：' + data.accessoryProductInfo : ''}

請點擊以下連結進入管理後台進行審核：
${getManagementUrl()}

此郵件由系統自動發送，請勿回復。
    `;
    
    // 發送郵件給所有管理員
    adminEmails.forEach(email => {
      try {
        MailApp.sendEmail({
          to: email,
          subject: subject,
          body: body
        });
        console.log('成功發送通知郵件至:', email);
      } catch (emailError) {
        console.error('發送郵件失敗:', email, emailError);
      }
    });
    
  } catch (error) {
    console.error('發送新投稿通知郵件失敗:', error);
  }
}

/**
 * 取得管理員郵件列表
 */
function getAdminEmails() {
  try {
    const adminSheet = initializeAdminSheet();
    const data = adminSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const emailIndex = headers.indexOf('Email');
    const statusIndex = headers.indexOf('狀態');
    
    const emails = [];
    rows.forEach(row => {
      if (row[statusIndex] === 'active' && row[emailIndex]) {
        emails.push(row[emailIndex]);
      }
    });
    
    return emails;
    
  } catch (error) {
    console.error('取得管理員郵件列表失敗:', error);
    return [];
  }
}

/**
 * 取得管理後台 URL
 */
function getManagementUrl() {
  return 'https://www.takemejapan.com/pages/管理後台';
}

/**
 * 取得所有投稿資料（管理後台專用）
 */
function getAllOutfitsForAdmin() {
  try {
    console.log('管理後台：取得所有投稿資料...');
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      const result = {
        success: true,
        data: [],
        message: '尚無投稿資料'
      };
      
      const output = ContentService.createTextOutput();
      output.setMimeType(ContentService.MimeType.JSON);
      output.setContent(JSON.stringify(result));
      return output;
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const submissions = rows.map((row, index) => {
      const submission = { rowIndex: index + 2 }; // 記錄實際行號
      headers.forEach((header, headerIndex) => {
        submission[header] = row[headerIndex];
      });
      return submission;
    });
    
    console.log(`管理後台取得 ${submissions.length} 筆投稿資料`);
    
    const result = {
      success: true,
      data: submissions,
      count: submissions.length
    };
    
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify(result));
    return output;
      
  } catch (error) {
    console.error('取得所有投稿資料時發生錯誤:', error);
    
    const errorResult = {
      success: false,
      error: error.toString()
    };
    
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify(errorResult));
    return output;
  }
}

/**
 * ========== 互動系統相關函式 ==========
 */

/**
 * 初始化互動記錄表
 */
function initializeInteractionSheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let interactionSheet = spreadsheet.getSheetByName(INTERACTION_SHEET_NAME);
    
    if (!interactionSheet) {
      console.log('建立互動記錄表:', INTERACTION_SHEET_NAME);
      interactionSheet = spreadsheet.insertSheet(INTERACTION_SHEET_NAME);
      
      // 設定標題列
      const headers = [
        '記錄時間',
        '會員Email',
        '投稿ID',
        '互動類型',  // like, reference, purchase
        '狀態'       // active, cancelled
      ];
      
      interactionSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // 設定標題列格式
      const headerRange = interactionSheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#9b59b6');
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');
      
      console.log('互動記錄表初始化完成');
    }
    
    return interactionSheet;
    
  } catch (error) {
    console.error('初始化互動記錄表失敗:', error);
    throw error;
  }
}

/**
 * 處理用戶互動（按讚、參考、購買）
 */
function handleUserInteraction(data) {
  try {
    console.log('處理用戶互動:', data);
    
    const { memberEmail, submissionId, interactionType } = data;
    
    if (!memberEmail || !submissionId || !interactionType) {
      throw new Error('缺少必要參數');
    }

    // 取得或建立互動記錄表
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let interactionSheet = spreadsheet.getSheetByName(INTERACTION_SHEET_NAME);
    
    if (!interactionSheet) {
      initializeInteractionSheet();
      interactionSheet = spreadsheet.getSheetByName(INTERACTION_SHEET_NAME);
    }
    
    // 檢查是否已經有互動記錄
    const interactionData = interactionSheet.getDataRange().getValues();
    let existingRow = 0;
    
    for (let i = 1; i < interactionData.length; i++) {
      if (interactionData[i][1] === memberEmail && 
          interactionData[i][2] === submissionId && 
          interactionData[i][3] === interactionType) {
        existingRow = i + 1;
        break;
      }
    }
    
    let newCount = 0;
    let hasInteracted = false;
    
    // 投票邏輯：只能投票，不能取消
    if (interactionType === 'vote') {
      if (existingRow > 0) {
        return {
          success: false,
          error: '您已經投過票了'
        };
      }
      
      // 新增投票記錄
      const newRow = [
        new Date(),
        memberEmail,
        submissionId,
        interactionType,
        'active'
      ];
      
      interactionSheet.appendRow(newRow);
      console.log('已記錄投票:', newRow);
      
      newCount = updateInteractionCount(submissionId, 'vote', 1);
      hasInteracted = true;
      
      return {
        success: true,
        message: '投票成功',
        newCount: newCount,
        hasInteracted: hasInteracted,
        action: 'voted'
      };
    }
    
    // 其他互動邏輯：可以切換
    if (existingRow > 0) {
      // 已存在，刪除記錄（取消互動）
      interactionSheet.deleteRow(existingRow);
      console.log('已刪除互動記錄:', memberEmail, submissionId, interactionType);
      
      newCount = updateInteractionCount(submissionId, interactionType, -1);
      hasInteracted = false;
      
      return {
        success: true,
        message: '互動已取消',
        newCount: newCount,
        hasInteracted: hasInteracted,
        action: 'removed'
      };
    } else {
      // 不存在，新增記錄
      const newRow = [
        new Date(),
        memberEmail,
        submissionId,
        interactionType,
        'active'
      ];
      
      interactionSheet.appendRow(newRow);
      console.log('已新增互動記錄:', newRow);
      
      newCount = updateInteractionCount(submissionId, interactionType, 1);
      hasInteracted = true;
      
      return {
        success: true,
        message: '互動已記錄',
        newCount: newCount,
        hasInteracted: hasInteracted,
        action: 'added'
      };
    }
    
  } catch (error) {
    console.error('處理互動失敗:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 記錄用戶互動
 */
function recordInteraction(memberEmail, submissionId, interactionType) {
  try {
    const interactionSheet = initializeInteractionSheet();
    
    const rowData = [
      new Date().toLocaleString('zh-TW'),
      memberEmail,
      submissionId,
      interactionType,
      'active'
    ];
    
    const lastRow = interactionSheet.getLastRow();
    interactionSheet.getRange(lastRow + 1, 1, 1, rowData.length).setValues([rowData]);
    
    console.log('記錄互動成功:', memberEmail, submissionId, interactionType);
    
  } catch (error) {
    console.error('記錄互動失敗:', error);
    throw error;
  }
}

/**
 * 更新投稿的互動計數
 */
function updateInteractionCount(submissionId, interactionType, increment) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error('找不到工作表: ' + SHEET_NAME);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // 對應的欄位名稱
    const countMap = {
      'like': '按讚數',
      'reference': '參考數',
      'purchase': '購買數',
      'vote': '投票數'
    };
    
    const columnName = countMap[interactionType];
    if (!columnName) {
      throw new Error('無效的互動類型: ' + interactionType);
    }
    
    const idColumnIndex = headers.indexOf('投稿ID');
    if (idColumnIndex === -1) {
      throw new Error('找不到投稿ID欄位');
    }
    
    let countColumnIndex = headers.indexOf(columnName);
    
    // 如果欄位不存在，建立它
    if (countColumnIndex === -1) {
      const lastColumn = headers.length;
      sheet.getRange(1, lastColumn + 1).setValue(columnName);
      countColumnIndex = lastColumn; // 新欄位的索引
      
      // 為所有現有投稿初始化該欄位為 0
      const numRows = data.length;
      for (let i = 1; i < numRows; i++) {
        sheet.getRange(i + 1, countColumnIndex + 1).setValue(0);
      }
      
      console.log(`✅ 已新增 ${columnName} 欄位並初始化`);
      
      // 重新取得資料（因為新增了欄位）
      const updatedData = sheet.getDataRange().getValues();
      
      // 找到對應的投稿並更新
      for (let i = 1; i < updatedData.length; i++) {
        if (updatedData[i][idColumnIndex] === submissionId) {
          const newCount = 0 + increment; // 新欄位初始值是 0
          sheet.getRange(i + 1, countColumnIndex + 1).setValue(newCount);
          
          console.log(`更新 ${submissionId} 的 ${columnName}: 0 -> ${newCount}`);
          return newCount;
        }
      }
    } else {
      // 欄位已存在，直接更新
      for (let i = 1; i < data.length; i++) {
        if (data[i][idColumnIndex] === submissionId) {
          const currentCount = parseInt(data[i][countColumnIndex]) || 0;
          const newCount = currentCount + increment;
          
          sheet.getRange(i + 1, countColumnIndex + 1).setValue(newCount);
          
          console.log(`更新 ${submissionId} 的 ${columnName}: ${currentCount} -> ${newCount}`);
          return newCount;
        }
      }
    }
    
    throw new Error('找不到指定的投稿ID: ' + submissionId);
    
  } catch (error) {
    console.error('更新計數失敗:', error);
    throw error;
  }
}

/**
 * 取得用戶的所有互動記錄
 */
function getUserInteractions(memberEmail) {
  try {
    console.log('取得用戶互動記錄:', memberEmail);
    
    const interactionSheet = initializeInteractionSheet();
    const data = interactionSheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return {
        success: true,
        interactions: {}
      };
    }
    
    const headers = data[0];
    const emailIndex = headers.indexOf('會員Email');
    const submissionIndex = headers.indexOf('投稿ID');
    const typeIndex = headers.indexOf('互動類型');
    const statusIndex = headers.indexOf('狀態');
    
    const interactions = {};
    
    // 整理用戶的互動記錄
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailIndex] === memberEmail && data[i][statusIndex] === 'active') {
        const submissionId = data[i][submissionIndex];
        const interactionType = data[i][typeIndex];
        
        if (!interactions[submissionId]) {
          interactions[submissionId] = {};
        }
        
        interactions[submissionId][interactionType] = true;
      }
    }
    
    return {
      success: true,
      interactions: interactions
    };
    
  } catch (error) {
    console.error('取得互動記錄失敗:', error);
    return {
      success: false,
      error: error.toString(),
      interactions: {}
    };
  }
}

/**
 * ========== EasyStore API 相關函式 ==========
 */

/**
 * 根據官方文檔修正的客戶查詢函數
 * 注意：官方文檔沒有提供客戶搜尋 API，所以我們需要使用訂單來反查客戶
 */
function searchCustomerByEmail(email) {
  try {
    console.log(`🔍 透過訂單搜尋客戶: ${email}`);
    
    // ✅ 使用官方文檔的認證方式：EasyStore-Access-Token
    const options = {
      'method': 'GET',
      'headers': {
        'EasyStore-Access-Token': EASYSTORE_CONFIG.ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      'muteHttpExceptions': true
    };
    
    // 方法1: 嘗試透過訂單查找客戶（因為沒有直接的客戶搜尋 API）
    // 先取得最近的訂單，看能否找到該 email 的客戶
    const ordersUrl = `${EASYSTORE_CONFIG.BASE_API}/orders.json?limit=50&email=${encodeURIComponent(email)}`;
    console.log('🔗 訂單查詢 URL:', ordersUrl);
    
    const ordersResponse = UrlFetchApp.fetch(ordersUrl, options);
    const ordersStatusCode = ordersResponse.getResponseCode();
    const ordersResponseText = ordersResponse.getContentText();
    
    console.log('📡 訂單查詢狀態碼:', ordersStatusCode);
    console.log('📄 訂單回應前 200 字元:', ordersResponseText.substring(0, 200));
    
    if (ordersStatusCode === 200) {
      try {
        const ordersResult = JSON.parse(ordersResponseText);
        
        if (ordersResult.orders && ordersResult.orders.length > 0) {
          // 從訂單中取得客戶資訊
          const order = ordersResult.orders[0];
          if (order.customer_id && order.email === email) {
            
            // 取得完整的客戶資訊
            const customerUrl = `${EASYSTORE_CONFIG.BASE_API}/customers/${order.customer_id}.json`;
            console.log('🔗 客戶詳情 URL:', customerUrl);
            
            const customerResponse = UrlFetchApp.fetch(customerUrl, options);
            const customerStatusCode = customerResponse.getResponseCode();
            const customerResponseText = customerResponse.getContentText();
            
            if (customerStatusCode === 200) {
              const customerResult = JSON.parse(customerResponseText);
              
              if (customerResult.customer) {
                const customer = customerResult.customer;
                console.log('✅ 找到完整客戶資料:', customer.email);
                
                return {
                  success: true,
                  customer: {
                    id: customer.id,
                    email: customer.email || email,
                    firstName: customer.first_name || '',
                    lastName: customer.last_name || '',
                    phone: customer.phone || '',
                    name: customer.name || ((customer.first_name || '') + ' ' + (customer.last_name || '')).trim(),
                    totalSpent: customer.total_spent || '0.0',
                    orderCount: customer.order_count || 0,
                    acceptsMarketing: customer.accepts_marketing || false
                  }
                };
              }
            }
            
            // 如果無法取得完整客戶資料，使用訂單中的基本資訊
            return {
              success: true,
              customer: {
                id: order.customer_id,
                email: order.email,
                firstName: '',
                lastName: '',
                phone: '',
                name: order.email,
                totalSpent: '0.0',
                orderCount: 1,
                acceptsMarketing: false
              }
            };
          }
        }
        
        // 沒有找到訂單，但可能是已註冊但未購買的會員
        // 嘗試其他方式驗證會員身份（例如檢查會員系統）
        console.log('該 Email 沒有購買記錄，但可能是已註冊會員');
        return {
          success: true,
          customer: {
            id: null,
            email: email,
            firstName: '',
            lastName: '',
            phone: '',
            name: email,
            totalSpent: '0.0',
            orderCount: 0,
            acceptsMarketing: false,
            isNewMember: true // 標記為新會員（無購買記錄）
          },
          message: '會員驗證成功（無購買記錄）'
        };
        
      } catch (parseError) {
        console.error('解析訂單回應失敗:', parseError);
        return {
          success: false,
          error: '解析訂單資料失敗'
        };
      }
    } else {
      console.error(`❌ 訂單查詢失敗，狀態碼: ${ordersStatusCode}`);
      return {
        success: false,
        error: `訂單查詢失敗，狀態碼: ${ordersStatusCode}`,
        rawResponse: ordersResponseText.substring(0, 500)
      };
    }
    
  } catch (error) {
    console.error('❌ 客戶查詢失敗:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 根據官方文檔修正的訂單查詢函數
 */
function getCustomerOrders(customerId) {
  try {
    console.log(`📦 取得客戶訂單: ${customerId}`);
    
    // ✅ 使用官方文檔的格式和認證方式
    const url = `${EASYSTORE_CONFIG.BASE_API}/orders.json?customer_id=${customerId}&limit=50&fields=items,customer`;
    console.log('🔗 訂單 API URL:', url);
    
    const options = {
      'method': 'GET',
      'headers': {
        // ✅ 使用官方文檔的認證方式：EasyStore-Access-Token
        'EasyStore-Access-Token': EASYSTORE_CONFIG.ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      'muteHttpExceptions': true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log('📡 訂單查詢狀態碼:', statusCode);
    
    if (statusCode !== 200) {
      console.error(`❌ 訂單查詢失敗，狀態碼: ${statusCode}`);
      return {
        success: false,
        error: `訂單查詢失敗，狀態碼: ${statusCode}`,
        products: []
      };
    }
    
    const result = JSON.parse(responseText);
    console.log('📦 訂單查詢結果:', result);
    
    // 整理購買的商品資訊
    const purchasedProducts = [];
    
    if (result.orders && result.orders.length > 0) {
      result.orders.forEach(order => {
        if (order.line_items && order.line_items.length > 0) {
          order.line_items.forEach(item => {
            // 建構商品 URL
            const productUrl = item.product_url || 
                              `https://${EASYSTORE_CONFIG.STORE_URL}.easy.co/products/${item.handle || item.product_id}`;
            
            purchasedProducts.push({
              orderId: order.id,
              orderNumber: order.number || order.order_number,
              productId: item.product_id,
              variantId: item.variant_id,
              title: item.product_name || item.name || item.title,
              sku: item.sku,
              price: item.price,
              quantity: item.quantity,
              image: item.image_url || '',
              url: productUrl,
              purchaseDate: order.created_at || order.processed_at
            });
          });
        }
      });
    }
    
    console.log(`✅ 找到 ${purchasedProducts.length} 個購買商品`);
    
    return {
      success: true,
      products: purchasedProducts
    };
    
  } catch (error) {
    console.error('❌ 取得訂單失敗:', error);
    return {
      success: false,
      error: error.toString(),
      products: []
    };
  }
}

/**
 * 修復後的會員驗證函數
 */
function verifyMemberAndGetData(data) {
  try {
    const email = data.email;
    console.log('🔍 驗證會員並取得資料:', email);
    
    // 步驟 1: 搜尋客戶
    const customerResult = searchCustomerByEmail(email);
    
    if (!customerResult.success) {
      console.log('❌ 客戶搜尋失敗:', customerResult.message || customerResult.error);
      return {
        success: false,
        isLoggedIn: false,
        error: customerResult.message || customerResult.error || '找不到會員資料'
      };
    }
    
    console.log('✅ 找到客戶:', customerResult.customer.email);
    
    // 步驟 2: 取得訂單歷史
    const ordersResult = getCustomerOrders(customerResult.customer.id);
    console.log('📦 訂單搜尋結果:', ordersResult.success ? '成功' : '失敗');
    
    // 步驟 3: 取得用戶的互動記錄
    const interactionsResult = getUserInteractions(email);
    console.log('💬 互動記錄搜尋結果:', interactionsResult.success ? '成功' : '失敗');
    
    return {
      success: true,
      isLoggedIn: true,
      memberData: {
        ...customerResult.customer,
        purchasedProducts: ordersResult.products || []
      },
      interactions: interactionsResult.interactions || {}
    };
    
  } catch (error) {
    console.error('❌ 會員驗證失敗:', error);
    return {
      success: false,
      isLoggedIn: false,
      error: error.toString()
    };
  }
}

/**
 * 快速會員驗證（輕量級，只驗證基本身份）
 */
function quickVerifyMember(data) {
  try {
    const email = data.email;
    console.log('⚡ 執行快速會員驗證:', email);
    
    // 基本 Email 格式驗證
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        isLoggedIn: false,
        error: '無效的 Email 格式'
      };
    }
    
    // 檢查是否為已知的測試帳號或管理員
    const knownEmails = [
      'eddc9104@gmail.com',
      'vbt89679@gmail.com',
      'julie19971214@gmail.com'
    ];
    
    if (knownEmails.includes(email)) {
      console.log('✅ 已知會員，快速通過驗證');
      return {
        success: true,
        isLoggedIn: true,
        memberData: {
          email: email,
          name: email.split('@')[0],
          id: 'quick_' + Date.now(),
          isQuickVerify: true,
          totalSpent: '0.0',
          orderCount: 0
        },
        interactions: {}
      };
    }
    
    // 其他 Email 也給予基本通過（寬鬆策略）
    console.log('✅ 一般會員，基本驗證通過');
    return {
      success: true,
      isLoggedIn: true,
      memberData: {
        email: email,
        name: email.split('@')[0],
        id: 'user_' + Date.now(),
        isQuickVerify: true,
        totalSpent: '0.0',
        orderCount: 0,
        note: '快速驗證模式'
      },
      interactions: {}
    };
    
  } catch (error) {
    console.error('❌ 快速驗證失敗:', error);
    return {
      success: false,
      isLoggedIn: false,
      error: error.toString()
    };
  }
}

/**
 * 取得購買商品（給投稿表單用）
 */
function getCustomerPurchasedProducts(email) {
  try {
    const customerResult = searchCustomerByEmail(email);
    
    if (!customerResult.success) {
      return {
        success: false,
        products: []
      };
    }
    
    const ordersResult = getCustomerOrders(customerResult.customer.id);
    
    // 去重複，只保留唯一商品
    const uniqueProducts = {};
    
    if (ordersResult.products) {
      ordersResult.products.forEach(product => {
        // 用 SKU 或 productId 作為唯一識別
        const key = product.sku || product.productId;
        if (!uniqueProducts[key]) {
          uniqueProducts[key] = {
            id: product.productId,
            title: product.title,
            sku: product.sku,
            url: product.url,
            image: product.image
          };
        }
      });
    }
    
    return {
      success: true,
      products: Object.values(uniqueProducts)
    };
    
  } catch (error) {
    console.error('取得購買商品失敗:', error);
    return {
      success: false,
      error: error.toString(),
      products: []
    };
  }
}
/**
 * 強化版：取得客戶購買歷史並建構商品選單
 */
function getCustomerPurchasedProductsEnhanced(email) {
  try {
    console.log('🛍️ 開始取得客戶購買歷史:', email);
    
    // 步驟 1: 搜尋客戶
    const customer = searchCustomerByEmailEnhanced(email);
    if (!customer.success) {
      return {
        success: false,
        error: customer.error,
        products: []
      };
    }
    
    const customerId = customer.data.id;
    console.log('✅ 找到客戶ID:', customerId);
    
    // 步驟 2: 取得客戶訂單（包含商品詳情）
    const orders = getCustomerOrdersWithItems(customerId);
    if (!orders.success) {
      return {
        success: false,
        error: orders.error,
        products: []
      };
    }
    
    // 步驟 3: 整理購買商品清單
    const productList = buildPurchasedProductList(orders.data);
    
    console.log(`✅ 成功整理 ${productList.length} 個購買商品`);
    
    return {
      success: true,
      customer: customer.data,
      products: productList,
      totalOrders: orders.data.length
    };
    
  } catch (error) {
    console.error('❌ 取得購買歷史失敗:', error);
    return {
      success: false,
      error: error.toString(),
      products: []
    };
  }
}

/**
 * 強化版客戶搜尋
 */
function searchCustomerByEmailEnhanced(email) {
  try {
    const url = `${EASYSTORE_CONFIG.BASE_API}/customers/search.json?email=${encodeURIComponent(email)}`;
    
    const options = {
      'method': 'GET',
      'headers': {
        'EasyStore-Access-Token': EASYSTORE_CONFIG.ACCESS_TOKEN,
        'Content-Type': 'application/json'
      },
      'muteHttpExceptions': true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (statusCode !== 200) {
      throw new Error(`客戶搜尋失敗，狀態碼: ${statusCode}`);
    }
    
    const result = JSON.parse(responseText);
    
    if (result.customers && result.customers.length > 0) {
      return {
        success: true,
        data: result.customers[0]
      };
    } else {
      return {
        success: false,
        error: '找不到該 Email 的客戶記錄'
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 取得客戶訂單（含商品詳情）
 */
function getCustomerOrdersWithItems(customerId) {
  try {
    const url = `${EASYSTORE_CONFIG.BASE_API}/orders.json?customer_id=${customerId}&fields=items&financial_status=paid&limit=50`;
    
    const options = {
      'method': 'GET',
      'headers': {
        'EasyStore-Access-Token': EASYSTORE_CONFIG.ACCESS_TOKEN,
        'Content-Type': 'application/json'
      },
      'muteHttpExceptions': true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (statusCode !== 200) {
      throw new Error(`訂單查詢失敗，狀態碼: ${statusCode}`);
    }
    
    const result = JSON.parse(responseText);
    
    return {
      success: true,
      data: result.orders || []
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      data: []
    };
  }
}

/**
 * 建構購買商品清單
 */
function buildPurchasedProductList(orders) {
  const productMap = new Map(); // 用於去重複
  
  orders.forEach(order => {
    if (order.line_items && order.line_items.length > 0) {
      order.line_items.forEach(item => {
        const productKey = `${item.product_id}_${item.variant_id}`;
        
        if (!productMap.has(productKey)) {
          // 建構商品URL
          const productUrl = buildProductUrl(item.product_id, item.variant_id);
          
          productMap.set(productKey, {
            productId: item.product_id,
            variantId: item.variant_id,
            name: item.product_name,
            variantName: item.variant_name,
            sku: item.sku,
            price: item.price,
            image: item.image_url,
            url: productUrl,
            lastPurchaseDate: order.processed_at || order.created_at,
            totalQuantity: item.quantity
          });
        } else {
          // 如果已存在，更新數量
          const existing = productMap.get(productKey);
          existing.totalQuantity += item.quantity;
        }
      });
    }
  });
  
  // 轉換為陣列並按購買日期排序
  return Array.from(productMap.values()).sort((a, b) => {
    return new Date(b.lastPurchaseDate) - new Date(a.lastPurchaseDate);
  });
}

/**
 * 建構商品URL
 */
function buildProductUrl(productId, variantId) {
  try {
    // 取得商品詳情以獲得 handle
    const url = `${EASYSTORE_CONFIG.BASE_API}/products/${productId}.json`;
    
    const options = {
      'method': 'GET',
      'headers': {
        'EasyStore-Access-Token': EASYSTORE_CONFIG.ACCESS_TOKEN,
        'Content-Type': 'application/json'
      },
      'muteHttpExceptions': true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.product && result.product.handle) {
      // 建構完整的商品URL
      const baseUrl = `https://${EASYSTORE_CONFIG.STORE_URL}.easy.co/products/${result.product.handle}`;
      
      // 如果有特定規格，加上 variant 參數
      if (variantId) {
        return `${baseUrl}?variant=${variantId}`;
      }
      
      return baseUrl;
    }
    
    // 備用方案：使用 product_id
    return `https://${EASYSTORE_CONFIG.STORE_URL}.easy.co/products/${productId}`;
    
  } catch (error) {
    console.error('建構URL失敗:', error);
    // 備用方案
    return `https://${EASYSTORE_CONFIG.STORE_URL}.easy.co/products/${productId}`;
  }
}

/**
 * 更新原有的客戶購買商品函數（向後兼容）
 */
function getCustomerPurchasedProducts(email) {
  const result = getCustomerPurchasedProductsEnhanced(email);
  
  if (result.success) {
    return {
      success: true,
      products: result.products.map(item => ({
        id: item.productId,
        title: item.name,
        sku: item.sku,
        url: item.url,
        image: item.image
      }))
    };
  }
  
  return {
    success: false,
    error: result.error,
    products: []
  };
}

/**
 * 檢查商品是否仍然可用
 */
function checkProductAvailability(productId) {
  try {
    const url = `${EASYSTORE_CONFIG.BASE_API}/products/${productId}.json`;
    const options = {
      'method': 'GET',
      'headers': {
        'EasyStore-Access-Token': EASYSTORE_CONFIG.ACCESS_TOKEN,
        'Content-Type': 'application/json'
      },
      'muteHttpExceptions': true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    
    if (statusCode === 404) {
      return { available: false, reason: '商品已下架' };
    }
    
    if (statusCode !== 200) {
      return { available: false, reason: '無法確認商品狀態' };
    }
    
    const result = JSON.parse(response.getContentText());
    const product = result.product;
    
    // 檢查商品是否已發布
    if (!product.published_at) {
      return { available: false, reason: '商品未發布' };
    }
    
    return { 
      available: true, 
      product: product,
      url: `https://${EASYSTORE_CONFIG.STORE_URL}.easy.co/products/${product.handle}`
    };
    
  } catch (error) {
    return { available: false, reason: '檢查商品時發生錯誤' };
  }
}

/**
 * 測試函數
 */
function testPurchasedProductsIntegration() {
  const testEmail = "eddc9104@gmail.com";
  
  console.log('🧪 測試購買歷史整合...');
  const result = getCustomerPurchasedProductsEnhanced(testEmail);
  
  console.log('測試結果:', result);
  
  if (result.success) {
    console.log(`✅ 成功！找到 ${result.products.length} 個商品`);
    result.products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - ${product.url}`);
    });
  } else {
    console.log('❌ 失敗:', result.error);
  }
  
  return result;
}


/**
 * 根據官方文檔完全重寫的 API 測試函數
 */
function quickTestEasyStoreAPI() {
  console.log('🧪 根據官方文檔測試 EasyStore API...');
  console.log('📋 使用認證方式：EasyStore-Access-Token');
  console.log('🔗 API 版本：3.0');
  
  const testEmail = "eddc9104@gmail.com";
  
  try {
    // ✅ 使用官方文檔支援的訂單查詢（因為沒有客戶搜尋 API）
    const testUrl = `${EASYSTORE_CONFIG.BASE_API}/orders.json?limit=10&email=${encodeURIComponent(testEmail)}`;
    console.log('🔗 測試 URL:', testUrl);
    
    const options = {
      'method': 'GET',
      'headers': {
        // ✅ 使用官方文檔的認證方式
        'EasyStore-Access-Token': EASYSTORE_CONFIG.ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      'muteHttpExceptions': true
    };
    
    const response = UrlFetchApp.fetch(testUrl, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log('📡 狀態碼:', statusCode);
    console.log('📄 回應內容前 200 字元:', responseText.substring(0, 200));
    
    if (statusCode === 200) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ API 連線成功！');
        
        // 檢查是否有訂單資料
        if (result.orders && result.orders.length > 0) {
          const order = result.orders[0];
          console.log('✅ 找到訂單資料，客戶 Email:', order.email);
          console.log('📋 訂單資訊:', {
            id: order.id,
            number: order.number || order.order_number,
            email: order.email,
            customer_id: order.customer_id,
            total_amount: order.total_amount
          });
          
          return {
            success: true,
            message: 'EasyStore API 連線正常，找到訂單資料',
            orderData: {
              id: order.id,
              email: order.email,
              customer_id: order.customer_id,
              total_amount: order.total_amount,
              created_at: order.created_at
            },
            apiConnected: true,
            apiVersion: '3.0',
            endpoint: '/orders.json',
            authMethod: 'EasyStore-Access-Token'
          };
        } else {
          // 測試基本的 API 連線（不需要特定資料）
          const basicTestUrl = `${EASYSTORE_CONFIG.BASE_API}/orders.json?limit=1`;
          console.log('🔗 基本連線測試:', basicTestUrl);
          
          const basicResponse = UrlFetchApp.fetch(basicTestUrl, options);
          const basicStatusCode = basicResponse.getResponseCode();
          
          if (basicStatusCode === 200) {
            return {
              success: true,
              message: 'EasyStore API 連線正常，但該 Email 沒有訂單記錄',
              apiConnected: true,
              apiVersion: '3.0',
              endpoint: '/orders.json',
              authMethod: 'EasyStore-Access-Token',
              note: '客戶可能需要先完成購買才能驗證身份'
            };
          } else {
            return {
              success: false,
              error: '基本 API 連線失敗',
              statusCode: basicStatusCode
            };
          }
        }
        
      } catch (parseError) {
        console.error('JSON 解析失敗:', parseError);
        return {
          success: false,
          error: 'JSON 解析失敗：' + parseError.toString(),
          rawResponse: responseText.substring(0, 500)
        };
      }
    } else {
      console.error('❌ API 連線失敗，狀態碼:', statusCode);
      
      // 分析錯誤類型
      let errorType = '未知錯誤';
      if (statusCode === 401) {
        errorType = 'Access Token 無效或過期';
      } else if (statusCode === 403) {
        errorType = 'Access Token 權限不足';
      } else if (statusCode === 404) {
        errorType = 'API 端點不存在';
      } else if (responseText.toLowerCase().includes('html')) {
        errorType = '回應是 HTML，可能域名或路徑錯誤';
      }
      
      return {
        success: false,
        error: `API 連線失敗，狀態碼: ${statusCode}`,
        errorType: errorType,
        rawResponse: responseText.substring(0, 500),
        apiVersion: '3.0',
        endpoint: '/orders.json',
        authMethod: 'EasyStore-Access-Token'
      };
    }
    
  } catch (error) {
    console.error('❌ 測試失敗:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 全面測試不同 EasyStore API 端點格式
 */
function testAllEasyStoreFormats() {
  console.log('🔍 開始測試所有可能的 API 格式...');
  
  const testEmail = "eddc9104@gmail.com";
  const ACCESS_TOKEN = "f232b671b6cb3bb8151c23c2bd39129a";
  
  // 測試多種可能的 API 格式
  const testConfigs = [
    {
      name: "格式1: easy.co + v1 + search.json",
      url: `https://takemejapan.easy.co/api/v1/customers/search.json?email=${encodeURIComponent(testEmail)}`
    },
    {
      name: "格式2: easystore.co + v1 + search.json", 
      url: `https://takemejapan.easystore.co/api/v1/customers/search.json?email=${encodeURIComponent(testEmail)}`
    },
    {
      name: "格式3: easy.co + v1 + customers 直接查詢",
      url: `https://takemejapan.easy.co/api/v1/customers.json?email=${encodeURIComponent(testEmail)}`
    },
    {
      name: "格式4: easystore.co + v1 + customers 直接查詢",
      url: `https://takemejapan.easystore.co/api/v1/customers.json?email=${encodeURIComponent(testEmail)}`
    },
    {
      name: "格式5: easy.co + v3.0 + search.json",
      url: `https://takemejapan.easy.co/api/v3.0/customers/search.json?email=${encodeURIComponent(testEmail)}`
    },
    {
      name: "格式6: easystore.co + v3.0 + search.json",
      url: `https://takemejapan.easystore.co/api/v3.0/customers/search.json?email=${encodeURIComponent(testEmail)}`
    },
    {
      name: "格式7: 通用 API 格式",
      url: `https://api.easystore.co/v1/stores/takemejapan/customers/search.json?email=${encodeURIComponent(testEmail)}`
    }
  ];
  
  const results = {};
  
  testConfigs.forEach((config, index) => {
    console.log(`\n=== 測試 ${config.name} ===`);
    console.log(`URL: ${config.url}`);
    
    try {
      const options = {
        'method': 'GET',
        'headers': {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Google Apps Script/1.0'
        },
        'muteHttpExceptions': true
      };
      
      const response = UrlFetchApp.fetch(config.url, options);
      const statusCode = response.getResponseCode();
      const responseText = response.getContentText();
      const headers = response.getAllHeaders();
      
      console.log(`📡 狀態碼: ${statusCode}`);
      console.log(`📄 Content-Type: ${headers['Content-Type'] || headers['content-type'] || '未知'}`);
      console.log(`📄 回應前 100 字元: ${responseText.substring(0, 100)}`);
      
      // 判斷回應類型
      let isValidJSON = false;
      let parsedData = null;
      
      try {
        if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
          parsedData = JSON.parse(responseText);
          isValidJSON = true;
        }
      } catch (e) {
        isValidJSON = false;
      }
      
      const isHTML = responseText.toLowerCase().includes('<!doctype') || 
                     responseText.toLowerCase().includes('<html');
      
      results[config.name] = {
        success: statusCode === 200 && isValidJSON,
        statusCode: statusCode,
        isValidJSON: isValidJSON,
        isHTML: isHTML,
        contentType: headers['Content-Type'] || headers['content-type'],
        responsePreview: responseText.substring(0, 200),
        hasCustomersArray: parsedData && parsedData.customers ? true : false,
        dataStructure: parsedData ? Object.keys(parsedData) : null
      };
      
      if (results[config.name].success) {
        console.log('✅ 成功！這個格式有效');
        if (parsedData.customers && parsedData.customers.length > 0) {
          console.log('🎯 找到客戶資料！');
          console.log('客戶資訊:', parsedData.customers[0]);
        }
      } else {
        console.log('❌ 失敗');
        if (isHTML) {
          console.log('💡 回應是 HTML，可能端點不存在');
        }
        if (statusCode === 401) {
          console.log('🔑 認證失敗');
        }
        if (statusCode === 404) {
          console.log('🔍 端點不存在');
        }
      }
      
    } catch (error) {
      console.error(`❌ 請求失敗: ${error}`);
      results[config.name] = {
        success: false,
        error: error.toString()
      };
    }
    
    // 延遲避免 API 限制
    Utilities.sleep(1000);
  });
  
  console.log('\n🎯 測試結果總結:');
  console.log('==================');
  
  Object.keys(results).forEach(formatName => {
    const result = results[formatName];
    const status = result.success ? '✅ 成功' : '❌ 失敗';
    console.log(`${formatName}: ${status}`);
    if (result.success && result.hasCustomersArray) {
      console.log('  → 🎯 這個格式可以找到客戶資料！');
    }
  });
  
  // 找出成功的格式
  const successfulFormats = Object.keys(results).filter(key => results[key].success);
  
  if (successfulFormats.length > 0) {
    console.log(`\n🎉 找到 ${successfulFormats.length} 個有效的 API 格式:`);
    successfulFormats.forEach(format => {
      console.log(`✅ ${format}`);
    });
  } else {
    console.log('\n😞 沒有找到有效的 API 格式');
    console.log('🔧 建議檢查:');
    console.log('1. Access Token 是否正確');
    console.log('2. 商店名稱是否正確');
    console.log('3. API 權限是否足夠');
  }
  
  return results;
}

/**
 * 快速修復測試
 */
function quickFixTest() {
  const result = debugEasyStoreAPI();
  validateAccessToken();
  return result;
}

/**
 * 驗證 Access Token 是否有效
 */
function validateAccessToken() {
  console.log('🔑 驗證 Access Token...');
  
  const ACCESS_TOKEN = "f232b671b6cb3bb8151c23c2bd39129a";
  
  // 嘗試最簡單的 API 端點
  const testEndpoints = [
    "https://takemejapan.easy.co/api/3.0/store",
    "https://takemejapan.easy.co/api/3.0/customers?limit=1", 
    "https://takemejapan.easystore.co/api/3.0/customers?limit=1",
    "https://api.easystore.co/v3/stores/takemejapan/customers?limit=1"
  ];
  
  testEndpoints.forEach((url, index) => {
    console.log(`\n--- 測試端點 ${index + 1}: ${url} ---`);
    
    try {
      const options = {
        'method': 'GET',
        'headers': {
          'EasyStore-Access-Token': ACCESS_TOKEN,
          'Authorization': `Bearer ${ACCESS_TOKEN}`, // 備用驗證方式
          'Content-Type': 'application/json'
        },
        'muteHttpExceptions': true
      };
      
      const response = UrlFetchApp.fetch(url, options);
      const statusCode = response.getResponseCode();
      const responseText = response.getContentText();
      
      console.log(`狀態碼: ${statusCode}`);
      console.log(`回應預覽: ${responseText.substring(0, 150)}`);
      
      if (statusCode === 401) {
        console.log('❌ Token 無效或過期');
      } else if (statusCode === 403) {
        console.log('❌ Token 沒有權限');
      } else if (statusCode === 404) {
        console.log('❌ API 端點不存在');
      } else if (statusCode === 200) {
        if (responseText.trim().startsWith('{')) {
          console.log('✅ 成功！這個端點有效');
          return url; // 找到有效端點
        } else {
          console.log('⚠️ 200 狀態但非 JSON 回應');
        }
      }
      
    } catch (error) {
      console.error(`請求失敗: ${error}`);
    }
  });
}

/**
 * ========== 測試和管理函式 ==========
 */

/**
 * 手動初始化函式
 */
function manualInit() {
  console.log('開始手動初始化 v4.0...');
  
  try {
    // 初始化管理員資料表
    initializeAdminSheet();
    console.log('✅ 管理員資料表初始化完成');
    
    // 測試管理員登入
    const testResult = handleAdminLogin('admin', 'admin123');
    console.log('✅ 管理員登入測試:', testResult);
    
    // 列出所有管理員
    listAllAdmins();
    
    console.log('🎉 初始化完成！');
    
  } catch (error) {
    console.error('❌ 初始化失敗:', error);
  }
}

/**
 * 新增管理員帳號
 */
function addNewAdmin(username, password, email, role = 'reviewer') {
  try {
    console.log('開始新增管理員:', username);
    
    const adminSheet = initializeAdminSheet();
    
    // 檢查是否已存在相同帳號
    const data = adminSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    const usernameIndex = headers.indexOf('用戶名');
    
    for (let row of rows) {
      if (row[usernameIndex] === username) {
        throw new Error('帳號已存在: ' + username);
      }
    }
    
    // 準備新增的資料
    const rowData = [
      username,
      hashPassword(password),
      email,
      role,
      new Date().toISOString(),
      '',
      'active'
    ];
    
    // 新增到工作表
    const lastRow = adminSheet.getLastRow();
    adminSheet.getRange(lastRow + 1, 1, 1, rowData.length).setValues([rowData]);
    
    console.log('✅ 成功新增管理員:', username);
    console.log('📧 登入資訊：');
    console.log('帳號:', username);
    console.log('密碼:', password);
    console.log('郵件:', email);
    
    return {
      success: true,
      message: '管理員新增成功',
      username: username,
      email: email
    };
    
  } catch (error) {
    console.error('❌ 新增管理員失敗:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 列出所有管理員帳號
 */
function listAllAdmins() {
  try {
    const adminSheet = initializeAdminSheet();
    const data = adminSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    console.log('📋 所有管理員帳號：');
    console.log('=====================================');
    
    rows.forEach((row, index) => {
      const username = row[headers.indexOf('用戶名')];
      const email = row[headers.indexOf('Email')];
      const role = row[headers.indexOf('角色')];
      const status = row[headers.indexOf('狀態')];
      const lastLogin = row[headers.indexOf('最後登入')];
      
      console.log(`${index + 1}. 帳號: ${username}`);
      console.log(`   郵件: ${email}`);
      console.log(`   角色: ${role}`);
      console.log(`   狀態: ${status}`);
      console.log(`   最後登入: ${lastLogin || '從未登入'}`);
      console.log('-------------------------------------');
    });
    
  } catch (error) {
    console.error('❌ 列出管理員失敗:', error);
  }
}

/**
 * 建立測試投稿資料（含自訂頭像）
 */
function createTestSubmission() {
  try {
    console.log('建立測試投稿資料 v4.0...');
    
    const testData = {
      displayName: '測試用戶',
      height: '165',
      weight: '50',
      topSize: 'M',
      bottomSize: 'S',
      comment: '這是一個測試用的穿搭分享',
      imageUrl: 'https://placehold.jp/400x500/667eea/ffffff?text=測試穿搭',
      avatarUrl: 'https://placehold.jp/150x150/764ba2/ffffff?text=頭像',
      instagramUrl: 'https://instagram.com/test_user',
      memberEmail: 'test@example.com',
      memberPhone: '0912345678',
      topProductInfo: '白色棉質襯衫',
      topProductType: 'name',
      bottomProductInfo: '藍色牛仔褲',
      bottomProductType: 'name',
      submitTime: new Date().toISOString()
    };
    
    const result = handleOutfitSubmission(testData);
    console.log('✅ 測試投稿建立結果:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ 建立測試投稿失敗:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * 完整系統測試
 */
function runFullSystemTest() {
  try {
    console.log('🚀 開始完整系統測試 v4.0...');
    
    // 1. 初始化系統
    console.log('1. 初始化管理員系統...');
    initializeAdminSheet();
    
    // 2. 測試管理員登入
    console.log('2. 測試管理員登入...');
    const loginResult = handleAdminLogin('admin', 'admin123');
    console.log('登入測試結果:', loginResult);
    
    // 3. 建立測試投稿
    console.log('3. 建立測試投稿...');
    const submissionResult = createTestSubmission();
    console.log('投稿測試結果:', submissionResult);
    
    // 4. 測試取得投稿列表
    console.log('4. 測試取得投稿列表...');
    const mockGetRequest = { parameter: { action: 'getAllOutfits' } };
    const getResult = doGet(mockGetRequest);
    console.log('取得列表測試結果: 成功');
    
    // 5. 測試審核功能
    if (submissionResult.success && submissionResult.submissionId) {
      console.log('5. 測試審核功能...');
      const approveResult = updateSubmissionStatus(submissionResult.submissionId, '已通過');
      console.log('審核測試結果:', approveResult);
      
      // 6. 測試需求統計
      console.log('6. 測試需求統計...');
      const wantResult = recordItemWant(submissionResult.submissionId, 'top');
      console.log('需求統計測試結果:', wantResult);
    }
    
    console.log('🎉 完整系統測試完成！');
    
  } catch (error) {
    console.error('❌ 系統測試失敗:', error);
  }
}

/**
 * 一次性重置所有投稿的互動計數為 0
 */
function resetAllCountsToZero() {
  try {
    console.log('開始重置所有互動計數為 0...');
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error('找不到工作表: ' + SHEET_NAME);
    }
    
    // 取得標題列
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // 找到需要重置的欄位索引
    const loveColumnIndex = headers.indexOf('按讚數') + 1;
    const refColumnIndex = headers.indexOf('參考數') + 1;
    const purchaseColumnIndex = headers.indexOf('購買數') + 1;
    
    // 取得資料列數
    const lastRow = sheet.getLastRow();
    
    if (lastRow > 1) {
      // 批量更新所有列的計數為 0
      if (loveColumnIndex > 0) {
        const loveRange = sheet.getRange(2, loveColumnIndex, lastRow - 1, 1);
        const zeroArray = Array(lastRow - 1).fill([0]);
        loveRange.setValues(zeroArray);
        console.log('✅ 按讚數已重置為 0');
      }
      
      if (refColumnIndex > 0) {
        const refRange = sheet.getRange(2, refColumnIndex, lastRow - 1, 1);
        const zeroArray = Array(lastRow - 1).fill([0]);
        refRange.setValues(zeroArray);
        console.log('✅ 參考數已重置為 0');
      }
      
      if (purchaseColumnIndex > 0) {
        const purchaseRange = sheet.getRange(2, purchaseColumnIndex, lastRow - 1, 1);
        const zeroArray = Array(lastRow - 1).fill([0]);
        purchaseRange.setValues(zeroArray);
        console.log('✅ 購買數已重置為 0');
      }
    }
    
    // 清除快取
    clearCache();
    
    console.log('🎉 所有互動計數已成功重置為 0！');
    
    // 同時清空互動記錄表（如果需要的話）
    clearAllInteractionRecords();
    
    return {
      success: true,
      message: '所有互動計數已重置為 0',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('重置失敗:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 清空所有互動記錄（可選）
 */
function clearAllInteractionRecords() {
  try {
    console.log('清空互動記錄表...');
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let interactionSheet = spreadsheet.getSheetByName(INTERACTION_SHEET_NAME);
    
    if (interactionSheet) {
      const lastRow = interactionSheet.getLastRow();
      if (lastRow > 1) {
        // 保留標題列，刪除所有資料
        interactionSheet.deleteRows(2, lastRow - 1);
        console.log('✅ 互動記錄表已清空');
      }
    }
    
  } catch (error) {
    console.error('清空互動記錄失敗:', error);
  }
}

/**
 * 初始化互動系統（一次性執行）
 */
function initializeInteractionSystem() {
  console.log('🚀 開始初始化互動系統...');
  
  // 1. 初始化互動記錄表
  initializeInteractionSheet();
  
  // 2. 重置所有計數為 0
  resetAllCountsToZero();
  
  console.log('✅ 互動系統初始化完成！');
}

/**
 * 處理用戶互動（愛心、參考、購買、投票）
 */
function handleInteraction(data) {
  try {
    console.log('處理互動請求:', data);
    
    const { memberEmail, submissionId, interactionType } = data;
    
    if (!memberEmail || !submissionId || !interactionType) {
      throw new Error('缺少必要參數');
    }
    
    // 取得或建立互動記錄表
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let interactionSheet = spreadsheet.getSheetByName(INTERACTION_SHEET_NAME);
    
    if (!interactionSheet) {
      initializeInteractionSheet();
      interactionSheet = spreadsheet.getSheetByName(INTERACTION_SHEET_NAME);
    }
    
    // 檢查是否已經有互動記錄
    const interactionData = interactionSheet.getDataRange().getValues();
    let existingRow = 0;
    
    for (let i = 1; i < interactionData.length; i++) {
      if (interactionData[i][1] === memberEmail && 
          interactionData[i][3] === submissionId && 
          interactionData[i][4] === interactionType) {
        existingRow = i + 1;
        break;
      }
    }
    
    let newCount = 0;
    let hasInteracted = false;
    
    // 投票邏輯：只能投票，不能取消
    if (interactionType === 'vote') {
      if (existingRow > 0) {
        return {
          success: false,
          error: '您已經投過票了'
        };
      }
      
      // 新增投票記錄
      const newRow = [
        new Date(),
        memberEmail,
        '',
        submissionId,
        interactionType
      ];
      
      interactionSheet.appendRow(newRow);
      console.log('已記錄投票:', newRow);
      
      newCount = updateInteractionCount(submissionId, 'vote', 1);
      hasInteracted = true;
      
      return {
        success: true,
        message: '投票成功',
        newCount: newCount,
        hasInteracted: hasInteracted,
        action: 'voted'
      };
    }
    
    // 其他互動邏輯：可以切換
    if (existingRow > 0) {
      // 已存在，刪除記錄（取消互動）
      interactionSheet.deleteRow(existingRow);
      console.log('已刪除互動記錄:', memberEmail, submissionId, interactionType);
      
      newCount = updateInteractionCount(submissionId, interactionType, -1);
      hasInteracted = false;
      
      return {
        success: true,
        message: '互動已取消',
        newCount: newCount,
        hasInteracted: hasInteracted,
        action: 'removed'
      };
    } else {
      // 不存在，新增記錄
      const newRow = [
        new Date(),
        memberEmail,
        '',
        submissionId,
        interactionType
      ];
      
      interactionSheet.appendRow(newRow);
      console.log('已新增互動記錄:', newRow);
      
      newCount = updateInteractionCount(submissionId, interactionType, 1);
      hasInteracted = true;
      
      return {
        success: true,
        message: '互動已記錄',
        newCount: newCount,
        hasInteracted: hasInteracted,
        action: 'added'
      };
    }
    
  } catch (error) {
    console.error('處理互動失敗:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 更新互動計數
 */
function updateInteractionCount(submissionId, interactionType, change) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // 找到對應的欄位
    const countColumnMap = {
      'like': '按讚數',
      'reference': '參考數', 
      'purchase': '購買數',
      'vote': '投票數'
    };
    
    const columnName = countColumnMap[interactionType];
    const columnIndex = headers.indexOf(columnName);
    
    if (columnIndex === -1) {
      // 如果欄位不存在，先建立欄位
      headers.push(columnName);
      sheet.getRange(1, headers.length).setValue(columnName);
      
      // 為所有現有行初始化為0
      for (let i = 2; i <= sheet.getLastRow(); i++) {
        sheet.getRange(i, headers.length).setValue(0);
      }
      
      // 重新取得資料
      const newColumnIndex = headers.length - 1;
      
      // 找到對應的投稿並更新
      for (let i = 1; i < data.length; i++) {
        if (data[i][1] === submissionId) { // 假設投稿ID在第2欄
          const currentCount = Math.max(0, (data[i][newColumnIndex] || 0) + change);
          sheet.getRange(i + 1, newColumnIndex + 1).setValue(currentCount);
          console.log(`已更新 ${columnName}:`, currentCount);
          return currentCount;
        }
      }
    } else {
      // 欄位存在，更新計數
      for (let i = 1; i < data.length; i++) {
        if (data[i][1] === submissionId) { // 假設投稿ID在第2欄
          const currentCount = Math.max(0, (data[i][columnIndex] || 0) + change);
          sheet.getRange(i + 1, columnIndex + 1).setValue(currentCount);
          console.log(`已更新 ${columnName}:`, currentCount);
          return currentCount;
        }
      }
    }
    
    return 0;
    
  } catch (error) {
    console.error('更新計數失敗:', error);
    return 0;
  }
}