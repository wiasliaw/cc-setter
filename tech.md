# Tech Spec：Claude Code Settings Editor

> **版本**：v0.1 Draft  
> **日期**：2026-02-18  
> **對應 PRD**：v0.1  
> **狀態**：Ready for Review

---

## 1. 系統架構

### 1.1 高階架構

採用 Electron 標準的 Main / Renderer 雙程序架構，透過 IPC 通訊。

```
┌─────────────────────────────────────────────────────┐
│                   Renderer Process                   │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Form View│  │JSON View │  │  Validation UI    │  │
│  │ (React)  │  │ (Monaco) │  │  (error badges)   │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       │              │                 │             │
│  ┌────▼──────────────▼─────────────────▼──────────┐  │
│  │              State Layer (Zustand)              │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐  │  │
│  │  │ settings   │ │ mcp        │ │ validation │  │  │
│  │  │ Store      │ │ Store      │ │ Store      │  │  │
│  │  └────────────┘ └────────────┘ └────────────┘  │  │
│  └────────────────────┬───────────────────────────┘  │
│                       │ IPC (contextBridge)           │
├───────────────────────┼─────────────────────────────┤
│                       │      Main Process            │
│  ┌────────────────────▼───────────────────────────┐  │
│  │              Service Layer                      │  │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────┐  │  │
│  │  │ File     │ │ Schema   │ │ Version        │  │  │
│  │  │ Service  │ │ Service  │ │ Detect Service │  │  │
│  │  └──────────┘ └──────────┘ └────────────────┘  │  │
│  └─────────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────────┐  │
│  │              File System                        │  │
│  │  ~/.claude/settings.json  ~/.mcp.json  backups/ │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 1.2 程序職責

| 程序 | 職責 | 禁止 |
|------|------|------|
| **Main Process** | 檔案讀寫、備份、版本偵測、schema 載入/更新、file watcher | 不操作 DOM |
| **Renderer Process** | UI 渲染、表單邏輯、驗證回饋、Monaco Editor | 不直接存取 fs |

### 1.3 IPC 通道定義

```typescript
// Main → Renderer
type IpcChannels = {
  // File operations
  'file:read': (filePath: string) => FileReadResult;
  'file:write': (filePath: string, content: string) => WriteResult;
  'file:backup': (filePath: string) => BackupResult;
  'file:watch-change': (filePath: string) => void; // event push

  // Schema
  'schema:get-settings': () => JSONSchema;
  'schema:get-mcp': () => JSONSchema;

  // Version
  'version:detect': () => VersionInfo;
};

interface FileReadResult {
  success: boolean;
  content: string;        // raw JSONC string
  parsed: unknown;        // parsed object
  filePath: string;
  lastModified: number;
  error?: string;
}

interface WriteResult {
  success: boolean;
  backupPath?: string;
  error?: string;
}

interface VersionInfo {
  version: string | null;     // e.g. "2.1.7"
  installPath: string | null; // e.g. "/usr/local/bin/claude"
  detected: boolean;
}
```

---

## 2. 核心模組設計

### 2.1 File Service（Main Process）

負責所有檔案 I/O，確保安全寫入。

```typescript
// src/main/services/file-service.ts

import { parse, modify, applyEdits } from 'jsonc-parser';

class FileService {
  private readonly MAX_BACKUPS = 5;

  /**
   * 讀取 JSONC 檔案
   * - 使用 jsonc-parser 處理 trailing commas 與 comments
   * - 保留原始字串供 Monaco Editor 使用
   */
  async read(filePath: string): Promise<FileReadResult>;

  /**
   * 安全寫入
   * 1. 備份現有檔案 → ~/.claude/backups/{filename}.{timestamp}.bak
   * 2. 寫入 temp file
   * 3. atomic rename temp → target
   * 4. 清理超過 MAX_BACKUPS 的舊備份
   */
  async write(filePath: string, content: string): Promise<WriteResult>;

  /**
   * 格式化輸出
   * - 保留 trailing comma 風格（如原始檔有則保留）
   * - 2 space indent
   * - 確保結尾換行
   */
  formatOutput(parsed: unknown, originalContent: string): string;

