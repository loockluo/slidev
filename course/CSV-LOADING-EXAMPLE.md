# CSV 加载和动作提取功能示例

## 功能概述

`TimelineManager` 类现在支持从 CSV 文件同时加载字幕数据和动作数据。该功能可以自动：

1. 解析 CSV 格式的字幕文件
2. 提取文本中的 `<click no="N"/>` 等动作标签
3. 生成对应的动作事件
4. 过滤字幕文本中的 HTML 标签

## CSV 文件格式

CSV 文件需要遵循以下格式：

```
序号,开始时间,结束时间,"字幕内容"
f000001,0.000,3.280,"<click no=\"1\"/>大家好，我是程哥。"
f000002,3.280,9.000,"今天，我将带大家深入了解 LangGraphJS 的时间旅行功能。"
f000003,9.000,13.240,"这是一个革命性的调试工具，就像给应用装上了时光机。"
```

### 格式说明

- **序号**: 字幕段标识符
- **开始时间**: 开始时间（秒）
- **结束时间**: 结束时间（秒）
- **字幕内容**: 字幕文本，可包含动作标签

## 支持的动作标签

### 1. Click 标签

格式: `<click no="数字"/>`

示例:
- `<click no="1"/>` → 生成 `nextSlide` 动作
- `<click no="2"/>` → 生成 `nextSlide` 动作
- `<click no="N"/>` → 生成 `click` 动作，带 `clickNumber` 参数

### 2. 自定义动作标签

格式: `<动作名称 属性1="值1" 属性2="值2"/>`

示例:
- `<showAnimation type="fade" element="title"/>`
- `<playSound sound="click.mp3" volume="0.8"/>`

## 使用方法

### 1. 从字符串加载

```typescript
import { TimelineManager } from './components/timelineControllers';

const timelineManager = new TimelineManager();

// 加载 CSV 内容（包含字幕和动作）
const csvContent = `f000001,0.000,3.280,"<click no=\"1\"/>大家好，我是程哥。"
f000002,3.280,9.000,"今天，我将带大家深入了解 LangGraphJS。"
f000003,17.360,24.000,"<click no=\"2\"/>首先，让我们理解概念。"`;

timelineManager.loadCSVWithActions(csvContent);
console.log(`加载了 ${timelineManager.subtitleControl['data'].length} 个字幕段`);
console.log(`加载了 ${timelineManager.actionControl['data'].length} 个动作事件`);
```

### 2. 从文件加载

```typescript
// 浏览器环境
await timelineManager.loadCSVFileWithActions('/path/to/subtitles.csv');

// Node.js 环境
await timelineManager.loadCSVFileWithActions('./public/时间旅行.csv');
```

### 3. 仅加载字幕（不含动作）

```typescript
// 仅加载字幕数据
timelineManager.loadCSVContent(csvContent);
```

## 时间线和动作处理

### 注册自定义动作处理器

```typescript
// 注册幻灯片切换处理器
timelineManager.registerActionHandler('nextSlide', (params) => {
    console.log('切换到下一张幻灯片', params);
    // 实现实际的幻灯片切换逻辑
});

// 注册点击处理器
timelineManager.registerActionHandler('click', (params) => {
    console.log(`点击操作 ${params.clickNumber}`, params);
    // 实现具体的点击逻辑
});

// 注册自定义动作处理器
timelineManager.registerActionHandler('playSound', (params) => {
    console.log(`播放音效 ${params.sound}`, params);
    // 实现音效播放逻辑
});
```

### 时间线控制

```typescript
// 设置时间到指定点（会触发对应动作）
const result = timelineManager.setTime(17.36);
console.log(`当前字幕: ${result.subtitle?.text}`);
console.log(`触发的动作:`, result.action?.actions);

// 时间递增播放
const result = timelineManager.onTimeAdd(currentTime + 0.1);
console.log(`新字幕:`, result.subtitle);
console.log(`触发的动作:`, result.triggeredActions);
```

## 输出示例

### 字幕段结构
```typescript
interface SubtitleSegment {
    startTime: number;    // 开始时间
    endTime: number;      // 结束时间
    text: string;        // 过滤后的纯文本内容
}
```

### 动作事件结构
```typescript
interface ActionEvent {
    time: number;                    // 执行时间
    actions: TimelineAction[];      // 动作列表
}

interface TimelineAction {
    function: string;                // 动作函数名
    params: Record<string, any>;    // 参数对象
}
```

## 完整示例

```typescript
import { TimelineManager } from './components/timelineControllers';

class SlideController {
    private timelineManager: TimelineManager;
    private currentSlide: number = 1;

    constructor() {
        this.timelineManager = new TimelineManager();
        this.setupActionHandlers();
    }

    private setupActionHandlers() {
        // 处理 nextSlide 动作
        this.timelineManager.registerActionHandler('nextSlide', () => {
            this.currentSlide++;
            console.log(`🖼️  切换到第 ${this.currentSlide} 张幻灯片`);
            // 实际的幻灯片切换逻辑
        });

        // 处理自定义点击动作
        this.timelineManager.registerActionHandler('click', (params) => {
            console.log(`👆 执行点击 ${params.clickNumber}`);
            // 自定义点击逻辑
        });
    }

    async loadPresentation(csvPath: string) {
        await this.timelineManager.loadCSVFileWithActions(csvPath);
        console.log('演示文稿加载完成');
    }

    playAtTime(time: number) {
        const result = this.timelineManager.setTime(time);

        if (result.subtitle) {
            this.displaySubtitle(result.subtitle.text);
        }

        if (result.action) {
            console.log(`在 ${time}s 处触发了 ${result.action.actions.length} 个动作`);
        }
    }

    private displaySubtitle(text: string) {
        console.log(`📝 当前字幕: "${text}"`);
        // 实际的字幕显示逻辑
    }

    getCurrentState() {
        return this.timelineManager.getState();
    }
}

// 使用示例
const controller = new SlideController();
await controller.loadPresentation('/public/时间旅行.csv');

// 模拟播放
controller.playAtTime(0);      // 显示第一条字幕，触发 click no="1" 动作
controller.playAtTime(17.36);  // 切换到相应时间的字幕和动作
controller.playAtTime(57.0);   // 继续播放...
```

## 注意事项

1. **时间精度**: CSV 中的时间值支持小数点精度（毫秒级）
2. **HTML 过滤**: 字幕显示时自动过滤所有 HTML 标签
3. **动作顺序**: 同一时间点的多个动作按在文本中出现的顺序执行
4. **错误处理**: 无效的 CSV 行会被跳过并记录警告日志
5. **兼容性**: 支持浏览器和 Node.js 环境的文件加载