<script setup>
import { withBase } from 'vitepress'

const demoUrl = withBase('/examples/arcane-depths/ui/index.html')
</script>

# Arcane Depths 示范

> 位置：`example/game_04_arcane_depths`

- **涵盖表格**：章节、地图模板、职业、英雄、技能/连携、敌人/AI、房间、事件、遗物、装备、设施、研究、经济、任务、成就等十余张表
- **展示要点**：多层地牢探索、基地经营面板、jsonx 协议输出、可视化战斗预览、MCP 调试脚本
- **序列化产物**：`*.json`、`*.jsonx`、`*.ts`（类型 + Repo 定义）、`*Solution.ts`（数据 + 默认实例）以及富交互 UI (`out/ui/index.html`)

<a class="vp-doc-button primary" :href="demoUrl" target="_blank" rel="noopener">
  立即体验 Demo
</a>

## 快速生成

```bash
npm run build && node example/game_04_arcane_depths/serialize.js
# 或
npm run ex:arcane
```

生成目录：`example/game_04_arcane_depths/out`

## Excel 配置亮点

- **章节与地牢**：`chapters.xlsx`、`map_templates.xlsx` 建模章节关卡、层数与地图轨迹
- **小队与技能树**：`classes.xlsx`、`heroes.xlsx`、`skills.xlsx`、`skill_links.xlsx` 描述角色成长、连携效果、技能冷却
- **敌人与 AI**：`enemies.xlsx`、`enemy_ai.xlsx` 定义敌人类型、行动脚本、触发逻辑
- **经济与设施**：`economy.xlsx`、`facilities.xlsx`、`research.xlsx`、`tasks.xlsx` 支撑基地建设与资源循环
- **遗物与事件**：`relics.xlsx`、`events.xlsx` 提供 Roguelike 随机奖励与剧情事件

## Demo 体验

`ui/index.html` 使用 React + Tailwind + Babel inline 渲染，直接消费 `out/` 目录下的序列化数据，提供：

- 仪表板：章节、残余节点、战力评级、奖励预览
- 队伍构建：职业互补、技能连携、遗物套装提示
- 地牢线路：随机房间组合、事件节点、危险等级
- 战斗排程：按敌军 AI、技能速度与增益效果模拟结果
- 事件日志：jsonx 协议驱动的动态故事片段

适合作为「大体量配置 + 可视化运维面板」的演示示例。
