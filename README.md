# Electron + React + Vite 项目

这是一个使用 Electron、React 和 Vite 构建的桌面应用程序。

## 项目结构

```
demo_1/
├── src/                    # 源代码目录
│   ├── App.tsx            # React 主组件
│   └── renderer.tsx       # React 渲染入口
├── main.js                # Electron 主进程
├── preload.js             # Electron 预加载脚本
├── index.html             # HTML 模板
├── forge.config.js        # Electron Forge 配置
├── vite.main.config.mjs   # Vite 主进程配置
├── vite.renderer.config.mjs  # Vite 渲染进程配置
├── vite.preload.config.mjs   # Vite 预加载配置
└── package.json           # 项目依赖配置
```

## 技术栈

- **Electron**: 用于构建跨平台桌面应用
- **React**: 用于构建用户界面
- **Vite**: 快速的前端构建工具
- **TypeScript/TSX**: 支持 TypeScript 和 JSX 语法

## 核心配置说明

### 1. Vite 配置

项目包含三个 Vite 配置文件：

#### vite.renderer.config.mjs (渲染进程配置)
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],  // 支持 React JSX/TSX
});
```

#### vite.main.config.mjs (主进程配置)
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    browserField: false,
    conditions: ['node'],
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
});
```

#### vite.preload.config.mjs (预加载配置)
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['electron'],
    },
  },
});
```

### 2. Electron Forge 配置 (forge.config.js)

使用 `@electron-forge/plugin-vite` 插件整合 Vite：

```javascript
plugins: [
  {
    name: '@electron-forge/plugin-vite',
    config: {
      build: [
        {
          entry: 'main.js',
          config: 'vite.main.config.mjs',
        },
        {
          entry: 'preload.js',
          config: 'vite.preload.config.mjs',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.mjs',
        },
      ],
    },
  },
]
```

### 3. React 渲染流程

#### index.html
```html
<div id="root"></div>
<script type="module" src="/src/renderer.tsx"></script>
```

#### src/renderer.tsx (入口文件)
```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
```

#### src/App.tsx (主组件)
```tsx
import React from 'react'

function MyButton() {
  return <button>Click me</button>;
}

export default function MyApp() {
  return (
    <div>
      <h1>Welcome to my app</h1>
      <MyButton />
      <Profile />
    </div>
  );
}

export function Profile() {
  return (
    <img
      src="https://i.imgur.com/MK3eW3Am.jpg"
      alt="Katherine Johnson"
    />
  )
}
```

## 如何使用 React 组件

### 1. 创建新组件

在 `src/` 目录下创建新的 `.tsx` 文件：

```tsx
// src/MyComponent.tsx
import React from 'react';

export function MyComponent() {
  return <div>我的组件</div>;
}
```

### 2. 在其他组件中引用

```tsx
// src/App.tsx
import { MyComponent } from './MyComponent';

export default function App() {
  return (
    <div>
      <MyComponent />
    </div>
  );
}
```

### 3. 组件必须通过 React 渲染

不能直接在 HTML 中写 `<MyComponent></MyComponent>`，必须：
1. 在 TSX/JSX 文件中引入组件
2. 通过 React 的渲染系统渲染到 DOM

## 安装依赖

```bash
npm install
```

## 开发运行

```bash
npm start
```

这会启动 Vite 开发服务器并打开 Electron 窗口。开发模式下支持：
- 热模块替换 (HMR)
- 自动重载
- 开发者工具

## 打包应用

```bash
npm run package
```

这会将应用打包为可分发的格式。

## 构建安装包

```bash
npm run make
```

根据您的操作系统，会生成相应的安装包：
- macOS: `.zip` 文件
- Windows: Squirrel 安装程序
- Linux: `.deb` 和 `.rpm` 包

## 常见问题

### Q: 为什么不能直接在 HTML 中使用 React 组件？

A: React 组件是 JSX/TSX 语法，需要编译成 JavaScript。必须通过 React 的渲染系统（ReactDOM）来渲染。

### Q: 如何添加新页面？

A:
1. 在 `src/` 中创建新的组件文件
2. 在 `App.tsx` 中引入并使用
3. 可以使用 React Router 实现多页面路由

### Q: 如何调试？

A: 开发模式下会自动打开 DevTools。你也可以按 `Cmd+Option+I` (macOS) 或 `Ctrl+Shift+I` (Windows/Linux) 打开。

## 学习资源

- [Electron 文档](https://www.electronjs.org/docs)
- [React 文档](https://react.dev/)
- [Vite 文档](https://vitejs.dev/)
- [Electron Forge 文档](https://www.electronforge.io/)

## 配置步骤总结

本项目是通过以下步骤配置的：

1. **安装依赖**
   ```bash
   npm install react react-dom
   npm install --save-dev vite @electron-forge/plugin-vite
   ```

2. **创建 Vite 配置文件**
   - `vite.main.config.mjs` - 主进程配置
   - `vite.renderer.config.mjs` - 渲染进程配置（含 React 插件）
   - `vite.preload.config.mjs` - 预加载配置

3. **更新 Forge 配置**
   - 在 `forge.config.js` 中添加 Vite 插件配置

4. **创建 React 应用结构**
   - `src/renderer.tsx` - React 渲染入口
   - `src/App.tsx` - 主组件
   - 更新 `index.html` - 添加根节点和模块脚本

5. **更新主进程**
   - 修改 `main.js` 使用 Vite 插件提供的环境变量

现在你可以使用 `npm start` 启动应用了！
