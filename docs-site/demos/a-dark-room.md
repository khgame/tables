# A Dark Room 示范

> 位置：`example/game_03_a_dark_room`

- **涵盖表格**：`resources`、`jobs`、`buildings`、`actions`、`events`、`global_config`
- **展示要点**：多资源消耗、职业分配、事件脚本、序列化上下文与 React UI 模块化
- **序列化产物**：`*.json`、`*.ts`、`*Interface.ts`、web demo (`out/index.html`)

[立即体验 Demo](/examples/a-dark-room/index.html){.vp-doc-button .primary target="_blank" rel="noopener"}

## 快速生成

```bash
npm run ex:darkroom
```

生成目录：`example/game_03_a_dark_room/out`

## 核心结构

- **资源与产出**：通过 `resources.xlsx` 定义基础容量、衰减、展示顺序
- **职业系统**：`jobs.xlsx` 指定生产/消耗公式与解锁条件
- **建筑与事件**：使用嵌套 Object / Array、`Pair`、`Map` 来描述复杂行为
- **全局上下文**：`context.meta.json`、`context.enums.json` 提供序列化时的枚举与常量

## UI 模块

Demo 将表格产物注入 React 运行时：

- 模块化组件 (`ui/components.js`, `ui/gameLogic.js`)
- Tailwind 自定义主题 + Babel runtime
- 自动保存与事件脚本驱动的故事推进

适合用作大体量配置驱动玩法的实战范例。
