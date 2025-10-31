---
title: 测试的ppt
---

# 测试的ppt

ad

## here are the updates to merge:

<!-- 开始的第一个 -->

---

theme: seriph
layout: notes-logger
title: Notes Logger Addon 演示
info: |

## Notes Logger Addon 演示

展示如何在每页切换时自动打印 notes 到控制台
class: text-center
drawings:
persist: false
transition: slide-left
mdc: true

---

# Notes Logger Addon 演示

## 每页自动打印 Notes 到控制台

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover:bg="white hover:bg-opacity-10">
    开始演示 <carbon:arrow-right class="inline"/>
  </span>
</div>

<div class="abs-br m-6 text-sm opacity-50">
  请打开浏览器控制台查看 Notes 输出
</div>

<!--
这是第一页的 notes！
当你切换到这一页时，控制台会自动打印这段内容。
Notes Logger addon 正在监听页面变化事件。
-->

---

# 📝 功能介绍

## Notes Logger Addon 的特性

- **🔄 自动监听** - 监听页面切换事件
- **📋 提取 Notes** - 从 HTML 注释中提取 notes 内容
- **🖥️ 控制台输出** - 格式化输出到浏览器控制台
- **⚡ 实时响应** - 页面切换时立即显示

## 使用方法

1. 在 Markdown 中添加 HTML 注释作为 notes
2. 使用 `layout: notes-logger` 布局
3. 打开浏览器控制台
4. 切换页面查看 notes 输出

<!--
这是第二页的 notes 示例。
你可以在这里写演讲稿、提醒事项或者其他备注信息。
支持多行内容，会自动格式化输出。
-->

---

# 🛠️ 技术实现

## 核心组件

<div class="grid grid-cols-2 gap-8">

<div>

### NotesLogger.vue

```typescript
// 监听页面变化
watch(currentPage, (newPage, oldPage) => {
  if (newPage !== oldPage) {
    setTimeout(() => {
      logCurrentSlideNotes();
    }, 200);
  }
});
```

</div>

<div>

### 提取逻辑

```typescript
// 从多个位置提取 notes
const noteMatches = slideData.content.match(/<!--([\s\S]*?)-->/g);
if (noteMatches) {
  return noteMatches
    .map((note) => note.replace(/<!--\s*|\s*-->/g, '').trim())
    .join('\n\n');
}
```

</div>

</div>

<!--
技术实现页面的 notes：
1. 使用 Vue 3 Composition API
2. 监听 Slidev 的 currentPage 响应式变量
3. 通过正则表达式提取 HTML 注释
4. 格式化输出到控制台
这个实现非常轻量且高效。
-->

---

# 🎯 实际应用场景

## 适用场景

- **📢 演讲提醒** - 在控制台查看演讲要点
- **🎓 教学辅助** - 教师备课笔记自动显示
- **💼 商务演示** - 重要信息提醒
- **🔍 调试辅助** - 开发时查看页面元信息

## 优势特点

- **🚀 零配置** - 只需添加布局即可使用
- **📱 跨平台** - 支持所有现代浏览器
- **🎨 不影响展示** - 完全隐藏，不影响幻灯片外观
- **⚡ 高性能** - 轻量级实现，无性能影响

<!--
实际应用场景的 notes：
这个 addon 特别适合需要在演示过程中查看备注的场景。
比如老师上课时可以在控制台看到教学要点，
商务演示时可以看到关键数据和提醒事项。
由于是在控制台输出，观众看不到，非常适合演讲者使用。
-->

---

# 🎉 演示总结

## 成功实现的功能

✅ **页面切换监听** - 自动检测页面变化  
✅ **Notes 提取** - 从 HTML 注释中提取内容  
✅ **控制台输出** - 格式化显示 notes 内容  
✅ **布局集成** - 通过自定义布局轻松使用

## 下一步扩展

- 🔊 **语音播报** - TTS 朗读 notes 内容
- 📱 **移动端适配** - 支持移动设备控制台
- 🎨 **样式定制** - 自定义输出格式
- 💾 **导出功能** - 导出所有 notes 为文档

<div class="pt-8 text-center">
  <div class="text-lg font-bold text-green-600">
    🎊 Notes Logger Addon 演示完成！
  </div>
</div>

<!--
演示总结页面的 notes：
通过这个演示，我们成功展示了 Notes Logger addon 的核心功能。
这个 addon 可以帮助演讲者在演示过程中方便地查看备注信息。
实现简单但非常实用，是 Slidev 生态系统的一个很好的补充。
感谢观看这次演示！
-->
