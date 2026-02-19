# PRD：Claude Code Settings Editor

> **版本**：v0.1 Draft  
> **日期**：2026-02-18  
> **狀態**：Brainstorming → Ready for Review

---

## 1. 問題陳述

Claude Code 的設定系統由多個 JSON 檔案、多層優先順序組成。進階使用者理解設定項的用途，但在手動編輯時面臨以下問題：

| 痛點 | 說明 |
|------|------|
| **無即時驗證** | vim/nano 編輯 JSON 無法即時檢查欄位名稱、值類型、枚舉範圍是否合法 |
| **設定分散** | `settings.json`、`.mcp.json`、`commands/` 各自獨立，缺乏統一檢視 |
| **Schema 不透明** | 可用選項、合法值需查文件，不在編輯現場 |
| **修改流程斷裂** | 開 editor → 修改 → 存檔 → 重啟 session，來回切換成本高 |

### 不包含的問題

- 新手不知道該設定什麼（引導/推薦不在 MVP 範圍）
- Claude Code 本身的功能缺陷
- 團隊層級的設定同步與部署（managed-settings）

---

## 2. 產品定義

一個 **Electron 桌面應用程式**，以視覺化表單呈現 Claude Code 設定檔，基於官方 JSON Schema 提供即時驗證，讓進階使用者能安全、高效地完成設定編輯。

### 核心價值主張

> **「看得見的設定，改不壞的 JSON。」**

與社群工具（ccsettings CLI、managed-settings.com web generator）的差異：它們側重於「產出設定檔」，本產品側重於**「輔助現有設定的檢視、修改與完善」**——讀取使用者已有的設定，顯示當前狀態，提供驗證與修改，而非從零生成。

---

## 3. 目標使用者

**進階 Claude Code 使用者**：熟悉 settings.json 結構與各設定項用途，日常使用 CLI 操作，但手動編輯 JSON 容易犯低級錯誤（typo、類型錯誤、遺漏必要欄位）。

**使用者特徵**：

- 已有 Claude Code 設定檔（非首次設定）
- 理解 permissions、hooks、MCP 等概念
- 痛點在於「改錯」而非「不知道改什麼」
- 修改頻率：初期密集設定，之後偶爾微調

---

## 4. 使用場景

### P0 — MVP 核心場景

**場景 A：檢視與修改使用者層級設定**

使用者啟動 app → 自動載入 `~/.claude/settings.json` → 以結構化表單呈現所有設定項 → 使用者修改某欄位 → 即時驗證合法性 → 使用者按「儲存」寫回檔案。

**場景 B：編輯權限規則（Permissions）**

使用者在 permissions 區塊新增一條 allow 規則 → app 根據 permissionRule 的 regex pattern 驗證格式（如 `Bash(npm run *)` 合法、`bash(npm)` 不合法）→ 顯示可用 Tool 名稱列表供選擇 → 儲存。

**場景 C：管理 MCP 伺服器設定**

使用者切換到 MCP 標籤 → 載入 `~/.mcp.json` → 以表單呈現各 server 的 transport type、command、args、env → 使用者新增/修改/刪除 server → 驗證 → 儲存。

**場景 D：編輯 Hooks**

使用者在 hooks 區塊選擇 event type（如 `PreToolUse`）→ 新增一組 matcher + hook → 選擇 hook type（command / prompt / agent）→ 填入對應欄位 → 驗證 → 儲存。

### P1 — 後續迭代場景

**場景 E：多層級設定檢視**

使用者選擇一個專案目錄 → app 同時載入使用者層級 + 專案層級 + local 層級設定 → 以合併視圖（Merged View）顯示最終生效的值，標註每個值的來源層級。

**場景 F：自訂指令管理**

使用者瀏覽 `.claude/commands/` 目錄下的 markdown 檔案 → 新增/編輯/刪除指令 → 預覽指令格式。

**場景 G：Environment Variables 管理**

使用者在 env 區塊新增環境變數 → app 驗證 key 格式（必須為 `^[A-Z_][A-Z0-9_]*$`）→ 提供常用環境變數的自動補全建議（如 `ANTHROPIC_MODEL`、`ANTHROPIC_SMALL_FAST_MODEL`）。

### P2 — 遠期場景

**場景 H：設定 diff 與歷史**

顯示修改前後的 JSON diff，支援 undo。Claude Code 自動保留最近 5 份備份，app 可讀取並提供版本比對。

**場景 I：設定匯出與分享**

將當前設定（脫敏後）匯出為可分享的 JSON 片段，方便團隊成員參考。

---

## 5. 功能需求

### 5.1 檔案管理

