# 國小作文引導 Web 服務 — MVP 產品規格書

> 本文件整理自 2026/04/17 產品規劃討論結論，作為開發階段的交接文件。
> 版本：v1.10（Prompt 心得規則衝突修補版）
> 原始構想文件：`writing-guide-app-readme.md`（本文件已取代其中的多項決策，以本文件為準）

---

## 📌 給開發者 / Claude Code 的指引

閱讀順序建議：**第 1 節定位 → 第 10 節不做清單 → 第 4 節使用流程 → 第 5 節畫面規格**。

開發過程請特別留意：

1. 這是**以自用驗證為目的的 side project**，第一批使用者是作者自己的小孩
2. **第 10 節「不做清單」必須嚴格遵守**，避免過度開發
3. 整個服務的成敗取決於「AI 問的問題夠不夠好」，其他都是其次
4. 架構以「**能快速修改迭代**」為設計原則，不追求一次到位

---

## 1. 專案定位

### 1.1 服務定義

一款協助台灣國小學生「**寫作前思考**」的 AI 引導 Web 服務。小朋友輸入作文題目後，一隻名為「**小兔兔**」的 AI 角色會以對話方式引導學生整理素材、組織思路，最終產出視覺化的心智圖與條列重點，讓學生能帶著清晰的寫作大綱去完成作文。

**核心價值主張**：

> 「像有個夥伴坐在你旁邊，一步一步引導你思考要寫什麼。」

**解決的痛點**：學生寫作卡關大多不是卡在「字句文法」，而是卡在「不知道要寫什麼」。本服務專注在**寫作前的思考引導**，降低空白頁焦慮感。

### 1.2 階段性定位

- **第一階段（目前 / MVP）**：先給作者自己孩子使用，驗證引導效果
- **第二階段（未來）**：驗證可行後，再評估對外開放或商業化

這個階段性定位意味著：

- MVP 極度聚焦在「核心引導體驗」
- 營運面問題（濫用防範、成本控制、付費機制）一律先跳過
- 以真實使用回饋為最重要的優化依據

---

## 2. 目標用戶

- **主要使用者**：台灣國小學生（1~6 年級，MVP 不分年級）
- **次要角色**：家長（協助列印 PDF、提供陪伴）
- **不涵蓋**：老師、學校端使用情境

---

## 3. 使用情境

- **設備**：以**平板**為主、**桌機瀏覽器**為輔
- **使用時機**：學生寫作文作業前、需要整理思路時
- **使用方式**：學生自行使用，或家長陪同

---

## 4. 核心使用流程

```
[首次使用 / 尚未設定 Key]
[畫面 0 API Key 設定頁]
    ↓ 爸媽協助輸入 OpenAI API Key，儲存於 localStorage
    ↓

[日常使用流程]
[畫面 1 首頁]
    ↓ 輸入作文題目、點「開始」
[畫面 2 對話中]
    ↓ 小兔兔動態引導問答（目標 5 題內，上限 10 題）
    ↓ 小主人可「跳過」單題或「我想寫了」提早結束
[畫面 3 結果頁]
    ↓ Tab 1：起承轉合四宮格（預設，寫作大綱骨架）
    ↓ Tab 2：重點整理（心智圖 + 條列筆記）
    ↓ Tab 3：對話回顧
    ↓ 下載 PDF 帶去寫作文
```

**進入首頁時的判斷邏輯**：若 localStorage 無有效 API Key，自動導向畫面 0；有則直接進入畫面 1。

---

## 5. 畫面規格

### 畫面 0：API Key 設定頁（首次使用 / 更換 Key 時顯示）

**目的**：由爸媽一次性輸入自家 OpenAI API Key，讓服務能在純前端架構下呼叫 AI。

**必備元素**

- 標題：「請爸爸媽媽協助設定」
- 說明文字：簡短解釋「為什麼需要 API Key」+「去哪裡申請」（附 OpenAI Platform 連結：`https://platform.openai.com/api-keys`）
- 輸入框：API Key 輸入（`type="password"` 遮蔽顯示）
- 「儲存」按鈕
  - 儲存時將 Key 寫入 localStorage
  - 儲存成功後導向畫面 1
- 「測試連線」按鈕（可選，建議做）
  - 發一次極小 API 請求驗證 Key 有效
  - 無效時顯示錯誤訊息，不寫入 localStorage

**設計要點**

- 說明語氣對象是**爸媽**（不是小主人），可以用正常成人語氣
- 不需要小兔兔角色登場
- 視覺上跟小主人實際使用的畫面要有區隔（讓爸媽知道這是「大人設定區」）

### 畫面 1：首頁

**必備元素**

- 小兔兔角色圖（靜態）
- 大型輸入框：placeholder「今天想寫什麼題目？」
- 「開始」按鈕
- 「我寫過的作文」歷史列表（從 localStorage 讀取）
  - 每筆顯示：作文題目、寫作日期
  - 點擊後直接進入該篇的結果頁（畫面 3）
