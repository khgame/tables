# game_06_abyssal_nightfall

一个围绕《Abyssal Nightfall》原型的靶场示例，验证 tables 在“类 Vampire Survivors + 黎明前20分钟”玩法下的数值与构筑配置流程。数据覆盖手动射击 + 自动法阵的混合战斗模式，重点描述弹道、装填、光效、敌人攻势与波次脚本。

## 目录结构

- `operators.xlsx`：角色基础档案与开局配置，包含生命、移速、理智上限、装填/暴击系数与美术资源。
- `weapons.xlsx`：主武器参数清单，记录攻击形态、伤害类型、射速、弹匣、散射、投射物速度、最大射程、弹道存活时间以及使用的特效贴图。
- `relics.xlsx`：自动或引导式遗物技能，描述冷却、持续、半径、理智消耗及对应的 VFX/SFX。
- `enemies.xlsx`：普通敌人数据，覆盖血量、伤害、移动速度、攻击方式、投射物速度/寿命、弱点/抗性以及掉落表。
- `bosses.xlsx`：关底敌人特化条目（护甲、激怒加成、招式提示图）。
- `waves.xlsx`：时间轴波次脚本（出现时间、持续、数量、刷怪半径、阵型与设计备注）。
- `context.enums.json` / `context.meta.json`：定义武器分类、攻击形态、伤害类型、敌人家族等枚举供 TS 序列化引用。
- `_rebuild_data.js`：可重复生成上述 Excel 的脚本，确保团队能快速覆写示例数值。
- `serialize.js`：批量导出 JSON / JSONX / TS / TS Interface，并将数据注入 `ui/index.html`。
- `ui/index.html`：静态数据面板，展示核心战斗指标（弹道速度、存活时间、图形 ID 等）。

## 数值约定

- **弹道时间**：`weapons.xlsx` 的 `projectileLifetime` 和 `enemies.xlsx` 的 `projectileLifetime` 以秒为单位；结合 `projectileSpeed` 与 `maxRange` 便于核算可视化路径。
- **攻速/循环**：`fireRate` 表示单次射击的节奏（秒/发），`attackInterval` 描述敌人出招频率；`spread` 控制散射弧度。
- **战斗方式**：`attackStyle` 字段统一引用 `AttackStyle` 枚举（MANUAL / BURST / BEAM / AUTO / CHANNEL），用于驱动前端逻辑与动画。
- **特效资产**：`travelSprite`、`impactSprite`、`muzzleSprite`、`telegraphSprite` 等以资源路径标识，对接渲染管线或占位美术。
- **理智消耗**：遗物的 `sanityDrain`、敌人的 `sanityDamage` 均以点数记录，方便与 meta 系统联动。

## 快速体验

```bash
node example/game_06_abyssal_nightfall/_rebuild_data.js   # 重新生成 Excel 表格
node example/game_06_abyssal_nightfall/serialize.js        # 导出 JSON/TS/JSONX 并生成 UI
open example/game_06_abyssal_nightfall/out/index.html      # 浏览战斗数据可视化
```

## 与其他示例的关系

此目录继承 `docs/vampire-survivors-like/design.md` 的世界观与玩法设定，重点验证：

1. 手动射击 + 自动遗物共存时的弹道/冷却/理智数值如何在 Excel 中完整描述。
2. 敌人投射物（速度、寿命、特效）与波次脚本的组合是否足够表达高压节奏。
3. 导出的 TS 接口与枚举是否支撑前端/脚本编写（`AttackStyle`、`DamageType` 等）。

运行 `serialize.js` 后可在 `out/` 目录看到：

- 稳定排序后的 JSON 和带协议头的 JSONX。
- TypeScript 数据 + Interface（包含 `context.ts` 枚举）。
- 已被数据填充的 `index.html`，用于快速审阅战斗调参。
