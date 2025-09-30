# Arcane Depths 游戏设计稿

> 目标：提供一个由 Excel 表驱动的“战术 Roguelike + 基地经营”完整体验示例，使 `tables` 的 Schema、插件、jsonx 协议等能力在真实复杂度下得到展示。

## 1. 游戏定位
- 类型：回合制战术地牢探险 + 周目制基地经营。
- 核心感受：在有限资源与不确定事件之间做策略抉择，通过逐层探索与阵容塑造完成通关，并持续扩建基地解锁更多构筑。
- 会话长度：一次周目 25~35 分钟，完整章节 3~4 层。

## 2. 主要循环
### 2.1 宏观循环（基地）
1. 回收上一次周目的资源与遗物。
2. 升级设施 / 解锁职业 / 研究被动。
3. 为下一次周目组建队伍并携带遗物进入地牢。

### 2.2 周目循环（地牢）
1. 玩家从章节入口进入，获得章节特有的被动效果。
2. 按层推进：在地图上选择下一节点类型 → 触发战斗或事件 → 获得掉落或惩罚。
3. 累积“奥能”资源，用于周目内临时升级或战斗中驱动技能。
4. 击败层末 Boss 后进入下一层；若全队战败则保留部分资源返回基地。

### 2.3 战斗循环（遭遇）
1. 战前从房间模板读取敌人编成、地形、特殊规则。
2. 回合内按“我方全体 → 敌方全体”排序执行，技能消耗能量并触发连携。
3. 结算状态（减益/增益）、遗物触发、掉落表。

## 3. 章节与地图
- 章节数量：首批 3 个（余烬裂隙、蔓生穹顶、星界熔炉）。
- 每章 3 层：前两层为随机节点，第三层固定 Boss 战。
- 节点类型：战斗、精英、事件、商人、休整、Boss。
- 地图生成：
  - `map_templates.xlsx`：每章/层定义 12~16 个节点，按“列”形成路径分支。
  - 字段示例：`chapterId`, `layer`, `nodeIndex`, `roomType`, `edgeLeft`, `edgeRight`, `weightModifier`。
  - `edgeLeft/edgeRight` 使用 `uint?` 引用上一层节点，实现路径可视化。

## 4. 队伍与职业
- 槽位：1 名先锋、1 名咒术师、1 名远程支援、1 名自由位。
- 职业属性：基础 HP/ATK/DEF/SPD、能量回复、专属装备槽。
- 英雄实例：每个职业 3 名英雄，拥有初始技能组、特质组合、喜好遗物。
- 特质：
  - `traits`: `$strict [ { id: uint; tier: uint; value: float } ]`
  - 与遗物、技能产生条件触发（例如“生命低于 30% 时获得护盾”）。

## 5. 技能系统
- 技能分类：主动、反应、极限。
- 关键字段：`cost`, `cooldown`, `targeting`, `formulaId`, `effects`, `tags`。
- 公式引用 `context.Enums.DamageFormula`，由前端解析数值表达式。
- 连携技能：
  - `skill_links.xlsx` 中描述触发条件（如 `Condition: enemyStatus = Frozen`）与执行序列（多个技能片段 ID）。
  - 序列条目使用 `$strict [ { order: uint; skillId: uint; chance: float } ]`。

## 6. 敌人与 AI
- 敌人分类：族群（Aberrant、Cultist、Construct）、稀有度（Normal/Elite/Boss）。
- 关键字段：`baseStats`, `resistance`, `lootTableId`, `behaviorProfile`。
- 行为表 `enemy_ai.xlsx`：
  - `enemyId` → `$strict [ { priority: uint; condition: Enum.BehaviorCondition; action: Enum.BehaviorAction; params: string } ]`
  - 条件示例：`OnAllyDown`, `OnPlayerHeal`, `HpBelow50`。
  - 动作指向另一个效果表，可在后续扩展。

## 7. 遗物与装备
- 遗物分普通/稀有/传说三档；可配置：
  - 被动效果（持续 buff）、触发效果（条件生效）、绑定职业增益。
- 装备以蓝图形式存在，需在基地铸造：
  - `upgradePath`: `$strict [ { level: uint; cost: { resource: Enum.ResourceType; amount: uint }; bonuses: [string] } ]`
  - 可覆盖原有词缀或追加新效果。

## 8. 事件与剧情
- 事件类型：剧情分支、资源赌博、风险/回报、NPC 解锁。
- 事件节点包含：
  - `options`: `$strict [ { textId: string; requirement: { type: Enum.RequirementType; value: any }?; outcome: { reward: { type: Enum.RewardType; value: any }?; penalty: { type: Enum.PenaltyType; value: any }?; stateChange: string? } ]`
  - `followUps`: `[uint]` 指向后续事件 ID，实现链式剧情。
- 支持“成功率”字段，通过 `uint` + `float` 组合实现，数值由后端根据英雄属性计算。

## 9. 资源经济
- 资源：
  - `Arcane`: 周目内技能增强。
  - `Crystal`: 周目结算后回收，用于基地升级。
  - `Provision`: 地牢内商人交易。
- `economy.xlsx` 定义各资源获取/消耗曲线：`curve` 字段为 `[{ stage:int; reward:int }]`。

## 10. 基地设施与研究
- 设施分类：营地（强化队伍）、工坊（装备制作）、图书馆（技能研究）、方尖塔（遗物净化）。
- 每个设施 5 级，提供被动或主动效果。
- 研究树：`research.xlsx` 定义 DAG，字段：`parentIds`, `unlockCost`, `rewardType`, `rewardValue`。
- 研究奖励可解锁新职业、事件或提高资源上限。

## 11. 任务与成就
- `tasks.xlsx`：章节内动态任务（例如“在 6 回合内击败 Boss”）。
- `achievements.xlsx`：账号级目标，触发来自任务/事件/战斗统计。
- 奖励字段指向资源、遗物或永久被动。

## 12. 文本与本地化
- 所有可见文本使用 `textId` 引用外部文案表（未来可复用 `docs/examples/localization.md` 中的模式）。
- 表内保存行为参数与结构，文案单独维护以便多语言。

## 13. 数据表汇总
详见同级目录 README 中的表格规划，后续 Excel 将按照上述字段落地。

## 14. 实施建议
1. 先完成 `context.Enums.json` 定义，确保所有枚举早期敲定。
2. 搭建 `serialize.js`，串联 `json/js/ts/ts-interface/jsonx` 输出。
3. 使用 `npm run smoke` 执行快照测试，逐步导入 Excel。
4. 针对关键数值（例如 Boss 战）编写 Jest 用例验证 JSON 结构。

该设计稿为后续资产填充的落实依据，确保示例既覆盖 `tables` 功能点，又具有可解释的游戏深度。
