/**
 * App.tsx
 *
 * 路由設定。支援兩種模式：
 *
 * MVP 模式（VITE_BFF_URL 未設定）：
 *   使用者需自行輸入 API Key → /setup 頁
 *
 * BFF 模式（VITE_BFF_URL 有值，例如 /api 或 http://localhost:8787/api）：
 *   使用密碼保護頁 → /password 頁
 *   所有 LLM 呼叫走 Cloudflare Workers BFF
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getAIConfig, getAccessToken } from './utils/storage'
import ApiKeySetupPage from './pages/ApiKeySetupPage'
import PasswordPage from './pages/PasswordPage'
import HomePage from './pages/HomePage'
import ChatPage from './pages/ChatPage'
import ResultsPage from './pages/ResultsPage'

// 是否為 BFF 模式（由 Vite 環境變數決定）
const IS_BFF_MODE = Boolean(import.meta.env.VITE_BFF_URL)

// ── MVP 模式：RequireApiKey ────────────────────────────────────────
function RequireApiKey({ children }: { children: React.ReactNode }) {
  const key = getAIConfig()?.apiKey
  if (!key) return <Navigate to="/setup" replace />
  return <>{children}</>
}

// ── BFF 模式：RequirePassword ─────────────────────────────────────
function RequirePassword({ children }: { children: React.ReactNode }) {
  const token = getAccessToken()
  if (!token) return <Navigate to="/password" replace />
  return <>{children}</>
}

// ── Guard：根據模式選擇對應的驗證 ─────────────────────────────────
function Guard({ children }: { children: React.ReactNode }) {
  if (IS_BFF_MODE) return <RequirePassword>{children}</RequirePassword>
  return <RequireApiKey>{children}</RequireApiKey>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 進入點：根據模式決定設定頁 */}
        {IS_BFF_MODE
          ? <Route path="/password" element={<PasswordPage />} />
          : <Route path="/setup" element={<ApiKeySetupPage />} />
        }

        <Route path="/" element={<Guard><HomePage /></Guard>} />
        <Route path="/chat" element={<Guard><ChatPage /></Guard>} />
        <Route path="/results/:id" element={<Guard><ResultsPage /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