- **設定 icon（齒輪，放在右上角等不顯眼位置）**
  - 點擊可查看 / 更新 / 移除 API Key（避免小主人誤觸，icon 不要過大）
  - 點擊後進入畫面 0（帶入目前的 Key 狀態）

**不做**

- 推薦題目按鈕
- 登入 / 註冊流程
- 題庫

### 畫面 2：對話中

**畫面元素**

- 小兔兔頭像（靜態）
- 對話訊息區（小兔兔泡泡、小主人泡泡，由上往下延伸）
- 打字輸入框 + 送出按鈕
- 「跳過這題」按鈕
- 「我想寫了」按鈕（提早結束、進入結果頁）

**互動規則**

- 小兔兔**一次只問一題**
- 小主人每次回答後，小兔兔**內部判斷**是否繼續問
- **題數控制**：上限 10 題、目標在 5 題內收斂
- **跳過機制**：
  - 點「跳過這題」按鈕
  - 或小主人輸入文字「跳過」（與按鈕等效）
- **題目追問**：題目過於模糊時，小兔兔會**先追問釐清題目**再開始正式引導
- **敷衍處理**：小主人回答敷衍（如「不知道」「沒有」「還好」），小兔兔會繼續追問、換方式引導
- **提早結束**：小主人點「我想寫了」可立即進入結果頁（不需要回答完所有問題）

**不做**

- 進度指示（不顯示「這是第 N 題」，避免壓力）
- 小兔兔頭像動畫（MVP 靜態即可）
- 語音輸入

### 畫面 3：結果頁

**Tab 結構（共 3 個 Tab）**

#### Tab 1：起承轉合四宮格（**預設開啟**）

整個 MVP 最核心的交付物。以 2×2 四宮格呈現，依寫作脈絡把素材分配進四格，等於一份**寫作大綱骨架**，小主人看著每一格就知道每一段要寫什麼。

| 格 | 對應寫作位置 | 內容 |
|----|--------------|------|
| **起** | 開頭段 | 事件發生的時空背景、人物、起因（1~3 個要點）|
| **承** | 中段 | 事件的經過與細節（3~5 個要點）|
| **轉** | 高潮 / 轉折段 | 意外、轉折、情感的高峰（1~3 個要點）|
| **合** | 結尾段 | 收穫、感想、反思（1~2 個要點）|

**AI 產出規則**
- 每一格由 AI 從對話內容中萃取、分類
- 每個要點用**短句**呈現（不是整段文字，避免小主人直接抄）
- 每格上方可附一句**寫作提示**（例如「起」的提示：「先告訴讀者這件事是什麼時候、在哪裡發生的」）
- 若某格沒有足夠素材（例如小主人跳過太多題），該格留空或顯示「這部分可以自己發揮看看喔！」

**視覺設計**
- 2×2 方正格子，格線清晰
- 每格用不同顏色區分（例如：起=淺藍、承=淺綠、轉=淺橘、合=淺紫），讓小主人視覺上容易對應

#### Tab 2：重點整理

版面上下兩區：

- **上方：心智圖**
  - 中心節點：作文題目
  - 主分支：引導問題的主題
  - 子節點：AI 從對話中萃取的關鍵詞
- **下方：條列筆記**
  - 把所有對話中蒐集到的素材整理成好讀的條列式文字（不依寫作結構，純粹是素材庫）

設計目標：心智圖提供**視覺化結構**、條列筆記提供**完整素材庫**，兩者互補，作為 Tab 1 四宮格之外的延伸參考。

#### Tab 3：對話回顧

完整顯示小兔兔與小主人的一來一往問答紀錄。

**按鈕**

- 下載 PDF（必備，這是小主人把結果帶走的唯一方式；PDF 建議包含三個 Tab 的完整內容）

---

## 6. AI 角色「小兔兔」人設

| 項目 | 設定 |
|------|------|
| 名字 | 小兔兔 |
| 稱呼使用者 | 小主人 |
| 語氣 | 中性偏親切、貼近國小生的用字 |
| 幽默感 | 可適度搞笑但不刻意賣萌 |
| 情緒價值 | 可給一點鼓勵、共鳴，但不過多 |
| 對話長度 | 簡短為原則，以問題引導為主 |
| 表情 / 動畫 | MVP 不做 |

### 對話範例（題目：我最難忘的一次旅行）

```
小兔兔：哈囉小主人！你今天想寫的是「我最難忘的一次旅行」對不對？
        聽起來超讚的，我也好想聽～那我們先從一個簡單的問題開始吧：
        那一次旅行你是去哪裡呢？

小主人：我去了墾丁

小兔兔：墾丁！海超漂亮的對吧～
        那這次是跟誰一起去的呢？是一個人去還是有家人朋友一起？

小主人：跟爸爸媽媽還有弟弟

小兔兔：一家人出遊最棒了！那接下來我想問一個比較有趣的：
        在墾丁，有沒有哪個畫面讓你現在閉上眼睛都還記得？
```

