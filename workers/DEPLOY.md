# 小兔兔 BFF Worker — 部署指南

## 一次性設定

### 1. 安裝 Wrangler CLI
```bash
npm install -g wrangler
wrangler login
```

### 2. 安裝 Worker 相依套件
```bash
cd workers
npm install
```

### 3. 建立 KV Namespace（日流量計數器）
```bash
# 正式環境
wrangler kv namespace create RATE_LIMIT_KV

# 本地預覽環境
wrangler kv namespace create RATE_LIMIT_KV --preview
```

把輸出的 `id` 和 `preview_id` 填入 `wrangler.toml`：
```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "你的正式 namespace id"
preview_id = "你的預覽 namespace id"
```

### 4. 設定 Secrets（API Key & 訪問密碼）
```bash
# OpenAI API Key（真實的 Key，只存在 Cloudflare 後台，不會進版本控制）
wrangler secret put OPENAI_API_KEY

# 前端訪問密碼（自定義一個密碼給女兒用，例如 "bunny2025"）
wrangler secret put ACCESS_PASSWORD
```

### 5. 設定 wrangler.toml 的 ALLOWED_ORIGIN
部署後把 Cloudflare Pages 的 URL 填入 `wrangler.toml`：
```toml
[vars]
ALLOWED_ORIGIN = "https://your-app.pages.dev"
```

---

## 本地開發

### 啟動 Worker 本地模擬
```bash
cd workers
wrangler dev
# Worker 在 http://localhost:8787 運行
```

### 啟動前端（BFF 模式）
```bash
cd frontend
cp .env.bff.example .env.local   # 已設定 VITE_BFF_URL=http://localhost:8787/api
npm run dev
# 前端在 http://localhost:5173 運行
```

本地開發時 wrangler dev 會自動讀取 `.dev.vars`（如果存在），
可以建立 `workers/.dev.vars`（**不要提交進 git**）：
```
OPENAI_API_KEY=sk-...
ACCESS_PASSWORD=your-local-password
```

---

## 部署

### 部署 Worker
```bash
cd workers
wrangler deploy
```

### 部署前端到 Cloudflare Pages
```bash
cd frontend

# 生產環境 build（VITE_BFF_URL 指向同網域 /api）
VITE_BFF_URL=/api npm run build

# 部署到 Pages
wrangler pages deploy ./dist --project-name writing-guide
```

或在 Cloudflare Pages Dashboard 設定環境變數 `VITE_BFF_URL=/api`，
連接 GitHub repo 自動部署。

---

## Cloudflare Pages + Workers 路由設定

Pages 和 Workers 部署在同網域時，需要在 Pages 設定路由把 `/api/*` 轉給 Worker：

1. Cloudflare Dashboard → Pages → 你的專案 → Settings → Functions
2. KV Namespace Bindings：不需要（KV 是 Worker 的）
3. Workers Routes（或用 `_routes.json`）：

建立 `frontend/public/_routes.json`：
```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/api/*"]
}
```

然後在 Worker 的 `wrangler.toml` 設定路由（或透過 Dashboard 設定）：
```toml
routes = [
  { pattern = "your-app.pages.dev/api/*", zone_name = "pages.dev" }
]
```

---

## 環境變數一覽

| 變數 | 設定方式 | 說明 |
|------|---------|------|
| `OPENAI_API_KEY` | `wrangler secret put` | OpenAI API Key（機密）|
| `ACCESS_PASSWORD` | `wrangler secret put` | 前端訪問密碼（機密）|
| `DAILY_REQUEST_LIMIT` | `wrangler.toml [vars]` | 每日 request 上限（預設 1000）|
| `ALLOWED_ORIGIN` | `wrangler.toml [vars]` | 允許的前端 Origin（空字串=全開放）|
| `RATE_LIMIT_KV` | KV namespace binding | 日流量計數器 |

---

## 費用預估（單人使用）

| 服務 | 費用 |
|------|------|
| Cloudflare Workers | $0（免費額度 100K req/日）|
| Cloudflare Pages | $0（免費）|
| OpenAI Moderation API | $0（免費）|
| OpenAI Chat API（gpt-5.4-mini）| ~< $3 USD / 月 |
| **月總計** | **< NT$100** |
