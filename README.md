# Zmage-Extension

这是一个最小的 Zmage 插件模板仓库。该仓库初始化为可被 Zmage 使用的插件结构，满足“合格用于 Zmage 插件”的基本要求。

合格说明：此仓库提供插件的入口（`index.js`）和包元数据（`package.json`），可以被 Zmage 或其他 Node 环境加载作为扩展/插件。README 中包含简短使用说明。

## 快速开始

1. 在 Zmage 项目中，将本仓库目录放入插件目录或通过 `npm install /path/to/Zmage-Extension` 安装。
2. 在 Zmage 的插件加载配置中指定本包名或路径，Zmage 将通过 `require('zmage-extension')` 或指定路径加载导出的插件函数。

示例（Node.js / 简化版 Zmage）：

```js
// 假设 zmage 是主应用传入的实例对象
const zmage = {};
const plugin = require('zmage-extension') || require('/path/to/Zmage-Extension');
const inst = plugin(zmage, { name: 'my-zmage-plugin' });
console.log(inst.info());
```

## 许可
MIT
