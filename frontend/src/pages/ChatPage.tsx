import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { sendChat, generateResults } from '../api/llmClient'
import { sendChatBFF, generateResultsBFF } from '../api/bffClient'
import { getAIConfig, saveRecord, removeAccessToken } from '../utils/storage'
import type { ChatMessage } from '../types'

const IS_BFF_MODE = Boolean(import.meta.env.VITE_BFF_URL)
const MAX_QUESTIONS = 10
const END_MARKER = '[END]'

export default function ChatPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const topic: string = (location.state as { topic?: string })?.topic ?? ''

  // MVP 模式才需要 apiKey / provider；BFF 模式不需要
  const aiConfig = IS_BFF_MODE ? null : getAIConfig()
  const apiKey = aiConfig?.apiKey ?? null
  const provider = aiConfig?.provider ?? 'openai'
  const recordIdRef = useRef<string>(crypto.randomUUID())

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questionCount, setQuestionCount] = useState(0)
  const isComposingRef = useRef(false)   // 注音 / 輸入法組字中
  const hasStartedRef  = useRef(false)   // 防止 StrictMode 在 dev 模式下 useEffect 跑兩次

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 沒有 topic 就返回首頁；MVP 模式還要確認 apiKey
  useEffect(() => {
    if (!topic) navigate('/')
    if (!IS_BFF_MODE && !apiKey) navigate('/setup')
  }, [topic, apiKey, navigate])

  // 初始化：小兔兔發第一句話（hasStartedRef 確保只跑一次）
  useEffect(() => {
    if (!topic) return
    if (!IS_BFF_MODE && !apiKey) return
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    startConversation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 每次訊息更新自動捲到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function startConversation() {
    const initMessages: ChatMessage[] = [
      { role: 'user', content: `我今天要寫的作文題目是：「${topic}」` },
    ]
    setMessages([])
    await streamBunnyReply(initMessages)
  }

  /** 將訊息送給 AI，用 streaming 方式顯示回應 */
  async function streamBunnyReply(history: ChatMessage[]) {
    if (!IS_BFF_MODE && !apiKey) return

    setIsStreaming(true)
    setError(null)

    // 先加一個空白的 assistant 訊息，之後逐字填入
    const placeholder: ChatMessage = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, placeholder])

    let fullText = ''
    try {
      if (IS_BFF_MODE) {
        fullText = await sendChatBFF(history, chunk => {
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: 'assistant',
              content: updated[updated.length - 1].content + chunk,
            }
            return updated
          })
        })
      } else {
        fullText = await sendChat(provider, apiKey!, history, chunk => {
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: 'assistant',
              content: updated[updated.length - 1].content + chunk,
            }
            return updated
          })
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      // BFF 模式：token 過期時跳回密碼頁
      if (IS_BFF_MODE && msg === 'AUTH_EXPIRED') {
        removeAccessToken()
        navigate('/password', { replace: true })
        return
      }
      setError(`小兔兔說話出錯了：${msg}`)
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: '（小兔兔這裡出了一點問題，請稍後再試 😢）',
        }
        return updated
      })
      setIsStreaming(false)
      return
    }

    setIsStreaming(false)
    setQuestionCount(c => c + 1)

    // 偵測 [END] 或達到上限 → 自動結束
    if (fullText.includes(END_MARKER) || questionCount + 1 >= MAX_QUESTIONS) {
      // 清掉 [END] 標記和 <thinking> 區塊再顯示
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: cleanContent(updated[updated.length - 1].content),
        }
        return updated
      })
      setTimeout(() => goToResults(history), 800)
    }

    inputRef.current?.focus()
  }

  async function handleSend(userInput: string) {
    const text = userInput.trim()
    if (!text || isStreaming || isGenerating) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')

    await streamBunnyReply(newMessages)
  }

  async function handleSkip() {
    if (isStreaming || isGenerating) return
    await handleSend('跳過')
  }

  async function goToResults(currentMessages?: ChatMessage[]) {
    if (!IS_BFF_MODE && !apiKey) return
    const finalMessages = currentMessages ?? messages

    setIsGenerating(true)
    setError(null)

    try {
      const { writingGrid, mindMap, notes } = IS_BFF_MODE
        ? await generateResultsBFF(topic, finalMessages)
        : await generateResults(provider, apiKey!, topic, finalMessages)

      const record = {
        id: recordIdRef.current,
        topic,
        createdAt: new Date().toISOString(),
        messages: finalMessages,
        writingGrid,
        mindMap,
        notes,
      }
      saveRecord(record)
      navigate(`/results/${record.id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (IS_BFF_MODE && msg === 'AUTH_EXPIRED') {
        removeAccessToken()
        navigate('/password', { replace: true })
        return
      }
      setError(`生成重點整理時出錯：${msg}`)
      setIsGenerating(false)
    }
  }

  /** 清理顯示用的訊息內容：去掉 <thinking>...</thinking> 區塊和 [END] 標記 */
  function cleanContent(content: string) {
    return content
      .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
      .replace(END_MARKER, '')
      .trim()
  }

  if (!topic) return null

  return (
    <div className="chat-page">
      {/* 頂部 Header */}
      <div className="chat-header">
        <div className="bunny-avatar small">🐰</div>
        <div className="chat-header-info">
          <span className="chat-bunny-name">小兔兔</span>
          <span className="chat-topic">題目：{topic}</span>
        </div>
      </div>

      {/* 對話區 */}
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-row ${msg.role}`}>
            {msg.role === 'assistant' && (
              <div className="msg-avatar">🐰</div>
            )}
            <div className={`message-bubble ${msg.role}`}>
              {cleanContent(msg.content)}
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="generating-notice">
            ✨ 小兔兔正在幫你整理重點，請稍候…
          </div>
        )}

        {error && (
          <div className="error-notice">{error}</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 輸入區 */}
      <div className="chat-input-area">
        <div className="chat-action-btns">
          <button
            className="btn btn-skip"
            onClick={handleSkip}
            disabled={isStreaming || isGenerating}
          >
            跳過這題
          </button>
          <button
            className="btn btn-finish"
            onClick={() => goToResults()}
            disabled={isStreaming || isGenerating || messages.length < 2}
          >
            我想寫了！✏️
          </button>
        </div>
        <div className="chat-input-row">
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder="輸入你的回答…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onCompositionStart={() => { isComposingRef.current = true }}
            onCompositionEnd={() => { isComposingRef.current = false }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !isComposingRef.current) handleSend(input)
            }}
            disabled={isStreaming || isGenerating}
            maxLength={300}
          />
          <button
            className="btn btn-send"
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isStreaming || isGenerating}
          >
            送出
          </button>
        </div>
      </div>
    </div>
  )
}
