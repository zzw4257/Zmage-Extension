# Zmage Extension 架构文档 / Architecture Documentation

## 系统架构 / System Architecture

### 整体架构图 / Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Chrome Browser                          │
│                                                                 │
│  ┌─────────────────┐    ┌──────────────────┐                  │
│  │   Popup UI      │    │   Options UI     │                  │
│  │  (popup.html)   │    │  (options.html)  │                  │
│  └────────┬────────┘    └────────┬─────────┘                  │
│           │                      │                              │
│           │                      │                              │
│  ┌────────┴──────────────────────┴─────────┐                  │
│  │                                          │                  │
│  │      Background Service Worker           │                  │
│  │         (background.js)                  │                  │
│  │                                          │                  │
│  │  • Upload Queue Manager                 │                  │
│  │  • Authentication Handler               │                  │
│  │  • Context Menu Manager                 │                  │
│  │  • Notification Manager                 │                  │
│  │                                          │                  │
│  └───────────┬──────────────────────────────┘                  │
│              │                                                  │
│              │                                                  │
│  ┌───────────┴──────────────────────────────┐                  │
│  │                                          │                  │
│  │        Content Script                    │                  │
│  │        (content.js)                      │                  │
│  │                                          │                  │
│  │  • Page Resource Scanner                │                  │
│  │  • DOM Element Collector                │                  │
│  │                                          │                  │
│  └──────────────────────────────────────────┘                  │
│                                                                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ HTTPS/HTTP
                          │
                          ▼
              ┌───────────────────────┐
              │                       │
              │   Zmage Server        │
              │   (localhost:3000)    │
              │                       │
              │  • API Endpoints      │
              │  • Authentication     │
              │  • File Storage       │
              │  • Image Processing   │
              │                       │
              └───────────────────────┘
```

---

## 组件详解 / Component Details

### 1. Background Service Worker (background.js)

**职责 / Responsibilities:**
- 管理上传任务队列
- 处理用户认证
- 管理右键菜单
- 发送桌面通知
- 与 Zmage 服务器通信

**核心模块 / Core Modules:**

```
background.js
├── Queue Manager
│   ├── Task enqueueing
│   ├── Concurrent upload (max 4)
│   ├── Retry mechanism
│   └── Task status broadcast
│
├── Authentication Manager
│   ├── Session check
│   ├── Login flow control
│   └── Cookie management
│
├── Context Menu Manager
│   ├── Menu creation
│   └── Menu click handlers
│
└── Notification Manager
    ├── Notification creation
    ├── Action button handlers
    └── Click event handlers
```

**数据流 / Data Flow:**

```
User Action → Enqueue Task → Queue Processing
                                     │
                                     ├→ Check Auth → Login if needed
                                     │
                                     ├→ Upload to Server
                                     │
                                     ├→ Handle Success → Notify User
                                     │
                                     └→ Handle Failure → Retry or Report
```

---

### 2. Popup UI (popup.html/js/css)

**职责 / Responsibilities:**
- 显示扩展状态
- 展示页面资源列表
- 显示上传任务队列
- 提供快捷操作入口

**UI 布局 / UI Layout:**

```
┌─────────────────────────────────┐
│  Zmage                          │ ← Header
├─────────────────────────────────┤
│  服务地址: http://localhost:... │ ← Status Bar
│  状态：已登录 ✓                 │
│  [去登录]                       │
├─────────────────────────────────┤
│  采集本页资源                   │ ← Resources Section
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐      │
│  │☑📷│ │☑📷│ │☑🎬│ │☑📷│      │   Resource Grid
│  └───┘ └───┘ └───┘ └───┘      │
│  [重新扫描] [开始上传]          │
├─────────────────────────────────┤
│  上传任务                       │ ← Tasks Section
│  • image.png    [已完成] ✓     │
│  • video.mp4    [上传中] ⏳    │   Task List
│  • photo.jpg    [失败] [重试]  │
├─────────────────────────────────┤
│  [图片库] [视频库] [设置]      │ ← Footer Actions
└─────────────────────────────────┘
```

**状态管理 / State Management:**

```
popup.js
├── Local State
│   ├── settings (from storage)
│   ├── resources (from content script)
│   ├── tasks (from background)
│   └── authStatus (from background)
│
└── Event Listeners
    ├── Scan button → Query content script
    ├── Upload button → Send to background
    ├── Retry button → Trigger retry
    └── Runtime messages → Update UI
