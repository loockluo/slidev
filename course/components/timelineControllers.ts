// 字幕相关接口
export interface SubtitleSegment {
    startTime: number;
    endTime: number;
    text: string;
}

// 动作相关接口
export interface TimelineAction {
    function: string;
    params: Record<string, any>;
}

export interface ActionEvent {
    time: number;
    actions: TimelineAction[];
}



// 字幕控制器：处理时间段的字幕显示
export class SubtitleControl {
    data: SubtitleSegment[];
    private activeSegment: SubtitleSegment | null;

    constructor(data: SubtitleSegment[]) {
        this.data = data.sort((a, b) => a.startTime - b.startTime); // 确保按时间排序
        this.activeSegment = null;
    }

    // 获取当前激活的字幕段
    getCurrentSegment(): SubtitleSegment | null {
        return this.activeSegment;
    }

    // 获取当前字幕文本（便利方法）
    getCurrentSubtitle(): string | null {
        return this.activeSegment?.text || null;
    }

    // 查找指定时间的字幕段
    private findSubtitleAtTime(time: number): SubtitleSegment | null {
        if (this.data.length === 0) {
            return null;
        }

        for (const segment of this.data) {
            if (time >= segment.startTime && time <= segment.endTime) {
                return segment;
            }
        }

        return null;
    }

    // 更新字幕显示
    private updateSubtitle(subtitle: string | null) {
        console.log(`📝 字幕更新: "${subtitle}"`);
        // 这里可以连接到实际的字幕显示组件
    }

    // 时间递增：处理时间向前推进时的字幕更新
    onTimeAdd(time: number): SubtitleSegment | null {
        const activeSegment = this.findSubtitleAtTime(time);

        // 如果字幕段发生变化，更新字幕
        if (this.activeSegment?.text !== activeSegment?.text) {
            this.activeSegment = activeSegment;
            this.updateSubtitle(activeSegment?.text || null);
            return activeSegment;
        }

        return null; // 没有字幕变化
    }

    // 时间随机跳转：同步到指定时间点的字幕状态
    onTimeChange(time: number): SubtitleSegment | null {
        const activeSegment = this.findSubtitleAtTime(time);

        // 如果字幕段发生变化，更新字幕
        if (this.activeSegment?.text !== activeSegment?.text) {
            this.activeSegment = activeSegment;
            this.updateSubtitle(activeSegment?.text || null);
            console.log(`🔄 字幕同步到时间 ${time}s: "${activeSegment?.text || '无字幕'}"`);
        }

        return activeSegment;
    }

    // 重置控制器
    reset() {
        this.activeSegment = null;
        this.updateSubtitle(null);
        console.log("🔄 字幕控制器重置");
    }

    // 获取指定时间的字幕段（不改变状态）
    getSubtitleAtTime(time: number): SubtitleSegment | null {
        return this.findSubtitleAtTime(time);
    }
}

// 时间线管理器：统一管理字幕和动作控制器
export class TimelineManager {
    private subtitleControl: SubtitleControl;
    private actionControl: ActionController;
    private currentTime: number = 0;
    private previousTime: number = 0;
    private subtitleStartHandlers: Map<string, Function> = new Map();
    private subtitleEndHandlers: Map<string, Function> = new Map();
    private lastActiveSubtitle: SubtitleSegment | null = null;

    constructor() {
        this.subtitleControl = new SubtitleControl([]);
        this.actionControl = new ActionController([]);
    }


    // 注册字幕开始处理函数
    onSubtitleStart(handler: (subtitle: SubtitleSegment) => void) {
        this.subtitleStartHandlers.set('default', handler);
    }

    // 注册字幕结束处理函数
    onSubtitleEnd(handler: (subtitle: SubtitleSegment) => void) {
        this.subtitleEndHandlers.set('default', handler);
    }

    // 注册动作处理函数
    registerActionHandler(actionName: string, handler: (params: any, currentTime: number) => void) {
        this.actionControl.registerActionHandler(actionName, handler);
    }

    // 检查字幕段结束事件
    private checkSubtitleEndEvents(fromTime: number, toTime: number) {
        const allSubtitles = this.subtitleControl['data']; // 访问私有属性获取所有字幕段

        for (const subtitle of allSubtitles) {
            const endTime = subtitle.endTime;

            // 检查是否跨越了字幕结束时间点
            if (fromTime < endTime && toTime >= endTime) {
                const endHandler = this.subtitleEndHandlers.get('default');
                if (endHandler) {
                    endHandler(subtitle);
                }
            }
        }
    }