  /**
   * File watcher
   * - 使用 fs.watch 監聽變更
   * - debounce 500ms 避免重複觸發
   * - 變更時透過 IPC 通知 renderer
   */
  watch(filePath: string, callback: () => void): FSWatcher;
}
```

**安全寫入流程**：

```
原始檔案存在?
├── Yes → 備份至 ~/.claude/backups/{name}.{ISO-timestamp}.bak
│         → 清理超過 5 份的舊備份
│         → 寫入 .tmp 暫存檔
│         → fs.rename(.tmp → target)（atomic）
│         → 成功：回傳 backupPath
│         → 失敗：保留 .tmp，回傳 error
└── No  → 直接建立新檔（含父目錄 mkdir -p）
```

### 2.2 Schema Service（Main Process）

管理 JSON Schema 的載入、快取與版本對應。

```typescript
// src/main/services/schema-service.ts

class SchemaService {
  private settingsSchema: JSONSchema | null = null;
  private mcpSchema: JSONSchema | null = null;

  /**
   * 載入 settings.json schema
   * 優先順序：
   * 1. 本地快取 ~/.claude-settings-editor/schemas/settings-{version}.json
   * 2. 內建 bundled schema（隨 app 發版）
   * 3. 遠端 https://json.schemastore.org/claude-code-settings.json（離線時跳過）
   */
  async getSettingsSchema(version?: string): Promise<JSONSchema>;

  /**
   * 載入 MCP schema
   * 目前無官方 schema，使用自行維護的定義
   */
  async getMcpSchema(): Promise<JSONSchema>;

  /**
   * 取得棄用欄位清單（依版本）
   * 例：version >= 2.0 → includeCoAuthoredBy 標記為 deprecated
   */
  getDeprecatedFields(version: string): DeprecatedField[];

  /**
   * 定期檢查 schema 更新（每 24 小時，app 啟動時）
   */
  async checkForUpdates(): Promise<boolean>;
}

interface DeprecatedField {
  path: string;           // e.g. "includeCoAuthoredBy"
  since: string;          // version string
  replacement?: string;   // e.g. "attribution"
  message: string;        // 顯示給使用者的訊息
}
```

### 2.3 Version Detect Service（Main Process）

```typescript
// src/main/services/version-service.ts

class VersionDetectService {
  /**
   * 偵測 Claude Code 版本
   * 1. 執行 `claude --version`（child_process.exec, timeout 3s）
   * 2. 解析 stdout 取得版本號
   * 3. fallback: 讀取 npm global package version
   *    `npm list -g @anthropic-ai/claude-code --json`
   */
  async detect(): Promise<VersionInfo>;
}
```

### 2.4 Validation Engine（Renderer Process）

在 renderer 執行，提供即時回饋。

```typescript
// src/renderer/services/validation-engine.ts

import Ajv from 'ajv';

class ValidationEngine {
  private ajv: Ajv;

  constructor(schema: JSONSchema) {
    this.ajv = new Ajv({
      allErrors: true,      // 回報所有錯誤，不只第一個
      verbose: true,         // 包含 schema 片段供 UI 顯示
      strict: false,         // 允許 unknown keywords
    });
  }

  /**
   * 驗證完整設定物件
   * 回傳結構化錯誤列表，每個錯誤包含：
   * - path: JSON pointer (e.g. "/permissions/allow/0")
   * - message: 人可讀的錯誤訊息
   * - severity: 'error' | 'warning'（warning 用於 deprecated fields）
   */
  validate(data: unknown): ValidationResult;

  /**
   * 驗證單一欄位（表單即時回饋用）
   */
  validateField(path: string, value: unknown): FieldValidationResult;

  /**
   * Permission rule 專用驗證
   * 使用 schema 中定義的 regex pattern 驗證
   */
  validatePermissionRule(rule: string): boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];   // deprecated fields 等
}

interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
  schemaPath?: string;
}
```

---

## 3. State 設計

使用 Zustand，拆分為三個獨立 store。

### 3.1 Settings Store

```typescript
// src/renderer/stores/settings-store.ts

interface SettingsState {
  // Data
  raw: string;                    // 原始 JSONC 字串（給 Monaco）
  parsed: ClaudeCodeSettings;     // 解析後物件（給 Form）
  filePath: string;
  lastSavedAt: number | null;

  // UI state
  activeView: 'form' | 'json';
  activeSection: SectionId;
  isDirty: boolean;               // 有未儲存的修改
  isLoading: boolean;

  // Actions
  load: () => Promise<void>;
  updateField: (path: string, value: unknown) => void;
  updateRaw: (jsonc: string) => void;   // Monaco 編輯時
  save: () => Promise<WriteResult>;
  reload: () => Promise<void>;          // 外部修改後重新載入
}

