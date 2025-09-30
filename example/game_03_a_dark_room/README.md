# game_03_a_dark_room

一个以《A Dark Room》为灵感的全配置化示例。所有资源、建筑、行为、事件、职业都由 tables 表格驱动，演示如何把叙事型放置玩法拆解成数据与 UI 两层：

- `resources.xlsx`：定义炉火、木材、兽皮、口粮等资源的容量与衰减参数。
- `jobs.xlsx`：描述可雇佣的幸存者职业，`produces{}` / `consumes{}` 以对象列表示资源流入流出。
- `buildings.xlsx`：列出建造成本、解锁条件与附加效果（数组 `effects[]` 中存储 storage/unlock/event 等结构），跨表引用统一使用建筑的数值 TID（如 `30000002` 代表 trap）。
- `actions.xlsx`：即时操作（添柴、拾荒、熏肉、冶炼等），冷却、消耗、奖励均使用嵌套对象列定义，`unlock.building` / `unlock.event` 直接引用对应的 TID。
- `events.xlsx`：叙事事件与条件触发逻辑，`trigger{}` + `effects[]` 直接映射到游戏内处理器。
- `global_config.xlsx`：主循环 tick、离线结算上限、初始资源等全局参数。
- `context.enums.json` / `context.meta.json`：导出动作、事件、职业等枚举，供 TS 产物引用。

生成脚本会把这些 Excel 转为 JSON/TS，并输出 `ui/index.html` 中嵌入的占位标记。打开 `out/index.html` 即可体验完整的营地管理+离线挂机流程（炉火衰减、村民分工、事件触发、商队交易等都由数据驱动）。

## 快速体验

```bash
npm run build
node example/game_03_a_dark_room/serialize.js
open example/game_03_a_dark_room/out/index.html
```

首次运行前可执行 `_rebuild_data.js` 以重新生成 Excel：

```bash
node example/game_03_a_dark_room/_rebuild_data.js
```

## 玩法概览

- 炉火随时间衰减，需通过动作或耗材维持，否则事件会警示营地。
- 建造棚屋、陷阱与工坊后可逐步解锁新的职业与行为，所有效果均来自 `buildings.xlsx` 的结构化 `effects[]` 列。
- 职业的产出/消耗完全由 `jobs.xlsx` 控制，UI 只根据数据动态计算净产率与资源容量。
- 事件在 `events.xlsx` 设定触发条件与效果，例如温度达阈值吸引陌生人、肉类囤积引来狼群等。
- 离线收益通过保存的时间戳与当前净产率推算，最高可积累 6 小时的离线产量。

该示例展示了如何利用 tables 组合叙事、经济与挂机系统，从而在不改动脚本的前提下快速迭代玩法与剧情。
