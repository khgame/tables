# Arcane Depths 完整体验样例

`example/game_04_arcane_depths/` 将展示一款“战术 Roguelike + 基地经营”混合玩法的完整导表案例，覆盖读取、解析、转换、序列化的全链路。核心目标：让表格配置即可驱动一个可循环游玩的体验，突出 `tables` 在多表引用、严格 Schema、上下文枚举与协议化产出的能力。

## 核心愿景

- **多段旅程，周目驱动**：玩家反复深入随机生成的地底城，收集遗物、拯救 NPC，并把资源带回地面。
- **战术回合战斗**：小队成员拥有不同职业、技能与连携机制，敌方 AI 拥有行为权重与触发条件。
- **基地扩建与长期成长**：地表营地解锁新职业、装备蓝图与被动加成，保持长期动机。
- **丰富事件与选择**：房间、事件、首领、剧情片段均通过表格驱动，可轻易扩展或热修。

## 玩家循环

### 宏观循环（Meta Loop）
1. 在基地选择章节与难度，编制队伍、配置核心技能与遗物。
2. 消耗资源升级设施/职业，解锁新的构筑选项。
3. 根据上次周目的战果调整策略，再次进入地底城。

### 周目循环（Run Loop）
1. 固定章节引导进入对应地牢模板，RNG 生成房间图与事件种子。
2. 玩家在每个节点选择下一房间类型（战斗 / 事件 / 商人 / Boss）。
3. 每遭遇一个房间，结算战斗或事件奖励、遗物、剧情推进。
4. 到达章节 Boss，胜利则结算周目奖励，失败则带有限资源返回基地。

### 房间循环（Encounter Loop）
1. 战斗陈列敌方编成、地形修饰、特殊规则。
2. 玩家轮流指挥队员释放技能、移动、协同。
3. 战斗后根据掉落表给予战利品或负面状态。
4. 事件房间根据选项与判定表派发奖励/惩罚，并可能修改后续房间池。

## 系统模块与导表要点

### 章节与地图模板
- 定义章节列表、章节描述、起始资源、默认随机种子策略。
- 地图格子按“层 / 位置 / 分支”三字段生成 ID，配置房间类型分布、Boss 出场层数及背景资源。
- 通过 `@khgame/tables` 的 `tableConvert` 得到 `convert.result` 中的嵌套地图结构，供前端直接渲染。

### 队伍与英雄体系
- 职业（Vanguard、Mystic、Gunner…）定义基础属性、成长系数、装备槽、连携触发。
- 英雄实例通过“职业段 + 序号”组合 TID，引用职业、技能与初始装备。
- 英雄还可携带 `traits`（特质）数组，以 `$strict [ { id:uint; value:int } ]` 表示。

### 技能与连携
- 技能表描述目标类型、耗能、数值公式、附加效果 ID。
- 连携技能表定义触发条件（如“敌人处于易伤”）与执行序列。
- 数值公式存储为可配置表达式或引用上下文枚举（如 `DamageFormula.Basic`）。

### 敌人与 AI
- 敌人分类：普通、精英、Boss；TID 按“家族 / 子类 / 序号”组合。
- 行为策略表：为每个敌人配置若干行为节点（`weight`, `condition`, `action`）。
- AI 条件引用事件枚举（如 `OnTurnStart`, `OnAllyDown`），动作引用效果表。

### 房间与事件
- 房间模板表定义房间类型、环境效果、可选事件池、奖励权重。
- 事件表以 `@/@` 生成 ID，描述剧情段、选项、条件、奖励/惩罚脚本。
- 选项使用嵌套对象：`$ghost { requirement: string; reward: { type: Enum.RewardType; value: any } }`，空值时自动忽略。

### 遗物与装备
- 遗物按稀有度拆分子表，共享 `RelicTrait` 枚举；可附带解锁条件与与英雄特质的相互作用。
- 装备蓝图表记录升级树，使用 Nested Array 描述“素材配方 + 属性词缀列表”。

### 资源与经济
- 资源种类：灵能（meta）、晶石（周目）、补给（即时）。
- 经济表定义产出与消耗曲线；跨表引用章节、房间、基地设施。
- 通过 `context.meta.json` 声明资源枚举，供 TS 序列化直接引用。

### 基地设施与研究
- 设施表定义等级、解锁条件、效果（如“解锁新职业”、“提升掉落品质”）。
- 研究树以 Parent/Child 指针构成 DAG，用 `$strict [ uint ]` 列确保引用有效。
- 研究奖励可能添加被动技能、修改事件池或提升资源上限。

### 挑战任务与成就
- 任务表：章节/周目维度的动态目标（X 回合内通关等），可配置奖励与追踪条件。
- 成就表：账号层面长期目标，引用任务或事件触发器，支持 JSONX 协议输出给运营后台。

