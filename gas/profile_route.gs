/**
 * Outfit 個人頁 API scaffold.
 * MVP 版本以靜態資料模擬，後續可改接 Google Sheets。
 */

var PROFILE_DEMO_LOOKS = [
  {
    look_id: "L1001",
    profile_id: "P001",
    title: "Weekend Layering",
    cover: "https://picsum.photos/seed/look1/600/800",
    size_summary: "身高 170 ｜ 上衣 M ｜ 下身 L",
    metrics: { likes: 10, refs: 2, pm: 1 },
  },
  {
    look_id: "L1002",
    profile_id: "P001",
    title: "Soft Neutrals",
    cover: "https://picsum.photos/seed/look2/600/800",
    size_summary: "身高 170 ｜ 上衣 M ｜ 下身 L",
    metrics: { likes: 7, refs: 1, pm: 0 },
  },
];

function respondJson(payload) {
  var output = JSON.stringify(payload || {});
  var result = ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
  if (typeof json === "function") {
    return json(payload);
  }
  return result;
}

function respondError(message, status) {
  return respondJson({ error: message, status: status || 400 });
}

function logProfile(message, data) {
  if (typeof Logger === "undefined") {
    return;
  }
  if (data !== undefined) {
    Logger.log("[PROFILE] %s %s", message, JSON.stringify(data));
  } else {
    Logger.log("[PROFILE] %s", message);
  }
}

function buildProfile(handle) {
  return {
    profile_id: "P001",
    handle: handle || "@demo",
    display_name: "Demo 使用者",
    avatar_url: "",
    size_card: { height_cm: 170, weight_kg: 60, top: "M", bottom: "L", shoe_size_jp: 27 },
    stats: { followers: 3, looks: PROFILE_DEMO_LOOKS.length },
  };
}

function handleGetProfile(e) {
  var handle = (e.parameter && e.parameter.handle) || "@demo";
  logProfile("getProfile", { handle: handle });
  var profile = buildProfile(handle);
  var looks = PROFILE_DEMO_LOOKS;
  return respondJson({ profile: profile, looks: looks });
}

function handleGetLooks(e) {
  var profileId = (e.parameter && e.parameter.profile_id) || "P001";
  var page = parseInt((e.parameter && e.parameter.page) || "1", 10) || 1;
  var pageSize = parseInt((e.parameter && e.parameter.page_size) || "24", 10) || 24;
  logProfile("getLooks", { profileId: profileId, page: page, pageSize: pageSize });

  var offset = (page - 1) * pageSize;
  var items = PROFILE_DEMO_LOOKS.slice(offset, offset + pageSize);
  return respondJson({ items: items, pagination: { page: page, page_size: pageSize, total: PROFILE_DEMO_LOOKS.length } });
}

function handleGetLook(e) {
  var lookId = e.parameter && e.parameter.look_id;
  if (!lookId) {
    return respondError("缺少 look_id", 400);
  }
  logProfile("getLook", { lookId: lookId });
  var found = PROFILE_DEMO_LOOKS.filter(function (item) {
    return item.look_id === lookId;
  })[0];
  if (!found) {
    return respondError("查無此穿搭", 404);
  }
  return respondJson({ look: found });
}

function doGet(e) {
  var route = (e && e.parameter && (e.parameter.route || "")).toLowerCase();

  if (route === "profile") {
    return handleGetProfile(e);
  }
  if (route === "looks") {
    return handleGetLooks(e);
  }
  if (route === "look") {
    return handleGetLook(e);
  }

  // TODO: 保留既有穿搭牆邏輯
  return respondJson({ ok: true, message: "GAS scaffold 正常運作", route: route || "(none)" });
}

function doPost(e) {
  var route = (e && e.parameter && (e.parameter.route || "")).toLowerCase();
  var body = {};
  if (e && e.postData && e.postData.contents) {
    if (e.postData.type === "application/json") {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (err) {
        return respondError("Invalid JSON", 400);
      }
    } else {
      body = e.parameter || {};
    }
  }

  logProfile("post", { route: route, body: body });

  if (route === "like" || route === "ref" || route === "purchase_mark") {
    return respondJson({ ok: true, route: route });
  }
  if (route === "follow" || route === "unfollow") {
    return respondJson({ ok: true, route: route });
  }

  return respondError("Not Found", 404);
}
