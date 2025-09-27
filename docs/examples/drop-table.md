# 掉落与关卡奖励（drop-table）

展示“加权掉落 + 分组 + 多档位”常见配置写法。

## Excel 表头（示意）
```
A: @        B: string      C: $strict [ { tid:uint, weight:uint } ]     D: $ghost { gold:uint, gem:uint }
A: tid      B: name        C: entries                                   D: bonus
1001       1-1 关卡       [{tid:2001,weight:50},{tid:2002,weight:50}]   {gold:100}
1002       1-2 关卡       [{tid:2001,weight:30},{tid:2003,weight:70}]   
```

- 加权掉落使用严格数组 `$strict`，确保每行条目结构一致
- 额外奖励用 `$ghost`，可选存在

## 读取与消费（伪代码）
```ts
import { IDropTable, dropTable } from '../generated/DropTable'

function roll(stageTid: string) {
  const row = dropTable[stageTid]
  const sum = row.entries.reduce((s, e) => s + e.weight, 0)
  let r = Math.floor(Math.random() * sum)
  for (const e of row.entries) { r -= e.weight; if (r < 0) return e.tid }
}
```
