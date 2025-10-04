# 分层与语义（Architecture）

本项目采用“读取 -> 解析 -> 转换 -> 序列化”的分层架构：

- 读取（Reader）
  - 文件到内部 `Table`：`src/utils/read.ts`（基于 `xlsx`）。
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

- 自定义 Reader：替换/拓展 `readWorkBook/translateWorkBook`（CSV/Sheets 等来源）。
- 自定义 Parse/Convert 插件：与 `Table` 结构解耦，按需插拔。
- 自定义 Serializer：声明所需插件，产出任意目标语言/格式。