上述範例是設計定調的參考，之後所有 AI prompt 都應以這個語氣為基準。

---

## 7. AI 引導邏輯

### 7.1 問題生成策略

- **生成方式**：完全由 AI 動態生成（**不使用預設題庫**）
- **題數控制**：
  - 上限 10 題
  - 目標在 5 題內引導完成
  - AI 自主判斷是否已經蒐集到足夠素材
- **題型覆蓋**：MVP 階段讓 AI 自由發揮，**不預先限定問題類型**
  - 未來可能補強：針對記敘 / 抒情 / 說明 / 想像 / 論說等不同文體設計 prompt 引導策略

### 7.2 異常情境處理

| 情境 | 小兔兔行為 |
|------|------------|
| 題目模糊（例如僅輸入「春天」） | 先追問釐清題目，再開始正式引導 |
| 回答敷衍（「不知道」「沒有」） | 繼續追問、嘗試換方式提問 |
| 小主人點「跳過這題」或輸入「跳過」 | 該題目視為未回答、不納入心智圖 |
| 小主人點「我想寫了」 | 立即結束引導、進入結果頁生成 |

### 7.3 Prompt 架構（v1 草稿已建立）

採用**兩支 prompt 分離架構**：

| Prompt | 檔案 | 用途 | 是否用 Tool Use |
|--------|------|------|-----------------|
| 對話引導 | `prompts/chat-system-prompt.md` | 小兔兔跟小主人來回問答 | 否（自然語言） |
| 結果生成 | `prompts/result-system-prompt.md` + `prompts/result-tool-schema.json` | 對話結束後整理素材產出結構化資料 | 是（強制 JSON 輸出） |

對話 prompt 用 `<thinking>` 標籤做內部狀態追蹤（前端需過濾）；對話結束時會輸出單獨一行 `[END]`，前端收到此訊號後關閉對話、把完整對話丟給結果生成 prompt。

### 7.4 結果生成內容

對話結束後，AI 需整理輸出三份資料：

- **起承轉合四宮格**（MVP 最核心產物）
  - 建議 JSON 結構，四個鍵（起 / 承 / 轉 / 合）各含一組短句要點
  - 每格可附一句寫作提示
  - 若素材不足，該格可留空
- **心智圖資料結構**（建議以 JSON 表達節點關係）
- **條列筆記**（markdown 或純文字，整理為完整素材庫）

**MVP 僅支援「起承轉合」一種結構**，不區分文體（記敘 / 抒情 / 說明 / 想像 / 論說）。未來版本可依文體提供不同結構模板（例如論說文改為「立場 → 理由 → 例子 → 結論」）。

---

## 8. 資料儲存機制

| 資料 | 儲存位置 | 用途 |
|------|----------|------|
| 作文歷史（題目、對話、心智圖、條列筆記） | **localStorage（前端）** | 小主人本機回顧 |
| 結果頁內容 | **PDF 下載** | 分享給家人、列印、長期保存 |

### 設計要點

- **MVP 階段不做後端資料庫儲存使用者資料**
- localStorage 每筆紀錄建議結構：
  - 題目
  - 寫作日期 / 時間戳
  - 完整對話訊息
  - 心智圖資料（JSON）
  - 條列筆記（text / markdown）
- 不限制歷史筆數上限（除非遇到瀏覽器容量問題再處理）
- PDF 下載由前端生成即可（使用瀏覽器原生列印或前端 library 皆可）

---

## 9. 技術架構

### 9.1 MVP 開發階段：純前端 + 使用者自帶 API Key

本 MVP 為 side project，開發階段採用**純前端架構**，**不部署任何後端 server**。API Key 由**爸媽自行輸入並存放於 localStorage**，程式碼本身不包含任何 Key。

- **架構**：前端直接呼叫 OpenAI API（使用官方 SDK 時需設定 `dangerouslyAllowBrowser: true`，或自行 fetch `https://api.openai.com/v1/chat/completions`）
- **AI 服務**：OpenAI API
  - 對話引導（Prompt 1）：`gpt-5.4-mini`
  - 結果生成（Prompt 2，Tool Use）：`gpt-5.4-mini`
  - 原規劃使用 Claude API（`claude-haiku-4-5` + `claude-sonnet-4-6`），因 Claude Console 付款問題暫時無法開通，改用 OpenAI；付款問題解決後可切回（見 9.3 模組化封裝原則）
- **API Key 管理**：
  - 由爸媽於畫面 0 輸入
  - 儲存於 localStorage（不寫入程式碼、不寫入環境變數）
  - 程式碼本身**完全不含任何 Key**，可安全推上 public repo、可安全公開部署
