# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Slidev 的幻灯片项目，具有自动播放和语音转文字功能。项目名称为 "autovide"，是一个 Slidev 插件演示项目。

## 开发命令

### 基本命令
- `pnpm install` - 安装依赖
- `pnpm dev` - 启动开发服务器（默认端口 3030）
- `pnpm build` - 构建幻灯片
- `pnpm export` - 导出幻灯片

### Slidev 特定命令
- `slidev --open` - 启动开发服务器并自动打开浏览器
- `slidev build` - 构建生产版本
- `slidev export` - 导出为 PDF/PNG 等格式

## 项目架构

### 核心文件结构
```
├── slides.md                 # 主入口文件（引用 pages/slides.md）
├── global-top.vue           # 全局顶部组件，包含进度条
├── components/
│   └── Progress.vue         # 进度条组件，包含语音转文字功能
├── pages/
│   ├── slides.md           # 主要幻灯片内容
│   ├── addon-demo.md       # 插件演示页面
│   ├── imported-slides.md  # 导入的幻灯片
│   └── my-addon-demo.md    # 自定义插件演示
├── public/                 # 静态资源目录
└── snippets/
    └── external.ts         # 外部代码片段
```

### 主要功能组件

#### Progress.vue (components/Progress.vue)
这是项目的核心组件，提供以下功能：
- **进度条显示**：显示幻灯片播放进度
- **语音转文字**：使用 Web Speech API 将幻灯片 notes 转换为语音播放
- **页面监听**：监听幻灯片页面变化，自动获取并朗读当前页的 note 内容
- **自定义样式**：支持多种进度条样式和位置配置

#### 语音功能实现
```javascript
// 核心语音播放函数
const speakText = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN'; // 中文语音
  utterance.rate = 1; // 语速
  utterance.pitch = 1; // 音调
  utterance.volume = 1; // 音量
  window.speechSynthesis.speak(utterance);
};
```

### 已安装的 Slidev 插件
- **slidev-addon-card** - 精美卡片组件
- **slidev-addon-watermark** - 水印功能
- **slidev-addon-demotime** - 演示时间管理
- **slidev-addon-sync** - 同步功能

### 主题配置
- 使用 `seriph` 主题
- 支持自定义背景和布局
- 启用了 MDC (Markdown Components)

## 开发注意事项

### Notes 语音功能
- 幻灯片的 notes 内容会自动转换为中文语音播放
- Notes 使用 HTML 注释格式：`<!-- 这是 note 内容 -->`
- 语音功能在页面切换时自动触发

### 文件引用关系
- 根目录的 `slides.md` 是入口文件，引用 `pages/slides.md`
- 全局组件在 `global-top.vue` 中配置
- 自定义组件放在 `components/` 目录

### 浏览器兼容性
- 语音功能依赖 Web Speech API，需要现代浏览器支持
- 建议使用 Chrome、Edge 等支持语音合成的浏览器

## 开发工作流

1. 修改幻灯片内容：编辑 `pages/slides.md` 或其他页面文件
2. 添加语音 notes：在幻灯片中使用 HTML 注释添加需要朗读的内容
3. 自定义样式：修改 `components/Progress.vue` 或 `global-top.vue`
4. 添加新组件：在 `components/` 目录创建 Vue 组件
5. 测试功能：运行 `pnpm dev` 并在浏览器中查看效果

## 特殊功能

### 拖拽功能
项目支持可拖拽元素，使用 `v-drag` 指令：
```html
<img v-drag="'square'" src="path/to/image.png">
```

### Monaco 编辑器
支持在幻灯片中嵌入代码编辑器：
```ts {monaco-run}
// 可执行的代码示例
console.log('Hello Slidev');
```

### 动画支持
- Vue Motion 动画：使用 `v-motion` 指令
- 点击动画：使用 `v-click` 指令
- Mermaid 图表：支持流程图、时序图等