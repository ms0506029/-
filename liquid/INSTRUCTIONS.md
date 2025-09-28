# EasyStore 貼上說明（Outfit 個人頁）

## 一次性設定
1. 在 EasyStore 後台 → 主題 → 編輯程式碼。
2. 新增一個 Page（或現有自訂頁），標題建議：Outfit 個人頁。
3. 將 `liquid/outfit-profile.liquid` 內容完整貼入該頁的 HTML 區塊。

## 使用方式
- 以網址參數指定使用者：`/pages/outfit-profile?handle=@demo`
- 或者，直接在 snippet 容器上填 `data-handle="@demo"`，不帶參數也可。

## GitHub Pages 路徑
- 你的 Pages 打包的是 `frontend/` 目錄。
- 前端檔案網址示例：
  - `https://ms0506029.github.io/<repo>/outfit-profile.js`

> 每次你更新 `frontend/outfit-profile.js`，GitHub Actions 會自動部署。EasyStore 這個頁面不用再改。