- **資料儲存**：localStorage（無後端資料庫）
- **PDF 生成**：前端 library（例如 jsPDF、html2pdf）
- **心智圖渲染**：前端 library
- **即時回應**：可考慮 SSE streaming 讓小兔兔回應逐字顯示
- **部署方式**：靜態檔案即可（GitHub Pages、Vercel、Netlify 等任意靜態主機）

### 9.2 此方案的優缺點

**優點**
- ✅ 程式碼乾淨，完全不含敏感資訊
- ✅ 可放心上傳 Git、部署到公開網域
- ✅ 每位使用者用自己的 API Key，費用各自負擔，不會被盜刷他人額度
- ✅ MVP 上線完全沒有營運成本（除了爸媽自己的 API 用量）

**待之後解決的問題**
- ⚠️ 每個新裝置 / 新瀏覽器都需要重新輸入 Key（localStorage 是 device-bound）
- ⚠️ Key 存在 localStorage 仍可能被瀏覽器 XSS 或裝置共用者讀取
- ⚠️ 對「不懂技術的家長」門檻過高（但本 MVP 階段使用者是作者本人，不是問題）

這些議題留待對外開放或要降低使用門檻時再處理（見 9.4）。

### 9.3 架構升級預備（給開發者的重要指引）

為了讓 MVP 驗證完成後能順利升級架構（改為由後端代為呼叫 AI、隱藏 Key），開發時請務必遵守：

> **將呼叫 LLM API 的邏輯封裝成單一獨立模組**（例如 `src/api/llmClient.ts`）。
> 前端其他地方只透過此模組取得 AI 回應，不直接知道 API 細節（不直接拿 Key、不直接組 request、不直接感知是哪家 provider）。

如此一來，未來兩種升級都只需改這個模組內部，**前端其他程式碼完全不需改動**：
1. **切換 LLM Provider**（例如現階段 OpenAI → 未來切回 Claude）：只改此模組內的 endpoint / header / request 結構
2. **升級為後端代為呼叫**（隱藏 Key、改用自家後端 endpoint）：只改此模組內的呼叫目標

### 9.4 未來升級選項（非 MVP 範疇）

當對外開放、或要讓非技術家長也能輕鬆使用時，可考慮：

| 方案 | 說明 | 複雜度 |
|------|------|--------|
| **Serverless Function** | Vercel Functions / Cloudflare Workers 寫一支極輕 proxy，由服務方持有 API Key | 低 |
| **Spring Boot + Kotlin 後端** | 完整後端服務，支援會員、權限、成本控制、分析等進階功能（符合作者原技術棧偏好）| 中 |

作者原技術棧偏好為 Spring Boot + Kotlin + Docker + K8s，MVP 階段不使用，保留給對外開放階段。

### 9.5 實作注意事項（給開發者 / Claude Code 的踩坑清單）

本節列出 prompt 設計階段實測發現、容易漏掉的實作細節。**這些點建議在對應功能完成後單獨驗證**，避免 debug 時來回找原因。

#### A. SSE Streaming 處理

對話 endpoint 使用 SSE 串流，讓小兔兔回應逐字顯示。實作四個重點：

1. **Chunk 要 append 到「同一則 message 的 content」欄位**，不是 push 新 message 到陣列。
   - ✅ 對：`setMessages(prev => prev.map(m => m.id === streamingId ? {...m, content: m.content + chunk} : m))`
   - ❌ 錯：`setMessages(prev => [...prev, {id: streamingId, content: chunk}])`（每個 chunk 都 push 會產生文字重複/錯位現象）
2. **React StrictMode 雙重執行**：若發 API 邏輯寫在 useEffect 裡，StrictMode 在 dev mode 會跑兩次，兩個 stream 同時寫入同一個 message → 畫面文字重複 / 交錯。**務必搭配 AbortController + cleanup**，或把發請求移出 useEffect。
3. **OpenAI SSE event 結構**：OpenAI 的 SSE event 的 `data:` 後是 `{"choices":[{"delta":{"content":"..."}}]}`。取 `delta.content` 當 append 內容。`delta` 沒有 content 欄位的 chunk（如 role chunk、finish chunk）**不要 append**，否則會插入 `undefined`。
4. **Buffer 邊界處理**：一個 TCP packet 可能帶多個 SSE event，或一個 event 跨 packet。parser 要維護 buffer、用 `\n\n` 切分 event 並保留未完成殘留。

**驗證方式**：開場白若出現「前半句被重複一次」（例如「哈囉小主人！你今天想寫的是「寒**哈囉小主人！你今天想**假旅遊」」）就是 1 或 2 中招。

#### B. `<thinking>` 標籤過濾

