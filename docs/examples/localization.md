# 多语言（localization）

多语言配置通常是 key -> 文本 的映射，建议每语言一本 Excel 或每 sheet 一语言。

## Excel 表头（示意）
```
A: @     B: string
A: key   B: zhCN
HELLO    你好
WORLD    世界
```

或多语言同表（更适合导出多目标）：
```
A: @     B: string   C: string
A: key   B: zhCN     C: enUS
HELLO    你好        Hello
WORLD    世界        World
```

## 导出为 js/json
```bash
npm run build
node lib/exec.js -i ./example/locale.xlsx -o ./docs/generated -f js --silent
```

## 消费侧
```js
const zh = require('../generated/Locale.js')
function t(key) { return (zh.result[key] || key) }
```

进阶：也可导出 `ts-interface` 仅作类型约束。
