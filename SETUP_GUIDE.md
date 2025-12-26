# Electron + React + Vite 完整配置指南

## 当前问题

您遇到的问题是 `MAIN_WINDOW_VITE_DEV_SERVER_URL is not defined`。这是因为 Vite 插件的全局变量在某些情况下没有正确注入。

## 解决方案

请在您的终端执行以下步骤：

### 1. 完全清理环境

```bash
# 停止所有进程
pkill -9 node
pkill -9 Electron

# 清理构建缓存
rm -rf .vite
rm -rf node_modules
rm -rf package-lock.json

# 重新安装依赖
npm install
```

### 2. 运行应用

```bash
# 确保在项目根目录
cd /Users/yangjie01/Documents/demo/electron_pro/demo_1

# 启动应用
npm start
```

### 3. 验证

启动后，您应该看到：
- ✅ Vite 开发服务器运行在 http://localhost:5173/
- ✅ Electron 窗口打开
- ✅ 窗口显示 "Welcome to my app"
- ✅ 自动打开开发者工具

## 如果还是失败

如果上述步骤后还是看到空白页面或错误，请提供：

1. **终端完整输出**
2. **Electron 开发者工具的 Console 标签内容**
3. **Network 标签显示的请求状态**

## 已配置的文件

项目已经配置好以下文件：

- ✅ `forge.config.js` - Electron Forge + Vite 插件配置
- ✅ `vite.main.config.mjs` - 主进程 Vite 配置
- ✅ `vite.renderer.config.mjs` - 渲染进程 Vite 配置（含 React）
- ✅ `vite.preload.config.mjs` - 预加载脚本配置
- ✅ `main.js` - Electron 主进程入口
- ✅ `index.html` - HTML 模板
- ✅ `src/renderer.tsx` - React 渲染入口
- ✅ `src/App.tsx` - React 主组件

## 配置说明

### forge.config.js 关键配置

```javascript
renderer: [
  {
    name: 'main_window',
    config: 'vite.renderer.config.mjs',
    htmlFile: 'index.html',  // 指定 HTML 入口
  },
],
```

### main.js 全局变量使用

```javascript
// 这些变量由 Vite 插件在编译时替换
if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
  win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);  // 开发模式
} else {
  win.loadFile(...);  // 生产模式
}
```

## 调试技巧

### 查看编译后的代码

```bash
cat .vite/build/main.js | head -20
```

应该看到变量已被替换成实际的 URL。

### 检查 Vite 服务器

```bash
# 检查端口是否被占用
lsof -i :5173

# 尝试访问（绕过代理）
curl --noproxy "*" http://localhost:5173/
```

### 检查进程

```bash
# 确保没有僵尸进程
ps aux | grep -E "node|electron|vite" | grep -v grep
```

## 常见问题

**Q: 为什么浏览器能访问 localhost:5173 但 Electron 不能？**

A: 这是正常的。Vite 插件会为 Electron 单独启动一个开发服务器。编译后的 main.js 会正确加载这个地址。

**Q: 为什么看到 "renderer.tsx:1 Failed to load resource: net::ERR_FILE_NOT_FOUND"？**

A: 这通常意味着 Vite 服务器没有正确配置 HTML 入口。确保 `forge.config.js` 中有 `htmlFile: 'index.html'`。

**Q: 如何确认 Vite 插件正确注入了变量？**

A: 查看 `.vite/build/main.js`，应该看到 `MAIN_WINDOW_VITE_DEV_SERVER_URL` 被替换成了字符串 `"http://localhost:5173"`。

## 下一步

应用成功运行后，您可以：

1. 修改 `src/App.tsx` - 会自动热更新
2. 修改 `main.js` - 在终端输入 `rs` 重启主进程
3. 打包应用 - 运行 `npm run package`
4. 构建安装包 - 运行 `npm run make`

## 需要帮助？

如果问题仍然存在，请检查：

1. Node.js 版本（建议 18.x 或更高）
2. npm 版本（建议 9.x 或更高）
3. 是否有代理或防火墙阻止本地连接
4. 项目路径是否包含特殊字符或空格