對話 prompt 要求 AI 每次回覆前先輸出 `<thinking>...</thinking>` 內部盤點。**前端必須過濾這段**，不能顯示給使用者（否則小主人會看到一堆推理文字、體驗直接破功）。

實作方式：
- Streaming 過程中偵測 `<thinking>` 開始 → 進入 suppress 模式
- 偵測到 `</thinking>` 結束 → 切回顯示模式，繼續 render
- Streaming 結束若未閉合（極少見，防禦性處理）→ 丟棄整段未閉合內容

#### C. 對話結束訊號 `[END]`

小兔兔結束時會在最後一則回覆**結尾加單獨一行 `[END]`**。前端流程：

1. Streaming 完成後檢查 content 是否以 `[END]` 結尾
2. 若是：從顯示內容移除 `[END]`，然後觸發結果頁跳轉（呼叫 Prompt 2）
3. 畫面 2 需提供「我想寫了」按鈕，使用者可提早結束——此情境由前端直接送訊號給 Prompt 2，不等 AI 產出 `[END]`

#### D. Tool Use / Function Calling（結果生成）

Prompt 2 使用 OpenAI Function Calling。注意事項：

1. `tools` 參數格式：OpenAI 外層要包 `{type: "function", function: {...}}`，裡面才是 `result-tool-schema.json` 的內容
2. 加上 `tool_choice: {"type": "function", "function": {"name": "generate_writing_scaffold"}}` 強制呼叫，避免 AI 自由選擇回文字
3. 解析 `choices[0].message.tool_calls[0].function.arguments`（是 JSON 字串，需 `JSON.parse`）
4. **解析失敗要有 fallback**：例如顯示「結果生成失敗，請重試」錯誤頁，不要讓使用者看到原始 JSON 或亂碼

#### E. PDF 匯出

1. 建議用 `jsPDF` 或 `html2pdf.js`
2. **中文字型必須 embed TTF**（jsPDF 預設不支援中文，不處理會變成豆腐方塊）
3. 匯出前確認對話記錄 state 已穩定（streaming 剛結束時 state 可能還在 batch 更新中，匯出會抓到過渡狀態）
4. 匯出內容需涵蓋三個 tab：起承轉合四宮格、重點整理（心智圖 + 條列筆記）、對話回顧

#### F. 抽象 LLM Client（再次強調，極度重要）

所有 OpenAI / 未來 Claude / 未來後端 API 的差異，**只在 `src/api/llmClient.ts` 內部處理**。外部呼叫介面建議長這樣：

```typescript
// 對話：streaming
streamChat(
  messages: Message[],
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<void>

// 結果生成：Tool Use
generateScaffold(conversation: Message[]): Promise<WritingScaffold>
```

切換 provider 或接後端代理時，**只動這個檔案**，前端元件完全不知道背後是哪家 API。

### 9.6 上線階段：Cloudflare 部署（私人使用）

**定位**：MVP 架構（§9.1 純前端 + 使用者自帶 Key）驗證完成後，為了讓**作者女兒能穩定使用**（不用每個裝置輸入 Key、不用擔心 Key 外洩）做的部署升級。

**重要邊界**：
- 只給女兒使用，**不對外公開宣傳**
- **不蒐集任何個資**，不需要家長同意書 / 個資法合規流程
- 不做帳號系統、不做資料庫、不做 analytics

#### 9.6.1 部署架構

```
[使用者瀏覽器]
     ↓ HTTPS
[Cloudflare Pages（前端靜態檔案）]
     ↓ fetch /api/chat /api/generate
[Cloudflare Workers（極輕量 BFF，藏 OpenAI Key）]
     ↓ 帶服務方 Key
[OpenAI API（gpt-5.4-mini）]
```

**為什麼選 Cloudflare**：
- 前端（Pages）+ BFF（Workers）同平台部署，設定最簡
- Workers 原生支援 SSE streaming（對小兔兔逐字回應很關鍵）
- 免費額度遠高於單人使用需求（Workers: 100K req/日 ≈ 3M/月；估算每月用量 ~600 req，使用率 < 0.02%）
- Wrangler CLI 一行部署（`wrangler deploy`），無需 Docker / K8s

#### 9.6.2 Cloudflare Workers BFF 職責

**應該做的**：
1. 接收前端送來的 messages
2. **先過 OpenAI Moderation API 檢查輸入**（免費，見 9.6.4）
3. 加上 system prompt 後轉送 OpenAI Chat Completions（streaming）
4. 將 SSE response pipe 回前端
5. Stream 完成後再過一次 Moderation API 檢查輸出
6. 記錄 **timestamp + token 用量**（不記對話內容）

**絕對不做的**：
- ❌ 不加 auth / 帳號系統（單人使用不需要）
- ❌ 不接資料庫
- ❌ 不做 analytics / tracking
- ❌ **不 log prompt 或 response 內容**（只記 meta，見第 6 點）

