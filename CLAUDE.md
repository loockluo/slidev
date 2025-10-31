# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Slidev 是一个为开发者打造的演示文稿工具，基于 Markdown 和 Vue 3 构建。它允许开发者使用熟悉的工具和技术来创建现代化的演示文稿。

## 核心包结构

这是一个 monorepo 项目，使用 pnpm workspace 管理：

- `packages/cli` - 主要的 CLI 工具，提供 `slidev` 命令行接口
- `packages/client` - 客户端代码，包含 Vue 组件、样式和前端逻辑
- `packages/parser` - Markdown 解析器，处理 slides.md 文件
- `packages/types` - TypeScript 类型定义
- `packages/create-app` - 创建新 Slidev 项目的脚手架工具
- `packages/create-theme` - 创建主题的脚手架工具
- `packages/vscode` - VSCode 扩展

## 常用命令

### 开发命令

```bash
# 启动开发服务器
pnpm dev

# 构建所有包
pnpm build

# 运行测试
pnpm test

# 代码检查和修复
pnpm lint
pnpm lint:fix

# 类型检查
pnpm typecheck

# 运行单个演示
pnpm demo:dev           # 启动 starter 演示
pnpm demo:vue-runner    # 启动 vue-runner 演示
pnpm demo:composable-vue # 启动 composable-vue 演示

# 文档开发
pnpm docs
pnpm docs:build
```

### 构建和发布

```bash
# 发布新版本
pnpm release

# 构建演示
pnpm demo:build

# CI 发布流程
pnpm ci:publish
```

### 测试相关

```bash
# Cypress 测试
pnpm cy

# 启动测试服务器
pnpm cy:fixture
```

### Slidev CLI 使用

```bash
# 启动开发服务器
slidev [entry]

# 构建静态文件
slidev build [entry]

# 导出 PDF/PNG/PPTX
slidev export [entry]

# 格式化 markdown
slidev format [entry]

# 主题操作
slidev theme eject
```

## 架构特点

### 1. Vite 驱动的开发环境

- 使用 Vite 作为开发服务器和构建工具
- 支持热重载和快速开发
- 集成了各种 Vite 插件（Vue、Markdown、UnoCSS 等）

### 2. Markdown 到 Vue 的转换

- 使用 `unplugin-vue-markdown` 将 Markdown 转换为 Vue 组件
- 支持在 Markdown 中嵌入 Vue 组件
- 使用 `@slidev/parser` 解析 markdown 文件

### 3. 主题系统

- 主题是独立的 npm 包
- 支持自定义布局和样式
- 使用 UnoCSS 作为样式引擎
- 主题可以包含 Vue 组件、样式和配置

### 4. 实时功能

- 演示者模式（Presenter Mode）
- 绘图和注释功能
- 代码高亮（使用 Shiki）
- 实时协作和远程控制

## 重要文件位置

### CLI 核心逻辑

- `packages/slidev/node/cli.ts` - 主要的 CLI 入口点
- `packages/slidev/node/commands/` - 各种命令实现（serve、build、export）
- `packages/slidev/node/options.ts` - 选项解析和配置

### 客户端架构

- `packages/client/App.vue` - 主应用组件
- `packages/client/pages/` - 页面组件（slides、presenter、overview）
- `packages/client/layouts/` - 布局组件
- `packages/client/composables/` - Vue 组合式函数
- `packages/client/builtin/` - 内置组件（VClick、CodeGroup 等）

### 解析器

- `packages/parser/src/core.ts` - 核心 Markdown 解析逻辑
- `packages/parser/src/fs.ts` - 文件系统操作

### 类型定义

- `packages/types/` - 全局 TypeScript 类型定义

## 开发注意事项

### 包依赖关系

- `cli` 包依赖 `client`、`parser` 和 `types`
- `client` 包提供前端运行时
- `parser` 包负责 markdown 解析和转换

### 构建流程

1. 使用 `tsdown` 构建 TypeScript 包
2. 客户端代码通过 Vite 处理
3. 支持并行构建所有包

### 主题开发

- 主题应作为独立包开发
- 使用 `packages/create-theme` 创建主题模板
- 主题可以包含 Vue 组件和自定义样式

### 配置文件

项目支持多种配置文件：

- `slidev.config.ts` - 主配置文件
- `uno.config.ts` - UnoCSS 配置
- `setup/` 目录包含各种设置文件

### 环境变量和功能标记

- 使用 `__SLIDEV_FEATURE_*` 环境变量控制功能
- 支持条件编译和功能开关

## 调试和开发提示

### 开发服务器快捷键

- `r` - 重启服务器
- `o` - 在浏览器中打开
- `e` - 编辑幻灯片
- `q` - 退出
- `c` - 显示远程控制二维码

### 测试

- 使用 Vitest 进行单元测试
- 使用 Cypress 进行端到端测试
- 测试文件位于 `cypress/` 目录

### 代码质量

- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 集成了 `simple-git-hooks` 进行 Git hooks 管理
