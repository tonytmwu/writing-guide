import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import { getRecord } from '../utils/storage'
import MindMap, { MindMapList } from '../components/MindMap'
import type { GridSection } from '../types'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

type Tab = 'grid' | 'summary' | 'chat'

const GRID_CONFIG: { key: keyof ReturnType<typeof getGridSections>; label: string; color: string; emoji: string }[] = [
  { key: 'qi',    label: '起', color: '#EBF5FF', emoji: '🌱' },
  { key: 'cheng', label: '承', color: '#EDFBF0', emoji: '🌿' },
  { key: 'zhuan', label: '轉', color: '#FFF4E6', emoji: '⚡' },
  { key: 'he',    label: '合', color: '#F5EEFF', emoji: '🌟' },
]

function getGridSections(record: NonNullable<ReturnType<typeof getRecord>>) {
  return record.writingGrid ?? {
    qi:    { hint: '', points: [] },
    cheng: { hint: '', points: [] },
    zhuan: { hint: '', points: [] },
    he:    { hint: '', points: [] },
  }
}

/** 相容舊資料：notes 可能是 string（舊）或 string[]（新） */
function getNotes(record: NonNullable<ReturnType<typeof getRecord>>): string[] {
  const raw = record.notes as unknown
  if (Array.isArray(raw)) return raw as string[]
  if (typeof raw === 'string' && raw.trim()) {
    // 舊格式：按行分割，過濾空行
    return raw.split('\n').map(l => l.replace(/^[-•📌#\s*]+/, '').trim()).filter(Boolean)
  }
  return []
}

/** 相容舊資料：GridSection 欄位可能是 hint（新）或 tip（舊） */
function getHint(section: GridSection): string {
  return section.hint ?? (section as unknown as { tip?: string }).tip ?? ''
}

// ---- PDF：將 ReactNode 渲染成 canvas（動態建立 / 銷毀 DOM）----
async function renderToCanvas(jsx: React.ReactNode): Promise<HTMLCanvasElement> {
  const wrapper = document.createElement('div')
  // position: absolute + 超大負 top，讓元素完全在可視區域外，但不影響 html2canvas 捕捉
  wrapper.style.cssText = `
    position: absolute;
    top: -99999px;
    left: 0;
    width: 900px;
    background: #ffffff;
  `
  document.body.appendChild(wrapper)

  const root = createRoot(wrapper)
  await new Promise<void>(resolve => {
    root.render(<>{jsx}</>)
    setTimeout(resolve, 400)
  })

  const canvas = await html2canvas(wrapper, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    scrollX: 0,
    scrollY: 99999,   // 補償 top: -99999px 的偏移
  })

  root.unmount()
  document.body.removeChild(wrapper)
  return canvas
}

// ---- PDF：將 canvas 加入 PDF（自動多頁分割）----
function addCanvasToPdf(pdf: jsPDF, canvas: HTMLCanvasElement, isFirst: boolean) {
  const pdfW = pdf.internal.pageSize.getWidth()
  const pdfH = pdf.internal.pageSize.getHeight()
  const imgData = canvas.toDataURL('image/png')
  const imgH = (canvas.height * pdfW) / canvas.width

  if (!isFirst) pdf.addPage()

  let position = 0
  pdf.addImage(imgData, 'PNG', 0, position, pdfW, imgH)
  let remaining = imgH - pdfH

  while (remaining > 0) {
    position -= pdfH
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, pdfW, imgH)
    remaining -= pdfH
  }
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const record = id ? getRecord(id) : null
  const [activeTab, setActiveTab] = useState<Tab>('grid')
  const [downloading, setDownloading] = useState(false)

  if (!record) {
    return (
      <div className="results-page">
        <div className="not-found">
          <p>找不到這篇作文的紀錄 😢</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>回首頁</button>
        </div>
      </div>
    )
  }

  const grid = getGridSections(record)
  const notes = getNotes(record)

  // ---- 共用區塊元件 ----
  function GridCell({ section, config }: { section: GridSection; config: typeof GRID_CONFIG[0] }) {
    const isEmpty = !section.points || section.points.length === 0
    const hint = getHint(section)
    return (
      <div className="grid-cell" style={{ background: config.color }}>
        <div className="grid-cell-header">
          <span className="grid-cell-emoji">{config.emoji}</span>
          <span className="grid-cell-label">{config.label}</span>
        </div>
        {hint && <p className="grid-cell-tip">💡 {hint}</p>}
        {isEmpty ? (
          <p className="grid-cell-empty">這部分可以自己發揮看看喔！✏️</p>
        ) : (
          <ul className="grid-cell-points">
            {section.points.map((pt, i) => <li key={i} className="grid-cell-point">▸ {pt}</li>)}
          </ul>
        )}
      </div>
    )
  }

  // ---- PDF 各分區的 JSX ----
  const pdfGridJsx = (
    <div style={{ padding: 24, fontFamily: '"Noto Sans TC", sans-serif', background: '#fff' }}>
      <h2 style={{ color: '#6C5CE7', marginBottom: 16 }}>寫作大綱：{record.topic}</h2>
      <div className="writing-grid">
        {GRID_CONFIG.map(cfg => <GridCell key={cfg.key} section={grid[cfg.key]} config={cfg} />)}
      </div>
    </div>
  )

  const pdfSummaryJsx = (
    <div style={{ padding: 24, fontFamily: '"Noto Sans TC", sans-serif', background: '#fff' }}>
      <h2 style={{ color: '#6C5CE7', marginBottom: 16 }}>素材整理：{record.topic}</h2>
      <div className="result-section">
        <h3 className="section-title">🗺 心智圖</h3>
        {record.mindMap ? <><MindMap data={record.mindMap} /><MindMapList data={record.mindMap} /></> : <p>無心智圖資料</p>}
      </div>
      <div className="result-section">
        <h3 className="section-title">📋 素材筆記</h3>
        <div className="notes-content">
          {notes.length > 0
            ? notes.map((note, i) => (
                <p key={i} style={{ margin: '4px 0', fontSize: 14, lineHeight: 1.6 }}>• {note}</p>
              ))
            : <p>尚無筆記</p>
          }
        </div>
      </div>
    </div>
  )

  const pdfChatJsx = (
    <div style={{ padding: 24, fontFamily: '"Noto Sans TC", sans-serif', background: '#fff' }}>
      <h2 style={{ color: '#6C5CE7', marginBottom: 16 }}>對話回顧：{record.topic}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {record.messages.map((msg, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 8 }}>
            {msg.role === 'assistant' && <span style={{ fontSize: 20 }}>🐰</span>}
            <div style={{
              maxWidth: '72%',
              padding: '10px 14px',
              borderRadius: 16,
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              background: msg.role === 'user' ? '#6C5CE7' : '#fff',
              color: msg.role === 'user' ? '#fff' : '#333',
              border: msg.role === 'assistant' ? '1px solid #eee' : 'none',
            }}>
              {msg.content
                .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
                .replace('[END]', '')
                .trim()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  async function handleDownloadPdf() {
    if (downloading) return
    setDownloading(true)
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const sections = [
        { jsx: pdfGridJsx,    label: '起承轉合' },
        { jsx: pdfSummaryJsx, label: '重點整理' },
        { jsx: pdfChatJsx,    label: '對話回顧' },
      ]

      for (let i = 0; i < sections.length; i++) {
        const canvas = await renderToCanvas(sections[i].jsx)
        addCanvasToPdf(pdf, canvas, i === 0)
      }

      pdf.save(`作文大綱_${record!.topic}.pdf`)
    } catch (err) {
      console.error('PDF 生成失敗', err)
    } finally {
      setDownloading(false)
    }
  }

  // ---- 畫面顯示 ----
  return (
    <div className="results-page">
      <div className="results-header">
        <button className="btn btn-ghost" onClick={() => navigate('/')}>← 回首頁</button>
        <h1 className="results-title">📝 {record.topic}</h1>
        <button className="btn btn-download" onClick={handleDownloadPdf} disabled={downloading}>
          {downloading ? '準備中…' : '⬇️ 下載 PDF'}
        </button>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'grid'    ? 'active' : ''}`} onClick={() => setActiveTab('grid')}>起承轉合</button>
        <button className={`tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>重點整理</button>
        <button className={`tab ${activeTab === 'chat'    ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>對話回顧</button>
      </div>

      {activeTab === 'grid' && (
        <div className="print-area">
          <div className="print-title">寫作大綱：{record.topic}</div>
          <div className="writing-grid">
            {GRID_CONFIG.map(cfg => <GridCell key={cfg.key} section={grid[cfg.key]} config={cfg} />)}
          </div>
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="print-area">
          <div className="print-title">素材整理：{record.topic}</div>
          <div className="result-section">
            <h2 className="section-title">🗺 心智圖</h2>
            {record.mindMap
              ? <><MindMap data={record.mindMap} /><MindMapList data={record.mindMap} /></>
              : <p className="no-data">心智圖資料尚未生成</p>}
          </div>
          <div className="result-section">
            <h2 className="section-title">📋 素材筆記</h2>
            <div className="notes-content">
              {notes.length > 0
                ? <ul className="notes-list">
                    {notes.map((note, i) => <li key={i} className="notes-item">• {note}</li>)}
                  </ul>
                : <p className="no-data">尚無筆記</p>
              }
            </div>
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="chat-review">
          {record.messages.map((msg, idx) => (
            <div key={idx} className={`message-row ${msg.role}`}>
              {msg.role === 'assistant' && <div className="msg-avatar">🐰</div>}
              <div className={`message-bubble ${msg.role}`}>
                {msg.content
                  .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
                  .replace('[END]', '')
                  .trim()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