**Workers 極簡骨架**（約 50 行內）：

```typescript
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    // 1. 簡易密碼驗證（見 9.6.3）
    const passwordOk = verifyPassword(req, env);
    if (!passwordOk) return new Response('Unauthorized', {status: 401});

    // 2. 輸入 Moderation
    const body = await req.json();
    const lastUserMsg = body.messages.findLast(m => m.role === 'user')?.content;
    const inputFlagged = await moderate(lastUserMsg, env.OPENAI_API_KEY);
    if (inputFlagged) {
      return fallbackResponse('小主人，這個話題我們換一下吧～你想寫什麼作文題目呢？');
    }

    // 3. 轉送 OpenAI + pipe SSE
    const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({...body, stream: true}),
    });

    // 4. (進階) 可在 pipe 過程中累積 response、結束後再過 Moderation
    return new Response(openaiResp.body, {
      headers: {'Content-Type': 'text/event-stream'},
    });
  }
};
```

#### 9.6.3 訪問保護：簡易密碼頁

雖然是私人使用，但部署 URL 可能被意外洩露（例如女兒在學校截圖給同學看）。前端加一層極輕的密碼保護：

- 首次訪問顯示密碼輸入頁
- 密碼由爸爸設定（存於 Workers 環境變數）
- 驗證通過後寫入 localStorage，後續訪問不再要求
- **這不是真的帳號系統**，只是「撿到網址也不能用」的防禦

實作方式：前端送任何 `/api/*` 請求時，header 帶一個 `X-Access-Token`，Worker 驗證這個 token 是否等於環境變數的 password hash。

#### 9.6.4 AI 內容安全：多層防禦

上線階段的安全護欄分四層（CP 值由高至低）：

| 層 | 實作位置 | 成本 | 效果 |
|----|---------|------|------|
| 1. System Prompt 安全守則 | `chat-system-prompt.md` v2.2 的「AI 安全守則」區段 | 0 | 擋 80% 常見狀況 |
| 2. OpenAI Moderation API 雙向過濾 | Workers 前後過濾 | 0（Moderation 不計費）| 擋 prompt 沒預料的邊角案例 |
| 3. 對話輪數硬上限 | 前端或 Workers 超過 20 輪強制結束 | 0 | 防止 loop、防止被引到奇怪方向 |
| 4. 爸爸人工抽檢 | 作者偶爾看 localStorage 對話歷史 | 0 | 發現 prompt 沒想到的問題 |

**Moderation API 命中後的 fallback**：
- **輸入命中** → 不送 OpenAI，直接回覆小兔兔的通用拉回語
- **輸出命中** → 不顯示原回覆，替換成「小兔兔卡住了，換個方向聊好嗎？」（或重新生成一次）

**Moderation 檢測類別**（OpenAI 11 類，全部打開）：
`sexual`、`sexual/minors`、`hate`、`hate/threatening`、`harassment`、`harassment/threatening`、`self-harm`、`self-harm/intent`、`self-harm/instructions`、`violence`、`violence/graphic`

#### 9.6.5 零個資設計要點

即使不蒐集個資，仍需做的三件事：

1. **簡短隱私聲明頁**：告知「對話內容會送到 OpenAI 處理」——這是技術事實揭露，不算個資蒐集，但屬於使用者知情權
2. **localStorage 一鍵清除功能**：結果頁或設定頁提供「清除本機所有紀錄」按鈕
3. **Workers 不 log 對話內容**：只記 timestamp / token 數用於用量監控，不記 prompt / response 文字

**明確跳過的事**：
- ❌ 家長註冊 / 小孩帳號 / 登入（簡易密碼不算）
- ❌ 資料庫儲存對話或作文內容
- ❌ Analytics / tracking / cookies 追蹤
- ❌ 家長同意書、個資蒐集告知書（因為真的沒蒐集）

#### 9.6.6 用量監控與成本控制

**部署後第一週必做**：
- Cloudflare Workers dashboard：看每日 request 數趨勢
- OpenAI dashboard：看每日 token 用量 / 費用

**Workers 內建防爆量機制**（建議實作）：
- 每日全域 request 硬上限（例如 1000 次）超過自動 return 503
- 防禦意外情境：bug 造成 loop、密碼外流被陌生人使用

**成本預估**（單人使用）：
- 每次對話 ~10 次 LLM call，每月 ~60 次對話 × 10 ≈ 600 次 API 請求
- `gpt-5.4-mini` 每次呼叫約 $0.001~0.005 USD → 月成本 **< $3 USD**
- Cloudflare Workers + Pages **$0**
- OpenAI Moderation API **$0**
- 月總成本預估：**< NT$100**

#### 9.6.7 部署流程

