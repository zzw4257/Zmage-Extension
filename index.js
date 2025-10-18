// Minimal Zmage plugin template

// 插件主导出：接受 Zmage 实例和可选配置，返回一个对象或执行挂载。
module.exports = function zmageExtension(zmage, options = {}) {
  if (!zmage) {
    throw new Error('Zmage instance is required to initialize this plugin.');
  }

  const name = options.name || 'zmage-extension';

  // 示例：在 zmage 上挂载一个简单命令或方法
  zmage[name] = zmage[name] || {};
  zmage[name].info = function() {
    return {
      name: name,
      version: options.version || '0.1.0'
    };
  };

  // 可返回插件实例/钩子
  return {
    name,
    info: zmage[name].info
  };
};
