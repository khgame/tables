# 最佳实践

## 跨表引用（外键关联）

### tid 类型说明

**`tid` 是系统内置的数值类型，专门用于表示表格主键（Table ID）。**

- `tid` 等同于 `uint`（无符号整数），但语义上明确表示这是一个表格 ID
- `tid` 类型的值必须是**纯数字**（如 `40060001`），不能是字符串（如 `"enemy:shambler"`）
- 在类型系统中，`tid` 与 `uint` 可以互换使用，但推荐用 `tid` 表达引用语义

详见：[tid-rules 规范](https://github.com/khgame/tid-rules)

### 核心原则

**表之间的引用必须使用数字 ID（tid），而不是名称或其他字符串标识符。**

### ✅ 正确做法

在需要引用其他表的字段中，使用 `tid` 类型并填写数字 ID：

```
# enemies.xlsx
@      @         @       string          ...
sector category  serial  name            ...
40     06        0001    Rift Shambler   ...  ← 生成 tid: 40060001
40     06        0002    Choir Acolyte   ...  ← 生成 tid: 40060002
```

```
# waves.xlsx
@      @         @       uint       tid        ...
sector category  serial  timestamp  enemyId    ...
60     08        0001    45         40060001   ...  ← 引用 enemies 表的 40060001
60     08        0002    95         40060002   ...  ← 引用 enemies 表的 40060002
```

**关键点**：
- `enemyId` 字段的类型声明为 `tid`（而不是 `string`）
- 数据行填写数字 ID（`40060001`），而不是名称（`Rift Shambler`）或自定义标识符（`enemy:shambler`）

### ❌ 错误做法

```
# waves.xlsx - 错误示例
@      @         @       uint       string         ...
sector category  serial  timestamp  enemyId        ...
60     08        0001    45         enemy:shambler ...  ← 使用字符串引用
60     08        0002    95         Choir Acolyte  ...  ← 使用名称引用
```

**问题**：
- 运行时无法通过字符串找到对应的实体
- 缺少类型约束，容易出现拼写错误
- 数据迁移时难以追踪引用关系

### 多表引用示例

参考 `example/game_01_minirpg/` 中的实践：

```javascript
// heroes.xlsx
['@', '@', '@', 'uint', 'string', ..., 'tid', 'tid', 'tid', 'tid', 'tid', ...]
['categoryCode', 'subtypeCode', 'sequenceCode', 'sequence', 'name', ...,
 'signatureItem', 'primarySkill', 'supportSkill', 'ultimateSkill', 'unlockStage', ...]
['10', '00', '0001', 1, 'Aerin Frostshield', ...,
 30000004, 20001001, 20002001, 20006001, 40000001, ...]
//  ↑ 引用 items      ↑ 引用 skills                 ↑ 引用 stages
```

```javascript
// stages.xlsx
['@', '@', '@', ..., 'tid', 'tid', 'tid', ..., 'tid', ...]
['categoryCode', 'routeCode', 'sequenceCode', ...,
 'bossSkill', 'bossEnemy', 'unlockHero', ..., 'prerequisiteStage', ...]
['40', '01', '0001', ..., 20005001, 50000001, 10000001, ..., 0, ...]
//                          ↑ skills ↑ enemies ↑ heroes      ↑ 0 表示无前置
```

### tid 类型的特性

- **自动验证**：序列化时可以检测引用的 ID 是否存在（需要加载完整上下文）
- **类型安全**：在 TypeScript 输出中会生成明确的类型引用
- **易于重构**：修改 ID 规则时，所有引用关系都是显式的数字，便于批量替换

### 可选引用

如果某个引用字段可以为空（例如前置关卡可能不存在），使用 `tid?`：

```
@      @         @       tid?                ...
sector category  serial  prerequisiteStage   ...
40     01        0001    0                   ...  ← 0 或空表示无前置
40     01        0002    40010001            ...  ← 引用前一关卡
```

在代码中检查时：
```typescript
if (stage.prerequisiteStage && stage.prerequisiteStage !== 0) {
  // 有前置关卡
}
```

### 命名约定

为了提高可读性，引用字段建议使用统一的命名后缀：

- `xxxId`: 单个引用（如 `enemyId`, `weaponId`, `bossEnemy`）
- `xxxIds`: 多个引用数组（如 `rewardItemIds: tid[]`）
- `xxxMap`: 引用到数值的映射（如 `costMap: Map<tid, uint>`）

### 调试技巧

当遇到"找不到引用"的问题时：

1. **检查类型声明**：确保引用字段声明为 `tid`（不是 `string` 或 `uint`）
2. **检查数值格式**：确保填写的是完整的数字 ID
3. **验证 ID 存在性**：检查被引用的表中是否真的存在该 ID
4. **查看序列化输出**：在生成的 JSON 中确认 `tids` 数组包含预期的 ID

```bash
# 快速验证 tids
cat out/enemies.json | jq '.tids'
# 验证某个引用是否存在
cat out/waves.json | jq '.result."60080001".enemyId'
cat out/enemies.json | jq '.result."40060001"'
```

## ID 规划

### 分段组合原则

使用多段 `@` 列组合成有意义的 ID：

```
@      @         @
sector category  serial
10     01        0001    → 生成 tid: 10010001
```

**优势**：
- 第一段标识大类（10=英雄，20=技能，30=物品...）
- 第二段标识子类（01=战士，02=法师...）
- 第三段为流水号
- ID 本身包含结构信息，便于人工识别和调试

### ID 段位规划建议

根据预期规模合理分配位数：

```
# 小型项目（千级）
@    @   @      → CCSSNN (6位)
10   01  01     → 100101

# 中型项目（万级）
@    @    @     → CCSSSNNN (8位)
10   001  001   → 10001001

# 大型项目（十万级）
@     @    @    → CCCSSNNNN (10位)
100   01   0001 → 100010001
```

### 0 值语义

约定 `0` 作为特殊值：
- 在可选引用中表示"无引用"
- 避免使用 `0` 作为有效实体的 ID
- 代码中通过 `if (id)` 或 `if (id !== 0)` 简化判断

## 数据完整性

### 冲突检测

始终使用 `--strict` 模式进行构建：

```bash
tables -i ./src -o ./out -f json --strict
```

这会在 TID 冲突时立即报错，避免数据被静默覆盖。

### 单元测试

建议为关键的引用关系编写验证脚本：

```javascript
const waves = require('./out/waves.json');
const enemies = require('./out/enemies.json');

const enemyIds = new Set(Object.keys(enemies.result));

for (const [waveId, wave] of Object.entries(waves.result)) {
  const enemyId = String(wave.enemyId);
  if (!enemyIds.has(enemyId)) {
    throw new Error(`Wave ${waveId} references invalid enemy ${enemyId}`);
  }
}
console.log('✓ All wave references are valid');
```

### 版本控制

- 将 `_rebuild_data.js` 脚本纳入版本控制
- Excel 文件也建议纳入版本控制（便于追溯数据变更）
- `out/` 目录根据需要决定是否提交（建议至少提交一份作为基准）

## 更多参考

- [概念与约定](/guide/concepts) - 类型系统与 Schema
- [Mini RPG 示例](/demos/minirpg) - 完整的多表引用实践
- [CLI 文档](/reference/cli) - 构建选项与严格模式