    // 时间递增
    onTimeAdd(time: number) {
        this.previousTime = this.currentTime;
        this.currentTime = time;

        // 检查字幕段结束事件
        this.checkSubtitleEndEvents(this.previousTime, time);

        // 处理字幕
        const newSubtitle = this.subtitleControl.onTimeAdd(time);
        if (newSubtitle) {
            const startHandler = this.subtitleStartHandlers.get('default');
            if (startHandler) {
                startHandler(newSubtitle);
            }
            this.lastActiveSubtitle = newSubtitle;
        }

        // 处理动作
        const triggeredActions = this.actionControl.onTimeAdd(time);
        return {
            subtitle: newSubtitle,
            triggeredActions
        };
    }

    // 设置时间到指定点
    setTime(time: number) {
        // 对于时间跳转，我们需要检查所有应该在结束时间之前触发的结束事件
        const allSubtitles = this.subtitleControl['data'];

        // 检查是否有需要触发的字幕结束事件
        for (const subtitle of allSubtitles) {
            if (subtitle.endTime <= time &&
                (!this.lastActiveSubtitle || this.lastActiveSubtitle.endTime !== subtitle.endTime)) {
                const endHandler = this.subtitleEndHandlers.get('default');
                if (endHandler) {
                    endHandler(subtitle);
                }
            }
        }

        this.currentTime = time;

        // 处理字幕
        const subtitle = this.subtitleControl.onTimeChange(time);
        if (subtitle) {
            const startHandler = this.subtitleStartHandlers.get('default');
            if (startHandler) {
                startHandler(subtitle);
            }
            this.lastActiveSubtitle = subtitle;
        } else {
            // 如果没有当前字幕，清空 lastActiveSubtitle
            this.lastActiveSubtitle = null;
        }

        // 处理动作
        const action = this.actionControl.onTimeChange(time);

        return {
            subtitle,
            action
        };
    }

    // 获取当前时间
    getCurrentTime(): number {
        return this.currentTime;
    }

    // 获取当前字幕
    getCurrentSubtitle(): string | null {
        return this.subtitleControl.getCurrentSubtitle();
    }

    // 获取当前字幕段
    getCurrentSubtitleSegment(): SubtitleSegment | null {
        return this.subtitleControl.getCurrentSegment();
    }

    // 获取当前动作事件
    getCurrentActionEvent(): ActionEvent | null {
        return this.actionControl.getCurrentEvent();
    }

    // 获取完整状态
    getState() {
        return {
            time: this.currentTime,
            subtitle: this.getCurrentSubtitle(),
            subtitleSegment: this.getCurrentSubtitleSegment(),
            actionEvent: this.getCurrentActionEvent(),
            actionControlState: this.actionControl.getCurrentState()
        };
    }


    // 从 CSV 内容同时加载字幕和动作数据（主要方法）
    loadCSVWithActions(csvContent: string): void {
        try {
            // 同时解析字幕和动作数据
            const segments = this.parseCSVFileContent(csvContent);
            const actions = this.extractActionsFromCSV(csvContent);

            // 更新控制器
            this.subtitleControl = new SubtitleControl(segments);
            this.actionControl = new ActionController(actions);

            console.log(`📝 CSV 数据已加载: ${segments.length} 个字幕段, ${actions.length} 个动作事件`);
        } catch (error: any) {
            console.error('❌ 加载 CSV 内容失败:', error.message);
            throw error;
        }
    }

    // 从 CSV 文件路径同时加载字幕和动作数据
    async loadCSVFileWithActions(filePath: string): Promise<void> {
        try {
            const csvContent = await this.loadCSVFileContent(filePath);
            this.loadCSVWithActions(csvContent);
            console.log(`📝 CSV 文件已加载: ${filePath}`);
        } catch (error: any) {
            console.error('❌ 加载 CSV 文件失败:', error.message);
            throw error;
        }
    }

