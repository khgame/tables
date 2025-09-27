# 概念与约定

## Table 内部结构

读取 Excel 后，会抽象为：
- `cols: string[]` 列名（A, B, C...）
- `data: { [row: string]: { [col: string]: Cell } }`
- `getValue(table, row, col)` 获取单元格值（屏蔽底层布局差异）

插件可在此基础上附加：`rows/erows/colMap/marks/markCols/markLine/descLine/schema/convert/...`

## 标记行与描述行

- 标记行（第 1 行）：
  - `@`：该列参与 TID（主键）拼接
  - 类型标记：`string|uint?`、`{ ... }`、`[ ... ]`、`Array<T>`、`Pair<T>` 等
  - 装饰器：写在 `[` 或 `{` 之前，如 `$strict [ uint ]`，`$ghost { ... }`
- 描述行（第 2 行）：作为键名与注释来源

示例（简化）：
```
A: @     B: uint      C: string      D: $strict [ { tid:uint; num:float } ]
A: id    B: level     C: name        D: product
001      1            farm           [{tid:1000001,num:1}]
001      2            farm           [{tid:1000001,num:2}]
```

## Schema 解析

- 使用 `@khgame/schema` 将标记行解析为 AST，并结合描述行生成 TS 接口
- 支持：基本类型、联合 `|`、可选 `?`、嵌套对象/数组、枚举（由上下文提供）

## TID（主键）与冲突策略

- 将标记为 `@` 的列值按列序拼接得到 TID
- 冲突策略（`context.policy.tidConflict`）：
  - `error`（默认）：报错
  - `overwrite`：后者覆盖前者
  - `ignore`：忽略后者
  - `merge`：对象深合并
- CLI `--strict` 会启用 `error`

## 产出稳定性

- 所有序列化器会对 `result` 的 key 进行排序，保证产出稳定

更多：见 [插件与扩展点](plugins.md) · [序列化器与上下文](serializers.md)。
