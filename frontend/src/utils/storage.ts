import type { EssayRecord, AIConfig, AIProvider } from '../types'

const AI_CONFIG_KEY = 'writing_guide_ai_config'
const HISTORY_KEY = 'writing_guide_history'
const ACCESS_TOKEN_KEY = 'writing_guide_access_token'

// ---------- AI Config (provider + key) ----------

export function getAIConfig(): AIConfig | null {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AIConfig
  } catch {
    return null
  }
}

export function saveAIConfig(config: AIConfig): void {
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config))
}

export function removeAIConfig(): void {
  localStorage.removeItem(AI_CONFIG_KEY)
}

// 向下相容：舊版只存 key（v1.5 預設改為 openai）
export function getApiKey(): string | null {
  return getAIConfig()?.apiKey ?? null
}

export function getProvider(): AIProvider {
  return getAIConfig()?.provider ?? 'openai'
}

// ---------- Essay History ----------

export function getHistory(): EssayRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    return JSON.parse(raw) as EssayRecord[]
  } catch {
    return []
  }
}

export function saveRecord(record: EssayRecord): void {
  const history = getHistory()
  const idx = history.findIndex(r => r.id === record.id)
  if (idx >= 0) {
    history[idx] = record
  } else {
    history.unshift(record)
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

export function getRecord(id: string): EssayRecord | null {
  return getHistory().find(r => r.id === id) ?? null
}

export function deleteRecord(id: string): void {
  const history = getHistory().filter(r => r.id !== id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

// ---------- BFF Access Token（Stage 2 密碼驗證）----------

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function saveAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function removeAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

// ---------- 清除所有本機紀錄 ----------

export function clearAllLocalData(): void {
  localStorage.removeItem(AI_CONFIG_KEY)
  localStorage.removeItem(HISTORY_KEY)
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}