    // 通用的 CSV 文件内容加载方法（内部使用）
    private async loadCSVFileContent(filePath: string): Promise<string> {
        // 浏览器环境
        if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Failed to fetch CSV file: ${response.statusText}`);
            }
            return await response.text();
        }
        // Node.js 环境
        else if (typeof require !== 'undefined') {
            const fs = require('fs');
            const path = require('path');
            return fs.readFileSync(path.resolve(filePath), 'utf-8');
        }
        else {
            throw new Error('Unsupported environment for file loading');
        }
    }

    // 解析 CSV 文件内容为 SubtitleSegment 数组（带动作提取）
    private parseCSVFileContent(csvContent: string): SubtitleSegment[] {
        const segments: SubtitleSegment[] = [];
        const lines = csvContent.trim().split('\n');

        for (const line of lines) {
            // 跳过空行
            if (!line.trim()) continue;

            // CSV格式: 序号,开始时间,结束时间,"字幕内容"
            // 使用正则表达式匹配带引号的字段
            const csvPattern = /^([^,]+),([^,]+),([^,]+),"(.*?)"$/;
            const match = line.match(csvPattern);

            if (match) {
                const [, , startTimeStr, endTimeStr, text] = match;

                // 转换时间为数字（秒）
                const startTime = parseFloat(startTimeStr);
                const endTime = parseFloat(endTimeStr);

                // 验证时间格式
                if (!isNaN(startTime) && !isNaN(endTime) && startTime < endTime && text.trim()) {
                    segments.push({
                        startTime,
                        endTime,
                        text: this.filterHTMLTags(text.trim()) // 过滤HTML标签
                    });
                } else {
                    console.warn(`⚠️ 跳过无效的CSV行: ${line}`);
                }
            } else {
                console.warn(`⚠️ CSV格式不匹配，跳过该行: ${line}`);
            }
        }

        return segments.sort((a, b) => a.startTime - b.startTime);
    }

    // 从 CSV 内容中提取动作数据
    private extractActionsFromCSV(csvContent: string): ActionEvent[] {
        const actionEvents: ActionEvent[] = [];
        const lines = csvContent.trim().split('\n');

        for (const line of lines) {
            // 跳过空行
            if (!line.trim()) continue;

            // CSV格式: 序号,开始时间,结束时间,"字幕内容"
            const csvPattern = /^([^,]+),([^,]+),([^,]+),"(.*?)"$/;
            const match = line.match(csvPattern);

            if (match) {
                const [, , startTimeStr, , text] = match;
                const startTime = parseFloat(startTimeStr);

                // 查找文本中的动作标签
                const actions = this.extractActionTags(text);

                if (actions.length > 0) {
                    actionEvents.push({
                        time: startTime,
                        actions
                    });
                }
            }
        }

        return actionEvents.sort((a, b) => a.time - b.time);
    }

    // 从文本中提取动作标签
    private extractActionTags(text: string): TimelineAction[] {
        const actions: TimelineAction[] = [];

        // 匹配所有动作标签格式：<标签名 属性1="值1" 属性2="值2"/>
        const actionRegex = /<(\w+)(?:\s+([^>]*))?(?:\s*\/)?>/g;
        const matches = text.matchAll(actionRegex);

        for (const match of matches) {
            const tagName = match[1]; // 标签名称作为 function
            const attributes = match[2] || ''; // 属性字符串

            // 解析属性作为 params
            const params: Record<string, any> = {};
            if (attributes) {
                const attrRegex = /(\w+)="([^"]*)"/g;
                const attrMatches = attributes.matchAll(attrRegex);

                for (const attrMatch of attrMatches) {
                    const attrName = attrMatch[1];
                    const attrValue = attrMatch[2];

                    // 智能类型转换：尝试转换为数字，保持布尔值等
                    if (attrValue === 'true') {
                        params[attrName] = true;
                    } else if (attrValue === 'false') {
                        params[attrName] = false;
                    } else {
                        // 尝试转换为数字
                        const numValue = parseFloat(attrValue);
                        params[attrName] = isNaN(numValue) ? attrValue : numValue;
                    }
                }
            }

            actions.push({
                function: tagName,
                params
            });

            console.log(`🎯 提取到动作: ${tagName}(${JSON.stringify(params)})`);
        }

        return actions;
    }

    // 过滤文本中的HTML标签，用于字幕显示
    private filterHTMLTags(text: string): string {
        return text.replace(/<[^>]*>/g, '').trim();
    }

    // 重置所有控制器
    reset() {
        this.currentTime = 0;
        this.previousTime = 0;
        this.lastActiveSubtitle = null;
        this.subtitleControl.reset();
        this.actionControl.reset();
        console.log("🔄 时间线管理器已重置");
    }

    // 查询指定时间的状态（不改变当前状态）
    queryStateAtTime(time: number) {
        const subtitle = this.subtitleControl.getSubtitleAtTime(time);
        const action = this.actionControl.getEventAtTime(time);

        return {
            time,
            subtitle: subtitle?.text || null,
            subtitleSegment: subtitle,
            actionEvent: action,
            wouldTriggerActions: action ? action.actions.length : 0
        };
    }
}

export class ActionController {
    data: ActionEvent[];
    private previousTime: number = 0;
    private currentTime: number = 0;
    private currentEvent: ActionEvent | null;
    private actionHandlers: Map<string, Function>;

    constructor(data: ActionEvent[]) {
        this.data = data.sort((a, b) => a.time - b.time); // 确保按时间排序
        this.currentEvent = null;
        this.actionHandlers = new Map();
        this.initializeDefaultHandlers();
    }

    // 注册动作处理器
    registerActionHandler(actionName: string, handler: Function) {
        this.actionHandlers.set(actionName, handler);
    }

    // 初始化默认的动作处理器
    private initializeDefaultHandlers() {
        this.registerActionHandler('click', (params: any) => {
            console.log(`🎯 执行动作: 点击操作 ${params.clickNumber || '未知'}`, params);
        });

    }

    // 执行动作
    private executeAction(action: TimelineAction) {
        const handler = this.actionHandlers.get(action.function);
        if (handler) {
            try {
                // 传递当前时间给处理器函数
                handler(action.params, this.currentTime);
            } catch (error) {
                console.error(`执行动作 ${action.function} 时出错:`, error);
            }
        } else {
            console.warn(`未找到动作处理器: ${action.function}`);
        }
    }

    // 执行多个动作
    private executeActions(actions: TimelineAction[] = []) {
        actions.forEach(action => {
            this.executeAction(action);
        });
    }

    // 查找当前时间前最近的一个事件
    private findClosestEventInTimeRange(preTime: number, curTime: number): ActionEvent | null {
        if (this.data.length === 0) {
            return null;
        }

        let latestEvent: ActionEvent | null = null;
        let latestTime = -Infinity;

        // 遍历所有事件，找到在当前时间之前且最接近当前时间的事件
        for (const event of this.data) {
            // 检查事件时间是否在当前时间之前（包括等于当前时间）
            if (event.time <= curTime) {
                // 找到最接近当前时间的过去事件
                if (event.time > latestTime) {
                    latestTime = event.time;
                    latestEvent = event;
                }
            }
        }

        return latestEvent;
    }

    // 获取当前状态
    getCurrentState() {
        return {
            previousTime: this.previousTime,
            currentTime: this.currentTime,
            currentEvent: this.currentEvent
        };
    }

    // 获取当前事件
    getCurrentEvent(): ActionEvent | null {
        return this.currentEvent;
    }

    // 获取已触发动作数
    getCurrentTime(): number {
        return this.currentTime;
    }

    // 更新时间并触发相应事件
    updateTime(newTime: number): ActionEvent | null {
        this.previousTime = this.currentTime;
        this.currentTime = newTime;

        // 查找在时间范围内最接近当前时间的事件
        const closestEvent = this.findClosestEventInTimeRange(this.previousTime, this.currentTime);

        if (closestEvent && closestEvent !== this.currentEvent) {
            this.currentEvent = closestEvent;
            this.executeActions(closestEvent.actions);
            console.log(`🎯 触发动作事件: 时间=${closestEvent.time}s, 动作数=${closestEvent.actions.length}`);
            return closestEvent;
        }

        return null;
    }

    // 时间递增：处理时间向前推进时的动作触发（保持向后兼容）
    onTimeAdd(time: number): ActionEvent[] {
        const triggeredEvent = this.updateTime(time);
        return triggeredEvent ? [triggeredEvent] : [];
    }

    // 时间随机跳转：同步到指定时间点的正确状态（保持向后兼容）
    onTimeChange(time: number): ActionEvent | null {
        return this.updateTime(time);
    }

    // 重置控制器
    reset() {
        this.previousTime = 0;
        this.currentTime = 0;
        this.currentEvent = null;
        console.log("🔄 动作控制器重置");
    }

    // 获取指定时间的事件（不改变状态）
    getEventAtTime(time: number): ActionEvent | null {
        if (this.data.length === 0) {
            return null;
        }

        let result: ActionEvent | null = null;
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i].time <= time) {
                result = this.data[i];
            } else {
                break;
            }
        }

        return result;
    }
}