**一次性設定**：
1. Cloudflare 帳號註冊
2. `npm install -g wrangler` 裝 CLI
3. `wrangler login`
4. `wrangler secret put OPENAI_API_KEY`（輸入真實 Key，藏在 Cloudflare 後台）
5. `wrangler secret put ACCESS_PASSWORD`（設定訪問密碼）

**後續部署**：
- 前端：`wrangler pages deploy ./dist`
- BFF：`wrangler deploy`（Workers）

**本地開發**：
- `wrangler dev` 啟動本地 Workers 模擬
- 前端用 Vite / 等 dev server，fetch 改指向 `http://localhost:8787`

### 9.7 尚未決定（進入技術規劃時再議）

- 前端框架選型（React / Vue / 純 HTML+JS）
- 心智圖前端渲染 library
- API Key 是否提供「測試連線」按鈕（MVP 階段；上線階段 Key 由 Workers 持有，不適用）

---

## 10. 範疇明確不做清單 ⚠️

以下項目在 MVP 開發 + 上線階段皆**明確不開發**，避免過度工程化。
部分項目在上線階段（§9.6）有輕度調整，以 🔄 標註。

- ❌ 批改作文、評分、給寫作建議
- ❌ 家長端 / 老師端 / 班級管理
- ❌ 會員系統 / 登入註冊 / 跨裝置同步
- ❌ 後端資料庫儲存使用者資料
- ❌ 訂閱制 / 付費機制
- ❌ 推薦題目、預設題庫
- ❌ 低 / 中 / 高年級分層版本
- ❌ 語音輸入
- ❌ 小兔兔表情 / 動畫
- ❌ 進度顯示
- ❌ 分享 URL 機制（由 PDF 下載取代）
- ❌ 原構想的 Android App / iOS App（改為純 Web）
- ❌ 後端 server 🔄 上線階段新增**極輕 BFF**（Cloudflare Workers，僅藏 Key + Moderation 雙向過濾 + 日 request 硬上限，不含任何業務邏輯、不接 DB），見 §9.6
- ❌ 服務方提供共用 API Key 🔄 上線階段 Key 由 Workers 持有（不再由爸媽輸入），但仍**只服務作者女兒**，不對外開放共用，見 §9.6
- ❌ 成本控制、濫用防範 🔄 上線階段加入**基礎日 request 硬上限**（防 bug loop + 防密碼外流被使用），非真正的使用次數計費系統，見 §9.6.6

---

## 11. 後續可擴充項目（非 MVP 範疇）

當 MVP 驗證可行、確認對外開放時，可再評估：

- AI 引導品質優化（基於實際使用資料調整 prompt）
- 依文體分類的 prompt 引導（記敘 / 抒情 / 說明 / 想像 / 論說各有不同引導策略）
- 年級分層版本（低年級改為故事板、填空引導等）
- 家長端：成長報告、作文回顧
- 跨裝置同步（需會員系統）
- 成本控制與濫用防範（對外開放時必做）
- 作文批改 / AI 回饋（若決定擴張產品邊界時）

---

## 12. 設計原則（寫給開發者）

1. **極度聚焦核心體驗**：MVP 重點是「小主人能順利走完一次引導 + 拿到有用的重點整理」
2. **不過度工程化**：目前是 side project，先堪用再優化，K8s 等重型基礎建設不急
3. **小主人視角優先**：UI 文字、按鈕設計、互動節奏都要考慮國小生的認知能力
4. **保留迭代空間**：架構以「能快速修改」為優先，不追求一次到位的完美設計
5. **AI 品質 > 系統完美**：整個服務的關鍵是「小兔兔問的問題夠不夠好」，技術細節可以妥協

---

## 附錄：產品演進記錄

