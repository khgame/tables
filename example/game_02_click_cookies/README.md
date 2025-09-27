# game_02_click_cookies

一个「Click Cookies」示例，演示如何用 @khgame/tables 管理增量点击游戏的数据配置，并自动生成可玩的网页版 Demo。

## 目录结构

- `producers.xlsx`：用于生成饼干的建筑（游标、奶奶、农场、工厂等），包含成本成长、基础 CPS、解锁条件、图标等信息。
- `upgrades.xlsx`：建筑升级，描述目标建筑、加成类型（乘法/加法）、数值、解锁条件与图标。
- `achievements.xlsx`：成就列表，定义达成条件（总饼干数、建筑数量等）和奖励图标。
- `artifacts.xlsx`：神器列表，描述声望消耗、加成类型（全局乘数、点击乘数、特定建筑增幅等）与图标。
- `global_config.xlsx`：全局参数（点击产量、tick 间隔、点击数字动画、声望系数等）。
- `context.meta.json` / `context.enums.json`：导出升级类型、成就类型的枚举，供序列化产物引用。
- `ui/index.html`：React + Tailwind 模板，消费 JSON 产物并呈现可交互的点击游戏界面。
- `_rebuild_data.js`：辅助脚本，编程方式生成示例 Excel。

## 快速体验

```bash
npm run build
node example/game_02_click_cookies/serialize.js
```

脚本会在 `example/game_02_click_cookies/out/` 生成：

- 各表的 JSON / TS / Interface 产物。
- `context.ts`：包含枚举的上下文聚合。
- `index.html`：可直接用浏览器打开的点击小游戏（数据全部来自上述 JSON）。

也可运行：

```bash
npx tables -i ./example/game_02_click_cookies -o ./example/game_02_click_cookies/out -f json
```

## ID 规划

- 建筑：`60CCSSSS`（C=子类、S=序号）。
- 升级：`70CCSSSS`。
- 成就：`80CCSSSS`。
- 全局配置：`90CCSSSS`。

## 玩法说明

- 点击页面中央的大饼干获取基础饼干（支持配置化的跳字动画）。
- 当总饼干达到 `unlockCookies` 阈值后解锁新的建筑与升级。
- 购买建筑将提升每秒产量（CPS），升级与神器可提供多种乘数/加法加成。
- 通过声望（Prestige）重置获取神器点数，并在神器面板消费以获得持久加成。
- 成就会在满足条件后自动解锁，并在日志中提示。

打开 `out/index.html` 即可立即体验。
