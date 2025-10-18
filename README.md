# Zmage Collector - Chrome 浏览器扩展

[English](#english) | [中文](#中文)

---

## 中文

### 📖 简介

Zmage Collector 是一个功能强大的 Chrome 浏览器扩展，用于快速采集网页中的图片和视频资源到您的 Zmage 图库系统。支持批量上传、后台处理和多种后续工作流（如移除背景、生成 GIF 雪碧图等）。

### ✨ 主要功能

- 🖼️ **一键采集**：右键菜单快速保存图片和视频到 Zmage
- 📦 **批量上传**：智能扫描当前页面的所有媒体资源，支持批量选择上传
- 🔄 **后台处理**：并发上传任务，自动重试失败任务
- 🎨 **工作流集成**：
  - 移除图片背景
  - 生成 GIF 雪碧图
  - 直接在图库中管理
- 🌐 **多语言支持**：中文/English 界面切换
- 🔔 **智能通知**：上传完成后的桌面通知，支持快捷操作
- 📝 **来源追踪**：可选保存来源页面 URL，方便溯源管理

### 🚀 快速开始

#### 前置要求

- Chrome 浏览器（或基于 Chromium 的浏览器，如 Edge、Brave）
- 本地或远程运行的 Zmage 服务（默认：`http://localhost:3000`）

#### 安装步骤

1. **克隆或下载本仓库**
   ```bash
   git clone https://github.com/yourusername/Zmage-Ex.git
   cd Zmage-Ex
   ```

2. **安装到 Chrome 浏览器**
   - 打开 Chrome，访问 `chrome://extensions/`
   - 开启右上角的「开发者模式」
   - 点击「加载已解压的扩展程序」
   - 选择本项目的根目录（包含 `manifest.json` 的文件夹）

3. **配置服务地址**
   - 点击扩展图标打开弹窗
   - 点击「打开设置」
   - 配置 Zmage 服务的 URL（例如：`http://localhost:3000`）
   - 点击「检测连接」确认配置正确
   - 保存设置

4. **登录 Zmage**
   - 在扩展弹窗中点击「去登录」
   - 在打开的标签页中完成登录
   - 返回扩展，状态应显示「已登录」

### 📋 使用指南

#### 方法一：右键菜单采集

1. 在任意网页上，右键点击图片或视频
2. 选择「保存到 Zmage」或「保存视频到 Zmage」
3. 扩展会自动开始上传，完成后显示桌面通知

#### 方法二：批量采集

1. 访问包含多个图片/视频的网页
2. 点击扩展图标打开弹窗
3. 点击「采集本页资源」按钮
4. 勾选要上传的资源（默认全选）
5. 点击「开始上传」

#### 后续工作流

上传完成后，通知会显示快捷操作按钮：

- **图片**：
  - 生成 GIF 雪碧图
  - 移除背景
  - 在图库中查看

- **视频**：
  - 在图库中查看

### 🔧 配置选项

在扩展设置页面（选项页）可配置：

| 选项 | 说明 | 默认值 |
|-----|------|-------|
| 服务地址 | Zmage 服务的 URL | `http://localhost:3000` |
| 界面语言 | 中文/English | 中文 |
| 附加来源 URL | 上传时保存来源页面链接 | 开启 |

### 📁 项目结构

```
Zmage-Ex/
├── manifest.json          # 扩展配置清单
├── background.js          # 后台服务工作脚本
├── content.js             # 内容脚本（页面扫描）
├── popup.html/js/css      # 扩展弹窗界面
├── options.html/js/css    # 设置页面
├── remove-bg.html/js/css  # 移除背景功能页
├── lib/
│   ├── i18n.js           # 国际化
│   └── settings.js       # 设置管理
├── _locales/             # Chrome i18n 本地化
│   ├── en/
│   └── zh_CN/
└── icons/                # 扩展图标
```

### 🔐 权限说明

扩展请求的权限及用途：

- `storage`：保存用户设置（服务地址、语言偏好等）
- `contextMenus`：添加右键菜单项
- `activeTab`：访问当前标签页的媒体资源
- `cookies`：维持 Zmage 登录状态
- `notifications`：显示上传完成通知
- `tabs`：创建新标签页（登录、查看图库等）
- `host_permissions`：与 Zmage 服务通信

### 🐛 故障排除

**问题：状态显示"未登录"**
- 解决：点击「去登录」，在打开的页面完成登录，等待几秒后状态会自动更新

**问题：连接失败**
- 检查 Zmage 服务是否正常运行
- 确认设置中的服务地址正确
- 使用「检测连接」功能测试

**问题：采集不到资源**
- 某些动态加载的页面可能需要刷新后重新扫描
- 确保页面已完全加载

**问题：上传失败**
- 查看任务列表中的错误信息
- 点击「重试」按钮重新上传
- 检查 Zmage 服务日志

### 🤝 开发与贡献

#### 本地开发

```bash
# 克隆仓库
git clone https://github.com/yourusername/Zmage-Ex.git
cd Zmage-Ex

# 修改代码后，在 chrome://extensions/ 页面点击「重新加载」按钮
```

#### 代码结构

- **background.js**：处理上传队列、认证、右键菜单、通知
- **content.js**：注入到页面，扫描图片和视频元素
- **popup.js**：弹窗逻辑，展示资源和任务状态
- **options.js**：设置页面逻辑
- **lib/settings.js**：统一的设置管理
- **lib/i18n.js**：国际化文本

#### 打包发布

```bash
# 确保所有文件已提交
# 在 chrome://extensions/ 点击「打包扩展程序」
# 选择项目根目录，生成 .crx 文件和私钥
```

### 📄 许可证

MIT License

---

## English

### 📖 Introduction

Zmage Collector is a powerful Chrome extension for quickly capturing images and videos from web pages to your Zmage library system. It supports batch uploads, background processing, and various follow-up workflows (such as background removal, GIF sprite generation, etc.).

### ✨ Key Features

- 🖼️ **One-Click Capture**: Quick save images and videos via context menu
- 📦 **Batch Upload**: Smart scan all media resources on current page, support batch selection
- 🔄 **Background Processing**: Concurrent upload tasks with automatic retry
- 🎨 **Workflow Integration**:
  - Remove image background
  - Generate GIF sprites
  - Manage directly in library
- 🌐 **Multi-language**: Chinese/English interface
- 🔔 **Smart Notifications**: Desktop notifications with quick actions
- 📝 **Source Tracking**: Optional source page URL preservation

### 🚀 Quick Start

#### Prerequisites

- Chrome browser (or Chromium-based browsers like Edge, Brave)
- Running Zmage service (default: `http://localhost:3000`)

#### Installation

1. **Clone or download this repository**
   ```bash
   git clone https://github.com/yourusername/Zmage-Ex.git
   cd Zmage-Ex
   ```

2. **Install to Chrome**
   - Open Chrome, visit `chrome://extensions/`
   - Enable "Developer mode" in top-right corner
   - Click "Load unpacked"
   - Select the project root directory (containing `manifest.json`)

3. **Configure Service URL**
   - Click extension icon to open popup
   - Click "Open settings"
   - Configure your Zmage service URL (e.g., `http://localhost:3000`)
   - Click "Test connection" to verify
   - Save settings

4. **Sign in to Zmage**
   - Click "Sign in" in extension popup
   - Complete login in opened tab
   - Return to extension, status should show "Signed in"

### 📋 Usage Guide

#### Method 1: Context Menu

1. On any webpage, right-click on an image or video
2. Select "Save to Zmage" or "Save video to Zmage"
3. Extension will start uploading automatically and show desktop notification when done

#### Method 2: Batch Collection

1. Visit a page with multiple images/videos
2. Click extension icon to open popup
3. Click "Collect page media" button
4. Check resources to upload (all selected by default)
5. Click "Start upload"

#### Follow-up Workflows

After upload completes, notification shows quick action buttons:

- **Images**:
  - Make GIF sprite
  - Remove background
  - View in library

- **Videos**:
  - View in library

### 🔧 Configuration Options

Configure in extension options page:

| Option | Description | Default |
|--------|-------------|---------|
| Service URL | Zmage service URL | `http://localhost:3000` |
| Language | Chinese/English | Chinese |
| Attach source URL | Save source page link when uploading | On |

### 📁 Project Structure

```
Zmage-Ex/
├── manifest.json          # Extension manifest
├── background.js          # Background service worker
├── content.js             # Content script (page scanning)
├── popup.html/js/css      # Extension popup UI
├── options.html/js/css    # Settings page
├── remove-bg.html/js/css  # Background removal feature
├── lib/
│   ├── i18n.js           # Internationalization
│   └── settings.js       # Settings management
├── _locales/             # Chrome i18n localization
│   ├── en/
│   └── zh_CN/
└── icons/                # Extension icons
```

### 🔐 Permissions

Requested permissions and their purposes:

- `storage`: Save user settings (service URL, language preference, etc.)
- `contextMenus`: Add context menu items
- `activeTab`: Access media resources on current tab
- `cookies`: Maintain Zmage login session
- `notifications`: Show upload completion notifications
- `tabs`: Create new tabs (login, view library, etc.)
- `host_permissions`: Communicate with Zmage service

### 🐛 Troubleshooting

**Issue: Status shows "Signed out"**
- Solution: Click "Sign in", complete login in opened page, wait a few seconds for status to update

**Issue: Connection failed**
- Check if Zmage service is running
- Verify service URL in settings is correct
- Use "Test connection" feature

**Issue: No resources found**
- Some dynamically loaded pages may need refresh and rescan
- Ensure page is fully loaded

**Issue: Upload failed**
- Check error message in task list
- Click "Retry" button to retry upload
- Check Zmage service logs

### 🤝 Development & Contribution

#### Local Development

```bash
# Clone repository
git clone https://github.com/yourusername/Zmage-Ex.git
cd Zmage-Ex

# After making changes, click "Reload" button on chrome://extensions/ page
```

#### Code Structure

- **background.js**: Upload queue, authentication, context menu, notifications
- **content.js**: Inject into pages, scan image and video elements
- **popup.js**: Popup logic, display resources and task status
- **options.js**: Settings page logic
- **lib/settings.js**: Unified settings management
- **lib/i18n.js**: Internationalization texts

#### Package for Release

```bash
# Ensure all files are committed
# On chrome://extensions/ click "Pack extension"
# Select project root directory, generates .crx file and private key
```

### 📄 License

MIT License

---

## 相关链接 / Related Links

- [Zmage 主项目 / Main Project](https://github.com/yourusername/Zmage)
- [问题反馈 / Issue Tracker](https://github.com/yourusername/Zmage-Ex/issues)
- [Chrome 扩展开发文档 / Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)

## 更新日志 / Changelog

### v0.1.0 (Initial Release)

- ✨ 基础图片和视频采集功能
- ✨ 批量上传支持
- ✨ 右键菜单集成
- ✨ 移除背景工作流
- ✨ GIF 雪碧图生成
- ✨ 中英文双语支持
- ✨ 桌面通知功能

---

**Made with ❤️ for Zmage users**