## 表格规划

| 表格 | 说明 | 关键字段 | TID 结构 |
| --- | --- | --- | --- |
| `chapters.xlsx` | 章节元信息、剧情摘要、默认参数 | `chapterId`, `difficulty`, `seedPolicy` | `10CCDNN`（C=章节，D=难度，N=序号） |
| `map_templates.xlsx` | 层级/房间布局模板、房间池引用 | `chapterId`, `layer`, `node`, `roomType` | `11CLLNN` |
| `heroes.xlsx` | 英雄实例、特质、初始构筑 | `heroId`, `classId`, `startingSkills` | `20CCNNN` |
| `classes.xlsx` | 职业定义、成长、技能槽 | `classId`, `baseStats`, `gearSlots` | `21CC000` |
| `skills.xlsx` | 主动/被动技能、公式、特效 | `skillId`, `type`, `formula`, `effects` | `30TTNNN` |
| `skill_links.xlsx` | 连携触发条件与效果链 | `linkId`, `trigger`, `sequence` | `31TTNN` |
| `enemies.xlsx` | 敌人与属性、战利品表引用 | `enemyId`, `family`, `lootTable` | `40FFNNN` |
| `enemy_ai.xlsx` | 行为节点、条件、动作指针 | `enemyId`, `behaviorOrder`, `condition`, `action` | `41FFNN` |
| `rooms.xlsx` | 房间模板、环境、事件池 | `roomId`, `type`, `eventPool`, `rewards` | `50RTNN` |
| `events.xlsx` | 事件节点、选项、文本 ID | `eventId`, `chapterId`, `options` | `51EENN` |
| `relics.xlsx` | 遗物属性、稀有度、触发逻辑 | `relicId`, `rarity`, `effects` | `60RRNN` |
| `equipment.xlsx` | 装备蓝图、升级路线、词缀 | `itemId`, `slot`, `upgradePath` | `61SSNN` |
| `facilities.xlsx` | 基地设施等级、费用与效果 | `facilityId`, `level`, `unlock`, `effect` | `70FFLL` |
| `research.xlsx` | 研究节点、前置关系、奖励 | `researchId`, `parent`, `reward` | `71RRNN` |
| `economy.xlsx` | 资源出入、数值曲线 | `economyId`, `resource`, `curve` | `80ECNN` |
| `tasks.xlsx` | 挑战任务、条件、奖励 | `taskId`, `scope`, `condition`, `reward` | `90TKNN` |
| `achievements.xlsx` | 成就条件、展示、奖励 | `achievementId`, `trigger`, `reward` | `91ACNN` |

> 可根据实际实现拆分更多细表，例如文本本地化、掉落明细、地形效果等。

## 枚举与上下文规划

- `context.meta.json`：声明需要导出的上下文：`meta.exports.enum = ['Enums']`。
- `context.Enums.json` 包含：
  - `ResourceType`（Arcane, Crystal, Provision）
  - `RoomType`（Combat, Elite, Event, Merchant, Boss, Rest）
  - `SkillTag`（Melee, Ranged, Spell, Support, Control）
  - `HeroClass`、`HeroRole`、`TraitType`
  - `EnemyFamily`、`BehaviorCondition`、`BehaviorAction`
  - `RewardType`、`FacilityType`

TS/TS-Interface 序列化器会读取这些上下文，生成可直接引用的 `Enum` 常量，确保跨文件的类型安全。

## 序列化与协议

- `serialize.js`：示范一次性生成 JSON/JS/TS/TS-Interface，并使用 `jsonxSerializer` 产出带协议头的监控/运营专用 JSON。
- CLI 示例：
  ```bash
  npm run build
  node example/game_04_arcane_depths/serialize.js
  # 或
  npx tables -i ./example/game_04_arcane_depths -o ./example/game_04_arcane_depths/out -f jsonx
  ```
- 输出中 `convert.collisions` 字段可用于检测 TID 冲突，`jsonx` 额外包含 `protocol` 与 `source` 头部，便于后端聚合。

## 扩展思路

- 新增章节或事件只需衍生 Excel 行，重跑 `serialize` 即可；Schema 具约束作用，避免漏字段或类型错误。
- 可进一步接入自动化测试（`test/e2e/arcane-depths.generate.test.ts`）验证生成的 JSON 是否满足业务断言。
- 若需多语言文本，可与现有 `docs/examples/localization.md` 案例组合，使用 `makeCamelName` 帮助生成键名。

以上设计将作为後续构建示例资产与脚本的蓝本，确保“完整游戏体验”由表格驱动、易于扩展，并突出 `tables` 的协议化与插件化优势。
