export type AIProvider = 'claude' | 'openai' | 'gemini'

// 起承轉合四宮格（v2：tip → hint）
export interface GridSection {
  hint: string      // 寫作提示
  points: string[]  // 短句要點
}

export interface WritingGrid {
  qi: GridSection    // 起
  cheng: GridSection // 承
  zhuan: GridSection // 轉
  he: GridSection    // 合
}

export interface AIConfig {
  provider: AIProvider
  apiKey: string
}

export interface ChatMessage {
  role: 'assistant' | 'user'
  content: string
}

// 心智圖（v2：扁平分支，topic + keywords，不再用樹狀節點）
export interface MindMapBranch {
  topic: string      // 分支主題（例：「地點」「心情」）
  keywords: string[] // 此分支下的關鍵詞（短詞，1~4 個）
}

export interface MindMapData {
  center: string          // 中心節點 = 作文題目
  branches: MindMapBranch[]
}

export interface EssayRecord {
  id: string
  topic: string
  createdAt: string // ISO string
  messages: ChatMessage[]
  writingGrid: WritingGrid | null
  mindMap: MindMapData | null
  notes: string[]   // v2：條列筆記改為字串陣列（每點一筆）
}