| ID | 需求 | 優先級 |
|----|------|--------|
| F-01 | 啟動時自動偵測並載入 `~/.claude/settings.json` | P0 |
| F-02 | 啟動時自動偵測並載入 `~/.mcp.json`（使用者層級 MCP） | P0 |
| F-03 | 使用者按「儲存」後寫入檔案（非 auto-save） | P0 |
| F-04 | 寫入前備份原始檔案（保留最近 5 份，與 Claude Code 行為一致） | P0 |
| F-05 | 偵測外部修改（file watcher），提示使用者重新載入 | P1 |
| F-06 | 支援選擇專案目錄，載入專案層級設定 | P1 |

### 5.2 Schema 驗證

| ID | 需求 | 優先級 |
|----|------|--------|
| F-10 | 整合官方 JSON Schema（`json.schemastore.org/claude-code-settings.json`）做即時驗證 | P0 |
| F-11 | 欄位層級的錯誤提示：類型錯誤、枚舉值不符、pattern 不匹配 | P0 |
| F-12 | Permission rule 格式驗證（regex: `^((Bash\|Edit\|Read\|...)(\(.*\))?|mcp__.*)$`） | P0 |
| F-13 | 儲存時執行完整 schema validation，阻擋不合法的設定寫入 | P0 |
| F-14 | Schema 版本自動更新（定期從 schemastore 拉取最新版） | P1 |

### 5.3 UI 呈現

| ID | 需求 | 優先級 |
|----|------|--------|
| F-20 | 結構化表單模式：依設定類別分區（Permissions、Hooks、MCP、Env、General） | P0 |
| F-21 | 原始 JSON 編輯模式：帶語法高亮、schema-aware 自動補全 | P0 |
| F-22 | 表單與 JSON 雙向同步：修改其一，另一即時反映 | P0 |
| F-23 | Permission rule 編輯器：Tool 名稱下拉 + specifier 輸入框 | P0 |
| F-24 | Hook 編輯器：event type 選擇 → matcher 輸入 → hook type 選擇 → 對應欄位表單 | P0 |
| F-25 | MCP server 編輯器：transport type 切換表單（stdio vs sse vs streamable-http） | P0 |
| F-26 | 設定項描述（tooltip / inline doc），內容取自 schema description | P0 |
| F-27 | 多層級合併視圖（Merged View），顯示最終生效值與來源 | P1 |
| F-28 | 暗色主題（預設），配合開發者習慣 | P0 |

### 5.4 MCP 設定專區

| ID | 需求 | 優先級 |
|----|------|--------|
| F-30 | 載入並解析 `~/.mcp.json` | P0 |
| F-31 | 視覺化呈現每個 server 的 name、transport、command、args、env | P0 |
| F-32 | 新增 / 編輯 / 刪除 MCP server | P0 |
| F-33 | 環境變數欄位支援密碼遮蔽（如 API keys） | P1 |
| F-34 | 載入專案層級 `.mcp.json` 並與使用者層級合併顯示 | P1 |

### 5.5 版本偵測與建議

| ID | 需求 | 優先級 |
|----|------|--------|
| F-40 | 自動偵測本地安裝的 Claude Code 版本（`claude --version` 或 npm package 版本） | P0 |
| F-41 | 依版本載入對應的 JSON Schema（不同版本可能支援不同欄位） | P0 |
| F-42 | 對已棄用欄位顯示警告（如 `includeCoAuthoredBy` 已被 `attribution` 取代） | P0 |
| F-43 | 對當前版本不支援的欄位標記提示，避免使用者設定無效選項 | P1 |

| 類別 | 需求 |
|------|------|
| **效能** | 啟動到可操作 < 2 秒；載入設定檔 < 500ms |
| **安全** | 不傳送任何設定內容到外部伺服器；所有操作純本地 |
| **可靠性** | 寫入前備份；寫入失敗時復原；不產出不合法 JSON |
| **相容性** | macOS（主要）、Linux、Windows；支援 JSON with trailing commas（Claude Code schema 允許） |
| **可維護性** | Schema 更新不需發版，透過遠端拉取或本地覆蓋 |

---

## 7. 技術約束與決策

| 決策項 | 選擇 | 理由 |
|--------|------|------|
| 框架 | Electron | 生態成熟，快速驗證產品概念；後續可評估 Tauri 重寫 |
| 前端 | React + TypeScript | 社群最大，元件生態豐富 |
| JSON 解析 | jsonc-parser（VS Code 同款） | 支援 trailing commas 與 comments，與 Claude Code 的 `allowTrailingCommas: true` 相容 |
| JSON Schema 驗證 | Ajv（Another JSON Schema Validator） | 支援 draft-07，效能好，生態成熟 |
| JSON 編輯器 | Monaco Editor（VS Code 核心） | 原生支援 JSON schema validation + autocomplete |
| 檔案操作 | Node.js `fs` via Electron main process | 直接讀寫本地檔案 |
| 狀態管理 | Zustand 或 Jotai | 輕量，適合設定類 app |
| 樣式 | Tailwind CSS + shadcn/ui | 快速建構暗色主題 UI |

