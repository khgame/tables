# Hint Metadata Plan

## 背景

- 解析流程由 `@khgame/schema` 负责: Excel 类型标记 → SDM/TDM → `schemaModel` TypeNode。
- 当前 `convertTNode` 折叠所有整数别名为 `PrimitiveType { kind: 'primitive', name: 'number' }`，未保留原始标签语义。
- `normalizePrimitive` 预留了 `node.hint === 'int' | 'bigint'` 的处理分支，但默认流程没有设置 `hint`，导致各种依赖原始标签进一步处理细节的能力未实现，例如自动拦截溢出或保留大整数精度。

## 术语

- **Numeric Alias**：Excel 类型行上写下的具体标签，如 `int64`、`uint32`，来源于 `@khgame/schema/lib/constant.js::AliasTable`。
- **HintMeta.strategyHint**：策略指示器（strategy indicator），`schemaModel` 在基础类型上保留的数值处理提示，可取 `int`（安全整数校验）、`bigint`（字符串化保存精度）等。
- **NumericFlavor**：对 Numeric Alias 的语义归类，例如 `int64` → `bigint`, `int16` → `int`。
- **Metadata Spine**：贯穿 parse → schemaModel → convert 的数据语义脊柱，确保原始标签到最终归一化逻辑的一致性。

## 现状评估

1. **原始标签丢失**：`convertTNode` 不使用 `node.rawName`，TypeNode 只有 `name` 字段。
2. **HintMeta 未挂接**：`normalizePrimitive` 的安全整数与大整数处理无法生效，所有依赖原始标签的细粒度策略（溢出防护、精度保留等）统统缺席。
3. **编码重复风险**：序列化层如需区分 `int` 与 `int64` 时，只能重新解析别名，缺乏单一来源。

## 改进目标

- 在 TypeNode 中引入元数据，保留 Numeric Alias 和 NumericFlavor。
- 让 `normalizePrimitive` 基于元数据工作，实现：
  - 普通 `int` 溢出 → 精准报错 + 定位。
  - `int64` / `uint64` → 字符串输出，保持精度。
- 为后续扩展（例如 decimal/fixed/percentage）预留统一接口。

## 设计方案

1. **HintMeta 抽象层 (`src/serializer/hintmeta/`)**
   - 新增 `hintmeta/hintMetadata.ts`：
     - `type StrategyHint = 'int' | 'bigint' | 'decimal' | 'float';`
     - `type NumericFlavor = 'int' | 'int64' | 'uint' | 'uint64' | 'float' | 'ufloat';`
     - `resolveHintMetadata(rawName: string, mainType: string)` → `{ strategyHint?: StrategyHint; flavor?: NumericFlavor; sourceAlias?: string; extensions?: Record<string, any> }`。
     - 依赖 `AliasTable`，维护 `alias → flavor` 的映射。

2. **SchemaModel 集成 (`convertTNode`)**
   - 构建基础 `PrimitiveType` 后调用 `resolveHintMetadata`。
   - 将返回值合并到 `PrimitiveType`
     ```ts
     const hintMeta = resolveHintMetadata(node.rawName, node.tName)
     const primitive: PrimitiveType = {
       kind: 'primitive',
       name: 'number',
       hintMeta
     }
     ```
   - 非数值类型维持原状。

3. **归一化策略 (`normalizePrimitive`)**
   - 读取 `hintMeta.strategyHint`：
     - `'int'` → 使用 `Number.isSafeInteger` 校验，并在错误信息中包含 `sourceAlias`。
     - `'bigint'` → 输出 `String(value)`。
   - 保留现有默认行为作为兜底。

4. **Serializer 扩展**
   - 允许 TS Interface 渲染函数读取 `hintMeta.strategyHint`，对 `bigint` 输出 `string`（可作为后续迭代）。
   - 在 TS/Go/C# 生成物中引入 `BigIntStr` 类型别名（`type BigIntStr = string` / `using BigIntStr = string`），并预留扩展点提供 `toBigInt()`、`.Int64()` 等转换辅助，降低业务接入成本。

5. **测试 / 样例**
   - 添加含 `int64`、`uint64`、普通 `int` 的样例表，验证：
     - `int64` 转字符串。
     - 超范围 `int` 报错。
     - 正常范围数据不受影响。

## 阶段划分

| 阶段 | 内容 | 交付物 |
| --- | --- | --- |
| 1 | 引入 hintmeta 模块与 `resolveHintMetadata` | `src/serializer/hintmeta/hintMetadata.ts` |
| 2 | 更新 `schemaModel.convertTNode` 组装 HintMeta | `PrimitiveType` 具备 `hintMeta`（strategyHint/sourceAlias/flavor） |
| 3 | 强化 `normalizePrimitive` | 精准报错/字符串化逻辑上线 |
| 4 | （可选）Serializer 调整与样例测试 | 新增覆盖用例 |

## 风险与缓解

- **冒泡溢出检测**：若存在第三方自行构造的 TypeNode，应提供向后兼容，`hintMeta` 可选。
- **枚举映射一致性**：`AliasTable` 更新需同步更新 `hintMetadata` 的映射测试。
- **序列化差异**：`bigint` 输出字符串可能影响已有消费者，需要在发布说明中明确。
