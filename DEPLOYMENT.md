# Zmage Extension 部署指南 / Deployment Guide

[中文](#中文部署指南) | [English](#english-deployment-guide)

---

## 中文部署指南

### 📦 开发环境部署（本地测试）

#### 步骤 1: 准备文件

```bash
# 确保你在项目根目录
cd Zmage-Ex

# 检查所有必需文件是否存在
ls manifest.json background.js popup.html options.html
ls -R icons/ _locales/
```

#### 步骤 2: 加载到 Chrome 浏览器

1. **打开扩展管理页面**
   - 方法 1: 在地址栏输入 `chrome://extensions/` 并回车
   - 方法 2: 菜单 → 更多工具 → 扩展程序
   - 方法 3: 右键点击扩展图标区域 → 管理扩展程序

2. **启用开发者模式**
   - 在扩展管理页面的右上角，打开「开发者模式」开关

3. **加载扩展**
   - 点击左上角的「加载已解压的扩展程序」按钮
   - 浏览并选择 `Zmage-Ex` 项目根目录（包含 manifest.json 的文件夹）
   - 点击「选择」

4. **验证安装**
   - 扩展应该出现在列表中
   - 检查是否有错误提示
   - 扩展图标应该出现在浏览器工具栏

#### 步骤 3: 配置扩展

1. **点击扩展图标**，打开弹窗

2. **点击「打开设置」**

3. **配置 Zmage 服务地址**
   - 默认: `http://localhost:3000`
   - 如果 Zmage 服务在其他地址，请修改
   - 例如: `https://your-zmage-domain.com`

4. **测试连接**
   - 点击「检测连接」按钮
   - 确保显示「连接正常」

5. **保存设置**

6. **登录 Zmage**
   - 点击「去登录」
   - 在新标签页完成登录
   - 返回扩展，状态应显示「已登录」

#### 步骤 4: 测试功能

1. **测试右键菜单**
   - 访问任意包含图片的网页
   - 右键点击图片
   - 查看「保存到 Zmage」选项是否存在

2. **测试批量采集**
   - 点击扩展图标
   - 点击「采集本页资源」
   - 验证是否正确识别图片和视频

3. **测试上传**
   - 选择资源并上传
   - 查看任务列表状态
   - 验证是否收到桌面通知

### 🔄 更新扩展

在开发过程中修改代码后：

```bash
# 方法 1: 在 chrome://extensions/ 页面点击扩展的「刷新」按钮

# 方法 2: 使用快捷键
# 1. 进入 chrome://extensions/
# 2. 按 Ctrl+R (Windows/Linux) 或 Cmd+R (Mac)
```

### 🏗️ 生产环境部署

#### 准备发布版本

1. **检查并更新版本号**
   ```json
   // manifest.json
   {
     "version": "1.0.0"  // 更新版本号
   }
   ```

2. **替换占位图标**
   - 将 `icons/` 目录下的占位图标替换为正式设计的图标
   - 确保尺寸正确: 16x16, 32x32, 48x48, 128x128 像素
   - 推荐格式: PNG，透明背景

3. **更新服务地址**
   ```javascript
   // lib/settings.js
   export const DEFAULT_SETTINGS = {
     baseUrl: 'https://your-production-domain.com',  // 更新为生产地址
     language: 'zh',
     includeMemo: true
   };
   ```

4. **移除调试代码**
   - 删除所有 `console.log()` 语句
   - 移除开发用的临时文件

5. **测试所有功能**
   - 按照测试清单逐项验证
   - 在不同的网站上测试
   - 测试错误处理

#### 打包扩展

##### 方法 1: Chrome 内置打包工具

1. 打开 `chrome://extensions/`
2. 确保开发者模式已启用
3. 点击「打包扩展程序」
4. 选择扩展根目录
5. 首次打包留空私钥文件（会自动生成）
6. 点击「打包扩展程序」
7. 得到两个文件:
   - `Zmage-Ex.crx` - 打包的扩展
   - `Zmage-Ex.pem` - 私钥（**妥善保管，用于后续更新**）

##### 方法 2: 命令行打包

```bash
# 使用 Chrome 命令行工具
chrome --pack-extension=/path/to/Zmage-Ex --pack-extension-key=/path/to/key.pem

# macOS 示例
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --pack-extension=$PWD --pack-extension-key=./key.pem
```

#### 发布到 Chrome Web Store

1. **注册开发者账号**
   - 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - 支付一次性注册费用（$5）

2. **准备商店资料**
   - 详细描述（中英文）
   - 至少 1 张截图（1280x800 或 640x400）
   - 宣传图片（440x280，可选）
   - 小图标（128x128）
   - 分类和语言设置

3. **上传扩展**
   - 点击「新增项」
   - 上传打包的 .zip 文件（或 .crx）
   - 填写商店信息
   - 选择可见性设置
   - 提交审核

4. **等待审核**
   - 通常 1-3 个工作日
   - 审核通过后自动发布

### 🔐 私有部署（企业内部）

#### 通过策略部署（企业版 Chrome）

1. **打包扩展**（参考上面的打包步骤）

2. **设置企业策略**
   ```json
   // Windows: GPO 或 Registry
   // macOS: /Library/Managed Preferences/
   {
     "ExtensionInstallForcelist": [
       "extension_id;https://your-server.com/Zmage-Ex.crx"
     ]
   }
   ```

3. **部署到用户**
   - 通过 GPO 推送（Windows）
   - 通过 MDM 推送（macOS）

#### 通过 Web 服务器分发

1. **托管 .crx 文件**
   ```bash
   # 将 .crx 文件放到 Web 服务器
   cp Zmage-Ex.crx /var/www/html/extensions/
   ```

2. **创建更新清单**
   ```xml
   <!-- update.xml -->
   <?xml version='1.0' encoding='UTF-8'?>
   <gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
     <app appid='your_extension_id'>
       <updatecheck codebase='https://your-server.com/extensions/Zmage-Ex.crx' version='1.0.0' />
     </app>
   </gupdate>
   ```

3. **用户安装**
   - 用户访问 `https://your-server.com/extensions/Zmage-Ex.crx`
   - Chrome 会提示安装

### 🐳 Docker 化部署（配合 Zmage 服务）

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  zmage-service:
    image: zmage/server:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - zmage-data:/app/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./Zmage-Ex:/usr/share/nginx/html/extension
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - zmage-service

volumes:
  zmage-data:
```

### 📱 移动端适配（可选）

Chrome 移动版不支持扩展，可以考虑：

1. **开发 Progressive Web App (PWA)**
2. **开发原生移动应用**
3. **使用 Kiwi Browser**（Android，支持 Chrome 扩展）

---

## English Deployment Guide

### 📦 Development Deployment (Local Testing)

#### Step 1: Prepare Files

```bash
# Ensure you're in the project root
cd Zmage-Ex

# Check all required files exist
ls manifest.json background.js popup.html options.html
ls -R icons/ _locales/
```

#### Step 2: Load into Chrome

1. **Open Extensions Page**
   - Method 1: Enter `chrome://extensions/` in address bar
   - Method 2: Menu → More Tools → Extensions
   - Method 3: Right-click extension area → Manage Extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" switch in top-right corner

3. **Load Extension**
   - Click "Load unpacked" button
   - Browse and select `Zmage-Ex` root directory (folder containing manifest.json)
   - Click "Select"

4. **Verify Installation**
   - Extension should appear in the list
   - Check for any error messages
   - Extension icon should appear in browser toolbar

#### Step 3: Configure Extension

1. **Click extension icon** to open popup

2. **Click "Open settings"**

3. **Configure Zmage service URL**
   - Default: `http://localhost:3000`
   - Modify if Zmage service is elsewhere
   - Example: `https://your-zmage-domain.com`

4. **Test connection**
   - Click "Test connection" button
   - Ensure it shows "Connected"

5. **Save settings**

6. **Sign in to Zmage**
   - Click "Sign in"
   - Complete login in new tab
   - Return to extension, status should show "Signed in"

#### Step 4: Test Features

1. **Test context menu**
   - Visit any page with images
   - Right-click on image
   - Verify "Save to Zmage" option exists

2. **Test batch collection**
   - Click extension icon
   - Click "Collect page media"
   - Verify correct identification of images/videos

3. **Test upload**
   - Select and upload resources
   - Check task list status
   - Verify desktop notification received

### 🔄 Update Extension

After modifying code during development:

```bash
# Method 1: Click "Reload" button on chrome://extensions/ page

# Method 2: Use keyboard shortcut
# 1. Go to chrome://extensions/
# 2. Press Ctrl+R (Windows/Linux) or Cmd+R (Mac)
```

### 🏗️ Production Deployment

#### Prepare Release Version

1. **Check and update version**
   ```json
   // manifest.json
   {
     "version": "1.0.0"  // Update version number
   }
   ```

2. **Replace placeholder icons**
   - Replace placeholder icons in `icons/` directory with final designs
   - Ensure correct sizes: 16x16, 32x32, 48x48, 128x128 pixels
   - Recommended format: PNG with transparent background

3. **Update service URL**
   ```javascript
   // lib/settings.js
   export const DEFAULT_SETTINGS = {
     baseUrl: 'https://your-production-domain.com',  // Update to production
     language: 'zh',
     includeMemo: true
   };
   ```

4. **Remove debug code**
   - Delete all `console.log()` statements
   - Remove temporary development files

5. **Test all features**
   - Verify each item in test checklist
   - Test on different websites
   - Test error handling

#### Package Extension

##### Method 1: Chrome Built-in Tool

1. Open `chrome://extensions/`
2. Ensure developer mode is enabled
3. Click "Pack extension"
4. Select extension root directory
5. Leave private key empty for first time (will auto-generate)
6. Click "Pack extension"
7. Get two files:
   - `Zmage-Ex.crx` - Packed extension
   - `Zmage-Ex.pem` - Private key (**Keep safe for updates**)

##### Method 2: Command Line

```bash
# Use Chrome command line tool
chrome --pack-extension=/path/to/Zmage-Ex --pack-extension-key=/path/to/key.pem

# macOS example
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --pack-extension=$PWD --pack-extension-key=./key.pem
```

#### Publish to Chrome Web Store

1. **Register developer account**
   - Visit [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Pay one-time registration fee ($5)

2. **Prepare store assets**
   - Detailed description (English/Chinese)
   - At least 1 screenshot (1280x800 or 640x400)
   - Promotional images (440x280, optional)
   - Small icon (128x128)
   - Category and language settings

3. **Upload extension**
   - Click "New Item"
   - Upload packed .zip file (or .crx)
   - Fill in store information
   - Choose visibility settings
   - Submit for review

4. **Wait for review**
   - Usually 1-3 business days
   - Auto-publish after approval

### 🔐 Private Deployment (Enterprise)

#### Deploy via Policy (Enterprise Chrome)

1. **Package extension** (refer to packaging steps above)

2. **Configure enterprise policy**
   ```json
   // Windows: GPO or Registry
   // macOS: /Library/Managed Preferences/
   {
     "ExtensionInstallForcelist": [
       "extension_id;https://your-server.com/Zmage-Ex.crx"
     ]
   }
   ```

3. **Deploy to users**
   - Push via GPO (Windows)
   - Push via MDM (macOS)

#### Distribute via Web Server

1. **Host .crx file**
   ```bash
   # Place .crx file on web server
   cp Zmage-Ex.crx /var/www/html/extensions/
   ```

2. **Create update manifest**
   ```xml
   <!-- update.xml -->
   <?xml version='1.0' encoding='UTF-8'?>
   <gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
     <app appid='your_extension_id'>
       <updatecheck codebase='https://your-server.com/extensions/Zmage-Ex.crx' version='1.0.0' />
     </app>
   </gupdate>
   ```

3. **User installation**
   - Users visit `https://your-server.com/extensions/Zmage-Ex.crx`
   - Chrome will prompt for installation

### 🐳 Docker Deployment (with Zmage Service)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  zmage-service:
    image: zmage/server:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - zmage-data:/app/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./Zmage-Ex:/usr/share/nginx/html/extension
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - zmage-service

volumes:
  zmage-data:
```

### 📱 Mobile Adaptation (Optional)

Chrome mobile doesn't support extensions, consider:

1. **Develop Progressive Web App (PWA)**
2. **Develop native mobile app**
3. **Use Kiwi Browser** (Android, supports Chrome extensions)

---

## 🔧 Troubleshooting

### Common Issues

**Issue: "Manifest file is missing or unreadable"**
- Solution: Ensure `manifest.json` is in root directory with correct JSON syntax

**Issue: "Could not load extension icon"**
- Solution: Check `icons/` directory exists with all required PNG files

**Issue: "Extension failed to load"**
- Solution: Check browser console (chrome://extensions/) for specific errors

**Issue: Updates not reflecting**
- Solution: Disable and re-enable extension, or reload it

### Logs and Debugging

```bash
# View background script logs
# Open chrome://extensions/
# Click "background page" or "service worker" under extension

# View content script logs
# Open DevTools on any web page
# Check Console tab

# View popup logs
# Right-click extension icon → Inspect popup
```

---

## 📞 Support

- **Issues**: https://github.com/yourusername/Zmage-Ex/issues
- **Discussions**: https://github.com/yourusername/Zmage-Ex/discussions
- **Email**: support@your-domain.com

---

**Last Updated**: 2024-10-18