### 不使用的技術

- **資料庫**：不需要，設定檔本身即持久化
- **網路請求**：僅用於 schema 更新（可選），核心功能不依賴網路
- **後端伺服器**：純本地 app，無 server

---

## 8. 資訊架構

```
App
├── Sidebar（檔案選擇器）
│   ├── User Settings (~/.claude/settings.json)
│   ├── User MCP (~/.mcp.json)
│   └── [P1] Project Settings (選擇專案目錄後展開)
│
├── Main Panel
│   ├── Tab: Form View（結構化表單）
│   │   ├── Section: General（language, model, outputStyle, effortLevel...）
│   │   ├── Section: Permissions（allow / deny / ask rules, defaultMode）
│   │   ├── Section: Hooks（event type → matcher → hook config）
│   │   ├── Section: MCP（servers list with transport config）
│   │   ├── Section: Environment（env key-value pairs）
│   │   ├── Section: Sandbox（network, filesystem rules）
│   │   ├── Section: Plugins（enabled plugins, marketplaces）
│   │   └── Section: Advanced（其餘低頻設定）
│   │
│   └── Tab: JSON View（Monaco Editor with schema）
│
├── Bottom Bar
│   ├── Validation Status（✓ valid / ✗ N errors）
│   └── Save Button
│
└── [P1] Diff Panel（修改前後比對）
```

---

## 9. 設定項分類與 Schema 對應

以下為 `settings.json` 主要設定項的分區歸屬，基於官方 JSON Schema：

### General（一般設定）

| 欄位 | 類型 | UI 元件 |
|------|------|---------|
| `language` | string | Text input with suggestions |
| `model` | string | Text input |
| `availableModels` | string[] | Tag input |
| `effortLevel` | enum: low/medium/high | Radio group |
| `outputStyle` | string | Text input with suggestions |
| `autoUpdatesChannel` | enum: stable/latest | Toggle |
| `cleanupPeriodDays` | integer (min: 0) | Number input |
| `respectGitignore` | boolean | Toggle |
| `spinnerTipsEnabled` | boolean | Toggle |
| `showTurnDuration` | boolean | Toggle |
| `prefersReducedMotion` | boolean | Toggle |
| `alwaysThinkingEnabled` | boolean | Toggle |
| `forceLoginMethod` | enum: claudeai/console | Select |

### Permissions（權限設定）

| 欄位 | 類型 | UI 元件 |
|------|------|---------|
| `permissions.allow` | permissionRule[] | Rule list editor |
| `permissions.deny` | permissionRule[] | Rule list editor |
| `permissions.ask` | permissionRule[] | Rule list editor |
| `permissions.defaultMode` | enum (6 values) | Select |
| `permissions.disableBypassPermissionsMode` | enum: "disable" | Toggle |
| `permissions.additionalDirectories` | string[] | Path list editor |

**permissionRule 編輯器需求**：Tool 名稱下拉選單（Bash, Edit, Read, Write, WebFetch, Task, mcp__...）+ specifier 文字輸入框，輸入時即時驗證 pattern。

### Hooks（鉤子設定）

Event Types（15 種）：`PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`, `Notification`, `UserPromptSubmit`, `Stop`, `SubagentStart`, `SubagentStop`, `PreCompact`, `TeammateIdle`, `TaskCompleted`, `SessionStart`, `SessionEnd`, `Setup`

每個 event 下為 hookMatcher[] 陣列，每個 matcher 包含可選 `matcher` 字串 + `hooks[]` 陣列。

Hook 有三種 type：
- `command`：command (必填), timeout, async, statusMessage
- `prompt`：prompt (必填), model, timeout, statusMessage
- `agent`：prompt (必填), model, timeout, statusMessage

### MCP（.mcp.json）

每個 server entry 需要：
- Server name（key）
- Transport type（stdio / sse / streamable-http）
- 依 transport 不同的欄位（command, args, env / url, headers）

### Environment（環境變數）

- Key 必須符合 `^[A-Z_][A-Z0-9_]*$`
- 常用 key 提供建議列表（ANTHROPIC_MODEL, ANTHROPIC_BASE_URL, etc.）

### Sandbox（沙箱設定）

巢狀物件結構，包含 network（allowedDomains, deniedDomains, proxy ports）、ignoreViolations、excludedCommands 等。

