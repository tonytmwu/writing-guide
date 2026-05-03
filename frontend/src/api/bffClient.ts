/**
 * bffClient.ts
 *
 * Stage 2 BFF 模式的 API Client。
 * 呼叫 Cloudflare Workers BFF，帶 X-Access-Token header。
 *
 * 端點：
 *   POST {BFF_URL}/chat     — SSE 串流對話
 *   POST {BFF_URL}/generate — 結果生成（JSON）
 *
 * 切換判斷：App.tsx 和 llmClient.ts 呼叫端透過 VITE_BFF_URL 環境變數決定要用哪個 client。
 */

import type { ChatMessage, WritingGrid, MindMapData } from '../types'
import { getAccessToken } from '../utils/storage'

const BFF_URL = import.meta.env.VITE_BFF_URL as string

// ── Chat（SSE 串流）────────────────────────────────────────────────

/**
 * 向 BFF /chat 發送對話，以手動 SSE 解析的方式逐字回呼 onChunk。
 * Worker 直接 pipe OpenAI 的 SSE stream，格式與 OpenAI 原生相同。
 */
export async function sendChatBFF(
  messages: ChatMessage[],
  onChunk: (chunk: string) => void
): Promise<string> {
  const token = getAccessToken()
  if (!token) throw new Error('尚未驗證密碼')

  const response = await fetch(`${BFF_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Access-Token': token,
    },
    body: JSON.stringify({ messages }),
  })

  if (!response.ok) {
    const errText = await response.text()
    if (response.status === 401) throw new Error('AUTH_EXPIRED')
    if (response.status === 503) throw new Error('RATE_LIMIT')
    throw new Error(`BFF error ${response.status}: ${errText}`)
  }

  // 判斷是否為非串流的 fallback JSON（Moderation 命中時 Worker 回傳 JSON）
  const contentType = response.headers.get('Content-Type') ?? ''
  if (contentType.includes('application/json')) {
    const json = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
    const content = json.choices?.[0]?.message?.content ?? ''
    onChunk(content)
    return content
  }

  // 手動 SSE 解析
  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // SSE 以 \n\n 分隔 event
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? '' // 保留尚未完整的末端

    for (const part of parts) {
      for (const line of part.split('\n')) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string } }>
          }
          const delta = parsed.choices?.[0]?.delta?.content
          if (delta) {
            fullText += delta
            onChunk(delta)
          }
        } catch {
          // 跳過無法解析的 chunk
        }
      }
    }
  }

  // 處理 buffer 中殘留的最後一個 event
  if (buffer.trim()) {
    for (const line of buffer.split('\n')) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') continue
      try {
        const parsed = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>
        }
        const delta = parsed.choices?.[0]?.delta?.content
        if (delta) {
          fullText += delta
          onChunk(delta)
        }
      } catch { /* skip */ }
    }
  }

  return fullText
}

// ── Generate Results（JSON）────────────────────────────────────────

/**
 * 向 BFF /generate 發送對話紀錄，取得起承轉合四宮格 / 心智圖 / 條列筆記。
 */
export async function generateResultsBFF(
  topic: string,
  messages: ChatMessage[]
): Promise<{ writingGrid: WritingGrid; mindMap: MindMapData; notes: string[] }> {
  const token = getAccessToken()
  if (!token) throw new Error('尚未驗證密碼')

  const response = await fetch(`${BFF_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Access-Token': token,
    },
    body: JSON.stringify({ topic, messages }),
  })

  if (!response.ok) {
    const errText = await response.text()
    if (response.status === 401) throw new Error('AUTH_EXPIRED')
    if (response.status === 503) throw new Error('RATE_LIMIT')
    throw new Error(`BFF generate error ${response.status}: ${errText}`)
  }

  // Worker 直接回傳 generate_writing_scaffold 的 input 參數（JSON）
  const raw = await response.json() as {
    four_structure: {
      qi:    { hint: string; points: string[] }
      cheng: { hint: string; points: string[] }
      zhuan: { hint: string; points: string[] }
      he:    { hint: string; points: string[] }
    }
    mind_map: {
      center: string
      branches: { topic: string; keywords: string[] }[]
    }
    bullet_notes: string[]
  }

  return {
    writingGrid: {
      qi:    raw.four_structure.qi,
      cheng: raw.four_structure.cheng,
      zhuan: raw.four_structure.zhuan,
      he:    raw.four_structure.he,
    },
    mindMap: raw.mind_map,
    notes: raw.bullet_notes,
  }
}
