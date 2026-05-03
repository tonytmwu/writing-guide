/**
 * index.ts — 小兔兔 BFF Worker
 *
 * 端點：
 *   POST /api/verify   — 密碼驗證
 *   POST /api/chat     — SSE 串流對話（OpenAI gpt-5.4-mini）
 *   POST /api/generate — 結果生成（OpenAI Function Calling，回傳 JSON）
 *
 * 環境變數（Secrets）：
 *   OPENAI_API_KEY    — OpenAI API Key
 *   ACCESS_PASSWORD   — 前端訪問密碼
 *
 * 環境變數（Vars）：
 *   DAILY_REQUEST_LIMIT — 每日 request 上限（預設 1000）
 *   ALLOWED_ORIGIN      — 允許的前端 Origin（空字串 = 全開放）
 *
 * KV Namespace：
 *   RATE_LIMIT_KV — 日流量計數器
 */

import type { Env, ChatRequestBody, GenerateRequestBody } from './types'
import { isFlagged } from './moderation'
import { BUNNY_SYSTEM_PROMPT, RESULT_SYSTEM_PROMPT, RESULT_TOOL, buildConversationText } from './prompts'

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions'
const CHAT_MODEL = 'gpt-5.4-mini'

// ── CORS ─────────────────────────────────────────────────────────

function corsHeaders(env: Env): Record<string, string> {
  const origin = env.ALLOWED_ORIGIN?.trim() || '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Access-Token',
  }
}

function handleOptions(env: Env): Response {
  return new Response(null, { status: 204, headers: corsHeaders(env) })
}

// ── 密碼驗證 ──────────────────────────────────────────────────────

function verifyToken(req: Request, env: Env): boolean {
  const token = req.headers.get('X-Access-Token') ?? ''
  return token === env.ACCESS_PASSWORD
}

// ── Rate Limiting（KV-based 日流量上限）─────────────────────────

async function checkRateLimit(env: Env): Promise<boolean> {
  try {
    const limit = parseInt(env.DAILY_REQUEST_LIMIT ?? '1000', 10)
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const key = `daily:${today}`

    const raw = await env.RATE_LIMIT_KV.get(key)
    const count = parseInt(raw ?? '0', 10)

    if (count >= limit) return false // 超過上限

    // 非同步更新計數（TTL 25 小時，自動過期）
    await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: 90000 })
    return true
  } catch {
    // KV 不可用時 fail-open（允許通過），不影響正常使用
    return true
  }
}

// ── Fallback Response（Moderation 命中時的小兔兔回應）─────────────

function moderationFallback(cors: Record<string, string>): Response {
  const body = {
    id: 'moderation-fallback',
    object: 'chat.completion',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: '小主人，這個話題我們換一下吧～你今天想寫什麼作文題目呢？',
      },
      finish_reason: 'stop',
    }],
  }
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...cors },
  })
}

// ── Handler：POST /api/verify ─────────────────────────────────────

async function handleVerify(req: Request, env: Env): Promise<Response> {
  const cors = corsHeaders(env)
  try {
    const body = await req.json() as { password?: string }
    if (body.password === env.ACCESS_PASSWORD) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...cors },
      })
    }
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...cors },
    })
  } catch {
    return new Response('Bad Request', { status: 400, headers: cors })
  }
}

// ── Handler：POST /api/chat（SSE Streaming）───────────────────────

