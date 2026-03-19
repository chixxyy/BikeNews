# 🚴 BikeNews — 自行車即時新聞聚合器

一個以 Vue 3 + TypeScript + Vite 建構的自行車媒體即時新聞儀表板。聚合多家知名自行車媒體 RSS，透過第三方 rss2json 服務繞過 CORS 限制，提供即時的賽事與器材新聞。

---

## 🚀 快速開始

```bash
# 安裝依賴
npm install

# 啟動開發伺服器（http://localhost:5173）
npm run dev

# TypeScript 類型檢查
npm run type-check

# 建置生產環境
npm run build

# 預覽生產環境建置
npm run preview
```

---

## ✅ 功能

| 功能 | 說明 |
|------|------|
| 📡 RSS 即時新聞 | 每 60 秒自動從 5 家媒體更新，帶 Cache-Busting 防快取 |
| 🗂️ 分類篩選 | 全部 / 賽事（黃） / 器材（青）三種顏色標籤 |
| 🔴 嚴重程度 | Critical / High / Low 三段 Severity 篩選 |
| 🔍 搜尋 | 即時搜尋新聞標題 |
| 🌐 中文翻譯 | 一鍵呼叫 MyMemory API 翻譯標題與摘要 |
| 🌙 深色/淺色模式 | 使用 @vueuse/core useDark 切換，記憶使用者偏好 |
| 📱 響應式設計 | 支援手機、平板、桌面裝置 |
| 🔗 最新戰報跳轉 | Header 最新戰報區塊可直接點擊跳轉原文 |

---

## 📰 新聞來源

| 媒體 | RSS 端點 | 分類 |
|------|---------|------|
| [Cyclingnews](https://www.cyclingnews.com) | `/rss.xml` | 賽事 |
| [Velo (Outside Network)](https://velo.outsideonline.com) | `/feed/` | 賽事 |
| [Pinkbike](https://www.pinkbike.com) | `/pinkbike_xml_feed.php` | 器材 |
| [Bikerumor](https://bikerumor.com) | `/feed/` | 器材 |
| [road.cc](https://road.cc) | `/rss` | 器材 |

> **注意**：RSS 透過免費 [rss2json API](https://rss2json.com/) 代理，免費版每次回傳 10 筆新聞。付費版可使用 `count=100` 參數。

---

## 🛠️ 技術棧

- **Vue 3** + Script Setup
- **TypeScript**
- **Vite** (開發伺服器 + 打包)
- **Tailwind CSS v4**
- **Lucide Vue Next** (圖示)
- **@vueuse/core** (useDark / useToggle)

---

## 🧪 實時性驗證腳本

要確認資料源是否能拉到最新資料，執行以下指令（不依賴瀏覽器）：

```bash
node /tmp/test_realtime.mjs
```

> 如果腳本不存在，請參考 `src/services/rssService.ts` 的 FEEDS 設定自行建立。

---

## 📁 專案結構

```
BikeNews/
├── src/
│   ├── components/
│   │   └── BikeNews.vue       # 主要 UI 元件（篩選、卡片、翻譯）
│   ├── services/
│   │   └── rssService.ts      # RSS 抓取、解析、型別定義
│   ├── App.vue
│   ├── main.ts
│   └── style.css              # Tailwind CSS 入口
├── vite.config.ts             # Vite 設定（含 Proxy）
├── tsconfig.json
└── package.json
```