```

---

### 3. Content Script (content.js)

**职责 / Responsibilities:**
- 扫描页面中的图片和视频
- 收集媒体元素的元数据
- 响应扩展的查询请求

**扫描流程 / Scanning Flow:**

```
Page Load
    │
    ├→ Wait for document_idle
    │
    └→ Content Script Injected
            │
            ├→ Listen for scan requests
            │
            └→ On request:
                    │
                    ├→ Query all <img> elements
                    │   ├─ Get src/currentSrc
                    │   ├─ Get alt/title
                    │   └─ Filter duplicates
                    │
                    ├→ Query all <video> elements
                    │   ├─ Get src/currentSrc
                    │   ├─ Get title/name
                    │   └─ Filter duplicates
                    │
                    └→ Return resource list
```

**数据结构 / Data Structure:**

```javascript
Resource {
  type: 'image' | 'video',
  src: string,           // Media URL
  alt: string,           // Alt text or label
  title: string          // Title attribute
}
```

---

### 4. Options Page (options.html/js/css)

**职责 / Responsibilities:**
- 配置 Zmage 服务地址
- 设置界面语言
- 配置隐私选项
- 测试连接

**设置项 / Settings:**

```
┌─────────────────────────────────────┐
│  Zmage 插件设置                     │
├─────────────────────────────────────┤
│                                     │
│  服务地址:                          │
│  ┌───────────────────────────────┐ │
│  │ http://localhost:3000         │ │
│  └───────────────────────────────┘ │
│  [检测连接]                         │
│                                     │
│  界面语言:                          │
│  ┌───────────────────────────────┐ │
│  │ 中文            ▼             │ │
│  └───────────────────────────────┘ │
│                                     │
│  □ 在上传时附加来源页 URL          │
│                                     │
│  [保存]                             │
│                                     │
│  状态: 设置已保存 ✓                │
│                                     │
└─────────────────────────────────────┘
```

---

### 5. Library Modules

#### lib/settings.js

**职责 / Responsibilities:**
- 统一管理扩展设置
- 提供设置读写接口
- 处理设置变更通知

**API:**

```javascript
// Default settings
DEFAULT_SETTINGS = {
  baseUrl: 'http://localhost:3000',
  language: 'zh',
  includeMemo: true
}

// Ensure defaults on install
ensureDefaults() → Promise<void>

// Get settings
getSettings() → Promise<Settings>

// Save settings
saveSettings(settings) → Promise<void>

// Subscribe to changes
subscribeSettings(callback) → void
```

#### lib/i18n.js

**职责 / Responsibilities:**
- 提供国际化文本
- 支持语言切换

**支持的语言 / Supported Languages:**
- `zh` - 简体中文
- `en` - English

**API:**

```javascript
// Get translated text
t(language, key) → string

// Example
t('zh', 'statusLoggedIn')  // → '状态：已登录'
t('en', 'statusLoggedIn')  // → 'Status: Signed in'
```

---

## 数据流图 / Data Flow Diagram

### 上传流程 / Upload Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     ├─ Right-click image → Context Menu
     │         │
     │         ├→ background.js
     │         │    └─ enqueueSingleUpload()
     │         │
     │         └→ Add to queue
     │
     └─ Click extension icon → Popup
               │
               ├→ Scan page → content.js
               │    └─ gatherMediaElements()
               │
               ├→ Select resources
               │
               └→ Click upload → background.js
                      │
                      └─ start-bulk-upload
                           │
                           └─ enqueueUpload() × N
```

### 队列处理 / Queue Processing

```
Task Queue
    │
    ├→ processQueue() [max 4 concurrent]
    │       │
    │       ├→ Check Auth
    │       │    ├─ Authenticated? → Continue
    │       │    └─ Not authenticated? → Open login → Wait
    │       │
    │       ├→ performUpload()
    │       │    ├─ POST /api/upload/from-url (image)
    │       │    └─ POST /api/upload/video (video)
    │       │
    │       ├→ Success
    │       │    ├─ Update task status
    │       │    ├─ Broadcast to UI
    │       │    └─ Show notification
    │       │
    │       └→ Failure
    │            ├─ Should retry? → Re-enqueue
    │            └─ Mark as error → Broadcast
    │
    └→ Process next task
```

