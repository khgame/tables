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
- 数据行从标记行下**两行**开始，`tableEnsureRows` 会剔除全空行，`tableConvert` 按 `markCols` + `getValue` 还原每行数据。
- 字符串列若留空会被归一化为 `''`，避免触发 `string required`；其他类型需显式写成 `T?` 或置于 `$ghost` 结构内才能缺省。

> Parser 逻辑来自 `@khgame/schema` 的 `SDMConvertor/TemplateConvertor`（参见 `node_modules/@khgame/schema/lib/convertor/richConvertor.js`），每个 Token 必须占据独立单元格。

## 结构化表头示例

> `@khgame/schema` 在 `SDMConvertor/TemplateConvertor`（见 `node_modules/@khgame/schema/lib/convertor/richConvertor.js`）中按照 Token 顺序构建 AST，因此 Excel 表头必须逐格拆分装饰器、括号与泛型符号。

以下 Markdown 表以“行 \ 列”形式模拟 Excel。每个示例都包含标记行、字段名行以及至少两行数据，方便直观对照：

- **标记行（Mark Row）**：只写类型与装饰器（`@`、`uint`、`enum<Rarity>`、`$ghost`、`{`、`[` ...）。
- **字段名行（Desc Row）**：写业务字段名（`tid`、`name`、`weight` 等），上一行的类型会自动套用到对应列。
- **数据行**：自标记行下方两行开始，用于填写真实数据；数组/对象结构需逐列完整展开。

> 注意：`weight:uint` 之类“字段名:类型” token 不会被解析成类型；冒号会被当成普通字符。字段名仍写在字段名行，类型只写在标记行。

### 嵌套对象与可选段

| 行 \ 列 | A | B | C | D | E | F | G | H |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 标记行 | `@` | `string` | `$ghost {` | `tid` | `[` | `tid` | `]` | `}` |
| 描述行 | `tid` | `name` | `upgrade` | `to` | `dependency` | *(空)* | *(空)* | *(空)* |
| 示例 1 | `2000000` | `Farm Lv.1` | `''` | `2000001` | `''` | `''` | `''` | `''` |
| 示例 2 | `2000001` | `Farm Lv.2` | `''` | `2000002` | `''` | `2000000|2000002` | `''` | `''` |

- `$ghost { ... }` 允许在示例 1 中完全留空而不导出 `upgrade` 字段。
- `dependency` 列使用独立的 `[`、`tid`、`]` 三列构成数组，数据行按 `TemplateConvertor.validate` 的规则通过 `|` 拆分多个值。

### 严格掉落数组

| 行 \ 列 | A | B | C | D | E | F | G | H | I | J | K | L |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 标记行 | `@` | `string` | `$strict [` | `{` | `tid` | `uint` | `}` | `{` | `tid` | `uint` | `}` | `]` |
| 描述行 | `tid` | `stageName` | `dropEntries` | *(空)* | `tid` | `weight` | *(空)* | *(空)* | `tid` | `weight` | *(空)* | *(空)* |
| 示例 1 | `3001` | `Stage 1-1` | `''` | `''` | `2001` | `50` | `''` | `''` | `2002` | `50` | `''` | `''` |
| 示例 2 | `3002` | `Stage 1-2` | `''` | `''` | `2003` | `70` | `''` | `''` | `2004` | `30` | `''` | `''` |

- `$strict [` 要求数据行为定长数组；若缺乏任一元素，`SchemaConvertor` 会在构建时给出 “conversion failed”。
- 继续追加第三个掉落条目时，在 `L` 之后补 `{`、`tid`、`uint`、`}`，并保持“一列一个 Token”，最后再写 `]` 收束。

### alias 别名单列

- 当某列标记为 `alias` / `alias?` 时，tables 会为每行生成“别名 -> TID”的唯一映射；空字符串会被忽略，重复别名会在转换阶段直接抛错。
- 序列化结果会附带 `${tableName}Protocol` 常量数组、`${tableName}Repo` 仓库以及索引映射，便于通过别名或其他键值进行强类型查表。
- `alias?` 与 `alias` 行为一致，只是提示这列允许空值；实际导出时两者都会跳过空白单元格。

### Pair / Map 快写

| 行 \ 列 | A | B | C | D | E | F |
| --- | --- | --- | --- | --- | --- | --- |
| 标记行 | `@` | `string` | `Pair<uint>` | `$ghost {` | `Array<Pair<uint>>` | `}` |
| 描述行 | `tid` | `label` | `cost` | `reward` | `rewards` | *(空)* |
| 示例 1 | `5001` | `Daily Reward` | `gold:100` | `''` | `gem:1|key:2` | `''` |
| 示例 2 | `5002` | `Weekly Reward` | `gem:5` | `''` | `''` | `''` |

- `Pair<uint>` 使用 `key:value` 字符串输入，这是 `TemplateConvertor` 在 `richConvertor.js` 中的默认解析逻辑。若写入非字符串或缺少冒号，会触发 “pair value must contain ':'”。
- `Array<Pair<uint>>` 允许以 `|` 分隔多个条目；配合 `$ghost { ... }` 可以在无奖励时自动省略字段。

> 更多示例可参考仓库 `README.md` 的“类型标记速览”章节；所有结构均与上述代码路径保持一致。

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

更多：见 [插件与扩展点](/guide/plugins) · [序列化输出](/guide/serializers)。