async function handleChat(req: Request, env: Env): Promise<Response> {
  const cors = corsHeaders(env)

  // 1. 密碼驗證
  if (!verifyToken(req, env)) {
    return new Response('Unauthorized', { status: 401, headers: cors })
  }

  // 2. Rate Limiting
  const allowed = await checkRateLimit(env)
  if (!allowed) {
    return new Response('Too Many Requests', { status: 503, headers: cors })
  }

  // 3. 解析 body
  let body: ChatRequestBody
  try {
    body = await req.json() as ChatRequestBody
  } catch {
    return new Response('Bad Request', { status: 400, headers: cors })
  }

  // 4. 輸入 Moderation（取最後一則使用者訊息）
  const lastUserMsg = [...body.messages].reverse().find(m => m.role === 'user')?.content ?? ''
  if (lastUserMsg && await isFlagged(lastUserMsg, env.OPENAI_API_KEY)) {
    return moderationFallback(cors)
  }

  // 5. 轉送 OpenAI，直接 pipe SSE 回前端
  const openaiResp = await fetch(OPENAI_CHAT_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      max_completion_tokens: 800,
      stream: true,
      messages: [
        { role: 'system', content: BUNNY_SYSTEM_PROMPT },
        ...body.messages.map(m => ({ role: m.role, content: m.content })),
      ],
    }),
  })

  if (!openaiResp.ok) {
    const errText = await openaiResp.text()
    return new Response(`OpenAI Error: ${errText}`, {
      status: openaiResp.status,
      headers: cors,
    })
  }

  // 直接 pipe SSE stream 給前端
  return new Response(openaiResp.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
      ...cors,
    },
  })
}

// ── Handler：POST /api/generate（Function Calling，回傳 JSON）─────

async function handleGenerate(req: Request, env: Env): Promise<Response> {
  const cors = corsHeaders(env)

  // 1. 密碼驗證
  if (!verifyToken(req, env)) {
    return new Response('Unauthorized', { status: 401, headers: cors })
  }

  // 2. Rate Limiting
  const allowed = await checkRateLimit(env)
  if (!allowed) {
    return new Response('Too Many Requests', { status: 503, headers: cors })
  }

  // 3. 解析 body
  let body: GenerateRequestBody
  try {
    body = await req.json() as GenerateRequestBody
  } catch {
    return new Response('Bad Request', { status: 400, headers: cors })
  }

  // 4. 輸入 Moderation（對話摘要前幾百字）
  const conversationSample = body.messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' ')
    .slice(0, 500)

  if (conversationSample && await isFlagged(conversationSample, env.OPENAI_API_KEY)) {
    return new Response(JSON.stringify({ error: 'Content flagged' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...cors },
    })
  }

  // 5. 呼叫 OpenAI Function Calling（不 streaming）
  const openaiResp = await fetch(OPENAI_CHAT_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      max_completion_tokens: 4096,
      tools: [RESULT_TOOL],
      tool_choice: { type: 'function', function: { name: RESULT_TOOL.function.name } },
      messages: [
        { role: 'system', content: RESULT_SYSTEM_PROMPT },
        { role: 'user', content: buildConversationText(body.topic, body.messages) },
      ],
    }),
  })

  if (!openaiResp.ok) {
    const errText = await openaiResp.text()
    return new Response(`OpenAI Error: ${errText}`, {
      status: openaiResp.status,
      headers: cors,
    })
  }

  // 6. 解析 Function Call 結果
  const data = await openaiResp.json() as OpenAIFunctionResponse
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0]
  if (!toolCall) {
    return new Response(JSON.stringify({ error: 'No tool call returned' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...cors },
    })
  }

  let parsedArgs: unknown
  try {
    parsedArgs = JSON.parse(toolCall.function.arguments)
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to parse tool arguments' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...cors },
    })
  }

  return new Response(JSON.stringify(parsedArgs), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...cors },
  })
}

// ── 主入口 ────────────────────────────────────────────────────────

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    const path = url.pathname

    // Preflight
    if (req.method === 'OPTIONS') return handleOptions(env)

    // 路由
    if (req.method === 'POST') {
      if (path === '/api/verify')   return handleVerify(req, env)
      if (path === '/api/chat')     return handleChat(req, env)
      if (path === '/api/generate') return handleGenerate(req, env)
    }

    return new Response('Not Found', { status: 404 })
  },
} satisfies ExportedHandler<Env>

// ── 型別補充 ──────────────────────────────────────────────────────

interface OpenAIFunctionResponse {
  choices: Array<{
    message: {
      tool_calls?: Array<{
        function: {
          name: string
          arguments: string
        }
      }>
    }
  }>
}