type SectionId =
  | 'general'
  | 'permissions'
  | 'hooks'
  | 'mcp'
  | 'environment'
  | 'sandbox'
  | 'plugins'
  | 'advanced';
```

### 3.2 MCP Store

```typescript
interface McpState {
  raw: string;
  parsed: McpConfig;
  filePath: string;
  isDirty: boolean;

  load: () => Promise<void>;
  addServer: (name: string, config: McpServerConfig) => void;
  updateServer: (name: string, config: Partial<McpServerConfig>) => void;
  removeServer: (name: string) => void;
  save: () => Promise<WriteResult>;
}

interface McpConfig {
  mcpServers: Record<string, McpServerConfig>;
}

interface McpServerConfig {
  // stdio transport
  command?: string;
  args?: string[];
  env?: Record<string, string>;

  // sse / streamable-http transport
  url?: string;
  headers?: Record<string, string>;

  // common
  type?: 'stdio' | 'sse' | 'streamable-http';
}
```

### 3.3 Validation Store

```typescript
interface ValidationState {
  errors: ValidationError[];
  warnings: ValidationWarning[];
  isValid: boolean;

  // Derived: grouped by section for UI badges
  errorsBySection: Record<SectionId, ValidationError[]>;

  // Actions
  runValidation: (data: unknown) => void;
  clearErrors: () => void;
}
```

### 3.4 State 同步流程

Form View 與 JSON View 的雙向同步：

```
Form View 修改
  → updateField(path, value)
  → 更新 parsed（immutable update via immer）
  → 序列化為 JSONC → 更新 raw
  → Monaco 接收新 raw 並更新
  → 觸發 validation

JSON View 修改（Monaco）
  → updateRaw(jsonc)
  → jsonc-parser.parse → 更新 parsed
  → Form 接收新 parsed 並重新渲染
  → 觸發 validation

Validation
  → 每次 parsed 變更時自動執行
  → debounce 300ms
  → 結果寫入 ValidationStore
  → UI 反映錯誤狀態
```

---

## 4. UI 元件設計

### 4.1 元件樹

```
<App>
├── <Sidebar>
│   ├── <FileSelector>          // 切換 settings / mcp
│   ├── <SectionNav>            // 各 section 導航 + error badge
│   └── <VersionBadge>          // Claude Code 版本顯示
│
├── <MainPanel>
│   ├── <ViewToggle>            // Form / JSON 切換
│   │
│   ├── <FormView>
│   │   ├── <GeneralSection>
│   │   │   ├── <EnumField>         // effortLevel, autoUpdatesChannel
│   │   │   ├── <BooleanField>      // toggles
│   │   │   ├── <StringField>       // language, model
│   │   │   └── <TagListField>      // availableModels
│   │   │
│   │   ├── <PermissionsSection>
│   │   │   ├── <PermissionModeSelect>
│   │   │   └── <RuleListEditor>    // allow / deny / ask
│   │   │       └── <RuleInput>     // Tool dropdown + specifier input
│   │   │
│   │   ├── <HooksSection>
│   │   │   └── <HookEventGroup>    // per event type
│   │   │       └── <HookMatcherEditor>
│   │   │           ├── <MatcherInput>
│   │   │           └── <HookConfigForm>  // command / prompt / agent
│   │   │
│   │   ├── <McpSection>
│   │   │   └── <McpServerCard>     // per server
│   │   │       ├── <TransportToggle>
│   │   │       └── <TransportForm> // stdio fields / sse fields
│   │   │
│   │   ├── <EnvironmentSection>
│   │   │   └── <KeyValueEditor>    // key validation + suggestions
│   │   │
│   │   ├── <SandboxSection>
│   │   │   └── <DomainListEditor>  // allowed/denied domains
│   │   │
│   │   └── <AdvancedSection>
│   │       └── <GenericFieldRenderer>  // fallback 渲染
│   │
│   └── <JsonView>
│       └── <MonacoEditor>          // schema-aware
│
└── <BottomBar>
    ├── <ValidationStatus>          // ✓ / ✗ N errors, M warnings
    ├── <DirtyIndicator>            // 未儲存提示
    └── <SaveButton>                // disabled when invalid
```

### 4.2 關鍵元件規格

#### RuleListEditor（Permission Rules）

```typescript
interface RuleListEditorProps {
  rules: string[];
  category: 'allow' | 'deny' | 'ask';
  onChange: (rules: string[]) => void;
}

