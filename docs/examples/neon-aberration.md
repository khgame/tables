# Neon Aberration 示例

Neon Aberration 是一个赛博朋克 + 克苏鲁风格的生存 ARPG 配置范例，展示如何用 `@khgame/tables` 构建完整的「基地养成 → 城市任务 → 战斗推演 → 剧情及交易」闭环流程。它基于多张 Excel 表驱动，涵盖生存系统、弹药与状态、章节/天气/事件以及经济循环。

## 一键运行

```bash
npm run ex:neon
```

脚本会：
1. `npm run build`
2. 生成示例 Excel（`_rebuild_data.js`）
3. 运行 `serialize.js` 输出 JSON / JSONX / TS / Interface
4. 自动启动本地静态服务器（端口 8085）预览 `out/index.html`

预览页面提供基地排程、采集合成、章节任务、战斗推演、剧情对话及商店购买等交互。

## 表格要点

- 基础数据：`operators.xlsx`、`weapons.xlsx`、`weapon_mods.xlsx`
- 生存与资源：`survival_stats.xlsx`、`gather_nodes.xlsx`、`craft_recipes.xlsx`
- 战斗相关：`status_effects.xlsx`、`enemies.xlsx`、`enemy_phases.xlsx`、`combat_formulas.xlsx`
- 任务循环：`missions.xlsx`、`objectives.xlsx`、`map_tiles.xlsx`、`regions.xlsx`、`weather_cycle.xlsx`
- 剧情与经济：`chapters.xlsx`、`dialogues.xlsx`、`events.xlsx`、`vendors.xlsx`、`shop_inventory.xlsx`
- 基地运营：`facility_upgrades.xlsx`、`npc_roster.xlsx`、`base_tasks.xlsx`

详情可参阅 `example/game_05_neon_aberration/README.md` 及 Demo 设计说明 `DESIGN.md`。
