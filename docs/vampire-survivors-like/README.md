# Abyssal Nightfall 快速指引

> *类 Vampire Survivors 实战示例* · `example/game_06_abyssal_nightfall`

## 目录结构速览

- `_rebuild_data.js` — 使用 `xlsx` 一键重建 8 张 Excel 表（操作者、武器、遗物、敌人、Boss、波次、技能树、协同卡）。
- `context.enums.json` / `context.meta.json` — 声明枚举常量（攻击形态、伤害类型等），供序列化阶段生成 TS 枚举。
- `serialize.js` — 根据 Excel 表导出 JSON/JSONX/TS/Interface，并填充前端模版。
- `ui/index.html` + `ui/app.js` — 战前准备与复盘界面，可选择操作者/武器/遗物并查看技能、协同、波次情报。
- `ui/engine.js` + `ui/engine.html` — Canvas 战斗原型，消费同一份 JSON 驱动实时战斗及升级流程。

## 快速体验

```bash
node example/game_06_abyssal_nightfall/_rebuild_data.js   # 重新生成 Excel
node example/game_06_abyssal_nightfall/serialize.js        # 导出数据并生成前端
open example/game_06_abyssal_nightfall/out/index.html      # 进入战前配置 + 战斗一体页面
```

- 想单独调试战斗循环，可直接打开 `out/engine.html`。
- `package.json` 提供了 `npm run ex:nightfall`，会构建 + 重建数据 + 启动静态服务器（端口 `8086`）。

## 页面流程

### 1. 准备与养成

`ui/index.html` 默认展示战备面板：

1. 选择操作者（自动联动默认武器、遗物，可手动覆盖）。
2. 浏览技能树/协同卡摘要、波次时间线以及装配概要。
3. 点击“启动行动”时，将当前预设传入 `engine.js`，并切换到战斗视图。

战斗结束后会显示战报（用时、击杀、等级、抽到的技能/协同），可以直接复盘或返回战备继续调参。

### 2. 实时战斗

Canvas 原型继承《黎明前20分钟》风格的 HUD：

- 左上角心形血量 + 理智、右上角弹仓与遗物冷却，底部经验槽/等级标签。
- 战斗中击杀掉落经验，升级会触发 3 选 1 的技能/协同抽卡。
- 支持手动射击与遗物冷却、敌人投射物、波次调度、遗物漩涡等效果。

`engine.js` 对外暴露 `startGame`、`configureLifecycle`、`tableToArray` 等 API，使得 `app.js` 能够：

- 读取序列化结果，将 `result` 映射转为数组用于渲染卡片；
- 在战斗结束时接收 run summary，生成可视化战报；
- 支持“再次尝试”在不刷新页面的情况下重启战斗。

## 数据设计要点

- **ID 体系**：表格仍使用 `sector + category + serial` 组合 ID。诸如 `weapon:chorus-ray` 的 DSL 字段可通过 `findBySlug` 解析。
- **枚举**：`AttackStyle`、`DamageType` 等枚举从 `context` 导出，对前端/TS 友好，同时保持 Excel 侧易读性。
- **技能树与协同**：效果字符串沿用 `字段:数值` 的 DSL，`app.js` 在战报中直接展示名称，方便复盘。
- **波次脚本**：含时间戳、数量、阵型字段，可在 UI 面板预览前三个波次的压力分布。

## 与设计文档的关系

- `design.md` 记录世界观、敌人类型、武器词条、协同组合等详细设定。
- 游戏示例通过 Excel 与序列化管线把设计落为可运行的 Demo，方便验证战斗节奏与数值闭环。

## 常见补充动作

- 调整 Excel 数据后重新运行 `_rebuild_data.js` + `serialize.js`。
- 如果增加新枚举或表，请同步更新 `context.enums.json` 与序列化列表。
- 需要嵌入到其他项目时，可复用 `out/context.ts`、各表的 `*.ts`/`*.json` 以及 `engine.js`；`app.js` 仅依赖标准 DOM API，便于迁移。

---

> 如需进一步扩展，可参考 `docs/vampire-survivors-like/design.md` 的剧情/敌兵曲线，逐步把本示例演化为完整的关卡或长线成长体验。
