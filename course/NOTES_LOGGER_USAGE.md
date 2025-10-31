# Notes Logger Addon 使用说明

## 功能介绍

Notes Logger Addon 是一个为 Slidev 开发的插件，能够在每次切换幻灯片页面时自动获取该页的 notes（备注）并在浏览器控制台打印出来。

## 文件结构

```
components/
├── NotesLogger.vue          # 核心组件：监听页面变化并打印 notes
├── NotesLoggerGlobal.vue    # 全局包装组件
layouts/
└── notes-logger.vue         # 自定义布局，集成 NotesLogger 组件
pages/
└── my-addon-demo.md         # 演示文档，展示 addon 功能
```

## 使用方法

### 1. 在幻灯片中添加 notes

在 Markdown 文件中使用 HTML 注释添加 notes：

```markdown
---
layout: notes-logger
---

# 我的幻灯片标题

这里是幻灯片内容

<!--
这里是 notes 内容
会在控制台自动打印
支持多行文本
-->
```

### 2. 使用 notes-logger 布局

在幻灯片的 frontmatter 中指定布局：

```yaml
---
layout: notes-logger
---
```

### 3. 查看 notes 输出

1. 启动 Slidev：`pnpm dev`
2. 打开浏览器控制台（F12）
3. 切换幻灯片页面
4. 在控制台查看格式化的 notes 输出

## 技术实现

### 核心功能

- **页面监听**：使用 Vue 3 的 `watch` API 监听 `currentPage` 变化
- **Notes 提取**：通过正则表达式从幻灯片内容中提取 HTML 注释
- **控制台输出**：格式化输出 notes 内容到浏览器控制台
- **自动加载**：组件挂载时自动显示第一页的 notes

### 兼容性

- 支持所有现代浏览器
- 兼容 Slidev 最新版本
- 不影响幻灯片的正常显示和功能

## 输出格式

```
============================================================
📝 第 1 页幻灯片 Notes
============================================================
这里是第一页的 notes 内容
支持多行显示
============================================================
```

## 注意事项

- Notes 只在浏览器控制台显示，不会影响幻灯片的视觉效果
- 确保在 frontmatter 中使用 `layout: notes-logger`
- 如果页面没有 notes，会显示"该页面没有 notes 或 notes 为空"