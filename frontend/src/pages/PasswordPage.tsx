/**
 * PasswordPage.tsx
 *
 * Stage 2 上線模式的訪問保護頁。
 * 輸入密碼後呼叫 Worker /api/verify，成功則存入 localStorage 並跳轉首頁。
 *
 * 設計原則：
 * - 不是真的帳號系統，只是「撿到網址也不能用」的基本防禦
 * - 密碼由爸爸設定在 Workers 環境變數 ACCESS_PASSWORD
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveAccessToken } from '../utils/storage'

const BFF_URL = import.meta.env.VITE_BFF_URL as string

export default function PasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) return

    setLoading(true)
    setError(null)

    try {
      const resp = await fetch(`${BFF_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      })

      if (resp.ok) {
        saveAccessToken(password.trim())
        navigate('/', { replace: true })
      } else {
        setError('密碼不對喔，再試一次！')
        setPassword('')
      }
    } catch {
      setError('連線失敗，請稍後再試。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="setup-page">
      <div className="setup-card">
        <div className="setup-header">
          <span className="setup-icon">🐰</span>
          <h1>小兔兔作文引導</h1>
        </div>

        <div className="setup-section">
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            請輸入密碼才能進入喔！
          </p>

          <form onSubmit={handleSubmit} className="setup-form">
            <div className="input-group">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="輸入密碼"
                autoFocus
                disabled={loading}
                className="key-input"
                style={{ textAlign: 'center', letterSpacing: '0.2em' }}
              />
            </div>

            {error && (
              <p style={{ color: 'var(--error)', textAlign: 'center', marginTop: '0.75rem' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !password.trim()}
              style={{ marginTop: '1rem', width: '100%' }}
            >
              {loading ? '驗證中...' : '進入 🐰'}
            </button>
          </form>
        </div>

        <div className="setup-footer" style={{ marginTop: '2rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            你的對話內容會送到 OpenAI 處理，不會被儲存。
          </p>
        </div>
      </div>
    </div>
  )
}
