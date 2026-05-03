import type { MindMapData } from '../types'

interface Props {
  data: MindMapData
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#F0A500', '#DDA0DD', '#7EC8C8']

const VW = 1100
const VH = 700
const CX0 = VW / 2
const CY0 = VH / 2
const BRANCH_R   = 185   // 中心 → 主分支
const MIN_CHILD_R = 130  // 主分支 → 關鍵詞節點（最小值）
const MARGIN = 28        // viewBox 邊距

const FS_CENTER = 17
const FS_BRANCH = 14
const FS_CHILD  = 12

/* ---- 文字寬度估算 ---- */
function textW(text: string, fs: number): number {
  return Array.from(text).reduce((s, ch) =>
    s + (ch.charCodeAt(0) > 127 ? fs : fs * 0.62), 0)
}
function eRx(text: string, fs: number): number { return textW(text, fs) / 2 + 14 }
function eRy(fs: number): number { return fs / 2 + 9 }

/* ---- 橢圓邊緣上、朝向目標的交點 ---- */
function edgePt(
  cx: number, cy: number, rx: number, ry: number,
  tx: number, ty: number
): [number, number] {
  const dx = tx - cx, dy = ty - cy
  if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return [cx, cy]
  const t = 1 / Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2)
  return [cx + dx * t, cy + dy * t]
}

/* ---- 資料型別 ---- */
interface NodeDef {
  x: number; y: number
  text: string; fs: number
  fill: string; textFill: string
  stroke?: string
}
interface LinkDef {
  x1: number; y1: number; x2: number; y2: number
  color: string; width: number
}

/* ---- 佈局 ---- */
function buildLayout(data: MindMapData) {
  const nodes: NodeDef[] = []
  const links: LinkDef[] = []
  const branches = data.branches ?? []

  /* 中心節點 */
  nodes.push({ x: CX0, y: CY0, text: data.center, fs: FS_CENTER, fill: '#6C5CE7', textFill: '#fff' })

  branches.forEach((branch, i) => {
    const bAngle = (2 * Math.PI * i) / branches.length - Math.PI / 2
    const bx = CX0 + BRANCH_R * Math.cos(bAngle)
    const by = CY0 + BRANCH_R * Math.sin(bAngle)
    const color = COLORS[i % COLORS.length]

    /* 主分支節點（topic） */
    nodes.push({ x: bx, y: by, text: branch.topic, fs: FS_BRANCH, fill: color, textFill: '#fff' })
    links.push({ x1: CX0, y1: CY0, x2: bx, y2: by, color, width: 2.5 })

    /* 關鍵詞子節點（keywords 陣列） */
    const keywords = branch.keywords ?? []
    const spreadStep = Math.PI / 7  // ~25.7° 每子節點
    const totalSpread = spreadStep * (keywords.length - 1)
    const startAngle = bAngle - totalSpread / 2

    /* 主分支橢圓半徑 */
    const brRx = eRx(branch.topic, FS_BRANCH)
    const brRy = eRy(FS_BRANCH)

    keywords.forEach((keyword, j) => {
      const cAngle = startAngle + spreadStep * j
      /* 子節點橢圓半徑 */
      const chRx = eRx(keyword, FS_CHILD)
      const chRy = eRy(FS_CHILD)
      /* 動態 child radius：確保兩橢圓邊緣至少有 20px 間隙 */
      const needed = Math.max(
        brRx * Math.abs(Math.cos(cAngle - bAngle)) + chRx * Math.abs(Math.cos(cAngle - bAngle)),
        brRy * Math.abs(Math.sin(cAngle - bAngle)) + chRy * Math.abs(Math.sin(cAngle - bAngle))
      )
      const childR = Math.max(MIN_CHILD_R, needed + 28)

      const cx2 = bx + childR * Math.cos(cAngle)
      const cy2 = by + childR * Math.sin(cAngle)

      nodes.push({ x: cx2, y: cy2, text: keyword, fs: FS_CHILD, fill: '#fff', textFill: '#444', stroke: color })

      /* 連線從橢圓邊緣到橢圓邊緣 */
      const [lx1, ly1] = edgePt(bx, by, brRx, brRy, cx2, cy2)
      const [lx2, ly2] = edgePt(cx2, cy2, chRx, chRy, bx, by)
      links.push({ x1: lx1, y1: ly1, x2: lx2, y2: ly2, color, width: 1.5 })
    })
  })

  return fitViewBox(nodes, links)
}

/* ---- 自動縮放 fit-to-viewBox ---- */
function fitViewBox(nodes: NodeDef[], links: LinkDef[]) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const n of nodes) {
    const rx = eRx(n.text, n.fs), ry = eRy(n.fs)
    minX = Math.min(minX, n.x - rx); maxX = Math.max(maxX, n.x + rx)
    minY = Math.min(minY, n.y - ry); maxY = Math.max(maxY, n.y + ry)
  }

  const cw = maxX - minX, ch = maxY - minY
  const aw = VW - MARGIN * 2, ah = VH - MARGIN * 2
  const scale = Math.min(1, aw / cw, ah / ch)
  const tx = MARGIN + (aw - cw * scale) / 2 - minX * scale
  const ty = MARGIN + (ah - ch * scale) / 2 - minY * scale

  const tf = (x: number, y: number): [number, number] => [x * scale + tx, y * scale + ty]

  return {
    nodes: nodes.map(n => {
      const [nx, ny] = tf(n.x, n.y)
      return { ...n, x: nx, y: ny, fs: n.fs * scale }
    }),
    links: links.map(l => {
      const [x1, y1] = tf(l.x1, l.y1)
      const [x2, y2] = tf(l.x2, l.y2)
      return { ...l, x1, y1, x2, y2, width: l.width * scale }
    }),
  }
}

/* ---- 元件 ---- */
export default function MindMap({ data }: Props) {
  const { nodes, links } = buildLayout(data)

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      className="mind-map-svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 連線（橢圓邊緣到橢圓邊緣） */}
      {links.map((l, i) => (
        <line
          key={i}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke={l.color} strokeWidth={l.width} strokeOpacity={0.7}
        />
      ))}

      {/* 節點：橢圓 + 文字 */}
      {nodes.map((n, i) => {
        const rx = eRx(n.text, n.fs)
        const ry = eRy(n.fs)
        return (
          <g key={i}>
            <ellipse
              cx={n.x} cy={n.y} rx={rx} ry={ry}
              fill={n.fill}
              stroke={n.stroke ?? 'none'}
              strokeWidth={n.stroke ? 1.8 : 0}
            />
            <text
              x={n.x} y={n.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize={n.fs} fontWeight="600" fill={n.textFill}
              fontFamily='"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif'
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {n.text}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ---- 備用列表版（PDF 用） ---- */
export function MindMapList({ data }: Props) {
  return (
    <div className="mind-map-list">
      <div className="mm-center">{data.center}</div>
      <div className="mm-branches">
        {data.branches.map((b, i) => (
          <div key={i} className="mm-branch">
            <span className="mm-branch-label">{b.topic}</span>
            {b.keywords && b.keywords.length > 0 && (
              <ul className="mm-children">
                {b.keywords.map((kw, j) => (
                  <li key={j} className="mm-child">{kw}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
