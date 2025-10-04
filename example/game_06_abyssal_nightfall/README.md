# game_06_abyssal_nightfall

一个围绕《Abyssal Nightfall》原型的靶场示例，验证 tables 在“类 Vampire Survivors + 黎明前20分钟”玩法下的数值与构筑配置流程。数据覆盖手动射击 + 自动法阵的混合战斗模式，重点描述弹道、装填、光效、敌人攻势与波次脚本。

## 目录结构

- `operators.xlsx`：角色基础档案与开局配置，包含生命、移速、理智上限、装填/暴击系数与美术资源。
- `weapons.xlsx`：主武器参数清单，记录攻击形态、伤害类型、射速、弹匣、散射、投射物速度、最大射程、弹道存活时间以及使用的特效贴图。
- `relics.xlsx`：自动或引导式遗物技能，描述冷却、持续、半径、理智消耗及对应的 VFX/SFX。
- `enemies.xlsx`：普通敌人数据，覆盖血量、伤害、移动速度、攻击方式、投射物速度/寿命、弱点/抗性以及掉落表。
- `bosses.xlsx`：关底敌人特化条目（护甲、激怒加成、招式提示图）。
- `waves.xlsx`：时间轴波次脚本（出现时间、持续、数量、刷怪半径、阵型与设计备注）。
- `skill_tree.xlsx`：技能树节点，记录分支、层级、父节点、效果、需求、图标——用于驱动角色成长。
- `synergy_cards.xlsx`：构筑协同卡，定义触发条件、效果加成与品质划分。
- `context.enums.json` / `context.meta.json`：定义武器分类、攻击形态、伤害类型、敌人家族、技能分支、协同品质等枚举供 TS 序列化引用。
- `_rebuild_data.js`：可重复生成上述 Excel 的脚本，确保团队能快速覆写示例数值。
- `serialize.js`：批量导出 JSON / JSONX / TS / TS Interface，并将数据注入 `ui/index.html` 与可玩原型。
- `ui/index.html` + `ui/app.js`：战前准备 + 构筑界面，联动 Canvas 原型并消费 tables 导出的 JSON。
- `ui/engine.js`：基于 Canvas 的实时战斗循环模块，由 `app.js` 调度并驱动升级/协同逻辑。

## 数值约定

- **弹道时间**：`weapons.xlsx` 的 `projectileLifetime` 和 `enemies.xlsx` 的 `projectileLifetime` 以秒为单位；结合 `projectileSpeed` 与 `maxRange` 便于核算可视化路径。
- **攻速/循环**：`fireRate` 表示单次射击的节奏（秒/发），`attackInterval` 描述敌人出招频率；`spread` 控制散射弧度。
- **战斗方式**：`attackStyle` 字段统一引用 `AttackStyle` 枚举（MANUAL / BURST / BEAM / AUTO / CHANNEL），用于驱动前端逻辑与动画。
- **特效资产**：`travelSprite`、`impactSprite`、`muzzleSprite`、`telegraphSprite` 等以资源路径标识，对接渲染管线或占位美术。
- **理智消耗**：遗物的 `sanityDrain`、敌人的 `sanityDamage` 均以点数记录，方便与 meta 系统联动。
- **技能树**：节点 ID 由 `sector + branch + node` 组成，`effects` 字段统一用竖线分隔属性；`requirements` 可混合等级、技能前置等条件。
- **协同卡**：`prerequisites` 与 `trigger` 统一使用 DSL（如 `weapon:chorus-ray|relic:maelstrom-core`、`sanity:<40`），便于解析。
- **经验与升级**：每个敌人提供 `xp` 字段；原型中击杀可积累经验、升级触发抽卡并应用技能/协同效果。
- **UI 风格**：复刻《黎明前 20 分钟》，顶部心形血量 + 右上弹仓条 + 底部经验槽与卡牌升级界面，便于快速对比数值调入后的视觉效果。

## 快速体验

```bash
node example/game_06_abyssal_nightfall/_rebuild_data.js   # 重新生成 Excel 表格
node example/game_06_abyssal_nightfall/serialize.js        # 导出 JSON/TS/JSONX 并生成 UI & 原型
open example/game_06_abyssal_nightfall/out/index.html      # 打开战前配置 + 实时战斗一体页面
# 或者
npm run ex:nightfall:dev                                   # 自动重建并通过 Vite dev server 预览
```

## 与其他示例的关系

此目录继承 [`docs-site/demos/abyssal-nightfall.md`](../../docs-site/demos/abyssal-nightfall.md) 的世界观与玩法设定，重点验证：

1. 手动射击 + 自动遗物共存时的弹道/冷却/理智数值如何在 Excel 中完整描述。
2. 敌人投射物（速度、寿命、特效）与波次脚本的组合是否足够表达高压节奏。
3. 技能树、协同卡是否覆盖构筑深度；数据格式是否便于逻辑层解析。
4. 导出的 TS 接口与枚举是否支撑前端/脚本编写（`AttackStyle`、`SkillBranch`、`SynergyTier` 等）。
5. Canvas 原型是否能够直接消费 tables 导出的 JSON，体现“数据→玩法”闭环。

运行 `serialize.js` 后可在 `out/` 目录看到：

- 稳定排序后的 JSON 和带协议头的 JSONX。
- TypeScript 数据 + Interface（包含 `context.ts` 枚举）。
- 已被数据填充的 `index.html` + `app.js`，集成战前准备与 Canvas 原型入口。
- 保留的 `engine.html` 仍可单独载入 `engine.js`，快速验证战斗循环。
