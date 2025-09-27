# 插件与扩展点

流水线插件按顺序执行，输入与输出均为 `Table`：

- `tableRows`：获取所有出现过数据的行号
- `tableEnsureRows (erows)`：过滤掉“全空行”（保留 0/false 等有效值）
- `tableColMap`：列字母 -> 列索引
- `tableMark`：定位表头起始 `@`
- `tableDesc`：读取标记行与描述行，形成 `markCols/markLine/descLine`
- `tableSchema`：解析 schema（基于 `@khgame/schema`）
- `tableConvert`：按 schema + 数据行导出 `{ tids, result, collisions }`
- `tablePlain`：将 `Cell` 简化为原始值，改变 `getValue`
- `tableExpand`：按 `cols` 将每行扩展为数组形式，改变 `getValue`

自定义插件：
```ts
import type { Table } from '@khgame/tables'
export function myPlugin(table: Table): Table {
  // ... mutate or annotate table
  return table
}
```

在 `readAndTranslate('x.xlsx', { plugins: [a, b, c] })` 中按数组顺序执行。
