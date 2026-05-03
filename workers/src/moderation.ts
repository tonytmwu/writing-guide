/**
 * moderation.ts
 *
 * OpenAI Moderation API 輔助函數。
 * 免費使用，涵蓋 11 類有害內容偵測。
 */

/** 檢查文字是否觸發 OpenAI Moderation。
 *  回傳 true 表示「需要攔截」。
 *  若 API 呼叫失敗（網路問題等），預設放行（fail-open），避免誤傷正常使用者。
 */
export async function isFlagged(text: string, apiKey: string): Promise<boolean> {
  try {
    const resp = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: text }),
    })

    if (!resp.ok) return false // fail-open

    const data = await resp.json() as ModerationResponse
    return data.results?.[0]?.flagged ?? false
  } catch {
    return false // fail-open
  }
}

// ── OpenAI Moderation API Response 型別 ──────────────────────────
interface ModerationResponse {
  results: Array<{
    flagged: boolean
    categories: Record<string, boolean>
    category_scores: Record<string, number>
  }>
}
