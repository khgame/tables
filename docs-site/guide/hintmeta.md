# 数值标签语义（Hint Metadata）

本模块负责将 Excel 类型标签的语义贯穿在整个表格转换流水线中，确保所有依赖原始标签的精细化处理（安全整数校验、大整数精度保留、未来扩展的特殊数值语法等）都可以落到统一的元数据骨干上。

## 校验形态对比

- **启用 HintMeta 之前**：Excel 类型别名在 `@khgame/schema` 阶段被折叠为主类型，`schemaModel` 只保留 `primitive.name = 'number'`。`normalizePrimitive` 仅依赖值本身判断，不知道列的原始标签，因此不会对 `int64` 做精度兜底，也无法给出“超出安全整数”的明确定位。
- **启用 HintMeta 之后**：别名信息沿着 HintMeta 结构传递，校验层读取 `strategyHint` 并执行对应策略：普通 `int` 做安全整数检查，`int64/uint64` 直接字符串化保留精度，出错时带上 `sourceAlias` 与表格路径，帮助快速定位。

## 功能概览

- **别名解析**：`@khgame/schema` 先将 `int64`、`uint32` 等别名归一为主类型，`schemaModel` 在此基础上通过 `resolveHintMetadata` 记录 `sourceAlias` 与策略。
- **HintMeta 结构**：`PrimitiveType` 现包含 `strategyHint`、`sourceAlias`、`flavor` 等字段，由 `src/serializer/hintmeta/hintMetadata.ts` 提供的映射函数生成，可扩展到 decimal、timestamp 等语义。
- **归一化策略**：`normalizePrimitive` 读取 `hintMeta.strategyHint` 采取不同策略：
  - `'int'` 时执行 `Number.isSafeInteger` 校验，超过范围抛出带行列路径的错误。
  - `'bigint'` 时将值序列化为字符串，确保 `int64/uint64` 等保持精度。
- **序列化友好**：后续序列化器可以读取 `hintMeta.strategyHint` 决定输出类型（例如 `ts-interface` 将 `bigint` 字段声明为 `string`）。

## 与校验器的关系

- HintMeta 负责把 Excel 别名的语义从解析阶段携带到转换阶段，本身不做硬性校验。
- 强制约束仍由 `src/plugin/convert.ts::normalizePrimitive` 执行：它读取 `PrimitiveType.hintMeta.strategyHint` 决定是否触发安全整数检查或字符串化。
- 若某列未生成 HintMeta，`normalizePrimitive` 会退回到默认行为，因此 HintMeta 的引入是增量增强，对现有表格保持兼容。
- 验证接线是否成功的手段：检查 `schemaModel` 生成的 `PrimitiveType` 是否含有 `hintMeta` 字段，可运行 `npm run test -- schemaModel` 与 `npm run test -- convert.hintmeta` 观察断言，也可以执行 `npm run smoke` 验证示例表格的字符串化输出。

## 评价指标

- **语义清晰度**：Alias → Flavor → Strategy 的映射需一目了然，字段命名与注释应能指导后续扩展（decimal/timestamp 等）。
- **覆盖完整性**：常用数值别名都应映射到策略，并通过单测/样例覆盖正确行为。
- **可扩展性**：新增策略时仅需在 HintMeta 映射与 `normalizePrimitive` 增补分支，无需修改流水线骨架。
- **可观测性**：报错信息包含 `sourceAlias` 与路径，配合示例表格或 `npm run smoke` 便于验证 HintMeta 是否生效。

## 流程对齐

```
Excel 类型行 (int64)
        │
        ▼
@khgame/schema AliasTable → 主类型 uint
        │
        ▼
resolveHintMetadata(rawName='int64')
        │  └─ 返回 { strategyHint: 'bigint', sourceAlias: 'int64', flavor: 'uint64' }
        ▼
PrimitiveType { kind: 'primitive', name: 'number', hintMeta: { strategyHint: 'bigint', ... } }
        │
        ▼
normalizePrimitive → 字符串化输出 / 安全整数校验
```

## 名词解释

| 名称 | 说明 |
| --- | --- |
| Numeric Alias | Excel 中书写的原始标签，例如 `int64`、`uint16`。|
| NumericFlavor | 对别名语义的归类，用于决定 hint 策略，如 `int64` → `uint64`。|
| StrategyHint | HintMeta 中的策略指示器（strategy indicator），当前支持 `int`（安全整数校验）与 `bigint`（字符串化）。|
| Metadata Spine | 贯穿 parse → schemaModel → convert 的语义脊柱，保证策略一致。|

## 项目现状

- `src/serializer/hintmeta/hintMetadata.ts` 维护别名 → `strategyHint`/`flavor` 映射，对应测试位于 `test/unit/hintMetadata.test.ts`。
- `schemaModel.convertTNode` 在生成 `PrimitiveType` 时注入 `hintMeta.strategyHint` 与 `sourceAlias`，覆盖见 `test/unit/schemaModel.test.ts`。
- `normalizePrimitive` 的错误信息会携带 `sourceAlias` 与数据路径；`test/unit/convert.hintmeta.test.ts` 验证字符串化与溢出报错逻辑。

## 重构计划回顾

实施过程遵循内部的《Hint Metadata Plan》，详见 `src/serializer/hintmeta/plan-hintmeta.md`。