| 版本 | 日期 | 主要變更 |
|------|------|----------|
| v0（原構想） | 前期 | 原定 Android + iOS App，含家長 / 老師端、批改、遊戲化等完整功能（見 `writing-guide-app-readme.md`）|
| v1.0（MVP） | 2026/04/17 | 收斂為 Web 服務、匿名使用、先給自己孩子用；移除批改、評分、家長端、老師端、會員、題庫、年級分層；最終交付物以 PDF 下載取代分享 URL |
| v1.1 | 2026/04/17 | 確定 MVP 開發階段採純前端架構（無後端），前端直接呼叫 Claude API；原 Spring Boot + K8s 技術棧保留給對外開放階段使用 |
| v1.2 | 2026/04/17 | 改為「使用者自帶 API Key」模式：爸媽於畫面 0 輸入 Key、存於 localStorage；程式碼不含任何 Key，可安全公開部署；新增畫面 0（API Key 設定頁）與首頁設定 icon |
| v1.3 | 2026/04/17 | 新增「起承轉合四宮格」作為結果頁預設 Tab（寫作大綱骨架），成為 MVP 最核心交付物；結果頁 Tab 結構改為三個：起承轉合四宮格 / 重點整理 / 對話回顧；MVP 階段僅支援起承轉合一種結構，未來可依文體擴充 |
| v1.4 | 2026/04/17 | Prompts 由 v1 調整為 v2，基於兩個 case 實測（記敘文「我最難忘的一次旅行」、描寫文「春天看到的景象」）發現的問題進行強化：題數目標上修為 5~7、強化「合」的必要性（避免因負向素材收尾）、情緒價值節制（避免每題疊加驚嘆）、「承」需挖至少 2 個不同細節、新增「選項式提問」技巧應對描寫 / 抒情類題目；結果生成端新增「承 / 轉不重複」規則與「心智圖 keywords 上限 4 個」規則 |
| v1.5 | 2026/04/19 | LLM 實作暫由 Claude API 改為 OpenAI API，模型配置：對話引導 `gpt-5.4-mini`、結果生成 `gpt-5.4-mini`。原因：Claude Console 付款步驟卡關（信用卡填完無法按購買按鈕）暫時無法開通；v1.4 版本的 v2 prompts 在 GPT-4o 系列實測出現「一次塞多題、情緒價值過度、對小主人做 meta-commentary」等違反規則的行為，升級至 `gpt-5.4-mini` 以其更強的 instruction-following 能力解決（暫不修改 prompt）。API 呼叫邏輯應封裝為 `llmClient.ts` 獨立模組，未來可切回 Claude 或改為後端代理（見 9.3） |
| v1.6 | 2026/04/19 | Prompt 1（對話引導）由 v2 升級為 v2.1，基於書信題「寫信給老師爭取才藝表演」的 `gpt-5.4-mini` 實測發現的問題：(1) 規則 1 細化，禁止列「逐項子問題清單」（例：一個問號但塞 3 個子問題）；(2) 新增規則 11「結尾過渡」，最後 1 題須用收尾信號詞、偏總結角度，不再開新方向；(3) 新增規則 12「避免重複挖合」，合已有正向素材時不再追問；(4) 新增規則 13「文體感知」，內部依題目關鍵字調整起承轉合詮釋（書信 / 描寫 / 記敘 / 想像），不對小主人解釋文體差別。Prompt 2（結果生成）本次無變動 |
| v1.7 | 2026/04/19 | 新增 §9.5「實作注意事項（給開發者 / Claude Code 的踩坑清單）」，集中列出 SSE streaming、`<thinking>` 標籤過濾、`[END]` 訊號處理、OpenAI Function Calling 解析、PDF 中文字型、LLM Client 抽象介面等六大踩坑點，避免交棒時漏交脈絡；原 §9.5「尚未決定」改號為 §9.6 並精簡（已有建議的項目移出） |
| v1.8 | 2026/04/19 | 新增 §9.6「上線階段：Cloudflare 部署（私人使用）」，涵蓋 BFF 架構（Cloudflare Workers 藏 Key）、訪問保護（簡易密碼頁）、AI 內容安全多層防禦（Prompt 守則 + Moderation API 雙向過濾 + 對話輪數上限 + 人工抽檢）、零個資設計要點、用量監控與成本控制（月成本預估 < NT$100）、部署流程（Wrangler CLI）；原 §9.6 尚未決定改號為 §9.7。Prompt 1 同步升級至 v2.2，新增「AI 安全守則」區段（禁止輸出類別 / 範圍限制 / 敏感議題轉介 / 抵抗 Prompt Injection）。§10「範疇明確不做清單」加入 🔄 標註與上線階段邊界備註 |
| v1.9 | 2026/04/19 | Prompt 1 升級至 v2.3，基於「黏土捏捏的心得」實測加強心得 / 反思類題目的合素材引導：規則 13 文體感知表新增「心得 / 反思類」一列，並補上「心得類特別注意」明確說明合的問法要拉到反思層（學習類 / 意願類 / 分享類 / 改變類四個方向），避免問成「最想記住的部分」這類偏記憶 / 偏事件 replay 的問題；附低 / 中高年級的選用建議。Prompt 2、Schema、Spec 主體本次無變動 |
| v1.10 | 2026/04/19 | Prompt 1 升級至 v2.3.1，修補 v2.3 與規則 11 的衝突。實測「黏土捏捏的心得」第二輪測試發現：v2.3 已寫入心得類規則，但 AI 仍照規則 11 b 段範例「✅ 你最想記住的是什麼？」當作合的結尾，原因是規則 11 b 段範例與規則 13 心得類特別注意的反例直接矛盾，AI 在優先級不明確時選擇了範例優先。本次修補：規則 11 b 段加上「心得類禁用通用範例」例外條款並標明適用範圍；規則 13 心得列改為 HARD TRIGGER，加入「必須 / 禁止」強指令詞，明確優先於規則 11。Prompt 2、Schema、Spec 主體本次無變動 |
