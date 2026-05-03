import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHistory } from '../utils/storage'

// Edie 已完成的作文 PDF 列表（放在 public/history/）
const EDIE_ESSAYS = [
  { title: '黏土捏捏的心得',                       file: '作文大綱_黏土捏捏的心得.pdf' },
  { title: '參加一個比賽',                          file: '作文大綱_參加一個比賽.pdf' },
  { title: '十三行博物館參觀心得',                  file: '作文大綱_十三行博物館參觀心得.pdf' },
  { title: '寫一封信給老師，希望爭取才藝表演的機會', file: '作文大綱_寫一封信給老師，希望爭取才藝表演的機會.pdf' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [topic, setTopic] = useState('')
  const history = getHistory()
  const isComposingRef = useRef(false) // 注音 / 輸入法組字中

  function handleStart() {
    const t = topic.trim()
    if (!t) return
    // 將題目透過 URL state 傳給 ChatPage
    navigate('/chat', { state: { topic: t } })
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
  }

  return (
    <div className="home-page">
      {/* 右上角設定 icon */}
      <button
        className="settings-icon"
        onClick={() => navigate('/setup')}
        title="API Key 設定"
        aria-label="設定"
      >
        ⚙️
      </button>

      {/* 主角區 */}
      <div className="hero">
        <div className="bunny-avatar large">🐰</div>
        <h1 className="app-title">小兔兔寫作幫手</h1>
        <p className="app-subtitle">讓小兔兔陪你想想要寫什麼！</p>
      </div>

      {/* 輸入區 */}
      <div className="topic-input-area">
        <input
          type="text"
          className="topic-input"
          placeholder="今天想寫什麼題目？"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          onCompositionStart={() => { isComposingRef.current = true }}
          onCompositionEnd={() => { isComposingRef.current = false }}
          onKeyDown={e => { if (e.key === 'Enter' && !isComposingRef.current) handleStart() }}
          maxLength={60}
        />
        <button
          className="btn btn-start"
          onClick={handleStart}
          disabled={!topic.trim()}
        >
          開始 →
        </button>
      </div>

      {/* 歷史列表 */}
      {history.length > 0 && (
        <div className="history-section">
          <h2 className="section-title">我寫過的作文</h2>
          <ul className="history-list">
            {history.map(record => (
              <li
                key={record.id}
                className="history-item"
                onClick={() => navigate(`/results/${record.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' && !isComposingRef.current) navigate(`/results/${record.id}`) }}
              >
                <span className="history-topic">📝 {record.topic}</span>
                <span className="history-date">{formatDate(record.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Edie 作文紀錄 PDF 區塊 */}
      <div className="essay-archive-section">
        <h2 className="section-title">📚 Edie 的作文集</h2>
        <ul className="essay-archive-list">
          {EDIE_ESSAYS.map(essay => (
            <li key={essay.file} className="essay-archive-item">
              <a
                href={`/history/${encodeURIComponent(essay.file)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="essay-archive-link"
              >
                <span className="essay-archive-icon">📄</span>
                <span className="essay-archive-title">{essay.title}</span>
                <span className="essay-archive-badge">PDF</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
