<script setup>
import { withBase } from 'vitepress'

const demoUrl = withBase('/examples/abyssal-nightfall/index.html')
</script>

# Abyssal Nightfall 示范

> 位置：`example/game_06_abyssal_nightfall`

- **涵盖表格**：操作者、主武器、遗物、敌人、Boss、波次、技能树、协同卡
- **展示要点**：战前构筑界面、波次时间线、协同抽卡、Canvas 实时战斗循环
- **序列化产物**：`*.json`、`*.jsonx`、`*.ts`（类型 + Repo 定义）、`*Solution.ts`（数据 + 默认实例）+ 一体化 Web Demo (`out/index.html`)

<a class="vp-doc-button primary" :href="demoUrl" target="_blank" rel="noopener">
  立即体验 Demo
</a>

## 快速生成

```bash
npm run ex:nightfall
```

生成目录：`example/game_06_abyssal_nightfall/out`

## 核心结构

- **战前准备**：`ui/index.html` + `ui/app.js` 读取导表结果，提供操作者/武器/遗物选择、技能树与波次情报预览。
- **实时战斗**：`ui/engine.js` 消费同一份 JSON，驱动投射物、遗物、波次与升级协同，验证完整闭环。
- **上下文枚举**：`context.enums.json` / `context.meta.json` 导出 `AttackStyle`、`DamageType` 等枚举供 TS 使用。

## 推荐流程

1. 运行 `_rebuild_data.js` 重置 Excel 示例；
2. 执行 `serialize.js` 导出 JSON / TS，并注入战前界面；
3. 在浏览器中选择操作者与构筑，启动战斗验证弹道、冷却与波次脚本。

适合观测“Excel → tables → 构筑 UI → Canvas 战斗”的一站式串联。可在此基础上进一步替换数值或接入自定义前端。 