// 行為：
// - 每條 rule 一行，可拖曳排序（順序影響匹配優先級）
// - 新增時彈出 RuleInput：
//   1. Tool 下拉（從 schema permissionRule pattern 提取合法 tool names）
//   2. Specifier 輸入框（可選，依 tool 類型顯示 placeholder）
//   3. 即時驗證 pattern
// - 刪除需確認
```

合法 Tool 名稱（硬編碼 + schema 更新時同步）：

```typescript
const TOOL_NAMES = [
  'Bash', 'Edit', 'ExitPlanMode', 'Glob', 'Grep', 'KillShell',
  'LS', 'LSP', 'MultiEdit', 'NotebookEdit', 'NotebookRead',
  'Read', 'Skill', 'Task', 'TaskCreate', 'TaskGet', 'TaskList',
  'TaskOutput', 'TaskStop', 'TaskUpdate', 'TodoWrite', 'ToolSearch',
  'WebFetch', 'WebSearch', 'Write'
] as const;

// MCP tools 從使用者的 mcp config 動態生成：mcp__{serverName}__{toolName}
```

#### HookConfigForm

根據 hook type 動態渲染不同欄位：

```typescript
type HookType = 'command' | 'prompt' | 'agent';

// command type 欄位
interface CommandHookFields {
  command: string;        // required, text input
  timeout?: number;       // optional, number input (seconds)
  async?: boolean;        // optional, toggle
  statusMessage?: string; // optional, text input
}

// prompt type 欄位
interface PromptHookFields {
  prompt: string;         // required, textarea（多行）
  model?: string;         // optional, text input
  timeout?: number;       // optional, number input (default: 30)
  statusMessage?: string;
}

// agent type 欄位
interface AgentHookFields {
  prompt: string;         // required, textarea
  model?: string;
  timeout?: number;       // optional, number input (default: 60)
  statusMessage?: string;
}
```

#### McpServerCard

```typescript
interface McpServerCardProps {
  name: string;
  config: McpServerConfig;
  onChange: (config: McpServerConfig) => void;
  onDelete: () => void;
}

// 行為：
// - 卡片式呈現，可展開/收合
// - Transport type toggle 切換不同表單：
//   stdio → command (required), args[] (tag input), env (key-value editor)
//   sse   → url (required), headers (key-value editor)
// - env 欄位中的 API key 等敏感值以 password 遮蔽顯示
```

#### GenericFieldRenderer

處理 schema 中未被專用元件覆蓋的欄位（fallback）：

```typescript
// 根據 schema type 自動選擇 UI 元件
function resolveComponent(schema: JSONSchema): React.ComponentType {
  if (schema.enum) return EnumField;
  if (schema.type === 'boolean') return BooleanField;
  if (schema.type === 'integer') return NumberField;
  if (schema.type === 'string') return StringField;
  if (schema.type === 'array') return ArrayField;
  if (schema.type === 'object') return ObjectField;
  return RawJsonField;  // 最終 fallback
}
```

這確保官方新增 app 尚未專門處理的欄位時，使用者仍可在 Form View 中編輯。

---

## 5. MCP Schema 定義

目前無官方 `.mcp.json` JSON Schema，需自行維護：

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Claude Code MCP Configuration",
  "type": "object",
  "properties": {
    "mcpServers": {
      "type": "object",
      "additionalProperties": {
        "oneOf": [
          {
            "type": "object",
            "description": "stdio transport",
            "required": ["command"],
            "properties": {
              "command": { "type": "string", "minLength": 1 },
              "args": {
                "type": "array",
                "items": { "type": "string" }
              },
              "env": {
                "type": "object",
                "additionalProperties": { "type": "string" }
              },
              "type": {
                "type": "string",
                "const": "stdio"
              }
            },
            "additionalProperties": false
          },
          {
            "type": "object",
            "description": "sse transport",
            "required": ["url"],
            "properties": {
              "url": { "type": "string", "format": "uri" },
              "headers": {
                "type": "object",
                "additionalProperties": { "type": "string" }
              },
              "type": {
                "type": "string",
                "const": "sse"
              }
            },
            "additionalProperties": false
          },
          {
            "type": "object",
            "description": "streamable-http transport",
            "required": ["url"],
            "properties": {
              "url": { "type": "string", "format": "uri" },
              "headers": {
                "type": "object",
                "additionalProperties": { "type": "string" }
              },
              "type": {
                "type": "string",
                "const": "streamable-http"
              }
            },
            "additionalProperties": false
          }
        ]
      }
    }
  },
  "required": ["mcpServers"],
  "additionalProperties": false
}
```

