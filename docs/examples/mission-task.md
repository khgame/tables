# 任务系统（missionTask）

此示例基于 `test/excel/missionTask.xlsx`。

## 目标
- 将任务按 `tid` 聚合，包含条件、奖励、链路等

## Excel 表头（示意）
```
A: @        B: string    C: { type:uint, value:uint }   D: $strict [ { tid:uint, num:uint } ]
A: tid      B: title     C: condition                   D: rewards
10001       新手引导     {type:1,value:10}              [{tid:2001,num:1},{tid:2002,num:5}]
```

- `$strict`：数组为定长/定序结构（TS 将生成 tuple 风格或严格数组）

## 导出命令
```bash
npm run build
node lib/exec.js -i ./test/excel/missionTask.xlsx -o ./docs/generated -f json --silent
```
产物：`docs/generated/MissionTask.json`

## 消费侧（示意）
```js
const data = require('../generated/MissionTask.json')
for (const tid in data.result) {
  const task = data.result[tid]
  // 直接驱动任务系统初始化
}
```