### 认证流程 / Authentication Flow

```
Check Auth
    │
    ├→ GET /api/images?limit=1
    │
    ├─ 200 OK → Authenticated ✓
    │
    ├─ 401 Unauthorized → Not authenticated
    │    │
    │    ├→ Open login tab
    │    │
    │    ├→ Poll auth status (every 2s, max 90s)
    │    │
    │    ├─ Success → Continue
    │    │
    │    └─ Timeout → Error
    │
    └─ Network error → Error
```

---

## 消息传递 / Message Passing

### Background ← → Popup

```javascript
// Popup → Background
{
  type: 'get-settings'
} → { baseUrl, language, includeMemo }

{
  type: 'check-auth'
} → { authenticated: boolean }

{
  type: 'start-bulk-upload',
  resources: [...],
  tabId, tabUrl, tabTitle
} → { started: true }

{
  type: 'get-tasks'
} → [{ id, type, status, ... }]

{
  type: 'retry-task',
  taskId
} → { ok: true }

{
  type: 'open-login'
} → { opened: true }

// Background → Popup (broadcast)
{
  type: 'tasks-updated',
  tasks: [...]
}

{
  type: 'auth-required'
}

{
  type: 'auth-restored'
}
```

### Background ← → Content Script

```javascript
// Background → Content Script
{
  type: 'scan-page-resources'
} → {
  resources: [
    { type, src, alt, title },
    ...
  ]
}
```

---

## 存储架构 / Storage Architecture

### Chrome Storage (sync)

```javascript
{
  baseUrl: 'http://localhost:3000',
  language: 'zh',
  includeMemo: true
}
```

### In-Memory State (Background)

```javascript
{
  tasks: Map<taskId, Task>,
  queue: Task[],
  activeCount: number,
  authPromise: Promise<boolean> | null,
  cachedSettings: Settings,
  notificationActions: Map<notificationId, Action>
}
```

**Task Structure:**

```javascript
Task {
  id: string,              // UUID
  type: 'image' | 'video',
  sourceUrl: string,
  pageUrl: string,
  title: string,
  status: 'pending' | 'uploading' | 'success' | 'error',
  retries: number,
  error?: string,
  createdAt: timestamp,
  completedAt?: timestamp,
  response?: any
}
```

---

## API 接口 / API Endpoints

### Zmage Server APIs

```
┌─────────────────────────────────────────────────────────┐
│  Authentication                                         │
├─────────────────────────────────────────────────────────┤
│  GET  /api/images?limit=1        Check auth status     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Upload                                                 │
├─────────────────────────────────────────────────────────┤
│  POST /api/upload/from-url       Upload image from URL │
│       Body: { url, tags, memo }                         │
│                                                         │
│  POST /api/upload/video          Upload video from URL │
│       Body: { url, memo }                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Processing                                             │
├─────────────────────────────────────────────────────────┤
│  POST /api/create/remove-bg      Remove background     │
│       Body: { imageId }                                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Library                                                │
├─────────────────────────────────────────────────────────┤
│  GET  /library/images/:id        View image in library │
│  GET  /library/videos/:id        View video in library │
│  GET  /main/create/gif           GIF sprite generator  │
│       Query: ?imageId=...                               │
└─────────────────────────────────────────────────────────┘
```

---

## 安全机制 / Security Mechanisms

### 1. Content Security Policy

```json
// manifest.json (implicit CSP for MV3)
{
  "manifest_version": 3,
  // Strict CSP by default
}
```

### 2. 权限最小化 / Minimal Permissions

```javascript
// Only request necessary permissions
permissions: [
  "storage",        // Settings
  "contextMenus",   // Right-click menu
  "activeTab",      // Current tab only
  "cookies",        // Session management
  "notifications",  // Upload notifications
  "tabs"            // Open new tabs
]

host_permissions: [
  "http://localhost:3000/*",   // Only allow configured host
  "https://localhost:3000/*"
]
```

### 3. XSS 防护 / XSS Protection

```javascript
// HTML escaping in popup.js
function escapeHtml(input) {
  return input.replace(/[&<>"]+/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  })[char] || char);
}
```