### Attribution（署名設定）

- `attribution.commit`：string
- `attribution.pr`：string

---

## 10. MVP 範圍定義

### In Scope（MVP）

- 自動載入並編輯 `~/.claude/settings.json`
- 自動載入並編輯 `~/.mcp.json`
- 自動偵測 Claude Code 版本，載入對應 schema，標記棄用欄位
- 結構化表單 + JSON 雙視圖
- 基於官方 JSON Schema 的即時驗證（使用 jsonc-parser 支援 trailing commas）
- Permission rule 專用編輯器
- Hook 專用編輯器
- MCP server 專用編輯器
- 儲存前驗證、寫入前備份
- macOS 支援
- 暗色主題

### Out of Scope（MVP）

- 專案層級設定編輯（P1）
- 多層級合併視圖（P1）
- `.claude/commands/` 管理（P1）
- 設定推薦 / 新手引導
- 設定同步 / 雲端備份
- managed-settings.json 編輯（企業功能）
- 自動重啟 Claude Code session
- Linux / Windows 支援（P1，Electron 天然跨平台但需測試）

---

## 11. 成功指標

由於這是開發者工具，傳統的用戶量指標意義有限。建議追蹤：

| 指標 | 目標 | 衡量方式 |
|------|------|----------|
| 驗證攔截率 | 使用者嘗試儲存不合法設定時被攔截的比例 > 0（證明驗證有價值） | 本地 analytics（opt-in） |
| 設定完成時間 | 從開啟 app 到完成一次修改 < 30 秒 | 使用者反饋 |
| 零資料遺失 | 不因 app 操作導致設定檔損壞或資料遺失 | Bug reports = 0 |

---

## 12. 風險與緩解

| 風險 | 影響 | 緩解 |
|------|------|------|
| 官方 Schema 變更導致 app 無法驗證新欄位 | 新設定項在表單中缺失 | `additionalProperties: true` 允許未知欄位；JSON view 始終可編輯全部內容；定期更新 schema |
| Claude Code 設定格式出現 breaking change | App 讀寫出錯 | 寫入前備份；Schema 版本偵測 |
| Electron bundle 過大影響使用者接受度 | 下載/安裝意願低 | MVP 驗證後可評估 Tauri 重寫 |
| 使用者在 JSON view 繞過表單驗證輸入不合法內容 | 寫入不合法設定 | 儲存時對 JSON view 也執行 schema validation |

---

## 13. 開放問題（已決議）

| # | 問題 | 決議 |
|---|------|------|
| 1 | 是否開源？ | 不限定，後續再決定 |
| 2 | MCP `.mcp.json` 是否有官方 JSON Schema？若無，需自行定義 | 待調查。若無官方 schema，需根據 Claude Code 文件自行維護 |
| 3 | 是否需要支援 `settings.local.json`？ | **否**，MVP 不做 |
| 4 | Trailing commas 處理 | **需要支援**。技術決策：使用 `jsonc-parser`（VS Code 同款）取代標準 JSON.parse |
| 5 | 是否整合文件連結？ | **否**。改為自動偵測 Claude Code 版本，針對版本提供設定建議（見 F-40） |

---

## 附錄 A：檔案層級與優先序

```
優先級高 → 低：

1. Managed Settings    (managed-settings.json)          ← 不可覆寫
2. Enterprise Server   (server-managed)                  ← 不可覆寫
3. Local Settings      (.claude/settings.local.json)     ← 不進版控
4. Project Settings    (.claude/settings.json)           ← 進版控
5. User Settings       (~/.claude/settings.json)         ← MVP 範圍
```

## 附錄 B：Permission Rule Pattern 參考

合法工具名稱（截至 2026-02）：

```
Bash, Edit, ExitPlanMode, Glob, Grep, KillShell, LS, LSP,
MultiEdit, NotebookEdit, NotebookRead, Read, Skill, Task,
TaskCreate, TaskGet, TaskList, TaskOutput, TaskStop, TaskUpdate,
TodoWrite, ToolSearch, WebFetch, WebSearch, Write
```

Specifier 範例：
- `Bash(npm run build)` — 精確匹配
- `Bash(git commit *)` — wildcard
- `Read(./.env)` — 路徑匹配
- `Read(**/*.key)` — gitignore 語法
- `WebFetch(domain:example.com)` — domain 限定
- `mcp__github__search_repositories` — MCP tool

## 附錄 C：官方 JSON Schema 來源

```
https://json.schemastore.org/claude-code-settings.json
```

此 Schema 為 draft-07 格式，包含完整的欄位定義、類型、枚舉值、pattern 與 description。App 應以此為 single source of truth 進行驗證。
