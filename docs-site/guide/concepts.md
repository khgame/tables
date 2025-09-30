# 概念与约定

## 从 Excel 到 Table

- `readAndTranslate(path, { plugins }, context)` 负责读取工作簿、抽象为 Table，并依次执行插件（如 `tableSchema`、`tableConvert`）。
- Table 是 Excel 的最小抽象单元，插件按需为其附加中间产物与最终结果。

## Table 内部结构

初始 Table 包含：
- `cols: string[]`：列名（A、B、C...）
- `data: { [row: string]: { [col: string]: Cell } }`：行列索引到单元格的映射
- `getValue(table, row, col)`：对 `data` 的统一读取入口

插件会在此基础上拓展属性，如 `rows/erows/colMap/marks/markCols/markLine/descLine/markList/schema/convert/...`。

## 标记区域定位

- 标记行是**真正出现 `@` 的那一行**，不要求在首行。`tableMark` 会遍历单元格找到 `@` 并记录其行列。
- 标记行下方一行视为描述行（字段名与注释来源）。
- `tableDesc` 会将标记行的每一列读取为单独的 **语法 token** 并生成 `markCols`（有效列）与 `markLine`/`descLine`。
- Token 被顺序组合成类型表达式，因此 `Array`、`<`、`>`、`[`、`]`、`{`、`}`、`Pair` 等符号都要各占一个单元格。

典型布局（节选）：
```
等级   数值   ...
@      Array  <  Map  <  number  >  >  string  string  ...
ID     value        ...                    describe ...
```

## 常用类型语法

| 写法（按列拆分） | 说明 |
| ---------------- | ---- |
| `@`              | 当前列用于拼接 TID（主键） |
| `uint` / `int` / `float` / `string` / `bool` / `tid` | 基础类型，由 `@khgame/schema` 提供 |
| `Array` `<` `T` `>` 或直接 `Array<T>` | 动态数组，转换结果为 `T[]` |
| `[` `T` `]`      | 与 `Array<T>` 等价，常用于短写 |
| `{` `...` `}`    | 对象字面量，字段名来自描述行 |
| `Pair` `<` `T` `>` | 二元组，转换为 `{ key: string, val: T }`，常用于 `key:value` 形式数据 |
| `Map` `<` `T` `>` | 逻辑 Map（本质是 `Pair<T>[]`），序列化时可据上下文转为对象或数组 |
| `A` `|` `B`      | 联合类型 |
| `T` `?`          | 可选类型 |
| `$oneof` `[` `...` `]` | 限制枚举值的联合 |

> **Pair / Map**：输入通常写成 `key:value` 形式字符串。Pair 代表单条键值，Map 则表示键值对数组，可在序列化阶段转换为对象或保持数组结构。

## 装饰器

装饰器写在结构体符号之前，占用独立单元格：
- `$strict` `[` ... `]`：强制数组大小与声明一致
- `$ghost` `{ ... }`：生成 Schema，但在导出数据时忽略对应字段
- `$ghost{` ... `}`：常用于为数组元素中的字段提供补充 Schema
- 其他装饰器由 `@khgame/schema` 解析，遵循相同的 token 拆分规则

## 描述行与数据行

- 描述行（标记行下一行）为每列提供字段名和注释。
- 数据行从标记行下**两行**开始，`tableEnsureRows` 会剔除全空行，`tableConvert` 依据 `markCols` 和 `getValue` 还原每行数据。
- 字符串类型列若单元格为空，会在转换阶段标准化为 `''`，避免 `string required` 报错；其他类型需保证符合声明。

示例（节选）：
```
A: @     B: uint      C: string      D: $strict [ { tid:uint; num:float } ]  E: Array<Pair<uint>>  ...
A: id    B: level     C: name        D: product                            E: rewards             ...
001      1            farm           [{tid:1000001,num:1}]                 [ [1,2] ]             ...
001      2            farm           [{tid:1000001,num:2}]                 [ [1,3] ]             ...
```

`...` 表示该工作表还可以追加更多列，例如资源成本 `Map<uint>`、嵌套数组 `[` `[` `int` ...，所有列都会参与 Schema 解析与数据生成。

## Schema 与序列化

- `tableSchema` 调用 `@khgame/schema` 将 `markList` 解析为 AST，生成 TS 接口或上下文信息（枚举、联合等）。
- `tsInterfaceSerializer`、`tsSerializer`、`jsonSerializer` 等会使用 Schema 和数据生成目标产物；接口名称通过描述行和 `makeInterfaceName` 计算。

## 数据转换与策略

- `tableConvert` 会基于 Schema 生成 `convert = { tids, result, collisions }`：
  - `tids`：按 `@` 列拼接出的主键
  - `result`：`tid -> 行数据` 映射
  - `collisions`：TID 冲突时记录首条和新条数据
- 冲突策略（`context.policy.tidConflict`）：
  - `error`（默认）抛错
  - `overwrite` 用后者覆盖前者
  - `ignore` 丢弃后者
  - `merge` 深合并对象
- CLI `--strict` 会强制 `error` 策略，避免静默覆盖。

## 产出稳定性

- 所有序列化器会在输出前对 `result` 的键排序，保证重复构建的产物差异最小化。

更多：见 [插件与扩展点](plugins.md) · [序列化器与上下文](serializers.md)。