### 4. CSRF 防护 / CSRF Protection

```javascript
// Using credentials: 'include' for cookie-based auth
fetch(url, {
  method: 'POST',
  credentials: 'include',  // Send cookies
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})
```

---

## 性能优化 / Performance Optimization

### 1. 并发控制 / Concurrency Control

```javascript
const CONCURRENCY_LIMIT = 4;  // Max 4 concurrent uploads
```

### 2. 请求超时 / Request Timeout

```javascript
const REQUEST_TIMEOUT = 30_000;  // 30 seconds
```

### 3. 重试机制 / Retry Mechanism

```javascript
const RETRY_LIMIT = 1;  // Retry once on failure

function shouldRetry(error) {
  if (error.authRequired) return false;
  if (error.statusCode >= 400 && error.statusCode < 500) {
    return false;  // Don't retry client errors
  }
  return true;  // Retry network/server errors
}
```

### 4. 缓存设置 / Cache Settings

```javascript
let cachedSettings = null;

async function getCachedSettings() {
  if (!cachedSettings) {
    await refreshCachedSettings();
  }
  return cachedSettings;
}
```

---

## 错误处理 / Error Handling

### 错误类型 / Error Types

```javascript
// Authentication error
{
  authRequired: true,
  message: 'Not authenticated'
}

// Network error
{
  message: 'Request timeout'
}

// Server error
{
  statusCode: 500,
  message: 'Internal server error'
}

// Client error
{
  statusCode: 400,
  message: 'Bad request'
}
```

### 错误传播 / Error Propagation

```
Error occurs
    │
    ├→ Catch in task handler
    │
    ├→ Set task.error
    │
    ├→ Update task.status = 'error'
    │
    ├→ Broadcast to UI
    │
    └→ Show error message
```

---

## 扩展性 / Extensibility

### 添加新功能 / Adding New Features

1. **新的上传类型**
   - 修改 `content.js` 添加资源扫描
   - 修改 `background.js` 添加上传逻辑
   - 修改 `popup.js` 添加 UI 展示

2. **新的工作流**
   - 在 `background.js` 添加处理函数
   - 在通知中添加快捷按钮
   - 创建新的处理页面（如 remove-bg.html）

3. **新的设置项**
   - 在 `lib/settings.js` 添加默认值
   - 在 `options.html` 添加 UI 控件
   - 在相关组件中读取设置

4. **新的语言**
   - 在 `lib/i18n.js` 添加翻译文本
   - 在 `_locales/` 添加语言包目录
   - 更新 manifest.json

---

## 部署架构 / Deployment Architecture

### 开发环境 / Development

```
Developer
    │
    └→ Load unpacked extension
         │
         └→ Chrome (Developer mode)
              │
              └→ Local Zmage Server
```

### 生产环境 / Production

```
User
    │
    └→ Chrome Web Store / Enterprise Policy
         │
         └→ Chrome Browser
              │
              └→ Production Zmage Server
```

---

## 技术栈 / Tech Stack

- **Manifest Version**: V3 (Latest)
- **JavaScript**: ES2020+ (Modules)
- **Storage**: Chrome Storage API (sync)
- **UI**: Vanilla HTML/CSS/JavaScript
- **I18n**: Chrome i18n API + Custom module
- **Architecture**: Event-driven, Message-passing

---

## 版本历史 / Version History

### v0.1.0 (Initial Release)
- ✨ 基础图片和视频采集
- ✨ 批量上传支持
- ✨ 右键菜单集成
- ✨ 移除背景工作流
- ✨ GIF 雪碧图生成
- ✨ 中英文双语支持
- ✨ 桌面通知功能

---

## 未来规划 / Future Roadmap

### Short-term (v0.2.x)
- [ ] 拖拽上传支持
- [ ] 进度条显示
- [ ] 批量标签功能
- [ ] 深色模式

### Mid-term (v0.3.x)
- [ ] 离线支持
- [ ] 图片压缩选项
- [ ] 自动分类
- [ ] 历史记录

### Long-term (v1.0.x)
- [ ] Firefox 适配
- [ ] Safari 适配
- [ ] AI 智能标签
- [ ] 云同步设置

---

**Last Updated**: 2024-10-18  
**Author**: Zmage Team  
**License**: MIT