---

## 6. JSONC 處理策略

Claude Code schema 宣告 `allowTrailingCommas: true`，標準 `JSON.parse` 無法處理。

### 讀取

```typescript
import { parse, ParseError } from 'jsonc-parser';

function readJsonc(content: string): { data: unknown; errors: ParseError[] } {
  const errors: ParseError[] = [];
  const data = parse(content, errors, {
    allowTrailingComma: true,
    disallowComments: false,
  });
  return { data, errors };
}
```

### 寫入

```typescript
import { modify, applyEdits } from 'jsonc-parser';

/**
 * 保留原始格式風格的修改策略：
 * - 使用 jsonc-parser 的 modify() 做 surgical edit
 * - 保留原始 indent、trailing comma 風格
 * - 僅在「全新檔案」或「從 form 完整重建」時使用 JSON.stringify
 */
function updateField(
  originalContent: string,
  path: JSONPath,
  value: unknown
): string {
  const edits = modify(originalContent, path, value, {
    formattingOptions: { tabSize: 2, insertSpaces: true },
  });
  return applyEdits(originalContent, edits);
}
```

---

## 7. Monaco Editor 整合

### 7.1 Schema 註冊

```typescript
import * as monaco from 'monaco-editor';

monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
  validate: true,
  allowComments: true,
  trailingCommas: 'ignore',
  schemas: [
    {
      uri: 'claude-code-settings-schema',
      fileMatch: ['settings.json'],
      schema: settingsSchema,
    },
    {
      uri: 'claude-code-mcp-schema',
      fileMatch: ['mcp.json'],
      schema: mcpSchema,
    },
  ],
});
```

### 7.2 雙向同步的防抖策略

```typescript
// Form → Monaco：立即同步（form 修改是離散事件）
// Monaco → Form：debounce 500ms（打字時不需每個字元都 parse）
// 防止循環更新：用 flag 標記更新來源
let syncSource: 'form' | 'monaco' | null = null;
```

---

## 8. 版本偵測與 Deprecated 欄位

### 8.1 偵測流程

```
App 啟動
  → exec('claude --version', { timeout: 3000 })
  ├── 成功 → 解析版本號 (e.g. "Claude Code v2.1.7" → "2.1.7")
  ├── 失敗 → exec('npm list -g @anthropic-ai/claude-code --json')
  │          ├── 成功 → 從 JSON 取版本
  │          └── 失敗 → version = null，使用最新 bundled schema
  └── 將版本資訊存入 VersionStore
```

### 8.2 Deprecated 欄位定義

以資料驅動方式管理：

```typescript
// src/shared/deprecated-fields.ts

const DEPRECATED_FIELDS: DeprecatedField[] = [
  {
    path: 'includeCoAuthoredBy',
    since: '1.0.0',
    replacement: 'attribution',
    message: '此欄位已棄用，請改用 attribution.commit 與 attribution.pr',
  },
];

// Form View 中：
// - deprecated 欄位顯示黃色警告 badge
// - tooltip 顯示 message 與建議替代
// - 不阻擋儲存（warning, not error）
```

---

## 9. 專案結構

```
claude-code-settings-editor/
├── package.json
├── electron-builder.yml
├── tsconfig.json
├── tailwind.config.ts
│
├── src/
│   ├── main/                      # Electron Main Process
│   │   ├── index.ts               # app entry, window creation
│   │   ├── ipc.ts                 # IPC handler 註冊
│   │   ├── preload.ts             # contextBridge 定義
│   │   └── services/
│   │       ├── file-service.ts
│   │       ├── schema-service.ts
│   │       └── version-service.ts
│   │
│   ├── renderer/                  # React App
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   ├── stores/
│   │   │   ├── settings-store.ts
│   │   │   ├── mcp-store.ts
│   │   │   └── validation-store.ts
│   │   ├── services/
│   │   │   └── validation-engine.ts
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── MainPanel.tsx
│   │   │   │   └── BottomBar.tsx
│   │   │   ├── form/
│   │   │   │   ├── GeneralSection.tsx
│   │   │   │   ├── PermissionsSection.tsx
│   │   │   │   ├── HooksSection.tsx
│   │   │   │   ├── McpSection.tsx
│   │   │   │   ├── EnvironmentSection.tsx
│   │   │   │   ├── SandboxSection.tsx
│   │   │   │   └── AdvancedSection.tsx
│   │   │   ├── editors/
│   │   │   │   ├── RuleListEditor.tsx
│   │   │   │   ├── RuleInput.tsx
│   │   │   │   ├── HookMatcherEditor.tsx
│   │   │   │   ├── HookConfigForm.tsx
│   │   │   │   ├── McpServerCard.tsx
│   │   │   │   ├── KeyValueEditor.tsx
│   │   │   │   └── DomainListEditor.tsx
│   │   │   ├── fields/
│   │   │   │   ├── BooleanField.tsx
│   │   │   │   ├── EnumField.tsx
│   │   │   │   ├── StringField.tsx
│   │   │   │   ├── NumberField.tsx
│   │   │   │   ├── TagListField.tsx
│   │   │   │   └── GenericFieldRenderer.tsx
│   │   │   └── json/
│   │   │       └── MonacoWrapper.tsx
│   │   └── hooks/
│   │       ├── useIpc.ts
│   │       ├── useValidation.ts
│   │       └── useDirtyCheck.ts
│   │
│   └── shared/
│       ├── types.ts
│       ├── constants.ts
│       ├── deprecated-fields.ts
│       └── schemas/
│           ├── settings-schema.json
│           └── mcp-schema.json
│
├── resources/
│   └── icon.icns
│
└── scripts/
    └── fetch-schema.ts
```

