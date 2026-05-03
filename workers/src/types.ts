export interface Env {
  // Secrets（wrangler secret put）
  OPENAI_API_KEY: string
  ACCESS_PASSWORD: string

  // KV Namespace
  RATE_LIMIT_KV: KVNamespace

  // Vars
  DAILY_REQUEST_LIMIT: string
  ALLOWED_ORIGIN: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequestBody {
  messages: ChatMessage[]
}

export interface GenerateRequestBody {
  topic: string
  messages: ChatMessage[]
}
