# Click Cookies 示例

`example/game_02_click_cookies/` 展示了一个极简的点击增量游戏：

- 通过多张 Excel 表维护建筑（producers）、升级（upgrades）、成就（achievements）与全局配置（global_config）。
- 表格中的 ID 采用 8 位组合（例如建筑 `60xxxxxx`、升级 `70xxxxxx`），并包含图标 / 背景等资源链接。
- 运行 `serialize.js` 后，会同时生成 JSON / TS / Interface 产物，以及一个可直接打开的点击小游戏 (`out/index.html`)，界面基于 React + Tailwind 实现。

## 快速体验

```bash
npm run build
node example/game_02_click_cookies/serialize.js
```

或使用 CLI：

```bash
npx tables -i ./example/game_02_click_cookies -o ./example/game_02_click_cookies/out -f json
```

## 表概览

| 表格 | 说明 | 关键字段 |
| --- | --- | --- |
| producers.xlsx | 10+ 种建筑，包含成本成长、基础 CPS、解锁条件与图标 | `id`, `baseCost`, `costGrowth`, `baseCps`, `unlockCookies`, `icon` |
| upgrades.xlsx | 建筑升级、加成类型/数值、图标与解锁条件 | `id`, `target`, `upgradeType`, `value`, `unlockCookies` |
| achievements.xlsx | 成就类型、阈值与奖励图标 | `id`, `requirementType`, `requirementValue`, `icon` |
| artifacts.xlsx | 声望神器（全局乘数、点击乘数、特定建筑增益等） | `id`, `effectType`, `effectValue`, `costPoints` |
| global_config.xlsx | 全局参数（点击产量、tick 间隔、跳字动画、声望系数等） | `key`, `value` |

## 前端 Demo 功能

- 点击中央大饼干获取基础饼干（支持配置跳字动画）。
- 购买建筑提升 CPS；升级与神器提供多重加成，声望可重置以获取神器点数。
- 成就、建筑、升级解锁条件全部由表格配置控制，运行时在日志中播报。

这个示例适合展示 tables 如何驱动“配置即玩法”的增量游戏流程。
