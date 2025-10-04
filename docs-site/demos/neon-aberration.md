<script setup>
import { withBase } from 'vitepress'

const demoUrl = withBase('/examples/neon-aberration/index.html')
</script>

# Neon Aberration 示范

> 位置：`example/game_05_neon_aberration`

- **涵盖表格**：`operators`、`weapons`、`weapon_mods`、`survival_stats`、`map_tiles`、`missions`、`events`、`craft_recipes` 等 30+ 张表
- **展示要点**：基地排程、城市探索、战术战斗、剧情事件与经济循环的一体化验证
- **序列化产物**：JSON / JSONX / TS / TS Interface + web demo (`out/index.html`)

<a class="vp-doc-button primary" :href="demoUrl" target="_blank" rel="noopener">
  立即体验 Demo
</a>

## 快速生成

```bash
npm run build
node example/game_05_neon_aberration/_rebuild_data.js
node example/game_05_neon_aberration/serialize.js
```

生成目录：`example/game_05_neon_aberration/out`

## 核心系统

- **基地管理**：`base_tasks.xlsx`、`facility_upgrades.xlsx`、`npc_roster.xlsx` 驱动排程、设施升级与驻守角色
- **城市行动**：`missions.xlsx`、`regions.xlsx`、`map_tiles.xlsx` 组合章节结构、环境修正与路线权重
- **战术战斗**：`operators.xlsx`、`weapons.xlsx`、`status_effects.xlsx`、`combat_formulas.xlsx` 统一数值、状态与公式
- **事件叙事**：`dialogues.xlsx`、`events.xlsx`、`exposure_events.xlsx` 构建多分支剧情与暴露风险系统
- **经济循环**：`resources.xlsx`、`loot_tables.xlsx`、`vendors.xlsx`、`shop_inventory.xlsx` 贯通采集、掉落与交易

## 配置亮点

- 两行表头 + Mark 描述保持 30+ 张 Excel 的 Schema 一致性，便于导出类型化数据
- `_rebuild_data.js` 支持一键重置示例数据，方便验证流程
- `serialize.js` 产出 `context.ts`、JSONX 与静态 Demo 资源，快速联通前端消费
- Demo 页面覆盖“基地排程 → 城市行动 → 战术战斗 → 剧情互动”闭环，直接观察导表效果

