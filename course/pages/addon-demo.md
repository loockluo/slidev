---
theme: seriph
background: https://cover.sli.dev
title: Slidev 深度解析：架构、能力与扩展
info: |
  ## Slidev 深度解析
  基于源码分析的 Slidev 架构、能力与扩展指南

  适用于二次开发和深度定制
class: text-center
drawings:
  persist: false
transition: slide-left
mdc: true
addons:
  - slidev-addon-card
  - slidev-addon-watermark
  - slidev-addon-demotime
---

layout: two-cols
layoutClass: gap-16

<!--
nih
-->

---

# 目录

您可以使用 `Toc` 组件为您的幻灯片生成目录：

```html
<Toc minDepth="1" maxDepth="1" />
```

---

# 🎨 Slidev 插件演示

## 已安装的插件展示

本演示展示了三个实用的 Slidev 插件：

- **slidev-addon-card** - 精美卡片组件
- **slidev-addon-watermark** - 水印功能
- **slidev-addon-demotime** - 演示时间管理

让我们逐一体验这些插件的功能！

<div class="mt-8">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover:bg="white hover:bg-opacity-10">
    开始插件演示 <carbon:arrow-right class="inline"/>
  </span>
</div>

---

# 📇 Card 插件演示

## slidev-addon-card

<div class="grid grid-cols-2 gap-8 mt-8">

<Card
title="Vue.js 3"
image="https://vuejs.org/images/logo.png"
frame="modern"

> Vue.js 是一个用于构建用户界面的渐进式 JavaScript 框架。它被设计为可以自底向上逐层应用。

</Card>

<Card
title="Vite"
image="https://vitejs.dev/logo.svg"
frame="classic"

> Vite 是一个现代化的前端构建工具，提供了极速的开发服务器和优化的生产构建。

</Card>

</div>

<div class="mt-8 text-center">

```html
<Card title="Vue.js 3" image="https://vuejs.org/images/logo.png" frame="modern">
  Vue.js 是一个用于构建用户界面的渐进式 JavaScript 框架。
</Card>
```

</div>

<!--
Card 插件提供了美观的卡片组件，支持多种框架样式，可以展示图片、标题和内容描述。
-->

---
layout: center
---

# 💧 Watermark 插件演示

## slidev-addon-watermark

<Watermark 
  text="Slidev Demo" 
  opacity="0.1"
  fontSize="24"
  color="#666"
/>

<div class="text-center">

## 水印功能展示

这个页面添加了水印效果，您可以在背景中看到淡淡的 "Slidev Demo" 文字。

### 水印配置选项：

- **text**: 水印文字内容
- **opacity**: 透明度 (0-1)
- **fontSize**: 字体大小
- **color**: 文字颜色

```html
<Watermark text="Slidev Demo" opacity="0.1" fontSize="24" color="#666" />
```

</div>

<!--
Watermark 插件为幻灯片添加水印效果，支持自定义文字、透明度、字体大小和颜色。
-->

---
layout: center
---

# ⏰ DemoTime 插件演示

## slidev-addon-demotime

<DemoTime 
  duration="300"
  warning="60"
  position="top-right"
/>

<div class="text-center">

## 演示时间管理

DemoTime 插件帮助您管理演示时间，在右上角显示倒计时器。

### 功能特性：

- **⏱️ 倒计时显示** - 实时显示剩余时间
- **⚠️ 时间警告** - 接近结束时的提醒
- **📍 位置自定义** - 可调整显示位置
- **🎨 样式定制** - 支持自定义外观

```html
<DemoTime duration="300" warning="60" position="top-right" />
```

<div class="mt-4 text-sm opacity-70">
演示时长：5分钟 | 警告时间：1分钟前
</div>

</div>

<!--
DemoTime 插件提供演示时间管理功能，帮助演讲者控制演示节奏，避免超时。
-->

---

layout: center

---

# 🎉 插件演示总结

## 三个实用插件的特点

<div class="grid grid-cols-3 gap-8 mt-8">

<div class="text-center">

### 📇 Card 插件

- 精美的卡片设计
- 多种框架样式
- 支持图片和文字
- 响应式布局

</div>

<div class="text-center">

### 💧 Watermark 插件

- 背景水印效果
- 自定义透明度
- 灵活的样式配置
- 品牌保护功能

</div>

<div class="text-center">

### ⏰ DemoTime 插件

- 实时倒计时
- 时间警告提醒
- 位置自由调整
- 演示节奏控制

</div>

</div>

<div class="mt-12 text-center">

## 🚀 开始使用

```bash
pnpm add slidev-addon-card slidev-addon-watermark slidev-addon-demotime
```

<div class="mt-4 text-sm opacity-70">
这些插件已经安装并可以在您的 Slidev 项目中使用！
</div>

</div>

<!--
通过这三个插件的演示，我们看到了 Slidev 生态系统的强大扩展能力。每个插件都为演示文稿增加了独特的功能和视觉效果。
-->

---

layout: center
class: text-center

---

# 了解更多

[文档](https://sli.dev) · [GitHub](https://github.com/slidevjs/slidev) · [展示案例](https://sli.dev/resources/showcases)

<PoweredBySlidev mt-10 />
