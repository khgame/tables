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

- Schema 构建：`buildSchemaModel` (`src/serializer/core/schemaModel.ts`) 将 SDM/TDM 节点翻译成统一的 `TypeNode`。`convertTNode` 会把 `int`/`uint` 等数值类型折叠成 `PrimitiveType { kind: 'primitive', name: 'number' }`，并依据 `node.rawName` 组装 `hintMeta`（strategyHint/sourceAlias/flavor），为溢出防护、大整数精度处理乃至自定义语义扩展提供锚点。`test/unit/schemaModel.test.ts` 与 `test/unit/hintMetadata.test.ts` 持续校验该接线。
- 数值归一化：`normalizePrimitive` (`src/plugin/convert.ts`) 读取 `node.hintMeta.strategyHint`。约定 `'int'` 时执行安全整数检验，不安全就抛错；`'bigint'` 时统一输出字符串以保留精度。它仍是所有数值校验的最终关卡，若未启用 hintmeta 则回退到默认逻辑；`test/unit/convert.hintmeta.test.ts` 演示了字符串化与溢出报错路径。
- 类型别名：所有 Excel 类型标记先通过 `@khgame/schema` 的别名表归一（`node_modules/@khgame/schema/lib/constant.js`）。例如 `int8/int16/int32/int64/long` 都映射到主类型 `int`，`uint64/ulong` 映射到 `uint`。
- 枚举 alias 扩展：context 枚举现已支持“字面量 + 引用”混合写法。枚举值既可以是字符串/数组（兼容旧版对象映射），也可以是包含 `ref` 字段的对象（或在对象风格枚举中通过 `__refs`/`$refs` 追加）。`ref` 接受 `table#field` 或 `{ table, field }`，并可指定 `filter`、`nameField`、`valueField`、`descriptionField`、`transform/prefix/suffix` 等参数。加载阶段会读取目标表的 alias 列（经 `tableConvert` 校验）并展开为枚举项，生成的枚举随 `enum<...>` 校验器自动保持与 alias 源数据一致。

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
