# game_05_neon_aberration

Neon Aberration 是一个赛博朋克 + 克苏鲁风格的生存 ARPG 配置示例，源自《阿瑞斯病毒》的玩法骨架并扩展为多表驱动的数据管线。该示例用于验证 `@khgame/tables` 在复杂系统下的 Schema/Convert 能力，覆盖战斗、求生、制作、基地管理、剧情事件与经济循环。

## 快速开始

```bash
npm run build
node example/game_05_neon_aberration/_rebuild_data.js   # 重新生成 Excel 表格
node example/game_05_neon_aberration/serialize.js        # 导出 JSON / TS / Interface / JSONX
```

生成产物位于 `example/game_05_neon_aberration/out/`，包括：

- 稳定排序的 JSON (`*.json`)
- TypeScript 版本（含接口与数据）(`*.ts`)
- 仅接口声明 (`*Interface.ts`)
- 携带协议头的 JSONX (`*.jsonx`)
- `context.ts`（由 `context.*.json` 自动汇总的枚举）
- `index.html`（静态 Demo：养成房间 / 城市行动 / 战术战斗 / 剧情交易）

## 表格概览

| 文件 | 描述 |
| ---- | ---- |
| `operators.xlsx` | 可操作角色，基础属性、特质、签名技能、负担参数 |
| `weapons.xlsx` | 武器目录（弹药类型、耐久、状态附加、标签） |
| `weapon_mods.xlsx` | 模组蓝图、稀有度、要求、兼容武器 |
| `resources.xlsx` | 物资与战利品定义，含来源与用途标签 |
| `survival_stats.xlsx` | 饥饿 / 口渴 / 体温 / 睡眠等衰减与阈值效果 |
| `gather_nodes.xlsx` | 采集点、掉落资源、刷新条件、暴露增量 |
| `craft_recipes.xlsx` | 合成配方、输入输出、耗时与设施要求 |
| `status_effects.xlsx` | 战斗状态效果、持续时间与解除手段 |
| `combat_formulas.xlsx` | 战斗公式常量（专注系数、弹药/耐久消耗、暴露增量等） |
| `enemies.xlsx` | 敌人数据（族群、数值、掉落表、阶段脚本、施加状态） |
| `loot_tables.xlsx` | 掉落权重与奖励说明 |
| `enemy_phases.xlsx` | 敌人阶段、行为脚本、阶段转换条件 |
| `missions.xlsx` | 任务模板：章节、天气、奖励、失败惩罚与解锁条件 |
| `objectives.xlsx` | 复用目标块（扫描、护送、黑客、防守等） |
| `map_tiles.xlsx` | 城市地块、危害、刷怪表、节点连线 |
| `regions.xlsx` | 区域解锁条件、环境修正 |
| `weather_cycle.xlsx` | 天气循环、持续时间与环境影响 |
| `chapters.xlsx` | 剧情章节、解锁条件与章节奖励 |
| `dialogues.xlsx` | 剧情对话节点、选项与效果 |
| `facility_upgrades.xlsx` | 基地设施分级、需求、收益、维护成本 |
| `npc_roster.xlsx` | 基地驻守人员、忠诚、特殊能力、驻扎位置 |
| `base_tasks.xlsx` | 基地排程任务、优先级、资源消耗与收益 |
| `research.xlsx` | 科研树节点、前置条件、解锁内容与耗时 |
| `vendors.xlsx` | 商人/黑市类型与解锁条件 |
| `shop_inventory.xlsx` | 商品列表、价格、刷新频率与货币类型 |
| `events.xlsx` | 全球事件触发条件、选项与系统影响 |
| `exposure_events.xlsx` | 暴露阈值触发的变异选项与代价 |

所有表格均符合 “两行表头” 约定：第 4 行为 Mark（类型定义），第 5 行为描述，数据从第 6 行起。

## 上下文枚举

`context.enums.json` 定义了武器类型、弹药、状态效果、区域/天气、NPC 职责、商人类型等枚举；`context.meta.json` 声明导出的枚举包名称供序列化器引用。

## Demo 目标

- 通过 `tables` 管线导出多格式数据，为后续 React/WebGL Demo 提供配置。
- 展示如何以 Excel 建模复杂生存循环、动态任务、剧情分支、战斗脚本与经济体系。
- 静态 Demo 覆盖“基地排程 → 城市行动 → 战术战斗 → 剧情互动/交易”的完整体验流程，帮助团队快速验证配置设计。

如需补充内容，可扩展更多 Excel（如 `consumables.xlsx`、`weather_events.xlsx` 等），并同步更新 `_rebuild_data.js` 与 README 表格。
