/**
 * 测试新的动作解析逻辑
 * 验证标签名称作为function，属性作为params的解析
 */

// 模拟 TimelineManager 中的 extractActionTags 方法
function extractActionTags(text) {
    const actions = [];

    // 匹配所有动作标签格式：<标签名 属性1="值1" 属性2="值2"/>
    const actionRegex = /<(\w+)(?:\s+([^>]*))?(?:\s*\/)?>/g;
    const matches = text.matchAll(actionRegex);

    for (const match of matches) {
        const tagName = match[1]; // 标签名称作为 function
        const attributes = match[2] || ''; // 属性字符串

        // 解析属性作为 params
        const params = {};
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

// 测试用例
const testCases = [
    {
        name: '基础 click 标签',
        text: '<click no="1"/>',
        expected: { function: 'click', params: { no: 1 } }
    },
    {
        name: '带多个属性的标签',
        text: '<showSlide slide="2" clicks="3"/>',
        expected: { function: 'showSlide', params: { slide: 2, clicks: 3 } }
    },
    {
        name: '带布尔值属性的标签',
        text: '<playSound sound="audio.mp3" loop="true" volume="0.8"/>',
        expected: { function: 'playSound', params: { sound: 'audio.mp3', loop: true, volume: 0.8 } }
    },
    {
        name: '混合文本和标签',
        text: '这是一些文本<click no="2"/>然后继续文本<navigateTo page="3"/>',
        expectedActions: [
            { function: 'click', params: { no: 2 } },
            { function: 'navigateTo', params: { page: 3 } }
        ]
    },
    {
        name: '字符串类型属性',
        text: '<highlightContent element="title" color="red" duration="5.5"/>',
        expected: { function: 'highlightContent', params: { element: 'title', color: 'red', duration: 5.5 } }
    },
    {
        name: '多个动作标签',
        text: '<click no="1"/><nextSlide/><playSound sound="beep.mp3"/>',
        expectedActions: [
            { function: 'click', params: { no: 1 } },
            { function: 'nextSlide', params: {} },
            { function: 'playSound', params: { sound: 'beep.mp3' } }
        ]
    }
];

// 运行测试
console.log('🧪 开始测试新的动作解析逻辑\n');

let passedTests = 0;
let totalTests = 0;

testCases.forEach((testCase, index) => {
    console.log(`\n📋 测试 ${index + 1}: ${testCase.name}`);
    console.log(`输入: "${testCase.text}"`);

    const result = extractActionTags(testCase.text);
    console.log(`解析结果:`, result);

    totalTests++;

    // 验证结果
    let passed = true;
    if (testCase.expected) {
        if (result.length === 1 &&
            result[0].function === testCase.expected.function &&
            JSON.stringify(result[0].params) === JSON.stringify(testCase.expected.params)) {
            console.log('✅ 测试通过');
            passedTests++;
        } else {
            console.log('❌ 测试失败');
            console.log(`期望: ${JSON.stringify(testCase.expected)}`);
            console.log(`实际: ${JSON.stringify(result[0])}`);
        }
    } else if (testCase.expectedActions) {
        if (result.length === testCase.expectedActions.length) {
            let allMatch = true;
            for (let i = 0; i < result.length; i++) {
                if (result[i].function !== testCase.expectedActions[i].function ||
                    JSON.stringify(result[i].params) !== JSON.stringify(testCase.expectedActions[i].params)) {
                    allMatch = false;
                    break;
                }
            }

            if (allMatch) {
                console.log('✅ 测试通过');
                passedTests++;
            } else {
                console.log('❌ 测试失败');
                console.log(`期望: ${JSON.stringify(testCase.expectedActions)}`);
                console.log(`实际: ${JSON.stringify(result)}`);
            }
        } else {
            console.log('❌ 测试失败 - 动作数量不匹配');
            console.log(`期望: ${testCase.expectedActions.length} 个动作`);
            console.log(`实际: ${result.length} 个动作`);
        }
    }
});

console.log(`\n📊 测试结果: ${passedTests}/${totalTests} 通过`);

if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！新的动作解析逻辑工作正常。');
} else {
    console.log('⚠️ 部分测试失败，请检查解析逻辑。');
}

// 测试实际的 CSV 文件解析
console.log('\n🔍 测试实际 CSV 文件解析:');

try {
    const fs = require('fs');
    const csvPath = './public/时间旅行.csv';

    if (fs.existsSync(csvPath)) {
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = csvContent.split('\n').slice(0, 5); // 测试前5行

        console.log('CSV 前5行动作解析:');
        lines.forEach((line, index) => {
            const match = line.match(/^([^,]+),([^,]+),([^,]+),"(.*?)"$/);
            if (match) {
                const text = match[4];
                const actions = extractActionTags(text);
                if (actions.length > 0) {
                    console.log(`  行 ${index + 1}: ${actions.length} 个动作`);
                    actions.forEach(action => {
                        console.log(`    - ${action.function}(${JSON.stringify(action.params)})`);
                    });
                }
            }
        });
    } else {
        console.log('⚠️ CSV 文件不存在，跳过实际文件测试');
    }
} catch (error) {
    console.log('⚠️ 无法读取 CSV 文件:', error.message);
}