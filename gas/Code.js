/** ==== Outfit 個人頁：最小回應（先用 demo，之後改讀你的資料表） ==== */
function _op_buildProfileResponse_(handle) {
  return {
    profile: {
      profile_id: 'P001',
      handle: handle || '@demo',
      display_name: 'Demo 使用者',
      size_card: { height_cm: 170, top: 'M', bottom: 'L' },
      stats: { followers: 3, looks: 2 }
    },
    looks: [
      { look_id:'L1001', cover:'https://picsum.photos/400?1', size_summary:'Top M / Bottom L', metrics:{ likes:10, refs:2, pm:1 } },
      { look_id:'L1002', cover:'https://picsum.photos/400?2', size_summary:'Top M / Bottom L', metrics:{ likes:7,  refs:1, pm:0 } }
    ]
  };
}

/** 小工具：輸出 JSON（若你專案已有 json() 可以改用原本的） */
function _op_json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 你的入口：只要在這支 doGet 裡面加分支就好（不要新開第二個 doGet） */
function doGet(e) {
  var route = (e && e.parameter && (e.parameter.route || '')).toLowerCase();

  // === 新增：個人頁 API ===
  if (route === 'profile') {
    var handle = (e.parameter && e.parameter.handle) || '@demo';
    return (typeof json === 'function' ? json : _op_json_)(_op_buildProfileResponse_(handle));
  }

  // TODO: 這裡放你原本的穿搭牆路由（保留既有邏輯）
  return _op_json_({ ok: true, message: 'GAS scaffold 正常運作', route: route || '(none)' });
}