---

## 10. 建構與打包

### 10.1 技術棧版本

| 依賴 | 版本 | 用途 |
|------|------|------|
| electron | ^33 | 應用框架 |
| electron-builder | ^25 | 打包 |
| react | ^19 | UI |
| typescript | ^5.7 | 型別系統 |
| zustand | ^5 | 狀態管理 |
| ajv | ^8 | JSON Schema 驗證 |
| jsonc-parser | ^3 | JSONC 解析 |
| monaco-editor | ^0.52 | JSON 編輯器 |
| tailwindcss | ^4 | 樣式 |
| @shadcn/ui | latest | UI 元件庫 |
| vite | ^6 | 建構工具 |
| electron-vite | ^3 | Electron + Vite 整合 |

### 10.2 打包設定

```yaml
# electron-builder.yml
appId: com.claude-code-settings-editor
productName: Claude Code Settings Editor
mac:
  target: [dmg, zip]
  category: public.app-category.developer-tools
  hardenedRuntime: true
```

### 10.3 開發腳本

```json
{
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "package": "electron-builder --mac",
    "fetch-schema": "tsx scripts/fetch-schema.ts",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "vitest"
  }
}
```

---

## 11. 測試策略

| 層級 | 範圍 | 工具 |
|------|------|------|
| Unit | ValidationEngine、FileService JSONC 解析/格式化、deprecated field 判斷 | Vitest |
| Integration | IPC 通訊、File read → parse → validate → render 完整流程 | Vitest + @testing-library/react |
| E2E | 啟動 app → 載入設定 → 修改 → 驗證 → 儲存 → 確認檔案內容 | Playwright + Electron |

### 關鍵測試案例

```typescript
// FileService
- 讀取合法 JSON → 正確 parse
- 讀取含 trailing comma 的 JSONC → 正確 parse
- 讀取含 comment 的 JSONC → 正確 parse
- 讀取空檔案 → 回傳空物件
- 讀取不存在的檔案 → 回傳 error
- 寫入時自動備份 → 確認 backup 存在
- 備份超過 5 份 → 最舊的被刪除
- atomic write → 寫入中斷不破壞原檔

// ValidationEngine
- 合法設定 → valid = true, errors = []
- 不合法 permission rule (e.g. "bash(npm)") → error at path
- 不合法 enum (e.g. effortLevel: "ultra") → error
- 未知欄位 → 不報錯（additionalProperties: true）
- deprecated 欄位 → warning, not error

// Form ↔ JSON 同步
- form 修改 → JSON view 更新
- JSON view 修改 → form 更新
- 不合法 JSON 輸入 → form 不更新，顯示 parse error
```

---

## 12. 已知限制

| 限制 | 原因 | 影響 |
|------|------|------|
| 無法自動重啟 Claude Code session | Claude Code CLI 無 reload config API | 使用者需手動重啟 |
| MCP schema 需自行維護 | 無官方 schema | 可能與新版不同步 |
| Monaco Editor 增加 bundle ~5MB | 完整 editor 核心 | Electron 本身已較大，相對影響小 |
| 首次啟動偵測版本增加 1-2 秒 | exec child process | 可背景執行不阻塞 UI |
