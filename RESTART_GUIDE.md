# 完全重启应用指南

## 问题

虽然代码已经修复，但仍然出现 `MAIN_WINDOW_VITE_DEV_SERVER_URL is not defined` 错误。这是因为旧的进程还在运行。

## 完整清理步骤

请在终端按顺序执行以下命令：

### 步骤 1: 停止所有 Node 和 Electron 进程

```bash
# 按 Ctrl+C 停止当前运行的 npm start（如果有）

# 强制停止所有 Node 进程
pkill -9 node

# 强制停止所有 Electron 进程
pkill -9 Electron

# 等待几秒
sleep 3
```

### 步骤 2: 清理所有构建缓存

```bash
# 在项目根目录执行
cd /Users/yangjie01/Documents/demo/electron_pro/demo_1

# 删除 Vite 构建缓存
rm -rf .vite

# 删除 node_modules 中的 Vite 缓存
rm -rf node_modules/.vite

# 等待几秒
sleep 2
```

### 步骤 3: 验证所有进程已停止

```bash
# 检查是否还有 node 进程
ps aux | grep node | grep -v grep

# 检查是否还有 Electron 进程
ps aux | grep Electron | grep -v grep

# 如果上面两个命令都没有输出，说明进程已经停止
```

### 步骤 4: 重新启动应用

```bash
npm start
```

## 预期结果

启动成功后，您应该看到：

```
✔ Launched Electron app. Type rs in terminal to restart main process.

Loading dev server URL: http://localhost:5173
```

**不应该**看到：
- ❌ `MAIN_WINDOW_VITE_DEV_SERVER_URL is not defined`
- ❌ `UnhandledPromiseRejectionWarning`

## 验证应用是否正常

Electron 窗口应该显示：
1. ✅ "Welcome to my app" 标题
2. ✅ "Click me" 按钮
3. ✅ Katherine Johnson 的图片
4. ✅ 开发者工具自动打开

## 如果还是失败

如果清理后还是出现相同错误，可能的原因：

### 原因 1: 终端会话缓存

某些终端（如 zsh）可能缓存了环境变量。

**解决方案**：
```bash
# 关闭当前终端窗口
# 打开新的终端窗口
cd /Users/yangjie01/Documents/demo/electron_pro/demo_1
npm start
```

### 原因 2: 代理或网络问题

如果您使用了代理，可能会干扰本地连接。

**解决方案**：
```bash
# 临时禁用代理
unset http_proxy
unset https_proxy
unset HTTP_PROXY
unset HTTPS_PROXY

# 然后启动
npm start
```

### 原因 3: 端口被占用

**检查端口**：
```bash
lsof -i :5173
```

如果有输出，说明端口被占用。

**解决方案**：
```bash
# 停止占用端口的进程
kill -9 <PID>  # 用 lsof 命令输出的进程ID替换 <PID>
```

## 调试信息

如果问题仍然存在，收集以下信息：

```bash
# 1. Node 版本
node -v

# 2. npm 版本
npm -v

# 3. 检查源文件
cat main.js | head -30

# 4. 检查编译后的文件
cat .vite/build/main.js | head -30

# 5. 检查运行的进程
ps aux | grep -E "node|electron" | grep -v grep
```

将这些信息提供给我，我可以进一步帮您诊断。
