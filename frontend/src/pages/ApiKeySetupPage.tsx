import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { testApiKey } from '../api/llmClient'
import { getAIConfig, saveAIConfig, removeAIConfig } from '../utils/storage'

// v1.5：暫時切換至 OpenAI，設定頁簡化為 OpenAI 專用
// 切回 Claude 時，將 PROVIDER 改為 'claude' 並更新說明文字即可
const PROVIDER = 'openai' as const

export default function ApiKeySetupPage() {
  const navigate = useNavigate()
  const existing = getAIConfig()

  const [key, setKey] = useState(existing?.apiKey ?? '')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleTest() {
    if (!key.trim()) return
    setTesting(true)
    setTestResult(null)
    const result = await testApiKey(PROVIDER, key.trim())
    setTesting(false)
    setTestResult(
      result.ok
        ? { ok: true, message: '✅ 連線成功！API Key 有效。' }
        : { ok: false, message: `❌ 連線失敗：${result.error ?? '未知錯誤'}` }
    )
  }

  function handleSave() {
    if (!key.trim()) return
    setSaving(true)
    saveAIConfig({ provider: PROVIDER, apiKey: key.trim() })
    setTimeout(() => navigate('/'), 300)
  }

  function handleRemove() {
    removeAIConfig()
    setKey('')
    setTestResult(null)
  }

  return (
    <div className="setup-page">
      <div className="setup-card">
        <div className="setup-header">
          <span className="setup-icon">⚙️</span>
          <h1>請爸爸媽媽協助設定</h1>
        </div>

        <div className="setup-section">
          <h2>輸入 OpenAI API Key</h2>
          <p>
            小兔兔需要透過 OpenAI 的 AI 服務才能運作。請爸媽前往{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
            >
              OpenAI API Keys 頁面
            </a>{' '}
            申請一組 API Key，貼到下方後儲存即可。
          </p>
          <p className="setup-hint">
            💡 費用依使用量計算，一般家庭使用量極少（每次對話約 NT$0.3 以內）。
            Key 只存在這個瀏覽器裡，不會傳到其他地方。
          </p>

          <div className="input-group">
            <input
              type="password"
              value={key}
              onChange={e => { setKey(e.target.value); setTestResult(null) }}
              placeholder="sk-proj-..."
              className="api-key-input"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoComplete="off"
            />
          </div>

          {testResult && (
            <div className={`test-result ${testResult.ok ? 'success' : 'error'}`}>
              {testResult.message}
            </div>
          )}

          <div className="setup-actions">
            <button
              className="btn btn-secondary"
              onClick={handleTest}
              disabled={!key.trim() || testing}
            >
              {testing ? '測試中…' : '測試連線'}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!key.trim() || saving}
            >
              {saving ? '儲存中…' : '儲存並開始使用'}
            </button>
          </div>

          {existing && (
            <button className="btn btn-danger-text" onClick={handleRemove}>
              移除目前的設定
            </button>
          )}
        </div>

        {existing && (
          <button className="btn btn-ghost" onClick={() => navigate('/')}>
            ← 返回首頁
          </button>
        )}
      </div>
    </div>
  )
}
