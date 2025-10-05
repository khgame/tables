# 分层与语义（Architecture）

本项目采用“读取 -> 解析 -> 转换 -> 序列化”的分层架构：

- 读取（Reader）
  - 文件到内部 `Table`：`src/utils/read.ts`（基于 `xlsx`，默认支持 `.xls`/`.xlsx`/`.csv`）。
  - 产物仅包含原始单元格布局：`cols/data/getValue`。

- 解析（Parse Layer）
  - 插件集合：`parsePlugins`（`src/pipeline/layers.ts`）。
  - 包含：`rows/erows/mark/desc/schema`，将原始表头/类型标记解析为可用于后续步骤的语义信息。

- 转换（Convert Layer）
  - 插件集合：`convertPlugins`（`src/pipeline/layers.ts`）。
  - 负责根据 Schema 与数据行生成跨平台可读的结果 `{ tids, result, collisions }`。

- 序列化（Serializers）
  - 将转换结果输出为不同目标格式：`json/js/ts/ts-interface` 等。
  - 稳定性：对 `result` 的 key 做排序，保证产物稳定。

## 数据流水线细节

```markdown
Excel Sheet
    │
    ▼
readAndTranslate (src/utils/read.ts)
    │  └─ 构造 `Table`：{ cols, data, getValue }
    ▼
Parse Plugins (rows → erows → mark → desc → schema)
    │  └─ `tableSchema` 调用 `@khgame/schema.parseSchema`
    ▼
Convert Plugins (`tableConvert`)
    │  ├─ `exportJson` + `SchemaConvertor` 校验行数据
    │  ├─ `buildSchemaModel` 生成 `TypeNode` 抽象
    │  └─ `normalizeValue` / `normalizePrimitive` 归一化结果
    ▼
Serializers (json/js/ts/ts-interface/...)
```

- Schema 构建：`buildSchemaModel` (`src/serializer/core/schemaModel.ts`) 将 SDM/TDM 节点翻译成统一的 `TypeNode`。`convertTNode` 会把 `int`/`uint` 等数值类型折叠成 `PrimitiveType { kind: 'primitive', name: 'number' }`，此处可根据 `node.rawName` 写入 `hint` 等附加信息，用于后续数值策略扩展。
- 数值归一化：`normalizePrimitive` (`src/plugin/convert.ts`) 读取 `node.hint`。约定 `hint: 'int'` 时执行安全整数检验，不安全就抛错；`hint: 'bigint'` 时统一输出字符串以保留精度。默认流程未主动写入 hint，但外部插件或自定义 schema 可以在 `TypeNode` 上设置，以启用这些保护分支。
- 类型别名：所有 Excel 类型标记先通过 `@khgame/schema` 的别名表归一（`node_modules/@khgame/schema/lib/constant.js`）。例如 `int8/int16/int32/int64/long` 都映射到主类型 `int`，`uint64/ulong` 映射到 `uint`。

## 协议（Protocol）

为便于跨平台消费和版本治理，定义了可选的数据协议头（`src/core/protocol.ts`）：

```ts
export type TablesArtifact = {
  protocol: { name: 'khgame.tables', version: number }
  source: { fileName: string; sheetName: string }
  convert: { tids: string[]; result: Record<string, any>; collisions?: ... }
}
```

默认 `json/js/ts/ts-interface` 不改变现有格式；如需带协议头，使用 `jsonxSerializer`（实验性）。

## 扩展点

- 自定义 Reader：替换/拓展 `readWorkBook/translateWorkBook`（Google Sheets / 自定义 API 等来源）。
- 自定义 Parse/Convert 插件：与 `Table` 结构解耦，按需插拔。
- 自定义 Serializer：声明所需插件，产出任意目标语言/格式。
